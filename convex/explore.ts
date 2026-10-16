import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v, type Infer } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { foodView, restaurantView } from "./home";
import { currentUser } from "./currentUser";
import schema from "./schema";

const filters = v.object({
  city: v.string(),
  categoryId: v.optional(v.id("categories")),
  search: v.optional(v.string()),
  cuisine: v.optional(v.string()),
  minRating: v.optional(v.number()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  maxDeliveryMinutes: v.optional(v.number()),
  onlyOpen: v.optional(v.boolean()),
});
type Filters = Infer<typeof filters>;

function validate(args: Filters, numItems: number) {
  if (
    !args.city.trim() ||
    args.city.length > 80 ||
    (args.search?.length ?? 0) > 100 ||
    (args.cuisine?.length ?? 0) > 80 ||
    !Number.isInteger(numItems) ||
    numItems < 1 ||
    numItems > 24
  )
    throw new ConvexError("INVALID_SEARCH");
  const bounds: [number | undefined, number][] = [
    [args.minRating, 5],
    [args.minPrice, 10000],
    [args.maxPrice, 10000],
    [args.maxDeliveryMinutes, 180],
  ];
  for (const [value, max] of bounds) {
    if (
      value !== undefined &&
      (!Number.isFinite(value) || value < 0 || value > max)
    )
      throw new ConvexError("INVALID_FILTER");
  }
  if ((args.minPrice ?? 0) > (args.maxPrice ?? 10000))
    throw new ConvexError("INVALID_PRICE_RANGE");
}

function matchesRestaurant(restaurant: Doc<"restaurants">, args: Filters) {
  return (
    restaurant.isActive &&
    restaurant.city === args.city &&
    (!args.cuisine || restaurant.cuisineTypes.includes(args.cuisine)) &&
    restaurant.ratingAverage >= (args.minRating ?? 0) &&
    restaurant.estimatedDeliveryMinutes <=
      (args.maxDeliveryMinutes ?? Infinity) &&
    (!args.onlyOpen || restaurant.isOpen)
  );
}

async function restaurantPriceMatches(
  ctx: QueryCtx,
  restaurant: Doc<"restaurants">,
  args: Filters,
) {
  if (args.minPrice === undefined && args.maxPrice === undefined) return true;
  return (
    (await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId_and_isAvailable_and_price", (q) => {
        const range = q
          .eq("restaurantId", restaurant._id)
          .eq("isAvailable", true)
          .gte("price", args.minPrice ?? 0);
        return args.maxPrice === undefined
          ? range
          : range.lte("price", args.maxPrice);
      })
      .first()) !== null
  );
}

export const getCategories = query({
  args: {},
  returns: v.array(schema.doc("categories")),
  handler: async (ctx) =>
    await ctx.db.query("categories").withIndex("by_sortOrder").take(20),
});

export const restaurants = query({
  args: {
    ...filters.fields,
    sort: v.union(
      v.literal("recommended"),
      v.literal("rating"),
      v.literal("fastest"),
      v.literal("delivery"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(restaurantView),
  handler: async (ctx, args) => {
    validate(args, args.paginationOpts.numItems);
    const categoryId = args.categoryId;
    const table = ctx.db.query("restaurants");
    const search = args.search?.trim();
    // Native search pagination preserves relevance; browse pagination follows the selected index.
    const source = search
      ? table.withSearchIndex("search_name", (q) => {
          const range = q
            .search("name", search)
            .eq("city", args.city)
            .eq("isActive", true);
          return categoryId ? range.eq("categoryId", categoryId) : range;
        })
      : args.sort === "rating"
        ? (categoryId
            ? table.withIndex(
                "by_city_and_isActive_and_categoryId_and_ratingAverage",
                (q) =>
                  q
                    .eq("city", args.city)
                    .eq("isActive", true)
                    .eq("categoryId", categoryId),
              )
            : table.withIndex("by_city_and_isActive_and_ratingAverage", (q) =>
                q.eq("city", args.city).eq("isActive", true),
              )
          ).order("desc")
        : args.sort === "fastest"
          ? (categoryId
              ? table.withIndex(
                  "by_city_and_isActive_and_categoryId_and_estimatedDeliveryMinutes",
                  (q) =>
                    q
                      .eq("city", args.city)
                      .eq("isActive", true)
                      .eq("categoryId", categoryId),
                )
              : table.withIndex(
                  "by_city_and_isActive_and_estimatedDeliveryMinutes",
                  (q) => q.eq("city", args.city).eq("isActive", true),
                )
            ).order("asc")
          : args.sort === "delivery"
            ? (categoryId
                ? table.withIndex(
                    "by_city_and_isActive_and_categoryId_and_deliveryFee",
                    (q) =>
                      q
                        .eq("city", args.city)
                        .eq("isActive", true)
                        .eq("categoryId", categoryId),
                  )
                : table.withIndex("by_city_and_isActive_and_deliveryFee", (q) =>
                    q.eq("city", args.city).eq("isActive", true),
                  )
              ).order("asc")
            : (categoryId
                ? table.withIndex(
                    "by_city_and_isActive_and_categoryId_and_isFeatured",
                    (q) =>
                      q
                        .eq("city", args.city)
                        .eq("isActive", true)
                        .eq("categoryId", categoryId),
                  )
                : table.withIndex("by_city_and_isActive_and_isFeatured", (q) =>
                    q.eq("city", args.city).eq("isActive", true),
                  )
              ).order("desc");
    const result = await source.paginate(args.paginationOpts);
    const user = await currentUser(ctx);
    const page: Infer<typeof restaurantView>[] = [];
    // Other predicates run only over this bounded page. Keep its cursor even when no rows match.
    for (const restaurant of result.page) {
      if (
        !matchesRestaurant(restaurant, args) ||
        !(await restaurantPriceMatches(ctx, restaurant, args))
      )
        continue;
      page.push({
        ...restaurant,
        imageUrl: restaurant.coverStorageId
          ? await ctx.storage.getUrl(restaurant.coverStorageId)
          : null,
        isFavorite: user
          ? (await ctx.db
              .query("favorites")
              .withIndex("by_userId_and_restaurantId", (q) =>
                q.eq("userId", user._id).eq("restaurantId", restaurant._id),
              )
              .unique()) !== null
          : false,
      });
    }
    return { ...result, page };
  },
});

export const dishes = query({
  args: {
    ...filters.fields,
    sort: v.union(
      v.literal("recommended"),
      v.literal("priceAsc"),
      v.literal("priceDesc"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(foodView),
  handler: async (ctx, args) => {
    validate(args, args.paginationOpts.numItems);
    const categoryId = args.categoryId;
    const table = ctx.db.query("menuItems");
    const search = args.search?.trim();
    const source = search
      ? table.withSearchIndex("search_name", (q) => {
          const range = q
            .search("name", search)
            .eq("city", args.city)
            .eq("isAvailable", true);
          return categoryId ? range.eq("categoryId", categoryId) : range;
        })
      : args.sort === "recommended"
        ? (categoryId
            ? table.withIndex(
                "by_city_and_isAvailable_and_categoryId_and_sortOrder",
                (q) =>
                  q
                    .eq("city", args.city)
                    .eq("isAvailable", true)
                    .eq("categoryId", categoryId),
              )
            : table.withIndex("by_city_and_isAvailable_and_sortOrder", (q) =>
                q.eq("city", args.city).eq("isAvailable", true),
              )
          ).order("asc")
        : (categoryId
            ? table.withIndex(
                "by_city_and_isAvailable_and_categoryId_and_price",
                (q) => {
                  const range = q
                    .eq("city", args.city)
                    .eq("isAvailable", true)
                    .eq("categoryId", categoryId)
                    .gte("price", args.minPrice ?? 0);
                  return args.maxPrice === undefined
                    ? range
                    : range.lte("price", args.maxPrice);
                },
              )
            : table.withIndex("by_city_and_isAvailable_and_price", (q) => {
                const range = q
                  .eq("city", args.city)
                  .eq("isAvailable", true)
                  .gte("price", args.minPrice ?? 0);
                return args.maxPrice === undefined
                  ? range
                  : range.lte("price", args.maxPrice);
              })
          ).order(args.sort === "priceDesc" ? "desc" : "asc");
    const result = await source.paginate(args.paginationOpts);
    const page: Infer<typeof foodView>[] = [];
    for (const dish of result.page) {
      if (
        dish.price < (args.minPrice ?? 0) ||
        dish.price > (args.maxPrice ?? Infinity)
      )
        continue;
      const restaurant = await ctx.db.get("restaurants", dish.restaurantId);
      if (!restaurant || !matchesRestaurant(restaurant, args)) continue;
      page.push({
        ...dish,
        restaurantName: restaurant.name,
        isDemo: restaurant.isDemo,
        imageUrl: dish.imageStorageId
          ? await ctx.storage.getUrl(dish.imageStorageId)
          : null,
      });
    }
    return { ...result, page };
  },
});

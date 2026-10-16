import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { currentUser } from "./currentUser";
import schema from "./schema";

export const restaurantView = schema
  .doc("restaurants")
  .extend({ imageUrl: v.union(v.string(), v.null()), isFavorite: v.boolean() });
export const foodView = schema.doc("menuItems").extend({
  imageUrl: v.union(v.string(), v.null()),
  restaurantName: v.string(),
  isDemo: v.boolean(),
});

export const getCatalog = query({
  args: {
    city: v.string(),
    categoryId: v.optional(v.id("categories")),
    search: v.optional(v.string()),
  },
  returns: v.object({
    categories: v.array(schema.doc("categories")),
    featured: v.array(restaurantView),
    popular: v.array(restaurantView),
    dishes: v.array(foodView),
  }),
  handler: async (ctx, args) => {
    if (args.city.length > 80 || (args.search?.length ?? 0) > 100)
      throw new ConvexError("INVALID_SEARCH");
    const user = await currentUser(ctx);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .take(20);
    const search = args.search?.trim() ?? "";
    let featured: Doc<"restaurants">[];
    let popular: Doc<"restaurants">[];
    if (search) {
      popular = await ctx.db
        .query("restaurants")
        .withSearchIndex("search_name", (q) => {
          const range = q
            .search("name", search)
            .eq("city", args.city)
            .eq("isActive", true);
          return args.categoryId
            ? range.eq("categoryId", args.categoryId)
            : range;
        })
        .take(12);
      featured = [];
    } else if (args.categoryId) {
      popular = await ctx.db
        .query("restaurants")
        .withIndex("by_city_and_isActive_and_categoryId", (q) =>
          q
            .eq("city", args.city)
            .eq("isActive", true)
            .eq("categoryId", args.categoryId!),
        )
        .take(12);
      featured = [];
    } else {
      [featured, popular] = await Promise.all([
        ctx.db
          .query("restaurants")
          .withIndex("by_city_and_isActive_and_isFeatured", (q) =>
            q.eq("city", args.city).eq("isActive", true).eq("isFeatured", true),
          )
          .take(6),
        ctx.db
          .query("restaurants")
          .withIndex("by_city_and_isActive_and_ratingAverage", (q) =>
            q.eq("city", args.city).eq("isActive", true),
          )
          .order("desc")
          .take(6),
      ]);
    }
    const decorateRestaurant = async (restaurant: Doc<"restaurants">) => ({
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
    const dishes = search
      ? await ctx.db
          .query("menuItems")
          .withSearchIndex("search_name", (q) => {
            const range = q
              .search("name", search)
              .eq("city", args.city)
              .eq("isAvailable", true);
            return args.categoryId
              ? range.eq("categoryId", args.categoryId)
              : range;
          })
          .take(12)
      : (
          await Promise.all(
            popular.map((restaurant) =>
              ctx.db
                .query("menuItems")
                .withIndex("by_restaurantId_and_isAvailable", (q) =>
                  q.eq("restaurantId", restaurant._id).eq("isAvailable", true),
                )
                .take(1),
            ),
          )
        ).flat();
    const decoratedDishes = await Promise.all(
      dishes.map(async (dish) => {
        const restaurant = await ctx.db.get("restaurants", dish.restaurantId);
        if (!restaurant?.isActive) return null;
        return {
          ...dish,
          restaurantName: restaurant.name,
          isDemo: restaurant.isDemo,
          imageUrl: dish.imageStorageId
            ? await ctx.storage.getUrl(dish.imageStorageId)
            : null,
        };
      }),
    );
    return {
      categories,
      featured: await Promise.all(featured.map(decorateRestaurant)),
      popular: await Promise.all(popular.map(decorateRestaurant)),
      dishes: decoratedDishes.filter((dish) => dish !== null),
    };
  },
});

export const getRestaurantMenu = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.array(foodView),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get("restaurants", args.restaurantId);
    if (!restaurant?.isActive) return [];
    const dishes = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId_and_isAvailable", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("isAvailable", true),
      )
      .take(50);
    return await Promise.all(
      dishes.map(async (dish) => ({
        ...dish,
        restaurantName: restaurant.name,
        isDemo: restaurant.isDemo,
        imageUrl: dish.imageStorageId
          ? await ctx.storage.getUrl(dish.imageStorageId)
          : null,
      })),
    );
  },
});

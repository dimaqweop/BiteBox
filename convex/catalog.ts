import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { foodView, restaurantView } from "./home";
import { currentUser } from "./currentUser";
import schema from "./schema";

async function restaurantDetails(
  ctx: QueryCtx,
  restaurant: Doc<"restaurants">,
) {
  const user = await currentUser(ctx);
  return {
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
  };
}

async function foodDetails(
  ctx: QueryCtx,
  food: Doc<"menuItems">,
  restaurant: Doc<"restaurants">,
) {
  return {
    ...food,
    restaurantName: restaurant.name,
    isDemo: restaurant.isDemo,
    imageUrl: food.imageStorageId
      ? await ctx.storage.getUrl(food.imageStorageId)
      : null,
  };
}

export const getRestaurant = query({
  // A URL reference is normalized here so malformed links produce a normal not-found state.
  args: { reference: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      restaurant: restaurantView,
      categories: v.array(schema.doc("categories")),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.reference.length > 128) return null;
    const id = ctx.db.normalizeId("restaurants", args.reference);
    const restaurant = id ? await ctx.db.get("restaurants", id) : null;
    if (!restaurant?.isActive) return null;
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .take(20);
    const menuCategories: typeof categories = [];
    for (const category of categories) {
      const item = await ctx.db
        .query("menuItems")
        .withIndex("by_restaurantId_and_categoryId_and_sortOrder", (q) =>
          q.eq("restaurantId", restaurant._id).eq("categoryId", category._id),
        )
        .first();
      if (item) menuCategories.push(category);
    }
    return {
      restaurant: await restaurantDetails(ctx, restaurant),
      categories: menuCategories,
    };
  },
});

export const menu = query({
  args: {
    restaurantId: v.id("restaurants"),
    categoryId: v.optional(v.id("categories")),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(foodView),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get("restaurants", args.restaurantId);
    const categoryId = args.categoryId;
    const source = categoryId
      ? ctx.db
          .query("menuItems")
          .withIndex("by_restaurantId_and_categoryId_and_sortOrder", (q) =>
            q
              .eq("restaurantId", args.restaurantId)
              .eq("categoryId", categoryId),
          )
      : ctx.db
          .query("menuItems")
          .withIndex("by_restaurantId_and_sortOrder", (q) =>
            q.eq("restaurantId", args.restaurantId),
          );
    const result = await source.paginate(args.paginationOpts);
    if (!restaurant?.isActive) return { ...result, page: [], isDone: true };
    return {
      ...result,
      page: await Promise.all(
        result.page.map((food) => foodDetails(ctx, food, restaurant)),
      ),
    };
  },
});

export const getFood = query({
  args: { reference: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      food: foodView,
      restaurant: restaurantView,
      related: v.array(foodView),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.reference.length > 128) return null;
    const id = ctx.db.normalizeId("menuItems", args.reference);
    const food = id ? await ctx.db.get("menuItems", id) : null;
    if (!food) return null;
    const restaurant = await ctx.db.get("restaurants", food.restaurantId);
    if (!restaurant?.isActive) return null;
    const candidates = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId_and_isAvailable", (q) =>
        q.eq("restaurantId", restaurant._id).eq("isAvailable", true),
      )
      .take(5);
    const related = [];
    for (const candidate of candidates) {
      if (candidate._id !== food._id && related.length < 4)
        related.push(await foodDetails(ctx, candidate, restaurant));
    }
    return {
      food: await foodDetails(ctx, food, restaurant),
      restaurant: await restaurantDetails(ctx, restaurant),
      related,
    };
  },
});

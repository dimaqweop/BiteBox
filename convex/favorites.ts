import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { restaurantView } from "./home";
import { currentUser } from "./currentUser";

export const getFavorites = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(restaurantView),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
    const page = [];
    for (const favorite of result.page) {
      const restaurant = await ctx.db.get("restaurants", favorite.restaurantId);
      if (!restaurant?.isActive) continue;
      page.push({
        ...restaurant,
        isFavorite: true,
        imageUrl: restaurant.coverStorageId
          ? await ctx.storage.getUrl(restaurant.coverStorageId)
          : null,
      });
    }
    return { ...result, page };
  },
});

export const toggleFavorite = mutation({
  args: { restaurantId: v.id("restaurants") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    const restaurant = await ctx.db.get("restaurants", args.restaurantId);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_restaurantId", (q) =>
        q.eq("userId", user._id).eq("restaurantId", args.restaurantId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete("favorites", existing._id);
      return false;
    }
    if (!restaurant?.isActive) throw new ConvexError("RESTAURANT_UNAVAILABLE");
    await ctx.db.insert("favorites", {
      userId: user._id,
      restaurantId: args.restaurantId,
    });
    return true;
  },
});

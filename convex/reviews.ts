import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentUser } from "./currentUser";
import schema from "./schema";

export const getMyReview = query({
  args: { orderId: v.id("orders") },
  returns: v.union(v.null(), schema.doc("reviews")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.userId !== user._id) return null;
    return await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();
  },
});

export const rateOrder = mutation({
  args: { orderId: v.id("orders"), rating: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5)
      throw new ConvexError("INVALID_RATING");
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.userId !== user._id)
      throw new ConvexError("ORDER_NOT_FOUND");
    if (order.status !== "delivered")
      throw new ConvexError("ORDER_NOT_DELIVERED");
    const restaurant = await ctx.db.get("restaurants", order.restaurantId);
    if (!restaurant) throw new ConvexError("RESTAURANT_NOT_FOUND");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .unique();
    const ratingCount = restaurant.ratingCount + (existing ? 0 : 1);
    const ratingSum =
      (restaurant.ratingSum ??
        restaurant.ratingAverage * restaurant.ratingCount) -
      (existing?.rating ?? 0) +
      args.rating;
    if (existing) {
      await ctx.db.patch("reviews", existing._id, {
        rating: args.rating,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("reviews", {
        userId: user._id,
        restaurantId: restaurant._id,
        orderId: order._id,
        rating: args.rating,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch("restaurants", restaurant._id, {
      ratingCount,
      ratingSum,
      ratingAverage: Math.round((ratingSum / ratingCount) * 100) / 100,
    });
    return null;
  },
});

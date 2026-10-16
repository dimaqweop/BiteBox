import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { currentUser } from "./lib/currentUser";

export const toggleFavorite = mutation({
  args: { restaurantId: v.id("restaurants") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    const restaurant = await ctx.db.get("restaurants", args.restaurantId);
    if (!restaurant?.isActive) throw new ConvexError("RESTAURANT_UNAVAILABLE");
    const existing = await ctx.db.query("favorites").withIndex("by_userId_and_restaurantId", (q) => q.eq("userId", user._id).eq("restaurantId", args.restaurantId)).unique();
    if (existing) { await ctx.db.delete("favorites", existing._id); return false; }
    await ctx.db.insert("favorites", { userId: user._id, restaurantId: args.restaurantId });
    return true;
  },
});

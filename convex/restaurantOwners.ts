import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Provisioning is only available to trusted deployment operators, never the app client.
export const assign = internalMutation({
  args: { restaurantSlug: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.restaurantSlug.trim()))
      .unique();
    if (!user) throw new ConvexError("USER_NOT_FOUND");
    if (!restaurant) throw new ConvexError("RESTAURANT_NOT_FOUND");
    await ctx.db.patch("restaurants", restaurant._id, { ownerId: user._id });
    if (user.role !== "admin")
      await ctx.db.patch("users", user._id, { role: "restaurant_owner" });
    return null;
  },
});

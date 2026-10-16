import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import schema from "./schema";
import { currentUser } from "./currentUser";

export const getMyNotifications = query({
  args: {},
  returns: v.array(schema.doc("notifications")),
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(30);
  },
});
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    const notification = await ctx.db.get("notifications", args.notificationId);
    if (!user || notification?.userId !== user._id)
      throw new ConvexError("UNAUTHENTICATED");
    await ctx.db.patch("notifications", args.notificationId, { isRead: true });
    return null;
  },
});

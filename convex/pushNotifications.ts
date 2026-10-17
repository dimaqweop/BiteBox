import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { getAuthSessionId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentUser } from "./currentUser";

export const pushNotifications = new PushNotifications<Id<"pushDevices">>(
  components.pushNotifications,
);
const MAX_DEVICES = 10;

export async function removeDevice(
  ctx: MutationCtx,
  device: Doc<"pushDevices">,
) {
  // Purge queued messages before removing/reassigning the token to another account.
  await pushNotifications.deleteNotificationsForUser(ctx, {
    userId: device._id,
  });
  await pushNotifications.removeToken(ctx, { userId: device._id });
  await ctx.db.delete("pushDevices", device._id);
  const user = await ctx.db.get("users", device.userId);
  if (user?.pushToken === device.token)
    await ctx.db.patch("users", user._id, { pushToken: undefined });
}

export const registerDevice = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    const sessionId = await getAuthSessionId(ctx);
    if (!user || !sessionId) throw new ConvexError("UNAUTHENTICATED");
    if (!/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]{10,200}\]$/.test(args.token))
      throw new ConvexError("INVALID_PUSH_TOKEN");

    let existing = await ctx.db
      .query("pushDevices")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (existing && existing.userId !== user._id) {
      await removeDevice(ctx, existing);
      existing = null;
    }

    const sessionDevices = await ctx.db
      .query("pushDevices")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .take(MAX_DEVICES + 1);
    for (const device of sessionDevices) {
      if (device._id !== existing?._id) await removeDevice(ctx, device);
    }

    const devices = await ctx.db
      .query("pushDevices")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(MAX_DEVICES + 1);
    let activeCount = devices.length;
    for (const device of devices) {
      if (device._id === existing?._id) continue;
      const session = await ctx.db.get("authSessions", device.sessionId);
      if (!session || session.expirationTime <= Date.now()) {
        await removeDevice(ctx, device);
        activeCount--;
      }
    }
    if (!existing && activeCount >= MAX_DEVICES)
      throw new ConvexError("TOO_MANY_PUSH_DEVICES");

    const deviceId =
      existing?._id ??
      (await ctx.db.insert("pushDevices", {
        userId: user._id,
        sessionId,
        token: args.token,
        updatedAt: Date.now(),
      }));
    if (existing)
      await ctx.db.patch("pushDevices", existing._id, {
        sessionId,
        updatedAt: Date.now(),
      });
    await pushNotifications.recordToken(ctx, {
      userId: deviceId,
      pushToken: args.token,
    });
    await pushNotifications.unpauseNotificationsForUser(ctx, {
      userId: deviceId,
    });
    await ctx.db.patch("users", user._id, { pushToken: args.token });
    return null;
  },
});

// Stop future sends to tokens rejected by Expo. Reopening the app can register again.
export const checkDelivery = internalMutation({
  args: {
    deviceId: v.id("pushDevices"),
    pushId: v.string(),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const device = await ctx.db.get("pushDevices", args.deviceId);
    if (!device) return null;
    const notification = await pushNotifications.getNotification(ctx, {
      id: args.pushId,
    });
    if (!notification) return null;
    if (
      notification.state === "failed" ||
      notification.state === "unable_to_deliver"
    ) {
      await pushNotifications.pauseNotificationsForUser(ctx, {
        userId: device._id,
      });
    } else if (
      args.attempt < 6 &&
      notification.state !== "delivered" &&
      notification.state !== "maybe_delivered"
    ) {
      await ctx.scheduler.runAfter(
        60_000 * 2 ** args.attempt,
        internal.pushNotifications.checkDelivery,
        {
          ...args,
          attempt: args.attempt + 1,
        },
      );
    }
    return null;
  },
});

export const unregisterDevice = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    const device = await ctx.db
      .query("pushDevices")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (device?.userId === user._id) await removeDevice(ctx, device);
    return null;
  },
});

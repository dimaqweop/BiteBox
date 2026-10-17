import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { pushNotifications, removeDevice } from "./pushNotifications";
import { internal } from "./_generated/api";

async function notify(
  ctx: MutationCtx,
  order: Doc<"orders">,
  userId: Id<"users">,
  audience: "customer" | "restaurant",
  title: string,
  message: string,
) {
  const notificationId = await ctx.db.insert("notifications", {
    userId,
    title,
    message,
    type: "order",
    isRead: false,
    orderId: order._id,
    audience,
    createdAt: Date.now(),
  });
  const devices = await ctx.db
    .query("pushDevices")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(10);
  for (const device of devices) {
    const session = await ctx.db.get("authSessions", device.sessionId);
    if (
      !session ||
      session.userId !== userId ||
      session.expirationTime <= Date.now()
    ) {
      await removeDevice(ctx, device);
      continue;
    }
    const pushId = await pushNotifications.sendPushNotification(ctx, {
      userId: device._id,
      allowUnregisteredTokens: true,
      notification: {
        title,
        body: message,
        sound: "default",
        channelId: "orders",
        priority: "high",
        ttl: 3600,
        data: {
          type: "order",
          orderId: order._id,
          audience,
          userId,
          notificationId,
        },
      },
    });
    if (pushId)
      await ctx.scheduler.runAfter(
        60_000,
        internal.pushNotifications.checkDelivery,
        {
          deviceId: device._id,
          pushId,
          attempt: 0,
        },
      );
  }
}

export async function notifyNewOrder(ctx: MutationCtx, order: Doc<"orders">) {
  const restaurant = await ctx.db.get("restaurants", order.restaurantId);
  if (!restaurant?.ownerId) return;
  const owner = await ctx.db.get("users", restaurant.ownerId);
  if (!owner || (owner.role !== "restaurant_owner" && owner.role !== "admin"))
    return;
  await notify(
    ctx,
    order,
    owner._id,
    "restaurant",
    "Нове замовлення 🛍️",
    `${order.restaurantName}: замовлення №${order._id.slice(-6).toUpperCase()} очікує підтвердження.`,
  );
}

export async function notifyOrderStatus(
  ctx: MutationCtx,
  order: Doc<"orders">,
) {
  const messages: Partial<
    Record<Doc<"orders">["status"], { title: string; message: string }>
  > = {
    confirmed: {
      title: "Замовлення підтверджено ✅",
      message: `${order.restaurantName} підтвердив твоє замовлення.`,
    },
    preparing: {
      title: "Уже готуємо 🍳",
      message: `${order.restaurantName} готує твоє замовлення.`,
    },
    delivering: {
      title: "Кур’єр у дорозі 🛵",
      message: "Твоє замовлення вже прямує до тебе.",
    },
    delivered: {
      title: "Смачного! ⭐",
      message: "Замовлення доставлено. Оціни свій досвід із закладом.",
    },
    cancelled: {
      title: "Замовлення скасовано",
      message: `${order.restaurantName} скасував твоє замовлення.`,
    },
  };
  const content = messages[order.status];
  if (content)
    await notify(
      ctx,
      order,
      order.userId,
      "customer",
      content.title,
      content.message,
    );
}

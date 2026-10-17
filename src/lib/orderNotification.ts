export type OrderNotification = {
  type: "order";
  orderId: string;
  audience: "customer" | "restaurant";
  userId: string;
  notificationId?: string;
};

export function parseOrderNotification(
  data: unknown,
): OrderNotification | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (
    value.type !== "order" ||
    typeof value.orderId !== "string" ||
    !/^[a-zA-Z0-9]{16,128}$/.test(value.orderId) ||
    typeof value.userId !== "string" ||
    !/^[a-zA-Z0-9]{16,128}$/.test(value.userId) ||
    (value.audience !== "customer" && value.audience !== "restaurant")
  )
    return null;
  return {
    type: "order",
    orderId: value.orderId,
    audience: value.audience,
    userId: value.userId,
    ...(typeof value.notificationId === "string" &&
    /^[a-zA-Z0-9]{16,128}$/.test(value.notificationId)
      ? { notificationId: value.notificationId }
      : {}),
  };
}

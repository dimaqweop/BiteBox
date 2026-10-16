import type { Doc } from "@/convex/_generated/dataModel";

export const orderStatusLabels: Record<Doc<"orders">["status"], string> = {
  pending: "Очікує підтвердження",
  confirmed: "Підтверджено",
  preparing: "Готується",
  ready_for_pickup: "Готове до видачі",
  delivering: "Кур’єр у дорозі",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

type OrderStatus = Doc<"orders">["status"];

export const restaurantNextStep: Partial<
  Record<OrderStatus, { status: OrderStatus; title: string }>
> = {
  pending: { status: "confirmed", title: "Підтвердити замовлення" },
  confirmed: { status: "preparing", title: "Почати приготування" },
  preparing: { status: "ready_for_pickup", title: "Готове до видачі" },
  ready_for_pickup: { status: "delivering", title: "Передано кур’єру" },
  delivering: { status: "delivered", title: "Підтвердити доставку" },
};

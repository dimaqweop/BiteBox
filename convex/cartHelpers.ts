import { ConvexError, v, type Infer } from "convex/values";
import type { QueryCtx } from "./_generated/server";

export const cartLine = v.object({
  key: v.string(),
  foodId: v.string(),
  quantity: v.number(),
});
export const cartQuote = v.object({
  restaurant: v.union(
    v.null(),
    v.object({
      id: v.id("restaurants"),
      name: v.string(),
      city: v.string(),
      isOpen: v.boolean(),
      deliveryFee: v.number(),
      estimatedDeliveryMinutes: v.number(),
    }),
  ),
  lines: v.array(
    v.object({
      key: v.string(),
      foodId: v.string(),
      quantity: v.number(),
      name: v.union(v.string(), v.null()),
      imageUrl: v.union(v.string(), v.null()),
      unitPrice: v.union(v.number(), v.null()),
      lineTotal: v.number(),
      available: v.boolean(),
      reason: v.union(
        v.null(),
        v.literal("missing"),
        v.literal("unavailable"),
        v.literal("wrongRestaurant"),
      ),
    }),
  ),
  subtotal: v.number(),
  deliveryFee: v.number(),
  total: v.number(),
  canCheckout: v.boolean(),
});

export type QuoteLine = Infer<typeof cartLine>;
export type CartQuote = Infer<typeof cartQuote>;
export const moneyToCents = (value: number) => Math.round(value * 100);

export async function buildCartQuote(
  ctx: QueryCtx,
  restaurantReference: string,
  items: QuoteLine[],
): Promise<CartQuote> {
  if (
    items.length > 50 ||
    new Set(items.map((item) => item.key)).size !== items.length
  )
    throw new ConvexError("INVALID_CART");
  for (const item of items) {
    if (
      item.key.length > 400 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      throw new ConvexError("INVALID_QUANTITY");
  }

  const restaurantId = ctx.db.normalizeId("restaurants", restaurantReference);
  const venue = restaurantId
    ? await ctx.db.get("restaurants", restaurantId)
    : null;
  const restaurant = venue?.isActive
    ? {
        id: venue._id,
        name: venue.name,
        city: venue.city,
        isOpen: venue.isOpen,
        deliveryFee: venue.deliveryFee,
        estimatedDeliveryMinutes: venue.estimatedDeliveryMinutes,
      }
    : null;
  const lines: CartQuote["lines"] = [];
  let subtotalCents = 0;

  for (const item of items) {
    const foodId = ctx.db.normalizeId("menuItems", item.foodId);
    const food = foodId ? await ctx.db.get("menuItems", foodId) : null;
    const belongsToVenue = !!food && food.restaurantId === restaurantId;
    const available = belongsToVenue && food.isAvailable;
    const unitPrice = belongsToVenue ? food.price : null;
    const lineTotal =
      unitPrice === null ? 0 : (moneyToCents(unitPrice) * item.quantity) / 100;

    if (available) subtotalCents += moneyToCents(lineTotal);
    lines.push({
      key: item.key,
      foodId: item.foodId,
      quantity: item.quantity,
      name: belongsToVenue ? food.name : null,
      imageUrl:
        belongsToVenue && food.imageStorageId
          ? await ctx.storage.getUrl(food.imageStorageId)
          : null,
      unitPrice,
      lineTotal,
      available,
      reason: !food
        ? "missing"
        : !belongsToVenue
          ? "wrongRestaurant"
          : !available
            ? "unavailable"
            : null,
    });
  }

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  return {
    restaurant,
    lines,
    subtotal: subtotalCents / 100,
    deliveryFee,
    total: (subtotalCents + moneyToCents(deliveryFee)) / 100,
    canCheckout:
      !!restaurant?.isOpen &&
      lines.length > 0 &&
      lines.every((line) => line.available),
  };
}

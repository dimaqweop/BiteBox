import { ConvexError, v } from "convex/values";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { buildCartQuote, cartLine, moneyToCents } from "./cartHelpers";
import { currentUser } from "./currentUser";
import { canManageRestaurant } from "./restaurantAccess";
import {
  normalizePhone,
  validateName,
  validatePhone,
} from "../src/lib/validation";
import schema from "./schema";

export const place = mutation({
  args: {
    restaurantId: v.string(),
    items: v.array(cartLine.extend({ instructions: v.string() })),
    contactName: v.string(),
    phone: v.string(),
    city: v.string(),
    address: v.string(),
    comment: v.string(),
    expectedTotal: v.number(),
    idempotencyKey: v.string(),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) throw new ConvexError("UNAUTHENTICATED");
    if (args.items.length < 1 || args.items.length > 50)
      throw new ConvexError("INVALID_CART");

    const contactName = args.contactName.trim();
    const phone = normalizePhone(args.phone);
    const city = args.city.trim();
    const address = args.address.trim();
    const comment = args.comment.trim();
    const items = args.items.map((item) => ({
      ...item,
      instructions: item.instructions.trim(),
    }));

    if (
      validateName(contactName) ||
      !phone ||
      validatePhone(phone) ||
      city.length < 2 ||
      city.length > 80 ||
      address.length < 8 ||
      address.length > 250 ||
      comment.length > 500 ||
      items.some((item) => item.instructions.length > 300) ||
      args.idempotencyKey.length < 16 ||
      args.idempotencyKey.length > 100 ||
      !Number.isFinite(args.expectedTotal)
    )
      throw new ConvexError("INVALID_ORDER");

    const existing = await ctx.db
      .query("orders")
      .withIndex("by_userId_and_idempotencyKey", (q) =>
        q.eq("userId", user._id).eq("idempotencyKey", args.idempotencyKey),
      )
      .unique();

    if (existing) {
      const sameItems =
        JSON.stringify(
          existing.items.map(({ key, foodId, quantity, instructions }) => ({
            key,
            foodId,
            quantity,
            instructions,
          })),
        ) ===
        JSON.stringify(
          items.map(({ key, foodId, quantity, instructions }) => ({
            key,
            foodId,
            quantity,
            instructions,
          })),
        );
      if (
        !sameItems ||
        existing.restaurantId !== args.restaurantId ||
        existing.contactName !== contactName ||
        existing.phone !== phone ||
        existing.city !== city ||
        existing.address !== address ||
        existing.comment !== comment
      )
        throw new ConvexError("IDEMPOTENCY_CONFLICT");
      return existing._id;
    }

    const quote = await buildCartQuote(ctx, args.restaurantId, items);
    if (!quote.canCheckout || !quote.restaurant)
      throw new ConvexError("CART_UNAVAILABLE");
    if (quote.restaurant.city !== city)
      throw new ConvexError("DELIVERY_CITY_MISMATCH");
    if (moneyToCents(quote.total) !== moneyToCents(args.expectedTotal))
      throw new ConvexError("PRICE_CHANGED");

    return await ctx.db.insert("orders", {
      userId: user._id,
      restaurantId: quote.restaurant.id,
      restaurantName: quote.restaurant.name,
      items: quote.lines.map((line, index) => ({
        key: line.key,
        foodId: line.foodId as Id<"menuItems">,
        name: line.name!,
        unitPrice: line.unitPrice!,
        quantity: line.quantity,
        instructions: items[index].instructions,
      })),
      contactName,
      phone,
      city,
      address,
      comment,
      subtotal: quote.subtotal,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      paymentMethod: "cash",
      status: "pending",
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    });
  },
});

export const getMyOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("orders")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return { page: [], isDone: true, continueCursor: "" };
    return await ctx.db
      .query("orders")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getByCheckoutKey = query({
  args: { key: v.string() },
  returns: v.union(v.null(), v.id("orders")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const order = await ctx.db
      .query("orders")
      .withIndex("by_userId_and_idempotencyKey", (q) =>
        q.eq("userId", user._id).eq("idempotencyKey", args.key),
      )
      .unique();
    return order?._id ?? null;
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: schema.doc("orders").fields.status,
    expectedStatus: v.optional(schema.doc("orders").fields.status),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin"))
      throw new ConvexError("FORBIDDEN");
    const order = await ctx.db.get("orders", args.orderId);
    if (!order) throw new ConvexError("ORDER_NOT_FOUND");
    if (
      user.role !== "admin" &&
      !(await canManageRestaurant(ctx, user, order.restaurantId))
    )
      throw new ConvexError("FORBIDDEN");
    if (
      args.expectedStatus !== undefined &&
      args.expectedStatus !== order.status
    )
      throw new ConvexError("STATUS_CHANGED");
    const transitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready_for_pickup", "cancelled"],
      ready_for_pickup: ["delivering", "cancelled"],
      delivering: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    if (!transitions[order.status].includes(args.status))
      throw new ConvexError("INVALID_STATUS_TRANSITION");
    await ctx.db.patch("orders", order._id, { status: args.status });
    return null;
  },
});

export const getOwnOrder = query({
  args: { reference: v.string() },
  returns: v.union(v.null(), schema.doc("orders")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const id = ctx.db.normalizeId("orders", args.reference);
    const order = id ? await ctx.db.get("orders", id) : null;
    return order?.userId === user._id ? order : null;
  },
});

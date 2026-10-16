import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { currentUser } from "./currentUser";
import { canManageRestaurant } from "./restaurantAccess";
import schema from "./schema";

export const getRestaurants = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      _id: v.id("restaurants"),
      name: v.string(),
      city: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin"))
      return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db
      .query("restaurants")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(({ _id, name, city }) => ({ _id, name, city })),
    };
  },
});

export const getOrders = query({
  args: {
    restaurantId: v.id("restaurants"),
    status: v.optional(schema.doc("orders").fields.status),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(schema.doc("orders")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!(await canManageRestaurant(ctx, user, args.restaurantId)))
      return { page: [], isDone: true, continueCursor: "" };
    const orders =
      args.status === undefined
        ? ctx.db
            .query("orders")
            .withIndex("by_restaurantId_and_createdAt", (q) =>
              q.eq("restaurantId", args.restaurantId),
            )
        : ctx.db
            .query("orders")
            .withIndex("by_restaurantId_and_status_and_createdAt", (q) =>
              q
                .eq("restaurantId", args.restaurantId)
                .eq("status", args.status!),
            );
    return await orders.order("desc").paginate(args.paginationOpts);
  },
});

export const getOrder = query({
  args: { reference: v.string() },
  returns: v.union(v.null(), schema.doc("orders")),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin"))
      return null;
    const id = ctx.db.normalizeId("orders", args.reference);
    const order = id ? await ctx.db.get("orders", id) : null;
    if (!order || !(await canManageRestaurant(ctx, user, order.restaurantId)))
      return null;
    return order;
  },
});

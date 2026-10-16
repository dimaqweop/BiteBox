import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function canManageRestaurant(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users"> | null,
  restaurantId: Doc<"restaurants">["_id"],
) {
  if (!user || (user.role !== "restaurant_owner" && user.role !== "admin"))
    return false;
  const restaurant = await ctx.db.get("restaurants", restaurantId);
  return restaurant?.ownerId === user._id;
}

import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const sessionId = await getAuthSessionId(ctx);
  if (userId === null || sessionId === null) return null;
  const session = await ctx.db.get("authSessions", sessionId);
  if (session === null || session.userId !== userId) return null;
  return await ctx.db.get("users", userId);
}

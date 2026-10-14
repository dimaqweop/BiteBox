import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import schema from "./schema";
import { normalizePhone, validateName, validatePhone } from "../src/lib/validation";

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const sessionId = await getAuthSessionId(ctx);
  if (userId === null || sessionId === null) return null;
  const session = await ctx.db.get("authSessions", sessionId);
  // A signed-out session must stop granting access even before its JWT expires.
  if (session === null || session.userId !== userId) return null;
  return await ctx.db.get("users", userId);
}

export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), schema.doc("users")),
  handler: async (ctx) => {
    return await currentUser(ctx);
  },
});

export const updateProfile = mutation({
  args: { name: v.string(), phone: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (user === null) {
      throw new ConvexError("UNAUTHENTICATED");
    }
    if (validateName(args.name) || validatePhone(args.phone)) {
      throw new ConvexError("INVALID_PROFILE");
    }
    await ctx.db.patch("users", user._id, {
      name: args.name.trim(),
      phone: normalizePhone(args.phone),
    });
    return null;
  },
});

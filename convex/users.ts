import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentUser } from "./lib/currentUser";
import schema from "./schema";
import { normalizePhone, validateName, validatePhone } from "../src/lib/validation";

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

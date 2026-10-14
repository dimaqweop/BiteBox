import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    avatarStorageId: v.optional(v.id("_storage")),
    pushToken: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("customer"),
      v.literal("restaurant_owner"),
      v.literal("admin"),
    )),
    createdAt: v.optional(v.number()),
  })
    // Convex Auth requires these index names.
    .index("email", ["email"])
    .index("phone", ["phone"]),
});

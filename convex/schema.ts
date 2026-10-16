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
  categories: defineTable({
    name: v.string(), slug: v.string(), sortOrder: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
  }).index("by_slug", ["slug"]).index("by_sortOrder", ["sortOrder"]),
  restaurants: defineTable({
    name: v.string(), slug: v.string(), description: v.string(),
    logoStorageId: v.optional(v.id("_storage")), coverStorageId: v.optional(v.id("_storage")),
    categoryId: v.id("categories"), cuisineTypes: v.array(v.string()),
    city: v.string(), address: v.string(), latitude: v.number(), longitude: v.number(),
    ratingAverage: v.number(), ratingCount: v.number(), estimatedDeliveryMinutes: v.number(),
    deliveryFee: v.number(), isActive: v.boolean(), isOpen: v.boolean(), isFeatured: v.boolean(), isDemo: v.boolean(),
  }).index("by_slug", ["slug"])
    .index("by_city_and_isActive_and_ratingAverage", ["city", "isActive", "ratingAverage"])
    .index("by_city_and_isActive_and_isFeatured", ["city", "isActive", "isFeatured"])
    .index("by_city_and_isActive_and_categoryId", ["city", "isActive", "categoryId"])
    .searchIndex("search_name", { searchField: "name", filterFields: ["city", "isActive", "categoryId"] }),
  menuItems: defineTable({
    restaurantId: v.id("restaurants"), categoryId: v.id("categories"), city: v.string(),
    name: v.string(), description: v.string(), price: v.number(),
    imageStorageId: v.optional(v.id("_storage")), ingredients: v.array(v.string()),
    isAvailable: v.boolean(), sortOrder: v.number(),
  }).index("by_restaurantId_and_isAvailable", ["restaurantId", "isAvailable"])
    .searchIndex("search_name", { searchField: "name", filterFields: ["city", "isAvailable", "categoryId"] }),
  favorites: defineTable({ userId: v.id("users"), restaurantId: v.id("restaurants") })
    .index("by_userId_and_restaurantId", ["userId", "restaurantId"]),
  notifications: defineTable({
    userId: v.id("users"), title: v.string(), message: v.string(), type: v.string(), isRead: v.boolean(), createdAt: v.number(),
  }).index("by_userId_and_createdAt", ["userId", "createdAt"]),
});

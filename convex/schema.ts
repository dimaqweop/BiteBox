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
    role: v.optional(
      v.union(
        v.literal("customer"),
        v.literal("restaurant_owner"),
        v.literal("admin"),
      ),
    ),
    createdAt: v.optional(v.number()),
  })
    // Convex Auth requires these index names.
    .index("email", ["email"])
    .index("phone", ["phone"]),
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    sortOrder: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),
  restaurants: defineTable({
    ownerId: v.optional(v.id("users")),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    categoryId: v.id("categories"),
    cuisineTypes: v.array(v.string()),
    city: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    ratingAverage: v.number(),
    ratingCount: v.number(),
    ratingSum: v.optional(v.number()),
    estimatedDeliveryMinutes: v.number(),
    deliveryFee: v.number(),
    isActive: v.boolean(),
    isOpen: v.boolean(),
    isFeatured: v.boolean(),
    isDemo: v.boolean(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_city_and_isActive_and_ratingAverage", [
      "city",
      "isActive",
      "ratingAverage",
    ])
    .index("by_city_and_isActive_and_isFeatured", [
      "city",
      "isActive",
      "isFeatured",
    ])
    .index("by_city_and_isActive_and_categoryId", [
      "city",
      "isActive",
      "categoryId",
    ])
    .index("by_city_and_isActive_and_categoryId_and_isFeatured", [
      "city",
      "isActive",
      "categoryId",
      "isFeatured",
    ])
    .index("by_city_and_isActive_and_categoryId_and_ratingAverage", [
      "city",
      "isActive",
      "categoryId",
      "ratingAverage",
    ])
    .index("by_city_and_isActive_and_estimatedDeliveryMinutes", [
      "city",
      "isActive",
      "estimatedDeliveryMinutes",
    ])
    .index("by_city_and_isActive_and_categoryId_and_estimatedDeliveryMinutes", [
      "city",
      "isActive",
      "categoryId",
      "estimatedDeliveryMinutes",
    ])
    .index("by_city_and_isActive_and_deliveryFee", [
      "city",
      "isActive",
      "deliveryFee",
    ])
    .index("by_city_and_isActive_and_categoryId_and_deliveryFee", [
      "city",
      "isActive",
      "categoryId",
      "deliveryFee",
    ])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["city", "isActive", "categoryId"],
    }),
  menuItems: defineTable({
    restaurantId: v.id("restaurants"),
    categoryId: v.id("categories"),
    city: v.string(),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    ingredients: v.array(v.string()),
    isAvailable: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_restaurantId_and_isAvailable", ["restaurantId", "isAvailable"])
    .index("by_restaurantId_and_sortOrder", ["restaurantId", "sortOrder"])
    .index("by_restaurantId_and_name", ["restaurantId", "name"])
    .index("by_restaurantId_and_categoryId_and_sortOrder", [
      "restaurantId",
      "categoryId",
      "sortOrder",
    ])
    .index("by_restaurantId_and_isAvailable_and_price", [
      "restaurantId",
      "isAvailable",
      "price",
    ])
    .index("by_city_and_isAvailable_and_sortOrder", [
      "city",
      "isAvailable",
      "sortOrder",
    ])
    .index("by_city_and_isAvailable_and_categoryId_and_sortOrder", [
      "city",
      "isAvailable",
      "categoryId",
      "sortOrder",
    ])
    .index("by_city_and_isAvailable_and_price", [
      "city",
      "isAvailable",
      "price",
    ])
    .index("by_city_and_isAvailable_and_categoryId_and_price", [
      "city",
      "isAvailable",
      "categoryId",
      "price",
    ])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["city", "isAvailable", "categoryId"],
    }),
  favorites: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
  })
    .index("by_userId_and_restaurantId", ["userId", "restaurantId"])
    .index("by_userId", ["userId"]),
  reviews: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    orderId: v.id("orders"),
    rating: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_orderId", ["orderId"]),
  orders: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    items: v.array(
      v.object({
        key: v.string(),
        foodId: v.id("menuItems"),
        name: v.string(),
        unitPrice: v.number(),
        quantity: v.number(),
        instructions: v.string(),
      }),
    ),
    contactName: v.string(),
    phone: v.string(),
    city: v.string(),
    address: v.string(),
    comment: v.string(),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    paymentMethod: v.literal("cash"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready_for_pickup"),
      v.literal("delivering"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    idempotencyKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId_and_idempotencyKey", ["userId", "idempotencyKey"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_restaurantId_and_createdAt", ["restaurantId", "createdAt"])
    .index("by_restaurantId_and_status_and_createdAt", [
      "restaurantId",
      "status",
      "createdAt",
    ]),
  pushDevices: defineTable({
    userId: v.id("users"),
    sessionId: v.id("authSessions"),
    token: v.string(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
    orderId: v.optional(v.id("orders")),
    audience: v.optional(
      v.union(v.literal("customer"), v.literal("restaurant")),
    ),
  }).index("by_userId_and_createdAt", ["userId", "createdAt"]),
});

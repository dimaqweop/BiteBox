import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { demoCatalog } from "./lib/demoCatalog";
import type { Id } from "./_generated/dataModel";

export const exists = internalQuery({
  args: {}, returns: v.boolean(),
  handler: async (ctx) => (await ctx.db.query("restaurants").withIndex("by_slug", (q) => q.eq("slug", "demo-pizza")).unique()) !== null,
});

export const insertCatalog = internalMutation({
  args: { images: v.record(v.string(), v.id("_storage")) }, returns: v.number(),
  handler: async (ctx, args) => {
    if (await ctx.db.query("restaurants").withIndex("by_slug", (q) => q.eq("slug", "demo-pizza")).unique()) return 0;
    for (const [sortOrder, item] of demoCatalog.entries()) {
      const existingCategory = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", item.slug)).unique();
      const categoryId = existingCategory?._id ?? await ctx.db.insert("categories", { name: item.category, slug: item.slug, sortOrder });
      const restaurantId = await ctx.db.insert("restaurants", {
        name: item.name, slug: `demo-${item.slug}`, description: `${item.cuisine}. Готуємо з любов’ю для твого настрою.`,
        coverStorageId: args.images[item.slug], categoryId, cuisineTypes: [item.cuisine], city: "Львів",
        address: "Демонстраційний заклад", latitude: 49.8397, longitude: 24.0297,
        ratingAverage: item.rating, ratingCount: 0, estimatedDeliveryMinutes: item.minutes, deliveryFee: item.fee,
        isActive: true, isOpen: true, isFeatured: sortOrder < 3, isDemo: true,
      });
      await ctx.db.insert("menuItems", {
        restaurantId, categoryId, city: "Львів", name: item.dish, description: item.description, price: item.price,
        imageStorageId: args.images[item.slug], ingredients: [...item.ingredients], isAvailable: true, sortOrder: 0,
      });
    }
    return demoCatalog.length;
  },
});

export const demo = internalAction({
  args: {}, returns: v.number(),
  handler: async (ctx): Promise<number> => {
    if (await ctx.runQuery(internal.seed.exists, {})) return 0;
    const images: Record<string, Id<"_storage">> = {};
    try {
      for (const item of demoCatalog) {
        const response = await fetch(`https://images.unsplash.com/${item.photo}?auto=format&fit=crop&w=900&q=80`);
        if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Unable to load demo photo");
        images[item.slug] = await ctx.storage.store(await response.blob());
      }
      const inserted: number = await ctx.runMutation(internal.seed.insertCatalog, { images });
      if (inserted === 0) for (const image of Object.values(images)) await ctx.storage.delete(image);
      return inserted;
    } catch (error) {
      for (const image of Object.values(images)) await ctx.storage.delete(image);
      throw error;
    }
  },
});

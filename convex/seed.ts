import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { initialCatalog } from "./catalogData";
import type { Id } from "./_generated/dataModel";
import { additionalMenu } from "./menuData";

export const expandMenus = internalMutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;

    for (const menu of additionalMenu) {
      const restaurant = await ctx.db
        .query("restaurants")
        .withIndex("by_slug", (q) => q.eq("slug", `bitebox-${menu.restaurant}`))
        .unique();

      if (!restaurant)
        throw new Error(`Missing restaurant: ${menu.restaurant}`);

      for (const [index, dish] of menu.dishes.entries()) {
        const existing = await ctx.db
          .query("menuItems")
          .withIndex("by_restaurantId_and_name", (q) =>
            q.eq("restaurantId", restaurant._id).eq("name", dish.name),
          )
          .unique();

        if (existing) {
          skipped += 1;
          continue;
        }

        await ctx.db.insert("menuItems", {
          restaurantId: restaurant._id,
          categoryId: restaurant.categoryId,
          city: restaurant.city,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          ingredients: [...dish.ingredients],
          isAvailable: true,
          sortOrder: index + 1,
        });
        inserted += 1;
      }
    }

    return { inserted, skipped };
  },
});

// Adopt the existing catalog in place, keeping document IDs, images and favorites.
export const activateCatalog = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let changed = 0;
    for (const item of initialCatalog) {
      const restaurant = await ctx.db
        .query("restaurants")
        .withIndex("by_slug", (q) => q.eq("slug", `demo-${item.slug}`))
        .unique();
      if (!restaurant) continue;
      const slug = `bitebox-${item.slug}`;
      if (
        await ctx.db
          .query("restaurants")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique()
      )
        throw new Error("Catalog slug already exists");
      await ctx.db.patch("restaurants", restaurant._id, {
        slug,
        isDemo: false,
        ...(restaurant.address === "Демонстраційний заклад"
          ? { address: "Львів, Україна" }
          : {}),
      });
      changed += 1;
    }
    return changed;
  },
});

export const exists = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) =>
    (await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", "bitebox-pizza"))
      .unique()) !== null ||
    (await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-pizza"))
      .unique()) !== null,
});

export const insertCatalog = internalMutation({
  args: { images: v.record(v.string(), v.id("_storage")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (
      (await ctx.db
        .query("restaurants")
        .withIndex("by_slug", (q) => q.eq("slug", "bitebox-pizza"))
        .unique()) ||
      (await ctx.db
        .query("restaurants")
        .withIndex("by_slug", (q) => q.eq("slug", "demo-pizza"))
        .unique())
    )
      return 0;
    for (const [sortOrder, item] of initialCatalog.entries()) {
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", item.slug))
        .unique();
      const categoryId =
        existingCategory?._id ??
        (await ctx.db.insert("categories", {
          name: item.category,
          slug: item.slug,
          sortOrder,
        }));
      const restaurantId = await ctx.db.insert("restaurants", {
        name: item.name,
        slug: `bitebox-${item.slug}`,
        description: `${item.cuisine}. Готуємо з любов’ю для твого настрою.`,
        coverStorageId: args.images[item.slug],
        categoryId,
        cuisineTypes: [item.cuisine],
        city: "Львів",
        address: "Львів, Україна",
        latitude: 49.8397,
        longitude: 24.0297,
        ratingAverage: item.rating,
        ratingCount: 0,
        estimatedDeliveryMinutes: item.minutes,
        deliveryFee: item.fee,
        isActive: true,
        isOpen: true,
        isFeatured: sortOrder < 3,
        isDemo: false,
      });
      await ctx.db.insert("menuItems", {
        restaurantId,
        categoryId,
        city: "Львів",
        name: item.dish,
        description: item.description,
        price: item.price,
        imageStorageId: args.images[item.slug],
        ingredients: [...item.ingredients],
        isAvailable: true,
        sortOrder: 0,
      });
    }
    return initialCatalog.length;
  },
});

export const catalog = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    if (await ctx.runQuery(internal.seed.exists, {})) return 0;
    const images: Record<string, Id<"_storage">> = {};
    try {
      for (const item of initialCatalog) {
        const response = await fetch(
          `https://images.unsplash.com/${item.photo}?auto=format&fit=crop&w=900&q=80`,
        );
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/")
        )
          throw new Error("Unable to load demo photo");
        images[item.slug] = await ctx.storage.store(await response.blob());
      }
      const inserted: number = await ctx.runMutation(
        internal.seed.insertCatalog,
        { images },
      );
      if (inserted === 0)
        for (const image of Object.values(images))
          await ctx.storage.delete(image);
      return inserted;
    } catch (error) {
      for (const image of Object.values(images))
        await ctx.storage.delete(image);
      throw error;
    }
  },
});

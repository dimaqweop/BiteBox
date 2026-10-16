import { v } from "convex/values";
import { query } from "./_generated/server";
import { buildCartQuote, cartLine, cartQuote } from "./cartHelpers";

export const getQuote = query({
  args: { restaurantId: v.string(), items: v.array(cartLine) },
  returns: cartQuote,
  handler: async (ctx, args) =>
    await buildCartQuote(ctx, args.restaurantId, args.items),
});

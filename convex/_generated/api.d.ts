/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cart from "../cart.js";
import type * as cartHelpers from "../cartHelpers.js";
import type * as catalog from "../catalog.js";
import type * as catalogData from "../catalogData.js";
import type * as currentUser from "../currentUser.js";
import type * as explore from "../explore.js";
import type * as favorites from "../favorites.js";
import type * as home from "../home.js";
import type * as http from "../http.js";
import type * as menuData from "../menuData.js";
import type * as notifications from "../notifications.js";
import type * as orderNotifications from "../orderNotifications.js";
import type * as orders from "../orders.js";
import type * as passwordProfile from "../passwordProfile.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as restaurantAccess from "../restaurantAccess.js";
import type * as restaurantOrders from "../restaurantOrders.js";
import type * as restaurantOwners from "../restaurantOwners.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cart: typeof cart;
  cartHelpers: typeof cartHelpers;
  catalog: typeof catalog;
  catalogData: typeof catalogData;
  currentUser: typeof currentUser;
  explore: typeof explore;
  favorites: typeof favorites;
  home: typeof home;
  http: typeof http;
  menuData: typeof menuData;
  notifications: typeof notifications;
  orderNotifications: typeof orderNotifications;
  orders: typeof orders;
  passwordProfile: typeof passwordProfile;
  pushNotifications: typeof pushNotifications;
  restaurantAccess: typeof restaurantAccess;
  restaurantOrders: typeof restaurantOrders;
  restaurantOwners: typeof restaurantOwners;
  reviews: typeof reviews;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  pushNotifications: import("@convex-dev/expo-push-notifications/_generated/component.js").ComponentApi<"pushNotifications">;
};

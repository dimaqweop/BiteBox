export const MAX_ITEM_QUANTITY = 20;
export const MAX_CART_LINES = 50;

export type CartRestaurant = { id: string; name: string; deliveryFee: number };
export type CartItem = {
  key: string;
  foodId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  instructions: string;
};
export type CartState = {
  restaurant: CartRestaurant | null;
  items: CartItem[];
  comment: string;
  checkoutKey: string | null;
};
export const emptyCart: CartState = {
  restaurant: null,
  items: [],
  comment: "",
  checkoutKey: null,
};
export type CartAction =
  | {
      type: "add";
      restaurant: CartRestaurant;
      item: CartItem;
      replace?: boolean;
    }
  | { type: "quantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "comment"; comment: string }
  | { type: "hydrate"; state: CartState }
  | { type: "checkoutKey"; key: string }
  | { type: "instructions"; key: string; instructions: string }
  | { type: "clear" };

export function cartKey(foodId: string, instructions: string) {
  return `${foodId}:${instructions.trim()}`;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "hydrate") return action.state;
  if (action.type === "checkoutKey")
    return { ...state, checkoutKey: action.key };
  if (action.type === "clear") return emptyCart;
  if (action.type === "comment")
    return {
      ...state,
      comment: action.comment.slice(0, 500),
      checkoutKey: null,
    };
  if (action.type === "add") {
    if (
      !Number.isInteger(action.item.quantity) ||
      action.item.quantity < 1 ||
      action.item.quantity > MAX_ITEM_QUANTITY ||
      !Number.isFinite(action.item.unitPrice) ||
      action.item.unitPrice < 0
    )
      return state;
    if (
      state.restaurant &&
      state.restaurant.id !== action.restaurant.id &&
      !action.replace
    )
      return state;
    const base = action.replace ? emptyCart : state;
    const existing = base.items.find((item) => item.key === action.item.key);
    if (
      (existing?.quantity ?? 0) + action.item.quantity > MAX_ITEM_QUANTITY ||
      (!existing && base.items.length >= MAX_CART_LINES)
    )
      return state;
    return {
      ...base,
      restaurant: action.restaurant,
      checkoutKey: null,
      items: existing
        ? base.items.map((item) =>
            item.key === action.item.key
              ? {
                  ...action.item,
                  quantity: item.quantity + action.item.quantity,
                }
              : item,
          )
        : [...base.items, action.item],
    };
  }
  if (action.type === "instructions") {
    const original = state.items.find((item) => item.key === action.key);
    if (!original) return state;

    const instructions = action.instructions.trim().slice(0, 300);
    const key = cartKey(original.foodId, instructions);
    const target = state.items.find(
      (item) => item.key === key && item.key !== original.key,
    );
    if (target && target.quantity + original.quantity > MAX_ITEM_QUANTITY)
      return state;

    const items = state.items.flatMap((item) => {
      if (target && item.key === original.key) return [];
      if (target && item.key === target.key)
        return [{ ...target, quantity: target.quantity + original.quantity }];
      if (item.key === original.key) return [{ ...item, key, instructions }];
      return [item];
    });

    return { ...state, items, checkoutKey: null };
  }

  if (
    action.type === "quantity" &&
    (!Number.isInteger(action.quantity) ||
      action.quantity < 0 ||
      action.quantity > MAX_ITEM_QUANTITY)
  )
    return state;
  const items = state.items.flatMap((item) =>
    item.key !== action.key
      ? [item]
      : action.type === "remove" || action.quantity === 0
        ? []
        : [{ ...item, quantity: action.quantity }],
  );
  return items.length ? { ...state, items, checkoutKey: null } : emptyCart;
}

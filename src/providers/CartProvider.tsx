import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform, Text, View } from "react-native";
import { useConvexConnectionState, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { createCartStorage } from "@/lib/cartPersistence";
import * as Haptics from "expo-haptics";
import type { Food, Restaurant } from "@/types/catalog";
import {
  cartKey,
  cartReducer,
  emptyCart,
  MAX_CART_LINES,
  MAX_ITEM_QUANTITY,
  type CartItem,
  type CartRestaurant,
} from "@/lib/cart";
import { Sheet } from "@/components/ui/Sheet";
import { AppButton } from "@/components/ui/AppButton";

function useCartState(ownerId: string) {
  const [state, dispatch] = useReducer(cartReducer, emptyCart);
  const [storage] = useState(() => createCartStorage(ownerId));
  const [hydrated, setHydrated] = useState(!storage.supported);
  const [storageError, setStorageError] = useState<string>();
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const connection = useConvexConnectionState();
  const quote = useQuery(
    api.cart.getQuote,
    hydrated && state.restaurant && state.items.length
      ? {
          restaurantId: state.restaurant.id,
          items: state.items.map(({ key, foodId, quantity }) => ({
            key,
            foodId,
            quantity,
          })),
        }
      : "skip",
  );

  useEffect(() => {
    if (!storage.supported) return;
    let active = true;
    storage
      .load()
      .then((saved) => {
        if (!active) return;
        dispatch({ type: "hydrate", state: saved });
        setHydrated(true);
        setStorageError(undefined);
      })
      .catch(() => {
        if (active) setStorageError("Не вдалося відновити збережений кошик.");
      });
    return () => {
      active = false;
    };
  }, [storage, restoreAttempt]);

  useEffect(() => {
    if (!hydrated || !storage.supported) return;
    let active = true;
    const save = () => {
      void storage
        .save(state)
        .then(() => {
          if (active) setStorageError(undefined);
        })
        .catch(() => {
          if (active) setStorageError("Не вдалося зберегти кошик на телефоні.");
        });
    };
    const timer = setTimeout(save, 350);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        clearTimeout(timer);
        save();
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [state, hydrated, storage]);
  const [pending, setPending] = useState<{
    restaurant: CartRestaurant;
    item: CartItem;
  } | null>(null);
  const [notice, setNotice] = useState("");
  function feedback() {
    if (Platform.OS !== "web") void Haptics.selectionAsync().catch(() => {});
  }
  function add(
    food: Food,
    restaurant: Restaurant,
    quantity = 1,
    instructions = "",
  ) {
    if (!hydrated) {
      setNotice("Зачекай, відновлюємо кошик.");
      return false;
    }
    if (
      !food.isAvailable ||
      !restaurant.isActive ||
      !restaurant.isOpen ||
      food.restaurantId !== restaurant._id
    ) {
      setNotice("Ця страва зараз недоступна.");
      return false;
    }
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    )
      return false;
    const trimmed = instructions.trim().slice(0, 300);
    const item: CartItem = {
      key: cartKey(food._id, trimmed),
      foodId: food._id,
      name: food.name,
      imageUrl: food.imageUrl,
      unitPrice: food.price,
      quantity,
      instructions: trimmed,
    };
    const venue = {
      id: restaurant._id,
      name: restaurant.name,
      deliveryFee: restaurant.deliveryFee,
    };
    if (state.restaurant && state.restaurant.id !== venue.id) {
      setPending({ restaurant: venue, item });
      return false;
    }
    const existing = state.items.find((row) => row.key === item.key);
    if ((existing?.quantity ?? 0) + quantity > MAX_ITEM_QUANTITY) {
      setNotice(`Максимум ${MAX_ITEM_QUANTITY} порцій однієї позиції.`);
      return false;
    }
    if (!existing && state.items.length >= MAX_CART_LINES) {
      setNotice(
        "У кошику вже 50 позицій. Прибери зайве, щоб додати нову страву.",
      );
      return false;
    }
    dispatch({ type: "add", restaurant: venue, item });
    setNotice("Додано до кошика");
    feedback();
    return true;
  }
  return {
    ...state,
    dispatch,
    add,
    pending,
    setPending,
    notice,
    setNotice,
    quote,
    connected: connection.isWebSocketConnected,
    hydrated,
    storageError,
    async prepareCheckout(key: string) {
      dispatch({ type: "checkoutKey", key });
      await storage.save({ ...state, checkoutKey: key });
    },
    retryStorage() {
      if (!hydrated) {
        setStorageError(undefined);
        setRestoreAttempt((value) => value + 1);
        return;
      }
      void storage
        .save(state)
        .then(() => setStorageError(undefined))
        .catch(() => setStorageError("Не вдалося зберегти кошик на телефоні."));
    },
    async resetStorage() {
      try {
        await storage.reset();
        dispatch({ type: "clear" });
        setHydrated(true);
        setStorageError(undefined);
      } catch {
        setStorageError(
          "Не вдалося очистити збережений кошик. Спробуй ще раз.",
        );
      }
    },
    updateInstructions(key: string, instructions: string) {
      const original = state.items.find((item) => item.key === key);
      if (!original) return false;
      const newKey = cartKey(original.foodId, instructions);
      const other = state.items.find(
        (item) => item.key === newKey && item.key !== key,
      );
      if (other && other.quantity + original.quantity > MAX_ITEM_QUANTITY) {
        setNotice(
          `Разом виходить понад ${MAX_ITEM_QUANTITY} порцій. Спочатку зменш кількість.`,
        );
        return false;
      }
      dispatch({ type: "instructions", key, instructions });
      setNotice("");
      return true;
    },
    confirmReplacement() {
      if (pending) {
        dispatch({ type: "add", ...pending, replace: true });
        setPending(null);
        setNotice("Кошик оновлено");
        feedback();
      }
    },
    count: state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal:
      quote?.subtotal ??
      state.items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ),
  };
}

const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);
export function CartProvider({
  children,
  ownerId,
}: {
  children: ReactNode;
  ownerId: string;
}) {
  const cart = useCartState(ownerId);
  return (
    <CartContext.Provider value={cart}>
      {children}
      <Sheet
        visible={!!cart.pending}
        title="Замінити кошик?"
        onClose={() => cart.setPending(null)}
      >
        <View className="gap-5 pb-4">
          <Text className="font-regular text-base leading-6 text-secondaryText">
            У кошику вже є страви із закладу «{cart.restaurant?.name}». Додати
            страву із «{cart.pending?.restaurant.name}» та прибрати попередні
            позиції?
          </Text>
          <AppButton title="Замінити кошик" onPress={cart.confirmReplacement} />
          <AppButton
            title="Залишити поточний"
            variant="secondary"
            onPress={() => cart.setPending(null)}
          />
        </View>
      </Sheet>
    </CartContext.Provider>
  );
}
export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("CartProvider is missing");
  return cart;
}

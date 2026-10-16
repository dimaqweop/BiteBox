import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  cartKey,
  emptyCart,
  MAX_CART_LINES,
  MAX_ITEM_QUANTITY,
  type CartState,
} from "./cart";

type Manifest = { generation: string; chunks: number };
const CHUNK_CHARACTERS = 350;
const MAX_CHUNKS = 250;

function parseManifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (
    typeof parsed.generation !== "string" ||
    !/^[a-z0-9-]+$/.test(parsed.generation) ||
    !Number.isInteger(parsed.chunks) ||
    parsed.chunks < 1 ||
    parsed.chunks > MAX_CHUNKS
  )
    throw new Error("Invalid cart manifest");
  return parsed;
}

export function parseSavedCart(raw: string): CartState {
  const state = JSON.parse(raw);
  if (
    !state ||
    !Array.isArray(state.items) ||
    state.items.length > MAX_CART_LINES ||
    typeof state.comment !== "string" ||
    state.comment.length > 500
  )
    throw new Error("Invalid saved cart");
  if (state.items.length === 0) return emptyCart;
  if (
    state.checkoutKey !== undefined &&
    state.checkoutKey !== null &&
    (typeof state.checkoutKey !== "string" ||
      state.checkoutKey.length < 16 ||
      state.checkoutKey.length > 100)
  )
    throw new Error("Invalid checkout key");
  if (
    !state.restaurant ||
    typeof state.restaurant.id !== "string" ||
    typeof state.restaurant.name !== "string" ||
    !Number.isFinite(state.restaurant.deliveryFee) ||
    state.restaurant.deliveryFee < 0
  )
    throw new Error("Invalid saved restaurant");

  const keys = new Set<string>();
  for (const item of state.items) {
    if (
      typeof item.foodId !== "string" ||
      typeof item.name !== "string" ||
      typeof item.instructions !== "string" ||
      item.instructions.length > 300 ||
      item.key !== cartKey(item.foodId, item.instructions) ||
      keys.has(item.key) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_ITEM_QUANTITY ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      (item.imageUrl !== null && typeof item.imageUrl !== "string")
    )
      throw new Error("Invalid saved item");
    keys.add(item.key);
  }

  return { ...state, checkoutKey: state.checkoutKey ?? null } as CartState;
}

export function createCartStorage(owner: string) {
  const supported = Platform.OS !== "web";
  const prefix = `bitebox.cart.${owner}`;
  const manifestKey = `${prefix}.manifest`;
  let queue = Promise.resolve();

  async function load(): Promise<CartState> {
    if (!supported) return emptyCart;
    const manifest = parseManifest(await SecureStore.getItemAsync(manifestKey));
    if (!manifest) return emptyCart;
    const chunks: string[] = [];

    for (let index = 0; index < manifest.chunks; index += 1) {
      const chunk = await SecureStore.getItemAsync(
        `${prefix}.${manifest.generation}.${index}`,
      );
      if (chunk === null) throw new Error("Missing saved cart chunk");
      chunks.push(chunk);
    }

    return parseSavedCart(chunks.join(""));
  }

  function save(state: CartState): Promise<void> {
    if (!supported) return Promise.resolve();

    const write = async () => {
      const previous = parseManifest(
        await SecureStore.getItemAsync(manifestKey),
      );
      const generation = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const characters = Array.from(JSON.stringify(state));
      const chunks: string[] = [];

      for (
        let offset = 0;
        offset < characters.length;
        offset += CHUNK_CHARACTERS
      ) {
        chunks.push(
          characters.slice(offset, offset + CHUNK_CHARACTERS).join(""),
        );
      }
      if (chunks.length > MAX_CHUNKS)
        throw new Error("Cart is too large to save");

      try {
        for (const [index, chunk] of chunks.entries()) {
          await SecureStore.setItemAsync(
            `${prefix}.${generation}.${index}`,
            chunk,
            { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
          );
        }
        await SecureStore.setItemAsync(
          manifestKey,
          JSON.stringify({ generation, chunks: chunks.length }),
          { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
        );
      } catch (error) {
        await Promise.allSettled(
          chunks.map((_, index) =>
            SecureStore.deleteItemAsync(`${prefix}.${generation}.${index}`),
          ),
        );
        throw error;
      }

      if (previous) {
        await Promise.allSettled(
          Array.from({ length: previous.chunks }, (_, index) =>
            SecureStore.deleteItemAsync(
              `${prefix}.${previous.generation}.${index}`,
            ),
          ),
        );
      }
    };

    const pending = queue.then(write);
    queue = pending.catch(() => {});
    return pending;
  }

  async function reset() {
    if (!supported) return;
    await queue;
    let manifest: Manifest | null = null;
    try {
      manifest = parseManifest(await SecureStore.getItemAsync(manifestKey));
    } catch {
      /* A broken manifest can still be discarded explicitly. */
    }
    await SecureStore.deleteItemAsync(manifestKey);
    if (manifest) {
      const previous = manifest;
      await Promise.allSettled(
        Array.from({ length: previous.chunks }, (_, index) =>
          SecureStore.deleteItemAsync(
            `${prefix}.${previous.generation}.${index}`,
          ),
        ),
      );
    }
  }

  return { load, save, reset, supported };
}

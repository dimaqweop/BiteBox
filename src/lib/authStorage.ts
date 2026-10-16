import type { TokenStorage } from "@convex-dev/auth/react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Web preview keeps secrets in memory; mobile sessions use encrypted persistence.
const webTokens = new Map<string, string>();

export const authStorage: TokenStorage =
  Platform.OS === "web"
    ? {
        getItem: (key) => webTokens.get(key) ?? null,
        setItem: (key, value) => {
          webTokens.set(key, value);
        },
        removeItem: (key) => {
          webTokens.delete(key);
        },
      }
    : {
        getItem: SecureStore.getItemAsync,
        setItem: (key, value) =>
          SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        removeItem: SecureStore.deleteItemAsync,
      };

import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { Heart } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import type { Restaurant } from "@/types/catalog";
import { theme } from "@/constants/theme";

export function FavoriteButton({ restaurant }: { restaurant: Restaurant }) {
  const toggle = useMutation(api.favorites.toggleFavorite);
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function favorite() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      await toggle({ restaurantId: restaurant._id });
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <View className="items-end gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          restaurant.isFavorite ? "Прибрати з улюблених" : "Додати до улюблених"
        }
        accessibilityState={{ selected: restaurant.isFavorite, busy: loading }}
        disabled={loading}
        onPress={() => void favorite()}
        className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Heart
            size={22}
            color={theme.colors.primaryText}
            fill={restaurant.isFavorite ? theme.colors.primary : "transparent"}
          />
        )}
      </Pressable>
      {error ? (
        <Text
          accessibilityRole="alert"
          className="max-w-48 rounded-xl bg-surface p-2 font-medium text-xs text-errorText"
        >
          Не вдалося зберегти. Спробуй ще раз.
        </Text>
      ) : null}
    </View>
  );
}

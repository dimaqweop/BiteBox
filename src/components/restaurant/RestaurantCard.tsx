import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Clock3, Heart, Star } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { theme } from "@/constants/theme";
import type { Restaurant } from "@/types/catalog";
import { FoodImage } from "@/components/ui/FoodImage";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { formatCurrency } from "@/lib/formatCurrency";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function RestaurantCard({
  restaurant,
  onPress,
  width = 256,
}: {
  restaurant: Restaurant;
  onPress: () => void;
  width?: number;
}) {
  const toggle = useMutation(api.favorites.toggleFavorite);
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const heartScale = useSharedValue(1);
  useEffect(() => {
    heartScale.set(withSpring(restaurant.isFavorite ? 1.12 : 1));
  }, [restaurant.isFavorite, heartScale]);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.get() }],
  }));
  async function favorite() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      await toggle({ restaurantId: restaurant._id });
    } catch {
      Alert.alert(
        "Не вдалося зберегти",
        "Перевірте з’єднання та спробуйте ще раз.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <View style={{ width }}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`Переглянути ${restaurant.name}`}
        onPress={onPress}
        className="overflow-hidden rounded-3xl border border-border bg-surface"
      >
        <View>
          <FoodImage
            uri={restaurant.imageUrl}
            label={restaurant.name}
            style={{ height: 150 }}
          />
          <View className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1">
            <Text className="font-bold text-xs text-textPrimary">
              {restaurant.isOpen ? "Відчинено" : "Зачинено"}
            </Text>
          </View>
          <View className="absolute bottom-3 left-3 flex-row items-center gap-1 rounded-full bg-surface px-2 py-1">
            <Star
              size={12}
              fill={theme.colors.primary}
              color={theme.colors.primaryText}
            />
            <Text className="font-bold text-xs text-textPrimary">
              {restaurant.ratingAverage.toFixed(1)}
            </Text>
          </View>
        </View>
        <View className="gap-2 p-4">
          <Text
            numberOfLines={1}
            className="font-bold text-lg text-textPrimary"
          >
            {restaurant.name}
          </Text>
          <Text
            numberOfLines={1}
            className="font-regular text-xs text-secondaryText"
          >
            {restaurant.cuisineTypes.join(" · ")}
          </Text>
          <View className="flex-row items-center gap-1">
            <Clock3 size={13} color={theme.colors.secondaryText} />
            <Text className="font-medium text-xs text-secondaryText">
              {restaurant.estimatedDeliveryMinutes} хв
            </Text>
            <Text className="mx-1 text-textMuted">·</Text>
            <Text className="font-medium text-xs text-secondaryText">
              Доставка {formatCurrency(restaurant.deliveryFee)}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          restaurant.isFavorite
            ? `Прибрати ${restaurant.name} з улюблених`
            : `Додати ${restaurant.name} до улюблених`
        }
        accessibilityState={{ selected: restaurant.isFavorite, busy: loading }}
        onPress={() => void favorite()}
        disabled={loading}
        className="absolute right-2 top-2 h-12 w-12 items-center justify-center rounded-full bg-surface"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Animated.View style={heartStyle}>
            <Heart
              size={21}
              color={
                restaurant.isFavorite
                  ? theme.colors.primaryText
                  : theme.colors.textPrimary
              }
              fill={
                restaurant.isFavorite ? theme.colors.primary : "transparent"
              }
            />
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

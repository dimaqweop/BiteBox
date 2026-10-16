import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  router,
  useLocalSearchParams,
  type ErrorBoundaryProps,
} from "expo-router";
import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { api } from "@/convex/_generated/api";
import { theme } from "@/constants/theme";
import { formatCurrency } from "@/lib/formatCurrency";
import { useCart } from "@/providers/CartProvider";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { FoodImage } from "@/components/ui/FoodImage";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { DetailState } from "@/components/ui/DetailState";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { FoodCard } from "@/components/food/FoodCard";

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reference = typeof id === "string" ? id : "";
  const details = useQuery(api.catalog.getFood, { reference });
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const cart = useCart();

  if (details === undefined) return <LoadingScreen />;
  if (!details)
    return (
      <DetailState
        title="Страву не знайдено"
        message="Ця страва більше не доступна або посилання некоректне."
      />
    );

  const { food, restaurant, related } = details;
  const canAdd = food.isAvailable && restaurant.isOpen;
  const availability = !food.isAvailable
    ? "Тимчасово недоступно"
    : !restaurant.isOpen
      ? "Заклад зараз зачинено"
      : "Готуємо після замовлення";

  function addToCart() {
    Keyboard.dismiss();
    if (cart.add(food, restaurant, quantity, instructions)) {
      setQuantity(1);
      setInstructions("");
    }
  }

  const footer = (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <QuantitySelector value={quantity} onChange={setQuantity} />
        <Text className="font-extraBold text-2xl text-textPrimary">
          {formatCurrency(food.price * quantity)}
        </Text>
      </View>
      <AppButton
        title={canAdd ? "Додати до кошика" : availability}
        disabled={!canAdd}
        onPress={addToCart}
      />
      {cart.notice ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-center font-semibold text-sm text-primaryText"
        >
          {cart.notice}
        </Text>
      ) : null}
      {cart.count ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Відкрити кошик, ${cart.count} страв`}
          onPress={() => router.push("/cart")}
          className="min-h-12 items-center justify-center"
        >
          <Text className="font-bold text-sm text-primaryText">
            Перейти до кошика · {cart.count}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        enabled={Platform.OS === "ios"}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View className="w-full max-w-2xl self-center">
            <View>
              <FoodImage
                uri={food.imageUrl}
                label={food.name}
                style={{ height: 280 }}
              />
              <View className="absolute left-5 top-3">
                <BackButton />
              </View>
            </View>
            <Animated.View
              entering={FadeInDown.duration(250).reduceMotion(
                ReduceMotion.System,
              )}
              className="gap-5 px-5 pt-6"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Відкрити заклад ${restaurant.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/restaurant/[id]",
                    params: { id: restaurant._id },
                  })
                }
                className="min-h-12 flex-row items-center justify-between gap-3 rounded-2xl bg-primaryLight px-4"
              >
                <Text className="flex-1 font-bold text-sm text-primaryText">
                  {restaurant.name}
                </Text>
                <ChevronRight size={20} color={theme.colors.primaryText} />
              </Pressable>
              <Text
                accessibilityRole="header"
                className="font-extraBold text-3xl leading-10 text-textPrimary"
              >
                {food.name}
              </Text>
              <View className="flex-row flex-wrap items-center gap-3">
                <Text className="font-extraBold text-xl text-textPrimary">
                  {formatCurrency(food.price)}
                </Text>
                <Text className="font-medium text-xs text-secondaryText">
                  за порцію
                </Text>
                <Text className="font-semibold text-xs text-primaryText">
                  {availability}
                </Text>
              </View>
              <Text className="font-regular text-base leading-7 text-secondaryText">
                {food.description}
              </Text>
              <View className="gap-3">
                <Text
                  accessibilityRole="header"
                  className="font-bold text-xl text-textPrimary"
                >
                  Інгредієнти
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {food.ingredients.map((ingredient) => (
                    <View
                      key={ingredient}
                      className="rounded-full border border-border bg-surface px-3 py-2"
                    >
                      <Text className="font-medium text-sm text-secondaryText">
                        {ingredient}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="gap-3">
                <Text className="font-bold text-xl text-textPrimary">
                  Твої побажання
                </Text>
                <Text className="font-regular text-sm leading-5 text-secondaryText">
                  Наприклад, без цибулі. Виконання побажань залежить від
                  можливостей закладу.
                </Text>
                <TextInput
                  accessibilityLabel="Побажання до страви"
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                  maxLength={300}
                  placeholder="Що варто врахувати? (необов’язково)"
                  placeholderTextColor={theme.colors.secondaryText}
                  textAlignVertical="top"
                  className="min-h-28 rounded-2xl border border-border bg-surface p-4 font-regular text-base text-textPrimary"
                />
                <Text className="text-right font-regular text-xs text-secondaryText">
                  {instructions.length}/300
                </Text>
              </View>
              {related.length ? (
                <View className="gap-4">
                  <Text
                    accessibilityRole="header"
                    className="font-bold text-xl text-textPrimary"
                  >
                    Ще з цього закладу
                  </Text>
                  {related.map((item) => (
                    <FoodCard
                      key={item._id}
                      food={item}
                      onPress={() =>
                        router.push({
                          pathname: "/food/[id]",
                          params: { id: item._id },
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}
            </Animated.View>
          </View>
        </ScrollView>
        <View
          className="border-t border-border bg-background px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="w-full max-w-lg self-center">{footer}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Не вдалося завантажити страву"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

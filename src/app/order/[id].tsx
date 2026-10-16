import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  router,
  useLocalSearchParams,
  type ErrorBoundaryProps,
} from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Star } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { orderStatusLabels } from "@/constants/orders";
import { theme } from "@/constants/theme";
import { formatCurrency } from "@/lib/formatCurrency";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { DetailState } from "@/components/ui/DetailState";

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useQuery(api.orders.getOwnOrder, {
    reference: typeof id === "string" ? id : "",
  });
  const review = useQuery(
    api.reviews.getMyReview,
    order ? { orderId: order._id } : "skip",
  );
  const rateOrder = useMutation(api.reviews.rateOrder);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const selectedRating = rating ?? review?.rating ?? 0;

  async function saveRating() {
    if (!order || !selectedRating || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      await rateOrder({ orderId: order._id, rating: selectedRating });
      setRating(null);
    } catch {
      setError(
        "Не вдалося зберегти оцінку. Перевір з’єднання та статус замовлення.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (order === undefined) return <LoadingScreen />;
  if (!order)
    return (
      <DetailState
        title="Замовлення не знайдено"
        message="Це замовлення недоступне для твого акаунта."
      />
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="w-full max-w-2xl gap-6 self-center">
          <BackButton />
          <View className="gap-3">
            <Text
              accessibilityRole="header"
              className="font-extraBold text-3xl text-textPrimary"
            >
              Замовлення #{order._id.slice(-6).toUpperCase()}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="self-start rounded-full bg-primaryLight px-4 py-2 font-bold text-sm text-primaryText"
            >
              {orderStatusLabels[order.status]}
            </Text>
            <Text className="font-bold text-xl text-textPrimary">
              {order.restaurantName}
            </Text>
            <Text className="font-regular text-sm text-secondaryText">
              {new Date(order.createdAt).toLocaleString("uk-UA")}
            </Text>
          </View>
          <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
            {order.items.map((item) => (
              <View key={item.key} className="flex-row justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-base text-textPrimary">
                    {item.quantity} × {item.name}
                  </Text>
                  {item.instructions ? (
                    <Text className="font-regular text-xs text-secondaryText">
                      {item.instructions}
                    </Text>
                  ) : null}
                </View>
                <Text className="font-bold text-sm text-textPrimary">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </Text>
              </View>
            ))}
            <Text className="font-medium text-sm text-secondaryText">
              Доставка {formatCurrency(order.deliveryFee)}
            </Text>
            <Text className="font-extraBold text-xl text-textPrimary">
              Разом {formatCurrency(order.total)}
            </Text>
          </View>
          <View className="gap-3">
            <Text className="font-bold text-xl text-textPrimary">Доставка</Text>
            <Text className="font-medium text-base text-textPrimary">
              {order.city}, {order.address}
            </Text>
            <Text
              selectable
              className="font-regular text-sm text-secondaryText"
            >
              {order.contactName} · {order.phone}
            </Text>
            <Text className="font-medium text-sm text-secondaryText">
              Оплата готівкою при отриманні
            </Text>
            {order.comment ? (
              <Text className="font-regular text-sm leading-6 text-secondaryText">
                {order.comment}
              </Text>
            ) : null}
          </View>
          {order.status === "delivered" ? (
            <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
              <Text className="font-bold text-xl text-textPrimary">
                Як тобі заклад?
              </Text>
              <View className="flex-row flex-wrap">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Оцінка ${value} з 5`}
                    accessibilityState={{
                      selected: selectedRating === value,
                      disabled: loading,
                    }}
                    disabled={loading}
                    onPress={() => {
                      setRating(value);
                      setError("");
                    }}
                    className="h-12 w-12 items-center justify-center"
                  >
                    <Star
                      size={30}
                      color={theme.colors.primaryText}
                      fill={
                        selectedRating >= value
                          ? theme.colors.primary
                          : "transparent"
                      }
                    />
                  </Pressable>
                ))}
              </View>
              {review ? (
                <Text
                  accessibilityLiveRegion="polite"
                  className="font-medium text-sm text-primaryText"
                >
                  Твоя оцінка: {review.rating}/5. Її можна змінити.
                </Text>
              ) : null}
              {error ? (
                <Text
                  accessibilityRole="alert"
                  className="font-medium text-sm text-errorText"
                >
                  {error}
                </Text>
              ) : null}
              <AppButton
                title={review ? "Оновити оцінку" : "Зберегти оцінку"}
                disabled={
                  !selectedRating ||
                  review === undefined ||
                  selectedRating === review?.rating
                }
                loading={loading}
                onPress={() => void saveRating()}
              />
            </View>
          ) : order.status !== "cancelled" ? (
            <Text className="font-regular text-sm leading-6 text-secondaryText">
              Після доставки тут можна буде оцінити заклад.
            </Text>
          ) : null}
          <AppButton
            title="Мої замовлення"
            variant="secondary"
            onPress={() => router.replace("/orders")}
          />
          <AppButton
            title="На головну"
            variant="secondary"
            onPress={() => router.replace("/home")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Замовлення недоступне"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

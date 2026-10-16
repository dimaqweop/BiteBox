import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, type ErrorBoundaryProps } from "expo-router";
import { useConvexConnectionState, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { orderStatusLabels, restaurantNextStep } from "@/constants/orders";
import { formatCurrency } from "@/lib/formatCurrency";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { DetailState } from "@/components/ui/DetailState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Sheet } from "@/components/ui/Sheet";

export default function RestaurantOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useQuery(api.restaurantOrders.getOrder, {
    reference: id ?? "",
  });
  const updateStatus = useMutation(api.orders.updateStatus);
  const connected = useConvexConnectionState().isWebSocketConnected;
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelStatus, setCancelStatus] = useState<
    Doc<"orders">["status"] | null
  >(null);

  async function changeStatus(
    status: Doc<"orders">["status"],
    expectedStatus: Doc<"orders">["status"],
  ) {
    if (!order || busy.current || !connected) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await updateStatus({ orderId: order._id, status, expectedStatus });
      setCancelStatus(null);
      setNotice(`Статус оновлено: ${orderStatusLabels[status]}`);
    } catch (cause) {
      const code = cause instanceof ConvexError ? cause.data : null;
      setError(
        code === "STATUS_CHANGED" || code === "INVALID_STATUS_TRANSITION"
          ? "Статус замовлення вже змінився. Перевір його та повтори дію."
          : code === "FORBIDDEN"
            ? "Доступ до цього замовлення втрачено."
            : "Не вдалося змінити статус. Перевір з’єднання та спробуй ще раз.",
      );
      setCancelStatus(null);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (order === undefined) return <LoadingScreen />;
  if (!order)
    return (
      <DetailState
        title="Замовлення недоступне"
        message="Замовлення не знайдено або воно належить іншому закладу."
      />
    );
  const nextStep = restaurantNextStep[order.status];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
          <BackButton />
          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="font-extraBold text-3xl text-textPrimary"
            >
              Замовлення #{order._id.slice(-6).toUpperCase()}
            </Text>
            <Text className="font-bold text-lg text-textPrimary">
              {order.restaurantName}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="font-bold text-base text-primaryText"
            >
              {orderStatusLabels[order.status]}
            </Text>
            <Text className="font-regular text-sm text-secondaryText">
              {new Date(order.createdAt).toLocaleString("uk-UA")}
            </Text>
          </View>
          <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
            <Text className="font-bold text-xl text-textPrimary">
              Склад замовлення
            </Text>
            {order.items.map((item) => (
              <View key={item.key} className="flex-row justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-base text-textPrimary">
                    {item.quantity} × {item.name}
                  </Text>
                  {item.instructions ? (
                    <Text className="font-regular text-sm leading-6 text-secondaryText">
                      {item.instructions}
                    </Text>
                  ) : null}
                </View>
                <Text className="font-bold text-sm text-textPrimary">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </Text>
              </View>
            ))}
            <Text className="font-medium text-sm text-secondaryText">
              Доставка: {formatCurrency(order.deliveryFee)}
            </Text>
            <Text className="font-extraBold text-xl text-textPrimary">
              Разом: {formatCurrency(order.total)}
            </Text>
            <Text className="font-regular text-sm text-secondaryText">
              Оплата готівкою при отриманні
            </Text>
          </View>
          <View className="gap-3">
            <Text className="font-bold text-xl text-textPrimary">
              Отримувач і доставка
            </Text>
            <Text
              selectable
              className="font-semibold text-base text-textPrimary"
            >
              {order.contactName}
            </Text>
            <Text selectable className="font-medium text-base text-textPrimary">
              {order.phone}
            </Text>
            <Text
              selectable
              className="font-regular text-base leading-6 text-secondaryText"
            >
              {order.city}, {order.address}
            </Text>
            {order.comment ? (
              <View className="gap-2 rounded-2xl bg-primaryLight p-4">
                <Text className="font-bold text-sm text-primaryText">
                  Коментар клієнта
                </Text>
                <Text className="font-regular text-sm leading-6 text-textPrimary">
                  {order.comment}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="gap-3">
            {!connected ? (
              <Text className="font-medium text-sm text-errorText">
                Зміна статусу буде доступна після відновлення з’єднання.
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
            {notice ? (
              <Text
                accessibilityLiveRegion="polite"
                className="font-medium text-sm text-primaryText"
              >
                {notice}
              </Text>
            ) : null}
            {nextStep ? (
              <>
                <AppButton
                  title={nextStep.title}
                  loading={loading}
                  disabled={!connected}
                  onPress={() =>
                    void changeStatus(nextStep.status, order.status)
                  }
                />
                <AppButton
                  title={
                    order.status === "pending"
                      ? "Відхилити замовлення"
                      : "Скасувати замовлення"
                  }
                  variant="secondary"
                  disabled={loading || !connected}
                  onPress={() => setCancelStatus(order.status)}
                />
              </>
            ) : (
              <Text className="font-regular text-base leading-6 text-secondaryText">
                {order.status === "delivered"
                  ? "Замовлення завершено. Клієнт може оцінити заклад."
                  : "Замовлення скасовано. Подальша зміна статусу недоступна."}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
      <Sheet
        visible={cancelStatus !== null}
        title="Скасувати замовлення?"
        onClose={() => {
          if (!loading) setCancelStatus(null);
        }}
        footer={
          <>
            <AppButton
              title="Так, скасувати"
              loading={loading}
              disabled={!connected || order.status !== cancelStatus}
              onPress={() => {
                if (cancelStatus) void changeStatus("cancelled", cancelStatus);
              }}
            />
            <AppButton
              title="Залишити замовлення"
              variant="secondary"
              disabled={loading}
              onPress={() => setCancelStatus(null)}
            />
          </>
        }
      >
        <Text className="pb-5 font-regular text-base leading-6 text-secondaryText">
          Клієнт побачить статус «Скасовано». Відновити це замовлення буде
          неможливо.
        </Text>
        {cancelStatus !== null && order.status !== cancelStatus ? (
          <Text className="pb-5 font-medium text-sm text-errorText">
            Статус уже змінився. Закрий вікно та перевір замовлення.
          </Text>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Не вдалося відкрити замовлення"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

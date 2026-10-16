import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type ErrorBoundaryProps } from "expo-router";
import { usePaginatedQuery } from "convex/react";
import { ReceiptText } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { orderStatusLabels } from "@/constants/orders";
import { theme } from "@/constants/theme";
import { formatCurrency } from "@/lib/formatCurrency";
import { AppButton } from "@/components/ui/AppButton";
import { DetailState } from "@/components/ui/DetailState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function OrdersScreen() {
  const orders = usePaginatedQuery(
    api.orders.getMyOrders,
    {},
    { initialNumItems: 15 },
  );
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <Text
          accessibilityRole="header"
          className="px-5 pb-3 pt-6 font-extraBold text-3xl text-textPrimary"
        >
          Мої замовлення
        </Text>
        <FlatList
          data={orders.results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Замовлення ${item.restaurantName}, ${orderStatusLabels[item.status]}`}
              onPress={() =>
                router.push({
                  pathname: "/order/[id]",
                  params: { id: item._id },
                })
              }
              className="gap-3 rounded-3xl border border-border bg-surface p-5"
            >
              <Text className="font-bold text-lg text-textPrimary">
                {item.restaurantName}
              </Text>
              <Text className="font-bold text-sm text-primaryText">
                {orderStatusLabels[item.status]}
              </Text>
              <Text className="font-regular text-xs text-secondaryText">
                #{item._id.slice(-6).toUpperCase()} ·{" "}
                {new Date(item.createdAt).toLocaleDateString("uk-UA")}
              </Text>
              <Text
                numberOfLines={2}
                className="font-regular text-sm leading-6 text-secondaryText"
              >
                {item.items
                  .map((line) => `${line.quantity} × ${line.name}`)
                  .join(", ")}
              </Text>
              <View className="flex-row justify-between gap-3">
                <Text className="font-extraBold text-lg text-textPrimary">
                  {formatCurrency(item.total)}
                </Text>
                <Text className="font-bold text-sm text-primaryText">
                  {item.status === "delivered"
                    ? "Деталі й оцінка"
                    : "Переглянути"}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            orders.status === "LoadingFirstPage" ? (
              <LoadingScreen />
            ) : (
              <View className="flex-1 items-center justify-center gap-4">
                <ReceiptText size={44} color={theme.colors.primaryText} />
                <Text className="font-bold text-xl text-textPrimary">
                  Замовлень ще немає
                </Text>
                <Text className="text-center font-regular text-base leading-6 text-secondaryText">
                  Знайди улюблену страву — і почни свою смачну історію.
                </Text>
                <AppButton
                  title="Переглянути заклади"
                  onPress={() => router.replace("/explore")}
                />
              </View>
            )
          }
          onEndReached={() => {
            if (orders.status === "CanLoadMore") orders.loadMore(15);
          }}
          ListFooterComponent={
            orders.status === "CanLoadMore" ? (
              <AppButton
                title="Показати ще"
                variant="secondary"
                onPress={() => orders.loadMore(15)}
              />
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Не вдалося завантажити замовлення"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

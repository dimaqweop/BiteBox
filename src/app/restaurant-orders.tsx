import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type ErrorBoundaryProps } from "expo-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { orderStatusLabels } from "@/constants/orders";
import { formatCurrency } from "@/lib/formatCurrency";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { DetailState } from "@/components/ui/DetailState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function RestaurantOrdersScreen() {
  const user = useQuery(api.users.getCurrentUser);
  const canManage = user?.role === "restaurant_owner" || user?.role === "admin";
  const [restaurantId, setRestaurantId] = useState<Id<"restaurants"> | null>(
    null,
  );
  const [status, setStatus] = useState<Doc<"orders">["status"] | "all">(
    "pending",
  );
  const restaurants = usePaginatedQuery(
    api.restaurantOrders.getRestaurants,
    canManage ? {} : "skip",
    { initialNumItems: 15 },
  );
  const restaurant =
    restaurants.results.find((item) => item._id === restaurantId) ??
    restaurants.results[0];
  const orders = usePaginatedQuery(
    api.restaurantOrders.getOrders,
    canManage && restaurant
      ? {
          restaurantId: restaurant._id,
          ...(status === "all" ? {} : { status }),
        }
      : "skip",
    { initialNumItems: 15 },
  );
  const filters = [
    { value: "all" as const, label: "Усі" },
    ...Object.entries(orderStatusLabels).map(([value, label]) => ({
      value: value as Doc<"orders">["status"],
      label,
    })),
  ];

  if (user === undefined) return <LoadingScreen />;
  if (!canManage)
    return (
      <DetailState
        title="Доступ для ресторану"
        message="Керування замовленнями доступне власнику прив’язаного закладу."
      />
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <View className="gap-4 px-5 pt-4">
          <BackButton />
          <Text
            accessibilityRole="header"
            className="font-extraBold text-3xl text-textPrimary"
          >
            Замовлення ресторану
          </Text>
          <Text className="font-regular text-sm leading-6 text-secondaryText">
            Нові замовлення з’являються тут автоматично. Відкрий замовлення, щоб
            підтвердити його або змінити статус.
          </Text>
        </View>
        {!restaurant ? (
          restaurants.status === "LoadingFirstPage" ? (
            <LoadingScreen />
          ) : (
            <View className="flex-1 justify-center gap-3 px-5">
              <Text className="font-bold text-xl text-textPrimary">
                Заклад ще не прив’язано
              </Text>
              <Text className="font-regular text-base leading-6 text-secondaryText">
                Після прив’язки акаунта до ресторану тут з’являться його
                замовлення.
              </Text>
            </View>
          )
        ) : (
          <>
            <View className="gap-3 py-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {restaurants.results.map((item) => (
                  <Pressable
                    key={item._id}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: restaurant._id === item._id,
                    }}
                    onPress={() => setRestaurantId(item._id)}
                    className={`min-h-12 justify-center rounded-2xl border px-4 ${restaurant._id === item._id ? "border-primary bg-primaryLight" : "border-border bg-surface"}`}
                  >
                    <Text className="font-bold text-sm text-textPrimary">
                      {item.name} · {item.city}
                    </Text>
                  </Pressable>
                ))}
                {restaurants.status === "CanLoadMore" ? (
                  <AppButton
                    title="Ще заклади"
                    variant="secondary"
                    onPress={() => restaurants.loadMore(15)}
                  />
                ) : null}
              </ScrollView>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {filters.map((filter) => (
                  <Pressable
                    key={filter.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: status === filter.value }}
                    onPress={() => setStatus(filter.value)}
                    className={`min-h-12 justify-center rounded-2xl border px-4 ${status === filter.value ? "border-primary bg-primaryLight" : "border-border bg-surface"}`}
                  >
                    <Text className="font-semibold text-sm text-textPrimary">
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <FlatList
              data={orders.results}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{
                padding: 20,
                paddingTop: 0,
                gap: 16,
                flexGrow: 1,
              }}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Замовлення ${item._id.slice(-6)}, ${orderStatusLabels[item.status]}`}
                  onPress={() =>
                    router.push({
                      pathname: "/restaurant-order/[id]",
                      params: { id: item._id },
                    })
                  }
                  className="gap-3 rounded-3xl border border-border bg-surface p-5"
                >
                  <View className="flex-row justify-between gap-3">
                    <Text className="font-bold text-lg text-textPrimary">
                      #{item._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text className="font-extraBold text-lg text-textPrimary">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                  <Text className="font-bold text-sm text-primaryText">
                    {orderStatusLabels[item.status]}
                  </Text>
                  <Text className="font-regular text-xs text-secondaryText">
                    {new Date(item.createdAt).toLocaleString("uk-UA")}
                  </Text>
                  <Text className="font-semibold text-base text-textPrimary">
                    {item.contactName}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="font-regular text-sm leading-6 text-secondaryText"
                  >
                    {item.items
                      .map((line) => `${line.quantity} × ${line.name}`)
                      .join(", ")}
                  </Text>
                  <Text className="font-bold text-sm text-primaryText">
                    Відкрити замовлення
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                orders.status === "LoadingFirstPage" ? (
                  <LoadingScreen />
                ) : (
                  <View className="flex-1 justify-center gap-3">
                    <Text className="text-center font-bold text-xl text-textPrimary">
                      Замовлень із цим статусом немає
                    </Text>
                    <Text className="text-center font-regular text-base leading-6 text-secondaryText">
                      Обери інший статус або зачекай на нові замовлення.
                    </Text>
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
          </>
        )}
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

import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  router,
  useLocalSearchParams,
  type ErrorBoundaryProps,
} from "expo-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Clock3, MapPin, ShoppingBag, Star, Truck } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Food } from "@/types/catalog";
import { theme } from "@/constants/theme";
import { formatCurrency } from "@/lib/formatCurrency";
import { useCart } from "@/providers/CartProvider";
import { AppButton } from "@/components/ui/AppButton";
import { FoodImage } from "@/components/ui/FoodImage";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackButton } from "@/components/navigation/BackButton";
import { FavoriteButton } from "@/components/restaurant/FavoriteButton";
import { MenuItemCard } from "@/components/food/MenuItemCard";
import { FloatingCartSummary } from "@/components/cart/FloatingCartSummary";
import { DetailState } from "@/components/ui/DetailState";

type MenuRow =
  { kind: "hero" } | { kind: "categories" } | { kind: "food"; food: Food };

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reference = typeof id === "string" ? id : "";
  const details = useQuery(api.catalog.getRestaurant, { reference });
  const [categoryId, setCategoryId] = useState<Id<"categories">>();
  const listRef = useRef<FlatList<MenuRow>>(null);
  const cart = useCart();
  const menu = usePaginatedQuery(
    api.catalog.menu,
    details ? { restaurantId: details.restaurant._id, categoryId } : "skip",
    { initialNumItems: 20 },
  );

  if (details === undefined) return <LoadingScreen />;
  if (!details)
    return (
      <DetailState
        title="Заклад недоступний"
        message="Цей заклад більше не приймає відвідувачів або посилання некоректне."
      />
    );

  const { restaurant, categories } = details;
  const rows: MenuRow[] = [
    { kind: "hero" },
    { kind: "categories" },
    ...menu.results.map((food) => ({ kind: "food" as const, food })),
  ];

  function openFood(food: Food) {
    router.push({ pathname: "/food/[id]", params: { id: food._id } });
  }

  function selectCategory(next?: Id<"categories">) {
    setCategoryId(next);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  function renderRow({ item }: { item: MenuRow }) {
    if (item.kind === "food")
      return (
        <MenuItemCard
          food={item.food}
          canAdd={restaurant.isOpen && item.food.isAvailable}
          onPress={() => openFood(item.food)}
          onAdd={() => cart.add(item.food, restaurant)}
        />
      );

    if (item.kind === "categories")
      return (
        <View className="bg-background pb-4 pt-2">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            data={[{ _id: undefined, name: "Усе меню" }, ...categories]}
            keyExtractor={(item) => item._id ?? "all"}
            renderItem={({ item: category }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: categoryId === category._id }}
                onPress={() => selectCategory(category._id)}
                className={`min-h-12 justify-center rounded-2xl border px-4 ${categoryId === category._id ? "border-primary bg-primaryLight" : "border-border bg-surface"}`}
              >
                <Text
                  className={`font-bold text-sm ${categoryId === category._id ? "text-primaryText" : "text-secondaryText"}`}
                >
                  {category.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      );

    return (
      <View>
        <View>
          <FoodImage
            uri={restaurant.imageUrl}
            label={restaurant.name}
            style={{ height: 260 }}
          />
          <View className="absolute inset-x-5 top-3 flex-row items-start justify-between">
            <BackButton />
            <FavoriteButton restaurant={restaurant} />
          </View>
        </View>
        <View className="gap-4 px-5 pb-4 pt-6">
          <View className="self-start rounded-full bg-primaryLight px-3 py-2">
            <Text className="font-bold text-xs text-primaryText">
              {restaurant.isOpen
                ? "Відчинено · готуємо для тебе"
                : "Зараз зачинено"}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            className="font-extraBold text-3xl text-textPrimary"
          >
            {restaurant.name}
          </Text>
          <Text className="font-medium text-sm text-secondaryText">
            {restaurant.cuisineTypes.join(" · ")}
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center gap-1">
              <Star
                size={17}
                color={theme.colors.primaryText}
                fill={theme.colors.primary}
              />
              <Text className="font-bold text-sm text-textPrimary">
                {restaurant.ratingAverage.toFixed(1)}
              </Text>
              {restaurant.ratingCount > 0 ? (
                <Text className="font-regular text-xs text-secondaryText">
                  ({restaurant.ratingCount})
                </Text>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1">
              <Clock3 size={17} color={theme.colors.primaryText} />
              <Text className="font-semibold text-sm text-textPrimary">
                ≈ {restaurant.estimatedDeliveryMinutes} хв
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Truck size={17} color={theme.colors.primaryText} />
              <Text className="font-semibold text-sm text-textPrimary">
                {formatCurrency(restaurant.deliveryFee)}
              </Text>
            </View>
          </View>
          <Text className="font-regular text-base leading-6 text-secondaryText">
            {restaurant.description}
          </Text>
          <View className="flex-row items-center gap-2">
            <MapPin size={16} color={theme.colors.secondaryText} />
            <Text className="flex-1 font-medium text-sm text-secondaryText">
              {restaurant.address}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text
              accessibilityRole="header"
              className="font-bold text-2xl text-textPrimary"
            >
              Меню
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Відкрити кошик, ${cart.count} страв`}
              onPress={() => router.push("/cart")}
              className="min-h-12 flex-row items-center gap-2 px-3"
            >
              <ShoppingBag size={20} color={theme.colors.primaryText} />
              <Text className="font-bold text-sm text-primaryText">
                {cart.count || "Кошик"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(item) =>
            item.kind === "food" ? item.food._id : item.kind
          }
          renderItem={renderRow}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (menu.status === "CanLoadMore") menu.loadMore(20);
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={
            <View className="gap-3 px-5">
              {menu.isLoading ? (
                <ActivityIndicator
                  accessibilityLabel="Завантаження меню"
                  color={theme.colors.primaryText}
                  className="py-6"
                />
              ) : menu.results.length === 0 ? (
                <Text className="py-8 text-center font-medium text-base text-secondaryText">
                  У цій категорії поки немає страв.
                </Text>
              ) : null}
              {menu.status === "CanLoadMore" ? (
                <AppButton
                  title="Більше страв"
                  variant="secondary"
                  onPress={() => menu.loadMore(20)}
                />
              ) : null}
              {cart.notice ? (
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-center font-semibold text-sm text-primaryText"
                >
                  {cart.notice}
                </Text>
              ) : null}
            </View>
          }
        />
        <FloatingCartSummary />
      </View>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Не вдалося завантажити заклад"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

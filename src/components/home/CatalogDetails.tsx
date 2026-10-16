import { ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Food, Restaurant } from "@/types/catalog";
import { Sheet } from "@/components/ui/Sheet";
import { FoodImage } from "@/components/ui/FoodImage";
import { formatCurrency } from "@/lib/formatCurrency";
import { theme } from "@/constants/theme";
import { FoodCard } from "@/components/food/FoodCard";

export function CatalogDetails({ restaurant, food, onClose, onFood }: { restaurant: Restaurant | null; food: Food | null; onClose: () => void; onFood: (food: Food) => void }) {
  const menu = useQuery(api.home.getRestaurantMenu, restaurant ? { restaurantId: restaurant._id } : "skip");
  return <Sheet visible={!!restaurant || !!food} title={food?.name ?? restaurant?.name ?? "Меню закладу"} onClose={onClose}>
    {food ? <FoodContent food={food} /> : restaurant ? <View className="gap-4 pb-4">
      <FoodImage uri={restaurant.imageUrl} label={restaurant.name} style={{ height: 200, borderRadius: 20 }} />
      <Text className="font-regular text-sm leading-6 text-secondaryText">{restaurant.description}</Text>
      <View className="flex-row flex-wrap gap-3"><Text className="font-semibold text-sm text-textPrimary">{restaurant.estimatedDeliveryMinutes} хв</Text><Text className="font-semibold text-sm text-textPrimary">Доставка {formatCurrency(restaurant.deliveryFee)}</Text></View>
      {restaurant.isDemo ? <Text className="rounded-xl bg-primaryLight p-3 font-medium text-xs leading-5 text-primaryText">Демонстраційний заклад. Ціни, рейтинг і час доставки наведені для прикладу. Оформлення замовлень недоступне.</Text> : null}
      <Text className="font-bold text-lg text-textPrimary">Меню</Text>
      {menu === undefined ? <ActivityIndicator color={theme.colors.primaryText} /> : menu.length ? <View className="flex-row flex-wrap gap-3">{menu.map((food) => <View key={food._id} style={{ width: "47%" }}><FoodCard food={food} onPress={() => onFood(food)} /></View>)}</View> : <Text className="font-regular text-sm text-secondaryText">Меню поки порожнє.</Text>}
    </View> : null}
  </Sheet>;
}

function FoodContent({ food }: { food: Food }) {
  return <View className="gap-4 pb-4"><FoodImage uri={food.imageUrl} label={food.name} style={{ height: 240, borderRadius: 20 }} />
      <Text className="font-medium text-sm text-secondaryText">{food.restaurantName}</Text><Text className="font-extraBold text-2xl text-textPrimary">{formatCurrency(food.price)}</Text>
      <Text className="font-regular text-base leading-6 text-secondaryText">{food.description}</Text>
      <Text className="font-bold text-lg text-textPrimary">Інгредієнти</Text><Text className="font-regular text-sm leading-6 text-secondaryText">{food.ingredients.join(", ")}</Text>
      {food.isDemo ? <Text className="rounded-xl bg-primaryLight p-3 font-medium text-xs text-primaryText">Демо-страва. Оформлення замовлень ще недоступне.</Text> : null}
    </View>;
}

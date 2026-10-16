import { Pressable, Text, View } from "react-native";
import { ArrowUpRight } from "lucide-react-native";
import type { Food } from "@/types/catalog";
import { FoodImage } from "@/components/ui/FoodImage";
import { formatCurrency } from "@/lib/formatCurrency";
import { theme } from "@/constants/theme";

export function FoodCard({ food, onPress }: { food: Food; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Переглянути ${food.name}, ${formatCurrency(food.price)}`} onPress={onPress} className="mb-4 flex-1 overflow-hidden rounded-3xl border border-border bg-surface">
    <FoodImage uri={food.imageUrl} label={food.name} style={{ width: "100%", aspectRatio: 1.2 }} />
    <View className="gap-2 p-3"><Text numberOfLines={2} className="min-h-10 font-bold text-sm text-textPrimary">{food.name}</Text><Text numberOfLines={1} className="font-regular text-xs text-secondaryText">{food.restaurantName}</Text>
      <View className="flex-row items-center justify-between"><Text className="font-bold text-base text-textPrimary">{formatCurrency(food.price)}</Text><View className="h-8 w-8 items-center justify-center rounded-full bg-primaryLight"><ArrowUpRight size={16} color={theme.colors.primaryText} /></View></View>
    </View>
  </Pressable>;
}

import { Pressable, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import type { Food } from "@/types/catalog";
import { FoodImage } from "@/components/ui/FoodImage";
import { formatCurrency } from "@/lib/formatCurrency";
import { theme } from "@/constants/theme";

export function MenuItemCard({
  food,
  canAdd,
  onPress,
  onAdd,
}: {
  food: Food;
  canAdd: boolean;
  onPress: () => void;
  onAdd: () => void;
}) {
  return (
    <View className="mx-5 mb-4 overflow-hidden rounded-3xl border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Переглянути ${food.name}`}
        onPress={onPress}
        className="flex-row gap-4 p-4"
      >
        <View className="flex-1 gap-2">
          <Text className="font-bold text-base text-textPrimary">
            {food.name}
          </Text>
          <Text
            numberOfLines={2}
            className="font-regular text-sm leading-5 text-secondaryText"
          >
            {food.description}
          </Text>
          <Text className="font-bold text-base text-textPrimary">
            {formatCurrency(food.price)}
          </Text>
        </View>
        <FoodImage
          uri={food.imageUrl}
          label={food.name}
          style={{ width: 100, height: 104, borderRadius: 20 }}
        />
      </Pressable>
      <View className="flex-row items-center justify-between gap-3 border-t border-border px-4 py-2">
        <Text className="flex-1 font-medium text-xs text-secondaryText">
          {!food.isAvailable
            ? "Тимчасово недоступно"
            : canAdd
              ? "Готуємо для тебе"
              : "Заклад зачинено"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Додати ${food.name} до кошика`}
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={onAdd}
          className={`min-h-12 flex-row items-center gap-1 rounded-xl px-3 ${canAdd ? "bg-primaryLight" : "bg-background"}`}
        >
          <Plus size={16} color={theme.colors.primaryText} />
          <Text className="font-bold text-sm text-primaryText">Додати</Text>
        </Pressable>
      </View>
    </View>
  );
}

import { Pressable, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { MAX_ITEM_QUANTITY } from "@/lib/cart";

export function QuantitySelector({
  value,
  onChange,
  minimum = 1,
  label = "Кількість",
}: {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  label?: string;
}) {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: зменшити`}
        accessibilityState={{ disabled: value <= minimum }}
        disabled={value <= minimum}
        onPress={() => onChange(value - 1)}
        className="h-12 w-12 items-center justify-center"
        style={{ opacity: value <= minimum ? 0.35 : 1 }}
      >
        <Minus size={18} color={theme.colors.textPrimary} />
      </Pressable>
      <Text
        accessibilityLabel={`${label}: ${value}`}
        accessibilityLiveRegion="polite"
        className="min-w-8 text-center font-bold text-base text-textPrimary"
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: збільшити`}
        accessibilityState={{ disabled: value >= MAX_ITEM_QUANTITY }}
        disabled={value >= MAX_ITEM_QUANTITY}
        onPress={() => onChange(value + 1)}
        className="h-12 w-12 items-center justify-center"
        style={{ opacity: value >= MAX_ITEM_QUANTITY ? 0.35 : 1 }}
      >
        <Plus size={18} color={theme.colors.textPrimary} />
      </Pressable>
    </View>
  );
}

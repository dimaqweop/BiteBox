import { Pressable, Text, View } from "react-native";

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-3">
      <Text className="font-bold text-base text-textPrimary">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected: value === option.value }}
            onPress={() => onChange(option.value)}
            className={`min-h-12 justify-center rounded-2xl border px-4 ${value === option.value ? "border-primary bg-primaryLight" : "border-border bg-background"}`}
          >
            <Text
              className={`font-semibold text-sm ${value === option.value ? "text-primaryText" : "text-secondaryText"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

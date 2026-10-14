import { ActivityIndicator, Text, View } from "react-native";
import { theme } from "@/constants/theme";

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background" accessibilityLabel="Завантаження">
      <ActivityIndicator color={theme.colors.primaryText} size="large" />
      <Text className="font-medium text-sm text-secondaryText">Завантажуємо BiteBox…</Text>
    </View>
  );
}

import { Text, View } from "react-native";
import { UtensilsCrossed } from "lucide-react-native";
import { theme } from "@/constants/theme";

export function Brand() {
  return (
    <View className="flex-row items-center gap-3" accessibilityLabel="BiteBox">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
        <UtensilsCrossed size={24} color={theme.colors.textPrimary} strokeWidth={2} />
      </View>
      <Text className="font-extraBold text-2xl text-textPrimary">Bite<Text className="text-primaryText">Box</Text></Text>
    </View>
  );
}

import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "@/constants/theme";

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View className="mb-4 flex-row items-center justify-between gap-2">
    <Text accessibilityRole="header" className="flex-1 font-bold text-xl text-textPrimary">{title}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} className="min-h-12 flex-row items-center gap-1">
      <Text className="font-semibold text-sm text-primaryText">{action}</Text><ChevronRight size={16} color={theme.colors.primaryText} />
    </Pressable> : null}
  </View>;
}

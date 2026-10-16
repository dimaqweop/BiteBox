import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { theme } from "@/constants/theme";

export function BackButton() {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Назад"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/home");
      }}
      className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface"
    >
      <ArrowLeft size={22} color={theme.colors.textPrimary} />
    </AnimatedPressable>
  );
}

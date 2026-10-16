import { Text, View } from "react-native";
import { SearchX } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { AppButton } from "./AppButton";

export function EmptyState({
  title,
  message,
  onReset,
}: {
  title: string;
  message: string;
  onReset?: () => void;
}) {
  return (
    <View className="items-center gap-3 rounded-3xl border border-border bg-surface px-5 py-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primaryLight">
        <SearchX size={28} color={theme.colors.primaryText} />
      </View>
      <Text className="text-center font-bold text-lg text-textPrimary">
        {title}
      </Text>
      <Text className="text-center font-regular text-sm leading-6 text-secondaryText">
        {message}
      </Text>
      {onReset ? (
        <View className="mt-3 w-full">
          <AppButton
            title="Скинути фільтри"
            variant="secondary"
            onPress={onReset}
          />
        </View>
      ) : null}
    </View>
  );
}

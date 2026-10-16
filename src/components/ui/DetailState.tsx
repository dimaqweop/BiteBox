import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "./AppButton";

export function DetailState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <BackButton />
      <View className="w-full max-w-lg flex-1 justify-center gap-4 self-center">
        <Text
          accessibilityRole="header"
          className="font-bold text-2xl text-textPrimary"
        >
          {title}
        </Text>
        <Text className="font-regular text-base leading-6 text-secondaryText">
          {message}
        </Text>
        {onRetry ? (
          <AppButton title="Спробувати ще раз" onPress={onRetry} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

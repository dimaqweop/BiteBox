import "../../global.css";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { useFonts } from "expo-font";
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { authStorage } from "@/lib/authStorage";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { theme } from "@/constants/theme";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false }) : null;

function RootNavigator() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <LoadingScreen />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!fontsLoaded && !fontError ? <LoadingScreen /> : convex ? (
        <ConvexAuthProvider client={convex} storage={authStorage} shouldHandleCode={false}>
          <RootNavigator />
        </ConvexAuthProvider>
      ) : (
        <View className="flex-1 items-center justify-center bg-background px-5">
          <Text className="font-bold text-xl text-textPrimary">Не вдалося підключити BiteBox</Text>
          <Text className="mt-3 text-center font-regular text-base text-secondaryText">Сервіс входу ще не налаштований. Спробуйте пізніше.</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

import "../../global.css";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { authStorage } from "@/lib/authStorage";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { theme } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { CartProvider } from "@/providers/CartProvider";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;

function RootNavigator() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  if (isLoading || (isAuthenticated && user === undefined)) {
    return <LoadingScreen />;
  }
  return (
    <CartProvider key={user?._id ?? "guest"} ownerId={user?._id ?? "guest"}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="restaurant/[id]" />
          <Stack.Screen name="food/[id]" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="restaurant-orders" />
          <Stack.Screen name="restaurant-order/[id]" />
        </Stack.Protected>
      </Stack>
    </CartProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!fontsLoaded && !fontError ? (
        <LoadingScreen />
      ) : convex ? (
        <ConvexAuthProvider
          client={convex}
          storage={authStorage}
          shouldHandleCode={false}
        >
          <RootNavigator />
        </ConvexAuthProvider>
      ) : (
        <View className="flex-1 items-center justify-center bg-background px-5">
          <Text className="font-bold text-xl text-textPrimary">
            Не вдалося підключити BiteBox
          </Text>
          <Text className="mt-3 text-center font-regular text-base text-secondaryText">
            Сервіс входу ще не налаштований. Спробуйте пізніше.
          </Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

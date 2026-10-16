import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { Check, LogOut, Mail, Phone, UserRound } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { AppButton } from "@/components/ui/AppButton";
import { Brand } from "@/components/auth/Brand";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { theme } from "@/constants/theme";

export default function ProfileScreen() {
  const user = useQuery(api.users.getCurrentUser);
  const { signOut } = useAuthActions();
  const signingOut = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function logout() {
    if (signingOut.current) return;
    signingOut.current = true;
    setLoading(true);
    setError(undefined);
    try {
      await signOut();
    } catch {
      setError("Не вдалося вийти. Перевірте з’єднання та спробуйте ще раз.");
    } finally {
      signingOut.current = false;
      setLoading(false);
    }
  }

  if (user === undefined) return <LoadingScreen />;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-lg flex-1 self-center px-5 py-6">
          <Brand />
          <View className="mb-8 mt-10 gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primaryLight">
              <UserRound size={28} color={theme.colors.primaryText} />
            </View>
            <Text
              accessibilityRole="header"
              className="font-extraBold text-3xl text-textPrimary"
            >
              Привіт{user?.name ? `, ${user.name}` : ""}!
            </Text>
            <Text className="font-regular text-base leading-6 text-secondaryText">
              {user
                ? "Раді, що ти з BiteBox.\nТвій профіль уже готовий."
                : "Сесію завершено. Увійди знову, щоб продовжити."}
            </Text>
          </View>
          {user ? (
            <View className="gap-5 rounded-3xl border border-border bg-surface p-5">
              <Text className="font-bold text-lg text-textPrimary">
                Особисті дані
              </Text>
              <View className="flex-row items-center gap-3">
                <Mail size={20} color={theme.colors.secondaryText} />
                <View className="flex-1 gap-1">
                  <Text className="font-regular text-xs text-secondaryText">
                    Електронна пошта
                  </Text>
                  <Text
                    selectable
                    className="font-medium text-base text-textPrimary"
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row items-center gap-3">
                <Phone size={20} color={theme.colors.secondaryText} />
                <View className="flex-1 gap-1">
                  <Text className="font-regular text-xs text-secondaryText">
                    Телефон
                  </Text>
                  <Text
                    selectable
                    className="font-medium text-base text-textPrimary"
                  >
                    {user.phone ?? "Не вказано"}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          {user ? (
            <View className="mt-6 flex-row items-center gap-2">
              <Check size={18} color={theme.colors.primaryText} />
              <Text className="font-medium text-sm text-secondaryText">
                Ти успішно увійшов у свій акаунт
              </Text>
            </View>
          ) : null}
          <View className="mt-auto gap-4 pt-10">
            {user?.role === "restaurant_owner" || user?.role === "admin" ? (
              <AppButton
                title="Замовлення ресторану"
                onPress={() => router.push("/restaurant-orders")}
              />
            ) : null}
            <AppButton
              title="Улюблені заклади"
              variant="secondary"
              onPress={() => router.push("/favorites")}
            />
            <AppButton
              title="Мої замовлення"
              variant="secondary"
              onPress={() => router.push("/orders")}
            />
            {error ? (
              <Text
                accessibilityRole="alert"
                className="font-medium text-sm text-errorText"
              >
                {error}
              </Text>
            ) : null}
            <AppButton
              title="Вийти з акаунта"
              variant="secondary"
              loading={loading}
              onPress={() => void logout()}
              icon={<LogOut size={20} color={theme.colors.primaryText} />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

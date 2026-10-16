import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type ErrorBoundaryProps } from "expo-router";
import { usePaginatedQuery } from "convex/react";
import { Heart } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { theme } from "@/constants/theme";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { DetailState } from "@/components/ui/DetailState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

export default function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const favorites = usePaginatedQuery(
    api.favorites.getFavorites,
    {},
    { initialNumItems: 12 },
  );
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <View className="flex-row items-center gap-4 px-5 py-3">
          <BackButton />
          <Text
            accessibilityRole="header"
            className="font-extraBold text-2xl text-textPrimary"
          >
            Улюблені заклади
          </Text>
        </View>
        <FlatList
          data={favorites.results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              width={Math.min(width, 672) - 40}
              onPress={() =>
                router.push({
                  pathname: "/restaurant/[id]",
                  params: { id: item._id },
                })
              }
            />
          )}
          ListEmptyComponent={
            favorites.status === "LoadingFirstPage" ? (
              <LoadingScreen />
            ) : favorites.status === "Exhausted" ? (
              <View className="flex-1 items-center justify-center gap-4 py-12">
                <Heart size={44} color={theme.colors.primaryText} />
                <Text className="text-center font-bold text-xl text-textPrimary">
                  Твої улюблені смаки — тут
                </Text>
                <Text className="text-center font-regular text-base leading-6 text-secondaryText">
                  Натискай на сердечко біля закладу, щоб зберегти його.
                </Text>
                <AppButton
                  title="Знайти заклад"
                  onPress={() => router.push("/explore")}
                />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (favorites.results.length && favorites.status === "CanLoadMore")
              favorites.loadMore(12);
          }}
          ListFooterComponent={
            favorites.status === "CanLoadMore" ? (
              <AppButton
                title="Показати ще"
                variant="secondary"
                onPress={() => favorites.loadMore(12)}
              />
            ) : favorites.status === "LoadingMore" ? (
              <Text className="py-5 text-center font-medium text-sm text-secondaryText">
                Завантажуємо…
              </Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Не вдалося завантажити улюблені"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

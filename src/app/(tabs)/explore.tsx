import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  router,
  useLocalSearchParams,
  type ErrorBoundaryProps,
} from "expo-router";
import {
  useConvexConnectionState,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import type { FunctionArgs } from "convex/server";
import { api } from "@/convex/_generated/api";
import { theme } from "@/constants/theme";
import type { Food, Restaurant } from "@/types/catalog";
import { AppButton } from "@/components/ui/AppButton";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { CategoryList } from "@/components/home/CategoryList";
import { FloatingCartSummary } from "@/components/cart/FloatingCartSummary";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { FoodCard } from "@/components/food/FoodCard";

type Mode = "restaurants" | "dishes";
type RestaurantSort = FunctionArgs<typeof api.explore.restaurants>["sort"];
type DishSort = FunctionArgs<typeof api.explore.dishes>["sort"];
type Filters = {
  cuisine: string;
  rating: string;
  price: string;
  time: string;
  onlyOpen: boolean;
};
const emptyFilters: Filters = {
  cuisine: "",
  rating: "",
  price: "",
  time: "",
  onlyOpen: false,
};
const cities = ["Львів", "Київ", "Одеса"];
const cuisines = [
  "Італійська кухня",
  "Американська кухня",
  "Японська кухня",
  "Здорова їжа",
  "Кондитерська",
  "Кав’ярня",
];
const restaurantSorts: { value: RestaurantSort; label: string }[] = [
  { value: "recommended", label: "Рекомендовані" },
  { value: "rating", label: "Найвищий рейтинг" },
  { value: "fastest", label: "Найшвидша доставка" },
  { value: "delivery", label: "Найдешевша доставка" },
];
const dishSorts: { value: DishSort; label: string }[] = [
  { value: "recommended", label: "Рекомендовані" },
  { value: "priceAsc", label: "Спочатку дешевші" },
  { value: "priceDesc", label: "Спочатку дорожчі" },
];
const prices: Record<string, { minPrice?: number; maxPrice?: number }> = {
  "": {},
  low: { maxPrice: 200 },
  middle: { minPrice: 200, maxPrice: 350 },
  high: { minPrice: 350 },
};
function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    city?: string;
    search?: string;
    category?: string;
    intent?: string;
    filters?: string;
  }>();
  const incomingCity = single(params.city);
  const incomingSearch = single(params.search).slice(0, 100);
  const incomingCategory = single(params.category);
  const intent = single(params.intent);
  const [request, setRequest] = useState({
    intent,
    city: cities.includes(incomingCity) ? incomingCity : cities[0],
    search: incomingSearch,
    category: incomingCategory,
  });
  const [debouncedSearch, setDebouncedSearch] = useState(incomingSearch.trim());
  const [mode, setMode] = useState<Mode>("restaurants");
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [restaurantSort, setRestaurantSort] =
    useState<RestaurantSort>("recommended");
  const [dishSort, setDishSort] = useState<DishSort>("recommended");
  const [sheet, setSheet] = useState<"city" | "filters" | "sort" | null>(
    params.filters === "1" ? "filters" : null,
  );
  const { width } = useWindowDimensions();
  const connection = useConvexConnectionState();
  const categories = useQuery(api.explore.getCategories);
  const automaticPages = useRef(0);
  const listRef = useRef<FlatList<Restaurant | Food>>(null);
  // An explicit Home navigation is a new request; ordinary tab switches preserve local filters.
  if (intent && intent !== request.intent) {
    setRequest({
      intent,
      city: cities.includes(incomingCity) ? incomingCity : cities[0],
      search: incomingSearch,
      category: incomingCategory,
    });
    setDebouncedSearch(incomingSearch.trim());
    setFilters(emptyFilters);
    setMode("restaurants");
    setDraft(emptyFilters);
    setSheet(params.filters === "1" ? "filters" : null);
  }
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(request.search.trim()),
      300,
    );
    return () => clearTimeout(timeout);
  }, [request.search]);
  const categoryId = categories?.find(
    (category) => category.slug === request.category,
  )?._id;
  const args = {
    city: request.city,
    categoryId,
    search: debouncedSearch || undefined,
    cuisine: filters.cuisine || undefined,
    minRating: filters.rating ? Number(filters.rating) : undefined,
    maxDeliveryMinutes: filters.time ? Number(filters.time) : undefined,
    onlyOpen: filters.onlyOpen,
    ...prices[filters.price],
  };
  const restaurants = usePaginatedQuery(
    api.explore.restaurants,
    mode === "restaurants" && categories
      ? { ...args, sort: debouncedSearch ? "recommended" : restaurantSort }
      : "skip",
    { initialNumItems: 12 },
  );
  const dishes = usePaginatedQuery(
    api.explore.dishes,
    mode === "dishes" && categories
      ? { ...args, sort: debouncedSearch ? "recommended" : dishSort }
      : "skip",
    { initialNumItems: 12 },
  );
  const result = mode === "restaurants" ? restaurants : dishes;
  const { status, loadMore } = result;
  const count = result.results.length;
  const queryKey = JSON.stringify({ ...args, mode, restaurantSort, dishSort });
  useEffect(() => {
    automaticPages.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [queryKey]);
  // Filtering can leave a native page empty before the cursor is exhausted.
  useEffect(() => {
    if (count === 0 && status === "CanLoadMore" && automaticPages.current < 5) {
      automaticPages.current += 1;
      loadMore(12);
    }
  }, [count, status, loadMore, queryKey]);
  const busy =
    !categories ||
    status === "LoadingFirstPage" ||
    (count === 0 && status === "LoadingMore");
  const filterCount = Object.values(filters).filter(Boolean).length;
  const filtering = filterCount > 0 || !!request.category || !!request.search;
  const sortLabel = debouncedSearch
    ? "За відповідністю"
    : mode === "restaurants"
      ? restaurantSorts.find((item) => item.value === restaurantSort)!.label
      : dishSorts.find((item) => item.value === dishSort)!.label;
  const contentWidth = Math.min(width, 660);
  function reset() {
    setFilters(emptyFilters);
    setRequest((current) => ({ ...current, search: "", category: "" }));
    setDebouncedSearch("");
  }
  function changeMode(next: Mode) {
    setMode(next);
  }
  function nextPage() {
    if (status === "CanLoadMore") loadMore(12);
  }

  const header = (
    <View className="gap-5 pb-5 pt-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="gap-1">
          <Text className="font-medium text-sm text-secondaryText">
            Знайди свій смак
          </Text>
          <Text
            accessibilityRole="header"
            className="font-extraBold text-[28px] text-textPrimary"
          >
            Пошук
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Місто доставки: ${request.city}. Змінити місто`}
          onPress={() => setSheet("city")}
          className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border bg-surface px-3"
        >
          <MapPin size={17} color={theme.colors.primaryText} />
          <Text className="font-bold text-sm text-textPrimary">
            {request.city}
          </Text>
          <ChevronDown size={14} color={theme.colors.secondaryText} />
        </Pressable>
      </View>
      <View className="flex-row items-center rounded-2xl border border-border bg-surface pl-4">
        <Search size={20} color={theme.colors.secondaryText} />
        <TextInput
          accessibilityLabel="Пошук страв або закладів"
          value={request.search}
          onChangeText={(search) =>
            setRequest((current) => ({ ...current, search }))
          }
          placeholder="Пошук страв або закладів"
          placeholderTextColor={theme.colors.secondaryText}
          maxLength={100}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => {
            setDebouncedSearch(request.search.trim());
            Keyboard.dismiss();
          }}
          className="min-h-14 flex-1 px-3 font-regular text-sm text-textPrimary"
        />
        {request.search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Очистити пошук"
            onPress={() => {
              setRequest((current) => ({ ...current, search: "" }));
              setDebouncedSearch("");
            }}
            className="h-12 w-12 items-center justify-center"
          >
            <X size={20} color={theme.colors.secondaryText} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row gap-2 rounded-2xl bg-primaryLight p-1">
        {(
          [
            { value: "restaurants", label: "Заклади" },
            { value: "dishes", label: "Страви" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === item.value }}
            onPress={() => changeMode(item.value)}
            className={`min-h-12 flex-1 items-center justify-center rounded-xl ${mode === item.value ? "bg-surface" : "bg-primaryLight"}`}
          >
            <Text
              className={`font-bold text-sm ${mode === item.value ? "text-textPrimary" : "text-primaryText"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {categories ? (
        <CategoryList
          categories={categories}
          selected={categoryId}
          onSelect={(id) => {
            const slug = categories.find((item) => item._id === id)!.slug;
            setRequest((current) => ({
              ...current,
              category: current.category === slug ? "" : slug,
            }));
          }}
        />
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Фільтри${filterCount ? `, застосовано ${filterCount}` : ""}`}
          onPress={() => {
            Keyboard.dismiss();
            setDraft({ ...filters });
            setSheet("filters");
          }}
          className={`min-h-12 flex-row items-center gap-2 rounded-2xl border px-4 ${filterCount ? "border-primary bg-primaryLight" : "border-border bg-surface"}`}
        >
          <SlidersHorizontal size={18} color={theme.colors.primaryText} />
          <Text className="font-bold text-sm text-textPrimary">
            Фільтри{filterCount ? ` · ${filterCount}` : ""}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Сортування: ${sortLabel}`}
          accessibilityState={{ disabled: !!debouncedSearch }}
          disabled={!!debouncedSearch}
          onPress={() => setSheet("sort")}
          className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border bg-surface px-3"
        >
          <ArrowDownUp size={17} color={theme.colors.secondaryText} />
          <Text className="font-semibold text-xs text-secondaryText">
            {sortLabel}
          </Text>
        </Pressable>
      </View>
      {filtering ? (
        <Pressable
          accessibilityRole="button"
          onPress={reset}
          className="min-h-12 justify-center self-start"
        >
          <Text className="font-semibold text-sm text-primaryText">
            Скинути пошук і фільтри
          </Text>
        </Pressable>
      ) : null}
      {!connection.isWebSocketConnected &&
      (connection.hasEverConnected || connection.connectionRetries > 0) ? (
        <Text
          accessibilityLiveRegion="polite"
          className="rounded-2xl bg-primaryLight p-4 font-medium text-sm leading-5 text-primaryText"
        >
          Відновлюємо з’єднання… Результати оновляться автоматично.
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="font-bold text-xl text-textPrimary"
        >
          {mode === "restaurants" ? "Заклади" : "Страви"}
        </Text>
        {!busy && count > 0 ? (
          <Text
            accessibilityLiveRegion="polite"
            className="font-medium text-xs text-secondaryText"
          >
            Показано {count}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList<Restaurant | Food>
        ref={listRef}
        key={mode}
        data={result.results}
        keyExtractor={(item) => item._id}
        numColumns={mode === "dishes" ? 2 : 1}
        style={{ width: "100%", maxWidth: 660, alignSelf: "center" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        columnWrapperStyle={mode === "dishes" ? { gap: 12 } : undefined}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (count > 0) nextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          "restaurantId" in item ? (
            <View style={{ width: (contentWidth - 52) / 2 }}>
              <FoodCard
                food={item}
                onPress={() =>
                  router.push({
                    pathname: "/food/[id]",
                    params: { id: item._id },
                  })
                }
              />
            </View>
          ) : (
            <View className="mb-4">
              <RestaurantCard
                restaurant={item}
                width={contentWidth - 40}
                onPress={() =>
                  router.push({
                    pathname: "/restaurant/[id]",
                    params: { id: item._id },
                  })
                }
              />
            </View>
          )
        }
        ListEmptyComponent={
          busy ? (
            <View
              accessibilityLabel="Завантаження результатів"
              className="gap-4 py-6"
            >
              <ActivityIndicator
                size="large"
                color={theme.colors.primaryText}
              />
              <Text className="text-center font-medium text-sm text-secondaryText">
                Шукаємо щось смачне…
              </Text>
            </View>
          ) : status === "Exhausted" ? (
            <View className="gap-4">
              <EmptyState
                title="Нічого не знайшли"
                message="Спробуй іншу назву, зміни місто або послаб фільтри."
                onReset={filtering ? reset : undefined}
              />
              {mode === "restaurants" && debouncedSearch ? (
                <AppButton
                  title="Шукати серед страв"
                  variant="secondary"
                  onPress={() => changeMode("dishes")}
                />
              ) : null}
            </View>
          ) : (
            <Text className="py-6 text-center font-regular text-sm text-secondaryText">
              На цій сторінці немає збігів. Продовж пошук нижче.
            </Text>
          )
        }
        ListFooterComponent={
          status === "LoadingMore" && count > 0 ? (
            <ActivityIndicator
              accessibilityLabel="Завантаження наступної сторінки"
              color={theme.colors.primaryText}
              className="py-5"
            />
          ) : status === "CanLoadMore" ? (
            <AppButton
              title={count ? "Показати ще" : "Продовжити пошук"}
              variant="secondary"
              onPress={nextPage}
            />
          ) : null
        }
      />
      <Sheet
        visible={sheet !== null}
        title={
          sheet === "city"
            ? "Місто доставки"
            : sheet === "sort"
              ? "Сортування"
              : "Фільтри"
        }
        onClose={() => setSheet(null)}
        footer={
          sheet === "filters" ? (
            <AppButton
              title="Застосувати фільтри"
              onPress={() => {
                setFilters({ ...draft });
                setSheet(null);
              }}
            />
          ) : undefined
        }
      >
        {sheet === "city" ? (
          <View className="gap-3 pb-4">
            {cities.map((city) => (
              <Pressable
                key={city}
                accessibilityRole="button"
                accessibilityState={{ selected: city === request.city }}
                onPress={() => {
                  setRequest((current) => ({ ...current, city }));
                  setSheet(null);
                }}
                className="min-h-14 flex-row items-center justify-between rounded-2xl bg-background px-4"
              >
                <Text className="font-bold text-base text-textPrimary">
                  {city}
                </Text>
                {city === request.city ? (
                  <Check size={20} color={theme.colors.primaryText} />
                ) : null}
              </Pressable>
            ))}
            <Text className="font-regular text-xs leading-5 text-secondaryText">
              Наразі каталог доступний у Львові.
            </Text>
          </View>
        ) : sheet === "sort" ? (
          <View className="gap-3 pb-4">
            {mode === "restaurants"
              ? restaurantSorts.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: restaurantSort === item.value,
                    }}
                    onPress={() => {
                      setRestaurantSort(item.value);
                      setSheet(null);
                    }}
                    className="min-h-14 flex-row items-center justify-between rounded-2xl bg-background px-4"
                  >
                    <Text className="font-semibold text-sm text-textPrimary">
                      {item.label}
                    </Text>
                    {restaurantSort === item.value ? (
                      <Check size={20} color={theme.colors.primaryText} />
                    ) : null}
                  </Pressable>
                ))
              : dishSorts.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dishSort === item.value }}
                    onPress={() => {
                      setDishSort(item.value);
                      setSheet(null);
                    }}
                    className="min-h-14 flex-row items-center justify-between rounded-2xl bg-background px-4"
                  >
                    <Text className="font-semibold text-sm text-textPrimary">
                      {item.label}
                    </Text>
                    {dishSort === item.value ? (
                      <Check size={20} color={theme.colors.primaryText} />
                    ) : null}
                  </Pressable>
                ))}
          </View>
        ) : sheet === "filters" ? (
          <View className="gap-6 pb-5">
            <ChoiceChips
              label="Кухня"
              options={[
                { value: "", label: "Будь-яка" },
                ...cuisines.map((value) => ({ value, label: value })),
              ]}
              value={draft.cuisine}
              onChange={(cuisine) =>
                setDraft((current) => ({ ...current, cuisine }))
              }
            />
            <ChoiceChips
              label="Мінімальний рейтинг"
              options={[
                { value: "", label: "Будь-який" },
                { value: "4", label: "4+" },
                { value: "4.5", label: "4.5+" },
                { value: "4.8", label: "4.8+" },
              ]}
              value={draft.rating}
              onChange={(rating) =>
                setDraft((current) => ({ ...current, rating }))
              }
            />
            <ChoiceChips
              label="Ціна страви"
              options={[
                { value: "", label: "Будь-яка" },
                { value: "low", label: "До 200 ₴" },
                { value: "middle", label: "200–350 ₴" },
                { value: "high", label: "Від 350 ₴" },
              ]}
              value={draft.price}
              onChange={(price) =>
                setDraft((current) => ({ ...current, price }))
              }
            />
            {mode === "restaurants" ? (
              <Text className="-mt-3 font-regular text-xs leading-5 text-secondaryText">
                Покажемо заклади, у меню яких є доступна страва за цією ціною.
              </Text>
            ) : null}
            <ChoiceChips
              label="Час доставки"
              options={[
                { value: "", label: "Будь-який" },
                { value: "30", label: "До 30 хв" },
                { value: "45", label: "До 45 хв" },
                { value: "60", label: "До 60 хв" },
              ]}
              value={draft.time}
              onChange={(time) => setDraft((current) => ({ ...current, time }))}
            />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-bold text-base text-textPrimary">
                Лише відчинені
              </Text>
              <Switch
                accessibilityLabel="Лише відчинені заклади"
                value={draft.onlyOpen}
                onValueChange={(onlyOpen) =>
                  setDraft((current) => ({ ...current, onlyOpen }))
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.surface}
              />
            </View>
            <AppButton
              title="Скинути фільтри"
              variant="secondary"
              onPress={() => setDraft({ ...emptyFilters })}
            />
          </View>
        ) : null}
      </Sheet>
      <FloatingCartSummary />
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView className="flex-1 justify-center bg-background px-5">
      <View className="gap-4">
        <Text className="font-bold text-xl text-textPrimary">
          Пошук тимчасово недоступний
        </Text>
        <Text className="font-regular text-base text-secondaryText">
          Перевір з’єднання та спробуй ще раз.
        </Text>
        <AppButton title="Спробувати ще раз" onPress={() => void retry()} />
      </View>
    </SafeAreaView>
  );
}

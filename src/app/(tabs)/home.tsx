import type { ErrorBoundaryProps } from "expo-router";
import { AppButton } from "@/components/ui/AppButton";
import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConvexConnectionState, useQuery } from "convex/react";
import { Bell, Check, ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react-native";
import Animated, { FadeIn, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/constants/theme";
import type { Food, Restaurant } from "@/types/catalog";
import { CategoryList } from "@/components/home/CategoryList";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { FoodCard } from "@/components/food/FoodCard";
import { CatalogDetails } from "@/components/home/CatalogDetails";
import { NotificationsSheet } from "@/components/home/NotificationsSheet";

const entrance = FadeIn.duration(250).reduceMotion(ReduceMotion.System);

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const user = useQuery(api.users.getCurrentUser);
  const connection = useConvexConnectionState();
  const [city, setCity] = useState("Львів");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<Id<"categories">>();
  const [showAll, setShowAll] = useState(false);
  const [cityVisible, setCityVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const listRef = useRef<FlatList<Food>>(null);
  const popularY = useRef(0);
  const catalogY = useRef(0);
  const categoryY = useRef(0);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const catalog = useQuery(api.home.getCatalog, { city, categoryId, search: debouncedSearch || undefined });
  const filtering = !!categoryId || !!debouncedSearch;
  const noResults = catalog && !catalog.popular.length && !catalog.dishes.length;
  const demo = catalog && [...catalog.featured, ...catalog.popular].some((item) => item.isDemo);

  function reset() { setSearch(""); setDebouncedSearch(""); setCategoryId(undefined); setShowAll(false); }
  function selectFood(item: Food) { setRestaurant(null); setFood(item); }
  function browse(category?: string) {
    setCategoryId(catalog?.categories.find((item) => item.slug === category)?._id);
    setSearch(""); setDebouncedSearch(""); setShowAll(true);
    listRef.current?.scrollToOffset({ offset: catalogY.current + popularY.current, animated: !reducedMotion });
  }
  function restaurantRail(items: Restaurant[]) {
    return <FlatList horizontal showsHorizontalScrollIndicator={false} data={items} keyExtractor={(item) => item._id} contentContainerStyle={{ gap: 12 }} renderItem={({ item }) => <RestaurantCard restaurant={item} onPress={() => setRestaurant(item)} />} />;
  }

  const header = <View className="gap-6 px-5 pt-3">
    <View className="flex-row items-center justify-between gap-3">
      <Pressable accessibilityRole="button" accessibilityLabel={`Місто доставки: ${city}. Змінити місто`} onPress={() => setCityVisible(true)} className="min-h-14 flex-1 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primaryLight"><MapPin size={22} color={theme.colors.primaryText} /></View>
        <View className="gap-1"><Text className="font-regular text-xs text-secondaryText">Доставка у</Text><View className="flex-row items-center gap-2"><Text className="font-bold text-sm text-textPrimary">{city}, Україна</Text><ChevronDown size={15} color={theme.colors.primaryText} /></View></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Відкрити сповіщення" onPress={() => setNotificationsVisible(true)} className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface"><Bell size={22} color={theme.colors.textPrimary} /></Pressable>
    </View>
    <View className="gap-2"><Text className="font-medium text-sm text-secondaryText">Привіт{user?.name ? `, ${user.name.split(/\s+/)[0]}` : ""} 👋</Text><Text accessibilityRole="header" className="font-extraBold text-[28px] leading-9 text-textPrimary">Що хочеш скуштувати{ "\n" }сьогодні?</Text></View>
    <View className="flex-row items-center rounded-2xl border border-border bg-surface pl-4"><Search size={20} color={theme.colors.secondaryText} />
      <TextInput accessibilityLabel="Пошук страв або закладів" placeholder="Пошук страв або закладів" placeholderTextColor={theme.colors.secondaryText} value={search} onChangeText={setSearch} maxLength={100} autoCorrect={false} returnKeyType="search" onSubmitEditing={() => { setDebouncedSearch(search.trim()); Keyboard.dismiss(); }} className="min-h-14 flex-1 px-3 font-regular text-sm text-textPrimary" />
      <Pressable accessibilityRole="button" accessibilityLabel={search ? "Очистити пошук" : "Перейти до категорій"} onPress={() => { if (search) { setSearch(""); setDebouncedSearch(""); } else { Keyboard.dismiss(); listRef.current?.scrollToOffset({ offset: catalogY.current + categoryY.current, animated: !reducedMotion }); } }} className="h-12 w-12 items-center justify-center">{search ? <X size={20} color={theme.colors.secondaryText} /> : <SlidersHorizontal size={20} color={theme.colors.primaryText} />}</Pressable>
    </View>
    {!connection.isWebSocketConnected && (connection.hasEverConnected || connection.connectionRetries > 0) ? <Text accessibilityLiveRegion="polite" className="rounded-2xl bg-primaryLight p-4 font-medium text-sm leading-5 text-primaryText">Немає з’єднання. Відновлюємо його автоматично…</Text> : null}
    {catalog === undefined ? <HomeSkeleton /> : <Animated.View entering={entrance} className="gap-6" onLayout={(event) => { catalogY.current = event.nativeEvent.layout.y; }}>
      {!filtering ? <PromoCarousel imageUrl={catalog.featured[0]?.imageUrl ?? null} onSelect={browse} /> : null}
      <View className="gap-4" onLayout={(event) => { categoryY.current = event.nativeEvent.layout.y; }}><View className="flex-row items-center justify-between"><Text accessibilityRole="header" className="font-bold text-xl text-textPrimary">На що маєш настрій?</Text>{filtering ? <Pressable accessibilityRole="button" accessibilityLabel="Скинути фільтри" onPress={reset} className="min-h-12 justify-center"><Text className="font-semibold text-xs text-primaryText">Скинути</Text></Pressable> : null}</View>
        <CategoryList categories={catalog.categories} selected={categoryId} onSelect={(id) => setCategoryId((current) => current === id ? undefined : id)} />
      </View>
      {demo ? <View className="self-start rounded-full bg-primaryLight px-3 py-2"><Text className="font-semibold text-xs text-primaryText">Демо-каталог · замовлення ще недоступні</Text></View> : null}
      {catalog.featured.length ? <View><SectionHeader title="Вибір BiteBox" />{restaurantRail(catalog.featured)}</View> : null}
      <View onLayout={(event) => { popularY.current = event.nativeEvent.layout.y; }}>
        <SectionHeader title={filtering ? "Знайдені заклади" : "Популярне поруч"} action={!filtering && catalog.popular.length ? showAll ? "Згорнути" : "Переглянути" : undefined} onPress={() => setShowAll((value) => !value)} />
        {catalog.popular.length ? showAll || filtering ? <View className="gap-4">{catalog.popular.map((item) => <RestaurantCard key={item._id} restaurant={item} onPress={() => setRestaurant(item)} width={Math.min(width - 40, 620)} />)}</View> : restaurantRail(catalog.popular) : !noResults ? <Text className="font-regular text-sm text-secondaryText">Закладів не знайдено. Переглянь страви нижче.</Text> : null}
      </View>
      {noResults ? <EmptyState title={debouncedSearch ? "Нічого не знайшли" : "Тут поки немає закладів"} message={debouncedSearch ? "Спробуй іншу назву страви або закладу." : "Спробуй іншу категорію або зміни місто доставки."} onReset={filtering ? reset : undefined} /> : null}
      {catalog.dishes.length ? <SectionHeader title={debouncedSearch ? "Знайдені страви" : "Спробуй сьогодні"} /> : null}
    </Animated.View>}
  </View>;

  return <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
    <FlatList ref={listRef} data={catalog?.dishes ?? []} keyExtractor={(item) => item._id} numColumns={2} style={{ width: "100%", maxWidth: 660, alignSelf: "center" }}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }} ListHeaderComponent={header}
      renderItem={({ item }) => <View style={{ width: (Math.min(width, 660) - 52) / 2 }}><FoodCard food={item} onPress={() => setFood(item)} /></View>} />
    <Sheet visible={cityVisible} title="Місто доставки" onClose={() => setCityVisible(false)}><View className="gap-3 pb-4">{["Львів", "Київ", "Одеса"].map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={item} accessibilityState={{ selected: item === city }} onPress={() => { setCity(item); setCityVisible(false); reset(); }} className={`min-h-14 flex-row items-center justify-between rounded-2xl px-4 ${city === item ? "bg-primaryLight" : "bg-background"}`}><Text className="font-semibold text-base text-textPrimary">{item}</Text>{city === item ? <Check size={20} color={theme.colors.primaryText} /> : null}</Pressable>)}<Text className="mt-2 font-regular text-xs leading-5 text-secondaryText">Показуємо заклади обраного міста. Демо-каталог доступний у Львові.</Text></View></Sheet>
    <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
    <CatalogDetails restaurant={restaurant} food={food} onClose={() => { setRestaurant(null); setFood(null); }} onFood={selectFood} />
  </SafeAreaView>;
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <SafeAreaView className="flex-1 justify-center bg-background px-5"><View className="gap-4"><Text className="font-bold text-xl text-textPrimary">Не вдалося завантажити каталог</Text><Text className="font-regular text-base text-secondaryText">Перевір з’єднання та спробуй ще раз.</Text><AppButton title="Спробувати ще раз" onPress={() => void retry()} /></View></SafeAreaView>;
}

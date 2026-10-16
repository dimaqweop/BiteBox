import { FlatList, Pressable, Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";
import type { Category } from "@/types/catalog";

const symbols: Record<string, string> = { pizza: "🍕", burgers: "🍔", sushi: "🍣", salads: "🥗", desserts: "🍰", drinks: "☕" };

export function CategoryList({ categories, selected, onSelect }: { categories: Category[]; selected?: Id<"categories">; onSelect: (id: Id<"categories">) => void }) {
  return <FlatList horizontal showsHorizontalScrollIndicator={false} data={categories} keyExtractor={(category) => category._id} contentContainerStyle={{ gap: 12 }}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.name} accessibilityState={{ selected: selected === item._id }} onPress={() => onSelect(item._id)} className="items-center gap-2 pb-1">
      <View className={`h-16 w-16 items-center justify-center rounded-2xl border ${selected === item._id ? "border-primary bg-primaryLight" : "border-border bg-surface"}`}><Text className="text-3xl">{symbols[item.slug] ?? "🍽️"}</Text></View>
      <Text className={`font-semibold text-xs ${selected === item._id ? "text-primaryText" : "text-secondaryText"}`}>{item.name}</Text>
    </Pressable>} />;
}

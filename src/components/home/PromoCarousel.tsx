import { useState } from "react";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Sparkles } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { FoodImage } from "@/components/ui/FoodImage";

const offers = [{ title: "Смак твого\nміста — поруч", caption: "Знайди свого нового фаворита", action: "Обрати смак", category: undefined }, { title: "Настрій\nна піцу?", caption: "Тепла, щойно з печі", action: "Переглянути піцу", category: "pizza" }] as const;

export function PromoCarousel({ imageUrl, onSelect }: { imageUrl: string | null; onSelect: (category?: string) => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 620);
  const [active, setActive] = useState(0);
  return <View className="gap-3"><FlatList horizontal data={offers} keyExtractor={(item) => item.title} showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 12} decelerationRate="fast" contentContainerStyle={{ gap: 12 }}
    onMomentumScrollEnd={(event) => setActive(Math.round(event.nativeEvent.contentOffset.x / (cardWidth + 12)))}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.action} onPress={() => onSelect(item.category)} style={{ width: cardWidth, height: 192, borderRadius: 24, overflow: "hidden", backgroundColor: theme.colors.primaryLight }}>
      <FoodImage uri={imageUrl} label="Піца до твого настрою" style={{ position: "absolute", right: 0, width: "65%", height: "100%" }} />
      <LinearGradient colors={[theme.colors.primaryLight, theme.colors.primaryLight, "rgba(255, 240, 229, 0)"]} locations={[0, 0.38, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: "absolute", inset: 0 }} />
      <View className="flex-1 justify-between p-5"><View className="flex-row items-center gap-1"><Sparkles size={13} color={theme.colors.primaryText} /><Text className="font-bold text-xs text-primaryText">Твій смачний вибір</Text></View>
        <Text className="font-extraBold text-2xl leading-8 text-textPrimary">{item.title}</Text><Text className="font-medium text-xs text-secondaryText">{item.caption}</Text>
        <View className="flex-row items-center gap-2"><Text className="font-bold text-sm text-primaryText">{item.action}</Text><ArrowRight size={16} color={theme.colors.primaryText} /></View>
      </View>
    </Pressable>} />
    <View className="flex-row justify-center gap-2">{offers.map((item, index) => <View key={item.title} style={{ width: active === index ? 20 : 6, height: 6, borderRadius: 999, backgroundColor: active === index ? theme.colors.primary : theme.colors.border }} />)}</View>
  </View>;
}

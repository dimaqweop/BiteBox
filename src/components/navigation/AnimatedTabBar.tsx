import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Home,
  Compass,
  ReceiptText,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";

function TabItem({
  title,
  Icon,
  active,
  disabled,
  onPress,
}: {
  title: string;
  Icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(withSpring(active ? 1.08 : 1));
  }, [active, scale]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${title}${disabled ? ", скоро" : ""}`}
      accessibilityState={{ selected: active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className="min-h-14 flex-1 items-center justify-center gap-1"
    >
      <Animated.View
        style={animatedStyle}
        className={`h-8 w-14 items-center justify-center rounded-full ${active ? "bg-primaryLight" : "bg-surface"}`}
      >
        <Icon
          size={22}
          strokeWidth={active ? 2.3 : 1.7}
          color={
            active
              ? theme.colors.primaryText
              : disabled
                ? theme.colors.textMuted
                : theme.colors.secondaryText
          }
        />
      </Animated.View>
      <Text
        className={`font-semibold text-xs ${active ? "text-primaryText" : disabled ? "text-textMuted" : "text-secondaryText"}`}
      >
        {title}
      </Text>
      {disabled ? (
        <Text className="font-regular text-[10px] text-textMuted">Скоро</Text>
      ) : null}
    </Pressable>
  );
}

export function AnimatedTabBar({ active }: { active: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row border-t border-border bg-surface px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <TabItem
        title="Головна"
        Icon={Home}
        active={active === "home"}
        onPress={() => router.replace("/home")}
      />
      <TabItem
        title="Пошук"
        Icon={Compass}
        active={active === "explore"}
        onPress={() => router.replace("/explore")}
      />
      <TabItem
        title="Замовлення"
        Icon={ReceiptText}
        active={active === "orders"}
        onPress={() => router.replace("/orders")}
      />
      <TabItem
        title="Профіль"
        Icon={UserRound}
        active={active === "profile"}
        onPress={() => router.replace("/profile")}
      />
    </View>
  );
}

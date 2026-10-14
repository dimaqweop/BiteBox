import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import type { ReactNode } from "react";
import { theme } from "@/constants/theme";

type Props = Omit<PressableProps, "children"> & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
};

export function AppButton({ title, loading = false, disabled, variant = "primary", icon, ...props }: Props) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const inactive = disabled || loading;
  const secondary = variant === "secondary";
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!inactive, busy: loading }}
        disabled={inactive}
        onPressIn={(event) => {
          if (!reducedMotion) scale.set(withSpring(0.98));
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1));
          props.onPressOut?.(event);
        }}
        className={`min-h-14 flex-row items-center justify-center gap-3 rounded-2xl px-5 ${secondary ? "bg-primaryLight" : "bg-primary"}`}
        style={{ opacity: inactive ? 0.6 : 1 }}
      >
        {loading ? <ActivityIndicator color={secondary ? theme.colors.primaryText : theme.colors.textPrimary} /> : icon}
        <Text className={`font-bold text-base ${secondary ? "text-primaryText" : "text-textPrimary"}`}>{title}</Text>
        {icon && !loading ? <View className="w-1" /> : null}
      </Pressable>
    </Animated.View>
  );
}

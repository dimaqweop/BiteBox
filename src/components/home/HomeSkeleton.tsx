import { View } from "react-native";
import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function HomeSkeleton() {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!reducedMotion)
      opacity.set(withRepeat(withTiming(0.55, { duration: 900 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      style={style}
      accessibilityLabel="Завантажуємо каталог"
      className="gap-6 py-4"
    >
      <View className="h-48 rounded-3xl bg-border" />
      <View className="flex-row gap-3">
        {[1, 2, 3, 4].map((key) => (
          <View key={key} className="h-16 w-16 rounded-2xl bg-border" />
        ))}
      </View>
      <View className="h-6 w-48 rounded-lg bg-border" />
      <View className="h-60 rounded-3xl bg-border" />
    </Animated.View>
  );
}

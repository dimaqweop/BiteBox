import { Pressable, type PressableProps } from "react-native";
import type { ReactNode } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

export function AnimatedPressable({ children, ...props }: Omit<PressableProps, "children"> & { children: ReactNode }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={style}>
    <Pressable {...props} onPressIn={(event) => { scale.set(withSpring(0.98)); props.onPressIn?.(event); }} onPressOut={(event) => { scale.set(withSpring(1)); props.onPressOut?.(event); }}>{children}</Pressable>
  </Animated.View>;
}

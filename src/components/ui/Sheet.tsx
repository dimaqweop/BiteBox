import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { useReducedMotion } from "react-native-reanimated";

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "slide"} onRequestClose={onClose}>
    <View role="dialog" aria-modal accessibilityLabel={title} className="flex-1 justify-end" style={{ backgroundColor: "rgba(36, 36, 36, 0.4)" }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрити вікно" onPress={onClose} style={{ position: "absolute", inset: 0 }} />
      <View className="rounded-t-3xl bg-surface px-5 pt-4" style={{ maxHeight: height - insets.top - 20, paddingBottom: Math.max(insets.bottom, 20) }} accessibilityViewIsModal>
        <View className="mb-2 h-1 w-10 self-center rounded-full bg-border" />
        <View className="mb-4 flex-row items-center justify-between gap-3"><Text accessibilityRole="header" className="flex-1 font-bold text-xl text-textPrimary">{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрити" onPress={onClose} className="h-12 w-12 items-center justify-center rounded-full bg-background"><X size={22} color={theme.colors.textPrimary} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}

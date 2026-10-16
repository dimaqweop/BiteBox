import { router } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import Animated, { FadeInUp, ReduceMotion } from "react-native-reanimated";
import { useCart } from "@/providers/CartProvider";
import { AppButton } from "@/components/ui/AppButton";
import { formatCurrency } from "@/lib/formatCurrency";
import { theme } from "@/constants/theme";

export function FloatingCartSummary() {
  const cart = useCart();
  if (!cart.count) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(200).reduceMotion(ReduceMotion.System)}
      className="border-t border-border bg-surface px-5 py-3"
    >
      <AppButton
        title={`Кошик · ${cart.count} · ${formatCurrency(cart.subtotal)}`}
        icon={<ShoppingBag size={20} color={theme.colors.textPrimary} />}
        onPress={() => router.push("/cart")}
      />
    </Animated.View>
  );
}

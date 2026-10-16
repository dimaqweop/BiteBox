import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, type ErrorBoundaryProps } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/providers/CartProvider";
import { validateName, validatePhone } from "@/lib/validation";
import { formatCurrency } from "@/lib/formatCurrency";
import { BackButton } from "@/components/navigation/BackButton";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { DetailState } from "@/components/ui/DetailState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const messages: Record<string, string> = {
  PRICE_CHANGED: "Ціни змінилися. Перевір оновлену суму та підтвердь ще раз.",
  CART_UNAVAILABLE: "Деякі страви або заклад зараз недоступні. Перевір кошик.",
  DELIVERY_CITY_MISMATCH: "Місто доставки має збігатися з містом закладу.",
  IDEMPOTENCY_CONFLICT:
    "Дані вже надісланого замовлення змінилися. Перевір розділ «Замовлення».",
  UNAUTHENTICATED: "Увійди знову, щоб оформити замовлення.",
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const user = useQuery(api.users.getCurrentUser);
  const placeOrder = useMutation(api.orders.place);
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [newCheckoutKey] = useState(
    () =>
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
  );
  const idempotencyKey = cart.checkoutKey ?? newCheckoutKey;
  const existingOrder = useQuery(
    api.orders.getByCheckoutKey,
    cart.checkoutKey ? { key: cart.checkoutKey } : "skip",
  );
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    address: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof contact, string>>
  >({});
  const [error, setError] = useState("");
  const quote = cart.quote;

  function change(field: keyof typeof contact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  async function submit() {
    if (busy.current || !quote?.canCheckout || !cart.connected) return;
    const nextErrors: typeof errors = {};
    if (validateName(contact.name))
      nextErrors.name = validateName(contact.name);
    if (!contact.phone.trim() || validatePhone(contact.phone))
      nextErrors.phone = "Вкажи коректний номер для зв’язку з кур’єром.";
    if (contact.address.trim().length < 8 || contact.address.length > 250)
      nextErrors.address =
        "Вкажи вулицю, номер будинку та, за потреби, квартиру.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !quote.restaurant) return;

    busy.current = true;
    setLoading(true);
    setError("");
    Keyboard.dismiss();

    try {
      await cart.prepareCheckout(idempotencyKey);
      const id = await placeOrder({
        restaurantId: quote.restaurant.id,
        items: cart.items.map(({ key, foodId, quantity, instructions }) => ({
          key,
          foodId,
          quantity,
          instructions,
        })),
        contactName: contact.name,
        phone: contact.phone,
        city: quote.restaurant.city,
        address: contact.address,
        comment: cart.comment,
        expectedTotal: quote.total,
        idempotencyKey,
      });
      router.replace({ pathname: "/order/[id]", params: { id } });
      cart.dispatch({ type: "clear" });
      cart.setNotice("");
    } catch (failure) {
      const code =
        failure instanceof ConvexError && typeof failure.data === "string"
          ? failure.data
          : "";
      setError(
        messages[code] ??
          "Не вдалося підтвердити замовлення. Перевір з’єднання та спробуй ще раз.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (!cart.hydrated) return <LoadingScreen />;
  if (!cart.count)
    return (
      <DetailState
        title="Кошик порожній"
        message="Спочатку додай страви до кошика."
      />
    );
  if (!quote) return <LoadingScreen />;
  if (existingOrder && !loading)
    return (
      <SafeAreaView className="flex-1 justify-center gap-5 bg-background p-5">
        <Text className="font-bold text-2xl text-textPrimary">
          Замовлення вже створено
        </Text>
        <Text className="font-regular text-base leading-6 text-secondaryText">
          Ми зберегли твоє замовлення. Його не потрібно надсилати повторно.
        </Text>
        <AppButton
          title="Переглянути замовлення"
          onPress={() => {
            router.replace({
              pathname: "/order/[id]",
              params: { id: existingOrder },
            });
            cart.dispatch({ type: "clear" });
          }}
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <View className="flex-row items-center gap-4 px-5 py-3">
          <BackButton />
          <Text
            accessibilityRole="header"
            className="font-extraBold text-2xl text-textPrimary"
          >
            Оформлення
          </Text>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          enabled={Platform.OS === "ios"}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={insets.top}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View className="gap-4">
              <Text className="font-bold text-xl text-textPrimary">
                Контактні дані
              </Text>
              <AppInput
                label="Ім’я отримувача"
                value={contact.name}
                onChangeText={(value) => change("name", value)}
                error={errors.name}
                autoComplete="name"
                maxLength={80}
                editable={!loading}
              />
              <AppInput
                label="Телефон для доставки"
                value={contact.phone}
                onChangeText={(value) => change("phone", value)}
                error={errors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="+380 XX XXX XX XX"
                maxLength={24}
                editable={!loading}
              />
            </View>
            <View className="gap-4">
              <Text className="font-bold text-xl text-textPrimary">
                Куди доставити?
              </Text>
              <Text className="font-semibold text-base text-primaryText">
                {quote.restaurant?.city}
              </Text>
              <AppInput
                label="Вулиця, будинок, квартира"
                value={contact.address}
                onChangeText={(value) => change("address", value)}
                error={errors.address}
                placeholder="Вул. Шевченка, 12, кв. 5"
                autoComplete="street-address"
                maxLength={250}
                editable={!loading}
              />
            </View>
            <View className="gap-3 rounded-3xl border border-border bg-surface p-5">
              <Text className="font-bold text-xl text-textPrimary">Оплата</Text>
              <Text className="font-semibold text-base text-primaryText">
                Готівкою при отриманні
              </Text>
              <Text className="font-regular text-sm leading-5 text-secondaryText">
                Оплати кур’єру після отримання замовлення.
              </Text>
            </View>
            <View className="gap-4">
              <Text className="font-bold text-xl text-textPrimary">
                {quote.restaurant?.name}
              </Text>
              {cart.items.map((item) => (
                <View key={item.key} className="flex-row justify-between gap-4">
                  <View className="flex-1 gap-1">
                    <Text className="font-semibold text-sm text-textPrimary">
                      {item.quantity} × {item.name}
                    </Text>
                    {item.instructions ? (
                      <Text className="font-regular text-xs text-secondaryText">
                        {item.instructions}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="font-bold text-sm text-textPrimary">
                    {formatCurrency(
                      quote.lines.find((line) => line.key === item.key)
                        ?.lineTotal ?? 0,
                    )}
                  </Text>
                </View>
              ))}
              {cart.comment ? (
                <Text className="rounded-2xl bg-primaryLight p-4 font-regular text-sm leading-5 text-secondaryText">
                  {cart.comment}
                </Text>
              ) : null}
            </View>
            {quote.restaurant ? (
              <Text className="font-medium text-sm text-secondaryText">
                Орієнтовний час: {quote.restaurant.estimatedDeliveryMinutes} хв
                після підтвердження закладом.
              </Text>
            ) : null}
            {!quote.canCheckout ? (
              <Text
                accessibilityRole="alert"
                className="font-semibold text-sm text-errorText"
              >
                Кошик змінився або заклад недоступний. Повернися до кошика.
              </Text>
            ) : null}
            {!cart.connected ? (
              <Text
                accessibilityRole="alert"
                className="font-semibold text-sm text-errorText"
              >
                Для підтвердження потрібне з’єднання.
              </Text>
            ) : null}
            {error ? (
              <Text
                accessibilityRole="alert"
                className="font-medium text-sm leading-6 text-errorText"
              >
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <View
            className="gap-3 border-t border-border bg-surface px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Text className="font-medium text-sm text-secondaryText">
              Страви {formatCurrency(quote.subtotal)} · доставка{" "}
              {formatCurrency(quote.deliveryFee)}
            </Text>
            <View className="flex-row justify-between">
              <Text className="font-bold text-lg text-textPrimary">Разом</Text>
              <Text className="font-extraBold text-xl text-textPrimary">
                {formatCurrency(quote.total)}
              </Text>
            </View>
            <AppButton
              title="Підтвердити замовлення"
              loading={loading}
              disabled={!quote.canCheckout || !cart.connected}
              onPress={() => void submit()}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <DetailState
      title="Оформлення недоступне"
      message="Перевір з’єднання та спробуй ще раз."
      onRetry={() => void retry()}
    />
  );
}

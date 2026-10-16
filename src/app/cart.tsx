import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import type { CartItem } from "@/lib/cart";
import { ShoppingBag, Trash2 } from "lucide-react-native";
import { useCart } from "@/providers/CartProvider";
import { formatCurrency } from "@/lib/formatCurrency";
import { theme } from "@/constants/theme";
import { BackButton } from "@/components/navigation/BackButton";
import { FoodImage } from "@/components/ui/FoodImage";
import { AppButton } from "@/components/ui/AppButton";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [clearing, setClearing] = useState(false);
  const [editing, setEditing] = useState<CartItem | null>(null);
  const [instructions, setInstructions] = useState("");
  const deliveryFee =
    cart.quote?.deliveryFee ?? cart.restaurant?.deliveryFee ?? 0;
  const currentLines = new Map(
    cart.quote?.lines.map((line) => [line.key, line]),
  );
  const hasUnavailable = cart.quote?.lines.some((line) => !line.available);
  const pricesChanged = cart.items.some((item) => {
    const line = currentLines.get(item.key);
    return (
      line?.unitPrice !== null &&
      line?.unitPrice !== undefined &&
      Math.round(line.unitPrice * 100) !== Math.round(item.unitPrice * 100)
    );
  });

  if (!cart.hydrated) {
    if (cart.storageError)
      return (
        <SafeAreaView className="flex-1 bg-background p-5">
          <BackButton />
          <View className="flex-1 justify-center gap-4">
            <Text className="font-bold text-2xl text-textPrimary">
              Кошик не відновлено
            </Text>
            <Text className="font-regular text-base text-secondaryText">
              {cart.storageError}
            </Text>
            <AppButton title="Спробувати ще раз" onPress={cart.retryStorage} />
            {clearing ? (
              <>
                <Text className="font-medium text-sm text-errorText">
                  Прибрати збережені страви та почати новий кошик?
                </Text>
                <AppButton
                  title="Так, почати новий кошик"
                  variant="secondary"
                  onPress={() => void cart.resetStorage()}
                />
              </>
            ) : (
              <AppButton
                title="Почати новий кошик"
                variant="secondary"
                onPress={() => setClearing(true)}
              />
            )}
          </View>
        </SafeAreaView>
      );
    return <LoadingScreen />;
  }

  const footer = cart.count ? (
    <View className="gap-3">
      <View className="flex-row justify-between">
        <Text className="font-bold text-lg text-textPrimary">
          Разом орієнтовно
        </Text>
        <Text className="font-extraBold text-xl text-textPrimary">
          {formatCurrency(cart.subtotal + deliveryFee)}
        </Text>
      </View>
      <Text className="font-regular text-xs text-secondaryText">
        Страви {formatCurrency(cart.subtotal)} · доставка{" "}
        {formatCurrency(deliveryFee)}
      </Text>
      <AppButton
        title={cart.quote ? "До оформлення" : "Перевіряємо кошик…"}
        disabled={!cart.quote?.canCheckout || !cart.connected}
        onPress={() => router.push("/checkout")}
      />
      <AppButton
        title="Доповнити замовлення"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/restaurant/[id]",
            params: { id: cart.restaurant!.id },
          })
        }
      />
    </View>
  ) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="w-full max-w-2xl flex-1 self-center">
        <View className="flex-row items-center gap-4 px-5 py-3">
          <BackButton />
          <Text
            accessibilityRole="header"
            className="font-extraBold text-2xl text-textPrimary"
          >
            Кошик
          </Text>
          {cart.count ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Очистити кошик"
              onPress={() => setClearing(true)}
              className="ml-auto min-h-12 justify-center px-3"
            >
              <Text className="font-semibold text-sm text-errorText">
                Очистити
              </Text>
            </Pressable>
          ) : null}
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          enabled={Platform.OS === "ios"}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={insets.top}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            {cart.restaurant ? (
              <View className="gap-5 px-5 pt-3">
                {!cart.connected ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    className="rounded-2xl bg-primaryLight p-4 font-medium text-sm text-primaryText"
                  >
                    Немає з’єднання. Кошик доступний, а оформлення відновиться
                    після підключення.
                  </Text>
                ) : null}
                {cart.storageError ? (
                  <View className="gap-2">
                    <Text className="font-medium text-sm text-errorText">
                      {cart.storageError}
                    </Text>
                    <AppButton
                      title="Повторити збереження"
                      variant="secondary"
                      onPress={cart.retryStorage}
                    />
                  </View>
                ) : null}
                {pricesChanged ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    className="rounded-2xl bg-primaryLight p-4 font-medium text-sm text-primaryText"
                  >
                    Ціни оновилися. У підсумку показано актуальну суму.
                  </Text>
                ) : null}
                {cart.quote && !cart.quote.restaurant ? (
                  <Text className="font-semibold text-sm text-errorText">
                    Заклад зараз недоступний. Обери інший заклад або очисти
                    кошик.
                  </Text>
                ) : cart.quote?.restaurant && !cart.quote.restaurant.isOpen ? (
                  <Text className="font-semibold text-sm text-errorText">
                    Заклад зачинено. Твої страви залишаться в кошику.
                  </Text>
                ) : null}
                {hasUnavailable ? (
                  <Text className="font-semibold text-sm text-errorText">
                    Прибери недоступні позиції, щоб перейти до оформлення.
                  </Text>
                ) : null}
                <Text className="font-bold text-xl text-textPrimary">
                  {cart.restaurant.name}
                </Text>
                {cart.items.map((item) => {
                  const current = currentLines.get(item.key);
                  const unitPrice = current?.unitPrice ?? item.unitPrice;
                  return (
                    <View
                      key={item.key}
                      className="gap-3 rounded-3xl border border-border bg-surface p-4"
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Переглянути ${item.name}`}
                        onPress={() =>
                          router.push({
                            pathname: "/food/[id]",
                            params: { id: item.foodId },
                          })
                        }
                        className="flex-row gap-3"
                      >
                        <FoodImage
                          uri={current?.imageUrl ?? item.imageUrl}
                          label={item.name}
                          style={{ width: 76, height: 76, borderRadius: 16 }}
                        />
                        <View className="flex-1 gap-2">
                          <Text className="font-bold text-base text-textPrimary">
                            {item.name}
                          </Text>
                          <Text className="font-semibold text-sm text-secondaryText">
                            {formatCurrency(unitPrice)} за порцію
                          </Text>
                          {item.instructions ? (
                            <Text className="font-regular text-xs leading-5 text-secondaryText">
                              {item.instructions}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                      {current && !current.available ? (
                        <Text className="font-semibold text-sm text-errorText">
                          Страва зараз недоступна
                        </Text>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Змінити побажання: ${item.name}`}
                        onPress={() => {
                          setEditing(item);
                          setInstructions(item.instructions);
                          cart.setNotice("");
                        }}
                        className="min-h-12 justify-center self-start"
                      >
                        <Text className="font-semibold text-sm text-primaryText">
                          {item.instructions
                            ? "Змінити побажання"
                            : "Додати побажання"}
                        </Text>
                      </Pressable>
                      <View className="flex-row flex-wrap items-center justify-between gap-2">
                        <QuantitySelector
                          label={item.name}
                          value={item.quantity}
                          minimum={0}
                          onChange={(quantity) =>
                            cart.dispatch({
                              type: "quantity",
                              key: item.key,
                              quantity,
                            })
                          }
                        />
                        <Text className="font-bold text-base text-textPrimary">
                          {formatCurrency(unitPrice * item.quantity)}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Прибрати ${item.name} з кошика`}
                          onPress={() =>
                            cart.dispatch({ type: "remove", key: item.key })
                          }
                          className="h-12 w-12 items-center justify-center"
                        >
                          <Trash2 size={20} color={theme.colors.errorText} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
                <View className="gap-3">
                  <Text className="font-bold text-lg text-textPrimary">
                    Коментар до замовлення
                  </Text>
                  <TextInput
                    accessibilityLabel="Коментар до замовлення"
                    multiline
                    maxLength={500}
                    value={cart.comment}
                    onChangeText={(comment) =>
                      cart.dispatch({ type: "comment", comment })
                    }
                    textAlignVertical="top"
                    placeholder="Необов’язково"
                    placeholderTextColor={theme.colors.secondaryText}
                    className="min-h-28 rounded-2xl border border-border bg-surface p-4 font-regular text-base text-textPrimary"
                  />
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center gap-5 px-5 py-12">
                <ShoppingBag size={48} color={theme.colors.primaryText} />
                <Text className="font-bold text-2xl text-textPrimary">
                  Тут поки порожньо
                </Text>
                <Text className="text-center font-regular text-base leading-6 text-secondaryText">
                  Обери щось смачне, і твої страви з’являться тут.
                </Text>
                <AppButton
                  title="Переглянути заклади"
                  onPress={() => router.replace("/explore")}
                />
              </View>
            )}
          </ScrollView>
          {footer ? (
            <View
              className="border-t border-border bg-background px-5 pt-4"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="w-full max-w-lg self-center">{footer}</View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
      <Sheet
        visible={clearing || !!editing}
        title={clearing ? "Очистити кошик?" : "Побажання до страви"}
        onClose={() => {
          setClearing(false);
          setEditing(null);
        }}
      >
        {clearing ? (
          <View className="gap-4 pb-4">
            <Text className="font-regular text-base leading-6 text-secondaryText">
              Усі страви й коментар буде прибрано з кошика.
            </Text>
            <AppButton
              title="Так, очистити"
              onPress={() => {
                cart.dispatch({ type: "clear" });
                cart.setNotice("");
                setClearing(false);
              }}
            />
            <AppButton
              title="Залишити кошик"
              variant="secondary"
              onPress={() => setClearing(false)}
            />
          </View>
        ) : editing ? (
          <View className="gap-4 pb-4">
            <Text className="font-bold text-base text-textPrimary">
              {editing.name}
            </Text>
            <TextInput
              accessibilityLabel="Побажання до страви"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              maxLength={300}
              textAlignVertical="top"
              className="min-h-28 rounded-2xl border border-border bg-background p-4 font-regular text-base text-textPrimary"
            />
            <Text className="text-right font-regular text-xs text-secondaryText">
              {instructions.length}/300
            </Text>
            {cart.notice ? (
              <Text
                accessibilityRole="alert"
                className="font-medium text-sm text-errorText"
              >
                {cart.notice}
              </Text>
            ) : null}
            <AppButton
              title="Зберегти побажання"
              onPress={() => {
                if (cart.updateInstructions(editing.key, instructions))
                  setEditing(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

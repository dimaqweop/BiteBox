import { Alert, Pressable, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sheet } from "@/components/ui/Sheet";
import { theme } from "@/constants/theme";
import { router } from "expo-router";
import { usePushNotifications } from "@/providers/PushNotificationsProvider";
import { AppButton } from "@/components/ui/AppButton";

export function NotificationsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const push = usePushNotifications();
  const notifications = useQuery(
    api.notifications.getMyNotifications,
    visible ? {} : "skip",
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  return (
    <Sheet
      visible={visible}
      title="Сповіщення"
      onClose={onClose}
      footer={
        push.status !== "enabled" && push.status !== "unavailable" ? (
          <AppButton
            title={
              push.status === "denied"
                ? "Налаштування сповіщень"
                : "Увімкнути push про замовлення"
            }
            loading={push.status === "loading"}
            onPress={() =>
              void push
                .enable()
                .catch(() =>
                  Alert.alert(
                    "Сповіщення",
                    "Не вдалося відкрити налаштування.",
                  ),
                )
            }
          />
        ) : undefined
      }
    >
      {notifications?.length ? (
        <View className="gap-3 pb-4">
          {notifications.map((notification) => (
            <Pressable
              key={notification._id}
              accessibilityRole="button"
              accessibilityLabel={`Прочитати: ${notification.title}`}
              onPress={() => {
                if (notification.orderId && notification.audience) {
                  onClose();
                  router.push({
                    pathname:
                      notification.audience === "restaurant"
                        ? "/restaurant-order/[id]"
                        : "/order/[id]",
                    params: { id: notification.orderId },
                  });
                }
                void markAsRead({ notificationId: notification._id }).catch(
                  () =>
                    Alert.alert(
                      "Не вдалося оновити сповіщення",
                      "Спробуйте ще раз.",
                    ),
                );
              }}
              className={`gap-2 rounded-2xl p-4 ${notification.isRead ? "bg-background" : "bg-primaryLight"}`}
            >
              <Text className="font-bold text-base text-textPrimary">
                {notification.title}
              </Text>
              <Text className="font-regular text-sm leading-5 text-secondaryText">
                {notification.message}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="items-center gap-3 py-8">
          <Bell size={36} color={theme.colors.primaryText} />
          <Text className="font-bold text-lg text-textPrimary">
            {notifications ? "Тут поки тихо" : "Завантажуємо сповіщення…"}
          </Text>
          <Text className="text-center font-regular text-sm leading-6 text-secondaryText">
            Нові сповіщення з’являться тут.
          </Text>
        </View>
      )}
    </Sheet>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { router, useRootNavigationState } from "expo-router";
import { useConvexConnectionState, useMutation } from "convex/react";
import type * as ExpoNotifications from "expo-notifications";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  parseOrderNotification,
  type OrderNotification,
} from "@/lib/orderNotification";

type NotificationsModule = typeof ExpoNotifications;
type PushStatus =
  "loading" | "disabled" | "enabled" | "denied" | "unavailable" | "error";
type PushContextValue = {
  status: PushStatus;
  message: string;
  enable: () => Promise<void>;
  prepareLogout: () => Promise<void>;
  resumeAfterFailedLogout: () => void;
};
const PushContext = createContext<PushContextValue | null>(null);
const TOKEN_STORAGE_KEY = "bitebox.pushToken";

const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
const available =
  Platform.OS !== "web" &&
  !Constants.expoGoConfig &&
  Constants.appOwnership !== "expo";

function hasPermission(
  permission: ExpoNotifications.NotificationPermissionsStatus,
  notifications: NotificationsModule,
) {
  return (
    permission.granted ||
    permission.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export function PushNotificationsProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: Id<"users"> | null;
}) {
  const registerDevice = useMutation(api.pushNotifications.registerDevice);
  const unregisterDevice = useMutation(api.pushNotifications.unregisterDevice);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const connected = useConvexConnectionState().isWebSocketConnected;
  const navigation = useRootNavigationState();
  const [status, setStatus] = useState<PushStatus>(
    available ? "loading" : "unavailable",
  );
  const [pending, setPending] = useState<OrderNotification | null>(null);
  const moduleRef = useRef<NotificationsModule | null>(null);
  const userRef = useRef(userId);
  const tokenRef = useRef<string | null>(null);
  const busy = useRef<Promise<void> | null>(null);
  const loggingOut = useRef(false);
  const responseId = useRef<string | null>(null);
  const handledPending = useRef<OrderNotification | null>(null);

  useEffect(() => {
    userRef.current = userId;
    loggingOut.current = false;
    tokenRef.current = null;
  }, [userId]);

  const sync = useCallback(
    (requestPermission: boolean): Promise<void> => {
      if (busy.current) return busy.current;
      const notifications = moduleRef.current;
      const owner = userRef.current;
      if (!notifications || !owner || loggingOut.current)
        return Promise.resolve();
      const task = (async () => {
        try {
          if (!tokenRef.current)
            tokenRef.current =
              await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
          if (!projectId) {
            setStatus("unavailable");
            return;
          }
          if (Platform.OS === "android") {
            await notifications.setNotificationChannelAsync("orders", {
              name: "Замовлення",
              importance: notifications.AndroidImportance.HIGH,
              sound: "default",
              vibrationPattern: [0, 250, 250, 250],
            });
          }
          let permission = await notifications.getPermissionsAsync();
          if (
            !hasPermission(permission, notifications) &&
            requestPermission &&
            permission.canAskAgain
          )
            permission = await notifications.requestPermissionsAsync();
          if (userRef.current !== owner || loggingOut.current) return;
          if (!hasPermission(permission, notifications)) {
            if (tokenRef.current) {
              await unregisterDevice({ token: tokenRef.current });
              tokenRef.current = null;
              await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
            }
            setStatus(permission.canAskAgain ? "disabled" : "denied");
            return;
          }
          const token = (
            await notifications.getExpoPushTokenAsync({ projectId })
          ).data;
          if (userRef.current !== owner || loggingOut.current) return;
          await registerDevice({ token });
          tokenRef.current = token;
          await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
          if (userRef.current === owner && !loggingOut.current)
            setStatus("enabled");
        } catch {
          if (userRef.current === owner && !loggingOut.current)
            setStatus("error");
        }
      })();
      busy.current = task;
      void task.finally(() => {
        if (busy.current === task) busy.current = null;
      });
      return task;
    },
    [registerDevice, unregisterDevice],
  );

  useEffect(() => {
    if (!available) return;
    let active = true;
    const subscriptions: { remove: () => void }[] = [];
    void import("expo-notifications")
      .then((notifications) => {
        if (!active) return;
        moduleRef.current = notifications;
        notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            const data = parseOrderNotification(
              notification.request.content.data,
            );
            const show =
              !!data && data.userId === userRef.current && !loggingOut.current;
            return {
              shouldPlaySound: show,
              shouldSetBadge: false,
              shouldShowBanner: show,
              shouldShowList: show,
            };
          },
        });
        const receiveResponse = (
          response: ExpoNotifications.NotificationResponse,
        ) => {
          if (
            response.actionIdentifier !==
            notifications.DEFAULT_ACTION_IDENTIFIER
          )
            return;
          const identifier = response.notification.request.identifier;
          if (identifier === responseId.current) return;
          responseId.current = identifier;
          const data = parseOrderNotification(
            response.notification.request.content.data,
          );
          if (data) setPending(data);
        };
        subscriptions.push(
          notifications.addNotificationResponseReceivedListener(
            receiveResponse,
          ),
        );
        subscriptions.push(
          notifications.addPushTokenListener(() => {
            void sync(false);
          }),
        );
        const response = notifications.getLastNotificationResponse();
        if (response) receiveResponse(response);
        void sync(false);
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });
    return () => {
      active = false;
      subscriptions.forEach((subscription) => subscription.remove());
      moduleRef.current?.setNotificationHandler(null);
    };
  }, [sync]);

  useEffect(() => {
    if (userId && connected) void sync(false);
  }, [userId, connected, sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active" && userRef.current) void sync(false);
    });
    return () => subscription.remove();
  }, [sync]);

  useEffect(() => {
    if (
      !pending ||
      !userId ||
      !navigation?.key ||
      handledPending.current === pending
    )
      return;
    handledPending.current = pending;
    // Never open another account's order after a shared-device account switch.
    if (pending.userId === userId) {
      router.push({
        pathname:
          pending.audience === "restaurant"
            ? "/restaurant-order/[id]"
            : "/order/[id]",
        params: { id: pending.orderId },
      });
      if (pending.notificationId)
        void markAsRead({
          notificationId: pending.notificationId as Id<"notifications">,
        }).catch(() => {});
    }
    moduleRef.current?.clearLastNotificationResponse();
  }, [pending, userId, navigation?.key, markAsRead]);

  async function enable() {
    if (status === "denied") {
      await Linking.openSettings();
      return;
    }
    setStatus("loading");
    await sync(true);
  }

  async function prepareLogout() {
    loggingOut.current = true;
    await busy.current;
    try {
      if (available && !tokenRef.current)
        tokenRef.current = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (tokenRef.current) await unregisterDevice({ token: tokenRef.current });
      tokenRef.current = null;
      if (available) await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      moduleRef.current?.clearLastNotificationResponse();
      await moduleRef.current?.dismissAllNotificationsAsync();
      setPending(null);
      setStatus(available ? "disabled" : "unavailable");
    } catch (error) {
      loggingOut.current = false;
      throw error;
    }
  }

  const messages: Record<PushStatus, string> = {
    loading: "Перевіряємо сповіщення…",
    disabled:
      "Увімкни push, щоб дізнаватися про замовлення, коли застосунок закритий.",
    enabled: "Сповіщення про замовлення увімкнено на цьому пристрої.",
    denied: "Сповіщення вимкнено в налаштуваннях телефону.",
    unavailable:
      Platform.OS === "web"
        ? "Push доступні в мобільному застосунку. Повідомлення зберігаються під дзвіночком."
        : "Push ще недоступні в цій збірці. Повідомлення зберігаються під дзвіночком.",
    error: "Не вдалося підключити push. Перевір з’єднання та спробуй ще раз.",
  };

  return (
    <PushContext.Provider
      value={{
        status,
        message: messages[status],
        enable,
        prepareLogout,
        resumeAfterFailedLogout() {
          loggingOut.current = false;
          void sync(false);
        },
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePushNotifications() {
  const value = useContext(PushContext);
  if (!value) throw new Error("PushNotificationsProvider is missing");
  return value;
}

import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "BiteBox";
const PACKAGE_NAME = "com.bitebox.app";
const SCHEME = "bitebox";

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment =
    (process.env.APP_ENV as "development" | "preview" | "production") ||
    "development";
  const isDev = environment === "development";

  return {
    ...config,
    name: isDev ? `${APP_NAME} Dev` : APP_NAME,
    slug: "BiteBox",
    scheme: isDev ? `${SCHEME}-dev` : SCHEME,
    ios: {
      ...config.ios,
      bundleIdentifier: isDev ? `${PACKAGE_NAME}.dev` : PACKAGE_NAME,
    },
    android: {
      ...config.android,
      package: isDev ? `${PACKAGE_NAME}.dev` : PACKAGE_NAME,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      permissions: [
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS",
      ],
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFF9F5",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      "expo-secure-store",
      ["expo-notifications", { color: "#FF6B35", defaultChannel: "orders" }],
    ],
    extra: {
      ...config.extra,
      eas: {
        projectId: "5d8c01fc-7946-4591-a2e2-f78e332d879a",
      },
    },
  };
};

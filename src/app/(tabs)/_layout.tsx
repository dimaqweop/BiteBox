import { Tabs } from "expo-router";
import { AnimatedTabBar } from "@/components/navigation/AnimatedTabBar";
import { theme } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
      tabBar={({ state }) => (
        <AnimatedTabBar active={state.routes[state.index].name} />
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Головна" }} />
      <Tabs.Screen name="explore" options={{ title: "Пошук" }} />
      <Tabs.Screen name="orders" options={{ title: "Замовлення" }} />
      <Tabs.Screen name="profile" options={{ title: "Профіль" }} />
    </Tabs>
  );
}

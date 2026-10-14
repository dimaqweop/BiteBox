import { Redirect } from "expo-router";
import { useConvexAuth } from "convex/react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <LoadingScreen />;
  return <Redirect href={isAuthenticated ? "/profile" : "/(auth)/login"} />;
}

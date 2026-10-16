import { useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { UtensilsCrossed } from "lucide-react-native";
import { theme } from "@/constants/theme";

export function FoodImage({
  uri,
  label,
  style,
}: {
  uri: string | null;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <View
      style={[
        {
          overflow: "hidden",
          backgroundColor: theme.colors.surfaceSecondary,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <UtensilsCrossed size={28} color={theme.colors.primaryText} />
      {uri && failedUri !== uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel={label}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setFailedUri(uri)}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      ) : null}
    </View>
  );
}

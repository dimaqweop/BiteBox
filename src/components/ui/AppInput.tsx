import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { theme } from "@/constants/theme";

type Props = TextInputProps & { label: string; error?: string; hint?: string; icon?: LucideIcon; password?: boolean };

export function AppInput({ label, error, hint, icon: Icon, password, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const color = error ? theme.colors.errorText : focused ? theme.colors.primaryText : theme.colors.secondaryText;
  return (
    <View className="gap-2">
      <Text className="font-semibold text-sm text-textPrimary">{label}</Text>
      <View
        className="min-h-14 flex-row items-center rounded-2xl border bg-surface pl-4"
        style={{ borderColor: error ? theme.colors.errorText : focused ? theme.colors.primary : theme.colors.border }}
      >
        {Icon ? <Icon size={20} strokeWidth={1.7} color={color} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={password ? !visible : props.secureTextEntry}
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.primary}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          className="min-h-14 flex-1 px-3 font-regular text-base text-textPrimary"
          style={[{ paddingVertical: 12 }, style]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Приховати пароль" : "Показати пароль"}
            accessibilityState={{ checked: visible }}
            onPress={() => setVisible((value) => !value)}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            {visible ? <EyeOff size={20} color={color} /> : <Eye size={20} color={color} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-medium text-xs text-errorText">{error}</Text> :
        hint ? <Text className="font-regular text-xs text-secondaryText">{hint}</Text> : null}
    </View>
  );
}

import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight, Check, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Brand } from "./Brand";
import { theme } from "@/constants/theme";
import { normalizeEmail, normalizePhone, validateAuthForm, type AuthFormErrors, type AuthFormValues } from "@/lib/validation";

const entrance = FadeInDown.duration(320).reduceMotion(ReduceMotion.System);

export function AuthForm({ mode }: { mode: "signIn" | "signUp" }) {
  const registering = mode === "signUp";
  const { signIn } = useAuthActions();
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<AuthFormValues>({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [formError, setFormError] = useState<string>();

  function change(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  }

  async function submit() {
    if (submitting.current) return;
    const nextErrors = validateAuthForm(values, mode);
    setErrors(nextErrors);
    setFormError(undefined);
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    setLoading(true);
    Keyboard.dismiss();
    try {
      const result = await signIn("password", {
        flow: mode,
        email: normalizeEmail(values.email),
        password: values.password,
        ...(registering ? { name: values.name.trim(), phone: normalizePhone(values.phone) } : {}),
      });
      if (!result.signingIn) throw new Error("Sign-in did not complete");
      // Protected routes switch only after Convex verifies the authenticated session.
      setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    } catch {
      setFormError(registering
        ? "Не вдалося створити акаунт. Перевірте дані та з’єднання або спробуйте увійти, якщо вже зареєстровані."
        : "Не вдалося увійти. Перевірте пошту, пароль та з’єднання і спробуйте ще раз.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View className="w-full max-w-lg flex-1 self-center px-5 pb-6 pt-6">
            <Brand />
            <Animated.View entering={entrance}>
              <View className="mb-6 mt-8 self-start flex-row items-center gap-2 rounded-full bg-primaryLight px-3 py-2">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="font-semibold text-xs text-primaryText">Смачно бути разом</Text>
              </View>
              <Text accessibilityRole="header" className="font-extraBold text-3xl leading-tight text-textPrimary">
                {registering ? "Твоя наступна\nсмачна історія." : "Раді бачити\nтебе знову!"}
              </Text>
              <Text className="mb-8 mt-3 font-regular text-base leading-6 text-secondaryText">
                {registering ? "Створи акаунт — і улюблені страви\nстануть ще ближчими." : "Увійди, щоб твої улюблені смаки\nзавжди були поруч."}
              </Text>
            </Animated.View>

            <View className="gap-5">
              {registering ? <AppInput label="Твоє ім’я" placeholder="Ім’я та прізвище" icon={UserRound} value={values.name}
                onChangeText={(value) => change("name", value)} error={errors.name} autoComplete="name" textContentType="name"
                autoCapitalize="words" maxLength={80} editable={!loading} returnKeyType="next" /> : null}
              <AppInput label="Електронна пошта" placeholder="name@example.com" icon={Mail} value={values.email}
                onChangeText={(value) => change("email", value)} error={errors.email} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
                maxLength={254} editable={!loading} returnKeyType="next" />
              {registering ? <AppInput label="Номер телефону" placeholder="+380 XX XXX XX XX" icon={Phone} value={values.phone}
                onChangeText={(value) => change("phone", value)} error={errors.phone} keyboardType="phone-pad"
                autoComplete="tel" textContentType="telephoneNumber" maxLength={24} editable={!loading} returnKeyType="next" /> : null}
              <AppInput label="Пароль" placeholder={registering ? "Щонайменше 8 символів" : "Введи свій пароль"}
                hint={registering ? "Від 8 до 128 символів." : undefined} icon={LockKeyhole} password value={values.password}
                onChangeText={(value) => change("password", value)} error={errors.password} autoCapitalize="none" autoCorrect={false}
                autoComplete={registering ? "new-password" : "current-password"} textContentType={registering ? "newPassword" : "password"}
                maxLength={128} editable={!loading} returnKeyType={registering ? "next" : "go"}
                onSubmitEditing={registering ? undefined : () => void submit()} />
              {registering ? <AppInput label="Повтори пароль" placeholder="Ще раз, щоб не помилитися" icon={ShieldCheck} password
                value={values.confirmPassword} onChangeText={(value) => change("confirmPassword", value)} error={errors.confirmPassword}
                autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
                maxLength={128} editable={!loading} returnKeyType="go" onSubmitEditing={() => void submit()} /> : null}
            </View>

            {formError ? <View className="mt-5 rounded-2xl border border-errorText bg-surface p-4">
              <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" className="font-medium text-sm leading-5 text-errorText">{formError}</Text>
            </View> : null}

            <View className="mt-6 gap-5">
              <AppButton title={registering ? "Створити акаунт" : "Увійти"} loading={loading} onPress={() => void submit()}
                icon={<ArrowRight size={20} color={theme.colors.textPrimary} />} />
              <View className="flex-row flex-wrap items-center justify-center">
                <Text className="font-regular text-sm text-secondaryText">{registering ? "Уже маєш акаунт? " : "Ще немає акаунта? "}</Text>
                <Link href={registering ? "/(auth)/login" : "/(auth)/register"} replace asChild>
                  <Pressable accessibilityRole="link" disabled={loading} className="min-h-12 justify-center px-2">
                    <Text className="font-bold text-sm text-primaryText">{registering ? "Увійти" : "Зареєструватися"}</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
            <View className="mt-auto flex-row items-center justify-center gap-2 pt-8">
              <Check size={16} color={theme.colors.secondaryText} />
              <Text className="font-regular text-xs text-secondaryText">Твої улюблені заклади. В одному місці.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

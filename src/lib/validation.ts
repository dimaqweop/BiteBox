export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}

export function validateEmail(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return "Введіть електронну пошту.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Введіть коректну електронну пошту.";
  }
}

export function validateName(value: string): string | undefined {
  const name = value.trim();
  if (name.length < 2 || name.length > 80) {
    return "Ім’я має містити від 2 до 80 символів.";
  }
}

export function validatePhone(value: string): string | undefined {
  if (!value.trim()) return;
  if (!/^\+[1-9]\d{7,14}$/.test(normalizePhone(value))) {
    return "Введіть номер у форматі +380XXXXXXXXX.";
  }
}

export function validatePassword(value: string): string | undefined {
  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return "Пароль має містити від 8 до 128 символів.";
  }
  if (!value.trim()) return "Пароль не може складатися лише з пробілів.";
}

export type AuthFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

export function validateAuthForm(
  values: AuthFormValues,
  mode: "signIn" | "signUp",
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (mode === "signUp") {
    const nameError = validateName(values.name);
    const phoneError = validatePhone(values.phone);
    const passwordError = validatePassword(values.password);
    if (nameError) errors.name = nameError;
    if (phoneError) errors.phone = phoneError;
    if (passwordError) errors.password = passwordError;
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Паролі не збігаються.";
    }
  } else if (!values.password || values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = "Введіть пароль.";
  }
  return errors;
}

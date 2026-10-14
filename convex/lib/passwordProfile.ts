import { ConvexError, type Value } from "convex/values";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "../../src/lib/validation";

export function validateNewPassword(password: string) {
  if (typeof password !== "string" || validatePassword(password)) {
    throw new ConvexError("INVALID_PASSWORD");
  }
}

export function passwordProfile(params: Record<string, Value | undefined>) {
  if (typeof params.email !== "string" || validateEmail(params.email)) {
    throw new ConvexError("INVALID_EMAIL");
  }
  const email = normalizeEmail(params.email);
  if (params.flow === "signIn") {
    if (typeof params.password !== "string" || !params.password || params.password.length > 128) {
      throw new ConvexError("INVALID_CREDENTIALS");
    }
    return { email };
  }
  if (params.flow !== "signUp") throw new ConvexError("INVALID_FLOW");
  if (typeof params.name !== "string" || validateName(params.name)) {
    throw new ConvexError("INVALID_NAME");
  }
  if (typeof params.phone !== "string" || validatePhone(params.phone)) {
    throw new ConvexError("INVALID_PHONE");
  }
  return {
    email,
    name: params.name.trim(),
    phone: normalizePhone(params.phone),
    role: "customer" as const,
    createdAt: Date.now(),
  };
}

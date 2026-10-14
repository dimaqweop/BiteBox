# BiteBox

Mobile food delivery app built with Expo SDK 57, Expo Router, TypeScript, Convex Auth, NativeWind and Reanimated. Interface language: Ukrainian.

## Run

Install locked dependencies with `npm ci`. Configure `.env.local` with `CONVEX_DEPLOYMENT=dev:your-deployment`, `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` from the Convex dashboard.

Initialize auth keys with `npm run auth:setup`, then deploy functions with `npx convex dev --once`. The setup script preserves existing keys and refuses ambiguous or production targets. Password auth does not require an email service or SITE_URL.

Start with `npx expo start`, or `npm run web` for the web preview. Rebuild any development build that predates the new native dependencies.

## Authentication

- Registration requires name, email, phone, password and password confirmation.
- Email/phone normalization and validation run on client and backend. New accounts receive the server-assigned customer role.
- Native sessions persist in Expo SecureStore. Web preview keeps tokens in memory, so page reload requires signing in again.
- Private profile access checks the current user and server session. Sign-out invalidates the session and refresh tokens.
- users.pushToken is an optional string reserved for the notifications feature.
- Password reset and email verification await a real email provider integration.

To verify manually: register, check the profile, restart on a phone to check persistence, sign out, then sign in again. Check invalid email/phone, mismatched passwords and incorrect login credentials.

Checks: `npm run lint`, `npm run typecheck`, `npx tsc --noEmit -p convex/tsconfig.json`.

Routes: src/app. Shared UI: src/components. Theme: src/constants/theme.ts. Validation: src/lib. Backend: convex. Full requirements: SPECIFICATION.md.

Documentation: [Convex Auth setup](https://labs.convex.dev/auth/setup), [Expo protected routes](https://docs.expo.dev/router/advanced/protected/), [SDK 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/), [NativeWind SDK 57 setup](https://www.nativewind.dev/docs/getting-started/installation).

# BiteBox

Mobile food delivery app built with Expo SDK 57, Expo Router, TypeScript, Convex Auth, NativeWind and Reanimated. Interface language: Ukrainian.

## Run

Install locked dependencies with `npm ci`. Configure `.env.local` with `CONVEX_DEPLOYMENT=dev:your-deployment`, `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` from the Convex dashboard.

Initialize auth keys with `npm run auth:setup`, then deploy functions with `npx convex dev --once`. The setup script preserves existing keys and refuses ambiguous or production targets. Password auth does not require an email service or SITE_URL.

Start with `npx expo start`, or `npm run web` for the web preview. Rebuild any development build that predates the new native dependencies.

## Authentication

- Registration requires name, email, password and password confirmation. Phone is optional; a supplied phone number is normalized and validated on both client and backend. Blank phone values are not stored.
- Email/phone normalization and validation run on client and backend. New accounts receive the server-assigned customer role.
- Native sessions persist in Expo SecureStore. Web preview keeps tokens in memory, so page reload requires signing in again.
- Private profile access checks the current user and server session. Sign-out invalidates the session and refresh tokens.
- users.pushToken mirrors the most recently registered Expo push token. Separate pushDevices records support multiple phones and bind tokens to authenticated sessions.
- Password reset and email verification await a real email provider integration.

To verify manually: register, check the profile, restart on a phone to check persistence, sign out, then sign in again. Check invalid email/phone, mismatched passwords and incorrect login credentials.

Checks: `npm run lint`, `npm run typecheck`, `npx tsc --noEmit -p convex/tsconfig.json`.

Routes: src/app. Shared UI: src/components. Theme: src/constants/theme.ts. Validation: src/lib. Backend: convex. Full requirements: SPECIFICATION.md.

Documentation: [Convex Auth setup](https://labs.convex.dev/auth/setup), [Expo protected routes](https://docs.expo.dev/router/advanced/protected/), [SDK 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/), [NativeWind SDK 57 setup](https://www.nativewind.dev/docs/getting-started/installation).

## Home

After sign-in the app opens Home. The bottom navigation includes Home, Explore (Пошук), Orders and Profile. Home supports inline restaurant/dish search, category selection, city filtering and favorites. Cards open dedicated restaurant and dish routes. Submitting a search or choosing “Переглянути всі” opens Explore with the current city, category and search term. Promo actions open Explore too, preserving Home's restaurant rails and “Спробуй сьогодні” recommendations; the pizza promo selects the pizza category.

The catalog comes from indexed Convex queries. Photos are stored as Convex Storage IDs and loaded with Expo Image. Favorites and notifications use the current authenticated user and server session.

The six existing restaurants in Lviv are the app's regular catalog, with four dishes per restaurant (24 total). Their original document IDs, photos and favorite relationships are preserved. New dishes without photos use the normal image placeholder. Restaurant locations currently specify the city only. Courier integrations remain for a later stage.

To populate a new development deployment, run `npx convex run seed:catalog '{}'` after deploying. The seed is internal and idempotent; run it only against a development deployment. `seed:activateCatalog` adopts an older demo catalog in place. City selection currently persists while the app is open.

Run `npx convex run seed:expandMenus '{}'` to add the extra menu positions. It skips existing restaurant/name pairs and never clears existing data. Authored server modules and catalog data live directly in convex/*.ts; there is no convex/lib directory.

Screen implementations, including Home, live directly in their route files under src/app. Only reusable UI pieces belong in src/components.

## Explore

The screen lives directly in src/app/(tabs)/explore.tsx. It searches restaurant and dish names with a 300 ms debounce, offers category/city selection, and supports cuisine, minimum rating, dish price, delivery time and open-now filters. Filter edits apply only after confirmation; closing the sheet discards edits. For restaurants, a price filter means at least one available menu item falls in the selected range.

Restaurant browsing supports recommended (featured first), highest rating, fastest delivery and lowest delivery fee. Dishes support recommended (menu order) and ascending/descending price. Text search uses Convex relevance ordering and displays “За відповідністю”; clear the search to select another sort.

Queries paginate indexed candidates on the backend; remaining filters examine only the current bounded page. Empty filtered pages keep their native cursor. The UI advances up to five extra empty pages automatically, then offers “Продовжити пошук” instead of falsely declaring the catalog empty. The displayed count is loaded matches, not a global total. Favorites retain authenticated ownership checks.

## Restaurant, food and cart

Screen code lives directly in src/app/restaurant/[id].tsx, src/app/food/[id].tsx and src/app/cart.tsx. Restaurant details include a cover, favorites, delivery estimates, address, sticky category tabs and a paginated menu. Food details include ingredients, quantity, preparation instructions and related dishes. Unavailable dishes and closed venues cannot be added. Invalid links and inactive restaurants have an unavailable state.

The local cart supports one restaurant at a time, confirms replacement, combines identical food/instructions, limits each line to 20 portions, and supports quantity changes, editable preparation notes, removal, clear confirmation and an order comment. Different instructions create separate lines; editing notes can merge matching lines. Convex supplies reactive prices and delivery estimates. Unavailable items, closed venues and lost connections prevent checkout.

On phones, the cart is persisted per account in encrypted Expo SecureStore, using small Unicode-safe chunks and an atomic manifest update. A failed save preserves the previous snapshot. Web keeps its cart in memory; notes and contact details are never written to ordinary local storage. The checkout key is saved before native order submission to prevent resubmission after an interrupted connection or restart.

Checkout collects the recipient, required delivery phone and street address in the restaurant's city. Registration phone remains optional. Cash on delivery is the only payment method. The authenticated order mutation recalculates prices, checks availability/city, rejects changed totals and uses a per-user idempotency key. Retrying an accepted request returns its existing order; reusing the key for different contents is rejected. Customer order queries return only their own orders; restaurant queries separately authorize the assigned owner.

The Orders tab shows the user's own orders and reactive status. An assigned restaurant owner can confirm orders, start preparation, mark them ready, hand them to a courier, confirm delivery or cancel nonterminal orders. Admins retain status override access through the same validated transitions; there is no automatic delivery simulator. A delivered order allows its customer to rate the restaurant from 1 to 5. Updating that order's rating updates the previous review without incrementing ratingCount; ratingSum keeps the average accurate.

### Restaurant order management

Restaurant owners enter through Profile → “Замовлення ресторану”. Screens live directly in src/app/restaurant-orders.tsx and src/app/restaurant-order/[id].tsx. The list supports multiple assigned restaurants, paginated orders and indexed status filters, initially showing pending orders. Details include preparation notes, the customer comment, delivery contact/address and cash total. Changes reach the customer's order screen reactively. Cancellation requires confirmation; delivered and cancelled orders are terminal. Actions include the expected current status to reject stale updates from another device.

Account registration always creates a customer. A trusted deployment operator links an existing registered account to a restaurant using the internal function restaurantOwners.assign with { restaurantSlug, email }, for example from the Convex dashboard. This sets restaurants.ownerId and promotes the account to restaurant_owner (preserving admin roles). Reassigning the restaurant immediately removes its previous owner's access. No app client can assign itself ownership or change its role. Restaurants without an owner keep working in the customer catalog; they have no restaurant operator until explicitly assigned.

Favorites has a dedicated private paginated screen linked from Profile. Hearts stay synchronized through Convex queries. Home's search filter icon opens Explore with its filter sheet; clearing search has a separate button.

Authentication, food and cart forms keep their action footer outside the scrollable content. iOS uses KeyboardAvoidingView padding; Android uses the configured resize mode. Auth fields support Next/Submit focus navigation. Test software-keyboard behavior on a physical device: desktop web previews cannot simulate the native keyboard. Changes to Android keyboard layout configuration require a rebuilt development build. Expo Haptics provides native feedback when adding dishes.

Source formatting uses multiline JSX and separated logical blocks. Screen implementations stay in route files; formatting does not extract them into new components.

## Order push notifications

The EAS project is @dimahd_dev/BiteBox, ID 5d8c01fc-7946-4591-a2e2-f78e332d879a (stored in app.json and inherited by app.config.ts). app.config.ts adapts the provided environment-based configuration: BiteBox Dev / com.bitebox.app.dev / bitebox-dev for development, BiteBox / com.bitebox.app / bitebox for preview and production. APP_ENV defaults to development; set it explicitly for release profiles. The required plugins are expo-router, expo-splash-screen, expo-secure-store and expo-notifications. Explicit Android permissions are VIBRATE and POST_NOTIFICATIONS; expo-notifications supplies its other native requirements.

A new order creates an inbox notification for its assigned restaurant owner. Confirmed, preparing, delivering, delivered and cancelled statuses notify the customer; ready_for_pickup stays visible in the order without an extra push. Notifications are created atomically with order mutations, so replaying checkout does not create duplicates. Bodies exclude delivery addresses and phone numbers. Tapping an inbox entry or a push opens the correct customer/restaurant order route. Cold-start responses wait for authentication and navigation; responses for another signed-in account are ignored.

PushNotificationsProvider loads expo-notifications only outside web and Expo Go. Enable push from Profile or the notification sheet. Existing permission is reused after sign-in, reconnect and returning to the foreground; the OS permission prompt is requested only from the enable button. Android creates the orders channel before requesting permission. Permission refusal does not block ordering or the inbox. Native tokens are remembered in SecureStore to remove registrations after permission revocation. Logout unregisters this device and clears its queued/presented notifications; another phone stays registered. Token rotation replaces the old token for the session, and switching accounts transfers the token. Each user may register up to ten active devices. Revoked/expired sessions are removed before new sends.

The official @convex-dev/expo-push-notifications component queues and retries delivery. A scheduled internal check pauses registrations rejected by the Expo gateway until the app registers them again. Its delivered state means the Expo gateway accepted the push, not proof that the phone displayed it. Enhanced Expo push security can use the optional Convex EXPO_ACCESS_TOKEN environment variable. No public API accepts an arbitrary recipient or message.

### Finish device setup

EAS init and Android build configuration are complete. The FCM V1 service-account key for Firebase project bitebox-b7a44 is uploaded to EAS and assigned to com.bitebox.app.dev. eas.json sets APP_ENV for each build profile. A native development build is still required to test Android push; remote push does not work in Expo Go. iOS APNs credentials remain to be configured.

1. In Firebase, register the Android app with package com.bitebox.app.dev for the development build. Download its google-services.json to the repository root (Git-ignored). For release, register com.bitebox.app and use its matching Firebase configuration.
2. Run npx eas-cli@latest build:configure to generate the EAS build profiles. Set APP_ENV to development, preview or production in the corresponding profile. Ensure EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CONVEX_SITE_URL are available in the EAS build environment too; local .env.local is not uploaded automatically.
3. Run npx eas-cli@latest credentials --platform android, select the development profile, and upload the Firebase service-account key under Google Service Account / FCM V1. The service-account private key is different from google-services.json; keep it outside Git. For iOS, configure an APNs key and provisioning for com.bitebox.app.dev with an Apple Developer account.
4. Build when ready: npx eas-cli@latest build --platform android --profile development. Install the development build and start Metro with npx expo start --dev-client.
5. Sign in on the phone, open Profile and enable notifications. Place an order from a customer account; the restaurant owner's phone should receive the new-order push. Change its status and verify customer pushes in foreground, background and after closing the app. Tap to check navigation, then test logout/account switching. Owner logins remain in restaurant-access.local.json.

References: [Expo SDK 57 notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [FCM V1 credentials](https://docs.expo.dev/push-notifications/fcm-credentials/), [Convex push component](https://github.com/get-convex/expo-push-notifications).

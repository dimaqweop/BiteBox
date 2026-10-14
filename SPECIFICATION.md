# BITEBOX — FULL PROJECT SPECIFICATION

## 1. Project Overview

Project Name: BiteBox

Description: BiteBox is a modern mobile food delivery application focused on local restaurants, cafes, and food businesses.

Platforms: Android and iOS.

Develop a production-oriented, modern, smooth, and scalable mobile application using Expo React Native, TypeScript, Convex, NativeWind, and React Native Reanimated.

All user-facing interface text must be in Ukrainian. Use English for source code, component names, variables, database fields, and file names.

The visual identity should feel premium, clean, friendly, and modern. The overall experience should be inspired by high-quality food delivery applications, but must have its own original design.

## 2. Technology Stack

Use the following technologies:

- Expo + React Native
- TypeScript with strict type checking
- Expo Router — navigation and file-based routing
- Convex — database, backend, realtime queries and mutations
- A compatible authentication solution integrated with Convex
- NativeWind — styling with utility classes
- React Native Reanimated — smooth animations
- React Native Gesture Handler — gesture interactions
- React Hooks — useState, useEffect, useMemo, useCallback, useContext, useReducer
- Expo Image — optimized image loading
- Expo Linear Gradient — gradients
- Expo Location — user location and delivery addresses
- Expo Notifications — push notifications
- Expo SecureStore — secure token storage when needed
- Expo Haptics — tactile feedback
- Lucide React Native — consistent icons
- React Native Safe Area Context — safe area handling
- React Native Maps — maps in the later delivery-tracking phase

Do NOT install or use:

- Zustand
- Redux
- React Hook Form
- Zod

Use standard React state and native input components for forms.

Use reusable TypeScript validation helpers for client-side validation. Always validate sensitive data again on the Convex backend. Never trust prices, totals, permissions, or payment status supplied by the client.

Choose library versions compatible with the installed Expo SDK. Check current compatibility and official installation instructions before adding dependencies.

## 3. Design System

Create a centralized theme in `constants/theme.ts`.

### Colors

Primary: #FF6B35
PrimaryDark: #E85A2A
PrimaryLight: #FFF0E5

Background: #FFF9F5
Surface: #FFFFFF
SurfaceSecondary: #FFF3EA

TextPrimary: #242424
TextSecondary: #7A7A7A
TextMuted: #A0A0A0

Border: #F0E8E2

Success: #22C55E
Warning: #F59E0B
Error: #EF4444

### Typography

Use Inter or Manrope through Expo Font.

Define styles for:

- Display: 32px, bold
- Heading1: 28px, bold
- Heading2: 24px, semibold
- Heading3: 20px, semibold
- Title: 18px, semibold
- Body: 15–16px, regular
- Caption: 12–13px, regular
- Button: 15–16px, semibold

Support different font weights and responsive layouts.

### Spacing

Use a consistent spacing scale:

4, 8, 12, 16, 20, 24, 32, 40.

Default horizontal screen padding: 20px.

### Border Radius

Small: 8px
Medium: 12px
Large: 16px
ExtraLarge: 24px
Pill: 999px

### Shadows

Use subtle, platform-compatible shadows.

Avoid heavy, dark shadows.

### Interface Requirements

- Large, attractive food photos
- Clean white cards
- Warm background
- Rounded controls
- Generous spacing
- Sticky primary actions where appropriate
- Skeleton loading
- Empty states
- Error states
- Image placeholders
- Consistent icon sizes
- Native-feeling interactions
- Proper keyboard handling
- Safe areas on Android and iOS
- Accessible contrast and touch targets

Do not use random colors, arbitrary spacing, or inconsistent component styles.

## 4. Navigation Architecture

Use Expo Router.

The bottom tab bar contains four tabs:

1. Home
2. Explore
3. Orders
4. Profile

The Cart screen is not a tab. Open it from the header, floating cart summary, or other relevant actions.

Additional screens:

- Onboarding
- Login
- Register
- Restaurant Details
- Food Details
- Cart
- Checkout
- Address Selection
- Add/Edit Address
- Order Tracking
- Order Details
- Favorites
- Profile Edit
- Settings
- Notifications

Use typed navigation paths where possible.

## 5. Screen Specifications

### 5.1 Splash and Onboarding

Create an attractive branded startup experience.

Splash:
- BiteBox logo
- Warm background
- Simple branded visual

Onboarding:
- Three introductory screens
- Food illustrations or images
- Animated page indicators
- Skip button
- Continue button
- Final Get Started button

Onboarding content:

1. Discover the best local food
2. Order easily and quickly
3. Enjoy delivery to your door

Store onboarding completion locally.

### 5.2 Authentication

Screens:
- Login
- Register
- Forgot Password, if supported by the selected auth provider

Login form:
- Email
- Password
- Show/hide password
- Login button
- Registration link

Register:
- Full Name
- Email
- Phone
- Password
- Confirm Password

Use controlled TextInput components.

Create reusable form components and validation helpers.

Show inline validation errors.

Provide loading and disabled states.

Avoid exposing sensitive error details.

Implement actual authentication with Convex rather than mock login state.

### 5.3 Home Screen

Layout from top to bottom:

1. Header with delivery location
2. Notification button
3. Greeting and introductory text
4. Search field
5. Promotional banner carousel
6. Horizontal food category list
7. Featured restaurants
8. Popular restaurants
9. Recommended dishes
10. Bottom navigation

Header example:

Deliver to
Львів, Україна

Main heading:

Що хочеш скуштувати сьогодні?

Search placeholder:

Пошук страв або закладів

Category examples:
- Піца
- Бургери
- Суші
- Салати
- Десерти
- Напої

Restaurant Card:
- Restaurant image
- Restaurant name
- Cuisine category
- Rating
- Estimated delivery time
- Delivery fee
- Favorite button
- Open/closed status

Use horizontal carousels where appropriate and an efficient vertical scroll layout.

Keep restaurant cards reusable.

### 5.4 Explore Screen

Search restaurants and food.

Features:
- Search input
- Recent searches (optional)
- Food category selection
- Filter button
- Sort button
- Restaurant result list
- No-results state

Filters:
- Cuisine
- Minimum rating
- Price range
- Delivery time
- Currently open

Sorting:
- Recommended
- Highest rating
- Fastest delivery
- Lowest delivery fee

Use backend-compatible filtering and pagination for scalable lists.

### 5.5 Restaurant Details

Create a premium restaurant page.

Header:
- Large cover image
- Animated back button
- Favorite button
- Restaurant name
- Description
- Rating
- Delivery time
- Delivery fee

Below:
- Restaurant information
- Horizontal sticky menu categories
- Menu sections
- Food item cards

Each food card:
- Image
- Title
- Short description
- Price in UAH
- Add button
- Availability status

Add an animated floating cart summary at the bottom when the cart contains items.

### 5.6 Food Details

Display:
- Large dish image
- Name
- Description
- Price
- Ingredients
- Optional available modifiers
- Quantity selector
- Special instructions
- Add to Cart button

For products with modifiers, store selected options as part of cart item identity.

Animate image and content entry.

The Add to Cart action should update cart state and provide subtle haptic feedback.

### 5.7 Cart Screen

Show:
- Restaurant name
- Cart item list
- Dish thumbnails
- Dish names
- Selected modifiers
- Individual prices
- Quantity controls
- Remove action
- Order comment
- Subtotal
- Delivery fee estimate
- Total estimate
- Checkout button

Support one restaurant per cart in the MVP.

If the user adds an item from another restaurant, ask whether to replace the current cart.

Persist the guest cart locally if a compatible local persistence mechanism is available. Do not store sensitive information in ordinary local storage.

Backend must recalculate the final price during checkout.

### 5.8 Checkout

Sections:

Delivery Address:
- Selected address
- Change address

Contact:
- Full name
- Phone number

Delivery:
- Estimated delivery time
- Instructions for courier

Payment:
- Cash on delivery for MVP
- Other payment methods only after real integration

Order Summary:
- Items subtotal
- Delivery fee
- Discounts if implemented
- Final total

Primary button:

Підтвердити замовлення

Submit the order through a Convex mutation.

Prevent duplicate submission.

Show an order success state after confirmation.

### 5.9 Orders

Create two sections:

Active Orders
Order History

Each order card:
- Restaurant name
- Date
- Order number
- Current status
- Total
- Item summary
- Details button

Order statuses:
- pending
- confirmed
- preparing
- ready_for_pickup
- delivering
- delivered
- cancelled

Use real-time Convex subscriptions.

### 5.10 Order Tracking

Header:
- Order number
- Current order status

Create an animated vertical order progress timeline.

Timeline steps:
1. Замовлення прийнято
2. Підтверджено
3. Готується
4. Передано кур'єру
5. Доставлено

Display estimated delivery time only when a real estimate exists.

Realtime order updates should automatically update the interface.

Courier map tracking should be added only after real courier location infrastructure is implemented.

Do not simulate live tracking as if it were real.

### 5.11 Profile

Display:
- Avatar
- Full name
- Email
- Phone

Menu:
- Особисті дані
- Мої адреси
- Улюблені заклади
- Історія замовлень
- Сповіщення
- Налаштування
- Підтримка
- Вийти

Allow users to update their own profile.

### 5.12 Settings

Settings:
- Push notifications toggle
- Language (Ukrainian initially)
- Dark mode (future feature)
- About application
- Privacy policy
- Logout

Do not show functionality as active until it is implemented.

## 6. Reusable UI Components

Organize shared components in `components/ui`.

Create:

- AppButton
- IconButton
- AppText
- AppInput
- AppCard
- AppHeader
- ScreenContainer
- SearchBar
- SectionHeader
- EmptyState
- ErrorState
- LoadingSpinner
- Skeleton
- Badge
- Divider
- QuantitySelector
- FavoriteButton
- AnimatedPressable
- AnimatedTabBar
- BottomSheet (only if needed)
- Toast

Feature-specific components:

Restaurant:
- RestaurantCard
- RestaurantHeader
- RestaurantInfo
- RestaurantFilters

Food:
- FoodCard
- FoodCategoryTabs
- FoodModifierSelector

Cart:
- CartItem
- CartSummary
- FloatingCartButton

Orders:
- OrderCard
- OrderStatusBadge
- OrderTimeline

Use consistent props, typed interfaces, and reusable visual patterns.

## 7. React Native Reanimated

Use Reanimated as the primary animation system.

Animation principles:
- Smooth
- Responsive
- Lightweight
- Natural
- Consistent
- Avoid excessive animations

Target smooth animation performance on typical mobile devices.

### Required Animations

#### Splash / Onboarding
- Logo fade-in and scale
- Intro illustration transitions
- Animated page indicators

#### Bottom Tabs
- Animated active indicator
- Smooth icon/color transitions
- Subtle active-tab scaling

#### Buttons
- Press scale: approximately 0.96–0.98
- Spring back on release
- Optional haptic feedback

#### Restaurant Cards
- Gentle press-scale feedback
- Image transitions where supported
- Optional staggered entrance

#### Favorite Button
- Heart scale animation
- Smooth fill transition

#### Food Details
- Image entrance animation
- Content fade-in
- Animated quantity changes

#### Cart
- Smooth item addition and removal
- Layout transitions
- Animated total changes
- Animated floating cart button

#### Search
- Smooth search field focus state
- Animated filter panel

#### Orders
- Animated status changes
- Timeline progress transitions

#### Skeleton Loading
- Subtle shimmer effect where appropriate

Use Reanimated APIs compatible with the installed version.

Prefer transform and opacity animations.

Use layout animations selectively.

Support reduced-motion settings where practical.

Do not animate every element continuously.

## 8. Convex Data Model

Create `convex/schema.ts`.

Collections:

### users
- name
- email
- phone
- avatarStorageId
- pushToken (optional string for push notifications)
- role
- createdAt

### addresses
- userId
- label
- city
- street
- building
- apartment
- entrance
- floor
- latitude
- longitude
- instructions
- isDefault

### restaurants
- name
- slug
- description
- logoStorageId
- coverStorageId
- cuisineTypes
- city
- address
- latitude
- longitude
- ratingAverage
- ratingCount
- estimatedDeliveryMinutes
- deliveryFee
- isActive
- isOpen

### categories
- name
- imageStorageId
- sortOrder

### menuCategories
- restaurantId
- name
- sortOrder

### menuItems
- restaurantId
- categoryId
- name
- description
- price
- imageStorageId
- ingredients
- isAvailable
- sortOrder

### favorites
- userId
- restaurantId

### orders
- userId
- restaurantId
- status
- deliveryAddressSnapshot
- customerName
- customerPhone
- subtotal
- deliveryFee
- discount
- total
- paymentMethod
- paymentStatus
- customerNote
- createdAt
- updatedAt

### orderItems
- orderId
- menuItemId
- nameSnapshot
- unitPriceSnapshot
- selectedOptionsSnapshot
- quantity
- lineTotal

### orderStatusHistory
- orderId
- status
- changedAt
- changedBy

### notifications
- userId
- title
- message
- type
- isRead
- createdAt

Design suitable indexes for frequent queries.

Use Convex document IDs and validators.

Add relations using Convex IDs.

Never allow clients to freely edit administrative data or order status.

Use server-side authorization for every protected query and mutation.

Create a small, explicit role system:
- customer
- restaurant_owner
- admin

A future courier role can be added when courier features are developed.

Orders must use trusted backend-calculated pricing and store snapshots of purchased items.

## 9. Convex Backend Functions

Organize functions by feature.

`users.ts`
- getCurrentUser
- updateProfile

`restaurants.ts`
- getFeaturedRestaurants
- listRestaurants
- getRestaurantById
- searchRestaurants

`menu.ts`
- getRestaurantMenu
- getMenuItemById

`favorites.ts`
- getFavorites
- toggleFavorite

`addresses.ts`
- getMyAddresses
- addAddress
- updateAddress
- deleteAddress
- setDefaultAddress

`orders.ts`
- createOrder
- getMyOrders
- getOrderById
- cancelOrder
- updateOrderStatus (authorized roles only)

`notifications.ts`
- getMyNotifications
- markAsRead

Never return another user's private orders or addresses.

Use explicit input validators, index-based queries, pagination, and authorization.

## 10. Project Folder Structure

BiteBox/
  app/
    _layout.tsx
    index.tsx

    (auth)/
      _layout.tsx
      onboarding.tsx
      login.tsx
      register.tsx

    (tabs)/
      _layout.tsx
      index.tsx
      explore.tsx
      orders.tsx
      profile.tsx

    restaurant/
      [id].tsx

    food/
      [id].tsx

    order/
      [id].tsx

    cart.tsx
    checkout.tsx
    addresses.tsx
    favorites.tsx
    notifications.tsx
    settings.tsx

  components/
    ui/
    home/
    restaurant/
    food/
    cart/
    orders/
    profile/
    navigation/

  convex/
    _generated/
    schema.ts
    auth.ts
    users.ts
    restaurants.ts
    menu.ts
    favorites.ts
    addresses.ts
    orders.ts
    notifications.ts
    seed.ts

  contexts/
    CartContext.tsx

  hooks/
    useCart.ts
    useCurrentUser.ts
    useLocation.ts

  constants/
    theme.ts
    categories.ts

  lib/
    formatCurrency.ts
    formatDate.ts
    validation.ts
    animations.ts

  types/
    restaurant.ts
    food.ts
    cart.ts
    order.ts

  assets/
    images/
    fonts/
    icons/

  AGENTS.md
  PLAN.md
  package.json
  tsconfig.json
  global.css
  babel.config.js
  metro.config.js
  app.json

Only create configuration files that are necessary for the installed Expo SDK and chosen styling setup.

Do not manually create Convex-generated files.

## 11. State Management

Do not use Zustand, Redux, React Hook Form, or Zod.

Use:
- useState for local component state
- useReducer for complex cart operations
- React Context for shared cart state
- useQuery for Convex reactive data
- useMutation for backend changes
- useAction for external operations when necessary

Keep server-owned data in Convex.

Avoid duplicating Convex server data into global local state.

Do not put large unrelated state into a single React context.

Keep cart logic separate from UI components.

## 12. Performance

Requirements:
- Use FlatList for long lists
- Memoize components only when useful
- Optimize image sizes
- Use Expo Image caching
- Avoid unnecessary rerenders
- Clean up subscriptions and effects
- Use server-side pagination for large collections
- Use stable list keys
- Avoid large expensive animations
- Respect device safe areas
- Handle slow connections gracefully

## 13. Error Handling

Implement consistent states for:
- Loading
- Empty data
- Network errors
- Authentication errors
- Unavailable restaurants
- Unavailable menu items
- Invalid addresses
- Order submission failures

Do not display raw backend errors to users.

Display helpful Ukrainian messages.

## 14. Development Stages

### Stage 1 — Project Foundation
- Initialize Expo project
- Configure TypeScript
- Install compatible dependencies
- Configure NativeWind
- Configure Reanimated
- Configure Expo Router
- Create theme
- Create base UI components
- Create app navigation

### Stage 2 — UI Foundation
- Build reusable cards and buttons
- Create Home layout
- Create Explore layout
- Create Restaurant Details layout
- Create Food Details layout
- Add animations and skeleton states

### Stage 3 — Convex Integration
- Connect Convex
- Design database schema
- Create seed data
- Implement restaurant and menu queries
- Replace UI mock data with real queries

### Stage 4 — Authentication
- Implement authentication
- Protect private screens
- Create user profiles
- Implement logout

### Stage 5 — Cart
- Create CartContext
- Add/remove items
- Update quantities
- Handle product modifiers
- Calculate displayed estimates

### Stage 6 — Checkout
- Manage delivery addresses
- Create order mutation
- Implement server-side price verification
- Prevent duplicate orders
- Display order confirmation

### Stage 7 — Realtime Orders
- Implement active orders
- Implement order history
- Add realtime tracking timeline
- Create restricted development tools to update order statuses

### Stage 8 — Polish
- Improve animations
- Add loading skeletons
- Improve error states
- Test Android and iOS
- Fix keyboard and layout issues
- Check performance
- Prepare EAS builds

## 15. Coding Standards

Use functional React components and TypeScript.

Keep components small and focused.

Prefer readable code over complex abstractions.

Use strongly typed props and Convex generated types.

Avoid `any` unless absolutely necessary.

Do not use mock backend implementations when the real functionality can be implemented.

Mock content is acceptable for isolated UI work but must be clearly separated and replaced during backend integration.

Do not introduce additional state-management or form libraries.

Add comments only where they clarify non-obvious logic.

Do not create unnecessary files, wrappers, or dependencies.

All sensitive backend operations must verify user identity and permissions.

Never place secret API keys in public environment variables.

Use environment variables for appropriate configuration.

## 16. Instructions for Codex

Before writing code:

1. Inspect the current repository.
2. Identify the installed Expo SDK and dependencies.
3. Check compatibility of new packages.
4. Explain the implementation plan for the current stage.
5. Follow this specification.

Work incrementally.

Do not implement all development stages in one attempt.

Start with Stage 1 only.

After completing a stage:
- Summarize the implemented changes.
- List new or changed files.
- Run available checks.
- Fix discovered errors.
- Explain how to test the result.
- Identify the next recommended stage.

Maintain a clean, consistent architecture.

The final application should feel like a polished, professional food delivery product rather than a simple demonstration app.

# 🎨 App UI Blueprint — From Zero to Polished App

> **What is this?** A step-by-step instruction file you hand to an AI assistant (along with your app idea) to build a fully functional, beautifully styled mobile app UI using **Google Stitch MCP** for design generation and **Expo Router (React Native)** for implementation.
>
> **How to use:** Place this file inside your project folder, open a conversation with an AI coding assistant, upload/reference this file, and follow the guided workflow below.

---

## Table of Contents

1. [Phase 0 — Pre-Flight Questions](#phase-0--pre-flight-questions)
2. [Phase 1 — Stitch MCP Setup & Design Generation](#phase-1--stitch-mcp-setup--design-generation)
3. [Phase 2 — Project Scaffolding](#phase-2--project-scaffolding)
4. [Phase 3 — Screen Implementation Order](#phase-3--screen-implementation-order)
5. [Phase 4 — Navigation & Flow Wiring](#phase-4--navigation--flow-wiring)
6. [Phase 5 — Consistency Checklist](#phase-5--consistency-checklist)
7. [Phase 6 — Functionality & Logic](#phase-6--functionality--logic)
8. [Phase 7 — Polish & Verification](#phase-7--polish--verification)
9. [Appendix A — Prompt Templates for Stitch](#appendix-a--prompt-templates-for-stitch)
10. [Appendix B — Common Pitfalls](#appendix-b--common-pitfalls)

---

## Phase 0 — Pre-Flight Questions

> **Before writing a single line of code, the AI assistant MUST ask the user the following questions.** If the user says *"choose everything yourself"*, the assistant should make sensible defaults and confirm them.

### Required Information

| #  | Question | Example Answer | Default (if user skips) |
|----|----------|---------------|------------------------|
| 1  | **App Name** | `Sanarch` | *User must provide* |
| 2  | **Brief Description** (1-3 sentences) | "A personal health companion app for tracking vitals, managing medical records, and booking consultations." | *User must provide* |
| 3  | **App Category** | Health & Fitness, Finance, Social, E-commerce, Productivity, Education, Travel, Food, etc. | Inferred from description |
| 4  | **Target Platform** | iOS / Android / Both | Both |
| 5  | **UI Style** | iOS-style (rounded, clean, minimal), Material Design, Glassmorphism, Neumorphism, Flat, Brutalist | iOS-style |
| 6  | **Theme Colors** — Primary, Secondary, Accent | Primary: `#006a35`, Secondary: `#005c2d`, Accent: `#6bfe9c` | AI picks a harmonious palette based on category |
| 7  | **Dark Mode?** | Yes / No / Both | Light only (v1) |
| 8  | **Typography** | Plus Jakarta Sans, Inter, Roboto, Poppins, etc. | Plus Jakarta Sans (headings) + Inter (body) |
| 9  | **Corner Radius Style** | Sharp (4-8px), Rounded (12-16px), Pill (24-32px) | Pill (24-32px) |
| 10 | **Reference / Inspiration App** (optional) | "I want it to look like the Apple Health app" or upload a screenshot | None |
| 11 | **Number of Main Screens** (approximate) | 6-10 | AI suggests based on description |
| 12 | **Auth Flow Needed?** | Splash → Login → Signup → Profile Setup | Yes (Splash → Login → Setup) |
| 13 | **Navigation Style** | Bottom Tab Bar, Drawer/Sidebar, Stack Only | Bottom Tab Bar |
| 14 | **Any special features?** | QR Scanner, Camera, Maps, Charts, Push Notifications | None |

### Optional Enhancements

- Upload example screenshots or UI mockups
- Provide a color palette image
- Name specific icons or illustration styles
- Specify a mascot or brand logo

---

## Phase 1 — Stitch MCP Setup & Design Generation

### 1.1 Connect the Stitch MCP Server

Ensure the Stitch MCP server is available in your AI assistant's tool set. The assistant should have access to these MCP tools:

- `create_project` — Create a new Stitch project
- `generate_screen_from_text` — Generate a screen design from a text prompt
- `edit_screens` — Edit existing screen designs
- `list_screens` — List all screens in a project
- `get_screen` — Get details of a specific screen

### 1.2 Create the Stitch Design Project

```
Tool: create_project
Title: "[App Name] UI Designs"
```

### 1.3 Generate Each Screen Design

> **CRITICAL:** Generate screens ONE AT A TIME. After each screen, review the output before proceeding. Each prompt should reference design decisions from Phase 0.

**Prompt Formula for each screen:**

```
Design a [SCREEN_NAME] screen for a mobile app called "[APP_NAME]".

App description: [BRIEF_DESCRIPTION]

Style: [UI_STYLE] style with [CORNER_RADIUS] corners
Colors: Primary [PRIMARY_COLOR], Secondary [SECONDARY_COLOR], Accent [ACCENT_COLOR]
Typography: [HEADING_FONT] for headings, [BODY_FONT] for body text
Device: MOBILE

Screen details:
- [Describe what this screen shows]
- [List the UI components needed]
- [Describe any interactive elements]
- [Mention the navigation elements visible: top bar, bottom nav, FAB, etc.]

IMPORTANT: Maintain visual consistency with previously generated screens.
Use the same header style, spacing, font sizes, and colors throughout.
The bottom navigation bar should have: [Home, Services, Records, Profile] (or your tabs).
```

### 1.4 Screen Generation Order

Generate screens in this recommended order:

```
1. Splash Screen          — Brand identity, logo, tagline
2. Login / Sign In        — Email + Password fields, Sign In button
3. Sign Up / Register     — Registration form
4. Profile Setup          — Onboarding form (name, avatar, preferences)
5. Home / Dashboard       — Main landing screen with key data
6. Side Navigation Menu   — Drawer/sidebar menu
7. Screen for Tab 2       — (e.g., Services)
8. Screen for Tab 3       — (e.g., Records)
9. Screen for Tab 4       — (e.g., Profile)
10. Detail/Sub Screens    — (e.g., Heart Rate detail, Settings, etc.)
11. Scanner / Camera      — If applicable
12. Results / Output      — If applicable
```

### 1.5 Review & Iterate

After generating each screen:
1. Review the `code.html` output in the Stitch project
2. If something doesn't match the vision, use `edit_screens` to refine
3. Ensure **every screen** has consistent:
   - Header bar style and height
   - Bottom navigation bar (if applicable)
   - Color usage
   - Font sizes
   - Spacing and padding
   - Button shapes and sizes
   - Icon sizes

---

## Phase 2 — Project Scaffolding

### 2.1 Initialize the Expo Project

```bash
npx -y create-expo-app@latest ./ --template blank-typescript
```

### 2.2 Install Required Dependencies

```bash
npx expo install expo-router expo-linear-gradient expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install @expo/vector-icons expo-linking expo-constants expo-splash-screen
```

### 2.3 Project Architecture

```
app/
├── _layout.tsx              # Root layout with Stack navigator
├── index.tsx                # Splash screen (entry point)
├── login.tsx                # Login / Sign In
├── signup.tsx               # Sign Up / Register
├── profile-setup.tsx        # Onboarding profile setup
├── dashboard.tsx            # Home / Dashboard (Tab 1)
├── services.tsx             # Tab 2
├── records.tsx              # Tab 3
├── profile.tsx              # Tab 4
├── menu.tsx                 # Side navigation drawer
├── scanner.tsx              # Scanner / Camera feature
├── scanner-results.tsx      # Results screen
├── [feature-name].tsx       # Additional feature screens
└── ...
assets/
├── images/                  # App images and icons
├── fonts/                   # Custom fonts (if needed)
app.json                     # Expo configuration
package.json
tsconfig.json
```

### 2.4 Root Layout Setup (`app/_layout.tsx`)

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="dashboard" />
      {/* Add all screens here */}
    </Stack>
  );
}
```

---

## Phase 3 — Screen Implementation Order

> **CRITICAL RULE:** Implement screens in the order of user flow, not alphabetically.

### Implementation Sequence

```
Step 1: Splash Screen (index.tsx)
   └─ Auto-navigates to Login after 2-3 seconds

Step 2: Login Screen (login.tsx)
   ├─ "Sign In" button → Dashboard (after validation)
   └─ "Create Account" link → Signup

Step 3: Signup Screen (signup.tsx)
   └─ "Next" button → Profile Setup

Step 4: Profile Setup (profile-setup.tsx)
   └─ "Next/Done" button → Dashboard

Step 5: Dashboard / Home (dashboard.tsx)
   ├─ Bottom Nav: Home (active), Services, Records, Profile
   ├─ Hamburger Menu → Side Navigation
   ├─ Profile Avatar → Profile Screen
   └─ FAB (+) → Scanner

Step 6: Side Navigation Menu (menu.tsx)
   ├─ Menu items → respective screens
   └─ Close/Back → previous screen

Step 7: Remaining Tab Screens (services.tsx, records.tsx, profile.tsx)
   └─ Each with same bottom nav, FAB, and header pattern

Step 8: Detail / Sub Screens
   └─ Each with back arrow → previous screen

Step 9: Scanner & Results (if applicable)
```

### Per-Screen Implementation Checklist

For **each screen**, follow this process:

1. **Read the Stitch HTML** — `view_file` the generated `code.html`
2. **Extract the design tokens** — Colors, fonts, spacing, border-radius, shadows
3. **Create the `.tsx` file** — Translate HTML/CSS into React Native components
4. **Wire navigation** — Add `useRouter` and link all buttons/touches
5. **Test immediately** — Verify in the simulator before moving on
6. **Cross-check consistency** — Compare with previous screens

---

## Phase 4 — Navigation & Flow Wiring

### 4.1 Navigation Map

Document all navigation connections before coding:

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Splash    │───▶│    Login    │───▶│  Profile Setup   │───▶│  Dashboard  │
│  (index)    │    │   (login)   │    │ (profile-setup)  │    │ (dashboard) │
└─────────────┘    │             │    └──────────────────┘    └──────┬──────┘
                   │  Sign Up ───┼──▶  signup.tsx                   │
                   └─────────────┘                                  │
                                                                    ▼
                              ┌──────────────────────────────────────┐
                              │         Bottom Navigation            │
                              ├──────────┬──────────┬───────────────┤
                              │  Home    │ Services │  Records │Profile│
                              │dashboard │services  │ records  │profile│
                              └──────────┴──────────┴──────────┴───────┘
                                   │
                                   ├──▶ Hamburger Menu → menu.tsx
                                   ├──▶ Profile Avatar → profile.tsx
                                   ├──▶ FAB (+) → scanner.tsx
                                   └──▶ Cards/Buttons → detail screens
```

### 4.2 Global Navigation Elements

These elements must appear consistently across multiple screens:

| Element | Behavior | Present On |
|---------|----------|------------|
| **Bottom Nav Bar** | Tap → navigate to respective tab | Dashboard, Services, Records, Profile |
| **Profile Avatar** (top-right) | Tap → `/profile` | All main screens |
| **Hamburger Menu** (top-left) | Tap → `/menu` | All main screens |
| **FAB (+)** (floating, above nav) | Tap → `/scanner` | Dashboard, Services, Records |
| **Back Arrow** (top-left) | Tap → `router.back()` | All sub/detail screens |

### 4.3 Active State Pattern

The active tab in the bottom navigation bar must be visually highlighted:

```tsx
// Active tab item
<View style={styles.navItemActive}>
  <MaterialIcons name="home" size={20} color="#ffffff" />
  <Text style={styles.navLabelActive}>HOME</Text>
</View>

// Inactive tab item
<TouchableOpacity onPress={() => router.push('/services')}>
  <MaterialIcons name="icon-name" size={20} color="#9a9d9e" />
  <Text style={styles.navLabel}>LABEL</Text>
</TouchableOpacity>
```

---

## Phase 5 — Consistency Checklist

> **This is the most important section.** Inconsistency in design is the #1 issue. Before marking any screen as complete, verify ALL items below.

### 5.1 Design Token Reference

Extract these values from your first generated screen and use them **everywhere**:

```
COLORS:
  primary:          #______
  primary-dim:      #______
  accent:           #______
  background:       #______
  surface:          #______
  text-primary:     #______
  text-secondary:   #______
  text-muted:       #______
  border:           #______
  nav-inactive:     #______
  nav-active-bg:    #______
  nav-active-text:  #______

TYPOGRAPHY:
  heading-font:     ___________
  body-font:        ___________
  h1: size __, weight __, color ______
  h2: size __, weight __, color ______
  h3: size __, weight __, color ______
  body: size __, weight __, color ______
  caption: size __, weight __, color ______
  label: size __, weight __, letterSpacing __

SPACING:
  page-padding:     __px
  section-gap:      __px
  card-padding:     __px
  item-gap:         __px

SHAPES:
  card-radius:      __px
  button-radius:    __px
  input-radius:     __px
  avatar-radius:    __px (usually 50%)
  pill-radius:      __px

SHADOWS:
  card-shadow:      color ____, offset {0, __}, opacity __, radius __
  nav-shadow:       color ____, offset {0, __}, opacity __, radius __
  button-shadow:    color ____, offset {0, __}, opacity __, radius __

COMPONENT SIZES:
  header-height:    __px
  bottom-nav-height: __px
  fab-width:        __px
  fab-height:       __px
  avatar-size:      __px
  icon-size-sm:     __px
  icon-size-md:     __px
  icon-size-lg:     __px
```

### 5.2 Cross-Screen Consistency Checks

Before completing each screen, verify:

- [ ] **Header** — Same height, same padding, same background, same icon sizes
- [ ] **Bottom Nav** — Same height, same icon sizes, same label font, same active style, same background
- [ ] **FAB** — Same size, same shape, same colors, same shadow, same position
- [ ] **Section Titles** — Same font, size, weight, color across all screens
- [ ] **Cards** — Same border-radius, same padding, same shadow
- [ ] **Buttons** — Same height, same border-radius, same font weight
- [ ] **Icons** — Same size for same-level icons, same color for same-state icons
- [ ] **Spacing** — Same `paddingHorizontal` on all pages, same gap between sections
- [ ] **Text colors** — Primary text, secondary text, muted text are consistent
- [ ] **Background** — Same page background color across all screens

---

## Phase 6 — Functionality & Logic

### 6.1 Basic App Logic Requirements

Every app should have these logical behaviors:

| Feature | Implementation |
|---------|---------------|
| **Splash → Auto-navigate** | `setTimeout` → push to Login after 2-3s |
| **Login Validation** | Button disabled until email + password are filled |
| **Form Fields** | TextInput with proper keyboard types (`email-address`, `numeric`, etc.) |
| **Password Visibility** | Toggle eye icon to show/hide password |
| **Back Navigation** | All sub-pages have a working back arrow |
| **Active Tab Highlight** | Current page's nav tab is visually active |
| **Sign Out** | Returns to Login screen (`router.replace('/login')`) |
| **Scroll Safety** | `paddingBottom` accounts for bottom nav overlap |
| **Safe Areas** | Use `SafeAreaView` or `useSafeAreaInsets()` on every screen |
| **Status Bar** | Set appropriate style (`dark` or `light`) per screen background |

### 6.2 Navigation Logic Rules

```
1. Splash → Login:          router.replace('/login')     // no back
2. Login → Dashboard:       router.replace('/dashboard') // no back to login
3. Signup → Profile Setup:  router.push('/profile-setup')
4. Profile Setup → Dashboard: router.replace('/dashboard')
5. Tab-to-Tab:              router.push('/[tab-name]')
6. Screen → Sub-screen:     router.push('/[sub-screen]')
7. Sub-screen → Back:       router.back()
8. Sign Out:                router.replace('/login')
```

### 6.3 State Management (for v1)

For a first version, use React's built-in state:

```tsx
// Form state
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);

// Validation
const isFormValid = email.trim().length > 0 && password.trim().length >= 6;
```

For future versions, consider:
- **AsyncStorage** for persistent data (login tokens, preferences)
- **React Context** for global state (user profile, theme)
- **Zustand** or **Redux Toolkit** for complex state

---

## Phase 7 — Polish & Verification

### 7.1 Final Verification Checklist

- [ ] All navigation routes work correctly
- [ ] No "Text strings must be rendered within a `<Text>` component" errors
- [ ] No stray JSX comments (use `{/* comment */}` only, no `//` inside JSX)
- [ ] Bottom nav active states are correct on every screen
- [ ] FAB appears on all screens where expected
- [ ] Profile avatar navigates to profile from every screen
- [ ] Back arrows work on all sub-screens
- [ ] Scroll content doesn't hide behind bottom nav
- [ ] Safe area insets are applied on all screens
- [ ] No duplicate `key` warnings in lists
- [ ] All images load correctly
- [ ] Fonts render properly (or fallback gracefully)

### 7.2 Device Testing

Test on:
- [ ] iOS Simulator (iPhone 14 / 15 Pro)
- [ ] Android Emulator (Pixel 7)
- [ ] Physical device (Expo Go or dev build)

### 7.3 Common Fix Patterns

| Problem | Solution |
|---------|----------|
| Text node error | Remove `//` comments from JSX, wrap all text in `<Text>` |
| Bottom nav covers content | Add `paddingBottom: insets.bottom + 120` to ScrollView |
| Status bar overlap | Use `SafeAreaView` or add `paddingTop: insets.top` |
| FAB color mismatch | Use consistent `LinearGradient` colors across all screens |
| Active tab wrong color | Use same `navItemActive` style object on all screens |
| Navigation not working | Ensure screen is registered in `_layout.tsx` |
| Keyboard covers input | Use `KeyboardAvoidingView` with `behavior="padding"` |

---

## Appendix A — Prompt Templates for Stitch

### Splash Screen
```
Design a splash screen for "[APP_NAME]". Center the app logo/icon in the middle with 
the app name below it and a short tagline. Use [PRIMARY_COLOR] as background. 
Keep it clean and minimal. Mobile device. [UI_STYLE] style.
```

### Login Screen
```
Design a login screen for "[APP_NAME]". Include:
- App logo at the top (centered, medium-sized)
- "Welcome Back" heading
- Email input field with mail icon
- Password input field with lock icon and visibility toggle
- "Sign In" button (full width, [PRIMARY_COLOR] background)
- "Forgot Password?" link
- "Don't have an account? Sign Up" link at bottom
Mobile device. [UI_STYLE] style. Colors: [PALETTE].
```

### Home / Dashboard
```
Design a home dashboard for "[APP_NAME]". Include:
- Top bar: hamburger menu icon (left), title "Home" (center), profile avatar (right)
- Hero card with gradient background ([PRIMARY] to [PRIMARY_DIM])
- Quick action grid (2x2) with icon boxes
- Recent activity section
- Bottom navigation: Home (active), [Tab2], [Tab3], [Tab4]
- Floating + button (pill shape) above bottom nav
Mobile device. [UI_STYLE] style. Colors: [PALETTE].
```

### Generic Screen Template
```
Design a [SCREEN_NAME] screen for "[APP_NAME]". Include:
- Top bar: [back arrow / hamburger] (left), title "[TITLE]" (center), [avatar/icon] (right)
- [DESCRIBE CONTENT SECTIONS]
- Bottom navigation: [TABS with this one active]
- Floating + button above nav (if applicable)
Maintain exact same header, nav bar, and spacing as previous screens.
Mobile device. [UI_STYLE] style. Colors: [PALETTE].
```

---

## Appendix B — Common Pitfalls

### ❌ Don'ts

1. **Don't use different colors** for the same element across screens
2. **Don't use `StyleSheet.flatten()`** — use direct style references
3. **Don't put `//` comments inside JSX** — use `{/* */}` only
4. **Don't forget to register screens** in `_layout.tsx`
5. **Don't use `router.push` for auth flows** — use `router.replace` so user can't go back to login
6. **Don't hardcode safe area padding** — always use `useSafeAreaInsets()`
7. **Don't skip the bottom padding** on ScrollViews — content will hide behind nav bar
8. **Don't use placeholder images** — generate real images or use consistent placeholder services

### ✅ Do's

1. **Do extract design tokens** from the first screen and reuse everywhere
2. **Do implement navigation incrementally** — test each link as you add it
3. **Do use `LinearGradient`** for premium-feeling gradient elements
4. **Do wrap every string in `<Text>`** — React Native requires this
5. **Do test on both iOS and Android** — they render differently
6. **Do keep button touch targets at least 44x44** — for accessibility
7. **Do use `SafeAreaView` or `useSafeAreaInsets()`** on every screen
8. **Do maintain a navigation map** — document all routes and connections

---

## Quick Start Checklist

When a user provides this file to an AI assistant, the assistant should:

1. ☐ Read this entire blueprint file
2. ☐ Ask all Phase 0 questions (or let user say "choose for me")
3. ☐ Create a Stitch project and generate all screen designs
4. ☐ Review each design with the user before proceeding
5. ☐ Scaffold the Expo project
6. ☐ Implement screens in flow order (Splash → Login → Setup → Dashboard → ...)
7. ☐ Wire all navigation connections
8. ☐ Run the consistency checklist on every screen
9. ☐ Add all basic functionality and logic
10. ☐ Test and verify the complete app flow

---

*Generated from the Sanarch app development workflow. Applicable to any mobile app project.*

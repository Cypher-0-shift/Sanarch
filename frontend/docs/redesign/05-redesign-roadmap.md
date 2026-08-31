# Sanarch — Redesign Execution Plan
### Document 05: Redesign Roadmap
**Role:** Lead Product Designer + Technical Architect
**Input:** 01 UX Audit · 02 UX Specification · 03 Design System · 04 Visual Identity

---

> **Governing Principles**
> Usability before aesthetics. Clarity before appeal. Simplicity before decoration.
> Every decision must support productivity, reduce cognitive load, and scale for enterprise use.
> Build reusable components first. Never build the same thing twice.

---

## Part 1: Strategic Analysis

### Why Order Matters
The single most expensive mistake in a redesign is implementing screens before the components they depend on are stabilized. A navigation bar rebuilt on the wrong token values cascades into every screen that uses it. A card component designed for the Records screen that is subtly different from the Home screen card creates visual debt that is paid forever.

**The ordering rule:** Foundation → Shared Components → High-Traffic Screens → Complex Feature Screens → Secondary Screens.

### Dependency Graph (Simplified)
```
Design Tokens
    └── Base Components (Button, Input, Card, Badge)
            ├── Navigation (Tab Dock, Header, Bottom Sheet)
            │       ├── Splash Screen
            │       ├── Auth Stack (Hero → Login → Onboarding)
            │       └── All Tab Screens
            │
            ├── Document Components (DocumentCard, CategoryBadge)
            │       ├── Records List
            │       └── Home Timeline
            │
            ├── Upload Components (Wizard Steps)
            │       └── Upload Screen
            │
            ├── Record Detail Components (Expandable, LabRow, MedCard)
            │       └── Record Detail Screen
            │
            └── Profile Components (SanarchIDCard, FamilyRow)
                    └── Profile + Settings Screens
```

---

## Part 2: Screen-by-Screen Redesign Analysis

---

### SCREEN 01 — Splash Screen
**Purpose:** Silent session initialization. Route to the correct screen with zero delay.
**Dependencies:** AuthStore, AppToken, Navigation config.
**Why this order:** Entry point to the entire app. No component dependencies — only brand logo and animation.
**Estimated Complexity:** Low

**Components to Create:** `BrandLogo`
**Existing to Reuse:** None (first screen)

**UX Risks:**
- Token check >800ms on slow devices → must handle gracefully with timeout fallback
- Network error during token validation silently logs out users with valid sessions

**Implementation Risks:**
- `expo-splash-screen` must be hidden at the right moment — premature hide shows blank frame
- Android status bar color must be set correctly to avoid white flash on transition

**Key Changes:** Remove fake progress bar. Token check runs in parallel with logo display. Offline + valid token → Home (not Login).

---

### SCREEN 02 — Hero / Marketing
**Purpose:** Convert new users. 3 pages, persistent CTA, always-available Skip.
**Dependencies:** `BrandLogo`, `PrimaryButton`, Navigation config.
**Why this order:** Second in auth stack. Validates `PrimaryButton` in a real use case.
**Estimated Complexity:** Low

**Components to Create:** `HeroPage`, `PageDotIndicator`, `SkipLink`
**Existing to Reuse:** `BrandLogo`, `PrimaryButton`

**UX Risks:**
- Swipe direction must match user expectation — add visual affordance
- "Get Started" on every page must not feel repetitive — vary surrounding copy

**Implementation Risks:**
- FlatList with `pagingEnabled` + vertical snap has known performance issues — use lightweight page children

**Key Changes:** 6 pages → 3 pages. CTA on every page. Skip link added.

---

### SCREEN 03 — Login
**Purpose:** Authenticate via phone + OTP. Must complete in under 45 seconds.
**Dependencies:** `PrimaryButton`, `FormField`, `OTPInput`, `CountryPickerSheet`, `BottomSheet`, `Toast`
**Why this order:** Introduces `FormField` and `BottomSheet` for the first time, reused in Onboarding and Profile.
**Estimated Complexity:** Medium

**Components to Create:** `PhoneInputField`, `OTPInputRow`, `CountryPickerSheet`, `ResendCooldownTimer`, `TOSDisclaimer`, `BiometricPrompt`
**Existing to Reuse:** `PrimaryButton`, `BottomSheet`, `Toast`

**UX Risks:**
- Country code auto-detection may fail for dual-SIM or VoIP numbers
- OTP box focus management differs iOS vs Android — test both
- Biometric fallback must not block OTP path for users who disabled biometrics

**Implementation Risks:**
- Firebase Auth has different OTP error codes on iOS vs Android — both must be handled explicitly
- Keyboard avoidance must not compress the brand hero zone

**Key Changes:** ToS checkbox removed → passive disclaimer. Auto-detected country code. 30s OTP cooldown. Biometric auth for returning users.

---

### SCREEN 04 — Onboarding Wizard
**Purpose:** Collect minimum information to create an account. 3 steps maximum.
**Dependencies:** `FormField`, `StepProgressBar`, `GenderSelector`, `CalendarPickerSheet`, `PrimaryButton`, `BottomSheet`
**Why this order:** Uses `FormField` and `BottomSheet` from Login. Introduces `StepProgressBar` reused in Upload.
**Estimated Complexity:** High

**Components to Create:** `StepProgressBar`, `AccountTypeCard`, `RelationSelector`, `GenderSelector`, `CalendarPickerSheet`, `AccountCreationLoader`, `SanarchIDReveal`
**Existing to Reuse:** `FormField`, `PrimaryButton`, `BottomSheet`, `Toast`, `BrandLogo`

**UX Risks:**
- Dependent fields on the same screen makes the form long — use clear visual sections
- DOB picker must support dates 80+ years back

**Implementation Risks:**
- `AccountCreationLoader` calls 2 APIs sequentially — must handle partial failure with clear retry
- `SanarchIDReveal` animation must respect `prefers-reduced-motion`

**Key Changes:** 7 sub-steps → 3 steps. Optional health data moved to Edit Profile. Account type framing simplified.

---

### SCREEN 05 — Home (Dashboard)
**Purpose:** Real-time health overview. Primary hub. Most-viewed screen.
**Dependencies:** `HomeHeader`, `SearchBar`, `HealthSummaryCard`, `TimelineEventCard`, `EmptyStateCard`, `FAB`, `ProfileSwitcherSheet`, `NotificationsSheet`, `SkeletonCard`
**Why this order:** Most-viewed screen. References largest number of shared components. `TimelineEventCard` reappears in Records.
**Estimated Complexity:** High

**Components to Create:** `HomeHeader`, `ProfileSwitcherSheet`, `SanarchIDShortcut`, `SanarchIDModal`, `HealthSummaryCard`, `TimelineSection`, `TimelineEventCard`, `FirstTimeEmptyState`, `NotificationsSheet`, `FAB`
**Existing to Reuse:** `SearchBar`, `SkeletonCard`, `EmptyStateCard`, `BottomSheet`, `Toast`, `BrandLogo`

**UX Risks:**
- First-time empty state must feel like a beginning, not a failure
- Sanarch ID shortcut competes with bell and profile switcher for header space

**Implementation Risks:**
- `getTimeline()` returns empty in dev mode — skeleton must handle empty responses without breaking
- `ProfileSwitcherSheet` must sync active profile to `profileStore` and re-render greeting instantly

**Key Changes:** QR hint strip removed. Zero-doc users see focused empty state. Profile switcher has name label. Search is inline.

---

### SCREEN 06 — Records List
**Purpose:** Primary data browser. Browse, search, filter, sort, manage all documents.
**Dependencies:** `DocumentCard`, `TreatmentGroupCard`, `FilterChips`, `ViewToggle`, `SearchBar`, `FilterSortSheet`, `MultiSelectToolbar`, `FAB`, `EmptyStateCard`, `SkeletonCard`
**Why this order:** Highest-complexity tab screen. `DocumentCard` is the most reused component in the entire app — must be correct before any screen that shows documents.
**Estimated Complexity:** High

**Components to Create:** `DocumentCard`, `TreatmentGroupCard`, `FilterChips`, `ViewToggle`, `FilterSortSheet`, `MultiSelectToolbar`, `DiagnosisPill`, `InlineSearchBar`
**Existing to Reuse:** `FAB`, `EmptyStateCard`, `SkeletonCard`, `BottomSheet`, `CategoryBadge`, `Toast`, `ConfirmationSheet`

**UX Risks:**
- Treatment grouping edge cases: no hospital, no diagnosis, overlapping date ranges must fall back gracefully
- Multi-select affordance is not obvious — long-press discoverability

**Implementation Risks:**
- Nested VirtualizedLists (groups containing child cards) is a React Native performance issue — evaluate FlashList or flat data structure
- Filter state must survive navigation but reset when switching profiles

**Key Changes:** "By Treatment" is the default view. Filter + Sort unified into one sheet. Inline search. Long-press multi-select.

---

### SCREEN 07 — Record Detail
**Purpose:** Primary consumption screen. Help the user understand their document.
**Dependencies:** `CategoryBadge`, `ExpandableSection`, `LabResultRow`, `MedicationCard`, `DiagnosisPill`, `RelatedHistoryItem`, `ExplainThisFAB`, `AISummaryModal`, `EditDocumentSheet`, `ConfirmationSheet`
**Why this order:** Depends on the most components of any screen. Must be built after Records List establishes `DocumentCard` and `CategoryBadge`.
**Estimated Complexity:** High

**Components to Create:** `RecordDetailHeader`, `DocumentThumbnail`, `OverviewSection`, `OverviewCard`, `LabResultRow`, `LabResultsSection`, `MedicationCard`, `RelatedHistoryTimeline`, `RelatedHistoryItem`, `ExplainThisFAB`, `AISummaryModal`, `EditDocumentSheet`, `AIContentBadge`, `LabAlertToggle`
**Existing to Reuse:** `CategoryBadge`, `ExpandableSection`, `DiagnosisPill`, `BottomSheet`, `ConfirmationSheet`, `Toast`, `SkeletonCard`

**UX Risks:**
- Overview default-open must not feel overwhelming — content must be concise
- Related History depends on backend grouping correctness

**Implementation Risks:**
- AI Summary may be null — handle gracefully inside modal
- `react-native-pdf` conflicts with ScrollView on Android — isolate in modal, not inline

**Key Changes:** Overview expanded by default. Thumbnail is a tag, not a hero. Share button actually navigates. Edit document added. Delete uses ConfirmationSheet.

---

### SCREEN 08 — Upload Wizard
**Purpose:** Capture a document and submit to AI pipeline. 4 steps (merged from 5).
**Dependencies:** `StepProgressBar`, `FileSelectionCard`, `DocumentAdjuster`, `CategorySelector`, `FormField`, `ProcessingScreen`
**Why this order:** `StepProgressBar` from Onboarding. `FormField` from Login. Introduces upload-specific components not reused elsewhere.
**Estimated Complexity:** High

**Components to Create:** `FileSelectionCard`, `DocumentAdjuster`, `AdjusterToolbar`, `AdjusterToolButton`, `CategorySelectorGrid`, `CategoryOptionCard`, `UploadProgressBar`, `ProcessingScreen`, `BackgroundProcessingLink`
**Existing to Reuse:** `StepProgressBar`, `FormField`, `PrimaryButton`, `CategoryBadge`, `Toast`

**UX Risks:**
- "Continue in background" requires notification permission to have been previously granted
- Auto-suggested title must be clearly labeled as a suggestion

**Implementation Risks:**
- `expo-image-manipulator` transforms must be applied cumulatively — transform stack state management is complex
- Merged Step 3+4 increases form length — use visual grouping

**Key Changes:** Steps 3+4 merged (5→4 steps). "Reset to Original" in Adjuster. Processing can be backgrounded. Document appears in Records with "Analyzing…" state.

---

### SCREEN 09 — Share / Doctors
**Purpose:** Generate time-limited QR code for doctor access. Core flow preserved.
**Dependencies:** `DocumentCard`, `ActiveProfileStrip`, `QRDisplay`, `SelectionCheckbox`
**Why this order:** Depends on `DocumentCard` from Records. Visual refresh, not structural redesign.
**Estimated Complexity:** Medium

**Components to Create:** `SelectableDocumentRow`, `ActiveProfileStrip`, `QRDisplay`, `QRCountdownTimer`, `ShareSummaryPill`, `GenerateQRButton`, `RegenerateLink`, `CameraScanner`
**Existing to Reuse:** `BottomSheet`, `Toast`, `EmptyStateCard`

**UX Risks:**
- Countdown timer must be clearly readable in a clinical setting under time pressure
- Camera scan button must not be confused with QR generation

**Implementation Risks:**
- `react-native-qrcode-svg` inside an animated countdown component may cause re-render issues — memoize the QR value

---

### SCREEN 10 — Profile
**Purpose:** Personal information hub. Identity, health details, family management.
**Dependencies:** `SanarchIDCard`, `HealthDetailsCard`, `AccountDetailsCard`, `FamilyMembersSection`, `ProfileAvatar`
**Why this order:** Builds on all previously created components. `SanarchIDCard` is designed here and reused in `SanarchIDModal` on Home.
**Estimated Complexity:** Medium

**Components to Create:** `ProfileHeader`, `ProfileAvatar`, `SanarchIDCard`, `HealthDetailsCard`, `AccountDetailsCard`, `MetricRow`, `FamilyMembersSection`, `FamilyMemberRow`, `ProfileCompletionNudge`, `SignOutButton`
**Existing to Reuse:** `BottomSheet`, `FormField`, `ConfirmationSheet`, `Toast`, `EmptyStateCard`

**UX Risks:**
- `ProfileCompletionNudge` must not feel nagging — show once per session
- Sign Out at scroll bottom must always be reachable with long family lists

**Implementation Risks:**
- `SanarchIDCard` 4-layer gradient requires combining `LinearGradient` + noise overlay + `BlurView` — test on mid-range devices

---

### SCREEN 11 — Settings
**Purpose:** App configuration in 4 scoped sections.
**Dependencies:** `SettingsSection`, `SettingsRow`, `ToggleRow`, `ConfirmationSheet`
**Why this order:** Last screen. All components established. Primarily composition.
**Estimated Complexity:** Low

**Components to Create:** `SettingsSection`, `SettingsRow`, `ToggleRow`, `DeleteAccountSheet`, `ExportDataLoader`
**Existing to Reuse:** `BottomSheet`, `ConfirmationSheet`, `Toast`, `PrimaryButton`

**UX Risks:**
- "Delete Account" must require explicit 3-step confirmation

**Implementation Risks:**
- "Export My Data" backend endpoint not yet built — UI must handle "coming soon" gracefully

---

## Part 3: Component Library Roadmap

### Category 1: Foundation
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `DesignTokens` | Color, spacing, radius, shadow constants | N/A | Universal | Every file |
| `ThemeProvider` | Provides token context | Light (v1) | Universal | `_layout.tsx` |
| `BrandLogo` | Sanarch SVG logo mark | `size` prop | High | Splash, Hero, Login, Profile |

### Category 2: Buttons
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `PrimaryButton` | Main CTA | `default`, `loading`, `disabled`, `destructive`, `full-width` | Universal | Every screen |
| `SecondaryButton` | Secondary actions | `default`, `loading`, `disabled` | High | Login, Onboarding, Dialogs |
| `GhostButton` | Low-emphasis text actions | `default`, `brand`, `destructive` | High | Headers, modals |
| `IconButton` | Icon-only interaction | `default`, `brand`, `ghost`, `circle` | Universal | Headers, cards, toolbars |
| `FAB` | Primary floating action | `default`, `extended` | High | Home, Records |
| `ExplainThisFAB` | AI summary trigger | Dark pill — single variant | Low | Record Detail |

### Category 3: Inputs
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `FormField` | Labeled text input | `text`, `email`, `numeric`, `disabled`, `error` | Universal | Login, Onboarding, Upload, Edit Profile |
| `SearchBar` | Inline search | `compact`, `expanded` | High | Home, Records |
| `OTPInputRow` | 6-box OTP | Single | Low | Login |
| `PhoneInputField` | Country code + number | Single | Low | Login |
| `TextareaField` | Multiline input | `with-count`, `without-count` | Medium | Upload notes |
| `CalendarPickerSheet` | Date picker | `past-only`, `future-allowed` | Medium | Onboarding, Edit Profile |
| `ResendCooldownTimer` | OTP resend countdown | Single | Low | Login |

### Category 4: Selection & Pickers
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `BottomSheetPicker` | Generic bottom sheet options | Searchable / Non-searchable | High | Login (country), Onboarding, Settings |
| `SegmentedControl` | 2-3 option toggle | `2-option`, `3-option` | High | Records (view toggle) |
| `PillSelector` | Multi-option pill cards | `single-select`, `multi-select` | High | Onboarding, Upload |
| `SelectionCheckbox` | Circular checkbox | `checked`, `unchecked`, `indeterminate` | Medium | Share screen |
| `GenderSelector` | 3-option gender picker | Single | Medium | Onboarding, Edit Profile |
| `AccountTypeCard` | Large selectable option card | `selected`, `default` | Low | Onboarding Step 1 |
| `CategoryOptionCard` | Document category card | `selected`, `default` | Medium | Upload Step 3 |

### Category 5: Cards
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `BaseCard` | Foundation card container | `default`, `subtle`, `outlined`, `active`, `glass`, `dark` | Universal | All screens |
| `DocumentCard` | Document list item | `default`, `processing`, `failed`, `selectable` | High | Records, Home, Share |
| `TreatmentGroupCard` | Grouped treatment container | `expanded`, `collapsed` | Medium | Records |
| `TimelineEventCard` | Timeline row item | `default`, `active` | High | Home, Record Detail |
| `HealthSummaryCard` | Stats strip | Single | Low | Home |
| `OverviewCard` | AI overview fact card | 3 type variants | Low | Record Detail |
| `SanarchIDCard` | Premium identity card | `full`, `compact` | Medium | Profile, SanarchIDModal |
| `FamilyMemberRow` | Family member list item | `active`, `inactive` | Medium | Profile, ProfileSwitcherSheet |
| `MetricRow` | Icon + label + value row | Single | High | HealthDetailsCard, AccountDetailsCard |
| `NotificationItem` | Notification list entry | `unread`, `read` | Medium | NotificationsSheet |

### Category 6: Document Components
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `CategoryBadge` | Document type indicator | 5 category variants | High | DocumentCard, Record Detail, Upload |
| `AIContentBadge` | "AI Extracted" indicator | Single | Medium | Record Detail |
| `DocumentThumbnail` | Small document image | `image`, `pdf`, `processing`, `failed` | High | DocumentCard, Record Detail |
| `ExpandableSection` | Accordion container | `default-open`, `default-closed` | High | Record Detail, Settings |
| `LabResultRow` | Single lab value display | `normal`, `high`, `low`, `critical` | Medium | Record Detail |
| `LabFlagBadge` | Lab result status badge | 4 status variants | Medium | LabResultRow |
| `MedicationCard` | Single medication entry | Single | Medium | Record Detail |
| `DiagnosisPill` | Inline diagnosis chip | Single | High | TreatmentGroupCard, Record Detail |
| `RelatedHistoryItem` | Timeline connector + card | Single | Low | Record Detail |
| `SelectableDocumentRow` | DocumentCard with checkbox | `selected`, `unselected` | Low | Share screen |

### Category 7: Upload Components
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `FileSelectionCard` | File source option | `camera`, `gallery`, `pdf` | Low | Upload Step 1 |
| `DocumentAdjuster` | Image manipulation canvas | Single | Low | Upload Step 2 |
| `AdjusterToolButton` | Individual adjustment tool | `active`, `inactive` | Low | Upload Step 2 |
| `AdjusterToolbar` | Toolbar container | Single | Low | Upload Step 2 |
| `CategorySelectorGrid` | 5-option category grid | Single | Low | Upload Step 3 |
| `UploadProgressBar` | File upload progress | Single | Low | Upload Step 4 |
| `ProcessingScreen` | AI processing animation | Single | Low | Upload Step 4 |
| `BackgroundProcessingLink` | "Continue in background" | Single | Low | Upload Step 4 |

### Category 8: Navigation
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `NavigationDock` | Floating pill tab bar | Single | Low | All tab screens |
| `TabDockItem` | Individual tab in dock | `active`, `inactive` | Low | NavigationDock |
| `CompactHeader` | Standard screen header | `with-back`, `with-actions`, `title-only` | High | All non-Home screens |
| `ExpandedHeader` | Home dashboard header | Single | Low | Home |
| `BottomSheet` | Base modal container | `full-height`, `partial`, `scrollable` | Universal | Every feature screen |
| `BackdropOverlay` | Dark dimmed backdrop | Single | High | BottomSheet, Modal |
| `ModalDialog` | Centered dialog | `confirm`, `info`, `destructive` | High | Delete, sign out, export |

### Category 9: Dialogs & Sheets
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `ConfirmationSheet` | Destructive action confirmation | `danger`, `warning` | High | Delete doc, Sign out, Delete account |
| `ProfileSwitcherSheet` | Profile selection sheet | Single | Medium | Home, Profile |
| `NotificationsSheet` | Notifications list | Single | Low | Home |
| `FilterSortSheet` | Combined sort + filter | Single | Low | Records |
| `CountryPickerSheet` | Country code selection | Single | Low | Login |
| `EditDocumentSheet` | Edit title + category | Single | Low | Record Detail |
| `AISummaryModal` | Glassmorphic AI explanation | Single | Low | Record Detail |
| `SanarchIDModal` | Full-screen identity card | Single | Low | Home shortcut |
| `DeleteAccountSheet` | 3-step account deletion | Single | Low | Settings |

### Category 10: Notifications & Feedback
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `Toast` | Transient feedback | `success`, `error`, `warning`, `info` | Universal | Every screen |
| `InlineError` | Field-level error | Single | High | All form inputs |
| `ProcessingBanner` | Ongoing operation status | `processing`, `complete`, `failed` | Medium | Records, Upload |
| `OfflineBanner` | Network unavailability | Single | Medium | Home, Records |
| `ProfileCompletionNudge` | Incomplete profile reminder | Single | Low | Profile |

### Category 11: Loading Components
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `SkeletonText` | Text placeholder | `short`, `medium`, `long` | High | All screens |
| `SkeletonCard` | Card placeholder | `document`, `timeline`, `profile` | High | Home, Records, Profile |
| `SkeletonAvatar` | Avatar placeholder | Single | Medium | Profile, Header |
| `SkeletonSection` | Section placeholder | Single | Medium | Record Detail |
| `CircularSpinner` | In-button loading | `white`, `brand` | High | All CTA buttons |
| `ShimmerWrapper` | Applies shimmer to children | Single | High | All skeleton components |

### Category 12: Empty States
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `EmptyStateCard` | Standard empty state | 6 contextual variants | High | Every screen with lists |
| `FirstTimeEmptyState` | New user home replacement | Single | Low | Home (0 docs) |

### Category 13: Status & Indicators
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `StepProgressBar` | Wizard progress | Single | High | Onboarding, Upload |
| `PageDotIndicator` | Swiper position | `vertical`, `horizontal` | Low | Hero screen |
| `QRDisplay` | QR code display | Single | Low | Share screen |
| `QRCountdownTimer` | Animated countdown ring | Single | Low | Share screen |
| `ShareSummaryPill` | Share context descriptor | Single | Low | Share screen |
| `StatusDot` | Generic status dot | 5 color variants | High | Many |
| `LabAlertToggle` | Lab alert filter toggle | Single | Low | Record Detail |

### Category 14: Settings Components
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `SettingsSection` | Labeled group container | Single | Medium | Settings |
| `SettingsRow` | Config row | `toggle`, `navigate`, `action`, `destructive` | Medium | Settings |

### Category 15: Profile Components
| Component | Purpose | Variants | Reusability | Used In |
|---|---|---|---|---|
| `ProfileAvatar` | User initial letter avatar | `sm(32)`, `md(40)`, `lg(64)`, `xl(80)` | High | Home header, Profile, Family list |
| `ActiveProfileStrip` | Active profile in Share | Single | Low | Share screen |

---

## Part 4: Phased Implementation Roadmap

### Phase 0 — Foundation (2–3 days)
**Goal:** Lock all tokens and utilities before any component is built.
```
□ Install Plus Jakarta Sans + JetBrains Mono via expo-google-fonts
□ Define all design tokens in tailwind.config.js
□ Build ThemeProvider wrapper
□ Build BrandLogo SVG component
□ Build ShimmerWrapper animation utility
□ Write shared animation constants (duration, easing values)
□ Set up BaseCard with all variants
□ Establish component file structure: /components/[category]/ComponentName.tsx
```
**Risk:** Token decisions here cascade everywhere. Lock before Phase 1.

### Phase 1 — Base Component Library (4–5 days)
**Goal:** All shared primitives every screen depends on.
```
Buttons:   PrimaryButton, SecondaryButton, GhostButton, IconButton, FAB
Inputs:    FormField, SearchBar, TextareaField, BottomSheetPicker (base)
Navigation: BottomSheet (base), BackdropOverlay, CompactHeader
Feedback:  Toast (all 4), InlineError
Loading:   SkeletonText, SkeletonCard, SkeletonAvatar, CircularSpinner, ShimmerWrapper
Empty:     EmptyStateCard (all contextual variants)
```

### Phase 2 — Auth Stack (3–4 days)
**Goal:** Complete auth flow. Validates base components in real context.
```
□ Splash Screen
□ Hero Screen (HeroPage, PageDotIndicator, SkipLink)
□ Login Screen (PhoneInputField, OTPInputRow, CountryPickerSheet, TOSDisclaimer, ResendCooldownTimer, BiometricPrompt)
□ Onboarding Wizard (StepProgressBar, AccountTypeCard, GenderSelector, CalendarPickerSheet, AccountCreationLoader, SanarchIDReveal)
```

### Phase 3 — Document Component Library (3 days)
**Goal:** Build all document-specific components before any screen that shows documents.
```
□ CategoryBadge (5 category variants)
□ AIContentBadge
□ DocumentThumbnail (image / pdf / processing / failed)
□ DocumentCard (default, processing, failed, selectable)
□ DiagnosisPill
□ LabFlagBadge (normal / high / low / critical)
□ LabResultRow
□ MedicationCard
□ StatusDot
```

### Phase 4 — Home Screen (3 days)
**Goal:** Primary returning-user experience.
```
□ NavigationDock + TabDockItem (must exist before Home can be previewed)
□ HomeHeader (greeting, ProfileAvatar, SanarchIDShortcut, bell)
□ ProfileSwitcherSheet
□ SanarchIDCard (Full variant)
□ SanarchIDModal
□ HealthSummaryCard
□ TimelineEventCard + TimelineSection
□ FirstTimeEmptyState
□ NotificationsSheet
□ OfflineBanner
```

### Phase 5 — Records & Record Detail (5–6 days)
**Goal:** Primary data browsing and consumption experience.
```
Records List:
□ FilterChips, ViewToggle (SegmentedControl)
□ TreatmentGroupCard
□ FilterSortSheet
□ MultiSelectToolbar
□ InlineSearchBar

Record Detail:
□ RecordDetailHeader
□ ExpandableSection
□ OverviewSection + OverviewCard
□ LabResultsSection + LabAlertToggle
□ RelatedHistoryTimeline + RelatedHistoryItem
□ ExplainThisFAB
□ AISummaryModal
□ EditDocumentSheet
□ ConfirmationSheet (Delete)
```

### Phase 6 — Upload Wizard (4 days)
**Goal:** Document intake flow.
```
□ FileSelectionCard (3 variants)
□ DocumentAdjuster + AdjusterToolbar + AdjusterToolButton
□ CategorySelectorGrid + CategoryOptionCard
□ UploadProgressBar
□ ProcessingScreen + BackgroundProcessingLink
□ ProcessingBanner (document status in Records)
```

### Phase 7 — Share Screen (2 days)
**Goal:** Doctor QR sharing flow. Visual refresh, core flow preserved.
```
□ ActiveProfileStrip
□ SelectableDocumentRow
□ GenerateQRButton
□ QRDisplay + QRCountdownTimer
□ ShareSummaryPill + RegenerateLink
□ CameraScanner
```

### Phase 8 — Profile & Settings (3 days)
**Goal:** Identity and configuration screens.
```
Profile:
□ ProfileHeader, ProfileAvatar (XL variant)
□ HealthDetailsCard + AccountDetailsCard + MetricRow
□ FamilyMembersSection + FamilyMemberRow
□ ProfileCompletionNudge, SignOutButton
□ ConfirmationSheet (Sign out)

Settings:
□ SettingsSection + SettingsRow + ToggleRow
□ DeleteAccountSheet + ExportDataLoader
```

### Phase 9 — Polish & Accessibility (3 days)
**Goal:** Consistency, accessibility, and performance across the entire app.
```
□ Add accessibilityLabel to all icon-only buttons
□ Verify all tap targets meet 44×44px minimum
□ Implement prefers-reduced-motion (disable all animations)
□ Test all skeleton → content transitions
□ Test all empty states and error states
□ Performance audit: FlatList / FlashList optimization
□ Verify NavigationDock on all device sizes (SE to Pro Max)
□ Verify font scaling at 150% system text size
□ Benchmark SanarchIDCard on mid-range device
□ End-to-end flow test: Register → Upload → View → Share
```

---

## Part 5: Component Count Summary

| Phase | New Components | Reused |
|---|---|---|
| Phase 0 (Foundation) | 4 | 0 |
| Phase 1 (Base Library) | 22 | 0 |
| Phase 2 (Auth) | 14 | 6 |
| Phase 3 (Doc Components) | 9 | 2 |
| Phase 4 (Home) | 12 | 10 |
| Phase 5 (Records + Detail) | 16 | 14 |
| Phase 6 (Upload) | 8 | 5 |
| Phase 7 (Share) | 8 | 6 |
| Phase 8 (Profile + Settings) | 10 | 8 |
| Phase 9 (Polish) | 0 | All |
| **Total** | **103** | — |

---

## Part 6: Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Token changes after Phase 1 cascade into all components | High | Lock all tokens before Phase 1 begins |
| `DocumentCard` designed incorrectly affects Records, Home, and Share | High | Build all 4 variants before any screen uses it |
| `BottomSheet` animation conflicts with keyboard on Android | Medium | Test on Android during Phase 1 |
| Nested VirtualizedList in TreatmentGroupCard causes performance warnings | Medium | Evaluate FlashList or flat data structure before Phase 5 |
| SanarchIDCard 4-layer gradient slow on mid-range devices | Medium | Benchmark during Phase 4 |
| Phase sequencing violated (screen built before its components) | High | No screen PR merged unless all Phase 3 component PRs are merged |
| Firebase OTP behavior differs iOS vs Android | Medium | Implement and test both in Phase 2 |
| Upload backgrounding requires pre-granted notification permission | Medium | Request notification permission at Onboarding success screen |

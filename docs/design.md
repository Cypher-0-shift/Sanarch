# DESIGN.md — Sanarch Mobile Design System
### "Intelligent Clarity" — UI/UX Specification & Design Tokens

> **Target Platform**: React Native + Expo Router + NativeWind v4/Tailwind + TypeScript  
> **Location**: `docs/design.md`  
> **Core Principle**: Precision, clinical authority, warmth, and human-centric clarity. Sanarch bridges document intelligence with a calm, trustworthy health experience.

---

## 1. Design Philosophy & Aesthetic Vision

Sanarch is a personal health intelligence platform. The visual metaphor is **organized clarity from clinical complexity** — structured, calming, and deeply credible.

### Guiding Principles:
1. **Medical Authority with Warmth**: Built on Sanarch Deep Forest Green (`#004D36`) and Warm Canvas (`#F5F3F0`), avoiding both sterile clinical-white SaaS and aggressive consumer neon.
2. **Tactile Depth & Structure**: Layered surfaces with subtle borders (`#E5E2DE`), smooth corner radiuses, and ambient elevation.
3. **Elastic & Accessible**: Designed from the ground up for OS font scaling (100% to 200%), safe area insets, dynamic text wrapping without orphaned words, and WCAG AA contrast compliance.
4. **Signature Anchors**: Distinctive visual elements (the signature curved SVG wave navigation bar and bank-grade Sanarch ID card) give the interface instant recognizability.

---

## 2. Color System & Design Tokens

### 2.1 Core Palette

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| `primary` | `#004D36` | Brand anchor, active tabs, primary buttons, key headers |
| `primary-light` | `#006B4D` | Active button highlights, secondary accents |
| `accent-green` | `#E8F5E9` | Selected card backgrounds, success washes, badge tints |
| `background-light` | `#F5F3F0` | Warm primary app canvas |
| `background-dark` | `#2D3A2F` | High-contrast dark cards, hero sections |
| `surface` | `#FFFFFF` | Form cards, document cards, modal sheets |
| `border-soft` | `#E5E2DE` | Structural divider lines and card borders |
| `border-focus` | `#004D36` | Active input container borders |

### 2.2 Text & Ink Tokens

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `text-dark` | `#2D3A2F` | Primary headings, prominent values, active titles |
| `text-muted` | `#5C6E60` | Body copy, descriptions, secondary card details |
| `text-light` | `#819685` | Metadata labels, timestamps, placeholders, counter text |

### 2.3 Semantic & Clinical Status Tokens

| Status / Category | Text & Icon | Background Tint | Context |
| :--- | :--- | :--- | :--- |
| **Normal / Stable** | `#2E7D32` | `#E8F5E9` | Normal lab values, verified badges |
| **Warning / Low** | `#D97706` | `#FFFBEB` | Low lab markers, pending reviews |
| **Critical / High** | `#DC2626` | `#FEF2F2` | Abnormal lab alerts, error messages |
| **Prescriptions** | `#7B1FA2` | `#F3E5F5` | Medication entries, dosage tags |
| **Lab Reports** | `#1976D2` | `#E3F2FD` | Blood tests, pathology records |
| **Consultations** | `#388E3C` | `#E8F5E9` | Doctor notes, clinical summaries |

---

## 3. Typography & Hierarchy

### 3.1 Type Families
- **Primary Display & UI**: `Inter` (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`)
- **Data & Identifiers**: `JetBrains Mono` / `Inter_700Bold` for SANARCH IDs, lab numbers, and medical codes.

### 3.2 Typography Scale

```
Display Hero:    32–36 dp / Bold / Tracking: -0.5px  (Splash, Brand intro)
Heading 1 (L):   28 dp    / Bold / Tracking: -0.5px  (Screen titles, Auth headings)
Heading 2 (M):   20–22 dp / SemiBold / Tracking: -0.3px (Section headers, Modal titles)
Heading 3 (S):   16–18 dp / SemiBold (Card titles, feature highlights)
Body (Regular):  14–15 dp / Regular (Primary paragraphs, list copy)
Body (Medium):   13–14 dp / Medium (Form labels, button text)
Caption / Meta:  11–12 dp / Medium/SemiBold (Timestamps, badge labels, helper text)
Micro / Caps:    9–10 dp  / Bold / Uppercase / Tracking: +0.5px (Status pills, Category tags)
```

### 3.3 Text Scaling & Orphan Rules
- **No Hardcoded Line Breaks**: Avoid `\n` in headlines; let container boundaries determine natural flow.
- **Elastic Multipliers**: Use `maxFontSizeMultiplier={1.2}` to `{1.3}` on dense UI labels so accessibility zoom does not cause layout clipping.
- **Orphan Prevention**: Use non-breaking spaces (`\u00A0`) or explicit `maxWidth` containers to prevent single trailing words on multi-line text blocks.
- **Avoid Shrink-to-Fit**: Do not pair `adjustsFontSizeToFit` with `numberOfLines={1}` on critical headings; allow natural multi-line wrapping with relative line heights.

---

## 4. Radiuses, Elevation & Depth

### 4.1 Corner Radiuses (`RADIUS`)

```typescript
export const RADIUS = {
  sm: 8,    // Badges, tags, chips
  md: 12,   // Form inputs, small cards, tooltips
  lg: 16,   // Standard cards, action rows
  xl: 24,   // Hero cards, dialog containers, primary buttons
  xxl: 32,  // Bottom sheets, modal cards
  full: 9999, // Circular badges, pills, avatar containers
};
```

### 4.2 Shadows & Elevation
- **Card Elevation**: `shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2`
- **Floating Button Elevation**: `shadowColor: '#004D36', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8`
- **Bottom Navigation Elevation**: Ambient top shadow on SVG wave container (`shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 20`).

---

## 5. Core Component Architecture

### 5.1 Signature Navigation Bar (`app/(tabs)/_layout.tsx`)
- **Curved SVG Wave**: Custom `#015C42` wave background path across screen width.
- **Active / Inactive Tint**: `#FFFFFF` for active tab, `rgba(255, 255, 255, 0.5)` for inactive tabs.
- **Floating Share Action**: 64dp circular floating button (`#004D36`) with 4dp white border and high elevation (`top: -15`).
- **Standard Tabs**: Home, Upload, Share (Center), Records, Profile.

### 5.2 Forms & Inputs
- **Container Height**: `minHeight: 54` dp with dynamic padding for vertical elasticity.
- **Country Code Selector**: Embedded country flag and code button with vertical divider, opening a searchable modal bottom sheet.
- **Consent Rows**: Checkbox aligned to top of first text line (`marginTop: 2`), ensuring visual anchoring even when legal copy wraps across multiple lines.
- **OTP Input**: Distributed 6-box row with `flex: 1` per cell, active focus highlight, and overlay text input for reliable SMS autofill.

### 5.3 Sanarch ID Card
- **Visual Style**: Deep dark forest green / slate card (`#2D3A2F` / `#004D36`).
- **Typography**: Letter-spaced `SANARCH ID` tag, monospace ID format (`SAN-IN-XX-XXXXXX-X`).
- **QR Tile**: Crisp high-contrast white rounded tile with 10-minute temporary expiration and doctor sharing flow.

### 5.4 Document & Event Timeline Cards
- **Card Architecture**: White background, `borderWidth: 1`, `borderColor: '#E5E2DE'`, `borderRadius: 16`.
- **Category Badge**: Icon + label container (e.g. `Prescription`, `Lab Report`, `Consultation`) with matching semantic tint.
- **AI Badges**: `AI Extracted` badge with brain/sparkle icon to convey processed document intelligence.

---

## 6. Layout, Safe Area & Accessibility

1. **Safe Area Discipline**: Always use `react-native-safe-area-context` with `edges={['top', 'bottom']}` for root layouts to prevent collisions with device notches and home gesture bars.
2. **Keyboard Handling**: Wrap interactive auth and form screens in `KeyboardAvoidingView` with `keyboardShouldPersistTaps="handled"`.
3. **Contrast Standards**: All text elements must achieve at least **4.5:1** contrast (WCAG AA). Inactive interactive elements on light backgrounds must achieve at least **3:1** non-text contrast.
4. **Touch Targets**: All interactive elements (buttons, checkboxes, toggles) must provide a minimum tap target of **44×44 dp** (using `hitSlop` where needed).

---

## 7. Motion & Interaction Specifications

```typescript
// Standard animation curves
Button Press:       Scale down to 0.97 (100ms ease-out), spring back on release
Card Entrance:      FadeInUp.duration(400).springify()
Modal Bottom Sheet: Slide from bottom (350ms spring), backdrop fade (200ms)
List Stagger:       Staggered card entrance with 80ms delay intervals
```

---

## 8. Do's and Don'ts

### Do:
- Use semantic color tokens (`primary`, `accent-green`, `background-light`, `text-dark`).
- Keep buttons and input fields elastic with `minHeight` rather than fixed `height`.
- Apply non-breaking spaces to multi-word phrases to prevent single trailing word orphans.
- Maintain the signature `#015C42` wave navbar and floating center action button.
- Ensure all screens render smoothly at both standard (100%) and accessibility (130%–150%) font scales.

### Don't:
- Don't use generic unstyled system gray (`#888888`) — use curated palette shades (`#819685`, `#5C6E60`, `#2D3A2F`).
- Don't hardcode fixed font-size assumptions that clip at larger OS text sizes.
- Don't flatten shadows into a single harsh black edge.
- Don't shrink headings into illegible micro-text via `adjustsFontSizeToFit`.

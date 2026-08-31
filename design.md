# DESIGN.md — Sanarch
### "Intelligent Clarity" — Design System for AI Coding Agents (Antigravity)

> Drop this file in the project root. Reference it in every UI-generation prompt:
> "Follow DESIGN.md exactly — tokens, components, motion, and the do/don't rules below."
> Stack: React Native + Expo Router + NativeWind v4/Tailwind + TypeScript.
> This is a **mobile app**, not a website — treat all spacing/typography as RN dp units, not px, and ignore web-only guidance (hover states, cursors).

---

## 1. Concept

Sanarch is a document-intelligence health app. The visual metaphor is a blurry scan snapping into focus — precision, calm, competence. **Not** clinical-white SaaS, **not** healthcare-green. A premium intelligence platform that happens to handle health data. Think Stripe/Linear confidence, not hospital-portal sterility.

Five-question gut check before any screen ships:
1. Would this feel at home in a Stripe/Linear product?
2. Does the depth feel natural (soft layered shadows, not flat)?
3. Is color carrying meaning, or just decorating?
4. Do dark surfaces feel authoritative, not heavy?
5. Is there exactly one element on this screen that feels premium?

---

## 2. Color Tokens

```
// Brand
brand-primary   #4361EE   // Electric Indigo — primary accent
brand-deep      #3A0CA3   // gradient depth
brand-glow      #7B9BFF   // glows/highlights, dark-surface active icons
brand-tint      #EEF2FF   // washes, selected-state backgrounds

// Neutrals (warm-tinted — never pure gray)
canvas          #F9FAFB
surface         #FFFFFF
surface-sub     #F4F5F7
ink-900         #111827
ink-800         #1F2937
ink-600         #4B5563
ink-400         #9CA3AF
ink-300         #D1D5DB
ink-200         #E5E7EB
ink-100         #F3F4F6

// Dark surfaces (nav dock, splash, AI modal, Sanarch ID card ONLY)
dark-950        #0D1117
dark-900        #161B22
dark-800        #21262D
dark-700        #30363D
dark-glow       rgba(67,97,238,0.25)

// Semantic (lab results — the ONLY other non-neutral colors allowed)
result-normal    #059669 / bg #ECFDF5
result-high      #DC2626 / bg #FEF2F2
result-low       #D97706 / bg #FFFBEB
result-critical  #7C3AED / bg #F5F3FF   // distinct from brand on purpose

// Document categories
lab-report        #4361EE / bg #EEF2FF
prescription      #7C3AED / bg #F5F3FF
imaging-scan       #0891B2 / bg #ECFEFF
discharge-summary  #0D9488 / bg #F0FDFA
other              #6B7280 / bg #F9FAFB
```

**Rule:** color is reserved for brand accent, category tags, and lab status only. Everything else is `ink` or `canvas`. If you're tempted to add a new hue, don't — use ink weight or elevation instead.

---

## 3. Typography

```
Display font:  Plus Jakarta Sans  (expo-google-fonts)
Mono font:     JetBrains Mono     (Sanarch ID, lab values, all numeric/data display)

display-hero   48 / 800 / lh 1.1  / tracking -0.03em   (Splash, Hero only)
display-lg     36 / 700 / lh 1.15 / tracking -0.025em
display-md     28 / 700 / lh 1.2  / tracking -0.02em   (screen titles)
heading-xl     20 / 600 / tracking -0.01em             (section headers)
heading-md     16 / 600 / tracking 0                   (card titles)
body           14–15 / 400–500
label-md       12 / 500                                (metadata)
label-sm/caps  11 / 600 / uppercase / tracking 0.08em / color ink-400  (use sparingly)
```

**Hard rule:** any text ≥20px MUST use negative letter-spacing. This single rule is what keeps headings from looking like default React Native text.

---

## 4. Elevation (always two-layer shadows — never a single flat shadow)

```
elevation-1  0 1px 2px rgba(17,24,39,.04), 0 4px 8px rgba(17,24,39,.04)
elevation-2  0 2px 4px rgba(17,24,39,.04), 0 8px 16px rgba(17,24,39,.06)
elevation-3  0 4px 8px rgba(17,24,39,.04), 0 16px 32px rgba(17,24,39,.08)
elevation-4  0 8px 16px rgba(17,24,39,.06), 0 24px 48px rgba(17,24,39,.12)
elevation-5  0 16px 32px rgba(17,24,39,.08), 0 40px 80px rgba(17,24,39,.16)
elevation-brand  0 4px 12px rgba(67,97,238,.25), 0 1px 4px rgba(67,97,238,.15)  // primary btn + FAB only
```

Selected/active elements: border tints to `rgba(67,97,238,.25)` AND shadow gains brand color at low opacity. Never change border color alone — pair it with a shadow shift.

---

## 5. Surfaces & Cards

```
Standard card:     bg #FFF, border 1px rgba(17,24,39,.06), radius 20, elevation-1
Selected card:      bg #FFF, border 1.5px rgba(67,97,238,.25), elevation-brand-ish glow
AI Intelligence card: gradient 135deg #EEF2FF→#FFF (70%), border rgba(67,97,238,.15), soft indigo shadow
Dark card (nav/splash): bg dark-900, border rgba(255,255,255,.06), inset top highlight rgba(255,255,255,.06)
```

Icon containers: **rounded square (radius 10), never a circle.** 40×40 standard / 32×32 compact / 48×48 feature. Fill = category color or brand-tint; icon = category color or brand-primary.

---

## 6. Glassmorphism — exactly 3 places, nowhere else

1. **AI Summary Modal:** bg rgba(255,255,255,.85), blur(20) saturate(1.6), border rgba(255,255,255,.5)
2. **Document preview overlay:** dark gradient scrim to transparent + frosted button (rgba(255,255,255,.12) bg, blur(12))
3. **Navigation dock:** bg rgba(13,17,23,.92), blur(24) saturate(1.2)

If Antigravity reaches for `backdrop-filter`/blur anywhere else, that's a violation — flag it.

---

## 7. Navigation Dock (signature component)

Floating dark pill, NOT a standard tab bar.
```
bg rgba(13,17,23,.94), blur(24) saturate(1.3)
radius 30 (all corners), height 64, width = screen − 40, floating 24 from bottom
shadow 0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)
border 1px rgba(255,255,255,.06) + inset top highlight rgba(255,255,255,.08)

Active tab: NOT an underline. Soft circular glow bg rgba(67,97,238,.20), radius 12,
icon color → brand-glow (#7B9BFF) from rgba(255,255,255,.40)

Center FAB: 52×52, offset -10 top, gradient(135deg #4361EE→#3A56D4),
shadow 0 4px 20px rgba(67,97,238,.45), 2px rim border rgba(255,255,255,.15)
press: scale(0.88) + shadow collapse, 120ms spring
```

---

## 8. Sanarch ID Card — the one "premium anchor" element

Dark card (dark-950 base), radial indigo mesh top-right, 4% noise texture, subtle gloss gradient, two decorative circles Stripe-style. `SANARCH` label all-caps 10px tracking .25em at 50% white. ID value in JetBrains Mono. QR on a white 0.95-opacity tile, radius 10. This card must look bank-card premium — it's the one element every screen audit should protect.

---

## 9. Motion

```
Button press:     scale(.97) primary / scale(.98) secondary / scale(.90) icon / scale(.88) FAB
                   100ms ease-out down, spring(stiffness 400, damping 28) back
Card select:       border + bg wash + shadow, 200ms ease-out
Input focus:       border color 200ms, glow ring fades in 200ms, NO scale (avoid layout shift)
Bottom sheet in:    translateY 100%→0, 380ms spring(280,28); backdrop fade 250ms
Bottom sheet out:   translateY 0→100%, 280ms ease-in (faster than entry)
Accordion:          height 0→auto 280ms ease-out; content opacity fades in starting at 80ms offset
Skeleton→content:   skeleton fades 200ms while content starts fading in at the halfway point
```

Respect `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled()` — disable all non-essential motion when set.

---

## 10. Do / Don't

**Do:**
- Two-layer shadows for every elevated surface
- Negative letter-spacing on anything ≥20px
- Rounded-square icon containers (radius 10)
- Reserve color for brand accent + category + lab status only
- Dark surfaces = intelligence/authority signal (nav dock, AI modal, ID card) — keep this exclusive
- One clear premium anchor per screen, not maximal decoration everywhere

**Don't:**
- Purple-to-blue default AI gradients on plain white cards (Sanarch's indigo gradient is reserved for primary buttons/FAB only — never backgrounds or generic cards)
- Generic system font / default Inter — always Plus Jakarta Sans + JetBrains Mono for data
- Cards nested in cards
- Circular icon badges
- Glassmorphism outside the 3 approved contexts
- Flat single-value shadows
- New hues outside the palette above

---

## 11. Reference

Full source specs (for anything not covered above, defer to these in this priority order):
1. UX Specification v2.0 — screen behavior, states, journeys (function always wins over visuals)
2. Visual Identity Spec v1.0 — full token rationale
3. Redesign Roadmap — component build order and phased sequencing

**UX correctness always overrides visual polish.** If a design instinct here conflicts with a documented user journey, empty state, or error state, the UX spec wins.
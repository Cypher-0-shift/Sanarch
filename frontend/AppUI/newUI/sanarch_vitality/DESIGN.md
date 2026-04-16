# Design System Strategy: Sanarch Healthcare

## 1. Overview & Creative North Star
**Creative North Star: "Vital Serenity"**

In the healthcare space, the "standard" approach is often cold, clinical, and overly rigid. This design system breaks that mold by embracing a "Vital Serenity" aesthetic—an editorial-inspired framework that balances high-energy clinical precision with soft, approachable luxury. 

We move beyond the "template" look by utilizing **Intentional Asymmetry** and **Tonal Depth**. Instead of boxing information into a grid of squares, we use varied spacing and overlapping surfaces to guide the eye. Sanarch should feel like a premium wellness concierge: authoritative yet breathable, energetic yet calming.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a high-vibrancy green that signifies life and recovery, supported by a sophisticated range of neutral "Surfaces" to create a sense of architectural layering.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. Use `surface-container-low` for large section backgrounds sitting on a `surface` base. If a section needs to stand out, use `surface-container-highest` to create a natural inset feel.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
- **Base Layer:** `surface` (#f5f7f8)
- **Secondary Sectioning:** `surface-container-low` (#eef1f2)
- **Actionable Cards:** `surface-container-lowest` (#ffffff)
- **Nesting Logic:** To define importance, place a `surface-container-lowest` card inside a `surface-container-low` section. This provides a soft, natural "lift" without the clutter of lines.

### The "Glass & Gradient" Rule
To elevate Sanarch above generic healthcare apps, use **Glassmorphism** for floating elements (like Bottom Navigation or Sticky Headers). 
- Use semi-transparent `surface` colors with a `backdrop-blur` of 20px–40px. 
- **Signature Gradients:** For primary CTAs and Hero sections, use a subtle linear gradient from `primary` (#006a35) to `primary_container` (#6bfe9c). This adds "soul" and a sense of light-source direction that flat colors lack.

---

## 3. Typography
Typography is our primary tool for establishing trust and hierarchy. We pair the editorial weight of **Plus Jakarta Sans** with the functional clarity of **Inter**.

- **Display & Headlines (Plus Jakarta Sans):** Used for "Sanarch Moments"—onboarding, screen titles, and health metrics. Bold weights (700+) are mandatory to create an authoritative, premium feel.
- **Body & Labels (Inter):** Used for medical data, descriptions, and UI actions. Inter’s tall x-height ensures readability in high-stress medical contexts.
- **Hierarchy Tip:** Use `display-lg` for hero numbers (e.g., Heart Rate) to make them the focal point of the layout, surrounded by ample white space (`spacing-12` or `spacing-16`).

---

## 4. Elevation & Depth
We eschew traditional "box shadows" in favor of **Tonal Layering** and **Ambient Light.**

- **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` element on top of `surface-dim` creates an immediate sense of tactile hierarchy.
- **Ambient Shadows:** For floating elements (Modals, FABs), use extra-diffused shadows. 
    - *Shadow Token:* Blur: 40px, Spread: 0, Opacity: 6% of `on_surface`. 
    - Never use pure black (#000) for shadows; always use a tinted version of your darkest neutral to maintain a "natural light" feel.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., Input Fields), use `outline-variant` at **20% opacity**. 100% opaque borders are strictly forbidden.
- **Glassmorphism:** Use `surface_variant` at 60% opacity with a blur effect to create "frosted" overlays that allow background colors to bleed through, softening the interface.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `full` roundedness, and a subtle white inner-glow (1px white top-stroke at 20% opacity).
- **Secondary:** `surface-container-high` background with `on_primary_container` text. No border.
- **Tertiary:** Pure text with `primary` color, used for low-priority actions like "Learn More."

### Input Fields
- **Styling:** Use `surface-container-low` as the field background. On focus, transition the background to `surface-container-lowest` and apply a "Ghost Border" of `primary` at 40% opacity.
- **Corners:** Use `md` (0.75rem) roundedness to maintain the "smooth" brand promise.

### Cards & Health Metrics
- **Forbidden:** Never use dividers within a card. 
- **Guideline:** Separate content using `spacing-3` or background tonal shifts. For example, a "Header" section of a card can have a `surface-container-highest` background, while the "Body" remains `surface-container-lowest`.

### Chips (Specialty Tags)
- Use `secondary_container` with `on_secondary_container` text. These should feel like soft "pills" that float within the layout.

### Contextual Health Components
- **The Vitality Graph:** Use `primary` for positive trends and `tertiary` (#006576) for neutral data. Graphs should be "frameless," sitting directly on the surface without axes or grids to maintain the editorial look.

---

## 6. Do’s and Don’ts

### Do:
- **Use "White Space as a Feature":** Treat empty space as a luxury element. If a screen feels crowded, increase spacing tokens rather than adding lines.
- **Embrace Asymmetry:** Align headings to the left while keeping action buttons floating or slightly offset to create a dynamic, modern flow.
- **Soft Corners:** Use `xl` (1.5rem) for large containers and `md` (0.75rem) for smaller elements. This "nested rounding" creates a sophisticated, organic feel.

### Don’t:
- **Don’t use 100% Black:** Even for text, use `on_surface` (#2c2f30). Pure black breaks the "Vital Serenity" softness.
- **Don’t use standard Dividers:** If you feel the urge to use a `<hr>` or a 1px line, replace it with an 8px vertical gap or a subtle color shift between `surface` tiers.
- **Don’t over-shadow:** If more than two elements on a screen have shadows, the layout will feel "dirty." Rely on tonal layering first.
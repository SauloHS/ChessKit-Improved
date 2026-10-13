---
version: alpha
name: Chess
description: |
  Chess.com's design embodies strategic sophistication paired with accessible
  approachability. The system leverages a dark, intimate canvas with crisp white
  typography and a vibrant lime-green accent to create confident visual
  hierarchy. The interplay between deep neutral backgrounds (#302E2B) and
  high-contrast primary elements (#FFFFFF) establishes clarity without
  harshness. Generous whitespace, deliberate use of depth through subtle
  shadows, and a bold sans-serif typeface family (Chess Sans for display; system
  stack for body) convey authority while remaining welcoming. The design favors
  clarity and usability over ornamentation—each element serves a purpose, from
  the navigation sidebar to the prominent call-to-action buttons that anchor
  user journeys.
source:
  url: "https://chess.com"
  pagesAnalyzed: 1
  extractedAt: 2026-10-13
  tokensMeasured: true
colors:
  primary: "#FFFFFF"
  canvas: "#302E2B"
  ink: "#FFFFFF"
  hairline: "#4B4847"
typography:
  display:
    fontFamily: "Chess Sans"
    fontSize: 42px
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: 0px
  heading-md:
    fontFamily: "Chess Sans"
    fontSize: 36px
    fontWeight: 800
    lineHeight: 1.11
    letterSpacing: 0px
  heading-sm:
    fontFamily: "Chess Sans"
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.27
    letterSpacing: 0px
  heading-xs:
    fontFamily: "Chess Sans"
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: 0px
  body-xl:
    fontFamily: "Chess Sans"
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: 0px
  body-lg:
    fontFamily: -apple-system
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: 0px
  body-lg-strong:
    fontFamily: -apple-system
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.56
    letterSpacing: 0px
  body-md:
    fontFamily: "Chess Sans"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: 0px
  body-sm:
    fontFamily: -apple-system
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0px
  body-xs:
    fontFamily: -apple-system
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: 0px
  button:
    fontFamily: -apple-system
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: 0px
  caption:
    fontFamily: "Chess Sans"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 5px
  sm: 10px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 40px
  xxxl: 80px
  section: 92px
  band: 172px
borderWidths:
  thin: 1px
shadows:
  sm: "rgba(0, 0, 0, 0.3) 0px 3px 8px 0px"
elevationStrategy: single-tier
themes:
  derived: light   # the other theme is the site's measured palette
  light:
    bg: "#FBFBFB"
    surface: "#F1F1F1"
    surfaceRaised: "#E9E9E9"
    text: "#1D1D1D"
    textMuted: "#707070"
    border: "#D8D8D8"
    accent: "#707070"
    accentFg: "#FFFFFF"
    focusRing: "#8F8F8F"
    elevation: shadow
  dark:
    bg: "#302E2B"
    surface: "#2F2D2A"
    surfaceRaised: "#403E3B"
    text: "#FFFFFF"
    textMuted: "#B7B6B5"
    border: "#4B4847"
    accent: "#FFFFFF"
    accentFg: "#0B0B0C"
    focusRing: "#FFFFFF"
    elevation: "border+surface"
gradients:
  - context: section
    kind: linear
    value: "linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(rgb(129, 182, 76) 0%, rgb(93, 153, 72) 100%)"
components:
  button-text:
    typography: "{typography.button}"
    textColor: "rgba(255, 255, 255, 0.72)"
    height: 40px
    padding: "8px 8px 8px 8px"
    rounded: "{rounded.xs}"
  card:
    typography: "{typography.body-sm}"
    textColor: "rgb(49, 46, 43)"
  card-sm:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
  badge-icon:
    textColor: "rgba(255, 255, 255, 0.5)"
    height: 24px
    fontSize: 14px
    fontFamily: -apple-system
    fontWeight: 400
    lineHeight: 1.5
  navigation:
    typography: "{typography.body-sm}"
    textColor: "rgb(49, 46, 43)"
    padding: "8px 8px 12px 8px"
    backgroundColor: "rgba(0, 0, 0, 0.2)"
  footer:
    typography: "{typography.body-sm}"
    textColor: "rgb(49, 46, 43)"
    padding: "4px 15px 15px 15px"
  link:
    typography: "{typography.body-xl}"
    textColor: "{colors.ink}"
    padding: "0px 16px 0px 16px"
    boxShadow: "color(srgb 0.698039 0.878431 0.407843 / 0.4) 0px 1px 0px 0px inset, rgb(69, 117, 60) 0px -1px 0px 0px inset, color(srgb 0.698039 0.878431 0.407843 / 0.5) 0px 2px 4px 0px inset, color(srgb 0.270588 0.458824 0.235294 / 0.5) 0px -2px 4px 0px inset, rgba(0, 0, 0, 0.14) 0px 1px 2px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px"
    rounded: "{rounded.sm}"
  link-sm:
    typography: "{typography.body-md}"
    textColor: "rgba(255, 255, 255, 0.85)"
    padding: "4px 16px 4px 16px"
    boxShadow: "rgba(255, 255, 255, 0.08) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.14) 0px 1px 2px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px"
    rounded: "{rounded.sm}"
states:
  button-disabled:
    target: button
    state: disabled
    opacity: 0.5
  input-disabled:
    target: input
    state: disabled
    opacity: 0.5
  input-focus:
    target: input
    state: focus
    outline: "-webkit-focus-ring-color auto 0.1rem"
    outlineColor: -webkit-focus-ring-color
    outlineWidth: 0.1rem
  button-active:
    target: button
    state: active
    opacity: 0.8
  input-hover:
    target: input
    state: hover
    borderColor: transparent
  button-focus:
    target: button
    state: focus
    outline: "-webkit-focus-ring-color auto 0.1rem"
    outlineColor: -webkit-focus-ring-color
    outlineWidth: 0.1rem
  other-active:
    target: other
    state: active
    opacity: 0.8
  other-disabled:
    target: other
    state: disabled
    opacity: 0.8
  other-hover:
    target: other
    state: hover
    backgroundColor: transparent
  other-focus-visible:
    target: other
    state: focus-visible
    boxShadow: "rgba(0, 159, 217, 0.5) 0px 0px 0px 0.2rem"
  nav-focus:
    target: nav
    state: focus
    outline: none
breakpoints:
  - width: 375
    containerWidth: 360
    gridColumns: 8
    navLinksVisible: 21
    menuToggleVisible: false
    headingPx: 28
    bodyPx: 14
    sectionPaddingX: 24
  - width: 768
    containerWidth: 744
    gridColumns: 8
    navLinksVisible: 21
    menuToggleVisible: false
    headingPx: 31
    bodyPx: 14
    sectionPaddingX: 24
  - width: 1024
    containerWidth: 1024
    gridColumns: 8
    navLinksVisible: 32
    menuToggleVisible: false
    headingPx: 42
    bodyPx: 14
    sectionPaddingX: 24
  - width: 1280
    containerWidth: 120
    gridColumns: 8
    navLinksVisible: 32
    menuToggleVisible: false
    headingPx: 42
    bodyPx: 14
    sectionPaddingX: 24
  - width: 1440
    containerWidth: 1440
    gridColumns: 8
    navLinksVisible: 32
    menuToggleVisible: false
    headingPx: 42
    bodyPx: 14
    sectionPaddingX: 24
coverage:
  statesFound: 61
  gradientsFound: 2
  rolesUnassigned: 0
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: false
  semanticRampDeclared: false
---

# Design System Inspired by Chess.com

## 1. Visual Theme & Atmosphere

Chess.com's design embodies strategic sophistication paired with accessible approachability. The system leverages a dark, intimate canvas with crisp white typography and a vibrant lime-green accent to create confident visual hierarchy. The interplay between deep neutral backgrounds (`{colors.canvas}` — `#302E2B`) and high-contrast primary elements (`{colors.primary}` — `#FFFFFF`) establishes clarity without harshness. Generous whitespace, deliberate use of depth through subtle shadows, and a bold sans-serif typeface family (Chess Sans for display; system stack for body) convey authority while remaining welcoming. The design favors clarity and usability over ornamentation—each element serves a purpose, from the navigation sidebar to the prominent call-to-action buttons that anchor user journeys.

**Key Characteristics**

- Dark, neutral canvas background with high-contrast white typography
- Lime-green accent color for primary CTAs and interactive highlights
- Measured use of depth via single-tier shadow elevation
- Bold, geometric typography hierarchy with generous sizing
- Sharp corner radii on buttons; no rounding on cards or images
- Spacious layouts with consistent breathing room
- Accessible, intent-driven component styling

## 2. Color Palette & Roles

### Primary
- **Primary** (`{colors.primary}` — `#FFFFFF`): Primary CTA fills, brand accent, active states, headings, and primary text. Used on buttons, key typography, and interactive highlights to command attention.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#302E2B`): Default page background and dominant surface. Sets the dark, intimate tone across the entire interface.
- **Hairline** (`{colors.hairline}` — `#4B4847`): Thin 1px borders and dividers. Provides subtle visual separation without introducing new colors.

## 3. Typography Rules

### Font Family

**Chess Sans** (primary display and heading font)
- Primary fallback stack: `Chess Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**System Stack** (secondary body and interface font)
- Primary fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display | Chess Sans | 42px | 800 | 1.14 | 0px | Hero headings; maximum visual impact |
| Heading MD | Chess Sans | 36px | 800 | 1.11 | 0px | Major section headers |
| Heading SM | Chess Sans | 22px | 800 | 1.27 | 0px | Secondary section headers |
| Body XL | Chess Sans | 22px | 800 | 1.14 | 0px | Large callout text, strong emphasis |
| Body LG Strong | System | 18px | 600 | 1.56 | 0px | Medium-weight body with emphasis |
| Body LG | System | 18px | 400 | 1.56 | 0px | Primary body text, comfortable reading |
| Body MD | System | 17px | 600 | 1.14 | 0px | Standard body text, semi-bold variant |
| Button | System | 14px | 600 | 1.14 | 0px | All button labels and controls |
| Heading XS | Chess Sans | 14px | 800 | 1.14 | 0px | Small bold labels, UI headings |
| Body SM | System | 14px | 400 | 1.43 | 0px | List items, secondary text |
| Body XS | System | 12px | 600 | 1.43 | 0px | Smallest body variant, semi-bold |
| Caption | Chess Sans | 10px | 600 | 1 | 0px | Micro labels, annotations |

### Principles

- **Typographic Hierarchy via Size & Weight**: The system relies heavily on Chess Sans for authoritative display roles (display, headings) at high weights (800), while system fonts handle readable body sizes at lighter weights (400–600).
- **Generous Line Height**: Line heights range from 1.14 (compact display) to 1.56 (readable body), ensuring legibility even on dark backgrounds.
- **Bold Display Language**: All heading roles use 800-weight Chess Sans, creating a confident, strategic visual voice.
- **System Font for Accessibility**: Body and button text use the native system stack, optimizing rendering and legibility at small sizes.

## 4. Component Stylings

### Buttons

**Primary (CTA)**
- Font: `{typography.button}` (14px, 600 weight, system stack)
- Background: Lime green or brand accent; specific hex varies by state
- Text Color: `#FFFFFF` or contextual override
- Padding: `{spacing.xs}` (8px) on all sides
- Border Radius: `{rounded.xs}` (5px)
- Height: 40px
- Width: 154px (typical)
- Box Shadow: None (flat style on default)
- Border: None
- **Hover State**: Box shadow applied (`var(--cc-bg-box-shadow-hover)`); text color may shift to `var(--textColorHover)`
- **Active State**: Opacity reduced to 0.8
- **Disabled State**: Opacity 0.5 or 0.6; background may lighten to `color-mix(in srgb, var(--cc-bg-color) 75%, transparent)`
- **Focus State**: `-webkit-focus-ring-color auto 0.1rem` outline

**Secondary**
- Font: `{typography.button}`
- Background: Transparent or subtle overlay
- Text Color: `{colors.primary}` (`#FFFFFF`)
- Padding: `{spacing.xs}`
- Border Radius: `{rounded.xs}`
- Height: 40px
- **Hover State**: Background shifts to `var(--color-bg-subtler)` or `var(--color-bg-tertiary)`

**Ghost / Tertiary**
- Font: `{typography.button}`
- Background: Transparent
- Text Color: `{colors.primary}` or context-dependent
- Padding: `{spacing.xs}`
- Border Radius: `{rounded.xs}`
- **Hover State**: Color and background adjust; may apply shadow

### Cards & Containers

**Default Card**
- Background: Transparent or inherit from canvas
- Border: None (0px)
- Border Radius: `{rounded.none}` (0px) — sharp corners
- Padding: 0px
- Box Shadow: None (flat)
- Text Color: Inherit or `{colors.primary}`

**Small Card Variant**
- Font: `{typography.body-xl}` (22px, 800 weight, Chess Sans)
- Width: 314px
- Height: 112px
- Background: Transparent
- Border Radius: `{rounded.none}`
- Box Shadow: None

### Inputs & Forms

**Text Input (Default)**
- Font: `{typography.body-sm}` or `{typography.body-md}`
- Border: 1px solid `{colors.hairline}`
- Border Radius: `{rounded.xs}` or `{rounded.none}` (varies by context)
- Padding: `{spacing.xs}` to `{spacing.md}`
- Background: `{colors.canvas}` or slightly lighter
- Text Color: `{colors.primary}` or inherit
- **Hover State**: Border color becomes `var(--borderFocus)`; background may lighten to `var(--color-icon-default-hovered)`
- **Focus State**: Outline applied via `-webkit-focus-ring-color auto 0.1rem`
- **Disabled State**: Opacity 0.5, 0.6, or `var(--effects-opacity-disabled)`

### Navigation

**Sidebar Navigation**
- Font: `{typography.body-sm}` (14px, 400 weight)
- Width: 170px (typical)
- Height: 900px
- Padding: 8px 8px 12px 8px (tight)
- Background: `rgba(0, 0, 0, 0.2)` (semi-transparent darkening)
- Border: None
- **Link Item**: Text color `{colors.primary}`; **hover state** applies `var(--color-bg-tertiary)` background or color shift
- **Active Link**: Background or text color emphasis via `var(--color-bg-selected)`
- Border Radius: `{rounded.none}`

### Links

**Standard Link**
- Font: `{typography.body-md}` or context-dependent
- Text Color: `{colors.primary}` (`#FFFFFF`)
- Padding: 0px 16px
- Height: 64px (typical for prominent links)
- Border Radius: `{rounded.sm}` (10px)
- Box Shadow: Complex multi-layer inset and drop shadow (see extracted data for exact values)
- Background: Transparent or contextual
- **Hover State**: Color shifts to `var(--color-text-link-hovered)` or `var(--color-text-default-hovered)`; may apply border or background

**Small Link Variant**
- Font: `{typography.body-md}` (17px, 600 weight)
- Padding: 4px 16px
- Height: 48px
- Border Radius: `{rounded.sm}` (10px)
- **Hover State**: Color and background adjust per context

### Badges

**Icon Badge**
- Font: `{typography.body-sm}` (14px, 400 weight)
- Width: 24px
- Height: 24px
- Padding: 0px
- Text Color: `rgba(255, 255, 255, 0.5)` (muted white)
- Background: Transparent
- Border Radius: `{rounded.none}`
- Box Shadow: None

## 5. Layout Principles

### Spacing System

Base unit: `{spacing.xs}` (8px). The scale provides flexible, predictable intervals for all spacing decisions.

- **Micro (`{spacing.xxs}`)**: 4px — tight spacing within compact groups
- **Extra Small (`{spacing.xs}`)**: 8px — button padding, adjacent inline elements
- **Small (`{spacing.sm}`)**: 12px — component internal gaps
- **Medium (`{spacing.md}`)**: 16px — standard section padding, link padding
- **Large (`{spacing.lg}`)**: 20px — comfortable spacing between sections
- **Extra Large (`{spacing.xl}`)**: 24px — section spacing, significant visual breaks
- **2XL (`{spacing.xxl}`)**: 40px — major layout divisions
- **3XL (`{spacing.xxxl}`)**: 80px — hero spacing
- **Section (`{spacing.section}`)**: 92px — vertical rhythm between content bands
- **Band (`{spacing.band}`)**: 172px — full-width section separation

### Grid & Container

- **Max Content Width**: 1440px at largest breakpoints; columns adapt proportionally
- **Column Count**: 8 columns maintained across all measured viewports (375px–1440px)
- **Section Horizontal Padding**: 24px on all breakpoints; content never bleeds to edge
- **Sidebar**: 170px fixed width; leaves remaining width for main content

### Whitespace Philosophy

Chess.com prioritizes **generous breathing room**. Large spacing between sections (`{spacing.section}` — 92px) creates visual rest and emphasizes content importance. Micro-spacing within components (`{spacing.xs}` — 8px) keeps interactive elements tight and scannable. The interplay between tight internal padding and expansive section gaps creates rhythm and guides the eye through the interface.

### Border Radius Scale

- **None** (`{rounded.none}` — 0px): Cards, images, large containers, badges — crisp, geometric aesthetic
- **Extra Small** (`{rounded.xs}` — 5px): Buttons, inputs — subtle rounding for modern polish
- **Small** (`{rounded.sm}` — 10px): Links with complex shadows; elevated UI elements — approachable roundness

### Border Widths

- **Thin** (`1px`): Dividers, hairline borders (`{colors.hairline}` — `#4B4847`). Provides subtle visual separation without visual weight.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no depth change | Default cards, buttons, backgrounds |
| Elevated | `rgba(0, 0, 0, 0.3) 0px 3px 8px 0px` | Dropdowns, popovers, floating elements |

The Chess.com elevation strategy is **single-tier**: either flat (no shadow) or slightly raised via a subtle shadow. This creates a clean, uncluttered appearance while maintaining clear visual hierarchy between base and lifted elements.

Depth is reinforced through **color-blocking** — surfaces are differentiated by background color changes rather than shadow intensity. The dark canvas (`{colors.canvas}` — `#302E2B`) forms the base; components are distinguished through opacity overlays (e.g., navigation at `rgba(0, 0, 0, 0.2)`) or through typography weight and size.

### Opacity Levels

Extracted interaction states reveal opacity patterns but do not constitute a formal opacity scale. Disabled states typically apply 0.5–0.6 opacity. Hover effects may scale transparency for depth shifts.

### Z-index / Layering

- **Base**: z-index 1 or 3 (default stacking)
- **Modal**: z-index 9000 (maximum z-level for overlays)

## 7. Do's and Don'ts

### Do

- **Use Chess Sans for all display, heading, and large callout text** — it establishes the brand voice and ensures visual hierarchy.
- **Maintain sharp corners** (`{rounded.none}`) on cards, images, and badges to preserve the geometric, strategic aesthetic.
- **Apply `{spacing.section}` (92px) between major content bands** to create rhythm and visual rest.
- **Use white text** (`{colors.primary}` — `#FFFFFF`) on the dark canvas for maximum contrast and legibility.
- **Reserve the hairline color** (`{colors.hairline}` — `#4B4847`) for subtle dividers; do not use it for primary elements.
- **Keep button padding tight** (`{spacing.xs}` — 8px on all sides) and radius crisp (`{rounded.xs}` — 5px).
- **Layer shadows sparingly** — use the single elevated shadow only for dropdowns and floating components.
- **Test touch targets on mobile** — ensure interactive elements meet minimum size requirements (see Responsive Behavior).

### Don't

- **Do not introduce rounded corners on cards or images** — the system uses `{rounded.none}` to maintain a clean, geometric look.
- **Do not mix Chess Sans and system fonts in a single heading** — commit to one per role.
- **Do not apply multiple shadow layers** — the system supports one shadow level above flat.
- **Do not use opacity overlays lighter than the navigation sidebar** (`rgba(0, 0, 0, 0.2)`) for primary elements.
- **Do not crowd spacing** — always reserve at least `{spacing.lg}` (20px) between major sections.
- **Do not invent new colors** — the palette is intentionally constrained to primary, canvas, and hairline for visual cohesion.
- **Do not apply focus outlines in non-standard ways** — use `-webkit-focus-ring-color auto 0.1rem` or omit them.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Width | Grid Columns | Nav Visible | Key Changes |
|---|---|---|---|---|
| 375px (Mobile) | 360px | 8 | Yes, all | Display heading: 28px; body: 14px; compact section padding |
| 768px (Tablet) | 744px | 8 | Yes, all | Display heading: 31px; body: 14px; same nav visibility |
| 1024px (Laptop) | 1024px | 8 | Yes, 32 nav items | Display heading: 42px; body: 14px; full display |
| 1280px | 120px | 8 | Yes, 32 nav items | Full layout at max column width |
| 1440px (Desktop) | 1440px | 8 | Yes, 32 nav items | Maximum content width; display: 42px; full nav |

**Key Observations:**
- Navigation remains visible across all measured breakpoints; no hamburger menu toggle is present in the measured data.
- Display heading (`{typography.display}`) scales from 28px (mobile) to 42px (1024px+), creating a smooth visual progression.
- Body text remains 14px across all breakpoints for consistency.
- Section horizontal padding (`{spacing.md}` — 16px to 24px) maintains readability and breathing room.
- Grid maintains 8 columns throughout; layouts adapt via flexible widths rather than column reflow.

### Touch Targets

- **Minimum interactive element size**: 40px (buttons measured at 40px height; consistent across all breakpoints).
- **Navigation link targets**: Minimum 24px height to ensure comfortable mobile touch.
- **Input fields**: 40px–48px height for comfortable interaction on touch devices.
- **Icon buttons**: 24px–32px as measured; consider expanding to 40px minimum if used as primary touch targets.

### Collapsing Strategy

- **Mobile-first expansion**: Layouts grow from 360px content width to 1440px, using flex/grid flexibility rather than column count changes.
- **Typography scaling**: Display size increases from 28px → 31px → 42px at progression points.
- **Sidebar persistence**: Navigation sidebar remains fixed at 170px width; main content adjusts around it.
- **Section padding**: Remains consistent at 24px horizontal; vertical spacing scales via `{spacing.section}` and `{spacing.band}`.
- **Button widths**: Adapt fluidly; baseline 154px at desktop, but flex-grow/shrink on constrained viewports.

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA & Text**: `{colors.primary}` (`#FFFFFF`) — white for headings, button fills, primary links
- **Background (Canvas)**: `{colors.canvas}` (`#302E2B`) — dark neutral base for all page backgrounds
- **Dividers & Borders**: `{colors.hairline}` (`#4B4847`) — subtle 1px separators
- **Brand Accent**: Lime green (measured as `rgb(129, 182, 76)` in gradient; use for call-to-action emphasis and interactive highlights)

### Iteration Guide

1. **All display, heading, and callout text uses Chess Sans at 800 weight.** Body and buttons use the system font stack (-apple-system) at 400–600 weight.

2. **Cards, images, and badges have zero border-radius** (`{rounded.none}`); buttons and inputs use 5px (`{rounded.xs}`); elevated elements use 10px (`{rounded.sm}`).

3. **Spacing follows the scale** (`{spacing.xs}` = 8px base; `{spacing.section}` = 92px between major bands). Never deviate; the scale ensures consistency.

4. **Buttons are 40px tall, 154px wide (typical), 8px padding all sides, 5px radius, no shadow on default state.** Hover applies shadow; active/disabled adjust opacity.

5. **Navigation sidebar is 170px fixed width, semi-transparent dark background** (`rgba(0, 0, 0, 0.2)`); remains visible on all breakpoints measured.

6. **Shadows are single-tier**: flat (none) or elevated (`rgba(0, 0, 0, 0.3) 0px 3px 8px 0px`). No multi-layer shadow stacks.

7. **Color palette is intentionally minimal**: white, dark canvas, hairline gray, plus lime green for accent. Do not add new colors.

8. **Touch targets minimum 40px height.** Ensure all interactive elements meet this threshold across mobile (375px+) and desktop (1440px+).

9. **Display heading scales responsively**: 28px (375px viewport) → 31px (768px) → 42px (1024px+). Use viewport-based calc or breakpoint steps.

10. **Section horizontal padding is 24px on all breakpoints.** Content never bleeds; sidebar coexists alongside main content without collision.

## 10. Known Gaps

- **Interaction states**: The site's stylesheet declares hover, active, focus, and disabled states via CSS custom properties (`var(--linkHoverBackground)`, etc.), but their resolved hex values were not extracted. Implementers should test or request the compiled CSS to confirm exact color shifts on interaction.

- **Dark mode / theme variations**: Only one theme was extracted (the live site's default). No light mode or alternative theme data was captured. If the site ships a dark mode toggle, its styles lie outside this extraction.

- **Semantic color ramp**: No error, success, warning, or info colors are present in the measured markup. The site does not expose a status color system; all feedback states likely rely on messaging or modal overlays not visible on the measured pages.

- **Authentication-gated surfaces**: Only the public home page was analyzed. Logged-in experiences, user profiles, game boards, and membership areas were not visited or measured.

- **Animation & motion**: Transition timing, keyframes, and animation curves are not included. Hover states reference `var(--cc-bg-box-shadow-hover)`, but the exact timing or easing was not captured.

- **Gradient usage**: Two gradients were measured (one on `.link` default, one section overlay), but no comprehensive gradient library or naming was extracted. Only gradients present in the measured markup are included.

- **Font loading**: The Chess Sans font is not web-safe; its availability, loading strategy (local, external URL), and fallback performance are outside scope.

- **Accessibility attributes**: ARIA, semantic HTML roles, and focus management strategies were not evaluated. Implementers should audit keyboard navigation and screen reader compatibility separately.

- **Responsive image strategies**: No `srcset`, `sizes`, or art-direction data was captured. Image behavior on different viewports is inferred from layout changes, not explicit responsive image markup.

- **Extended component library**: Only buttons, cards, inputs, navigation, links, and badges are documented here. Other components (modals, tabs, accordions, tooltips) may exist but were not present on the measured pages

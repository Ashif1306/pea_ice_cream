# 🎨 Pea Ice Cream — Design Guide

> Design system reference for the Pea Ice Cream website. Mobile-first. Chic, colorful, and approachable.

---

## 1. Color Palette

> [!NOTE]
> The UI palette is limited to **5 core colors**. Product photography colors are intentionally excluded from this count — photos are the visual centerpiece and should be allowed to breathe.

| Role | Name | Hex | Usage |
|---|---|---|---|
| **Primary** | Primary Pink | `#FF6B9D` | CTA buttons, active states, key highlights |
| **Secondary** | Light Pink / Rose | `#FFB3D1` | Hover states, backgrounds, tags, badges |
| **Base** | White | `#FFFFFF` | Page background, card backgrounds |
| **Text** | Dark Blue | `#1E3A5F` | Body text, headings, labels |
| **Accent A** | Accent Yellow | `#FFD700` | Promotional badges, star ratings, highlights |
| **Accent B** | Accent Green | `#4CAF50` | Stock available indicators, success states |

### Additional States (derived, not counted in palette)

| State | Color | Usage |
|---|---|---|
| Error / Out of Stock | `#EF4444` (red-500) | Error messages, out-of-stock labels |
| Muted / Disabled | `#9CA3AF` (gray-400) | Disabled buttons, placeholder text |
| Overlay | `rgba(30, 58, 95, 0.5)` | Modal/bottom sheet scrim |

### Tailwind CSS Mapping

```js
// tailwind.config.ts
colors: {
  brand: {
    pink:       '#FF6B9D',
    'pink-light': '#FFB3D1',
    blue:       '#1E3A5F',
    yellow:     '#FFD700',
    green:      '#4CAF50',
  }
}
```

---

## 2. Typography

### Font Families

| Font | Source | Role |
|---|---|---|
| **Fredoka** | Google Fonts | Display headings (H1, H2, H3) |
| **Nunito** | Google Fonts | Body text, labels, buttons, captions |

### Type Scale

| Token | Font | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `h1` | Fredoka | `2.25rem` (36px) | 600 | 1.2 | Page hero title |
| `h2` | Fredoka | `1.875rem` (30px) | 600 | 1.25 | Section headings |
| `h3` | Fredoka | `1.5rem` (24px) | 600 | 1.3 | Card titles, sub-sections |
| `body-lg` | Nunito | `1.125rem` (18px) | 400 | 1.6 | Intro paragraphs |
| `body` | Nunito | `1rem` (16px) | 400 | 1.6 | General body text |
| `body-sm` | Nunito | `0.875rem` (14px) | 400 | 1.5 | Captions, helper text |
| `label` | Nunito | `0.875rem` (14px) | 600 | 1.4 | Form labels, tags |
| `button` | Nunito | `1rem` (16px) | 700 | 1 | Button text |
| `price` | Nunito | `1.25rem` (20px) | 700 | 1.2 | Product prices |

### Next.js Font Setup (App Router)

```ts
// app/layout.tsx
import { Fredoka, Nunito } from 'next/font/google'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-fredoka',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})
```

---

## 3. Component Style

### Cards

```
rounded-2xl        → border-radius: 1rem
shadow-md          → subtle elevation
bg-white           → white background
overflow-hidden    → clip product photos cleanly
```

**Product cards** are the **primary visual focus**. Photos fill the top portion of the card with `object-cover`. Titles and prices sit below on a white background.

### Buttons

| Variant | Style | Usage |
|---|---|---|
| **Primary** | `bg-brand-pink text-white rounded-full font-bold` | Main CTA (Add to Cart, Checkout) |
| **Secondary** | `border-2 border-brand-pink text-brand-pink rounded-full` | Secondary actions |
| **Ghost** | `text-brand-blue underline` | Tertiary / text links |
| **Danger** | `bg-red-500 text-white rounded-full` | Destructive actions (Remove, Cancel) |
| **Disabled** | `bg-gray-300 text-gray-400 cursor-not-allowed rounded-full` | Unavailable states |

### Form Inputs

```
rounded-xl
border border-gray-200
focus:ring-2 focus:ring-brand-pink
bg-white
px-4 py-3
font-nunito
```

All form fields **must** have an associated `<label>` element. Never use placeholder text as a substitute for a label.

### Bottom Sheet (Mobile)

Used on the **Product Detail** page for size, flavor, and quantity selection on mobile viewports.

- Slides up from the bottom of the screen
- Covers ~70–80% of screen height
- Rounded top corners: `rounded-t-3xl`
- Backdrop scrim: `bg-brand-blue/50`
- Drag handle indicator at the top center
- Dismissible by tapping the scrim or swiping down
- Transitions: `transition-transform duration-300 ease-out`
- Respects `prefers-reduced-motion` — skips animation if set

### Badges & Tags

```
rounded-full px-3 py-1 text-sm font-semibold
```

| Badge | Color |
|---|---|
| Available / In Stock | `bg-brand-green/10 text-brand-green` |
| Out of Stock | `bg-red-100 text-red-500` |
| New | `bg-brand-yellow/20 text-brand-blue` |
| Promo | `bg-brand-pink text-white` |

---

## 4. Spacing & Layout

### Spacing Scale

Follow Tailwind's default spacing scale. Key guidelines:

| Context | Recommended Spacing |
|---|---|
| Section vertical padding | `py-12` to `py-20` |
| Card internal padding | `p-4` to `p-6` |
| Button padding | `px-6 py-3` |
| Input padding | `px-4 py-3` |
| Gap between cards | `gap-4` to `gap-6` |

> [!TIP]
> Use **generous vertical spacing** between sections on the home page. Breathing room reinforces the chic, premium feel of the brand.

### Page Max Width

```
max-w-screen-xl mx-auto px-4
```

Admin dashboard uses a sidebar layout on desktop (`lg:` breakpoint and above).

---

## 5. Responsive Breakpoints

| Name | Breakpoint | Key Behavior |
|---|---|---|
| **Mobile S** | `360px` | Minimum supported width. No horizontal scroll. |
| **Mobile M** | `390px` | iPhone-class. Primary design target. |
| **Tablet** | `768px` (md) | Two-column layouts begin. Bottom sheet becomes a side panel. |
| **Desktop** | `1440px` (xl) | Full layout with sidebar navigation for admin. |

### Catalog Grid

| Viewport | Columns |
|---|---|
| `< 640px` | 1 column |
| `≥ 640px` (sm) | 2 columns |
| `≥ 1024px` (lg) | 3 columns |
| `≥ 1280px` (xl) | 4 columns |

```html
<!-- Example Tailwind grid class -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

---

## 6. Mobile-Specific Patterns

### Sticky Cart Button

- Fixed to the bottom of the screen on mobile
- **Must not overlap any interactive content** when the cart is not empty
- Add `pb-24` to the page content area to compensate for the sticky button height
- Hidden when cart is empty

### Navigation

- Mobile: bottom tab bar or hamburger drawer
- Desktop: top navigation bar

### Touch Targets

All interactive elements must have a minimum touch target of **44×44px** per WCAG 2.1 guidelines.

---

## 7. Decorative Elements

- **Ice cream scoop SVGs** may be used as subtle section accents (e.g., corner decorations, dividers).
- Decorations must **never obstruct the ordering flow** — no overlapping forms, CTAs, or product images.
- Keep decorations small and low-contrast against the background.
- Animations: gentle float or wiggle only. Always respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  .decoration-animate {
    animation: none;
  }
}
```

---

## 8. Product Photography

- Product photos are the **star of every page**.
- Display at large sizes in catalog cards and hero areas of product detail pages.
- Use `object-cover` to fill card areas without distortion.
- Provide a consistent placeholder image (soft pink gradient or brand logo watermark) for products without a photo.
- Photos are **not constrained to the UI color palette** — their natural colors add vibrancy.

---

## 9. Accessibility

> [!IMPORTANT]
> All UI components must meet these accessibility requirements before Phase 1 is considered complete.

| Requirement | Implementation |
|---|---|
| **Form labels** | Every `<input>`, `<select>`, `<textarea>` has a visible `<label>` with matching `htmlFor` / `id` |
| **Error messages** | Errors are shown inline, below the relevant field, in red with an icon. Never color-only. |
| **Keyboard focus** | All interactive elements have a visible `:focus-visible` ring (`ring-2 ring-brand-pink ring-offset-2`) |
| **Motion** | All animations wrapped in `@media (prefers-reduced-motion: no-preference)` |
| **Color contrast** | All text/background combinations meet WCAG AA (4.5:1 for body, 3:1 for large text) |
| **Alt text** | All `<img>` tags include descriptive `alt` attributes |
| **ARIA** | Bottom sheet uses `role="dialog"` and `aria-modal="true"`. Icons have `aria-hidden="true"` or `aria-label`. |

---

## 10. Admin Dashboard UI

- **Layout**: Sidebar (left) + main content area on desktop. Drawer on mobile.
- **Sidebar color**: Dark Blue (`#1E3A5F`) with white text
- **Active nav item**: Pink left border accent (`border-l-4 border-brand-pink`)
- **Tables**: Striped rows, sortable headers, pagination controls
- **Empty states**: Illustrated empty state with guidance text and a primary action button (e.g., "Tambah Produk Pertama")
- **Demo banner**: Persistent yellow banner at the top of every admin page stating that changes are not saved to the database in demo mode

---

*Document version: Phase 1 · Last updated: November 2026*

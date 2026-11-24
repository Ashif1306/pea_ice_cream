# ✅ Pea Ice Cream — Acceptance Criteria (Phase 1)

> Checklist for the Foundation & Interactive Prototype phase. All items below must pass before Phase 1 is considered complete.

---

## 1. Project Setup & Build

- [ ] Next.js app runs locally without errors using `npm run dev`
- [ ] TypeScript type check passes: `npx tsc --noEmit` exits with zero errors
- [ ] ESLint passes: `npm run lint` exits with zero errors or warnings
- [ ] Production build succeeds: `npm run build` completes without errors
- [ ] No console errors or warnings on initial page load in development mode

---

## 2. Branding & Header

- [ ] Logo is loaded from `logo.jpg` and displayed as an `<img>` element in the site header
- [ ] Logo is **not** replaced by text, an SVG placeholder, or a colored box
- [ ] Logo renders correctly on both mobile and desktop viewports
- [ ] Site title / `<title>` tag reflects the "Pea Ice Cream" brand name

---

## 3. Home Page

- [ ] **Hero section** is present with the brand name, tagline(s), and a primary CTA button
- [ ] **Menu preview section** displays a selection of featured products
- [ ] **Brand story section** is present with a short description of the business
- [ ] **Ordering app links section** displays GrabFood and ShopeeFood logos/links — visual display only; no functional integration
- [ ] **Location section** shows the store address (mock data acceptable)
- [ ] **Contact section** shows a business WhatsApp number — **must be a placeholder, not a real number**

> [!CAUTION]
> Do **not** use real WhatsApp numbers, real bank accounts, real customer reviews, or real GrabFood/ShopeeFood outlet links anywhere in the prototype.

---

## 4. Catalog Page

- [ ] All products are listed using mock data
- [ ] **Search bar** filters products by name in real time
- [ ] **Flavor filter** narrows the product list to the selected flavor
- [ ] **Size filter** narrows the product list to the selected size
- [ ] **Price range filter** narrows the product list by price
- [ ] **Stock status filter** can toggle between "Available" and "All" (including out-of-stock)
- [ ] Out-of-stock products are clearly labelled and their "Add to Cart" action is disabled
- [ ] Grid layout: 1 column below 640px, 2 columns at 640px and above (see DESIGN_GUIDE.md)
- [ ] Empty search/filter state shows a helpful message and a "Reset Filters" action

---

## 5. Product Detail Page

- [ ] Product name, description, and photo are displayed
- [ ] **Size selection** is required before adding to cart; the UI enforces this with a visible error if skipped
- [ ] **Mix-flavor selection** is shown **only** when the product is configured to allow it; it is hidden otherwise
- [ ] **Quantity picker** increments and decrements correctly, with a minimum of 1
- [ ] **Customer notes** field is present (optional input)
- [ ] On mobile (`< 768px`): size, flavor, and quantity selection appear in a **bottom sheet** UI
- [ ] On desktop (`≥ 768px`): selection controls appear inline on the page
- [ ] "Add to Cart" button adds the item to the cart with the selected configuration
- [ ] Bottom sheet is dismissible by tapping the backdrop scrim or swiping down

---

## 6. Cart

- [ ] All items added during the session are listed with their name, size, flavor(s), quantity, and line price
- [ ] **Quantity can be increased or decreased** per item directly within the cart
- [ ] Items can be **removed** individually from the cart
- [ ] **Subtotal** (sum of all line prices) is displayed
- [ ] A note is clearly displayed stating the subtotal **excludes delivery fee** — delivery fee is confirmed by admin after order placement
- [ ] An empty cart state is shown when no items are present, with a CTA to browse the catalog
- [ ] Proceeding to checkout is blocked when the cart is empty

---

## 7. Checkout Page

- [ ] **Customer name** field — required
- [ ] **WhatsApp number** field — required, with basic format validation
- [ ] **Delivery method** selector — "Delivery" or "Pickup" (radio or segmented control)
- [ ] **Delivery address** field — shown and required **only** when "Delivery" is selected; hidden for "Pickup"
- [ ] **Landmark / direction notes** field — shown when "Delivery" is selected
- [ ] **Payment method** selector — "Bank Transfer" or "QRIS"
- [ ] **Order notes** field — optional
- [ ] **Order summary panel** displays all cart items, subtotal, and selected delivery method
- [ ] All required fields show inline validation errors when the form is submitted incomplete
- [ ] Submitting the form navigates to the Order Summary page

---

## 8. Order Summary Page

- [ ] A unique **order reference number** is generated and displayed (e.g., `PEA-20261120-0001`)
- [ ] Order status is shown as **"Menunggu Konfirmasi"** (Awaiting Confirmation)
- [ ] Payment instructions are displayed (mock bank account details or mock QRIS image)
- [ ] A notice is clearly shown: **no real order has been placed and no WhatsApp message has been sent**
- [ ] Customer's order details (items, delivery method, address if applicable) are summarised on this page

---

## 9. Admin Dashboard

### 9.1 Products & Catalog
- [ ] **Products** — List, add (form), edit, archive a product
- [ ] **Categories** — List, add, edit, delete categories
- [ ] **Flavors** — List, add, edit, delete flavors
- [ ] **Sizes** — List, add, edit, delete sizes
- [ ] **Pricing** — Set and edit price per flavor + size combination in a matrix or table view
- [ ] **Allergens** — Add, edit, assign allergens to products
- [ ] **Photos** — Upload (mock), reorder, and remove product photos
- [ ] **Mix-Flavor Options** — Toggle mix-flavor availability per product; configure allowed combinations
- [ ] **Stock** — View and edit stock quantity per flavor + size combination

### 9.2 Orders
- [ ] **Orders list** — Tabular view of all mock orders with status badges
- [ ] **Order detail** — Full breakdown: items, customer name, WhatsApp, address, delivery method, payment method
- [ ] **Order status** — Admin can update status: Pending → Confirmed → In Preparation → Delivered / Cancelled
- [ ] **Payment status** — Admin can mark payment as Confirmed or Rejected
- [ ] **Delivery fee** — Admin can enter and confirm the delivery fee for a specific order

### 9.3 Business Settings
- [ ] **Business profile** — Edit business name, taglines, description
- [ ] **Logo** — Upload/replace logo (mock upload)
- [ ] **Address** — Edit store address
- [ ] **Operating hours** — Set open/close time per day of the week; mark days as closed
- [ ] **WhatsApp number** — Edit the business WhatsApp contact — **must display a placeholder, not a real number**
- [ ] **Delivery zones & rules** — Add, edit, delete delivery zone entries with associated rules
- [ ] **Bank accounts** — Add, edit, delete mock bank account entries — **must use fake/placeholder account details**
- [ ] **QRIS upload** — Upload a mock QRIS image — **must not use a real QRIS**
- [ ] **GrabFood / ShopeeFood links** — Add display URLs — **must use placeholder URLs**

### 9.4 Admin Account
- [ ] **Admin profile** — View and edit admin display name and (mock) password change form

---

## 10. Demo & Placeholder Requirements

- [ ] A **demo notice banner** is displayed persistently on all admin dashboard pages stating that changes are not saved to a database
- [ ] All **bank account details** throughout the site are clearly placeholder/fake values
- [ ] All **WhatsApp numbers** are placeholder values (e.g., `+62 812-XXXX-XXXX`)
- [ ] All **customer reviews or testimonials** (if shown) are labelled as example/demo content
- [ ] All **GrabFood/ShopeeFood links** are non-functional placeholders
- [ ] All **QRIS images** shown are placeholder graphics, not real scannable codes
- [ ] The tagline **"sehat tanpa pengawet"** is tagged with a visible note wherever it appears: *⚠️ Perlu konfirmasi pemilik* (requires owner verification)

---

## 11. Content & Integrity Rules

- [ ] No real customer orders exist in the system
- [ ] No real WhatsApp messages are sent at any point during the prototype flow
- [ ] No unbuilt or future integrations (Supabase, payment gateway, WhatsApp API) are presented as functional features
- [ ] All mentions of such integrations are clearly labelled as "coming soon" or "Phase 2"

---

## 12. Empty States

- [ ] Every admin section that could have no data must display a styled **empty state** component
- [ ] Empty states include: an illustrative icon or image, a descriptive message, and a primary action button (e.g., "Tambah Produk Pertama")
- [ ] Empty states do **not** show raw table skeletons with no rows and no guidance

---

## 13. Responsive Layout & Overflow

- [ ] No horizontal scrollbar appears at any of these viewport widths: **360px, 390px, 768px, 1440px**
- [ ] All pages are tested at the four breakpoints above before sign-off
- [ ] The **mobile sticky cart button** does not overlap page content — sufficient bottom padding is applied to the page body when the button is visible
- [ ] The catalog grid switches correctly between 1-column (mobile) and 2-column (≥640px) layouts

---

## 14. Accessibility

- [ ] All form fields have an associated visible `<label>` element
- [ ] All form validation errors are displayed inline, below the relevant field, and are not color-only
- [ ] All interactive elements have a visible `:focus-visible` keyboard focus indicator
- [ ] All animations are gated behind `prefers-reduced-motion: no-preference`; reduced-motion users see no animations
- [ ] All `<img>` elements include descriptive `alt` attributes
- [ ] The bottom sheet component has `role="dialog"` and `aria-modal="true"`

---

## Sign-Off Summary

| Area | Owner | Status |
|---|---|---|
| Project setup & build | Dev | ⬜ Pending |
| Branding & header | Dev | ⬜ Pending |
| Home page | Dev | ⬜ Pending |
| Catalog page | Dev | ⬜ Pending |
| Product detail + bottom sheet | Dev | ⬜ Pending |
| Cart | Dev | ⬜ Pending |
| Checkout | Dev | ⬜ Pending |
| Order summary | Dev | ⬜ Pending |
| Admin dashboard — products | Dev | ⬜ Pending |
| Admin dashboard — orders | Dev | ⬜ Pending |
| Admin dashboard — settings | Dev | ⬜ Pending |
| Demo & placeholder compliance | Dev + Owner | ⬜ Pending |
| "Sehat tanpa pengawet" verification | **Owner** | ⬜ Pending |
| Responsive / overflow QA | Dev | ⬜ Pending |
| Accessibility | Dev | ⬜ Pending |

---

*Document version: Phase 1 · Last updated: November 2026*

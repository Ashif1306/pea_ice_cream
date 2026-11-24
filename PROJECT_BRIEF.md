# 🍦 Pea Ice Cream — Project Brief

> **Makassar's homemade ice cream, crafted with love. No preservatives. No compromise.**

---

## 1. Business Overviewrggf

| Field | Detail |
|---|---|
| **Brand Name** | Pea Ice Cream |
| **Business Type** | Homemade artisan ice cream |
| **Location** | Makassar, Indonesia |
| **Key Selling Point** | Homemade, no preservatives — *sehat tanpa pengawet* ⚠️ *(requires owner verification)* |
| **Taglines** | "ice cream classic" · "homemade ice cream" · "sehat tanpa pengawet" *(owner verification required)* |
| **Currency** | Rupiah (IDR) |
| **Language** | Indonesian (Bahasa Indonesia) |

Pea Ice Cream is a local Makassar ice cream brand offering classic, homemade ice cream flavors. The business emphasises freshness and quality without artificial preservatives. Orders are fulfilled via delivery or customer pickup, with payment handled manually through bank transfer or QRIS.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Component Library** | shadcn/ui |
| **Database (future)** | Supabase *(not connected in Phase 1)* |
| **Deployment (future)** | Vercel *(not deployed in Phase 1)* |

> [!NOTE]
> Phase 1 is a fully local interactive prototype. No Supabase connection and no live deployment are required at this stage. All data is mocked or held in local state.

---

## 3. Current Phase

**Phase 1 — Foundation & Interactive Prototype**

- Build the complete UI for both the customer-facing storefront and the admin dashboard.
- Use mock/static data throughout; no real database calls.
- Demonstrate all user flows interactively in the browser (`npm run dev`).
- Display a persistent **demo notice** to make clear that changes are not saved to any database.
- Supabase integration and Vercel deployment are deferred to a later phase.

---

## 4. Customer-Facing Pages

### 4.1 Home
- Hero section with branding and primary CTA
- Menu/product preview (featured items)
- Brand story section
- Links to ordering apps (GrabFood, ShopeeFood) — **display only, no functional integration in Phase 1**
- Location / map section
- Contact information

### 4.2 Catalog
- Full product listing
- Search bar
- Filter by: flavor, size, price range, stock status

### 4.3 Product Detail
- Product name, description, photo
- Size selection
- Mix-flavor selection *(only shown when the product allows it)*
- Quantity picker
- Customer notes field
- **Bottom sheet UI on mobile** for size/flavor/quantity selection

### 4.4 Cart
- List of cart items with quantity controls
- Remove item option
- Subtotal display
- > [!IMPORTANT]
  > Cart subtotal **excludes delivery fee**. Delivery fee is confirmed separately by admin after the order is placed.

### 4.5 Checkout
- Customer name
- WhatsApp number
- Delivery method: **Delivery** or **Pickup**
- Delivery address + landmark *(shown only when Delivery is selected)*
- Payment method: Bank Transfer or QRIS
- Order notes
- Order summary panel

### 4.6 Order Summary
- Unique order reference number
- Status: **Awaiting Confirmation** (initial state)
- Payment instructions (bank account / QRIS image)
- > [!CAUTION]
  > No real WhatsApp messages are sent in Phase 1. All order submissions are previews only.

---

## 5. Admin Dashboard Pages

The admin dashboard covers all operational management needs:

### Products & Catalog Management
- **Products** — Add, edit, archive products
- **Categories** — Manage product categories
- **Flavors** — Manage available flavors
- **Sizes** — Manage available sizes (e.g., cup 100ml, 250ml, 500ml)
- **Pricing** — Set price per flavor + size combination
- **Allergens** — Tag allergen information per product
- **Photos** — Upload and manage product photos
- **Mix-Flavor Options** — Configure which products allow mix-flavor selection
- **Stock** — Manage stock levels per flavor + size combination

### Orders Management
- **Orders** — View all incoming orders, order detail
- **Customer Details** — View customer name, WhatsApp, address per order
- **Order Status** — Update order status (e.g., Pending, Confirmed, In Preparation, Delivered, Cancelled)
- **Payment Status** — Confirm or reject manual payment proofs (transfer / QRIS)
- **Delivery Fee** — Confirm delivery fee per order (communicated via WhatsApp)

### Business Settings
- **Business Profile** — Business name, taglines, description
- **Logo** — Upload/replace business logo
- **Address** — Store/outlet address
- **Operating Hours** — Set open/closed hours per day
- **WhatsApp Number** — Business WhatsApp contact
- **Delivery Zones & Rules** — Define delivery coverage areas and rules
- **Bank Accounts** — Add/manage bank account details for transfer payment
- **QRIS Upload** — Upload QRIS image for payment
- **GrabFood / ShopeeFood Links** — Add ordering app URLs *(display only)*

### Admin Account
- **Admin Profile** — Manage admin name and credentials

---

## 6. Business Rules

| Rule | Detail |
|---|---|
| **Customer Login** | Not required. No customer accounts. |
| **Order Fulfillment** | Delivery or Pickup (customer selects at checkout) |
| **Delivery Fee** | Not fixed. Admin confirms the fee per order and communicates it to the customer. |
| **Payment Methods** | Manual bank transfer or QRIS scan. Admin manually verifies proof of payment. |
| **Stock Management** | Tracked per **flavor + size** combination. |
| **No Real Transactions** | Phase 1 is a preview only. No real orders, payments, or WhatsApp messages are sent. |

---

## 7. Design Direction

| Attribute | Value |
|---|---|
| **Aesthetic** | Chic & modern, colorful, fun yet clean |
| **Dominant Colors** | Pink (#FF6B9D) + White (#FFFFFF) |
| **Accent Colors** | Blue (#1E3A5F), Yellow (#FFD700), Green (#4CAF50) |
| **Title Font** | Fredoka |
| **Body Font** | Nunito |
| **Component Style** | Rounded cards (`rounded-2xl`), oval buttons (`rounded-full`) |
| **Mobile Pattern** | Bottom sheet for product size/flavor/quantity selection |
| **Priority** | Mobile-first |

> See **DESIGN_GUIDE.md** for the full design system specification.

---

## 8. Out of Scope (Phase 1)

- Supabase database integration
- Vercel deployment
- Real WhatsApp API (e.g., Fonnte, Twilio)
- GrabFood / ShopeeFood live integration
- Customer accounts or authentication
- Automated payment gateway
- Real email notifications

---

*Document version: Phase 1 · Last updated: November 2026*

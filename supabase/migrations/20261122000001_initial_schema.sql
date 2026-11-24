-- ============================================================================
-- 001: INITIAL SCHEMA FOR PEA ICE CREAM MAKASSAR
-- Tables: store_settings, banners, product_categories, products, product_flavors,
--         product_sizes, inventory, stock_logs, delivery_zones, payment_methods,
--         external_delivery_apps, admin_users, orders, order_items, order_status_history
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ADMIN USERS (Authorization & RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- ----------------------------------------------------------------------------
-- 2. STORE SETTINGS (Public & Operational Identity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Pea Ice Cream',
    tagline_primary TEXT NOT NULL DEFAULT 'ice cream classic • homemade ice cream',
    taglines TEXT[] NOT NULL DEFAULT ARRAY['ice cream classic', 'homemade ice cream'],
    pending_verification_tagline TEXT NOT NULL DEFAULT 'sehat tanpa pengawet',
    description TEXT NOT NULL DEFAULT 'Es krim artisan premium dengan cita rasa lokal dan internasional di Makassar.',
    whatsapp_number TEXT NOT NULL DEFAULT '081234567890',
    instagram TEXT NOT NULL DEFAULT '@pea.icecream',
    tiktok TEXT NOT NULL DEFAULT '@pea.icecream',
    address TEXT NOT NULL DEFAULT 'Jl. Boulevard No. 18, Panakkukang, Makassar',
    city TEXT NOT NULL DEFAULT 'Makassar, Sulawesi Selatan',
    business_hours JSONB NOT NULL DEFAULT '{"open": "10:00", "close": "21:00", "timezone": "Asia/Makassar", "daysOpen": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]}'::jsonb,
    logo_url TEXT NOT NULL DEFAULT '/logo.jpg',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 3. BANNERS (Hero Carousel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_idx INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    cta_text TEXT NOT NULL DEFAULT 'Lihat Menu',
    cta_link TEXT NOT NULL DEFAULT '/katalog',
    badge TEXT,
    bg_theme TEXT NOT NULL DEFAULT 'pink' CHECK (bg_theme IN ('pink', 'yellow', 'blue', 'green')),
    image_desktop TEXT NOT NULL,
    image_mobile TEXT,
    image_alt TEXT NOT NULL DEFAULT 'Banner Pea Ice Cream',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(order_idx ASC) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 4. PRODUCT CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    order_idx INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ----------------------------------------------------------------------------
-- 5. PRODUCTS (Menu Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    category_slug TEXT NOT NULL REFERENCES public.product_categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
    allergens TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    images TEXT[] NOT NULL DEFAULT ARRAY['/placeholder-ice-cream.jpg']::text[],
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false, -- Soft delete: jangan hapus produk yang pernah dipesan
    base_price INTEGER NOT NULL CHECK (base_price >= 0), -- Rupiah integer
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_available, is_archived);

-- ----------------------------------------------------------------------------
-- 6. PRODUCT FLAVORS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_idx INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_product_flavor_slug UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_flavors_product ON public.product_flavors(product_id);

-- ----------------------------------------------------------------------------
-- 7. PRODUCT SIZES & PRICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    price INTEGER NOT NULL CHECK (price >= 0), -- Rupiah integer
    allow_mix_flavors BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_product_size UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_sizes_product ON public.product_sizes(product_id);

-- ----------------------------------------------------------------------------
-- 8. INVENTORY (Stock per Product + Flavor + Size)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    flavor_id UUID NOT NULL REFERENCES public.product_flavors(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0), -- Stok tidak boleh negatif
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_inventory_combo UNIQUE (product_id, flavor_id, size)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON public.inventory(product_id, flavor_id, size);

-- ----------------------------------------------------------------------------
-- 9. STOCK LOGS (Inventory Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL, -- e.g. -2 when confirmed, +2 when cancelled, +10 when restocked
    reason TEXT NOT NULL, -- 'order_confirmation', 'order_cancellation', 'manual_adjustment', 'restock'
    order_id UUID, -- References orders(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_inv ON public.stock_logs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_order ON public.stock_logs(order_id);

-- ----------------------------------------------------------------------------
-- 10. DELIVERY ZONES (Makassar Areas & Shipping Rules)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fee_range TEXT NOT NULL,
    notes TEXT,
    order_idx INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ----------------------------------------------------------------------------
-- 11. PAYMENT METHODS (Bank & QRIS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('transfer', 'qris')),
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    qris_image_url TEXT,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_idx INTEGER NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 12. EXTERNAL DELIVERY APPS (GrabFood, ShopeeFood)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_delivery_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_idx INTEGER NOT NULL DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 13. ORDERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref TEXT NOT NULL UNIQUE, -- PEA-YYYYMMDD-XXXX
    idempotency_key TEXT UNIQUE, -- Mencegah double submit / retry
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
    delivery_address TEXT NOT NULL,
    address_landmark TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'qris')),
    order_notes TEXT,
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0), -- Rupiah integer dihitung ulang oleh server
    delivery_fee INTEGER CHECK (delivery_fee IS NULL OR delivery_fee >= 0), -- NULL untuk pengantaran sebelum dikonfirmasi, 0 untuk ambil sendiri
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'verified')),
    stock_deducted BOOLEAN NOT NULL DEFAULT false, -- Menjamin pengurangan stok hanya terjadi sekali
    guest_token_hash TEXT, -- Hash token acak untuk akses aman status pesanan tamu
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders(ref);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 14. ORDER ITEMS (Snapshot saat Pesanan Dibuat)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    flavor_snapshot TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- 15. ORDER STATUS HISTORY (Audit Trail Perubahan Status)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);

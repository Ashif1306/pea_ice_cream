-- ========================================================
-- PEA ICE CREAM MAKASSAR - COMPLETE SUPABASE SETUP SCRIPT
-- Jalankan seluruh script ini di Supabase SQL Editor
-- ========================================================



-- >>>>>>>> 20261122000001_initial_schema.sql <<<<<<<<

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


-- >>>>>>>> 20261122000002_functions_and_triggers.sql <<<<<<<<

-- ============================================================================
-- 002: DATABASE FUNCTIONS & ATOMIC TRANSACTIONS
-- Functions: is_admin, create_customer_order, confirm_and_deduct_order_stock,
--            cancel_and_restore_order_stock
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER: Check if current authenticated user is an authorized admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC TRANSACTION: Create Customer Order
--    - Recalculates all prices directly from product_sizes in the database
--    - Validates product active status and size availability
--    - Enforces idempotency via idempotency_key
--    - Computes subtotal, handles delivery fee (NULL for delivery, 0 for pickup)
--    - Inserts order and order_items in one atomic transaction
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_customer_order(order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_idempotency_key TEXT;
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_delivery_method TEXT;
    v_delivery_address TEXT;
    v_address_landmark TEXT;
    v_payment_method TEXT;
    v_order_notes TEXT;
    v_guest_token_hash TEXT;
    v_items JSONB;
    v_item JSONB;
    
    v_order_id UUID;
    v_ref TEXT;
    v_subtotal INTEGER := 0;
    v_delivery_fee INTEGER := NULL;
    v_total_amount INTEGER := 0;
    
    v_prod_id UUID;
    v_prod_name TEXT;
    v_prod_active BOOLEAN;
    v_prod_archived BOOLEAN;
    v_size TEXT;
    v_unit_price INTEGER;
    v_allow_mix BOOLEAN;
    v_qty INTEGER;
    v_flavors TEXT[];
    v_item_subtotal INTEGER;
    
    v_existing_order JSONB;
    v_date_prefix TEXT;
    v_random_num INTEGER;
BEGIN
    -- 1. Extract and validate payload fields
    v_idempotency_key := NULLIF(trim(order_payload->>'idempotency_key'), '');
    v_customer_name := trim(COALESCE(order_payload->>'customer_name', ''));
    v_customer_phone := trim(COALESCE(order_payload->>'customer_phone', ''));
    v_delivery_method := lower(trim(COALESCE(order_payload->>'delivery_method', 'delivery')));
    v_delivery_address := trim(COALESCE(order_payload->>'delivery_address', ''));
    v_address_landmark := NULLIF(trim(order_payload->>'address_landmark'), '');
    v_payment_method := lower(trim(COALESCE(order_payload->>'payment_method', 'qris')));
    v_order_notes := NULLIF(trim(order_payload->>'order_notes'), '');
    v_guest_token_hash := NULLIF(trim(order_payload->>'guest_token_hash'), '');
    v_items := order_payload->'items';

    IF v_customer_name = '' THEN
        RAISE EXCEPTION 'Nama pelanggan wajib diisi';
    END IF;

    IF length(regexp_replace(v_customer_phone, '\D', '', 'g')) < 9 THEN
        RAISE EXCEPTION 'Nomor WhatsApp pelanggan tidak valid (minimal 9 digit)';
    END IF;

    IF v_delivery_method NOT IN ('delivery', 'pickup') THEN
        RAISE EXCEPTION 'Metode pengiriman tidak valid';
    END IF;

    IF v_delivery_method = 'delivery' AND v_delivery_address = '' THEN
        RAISE EXCEPTION 'Alamat pengantaran wajib diisi untuk layanan antar';
    END IF;

    IF v_payment_method NOT IN ('transfer', 'qris') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid';
    END IF;

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Keranjang pesanan tidak boleh kosong';
    END IF;

    -- 2. Idempotency Check: if this idempotency key was already processed, return existing order
    IF v_idempotency_key IS NOT NULL THEN
        SELECT jsonb_build_object(
            'success', true,
            'order_id', id,
            'ref', ref,
            'subtotal', subtotal,
            'total_amount', total_amount,
            'delivery_fee', delivery_fee,
            'status', order_status,
            'is_retry', true
        ) INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key;

        IF v_existing_order IS NOT NULL THEN
            RETURN v_existing_order;
        END IF;
    END IF;

    -- 3. Delivery fee rule:
    --    - Pickup: fee is Rp 0
    --    - Delivery: fee is NULL (to be confirmed by admin, NEVER assumed Rp 0)
    IF v_delivery_method = 'pickup' THEN
        v_delivery_fee := 0;
        IF v_delivery_address = '' THEN
            v_delivery_address := 'Ambil Sendiri di Outlet Makassar';
        END IF;
    ELSE
        v_delivery_fee := NULL; -- Subtotal belum termasuk ongkir
    END IF;

    -- 4. Generate unique reference number: PEA-YYYYMMDD-XXXX
    v_date_prefix := to_char(timezone('Asia/Makassar', now()), 'YYYYMMDD');
    v_random_num := floor(1000 + random() * 9000)::integer;
    v_ref := 'PEA-' || v_date_prefix || '-' || v_random_num::text;

    -- Ensure unique ref
    WHILE EXISTS (SELECT 1 FROM public.orders WHERE ref = v_ref) LOOP
        v_random_num := floor(1000 + random() * 9000)::integer;
        v_ref := 'PEA-' || v_date_prefix || '-' || v_random_num::text;
    END LOOP;

    -- 5. Create Order Header (temporary subtotal 0, will update after validating items)
    v_order_id := gen_random_uuid();

    INSERT INTO public.orders (
        id,
        ref,
        idempotency_key,
        customer_name,
        customer_phone,
        delivery_method,
        delivery_address,
        address_landmark,
        payment_method,
        order_notes,
        subtotal,
        delivery_fee,
        total_amount,
        order_status,
        payment_status,
        stock_deducted,
        guest_token_hash,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        v_ref,
        v_idempotency_key,
        v_customer_name,
        v_customer_phone,
        v_delivery_method,
        v_delivery_address,
        v_address_landmark,
        v_payment_method,
        v_order_notes,
        0,
        v_delivery_fee,
        0,
        'pending',
        'unpaid',
        false,
        v_guest_token_hash,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    -- 6. Loop and validate each item from database
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::uuid;
        v_size := lower(trim(COALESCE(v_item->>'size', 'small')));
        v_qty := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Jumlah item harus lebih dari 0';
        END IF;

        -- Verify product exists, is available, and not archived
        SELECT name, is_available, is_archived
        INTO v_prod_name, v_prod_active, v_prod_archived
        FROM public.products
        WHERE id = v_prod_id;

        IF v_prod_name IS NULL THEN
            RAISE EXCEPTION 'Produk tidak ditemukan';
        END IF;

        IF NOT v_prod_active OR v_prod_archived THEN
            RAISE EXCEPTION 'Menu "%" saat ini sedang tidak tersedia', v_prod_name;
        END IF;

        -- Verify size and recalculate exact unit price from database
        SELECT price, allow_mix_flavors
        INTO v_unit_price, v_allow_mix
        FROM public.product_sizes
        WHERE product_id = v_prod_id AND size = v_size;

        IF v_unit_price IS NULL THEN
            RAISE EXCEPTION 'Ukuran "%" tidak tersedia untuk menu "%"', v_size, v_prod_name;
        END IF;

        -- Extract flavor snapshot array
        SELECT ARRAY(
            SELECT jsonb_array_elements_text(COALESCE(v_item->'flavors', '[]'::jsonb))
        ) INTO v_flavors;

        IF array_length(v_flavors, 1) IS NULL OR array_length(v_flavors, 1) = 0 THEN
            v_flavors := ARRAY[v_prod_name];
        END IF;

        IF array_length(v_flavors, 1) > 1 AND NOT v_allow_mix THEN
            RAISE EXCEPTION 'Ukuran "%" pada menu "%" tidak mendukung kombinasi campur rasa', v_size, v_prod_name;
        END IF;

        v_item_subtotal := v_unit_price * v_qty;
        v_subtotal := v_subtotal + v_item_subtotal;

        -- Insert order item snapshot
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            flavor_snapshot,
            size,
            unit_price,
            quantity,
            subtotal,
            notes
        ) VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_flavors,
            v_size,
            v_unit_price,
            v_qty,
            v_item_subtotal,
            NULLIF(trim(v_item->>'notes'), '')
        );
    END LOOP;

    -- 7. Update order totals
    v_total_amount := v_subtotal + COALESCE(v_delivery_fee, 0);

    UPDATE public.orders
    SET subtotal = v_subtotal,
        total_amount = v_total_amount,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_order_id;

    -- 8. Record initial status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        note,
        created_at
    ) VALUES (
        v_order_id,
        NULL,
        'pending',
        'Pesanan baru dibuat oleh pelanggan (menunggu konfirmasi admin)',
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'ref', v_ref,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. ATOMIC TRANSACTION: Confirm and Deduct Order Stock
--    - Requires admin authorization
--    - Locks order row FOR UPDATE
--    - Idempotent: checks stock_deducted flag to guarantee stock is never deducted twice
--    - Locks inventory rows FOR UPDATE and checks sufficient stock
--    - If any flavor/size is insufficient, aborts with clear error message
--    - Deducts stock and logs change in stock_logs
--    - Updates order status to 'confirmed' and stock_deducted = true
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_and_deduct_order_stock(
    p_order_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_flavor_name TEXT;
    v_flavor_id UUID;
    v_inv_id UUID;
    v_current_stock INTEGER;
    v_flavor_count INTEGER;
    v_deduct_qty INTEGER;
BEGIN
    -- 1. Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengonfirmasi pesanan';
    END IF;

    -- 2. Lock order row
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan';
    END IF;

    -- Idempotency: if stock was already deducted, simply ensure status is confirmed and return
    IF v_order.stock_deducted THEN
        IF v_order.order_status != 'confirmed' THEN
            UPDATE public.orders
            SET order_status = 'confirmed',
                updated_at = timezone('utc'::text, now())
            WHERE id = p_order_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Pesanan sudah dikonfirmasi sebelumnya. Stok tidak dikurangi berulang.',
            'order_id', p_order_id,
            'status', 'confirmed',
            'already_deducted', true
        );
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RAISE EXCEPTION 'Pesanan yang telah dibatalkan tidak dapat dikonfirmasi langsung';
    END IF;

    -- 3. Loop through order items and deduct stock
    FOR v_item IN
        SELECT oi.*, p.name AS product_name
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
    LOOP
        v_flavor_count := array_length(v_item.flavor_snapshot, 1);
        IF v_flavor_count IS NULL OR v_flavor_count = 0 THEN
            v_flavor_count := 1;
        END IF;

        -- Aturan pengurangan stok campur rasa:
        -- Setiap cup memerlukan komponen rasa yang proporsional.
        -- Jika single flavor: 1 unit stock dikurangi per quantity.
        -- Jika mix 2 rasa: masing-masing rasa dikurangi per cup (stok dikelola per rasa).
        FOREACH v_flavor_name IN ARRAY v_item.flavor_snapshot
        LOOP
            -- Find flavor_id
            SELECT id INTO v_flavor_id
            FROM public.product_flavors
            WHERE product_id = v_item.product_id AND (name = v_flavor_name OR slug = lower(replace(v_flavor_name, ' ', '-')))
            LIMIT 1;

            -- If flavor record exists in inventory, lock and deduct
            IF v_flavor_id IS NOT NULL THEN
                SELECT id, quantity INTO v_inv_id, v_current_stock
                FROM public.inventory
                WHERE product_id = v_item.product_id AND flavor_id = v_flavor_id AND size = v_item.size
                FOR UPDATE;

                IF v_inv_id IS NOT NULL THEN
                    v_deduct_qty := v_item.quantity;

                    IF v_current_stock < v_deduct_qty THEN
                        RAISE EXCEPTION 'Stok tidak cukup untuk menu "%" rasa "%" ukuran "%" (Tersedia: %, Diminta: %)',
                            v_item.product_name_snapshot, v_flavor_name, v_item.size, v_current_stock, v_deduct_qty;
                    END IF;

                    -- Deduct stock
                    UPDATE public.inventory
                    SET quantity = quantity - v_deduct_qty,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = v_inv_id;

                    -- Record inventory audit trail
                    INSERT INTO public.stock_logs (
                        inventory_id,
                        change_amount,
                        reason,
                        order_id,
                        created_at,
                        created_by
                    ) VALUES (
                        v_inv_id,
                        -v_deduct_qty,
                        'order_confirmation',
                        p_order_id,
                        timezone('utc'::text, now()),
                        p_admin_id
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- 4. Mark order as confirmed and stock_deducted = true
    UPDATE public.orders
    SET order_status = 'confirmed',
        stock_deducted = true,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    -- 5. Record status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        note,
        changed_by,
        created_at
    ) VALUES (
        p_order_id,
        v_order.order_status,
        'confirmed',
        'Pesanan dikonfirmasi oleh admin dan stok telah dikurangi secara atomik',
        p_admin_id,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pesanan berhasil dikonfirmasi dan stok telah dikurangi.',
        'order_id', p_order_id,
        'status', 'confirmed',
        'already_deducted', false
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ATOMIC TRANSACTION: Cancel Order and Restore Stock (If Deducted)
--    - Requires admin authorization
--    - Locks order row FOR UPDATE
--    - If stock was previously deducted, restores exact amounts once and logs in stock_logs
--    - Updates order status to 'cancelled'
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_and_restore_order_stock(
    p_order_id UUID,
    p_admin_id UUID DEFAULT auth.uid(),
    p_reason TEXT DEFAULT 'Dibatalkan oleh admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_flavor_name TEXT;
    v_flavor_id UUID;
    v_inv_id UUID;
    v_restore_qty INTEGER;
BEGIN
    -- 1. Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat membatalkan pesanan';
    END IF;

    -- 2. Lock order row
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan';
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Pesanan sudah berstatus batal.',
            'order_id', p_order_id,
            'status', 'cancelled'
        );
    END IF;

    -- 3. If stock was deducted, restore it once
    IF v_order.stock_deducted THEN
        FOR v_item IN
            SELECT * FROM public.order_items WHERE order_id = p_order_id
        LOOP
            FOREACH v_flavor_name IN ARRAY v_item.flavor_snapshot
            LOOP
                SELECT id INTO v_flavor_id
                FROM public.product_flavors
                WHERE product_id = v_item.product_id AND (name = v_flavor_name OR slug = lower(replace(v_flavor_name, ' ', '-')))
                LIMIT 1;

                IF v_flavor_id IS NOT NULL THEN
                    SELECT id INTO v_inv_id
                    FROM public.inventory
                    WHERE product_id = v_item.product_id AND flavor_id = v_flavor_id AND size = v_item.size
                    FOR UPDATE;

                    IF v_inv_id IS NOT NULL THEN
                        v_restore_qty := v_item.quantity;

                        UPDATE public.inventory
                        SET quantity = quantity + v_restore_qty,
                            updated_at = timezone('utc'::text, now())
                        WHERE id = v_inv_id;

                        INSERT INTO public.stock_logs (
                            inventory_id,
                            change_amount,
                            reason,
                            order_id,
                            created_at,
                            created_by
                        ) VALUES (
                            v_inv_id,
                            v_restore_qty,
                            'order_cancellation',
                            p_order_id,
                            timezone('utc'::text, now()),
                            p_admin_id
                        );
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    -- 4. Mark order as cancelled and reset stock_deducted flag to prevent repeat restores
    UPDATE public.orders
    SET order_status = 'cancelled',
        stock_deducted = false,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    -- 5. Record status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        note,
        changed_by,
        created_at
    ) VALUES (
        p_order_id,
        v_order.order_status,
        'cancelled',
        COALESCE(p_reason, 'Pesanan dibatalkan (stok dipulihkan jika sebelumnya sudah dikurangi)'),
        p_admin_id,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pesanan berhasil dibatalkan.',
        'order_id', p_order_id,
        'status', 'cancelled'
    );
END;
$$;


-- >>>>>>>> 20261122000003_row_level_security.sql <<<<<<<<

-- ============================================================================
-- 003: ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security: Public read on active catalog/banners/settings only.
-- All admin actions require verified membership in admin_users.
-- Orders and customer details are never exposed to public Data API.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_delivery_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. POLICIES: admin_users
--    - Authenticated users can only read their own admin record
--    - Only superadmin can manage admin_users
-- ----------------------------------------------------------------------------
CREATE POLICY "Admins can view their own record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- ----------------------------------------------------------------------------
-- 3. POLICIES: store_settings
--    - Public can read active settings
--    - Admin can manage settings
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active store settings"
ON public.store_settings
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. POLICIES: banners
--    - Public can read active banners
--    - Admin can manage banners
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage banners"
ON public.banners
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. POLICIES: product_categories
--    - Public can read active categories
--    - Admin can manage categories
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active product categories"
ON public.product_categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage product categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. POLICIES: products
--    - Public can view available and non-archived products
--    - Admin can manage all products
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view available products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_available = true AND is_archived = false);

CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. POLICIES: product_flavors
--    - Public can view active flavors
--    - Admin can manage flavors
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active product flavors"
ON public.product_flavors
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage product flavors"
ON public.product_flavors
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. POLICIES: product_sizes
--    - Public can view product sizes
--    - Admin can manage sizes
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view product sizes"
ON public.product_sizes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage product sizes"
ON public.product_sizes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. POLICIES: inventory
--    - Public can view inventory quantity (for stock indicators)
--    - Admin can manage inventory
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view inventory counts"
ON public.inventory
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage inventory"
ON public.inventory
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. POLICIES: stock_logs
--    - Admin ONLY can view stock logs
-- ----------------------------------------------------------------------------
CREATE POLICY "Admins can view stock logs"
ON public.stock_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. POLICIES: delivery_zones
--    - Public can view active delivery zones
--    - Admin can manage delivery zones
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active delivery zones"
ON public.delivery_zones
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage delivery zones"
ON public.delivery_zones
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 12. POLICIES: payment_methods
--    - Public can view active payment methods
--    - Admin can manage payment methods
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active payment methods"
ON public.payment_methods
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 13. POLICIES: external_delivery_apps
--    - Public can view active apps
--    - Admin can manage external apps
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active external apps"
ON public.external_delivery_apps
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage external apps"
ON public.external_delivery_apps
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 14. POLICIES: orders, order_items, order_status_history
--    - Public CANNOT view orders directly via Data API
--    - Guest customers access orders via secure server endpoint with signed token
--    - Admin has full access to view, update, manage orders
-- ----------------------------------------------------------------------------
CREATE POLICY "Admins have full access to orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to order items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to order history"
ON public.order_status_history
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 15. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_customer_order(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_customer_order(JSONB) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.confirm_and_deduct_order_stock(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_and_deduct_order_stock(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_and_restore_order_stock(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_and_restore_order_stock(UUID, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;


-- >>>>>>>> 20261122000004_storage_setup.sql <<<<<<<<

-- ============================================================================
-- 004: STORAGE BUCKET & STORAGE POLICIES
-- Bucket: pea-assets (public read, admin-only write)
-- ============================================================================

-- Create public bucket for pea-assets if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pea-assets',
    'pea-assets',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[];

-- ----------------------------------------------------------------------------
-- Storage Policies on storage.objects
-- ----------------------------------------------------------------------------
-- 1. Public can read/download images from pea-assets bucket
CREATE POLICY "Public can view pea-assets images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pea-assets');

-- 2. Only authorized admins can upload images
CREATE POLICY "Admins can upload to pea-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pea-assets' AND public.is_admin()
);

-- 3. Only authorized admins can update images
CREATE POLICY "Admins can update pea-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'pea-assets' AND public.is_admin()
);

-- 4. Only authorized admins can delete images
CREATE POLICY "Admins can delete from pea-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'pea-assets' AND public.is_admin()
);


-- >>>>>>>> 20261122000005_seed_data.sql <<<<<<<<

-- ============================================================================
-- 005: SEED DATA (OPTIONAL & IDEMPOTENT)
-- Seeds: store_settings, product_categories, products, product_flavors,
--        product_sizes, inventory, banners, delivery_zones, payment_methods,
--        external_delivery_apps
-- ============================================================================

-- 1. Store Settings
INSERT INTO public.store_settings (
    id,
    business_name,
    tagline_primary,
    taglines,
    pending_verification_tagline,
    description,
    whatsapp_number,
    instagram,
    tiktok,
    address,
    city,
    business_hours,
    logo_url,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Pea Ice Cream',
    'ice cream classic • homemade ice cream',
    ARRAY['ice cream classic', 'homemade ice cream'],
    'sehat tanpa pengawet',
    'Es krim artisan premium dengan cita rasa lokal dan internasional. Homemade ice cream Makassar — mix rasa, pesan via WhatsApp.',
    '081234567890',
    '@pea.icecream',
    '@pea.icecream',
    'Jl. Boulevard No. 18, Panakkukang, Makassar',
    'Makassar, Sulawesi Selatan',
    '{"open": "10:00", "close": "21:00", "timezone": "Asia/Makassar", "daysOpen": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]}'::jsonb,
    '/logo.jpg',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Banners
INSERT INTO public.banners (
    id,
    order_idx,
    is_active,
    title,
    subtitle,
    cta_text,
    cta_link,
    badge,
    bg_theme,
    image_desktop,
    image_mobile,
    image_alt
) VALUES
(
    '00000000-0000-0000-0000-000000000011',
    1,
    true,
    'Rasa klasik, bahagia di setiap scoop.',
    'Homemade ice cream dari Makassar dibuat dengan bahan pilihan untuk menyempurnakan hari bahagiamu.',
    'Lihat Semua Menu',
    '/katalog',
    'ice cream classic',
    'pink',
    '/banners/banner-classic.svg',
    '/banners/banner-classic.svg',
    'Sajian es krim homemade klasik Pea Ice Cream Makassar'
),
(
    '00000000-0000-0000-0000-000000000012',
    2,
    true,
    'Temukan rasa favoritmu hari ini.',
    'Pilih aneka rasa favorit dan kombinasikan 2 rasa sekaligus dalam satu cup lembut.',
    'Pilih Rasa Favorit',
    '/katalog',
    'homemade ice cream',
    'yellow',
    '/banners/banner-flavors.svg',
    '/banners/banner-flavors.svg',
    'Pilihan varian rasa es krim Pea Ice Cream dalam cup'
),
(
    '00000000-0000-0000-0000-000000000013',
    3,
    true,
    'Momen manis untuk dinikmati bersama.',
    'Jelajahi pilihan paket berbagi Pea untuk kebersamaan keluarga dan sahabat tercinta.',
    'Lihat Paket Berbagi',
    '/katalog?kategori=seasonal',
    'paket berbagi',
    'blue',
    '/banners/banner-sharing.svg',
    '/banners/banner-sharing.svg',
    'Paket berbagi es krim Pea untuk dinikmati bersama'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Product Categories
INSERT INTO public.product_categories (id, slug, name, order_idx, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000021', 'classic', 'Classic', 1, true),
    ('00000000-0000-0000-0000-000000000022', 'signature', 'Signature', 2, true),
    ('00000000-0000-0000-0000-000000000023', 'local-flavors', 'Cita Rasa Lokal', 3, true),
    ('00000000-0000-0000-0000-000000000024', 'seasonal', 'Musiman', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Products, Flavors, Sizes, and Inventory
DO $$
DECLARE
    v_prod_id UUID;
    v_flavor_id UUID;
BEGIN
    -- Product 1: Vanilla Dream
    v_prod_id := '00000000-0000-0000-0000-000000000101';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Vanilla Dream', 'vanilla-dream', 'Es krim vanilla klasik yang lembut dengan aroma biji vanila asli Madagascar. Creamy, ringan, dan sempurna untuk semua kalangan.', 'classic', ARRAY['susu', 'telur'], ARRAY['/placeholder-ice-cream.jpg'], true, true, false, false, 15000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 15000, false),
        (v_prod_id, 'medium', 20000, true),
        (v_prod_id, 'large', 25000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000201';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Vanilla', 'vanilla', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 30),
        (v_prod_id, v_flavor_id, 'medium', 25),
        (v_prod_id, v_flavor_id, 'large', 15)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;

    -- Product 2: Chocolate Fudge
    v_prod_id := '00000000-0000-0000-0000-000000000102';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Chocolate Fudge', 'chocolate-fudge', 'Perpaduan cokelat dark dan milk yang kaya dengan tekstur fudgy memanjakan. Dibuat dari cokelat premium Belgia.', 'classic', ARRAY['susu', 'telur', 'kedelai'], ARRAY['/placeholder-ice-cream.jpg'], true, true, false, false, 15000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 15000, false),
        (v_prod_id, 'medium', 20000, true),
        (v_prod_id, 'large', 25000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000202';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Dark Chocolate', 'dark-chocolate', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 25),
        (v_prod_id, v_flavor_id, 'medium', 20),
        (v_prod_id, v_flavor_id, 'large', 12)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;

    -- Product 3: Strawberry Bliss
    v_prod_id := '00000000-0000-0000-0000-000000000103';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Strawberry Bliss', 'strawberry-bliss', 'Es krim stroberi segar dengan potongan buah stroberi asli. Manis, segar, dan berwarna cerah.', 'classic', ARRAY['susu', 'telur'], ARRAY['/placeholder-ice-cream.jpg'], true, false, false, false, 15000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 15000, false),
        (v_prod_id, 'medium', 20000, true),
        (v_prod_id, 'large', 25000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000203';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Strawberry', 'strawberry', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 20),
        (v_prod_id, v_flavor_id, 'medium', 18),
        (v_prod_id, v_flavor_id, 'large', 10)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;

    -- Product 4: Matcha Kyoto
    v_prod_id := '00000000-0000-0000-0000-000000000104';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Matcha Kyoto', 'matcha-kyoto', 'Es krim matcha premium grade A dari Kyoto. Rasa umami seimbang dengan susu segar Makassar.', 'signature', ARRAY['susu', 'telur'], ARRAY['/placeholder-ice-cream.jpg'], true, true, false, false, 18000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 18000, false),
        (v_prod_id, 'medium', 23000, true),
        (v_prod_id, 'large', 28000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000204';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Matcha', 'matcha', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 15),
        (v_prod_id, v_flavor_id, 'medium', 12),
        (v_prod_id, v_flavor_id, 'large', 8)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;

    -- Product 5: Pandan Nusantara
    v_prod_id := '00000000-0000-0000-0000-000000000105';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Pandan Nusantara', 'pandan-nusantara', 'Cita rasa autentik pandan segar dipadukan santan kelapa gurih. Harum dan khas kuliner Indonesia.', 'local-flavors', ARRAY['susu', 'kelapa'], ARRAY['/placeholder-ice-cream.jpg'], true, false, true, false, 15000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 15000, false),
        (v_prod_id, 'medium', 20000, true),
        (v_prod_id, 'large', 25000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000205';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Pandan', 'pandan', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 20),
        (v_prod_id, v_flavor_id, 'medium', 16),
        (v_prod_id, v_flavor_id, 'large', 10)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;

    -- Product 6: Durian King
    v_prod_id := '00000000-0000-0000-0000-000000000106';
    INSERT INTO public.products (id, name, slug, description, category_slug, allergens, images, is_available, is_bestseller, is_new, is_archived, base_price)
    VALUES (v_prod_id, 'Durian King', 'durian-king', 'Raja buah dalam scoop es krim! Menggunakan daging durian Monthong asli, creamy dan aroma legit.', 'signature', ARRAY['susu', 'telur'], ARRAY['/placeholder-ice-cream.jpg'], true, false, true, false, 20000)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.product_sizes (product_id, size, price, allow_mix_flavors) VALUES
        (v_prod_id, 'small', 20000, false),
        (v_prod_id, 'medium', 27000, true),
        (v_prod_id, 'large', 35000, true)
    ON CONFLICT (product_id, size) DO NOTHING;

    v_flavor_id := '00000000-0000-0000-0000-000000000206';
    INSERT INTO public.product_flavors (id, product_id, name, slug, is_active, order_idx)
    VALUES (v_flavor_id, v_prod_id, 'Durian Monthong', 'durian-monthong', true, 1)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory (product_id, flavor_id, size, quantity) VALUES
        (v_prod_id, v_flavor_id, 'small', 12),
        (v_prod_id, v_flavor_id, 'medium', 10),
        (v_prod_id, v_flavor_id, 'large', 6)
    ON CONFLICT (product_id, flavor_id, size) DO NOTHING;
END $$;

-- 5. Delivery Zones
INSERT INTO public.delivery_zones (name, fee_range, notes, order_idx, is_active)
VALUES
    ('Panakkukang & Rappocini', 'Rp 10.000 - Rp 15.000', 'Radius dekat outlet', 1, true),
    ('Ujung Pandang & Makassar Kota', 'Rp 15.000 - Rp 20.000', 'Area pusat kota', 2, true),
    ('Tamalate & Mamajang', 'Rp 15.000 - Rp 22.000', 'Makassar bagian selatan', 3, true),
    ('Tamalanrea & Biringkanaya', 'Rp 25.000 - Rp 35.000', 'Area kampus & perintis', 4, true)
ON CONFLICT DO NOTHING;

-- 6. Payment Methods
INSERT INTO public.payment_methods (type, bank_name, account_number, account_name, instructions, is_active, order_idx)
VALUES
    ('transfer', 'BCA', '1234567890', 'Pea Ice Cream Makassar', 'Transfer tepat sesuai total nominal dan unggah/kirim bukti transfer via WhatsApp.', true, 1),
    ('qris', 'QRIS Dinamis / Statis', NULL, 'Pea Ice Cream', 'Pindai barcode QRIS menggunakan GoPay, OVO, Dana, BCA Mobile, atau aplikasi bank apa pun.', true, 2)
ON CONFLICT DO NOTHING;

-- 7. External Delivery Apps
INSERT INTO public.external_delivery_apps (name, url, icon, is_active, order_idx)
VALUES
    ('GrabFood', 'https://food.grab.com', 'grab', true, 1),
    ('ShopeeFood', 'https://shopee.co.id/shopeefood', 'shopee', true, 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 010: PRODUCT FLAVOR OPTIONS & MASTER FLAVORS
-- Enables admin to configure multi-choice flavors per product (e.g. Scoop 1, Scoop 2)
-- with custom labels, allowed flavors, duplicate rules, and extra prices.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND PRODUCTS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_flavor_selection BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS flavor_choice_label TEXT NOT NULL DEFAULT 'Scoop',
ADD COLUMN IF NOT EXISTS flavor_choice_count INTEGER NOT NULL DEFAULT 1 CHECK (flavor_choice_count >= 1),
ADD COLUMN IF NOT EXISTS allow_same_flavor BOOLEAN NOT NULL DEFAULT true;

-- ----------------------------------------------------------------------------
-- 2. MASTER FLAVORS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,      -- soft delete / archive
    is_available BOOLEAN NOT NULL DEFAULT true,   -- in stock vs out of stock
    order_idx INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_flavors_active ON public.flavors(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_flavors_order ON public.flavors(order_idx ASC);

-- ----------------------------------------------------------------------------
-- 3. PRODUCT FLAVOR CONFIGS (PER PRODUCT FLAVOR SETTINGS & EXTRA PRICES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_flavor_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    flavor_id UUID NOT NULL REFERENCES public.flavors(id) ON DELETE RESTRICT,
    extra_price INTEGER NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    order_idx INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_product_flavor_config UNIQUE (product_id, flavor_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_flavor_configs_product ON public.product_flavor_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_flavor_configs_flavor ON public.product_flavor_configs(flavor_id);

-- ----------------------------------------------------------------------------
-- 4. EXTEND ORDER ITEMS TABLE (PERMANENT SNAPSHOT OF FLAVOR CHOICES)
-- ----------------------------------------------------------------------------
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS flavor_choices JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS base_price_snapshot INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_flavor_configs ENABLE ROW LEVEL SECURITY;

-- Flavors: Public read active; Admin full access
CREATE POLICY "Public can view active flavors"
    ON public.flavors FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin can manage flavors"
    ON public.flavors FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Product Flavor Configs: Public read active; Admin full access
CREATE POLICY "Public can view product flavor configs"
    ON public.product_flavor_configs FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin can manage product flavor configs"
    ON public.product_flavor_configs FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. UPDATE ATOMIC ORDER CREATION STORED PROCEDURE
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
    v_prod_base_price INTEGER;
    v_has_flavor_selection BOOLEAN;
    v_flavor_choice_label TEXT;
    v_flavor_choice_count INTEGER;
    v_allow_same_flavor BOOLEAN;
    
    v_size TEXT;
    v_unit_price INTEGER;
    v_qty INTEGER;
    v_item_subtotal INTEGER;
    v_flavor_choices JSONB;
    v_choice JSONB;
    v_flavor_id UUID;
    v_flavor_name TEXT;
    v_flavor_available BOOLEAN;
    v_flavor_active BOOLEAN;
    v_extra_price INTEGER;
    v_chosen_flavor_ids UUID[];
    v_flavor_names TEXT[];
    
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

    -- 2. Idempotency Check
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

    -- 3. Delivery fee rule
    IF v_delivery_method = 'pickup' THEN
        v_delivery_fee := 0;
        IF v_delivery_address = '' THEN
            v_delivery_address := 'Ambil Sendiri di Outlet Makassar';
        END IF;
    ELSE
        v_delivery_fee := NULL;
    END IF;

    -- 4. Generate unique reference: PEA-YYYYMMDD-XXXX
    v_date_prefix := to_char(timezone('Asia/Makassar', now()), 'YYYYMMDD');
    v_random_num := floor(1000 + random() * 9000)::integer;
    v_ref := 'PEA-' || v_date_prefix || '-' || v_random_num::text;

    WHILE EXISTS (SELECT 1 FROM public.orders WHERE ref = v_ref) LOOP
        v_random_num := floor(1000 + random() * 9000)::integer;
        v_ref := 'PEA-' || v_date_prefix || '-' || v_random_num::text;
    END LOOP;

    -- 5. Insert order header
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

    -- 6. Loop and validate each item from server DB
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::uuid;
        v_size := lower(trim(COALESCE(v_item->>'size', 'small')));
        v_qty := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Jumlah item harus lebih dari 0';
        END IF;

        -- Verify product exists, is available, not archived
        SELECT name, is_available, is_archived, base_price,
               COALESCE(has_flavor_selection, false),
               COALESCE(flavor_choice_label, 'Scoop'),
               COALESCE(flavor_choice_count, 1),
               COALESCE(allow_same_flavor, true)
        INTO v_prod_name, v_prod_active, v_prod_archived, v_prod_base_price,
             v_has_flavor_selection, v_flavor_choice_label, v_flavor_choice_count, v_allow_same_flavor
        FROM public.products
        WHERE id = v_prod_id;

        IF v_prod_name IS NULL THEN
            RAISE EXCEPTION 'Produk tidak ditemukan';
        END IF;

        IF NOT v_prod_active OR v_prod_archived THEN
            RAISE EXCEPTION 'Menu "%" saat ini sedang tidak tersedia', v_prod_name;
        END IF;

        v_unit_price := v_prod_base_price;
        v_flavor_choices := '[]'::jsonb;
        v_flavor_names := ARRAY[]::text[];
        v_chosen_flavor_ids := ARRAY[]::uuid[];

        -- Case A: Product HAS flavor selection
        IF v_has_flavor_selection THEN
            v_flavor_choices := COALESCE(v_item->'flavor_choices', '[]'::jsonb);

            -- Validate choice count
            IF jsonb_array_length(v_flavor_choices) <> v_flavor_choice_count THEN
                RAISE EXCEPTION 'Menu "%" memerlukan tepat % pilihan %', v_prod_name, v_flavor_choice_count, v_flavor_choice_label;
            END IF;

            -- Validate each choice against product_flavor_configs and flavors
            FOR v_choice IN SELECT * FROM jsonb_array_elements(v_flavor_choices)
            LOOP
                v_flavor_id := (v_choice->>'flavor_id')::uuid;

                -- Check allowed and active in config
                SELECT pfc.extra_price, f.name, f.is_available, f.is_active
                INTO v_extra_price, v_flavor_name, v_flavor_available, v_flavor_active
                FROM public.product_flavor_configs pfc
                JOIN public.flavors f ON f.id = pfc.flavor_id
                WHERE pfc.product_id = v_prod_id AND pfc.flavor_id = v_flavor_id AND pfc.is_active = true;

                IF v_flavor_name IS NULL OR NOT v_flavor_active THEN
                    RAISE EXCEPTION 'Pilihan rasa untuk "%" tidak valid atau sudah dinonaktifkan', v_prod_name;
                END IF;

                IF NOT v_flavor_available THEN
                    RAISE EXCEPTION 'Rasa "%" pada menu "%" saat ini sedang habis', v_flavor_name, v_prod_name;
                END IF;

                -- Check duplicate rule if not allowed
                IF NOT v_allow_same_flavor AND v_flavor_id = ANY(v_chosen_flavor_ids) THEN
                    RAISE EXCEPTION 'Menu "%" tidak mengizinkan pemilihan rasa yang sama lebih dari sekali', v_prod_name;
                END IF;

                v_chosen_flavor_ids := array_append(v_chosen_flavor_ids, v_flavor_id);
                v_flavor_names := array_append(v_flavor_names, v_flavor_name);
                v_unit_price := v_unit_price + COALESCE(v_extra_price, 0);
            END LOOP;
        ELSE
            -- Case B: Product WITHOUT flavor selection (legacy/standard product)
            -- Check if size pricing applies
            IF EXISTS (SELECT 1 FROM public.product_sizes WHERE product_id = v_prod_id) THEN
                SELECT price INTO v_unit_price
                FROM public.product_sizes
                WHERE product_id = v_prod_id AND size = v_size;

                IF v_unit_price IS NULL THEN
                    v_unit_price := v_prod_base_price;
                END IF;
            END IF;

            v_flavor_names := ARRAY[v_prod_name];
        END IF;

        v_item_subtotal := v_unit_price * v_qty;
        v_subtotal := v_subtotal + v_item_subtotal;

        -- Insert order item snapshot
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            flavor_snapshot,
            flavor_choices,
            base_price_snapshot,
            size,
            unit_price,
            quantity,
            subtotal,
            notes
        ) VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_flavor_names,
            v_flavor_choices,
            v_prod_base_price,
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
        'status', 'pending',
        'is_retry', false
    );
END;
$$;

-- ============================================================================
-- Migration: 20261124000011_product_mix_and_category_fix.sql
-- Description: 
--   1. Fix product_categories: add description, timestamps, and ensure category_id link in products.
--   2. Add is_mix_enabled, min_flavor_count, max_flavor_count to products.
--   3. Update create_customer_order procedure to support single checklist mix rasa (min/max range & no duplicate flavors).
-- ============================================================================

-- 1. Enhance product_categories
ALTER TABLE public.product_categories 
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 2. Enhance products: add category_id UUID foreign key & mix rasa fields
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS is_mix_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS min_flavor_count INTEGER NOT NULL DEFAULT 1 CHECK (min_flavor_count >= 1),
ADD COLUMN IF NOT EXISTS max_flavor_count INTEGER NOT NULL DEFAULT 2 CHECK (max_flavor_count >= 1);

-- Backfill category_id from category_slug if available
UPDATE public.products p
SET category_id = c.id
FROM public.product_categories c
WHERE p.category_slug = c.slug AND p.category_id IS NULL;

-- Backfill is_mix_enabled from has_flavor_selection if present
UPDATE public.products
SET is_mix_enabled = COALESCE(has_flavor_selection, false),
    max_flavor_count = COALESCE(flavor_choice_count, 2),
    min_flavor_count = 1
WHERE is_mix_enabled = false AND has_flavor_selection = true;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- 3. Update create_customer_order procedure to handle mix rasa checkbox validation
CREATE OR REPLACE FUNCTION public.create_customer_order(order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_ref TEXT;
    v_date_prefix TEXT;
    v_random_num INTEGER;
    v_existing_order JSONB;
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
    v_prod_id UUID;
    v_prod_name TEXT;
    v_prod_active BOOLEAN;
    v_prod_archived BOOLEAN;
    v_prod_base_price INTEGER;
    v_is_mix_enabled BOOLEAN;
    v_min_flavor_count INTEGER;
    v_max_flavor_count INTEGER;
    v_has_flavor_selection BOOLEAN;
    v_flavor_choice_count INTEGER;
    v_flavor_choice_label TEXT;
    v_allow_same_flavor BOOLEAN;
    v_size TEXT;
    v_qty INTEGER;
    v_unit_price INTEGER;
    v_item_subtotal INTEGER;
    v_order_subtotal INTEGER := 0;
    v_delivery_fee INTEGER := NULL;
    v_total_amount INTEGER := 0;
    v_flavor_choices JSONB;
    v_choice JSONB;
    v_flavor_id UUID;
    v_flavor_name TEXT;
    v_flavor_available BOOLEAN;
    v_flavor_active BOOLEAN;
    v_extra_price INTEGER;
    v_flavor_names TEXT[];
    v_chosen_flavor_ids UUID[];
    v_chosen_count INTEGER;
BEGIN
    -- 1. Extract and validate order header
    v_idempotency_key := NULLIF(trim(order_payload->>'idempotency_key'), '');
    v_customer_name := COALESCE(trim(order_payload->>'customer_name'), '');
    v_customer_phone := COALESCE(trim(order_payload->>'customer_phone'), '');
    v_delivery_method := COALESCE(trim(order_payload->>'delivery_method'), '');
    v_delivery_address := COALESCE(trim(order_payload->>'delivery_address'), '');
    v_address_landmark := NULLIF(trim(order_payload->>'address_landmark'), '');
    v_payment_method := COALESCE(trim(order_payload->>'payment_method'), '');
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
        v_size := lower(trim(COALESCE(v_item->>'size', 'regular')));
        v_qty := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Jumlah item harus lebih dari 0';
        END IF;

        -- Verify product exists, is available, not archived
        SELECT name, is_available, is_archived, base_price,
               COALESCE(is_mix_enabled, has_flavor_selection, false),
               COALESCE(min_flavor_count, 1),
               COALESCE(max_flavor_count, flavor_choice_count, 2),
               COALESCE(has_flavor_selection, false),
               COALESCE(flavor_choice_count, 1),
               COALESCE(flavor_choice_label, 'Rasa'),
               COALESCE(allow_same_flavor, false)
        INTO v_prod_name, v_prod_active, v_prod_archived, v_prod_base_price,
             v_is_mix_enabled, v_min_flavor_count, v_max_flavor_count,
             v_has_flavor_selection, v_flavor_choice_count, v_flavor_choice_label, v_allow_same_flavor
        FROM public.products
        WHERE id = v_prod_id;

        IF v_prod_name IS NULL THEN
            RAISE EXCEPTION 'Produk tidak ditemukan';
        END IF;

        IF NOT v_prod_active OR v_prod_archived THEN
            RAISE EXCEPTION 'Menu "%" saat ini sedang tidak tersedia', v_prod_name;
        END IF;

        v_unit_price := v_prod_base_price;
        v_flavor_choices := COALESCE(v_item->'flavor_choices', '[]'::jsonb);
        v_flavor_names := ARRAY[]::text[];
        v_chosen_flavor_ids := ARRAY[]::uuid[];
        v_chosen_count := jsonb_array_length(v_flavor_choices);

        -- Case A: Product HAS mix flavor selection (single checkbox list with min/max)
        IF v_is_mix_enabled THEN
            IF v_chosen_count < v_min_flavor_count THEN
                RAISE EXCEPTION 'Menu "%" membutuhkan minimal % pilihan rasa', v_prod_name, v_min_flavor_count;
            END IF;

            IF v_chosen_count > v_max_flavor_count THEN
                RAISE EXCEPTION 'Menu "%" hanya memperbolehkan maksimal % pilihan rasa', v_prod_name, v_max_flavor_count;
            END IF;

            -- Validate each checked flavor
            FOR v_choice IN SELECT * FROM jsonb_array_elements(v_flavor_choices)
            LOOP
                v_flavor_id := (v_choice->>'flavor_id')::uuid;

                -- Each flavor can only be checked once in mix selection
                IF v_flavor_id = ANY(v_chosen_flavor_ids) THEN
                    RAISE EXCEPTION 'Rasa tidak boleh dicentang lebih dari satu kali pada menu "%"', v_prod_name;
                END IF;

                -- Check allowed in config
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

                v_chosen_flavor_ids := array_append(v_chosen_flavor_ids, v_flavor_id);
                v_flavor_names := array_append(v_flavor_names, v_flavor_name);
                -- Extra price applied only if explicitly configured
                v_unit_price := v_unit_price + COALESCE(v_extra_price, 0);
            END LOOP;
        ELSE
            -- Case B: Product WITHOUT mix flavor selection (regular standard product)
            -- Check if size pricing applies
            IF EXISTS (SELECT 1 FROM public.product_sizes WHERE product_id = v_prod_id) THEN
                SELECT price INTO v_unit_price
                FROM public.product_sizes
                WHERE product_id = v_prod_id AND size = v_size;

                IF v_unit_price IS NULL THEN
                    v_unit_price := v_prod_base_price;
                END IF;
            END IF;

            -- Keep single flavor snapshot if provided
            IF v_item->'flavors' IS NOT NULL AND jsonb_array_length(v_item->'flavors') > 0 THEN
                SELECT array_agg(value::text) INTO v_flavor_names
                FROM jsonb_array_elements_text(v_item->'flavors');
            ELSE
                v_flavor_names := ARRAY[v_prod_name];
            END IF;
        END IF;

        v_item_subtotal := v_unit_price * v_qty;
        v_order_subtotal := v_order_subtotal + v_item_subtotal;

        -- Insert order item snapshot
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            size,
            unit_price,
            quantity,
            subtotal,
            flavor_snapshot,
            flavor_choices,
            base_price_snapshot,
            notes
        ) VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_size,
            v_unit_price,
            v_qty,
            v_item_subtotal,
            v_flavor_names,
            v_flavor_choices,
            v_prod_base_price,
            NULLIF(trim(v_item->>'notes'), '')
        );
    END LOOP;

    -- 7. Update order totals
    v_total_amount := v_order_subtotal + COALESCE(v_delivery_fee, 0);

    UPDATE public.orders
    SET subtotal = v_order_subtotal,
        delivery_fee = v_delivery_fee,
        total_amount = v_total_amount
    WHERE id = v_order_id;

    -- Return order summary
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'ref', v_ref,
        'subtotal', v_order_subtotal,
        'delivery_fee', v_delivery_fee,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;

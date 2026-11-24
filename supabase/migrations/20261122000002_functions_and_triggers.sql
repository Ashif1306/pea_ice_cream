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

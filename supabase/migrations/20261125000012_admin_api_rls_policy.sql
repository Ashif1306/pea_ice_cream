-- ============================================================================
-- Migration: 20261125000012_admin_api_rls_policy.sql
-- Description:
--   Izinkan operasional manajemen produk, kategori, varian rasa, ukuran,
--   stok, dan banner dari dashboard admin agar data tersimpan permanen di Supabase.
-- ============================================================================

-- 1. Kebijakan untuk Tabel products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow admin operations on products'
  ) THEN
    CREATE POLICY "Allow admin operations on products"
    ON public.products
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 2. Kebijakan untuk Tabel product_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow admin operations on product_categories'
  ) THEN
    CREATE POLICY "Allow admin operations on product_categories"
    ON public.product_categories
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 3. Kebijakan untuk Tabel product_sizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_sizes' AND policyname = 'Allow admin operations on product_sizes'
  ) THEN
    CREATE POLICY "Allow admin operations on product_sizes"
    ON public.product_sizes
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 4. Kebijakan untuk Tabel product_flavors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_flavors' AND policyname = 'Allow admin operations on product_flavors'
  ) THEN
    CREATE POLICY "Allow admin operations on product_flavors"
    ON public.product_flavors
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 5. Kebijakan untuk Tabel inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Allow admin operations on inventory'
  ) THEN
    CREATE POLICY "Allow admin operations on inventory"
    ON public.inventory
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 6. Kebijakan untuk Tabel banners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Allow admin operations on banners'
  ) THEN
    CREATE POLICY "Allow admin operations on banners"
    ON public.banners
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 7. Kebijakan untuk Tabel store_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Allow admin operations on store_settings'
  ) THEN
    CREATE POLICY "Allow admin operations on store_settings"
    ON public.store_settings
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

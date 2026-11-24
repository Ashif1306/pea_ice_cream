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

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

-- ============================================================================
-- Migration: Add carousel settings and update banners with standalone cutouts
-- ============================================================================

-- 1. Add carousel settings to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS carousel_autoplay BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS carousel_interval_seconds INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS carousel_transition_ms INTEGER NOT NULL DEFAULT 800;

-- 2. Update existing banner rows so they use standalone cup cutouts instead of banner illustration cards
UPDATE public.banners
SET 
  product_cutout = CASE
    WHEN bg_theme = 'pink' THEN '/cutouts/pea-cup-strawberry.svg'
    WHEN bg_theme = 'yellow' THEN '/cutouts/pea-cup-vanilla.svg'
    WHEN bg_theme = 'blue' THEN '/cutouts/pea-cup-chocolate.svg'
    WHEN bg_theme = 'green' THEN '/cutouts/pea-cup-matcha.svg'
    ELSE '/cutouts/pea-cup-strawberry.svg'
  END,
  flavor_label = CASE
    WHEN bg_theme = 'pink' THEN 'Strawberry Bliss'
    WHEN bg_theme = 'yellow' THEN 'Vanilla Dream'
    WHEN bg_theme = 'blue' THEN 'Chocolate Fudge'
    WHEN bg_theme = 'green' THEN 'Matcha Kyoto'
    ELSE COALESCE(badge, 'Pea Classic')
  END
WHERE product_cutout IS NULL OR product_cutout LIKE '%/banners/%';

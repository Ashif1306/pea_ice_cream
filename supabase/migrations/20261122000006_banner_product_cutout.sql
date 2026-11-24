-- ============================================================================
-- Migration: Add product_cutout and flavor_label to banners table
-- Preserves existing data; safe to run multiple times
-- ============================================================================

ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS product_cutout TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS flavor_label TEXT;

-- Update existing default rows with cutouts if they exist
UPDATE public.banners
SET 
  product_cutout = CASE
    WHEN bg_theme = 'pink' THEN '/cutouts/pea-cup-strawberry.svg'
    WHEN bg_theme = 'yellow' THEN '/cutouts/pea-cup-vanilla.svg'
    WHEN bg_theme = 'blue' THEN '/cutouts/pea-cup-chocolate.svg'
    WHEN bg_theme = 'green' THEN '/cutouts/pea-cup-matcha.svg'
    ELSE image_desktop
  END,
  flavor_label = COALESCE(badge, 'Pea Flavor')
WHERE product_cutout IS NULL;

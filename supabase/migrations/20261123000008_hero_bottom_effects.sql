-- ============================================================================
-- Migration: Add bottom divider effect option to store_settings
-- ============================================================================

-- 1. Add carousel_bottom_effect column to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS carousel_bottom_effect TEXT NOT NULL DEFAULT 'melting-wave';

-- 2. Add comment for documentation
COMMENT ON COLUMN public.store_settings.carousel_bottom_effect IS 'Bottom divider effect for the homepage hero banner (e.g. melting-wave, ice-drips, cloud-puffs, layered-swirl, zigzag-waffle, smooth-curve, dripping-scallop, flat-clean)';

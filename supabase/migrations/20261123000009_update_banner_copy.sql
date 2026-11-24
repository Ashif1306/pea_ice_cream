-- ============================================================================
-- Migration: Update banner default copy to new brand messaging
-- ============================================================================

UPDATE public.banners
SET 
  title = 'Kelembutan yang menyatu dengan manis yang pas.',
  subtitle = 'Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.',
  badge = 'Pea Ice Cream',
  cta_text = 'Pesan Sekarang'
WHERE title LIKE '%Rasa klasik%' OR title IS NULL OR badge LIKE '%homemade%';

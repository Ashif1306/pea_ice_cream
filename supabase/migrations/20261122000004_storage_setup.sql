-- ============================================================================
-- 004: STORAGE BUCKET & STORAGE POLICIES
-- Bucket: pea-assets (public read, admin-only write)
-- ============================================================================

-- Create public bucket for pea-assets if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pea-assets',
    'pea-assets',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[];

-- ----------------------------------------------------------------------------
-- Storage Policies on storage.objects
-- ----------------------------------------------------------------------------
-- 1. Public can read/download images from pea-assets bucket
CREATE POLICY "Public can view pea-assets images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pea-assets');

-- 2. Only authorized admins can upload images
CREATE POLICY "Admins can upload to pea-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pea-assets' AND public.is_admin()
);

-- 3. Only authorized admins can update images
CREATE POLICY "Admins can update pea-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'pea-assets' AND public.is_admin()
);

-- 4. Only authorized admins can delete images
CREATE POLICY "Admins can delete from pea-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'pea-assets' AND public.is_admin()
);

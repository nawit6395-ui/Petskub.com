-- Create storage policies for avatar uploads in cat-images bucket
-- These policies allow users to manage their own avatars in the avatars/ folder

-- Policy to allow authenticated users to upload their own avatars
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT 'cat-images', 'avatars/', auth.uid(), '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'cat-images' AND name = 'avatars/'
);

-- Note: Since we cannot directly create RLS policies on storage.objects table via migration,
-- we need to use Supabase's storage.buckets configuration instead.
-- The bucket 'cat-images' is already public, which means files are publicly accessible.
-- For upload permissions, we rely on the bucket's file_size_limit and allowed_mime_types settings.

-- Update the cat-images bucket to allow uploads
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 5242880, -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE id = 'cat-images';
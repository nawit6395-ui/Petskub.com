-- Create storage bucket for cat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cat-images',
  'cat-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies for cat images bucket
CREATE POLICY "Anyone can view cat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cat-images');

CREATE POLICY "Authenticated users can upload cat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own cat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own cat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Modify cats table to support multiple images
ALTER TABLE cats 
ALTER COLUMN image_url TYPE text[] USING ARRAY[image_url]::text[];

ALTER TABLE cats 
ALTER COLUMN image_url SET DEFAULT ARRAY[]::text[];

-- Modify urgent_cases table to support multiple images
ALTER TABLE urgent_cases 
ALTER COLUMN image_url TYPE text[] USING ARRAY[image_url]::text[];

ALTER TABLE urgent_cases 
ALTER COLUMN image_url SET DEFAULT ARRAY[]::text[];

-- Modify reports table to support multiple images (add column if not exists)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT ARRAY[]::text[];

-- If photo_url exists, migrate data
UPDATE reports 
SET photo_urls = ARRAY[photo_url]::text[]
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Drop old photo_url column if it exists
ALTER TABLE reports DROP COLUMN IF EXISTS photo_url;
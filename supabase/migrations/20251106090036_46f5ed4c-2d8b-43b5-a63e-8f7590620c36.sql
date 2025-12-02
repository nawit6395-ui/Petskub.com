-- Fix avatar upload policy to properly check user ID in filename
-- Drop the old policy that uses split_part (doesn't work with UUID format)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Create new policy that uses starts_with to check if filename begins with user's UUID
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND starts_with(storage.filename(name), auth.uid()::text)
);

-- Also fix the UPDATE policy
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND starts_with(storage.filename(name), auth.uid()::text)
);

-- Fix DELETE policy as well
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND starts_with(storage.filename(name), auth.uid()::text)
);
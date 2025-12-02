-- Create policy to allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Allow everyone to view avatars (they're public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cat-images' 
  AND (storage.foldername(name))[1] = 'avatars'
);
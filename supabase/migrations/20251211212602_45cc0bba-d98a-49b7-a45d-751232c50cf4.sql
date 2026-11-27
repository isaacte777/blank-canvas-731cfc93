-- Drop existing permissive video storage policies
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;

-- Create secure video storage policies (admin and pastor only)
CREATE POLICY "Admins and pastors can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);

CREATE POLICY "Admins and pastors can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);

CREATE POLICY "Admins and pastors can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);
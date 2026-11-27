-- Fix storage policy: restrict image uploads to admins and pastors only
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Admins and pastors can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);

-- Also update the UPDATE policy if it exists
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;

CREATE POLICY "Admins and pastors can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);

-- Also update the DELETE policy if it exists
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Admins and pastors can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND 
  (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()))
);
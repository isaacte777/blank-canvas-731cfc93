-- Create storage buckets for media uploads

-- Videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Images bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Media bucket (general)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for videos bucket
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Staff can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can update videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

-- RLS policies for images bucket
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Staff can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

-- RLS policies for media bucket
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Staff can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);

CREATE POLICY "Staff can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  )
);
-- Create table for About section gallery images (Mondrian style)
CREATE TABLE public.about_gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  alt_text text,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible gallery images
CREATE POLICY "Anyone can view visible gallery images"
ON public.about_gallery
FOR SELECT
USING (is_visible = true);

-- Admins can view all gallery images
CREATE POLICY "Admins can view all gallery images"
ON public.about_gallery
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage gallery images
CREATE POLICY "Admins can manage gallery images"
ON public.about_gallery
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Pastors can view all gallery images
CREATE POLICY "Pastors can view all gallery images"
ON public.about_gallery
FOR SELECT
USING (is_pastor(auth.uid()));

-- Pastors can manage gallery images
CREATE POLICY "Pastors can manage gallery images"
ON public.about_gallery
FOR ALL
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

-- Insert default gallery images (positions based on Mondrian layout)
INSERT INTO public.about_gallery (image_url, position, alt_text) VALUES
('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800', 0, 'Adoración en la iglesia'),
('https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600', 1, 'Comunidad unida'),
('https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600', 2, 'Estudio bíblico'),
('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600', 3, 'Oración comunitaria'),
('https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=600', 4, 'Ministerio de jóvenes');
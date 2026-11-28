-- ============================================================
-- FIX: edición / eliminación / subida de contenido
--
-- Causa: el rol 'owner' no satisface las políticas RLS vigentes
-- (requieren 'admin' o 'pastor'), así que TODOS los INSERT/UPDATE/
-- DELETE de contenido y todas las subidas a storage fallan en
-- silencio. Además, el contenido guardado tenía is_visible = false,
-- por lo que ni siquiera se mostraba al público.
--
-- Idempotente: se puede ejecutar más de una vez sin efectos extra.
-- ============================================================

-- ------------------------------------------------------------
-- 1) has_role: 'owner' hereda los permisos de 'admin'.
--    Esto habilita de una sola vez TODAS las políticas existentes
--    de tipo has_role(auth.uid(), 'admin') (tablas de contenido
--    y buckets de storage).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (role = 'owner' AND _role = 'admin'))
  );
$$;

-- ------------------------------------------------------------
-- 2) Mostrar el contenido que estaba guardado pero oculto
--    (filas con is_visible = false o NULL).
-- ------------------------------------------------------------
UPDATE public.services
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

UPDATE public.announcements
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

UPDATE public.ministries
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

UPDATE public.events
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

UPDATE public.about_gallery
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

UPDATE public.page_content
  SET is_visible = true
  WHERE is_visible IS DISTINCT FROM true;

-- ------------------------------------------------------------
-- 3) Políticas de gestión para tablas de contenido
--    (owner / admin / pastor pueden crear, editar y eliminar).
--    DROP IF EXISTS + CREATE = reemplazo idempotente.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can manage page content" ON public.page_content;
CREATE POLICY "Staff can manage page content" ON public.page_content FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

DROP POLICY IF EXISTS "Staff can manage services" ON public.services;
CREATE POLICY "Staff can manage services" ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

DROP POLICY IF EXISTS "Staff can manage events" ON public.events;
CREATE POLICY "Staff can manage events" ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

DROP POLICY IF EXISTS "Staff can manage announcements" ON public.announcements;
CREATE POLICY "Staff can manage announcements" ON public.announcements FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

DROP POLICY IF EXISTS "Staff can manage ministries" ON public.ministries;
CREATE POLICY "Staff can manage ministries" ON public.ministries FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

DROP POLICY IF EXISTS "Staff can manage about gallery" ON public.about_gallery;
CREATE POLICY "Staff can manage about gallery" ON public.about_gallery FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'));

-- ------------------------------------------------------------
-- 4) Lectura pública de respaldo (por si alguna política previa
--    falta o quedó en un estado antiguo).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read page content" ON public.page_content;
CREATE POLICY "Public can read page content" ON public.page_content FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read services" ON public.services;
CREATE POLICY "Public can read services" ON public.services FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read events" ON public.events;
CREATE POLICY "Public can read events" ON public.events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read announcements" ON public.announcements;
CREATE POLICY "Public can read announcements" ON public.announcements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read ministries" ON public.ministries;
CREATE POLICY "Public can read ministries" ON public.ministries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can read about gallery" ON public.about_gallery;
CREATE POLICY "Public can read about gallery" ON public.about_gallery FOR SELECT
  USING (true);

-- ------------------------------------------------------------
-- 5) Storage: subir / reemplazar / borrar imágenes y videos.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can upload images" ON storage.objects;
CREATE POLICY "Staff can upload images" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('images', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Staff can update images" ON storage.objects;
CREATE POLICY "Staff can update images" ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('images', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Staff can delete images" ON storage.objects;
CREATE POLICY "Staff can delete images" ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('images', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Staff can upload videos" ON storage.objects;
CREATE POLICY "Staff can upload videos" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('videos', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Staff can update videos" ON storage.objects;
CREATE POLICY "Staff can update videos" ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('videos', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Staff can delete videos" ON storage.objects;
CREATE POLICY "Staff can delete videos" ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('videos', 'media')
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor'))
  );

DROP POLICY IF EXISTS "Public can read media files" ON storage.objects;
CREATE POLICY "Public can read media files" ON storage.objects FOR SELECT
  USING (bucket_id IN ('images', 'videos', 'media'));

-- ------------------------------------------------------------
-- 6) Asegurar que los buckets de subida existan.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('images', 'images', true),
  ('videos', 'videos', true),
  ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

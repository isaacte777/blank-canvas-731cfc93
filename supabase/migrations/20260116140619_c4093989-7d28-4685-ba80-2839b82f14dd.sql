-- =====================================================
-- CREAR ESTRUCTURA COMPLETA DE LA BASE DE DATOS CFA
-- =====================================================

-- 1. Crear enum para roles (incluyendo owner y pastor)
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'pastor', 'owner');

-- 2. Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- 4. Tabla para contenido de la página principal
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  video_file_url TEXT,
  media_type TEXT DEFAULT 'video' CHECK (media_type IN ('video', 'image', 'video_file')),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla para eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla para servicios
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  extended_content TEXT,
  day TEXT,
  time TEXT,
  icon TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabla para ministerios
CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  icon TEXT DEFAULT 'Users',
  schedule TEXT,
  leader TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Tabla para anuncios
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Tabla para galería de About
CREATE TABLE public.about_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Tabla para mensajes de contacto
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Tabla para donaciones
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Donaciones',
  subtitle TEXT,
  description TEXT,
  paypal_email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  zelle_email TEXT,
  zelle_phone TEXT,
  is_paypal_enabled BOOLEAN NOT NULL DEFAULT false,
  is_bank_enabled BOOLEAN NOT NULL DEFAULT false,
  is_zelle_enabled BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Tabla para visitas de página
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_name TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  session_id TEXT NOT NULL,
  referrer TEXT,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Tabla para sugerencias de admin
CREATE TABLE public.admin_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  suggestion_type TEXT NOT NULL DEFAULT 'note',
  target_date DATE,
  link_url TEXT,
  link_label TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_suggestions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para verificar roles
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
      AND role = _role
  )
$$;

-- Función para verificar si es pastor
CREATE OR REPLACE FUNCTION public.is_pastor(_user_id UUID)
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
      AND role = 'pastor'
  )
$$;

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Función alternativa para timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Función para asignar rol de admin
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo admins, pastores u owners pueden asignar roles de admin
  IF NOT has_role(auth.uid(), 'admin') AND NOT is_pastor(auth.uid()) AND NOT has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Solo administradores, pastores u owners pueden asignar roles de admin';
  END IF;
  
  -- Actualizar el rol a admin
  UPDATE public.user_roles 
  SET role = 'admin'
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ministries_updated_at
  BEFORE UPDATE ON public.ministries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_admin_suggestions_updated_at
  BEFORE UPDATE ON public.admin_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff can read all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'pastor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners and pastors can update profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners or pastors can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Page Content
CREATE POLICY "Anyone can view page content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Staff can manage page content" ON public.page_content FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Events
CREATE POLICY "Events public visible" ON public.events FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage events" ON public.events FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Services
CREATE POLICY "Anyone can view visible services" ON public.services FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Ministries
CREATE POLICY "Ministries public visible" ON public.ministries FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage ministries" ON public.ministries FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Announcements
CREATE POLICY "Announcements public visible" ON public.announcements FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- About Gallery
CREATE POLICY "About gallery public visible" ON public.about_gallery FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage about gallery" ON public.about_gallery FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Contact Messages
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can read contact messages" ON public.contact_messages FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can update contact messages" ON public.contact_messages FOR UPDATE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can delete contact messages" ON public.contact_messages FOR DELETE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Donations
CREATE POLICY "Donations config public visible" ON public.donations FOR SELECT USING (is_visible = true);
CREATE POLICY "Staff can manage donations" ON public.donations FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Page Visits
CREATE POLICY "Anyone can insert page visits" ON public.page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can read page visits" ON public.page_visits FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can delete page visits" ON public.page_visits FOR DELETE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- Admin Suggestions
CREATE POLICY "Staff can read suggestions" ON public.admin_suggestions FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can create suggestions" ON public.admin_suggestions FOR INSERT WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can update suggestions" ON public.admin_suggestions FOR UPDATE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));
CREATE POLICY "Staff can delete suggestions" ON public.admin_suggestions FOR DELETE USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role));

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_announcements_visible_order ON public.announcements (is_visible, display_order);
CREATE INDEX idx_ministries_visible_order ON public.ministries (is_visible, display_order);
CREATE INDEX idx_about_gallery_visible_position ON public.about_gallery (is_visible, position);
CREATE INDEX idx_events_visible_date ON public.events (is_visible, event_date);
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at);
CREATE INDEX idx_page_visits_session_id ON public.page_visits(session_id);
CREATE INDEX idx_page_visits_page_path ON public.page_visits(page_path);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 2147483648)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Images
CREATE POLICY "Public can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Staff can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));

-- Storage Policies for Videos
CREATE POLICY "Public can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Staff can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can update videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can delete videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));

-- Storage Policies for Media
CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Staff can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));
CREATE POLICY "Staff can delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'pastor'::app_role)));

-- =====================================================
-- DATOS PREDETERMINADOS
-- =====================================================

-- Contenido de página inicial
INSERT INTO public.page_content (section, title, subtitle, content, media_type) VALUES
  ('hero', 'Bienvenidos a CFA', 'Centro de Fe y Alabanza', '{"mainTitle":"bienvenidos","accentTitle":"A CFA","tagline1":"CREE.","tagline2":"PERTENECE.","tagline3":"TRANSFORMA.","saturdayLabel":"SÁBADO","saturdayTime":"19:00 HS","sundayLabel":"DOMINGO","sundayTime":"10:00 Y 19:00 HS","yearLabel":"★ 2026 ★","yearMessage":"el año del","accentMessage":"renuevo"}', 'video'),
  ('about', 'Nuestra', 'Historia', 'Somos una comunidad de fe comprometida con servir a Dios y a nuestra comunidad.', 'image'),
  ('contact', 'Contáctanos', 'Estamos aquí para ti', 'Visítanos o escríbenos para más información.', 'image'),
  ('footer', 'Footer', NULL, '{"facebookUrl":"","instagramUrl":"","youtubeUrl":"","emailUrl":"","liveStreamUrl":"","whatsappNumber":""}', 'image'),
  ('colors', 'Paleta de Colores', NULL, '{"primary":"#1a7f06","secondary":"#ca0c28","accent":"#ca0c28","background":"#0a0a0a"}', 'image');

-- Servicios iniciales
INSERT INTO public.services (title, description, day, time, icon, display_order) VALUES
  ('Servicio Dominical', 'Culto principal de adoración', 'Domingo', '10:00 AM', 'Church', 1),
  ('Escuela Dominical', 'Estudio bíblico para todas las edades', 'Domingo', '9:00 AM', 'BookOpen', 2),
  ('Reunión de Jóvenes', 'Encuentro para jóvenes', 'Viernes', '7:00 PM', 'Users', 3),
  ('Oración', 'Reunión de oración', 'Miércoles', '7:00 PM', 'Heart', 4);

-- Ministerios iniciales
INSERT INTO public.ministries (slug, title, description, content, icon, schedule, leader, display_order) VALUES
  ('ninos', 'Ministerio de Niños', 'Un lugar donde los más pequeños aprenden sobre el amor de Dios de manera divertida y segura.', 'Nuestro ministerio de niños está dedicado a sembrar las semillas de la fe en los corazones de los más pequeños.', 'Heart', 'Domingos 10:00 AM', 'Por asignar', 1),
  ('jovenes', 'Ministerio de Jóvenes', 'Conectando a la nueva generación con su propósito en Cristo.', 'El ministerio de jóvenes es un espacio vibrante donde los adolescentes y jóvenes adultos pueden crecer en su fe.', 'Users', 'Sábados 6:00 PM', 'Por asignar', 2),
  ('adultos', 'Ministerio de Adultos', 'Fortaleciendo familias y vidas a través de la Palabra de Dios.', 'Nuestro ministerio de adultos se enfoca en el crecimiento espiritual continuo.', 'BookOpen', 'Miércoles 7:00 PM', 'Por asignar', 3),
  ('musica', 'Ministerio de Música', 'Adorando a Dios con todo nuestro ser a través de la música.', 'El ministerio de música lidera a la congregación en la adoración a través de canciones que exaltan a Dios.', 'Music', 'Ensayos: Viernes 7:00 PM', 'Por asignar', 4);

-- Galería inicial
INSERT INTO public.about_gallery (image_url, position, alt_text) VALUES
  ('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800', 0, 'Adoración en la iglesia'),
  ('https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600', 1, 'Comunidad unida'),
  ('https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600', 2, 'Estudio bíblico'),
  ('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600', 3, 'Oración comunitaria'),
  ('https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=600', 4, 'Ministerio de jóvenes');

-- Donaciones inicial
INSERT INTO public.donations (title, subtitle, description) 
VALUES ('Donaciones', 'Tu generosidad hace posible nuestra misión', 'Apoya nuestra iglesia y sus ministerios');
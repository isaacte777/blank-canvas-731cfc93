-- =====================================================
-- RECREAR ESTRUCTURA COMPLETA DE LA BASE DE DATOS
-- =====================================================

-- 1. Crear enum para roles (incluyendo pastor)
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'pastor');

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
  event_time TIME,
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

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can view all profiles" ON public.profiles FOR SELECT USING (public.is_pastor(auth.uid()));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can manage roles" ON public.user_roles FOR ALL USING (public.is_pastor(auth.uid()));

-- Page Content
CREATE POLICY "Anyone can view page content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage page content" ON public.page_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can manage page content" ON public.page_content FOR ALL USING (public.is_pastor(auth.uid()));

-- Events
CREATE POLICY "Anyone can view visible events" ON public.events FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services
CREATE POLICY "Anyone can view visible services" ON public.services FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all services" ON public.services FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can manage services" ON public.services FOR ALL USING (public.is_pastor(auth.uid()));

-- Ministries
CREATE POLICY "Anyone can view visible ministries" ON public.ministries FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all ministries" ON public.ministries FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ministries" ON public.ministries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can view all ministries" ON public.ministries FOR SELECT USING (public.is_pastor(auth.uid()));
CREATE POLICY "Pastors can manage ministries" ON public.ministries FOR ALL USING (public.is_pastor(auth.uid()));

-- Announcements
CREATE POLICY "Anyone can view visible announcements" ON public.announcements FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all announcements" ON public.announcements FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can view all announcements" ON public.announcements FOR SELECT USING (public.is_pastor(auth.uid()));
CREATE POLICY "Pastors can manage announcements" ON public.announcements FOR ALL USING (public.is_pastor(auth.uid()));

-- About Gallery
CREATE POLICY "Anyone can view visible gallery images" ON public.about_gallery FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all gallery images" ON public.about_gallery FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage gallery images" ON public.about_gallery FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can view all gallery images" ON public.about_gallery FOR SELECT USING (public.is_pastor(auth.uid()));
CREATE POLICY "Pastors can manage gallery images" ON public.about_gallery FOR ALL USING (public.is_pastor(auth.uid()));

-- Contact Messages
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all messages" ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can view all messages" ON public.contact_messages FOR SELECT USING (public.is_pastor(auth.uid()));
CREATE POLICY "Admins can update messages" ON public.contact_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can update messages" ON public.contact_messages FOR UPDATE USING (public.is_pastor(auth.uid()));
CREATE POLICY "Admins can delete messages" ON public.contact_messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Pastors can delete messages" ON public.contact_messages FOR DELETE USING (public.is_pastor(auth.uid()));

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 2147483648)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Images
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
CREATE POLICY "Admins and pastors can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));
CREATE POLICY "Admins and pastors can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));
CREATE POLICY "Admins and pastors can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));

-- Storage Policies for Videos
CREATE POLICY "Videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Admins and pastors can upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));
CREATE POLICY "Admins and pastors can update videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));
CREATE POLICY "Admins and pastors can delete videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid())));

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
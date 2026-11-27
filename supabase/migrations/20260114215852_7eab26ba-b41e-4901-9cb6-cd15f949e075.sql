-- Step 2: Now that 'pastor' enum is committed, create tables and policies

-- 1) Rename contact_messages.name -> full_name if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contact_messages' AND column_name='name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contact_messages' AND column_name='full_name'
  ) THEN
    ALTER TABLE public.contact_messages RENAME COLUMN name TO full_name;
  END IF;
END $$;

-- RLS for contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Staff can read messages
DROP POLICY IF EXISTS "Staff can read contact messages" ON public.contact_messages;
CREATE POLICY "Staff can read contact messages"
  ON public.contact_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- Staff can update messages
DROP POLICY IF EXISTS "Staff can update contact messages" ON public.contact_messages;
CREATE POLICY "Staff can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- Staff can delete messages
DROP POLICY IF EXISTS "Staff can delete contact messages" ON public.contact_messages;
CREATE POLICY "Staff can delete contact messages"
  ON public.contact_messages FOR DELETE
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 2) Extend services table with missing columns
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS day TEXT,
  ADD COLUMN IF NOT EXISTS time TEXT,
  ADD COLUMN IF NOT EXISTS extended_content TEXT;

-- Staff can manage services
DROP POLICY IF EXISTS "Staff can manage services" ON public.services;
CREATE POLICY "Staff can manage services"
  ON public.services FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 3) Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements public visible" ON public.announcements;
CREATE POLICY "Announcements public visible"
  ON public.announcements FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Staff can manage announcements" ON public.announcements;
CREATE POLICY "Staff can manage announcements"
  ON public.announcements FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 4) Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  image_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events public visible" ON public.events;
CREATE POLICY "Events public visible"
  ON public.events FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Staff can manage events" ON public.events;
CREATE POLICY "Staff can manage events"
  ON public.events FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 5) About gallery table
CREATE TABLE IF NOT EXISTS public.about_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.about_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "About gallery public visible" ON public.about_gallery;
CREATE POLICY "About gallery public visible"
  ON public.about_gallery FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Staff can manage about gallery" ON public.about_gallery;
CREATE POLICY "Staff can manage about gallery"
  ON public.about_gallery FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 6) Ministries table
CREATE TABLE IF NOT EXISTS public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  icon TEXT,
  schedule TEXT,
  leader TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ministries_slug_unique'
  ) THEN
    ALTER TABLE public.ministries ADD CONSTRAINT ministries_slug_unique UNIQUE (slug);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Ministries public visible" ON public.ministries;
CREATE POLICY "Ministries public visible"
  ON public.ministries FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Staff can manage ministries" ON public.ministries;
CREATE POLICY "Staff can manage ministries"
  ON public.ministries FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 7) Page visits table
CREATE TABLE IF NOT EXISTS public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_name TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  session_id TEXT NOT NULL,
  referrer TEXT,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page visits" ON public.page_visits;
CREATE POLICY "Anyone can insert page visits"
  ON public.page_visits FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read page visits" ON public.page_visits;
CREATE POLICY "Staff can read page visits"
  ON public.page_visits FOR SELECT
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

DROP POLICY IF EXISTS "Staff can delete page visits" ON public.page_visits;
CREATE POLICY "Staff can delete page visits"
  ON public.page_visits FOR DELETE
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- 8) Allow pastors to manage roles
DROP POLICY IF EXISTS "Solo owners pueden gestionar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners or pastors can manage roles" ON public.user_roles;
CREATE POLICY "Owners or pastors can manage roles"
  ON public.user_roles FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- Staff can manage page_content
DROP POLICY IF EXISTS "Staff can manage page content" ON public.page_content;
CREATE POLICY "Staff can manage page content"
  ON public.page_content FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_visible_order ON public.announcements (is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_ministries_visible_order ON public.ministries (is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_about_gallery_visible_position ON public.about_gallery (is_visible, position);
CREATE INDEX IF NOT EXISTS idx_events_visible_date ON public.events (is_visible, event_date);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits (created_at);
-- Create donations config table
CREATE TABLE IF NOT EXISTS public.donations (
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

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Public can view donations config
CREATE POLICY "Donations config public visible"
  ON public.donations FOR SELECT
  USING (is_visible = true);

-- Staff can manage donations config
CREATE POLICY "Staff can manage donations"
  ON public.donations FOR ALL
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pastor'::app_role)
  );
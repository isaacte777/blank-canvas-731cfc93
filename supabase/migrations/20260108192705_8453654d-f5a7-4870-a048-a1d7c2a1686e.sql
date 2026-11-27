-- Create table for donation information
CREATE TABLE public.donation_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL DEFAULT 'Banco Nacional',
  account_holder TEXT NOT NULL DEFAULT 'Centro Familia de Adoración',
  account_number TEXT NOT NULL DEFAULT '0000-0000-0000',
  account_type TEXT NOT NULL DEFAULT 'Cuenta de Ahorros',
  routing_number TEXT,
  swift_code TEXT,
  additional_info TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_info ENABLE ROW LEVEL SECURITY;

-- Everyone can view donation info
CREATE POLICY "Anyone can view donation info"
ON public.donation_info
FOR SELECT
USING (true);

-- Only admins can update donation info
CREATE POLICY "Admins can update donation info"
ON public.donation_info
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()));

-- Only admins can insert donation info
CREATE POLICY "Admins can insert donation info"
ON public.donation_info
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_pastor(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_donation_info_updated_at
BEFORE UPDATE ON public.donation_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default row
INSERT INTO public.donation_info (bank_name, account_holder, account_number, account_type, additional_info)
VALUES ('Banco Nacional', 'Centro Familia de Adoración', '0000-0000-0000', 'Cuenta de Ahorros', 'Gracias por tu generosidad');
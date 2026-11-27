-- Create donations configuration table
CREATE TABLE public.donations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Donaciones',
    subtitle TEXT DEFAULT 'Tu generosidad hace posible nuestra misión',
    description TEXT DEFAULT 'Apoya nuestra iglesia y sus ministerios',
    paypal_email TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    zelle_email TEXT,
    zelle_phone TEXT,
    is_paypal_enabled BOOLEAN DEFAULT false,
    is_bank_enabled BOOLEAN DEFAULT false,
    is_zelle_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view donations config" 
ON public.donations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage donations" 
ON public.donations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can manage donations" 
ON public.donations 
FOR ALL 
USING (is_pastor(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default row
INSERT INTO public.donations (title, subtitle, description) 
VALUES ('Donaciones', 'Tu generosidad hace posible nuestra misión', 'Apoya nuestra iglesia y sus ministerios');
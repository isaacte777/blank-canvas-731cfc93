-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create admin_suggestions table for admin notes, tasks, and links
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

-- Enable Row Level Security
ALTER TABLE public.admin_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can read suggestions"
ON public.admin_suggestions
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

CREATE POLICY "Staff can create suggestions"
ON public.admin_suggestions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

CREATE POLICY "Staff can update suggestions"
ON public.admin_suggestions
FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

CREATE POLICY "Staff can delete suggestions"
ON public.admin_suggestions
FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_suggestions_updated_at
BEFORE UPDATE ON public.admin_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
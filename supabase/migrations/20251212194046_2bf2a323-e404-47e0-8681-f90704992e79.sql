-- Create announcements table for image-based announcements carousel
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public can view visible announcements
CREATE POLICY "Anyone can view visible announcements" 
ON public.announcements 
FOR SELECT 
USING (is_visible = true);

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements" 
ON public.announcements 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements" 
ON public.announcements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Pastors can view all announcements
CREATE POLICY "Pastors can view all announcements" 
ON public.announcements 
FOR SELECT 
USING (is_pastor(auth.uid()));

-- Pastors can manage announcements
CREATE POLICY "Pastors can manage announcements" 
ON public.announcements 
FOR ALL 
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
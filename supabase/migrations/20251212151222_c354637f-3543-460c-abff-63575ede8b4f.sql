-- Create ministries table for editable content
CREATE TABLE public.ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Enable RLS
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view visible ministries" 
ON public.ministries FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Admins can view all ministries" 
ON public.ministries FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage ministries" 
ON public.ministries FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can view all ministries" 
ON public.ministries FOR SELECT 
USING (is_pastor(auth.uid()));

CREATE POLICY "Pastors can manage ministries" 
ON public.ministries FOR ALL 
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

-- Insert default ministries
INSERT INTO public.ministries (slug, title, description, content, icon, schedule, leader, display_order) VALUES
('ninos', 'Ministerio de Niños', 'Un lugar donde los más pequeños aprenden sobre el amor de Dios de manera divertida y segura.', 'Nuestro ministerio de niños está dedicado a sembrar las semillas de la fe en los corazones de los más pequeños. A través de actividades interactivas, música, juegos y enseñanzas bíblicas adaptadas a su edad, los niños descubren el amor de Dios de una manera que pueden entender y aplicar en sus vidas.', 'Heart', 'Domingos 10:00 AM', 'Por asignar', 1),
('jovenes', 'Ministerio de Jóvenes', 'Conectando a la nueva generación con su propósito en Cristo.', 'El ministerio de jóvenes es un espacio vibrante donde los adolescentes y jóvenes adultos pueden crecer en su fe, formar amistades significativas y descubrir su llamado. Ofrecemos estudios bíblicos relevantes, actividades recreativas, retiros y oportunidades de servicio.', 'Users', 'Sábados 6:00 PM', 'Por asignar', 2),
('adultos', 'Ministerio de Adultos', 'Fortaleciendo familias y vidas a través de la Palabra de Dios.', 'Nuestro ministerio de adultos se enfoca en el crecimiento espiritual continuo, el fortalecimiento de matrimonios y familias, y el desarrollo de líderes. Ofrecemos grupos de estudio bíblico, consejería pastoral, y actividades que fomentan la comunidad.', 'BookOpen', 'Miércoles 7:00 PM', 'Por asignar', 3),
('musica', 'Ministerio de Música', 'Adorando a Dios con todo nuestro ser a través de la música.', 'El ministerio de música lidera a la congregación en la adoración a través de canciones que exaltan a Dios. Nuestro equipo está compuesto por músicos y cantantes dedicados que usan sus talentos para crear una atmósfera de adoración genuina.', 'Music', 'Ensayos: Viernes 7:00 PM', 'Por asignar', 4);

-- Add trigger for updated_at
CREATE TRIGGER update_ministries_updated_at
BEFORE UPDATE ON public.ministries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
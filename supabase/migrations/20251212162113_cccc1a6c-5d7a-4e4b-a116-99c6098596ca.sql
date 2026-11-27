-- Create table for contact messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a message (public form)
CREATE POLICY "Anyone can submit contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Only admins and pastors can view messages
CREATE POLICY "Admins can view all messages" 
ON public.contact_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can view all messages" 
ON public.contact_messages 
FOR SELECT 
USING (is_pastor(auth.uid()));

-- Only admins and pastors can update messages (mark as read)
CREATE POLICY "Admins can update messages" 
ON public.contact_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can update messages" 
ON public.contact_messages 
FOR UPDATE 
USING (is_pastor(auth.uid()));

-- Only admins and pastors can delete messages
CREATE POLICY "Admins can delete messages" 
ON public.contact_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can delete messages" 
ON public.contact_messages 
FOR DELETE 
USING (is_pastor(auth.uid()));
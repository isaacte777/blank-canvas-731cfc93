-- Create table for scheduled content versions
CREATE TABLE public.scheduled_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Store all content as JSON snapshots
  page_content_snapshot JSONB,
  services_snapshot JSONB,
  events_snapshot JSONB,
  announcements_snapshot JSONB,
  ministries_snapshot JSONB,
  gallery_snapshot JSONB
);

-- Enable RLS
ALTER TABLE public.scheduled_content ENABLE ROW LEVEL SECURITY;

-- Staff can manage scheduled content
CREATE POLICY "Staff can manage scheduled content"
ON public.scheduled_content
FOR ALL
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

-- Staff can view scheduled content
CREATE POLICY "Staff can view scheduled content"
ON public.scheduled_content
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_content_updated_at
BEFORE UPDATE ON public.scheduled_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_content;
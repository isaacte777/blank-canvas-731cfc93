-- Create page_visits table to track real visits
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_name TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  session_id TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX idx_page_visits_page_path ON public.page_visits(page_path);
CREATE INDEX idx_page_visits_session_id ON public.page_visits(session_id);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (anonymous tracking)
CREATE POLICY "Anyone can insert page visits"
ON public.page_visits
FOR INSERT
WITH CHECK (true);

-- Only admins and pastors can view visits
CREATE POLICY "Admins can view page visits"
ON public.page_visits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can view page visits"
ON public.page_visits
FOR SELECT
USING (is_pastor(auth.uid()));

-- Admins can delete old visits for cleanup
CREATE POLICY "Admins can delete page visits"
ON public.page_visits
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pastors can delete page visits"
ON public.page_visits
FOR DELETE
USING (is_pastor(auth.uid()));
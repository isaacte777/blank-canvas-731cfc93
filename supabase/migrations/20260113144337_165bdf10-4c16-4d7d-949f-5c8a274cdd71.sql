-- Add time_spent column to track dwell time in seconds
ALTER TABLE public.page_visits 
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;

-- Add index for better performance on section queries with time
CREATE INDEX IF NOT EXISTS idx_page_visits_time_spent ON public.page_visits(time_spent) WHERE time_spent > 0;
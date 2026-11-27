-- Add target_time column to admin_suggestions for specific deadline times
ALTER TABLE public.admin_suggestions 
ADD COLUMN IF NOT EXISTS target_time TIME DEFAULT NULL;
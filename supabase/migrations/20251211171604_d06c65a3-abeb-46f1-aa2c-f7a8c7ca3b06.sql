-- Add video_url and media_type columns to page_content for hero section
ALTER TABLE public.page_content 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video' CHECK (media_type IN ('video', 'image'));
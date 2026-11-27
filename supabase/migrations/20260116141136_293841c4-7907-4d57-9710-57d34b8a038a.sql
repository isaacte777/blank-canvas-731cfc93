-- Add mobile media columns to page_content
ALTER TABLE public.page_content 
ADD COLUMN IF NOT EXISTS mobile_video_url TEXT,
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
ADD COLUMN IF NOT EXISTS mobile_video_file_url TEXT,
ADD COLUMN IF NOT EXISTS mobile_media_type TEXT DEFAULT 'video' CHECK (mobile_media_type IN ('video', 'image', 'video_file'));
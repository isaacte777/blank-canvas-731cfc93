-- Fix PUBLIC_DATA_EXPOSURE: Remove public access to scheduled_content
-- Only staff should be able to view scheduled content drafts

DROP POLICY IF EXISTS "Anyone can view scheduled content for realtime" ON public.scheduled_content;
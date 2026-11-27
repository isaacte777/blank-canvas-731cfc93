-- Allow everyone to read scheduled_content for realtime updates
-- This is needed so visitors can receive realtime notifications when content is published
CREATE POLICY "Anyone can view scheduled content for realtime" 
ON public.scheduled_content 
FOR SELECT 
USING (true);
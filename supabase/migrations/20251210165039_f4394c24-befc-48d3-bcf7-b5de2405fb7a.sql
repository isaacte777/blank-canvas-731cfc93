-- Fix: page_content policy should only show visible content to public
DROP POLICY IF EXISTS "Anyone can view page content" ON public.page_content;

CREATE POLICY "Anyone can view visible page content" 
ON public.page_content 
FOR SELECT 
USING (is_visible = true);

-- Ensure admins can still see all content (including hidden)
DROP POLICY IF EXISTS "Admins can view all page content" ON public.page_content;

CREATE POLICY "Admins can view all page content" 
ON public.page_content 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
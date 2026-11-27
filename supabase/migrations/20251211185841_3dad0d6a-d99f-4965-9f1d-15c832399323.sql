-- Add policies for pastors to manage page content
CREATE POLICY "Pastors can manage page content" 
ON public.page_content 
FOR ALL 
TO authenticated
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

CREATE POLICY "Pastors can view all page content" 
ON public.page_content 
FOR SELECT 
TO authenticated
USING (is_pastor(auth.uid()));

-- Also add pastor policies for services table
CREATE POLICY "Pastors can manage services" 
ON public.services 
FOR ALL 
TO authenticated
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

CREATE POLICY "Pastors can view all services" 
ON public.services 
FOR SELECT 
TO authenticated
USING (is_pastor(auth.uid()));

-- Also add pastor policies for events table
CREATE POLICY "Pastors can manage events" 
ON public.events 
FOR ALL 
TO authenticated
USING (is_pastor(auth.uid()))
WITH CHECK (is_pastor(auth.uid()));

CREATE POLICY "Pastors can view all events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (is_pastor(auth.uid()));
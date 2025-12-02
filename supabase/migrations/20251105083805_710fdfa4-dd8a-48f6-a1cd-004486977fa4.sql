-- Update existing RLS policies to allow public (anonymous + authenticated) access

-- For cats table
DROP POLICY IF EXISTS "Public can view cats" ON public.cats;
CREATE POLICY "Public can view cats"
ON public.cats
FOR SELECT
TO anon, authenticated
USING (true);

-- For reports table  
DROP POLICY IF EXISTS "Public can view reports" ON public.reports;
CREATE POLICY "Public can view reports"
ON public.reports
FOR SELECT
TO anon, authenticated
USING (true);

-- For urgent_cases table
DROP POLICY IF EXISTS "Public can view urgent cases" ON public.urgent_cases;
CREATE POLICY "Public can view urgent cases"
ON public.urgent_cases
FOR SELECT
TO anon, authenticated
USING (true);

-- For knowledge_articles table
DROP POLICY IF EXISTS "Public can view published articles" ON public.knowledge_articles;
CREATE POLICY "Public can view published articles"
ON public.knowledge_articles
FOR SELECT
TO anon, authenticated
USING (published = true OR auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));
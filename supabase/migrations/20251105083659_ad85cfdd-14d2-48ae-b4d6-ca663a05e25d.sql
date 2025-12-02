-- Fix RLS policies to allow public (anonymous) access to view cats
DROP POLICY IF EXISTS "Anyone can view available cats" ON public.cats;
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view urgent cases" ON public.urgent_cases;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.knowledge_articles;

-- Create new policies that work for both authenticated AND anonymous users
CREATE POLICY "Public can view cats"
ON public.cats
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can view reports"
ON public.reports
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can view urgent cases"
ON public.urgent_cases
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can view published articles"
ON public.knowledge_articles
FOR SELECT
TO public
USING (published = true OR auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));
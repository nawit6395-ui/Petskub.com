-- Add keywords column for SEO to knowledge_articles table
ALTER TABLE knowledge_articles
ADD COLUMN keywords text[] DEFAULT ARRAY[]::text[];
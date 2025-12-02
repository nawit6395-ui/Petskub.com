-- Add SEO-related columns to knowledge_articles table
ALTER TABLE knowledge_articles 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN knowledge_articles.meta_title IS 'SEO meta title (50-60 characters recommended)';
COMMENT ON COLUMN knowledge_articles.meta_description IS 'SEO meta description (150-160 characters recommended)';
-- Add image_alt column to knowledge_articles table for SEO optimization
ALTER TABLE knowledge_articles 
ADD COLUMN image_alt TEXT;

COMMENT ON COLUMN knowledge_articles.image_alt IS 'Alt text for article image - important for SEO and accessibility';
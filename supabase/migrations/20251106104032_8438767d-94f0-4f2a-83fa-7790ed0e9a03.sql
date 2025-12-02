-- Add Open Graph (OG) tags columns for social media preview optimization
ALTER TABLE knowledge_articles 
ADD COLUMN og_title TEXT,
ADD COLUMN og_description TEXT,
ADD COLUMN og_image TEXT;

COMMENT ON COLUMN knowledge_articles.og_title IS 'Open Graph title for social media sharing (Facebook, Twitter, LINE, etc.)';
COMMENT ON COLUMN knowledge_articles.og_description IS 'Open Graph description for social media preview';
COMMENT ON COLUMN knowledge_articles.og_image IS 'Open Graph image URL for social media cards';
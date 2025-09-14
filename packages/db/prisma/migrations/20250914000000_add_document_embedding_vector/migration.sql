-- Enable pgvector if needed
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the column if it doesn't exist (matches what’s already in your DB)
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "embedding" vector;

-- Optional but useful: index for similarity search (comment out if not needed)
-- CREATE INDEX IF NOT EXISTS "Document_embedding_ivfflat_idx"
--   ON "Document" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);



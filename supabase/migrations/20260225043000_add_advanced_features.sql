-- Migration to add advanced trading features
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_type TEXT,
ADD COLUMN IF NOT EXISTS probability TEXT;

-- Index for tags searching
CREATE INDEX IF NOT EXISTS idx_trades_tags ON public.trades USING GIN (tags);

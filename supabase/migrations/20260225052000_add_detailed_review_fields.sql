-- Add detailed technical rules and emotional state columns to trades table
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS rule_in_plan TEXT, -- 'yes', 'no', 'n/a'
ADD COLUMN IF NOT EXISTS rule_bos TEXT,
ADD COLUMN IF NOT EXISTS rule_liquidity TEXT,
ADD COLUMN IF NOT EXISTS rule_trend TEXT,
ADD COLUMN IF NOT EXISTS rule_news TEXT,
ADD COLUMN IF NOT EXISTS rule_rr TEXT,
ADD COLUMN IF NOT EXISTS rule_emotions TEXT,
ADD COLUMN IF NOT EXISTS rule_lot_size TEXT,
ADD COLUMN IF NOT EXISTS emotions TEXT[], -- Array of feelings like ['Confident', 'Anxious']
ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Update the status type if needed (already exists as status in previous migration)

-- Add new columns for manual trading journal
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS risk_reward_ratio numeric,
ADD COLUMN IF NOT EXISTS exit_reason text,
ADD COLUMN IF NOT EXISTS pips numeric,
ADD COLUMN IF NOT EXISTS risk_amount numeric,
ADD COLUMN IF NOT EXISTS reward_amount numeric;

-- Add comments for clarity
COMMENT ON COLUMN public.trades.exit_reason IS 'How the trade was closed: sl_hit, tp_hit, manual_close, breakeven';
COMMENT ON COLUMN public.trades.risk_reward_ratio IS 'The R:R ratio for this trade';
COMMENT ON COLUMN public.trades.pips IS 'Number of pips gained or lost';
COMMENT ON COLUMN public.trades.risk_amount IS 'Amount risked on this trade';
COMMENT ON COLUMN public.trades.reward_amount IS 'Amount gained/lost on this trade';
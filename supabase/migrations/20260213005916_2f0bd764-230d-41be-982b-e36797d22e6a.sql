
-- Create webhook_api_keys table
CREATE TABLE public.webhook_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key_hash TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own keys"
ON public.webhook_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keys"
ON public.webhook_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keys"
ON public.webhook_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keys"
ON public.webhook_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Add mt5_ticket column to trades table for duplicate detection
ALTER TABLE public.trades ADD COLUMN mt5_ticket TEXT;

-- Index for faster duplicate checks
CREATE INDEX idx_trades_mt5_ticket ON public.trades (mt5_ticket) WHERE mt5_ticket IS NOT NULL;

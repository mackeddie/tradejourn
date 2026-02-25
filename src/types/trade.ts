export type AssetClass = 'forex' | 'crypto' | 'commodities' | 'stocks';
export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'win' | 'loss' | 'breakeven';
export type ExitReason = 'sl_hit' | 'tp_hit' | 'manual_close' | 'breakeven';

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  asset_class: AssetClass;
  direction: TradeDirection;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  lot_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  profit_loss: number | null;
  status: TradeStatus | null;
  exit_reason: ExitReason | null;
  risk_reward_ratio: number | null;
  pips: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  strategy: string | null;
  reasoning: string | null;
  emotions: string | null;
  lessons: string | null;
  tags: string[] | null;
  screenshot_url: string | null;
  needs_review: boolean | null;
  setup_type: string | null;
  probability: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeFormData {
  symbol: string;
  asset_class: AssetClass;
  direction: TradeDirection;
  entry_date: Date;
  exit_date?: Date;
  entry_price: number;
  exit_price?: number;
  lot_size: number;
  stop_loss?: number;
  take_profit?: number;
  status: TradeStatus;
  exit_reason: ExitReason;
  risk_reward_ratio?: number;
  pips?: number;
  risk_amount?: number;
  reward_amount?: number;
  strategy?: string;
  reasoning?: string;
  emotions?: string;
  lessons?: string;
  tags?: string[];
  screenshot_url?: string;
  needs_review?: boolean;
  setup_type?: string;
  probability?: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

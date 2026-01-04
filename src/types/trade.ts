export type AssetClass = 'forex' | 'crypto' | 'commodities' | 'stocks';
export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'open' | 'win' | 'loss' | 'breakeven';

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
  strategy: string | null;
  reasoning: string | null;
  emotions: string | null;
  lessons: string | null;
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
  strategy?: string;
  reasoning?: string;
  emotions?: string;
  lessons?: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

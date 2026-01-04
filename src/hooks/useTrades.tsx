import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade, TradeFormData } from '@/types/trade';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTrades();
    } else {
      setTrades([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTrades = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching trades',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setTrades((data || []) as Trade[]);
    }
    setLoading(false);
  };

  const calculateProfitLoss = (
    direction: string,
    entryPrice: number,
    exitPrice: number | undefined,
    lotSize: number
  ): number | null => {
    if (!exitPrice) return null;
    const pips = direction === 'buy' 
      ? (exitPrice - entryPrice) 
      : (entryPrice - exitPrice);
    return pips * lotSize * 100000; // Standard forex lot calculation
  };

  const determineStatus = (profitLoss: number | null): string | null => {
    if (profitLoss === null) return 'open';
    if (profitLoss > 0) return 'win';
    if (profitLoss < 0) return 'loss';
    return 'breakeven';
  };

  const addTrade = async (formData: TradeFormData) => {
    if (!user) return { error: new Error('Not authenticated') };

    const profitLoss = calculateProfitLoss(
      formData.direction,
      formData.entry_price,
      formData.exit_price,
      formData.lot_size
    );

    const status = determineStatus(profitLoss);

    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      symbol: formData.symbol.toUpperCase(),
      asset_class: formData.asset_class,
      direction: formData.direction,
      entry_date: formData.entry_date.toISOString(),
      exit_date: formData.exit_date?.toISOString() || null,
      entry_price: formData.entry_price,
      exit_price: formData.exit_price || null,
      lot_size: formData.lot_size,
      stop_loss: formData.stop_loss || null,
      take_profit: formData.take_profit || null,
      profit_loss: profitLoss,
      status,
      strategy: formData.strategy || null,
      reasoning: formData.reasoning || null,
      emotions: formData.emotions || null,
      lessons: formData.lessons || null,
    });

    if (!error) {
      await fetchTrades();
      toast({
        title: 'Trade added',
        description: `${formData.symbol} trade logged successfully.`,
      });
    }

    return { error };
  };

  const updateTrade = async (id: string, formData: Partial<TradeFormData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const existingTrade = trades.find(t => t.id === id);
    if (!existingTrade) return { error: new Error('Trade not found') };

    const entryPrice = formData.entry_price ?? existingTrade.entry_price;
    const exitPrice = formData.exit_price ?? existingTrade.exit_price;
    const direction = formData.direction ?? existingTrade.direction;
    const lotSize = formData.lot_size ?? existingTrade.lot_size;

    const profitLoss = calculateProfitLoss(direction, entryPrice, exitPrice ?? undefined, lotSize);
    const status = determineStatus(profitLoss);

    const updateData: Record<string, unknown> = { ...formData, profit_loss: profitLoss, status };
    
    if (formData.entry_date) {
      updateData.entry_date = formData.entry_date.toISOString();
    }
    if (formData.exit_date) {
      updateData.exit_date = formData.exit_date.toISOString();
    }

    const { error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await fetchTrades();
      toast({
        title: 'Trade updated',
        description: 'Your trade has been updated successfully.',
      });
    }

    return { error };
  };

  const deleteTrade = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setTrades(trades.filter(t => t.id !== id));
      toast({
        title: 'Trade deleted',
        description: 'Your trade has been removed.',
      });
    }

    return { error };
  };

  const importTrades = async (tradesData: TradeFormData[]) => {
    if (!user) return { error: new Error('Not authenticated'), imported: 0 };

    let imported = 0;
    const errors: string[] = [];

    for (const trade of tradesData) {
      const result = await addTrade(trade);
      if (result.error) {
        errors.push(result.error.message);
      } else {
        imported++;
      }
    }

    if (imported > 0) {
      toast({
        title: 'Import complete',
        description: `Successfully imported ${imported} trades.`,
      });
    }

    return { 
      error: errors.length > 0 ? new Error(errors.join(', ')) : null, 
      imported 
    };
  };

  return {
    trades,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    importTrades,
    refetch: fetchTrades,
  };
}

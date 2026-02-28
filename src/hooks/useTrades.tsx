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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`trades-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newTrade = payload.new as any;
          const mappedTrade = {
            ...newTrade,
            emotions_array: newTrade.emotions || []
          } as unknown as Trade;

          setTrades((prev) => {
            const exists = prev.some((t) => t.id === mappedTrade.id);
            if (exists) return prev;
            return [mappedTrade, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const mappedTrades = (data || []).map(t => ({
        ...t,
        emotions_array: (t as any).emotions || []
      }));
      setTrades(mappedTrades as unknown as Trade[]);
    }
    setLoading(false);
  };

  const addTrade = async (formData: TradeFormData) => {
    if (!user) return { error: new Error('Not authenticated') };

    const tradeData: any = {
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
      profit_loss: formData.reward_amount
        ? (formData.status === 'loss' ? -Math.abs(formData.reward_amount) : formData.reward_amount)
        : null,
      status: formData.status,
      exit_reason: formData.exit_reason,
      risk_reward_ratio: formData.risk_reward_ratio || null,
      pips: formData.pips || null,
      risk_amount: formData.risk_amount || null,
      reward_amount: formData.reward_amount || null,
      strategy: formData.strategy || null,
      reasoning: formData.reasoning || null,
      lessons: formData.lessons || null,
      tags: formData.tags || [],
      screenshot_url: formData.screenshot_url || null,
      needs_review: formData.needs_review || false,
      setup_type: formData.setup_type || null,
      probability: formData.probability || null,
      rule_in_plan: formData.rule_in_plan || null,
      rule_bos: formData.rule_bos || null,
      rule_liquidity: formData.rule_liquidity || null,
      rule_trend: formData.rule_trend || null,
      rule_news: formData.rule_news || null,
      rule_rr: formData.rule_rr || null,
      rule_emotions: formData.rule_emotions || null,
      rule_lot_size: formData.rule_lot_size || null,
      emotions: formData.emotions_array || null,
      lessons_learned: formData.lessons_learned || null,
    };

    const { error } = await supabase.from('trades').insert(tradeData);

    if (!error) {
      await fetchTrades();
      toast({
        title: 'Trade logged',
        description: `${formData.symbol} trade added successfully.`,
      });
    }

    return { error };
  };

  const updateTrade = async (id: string, formData: Partial<TradeFormData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const updateData: any = { ...formData };

    if (formData.entry_date) {
      updateData.entry_date = formData.entry_date.toISOString();
    }
    if (formData.exit_date) {
      updateData.exit_date = formData.exit_date.toISOString();
    }
    if (formData.reward_amount !== undefined && formData.status) {
      updateData.profit_loss = formData.status === 'loss'
        ? -Math.abs(formData.reward_amount)
        : formData.reward_amount;
    }

    // Map emotions_array to emotions column if present
    if (formData.emotions_array) {
      updateData.emotions = formData.emotions_array;
      delete updateData.emotions_array;
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

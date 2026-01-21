import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/trade';

interface PriceData {
  symbol: string;
  price: number | null;
  change24h: number | null;
  error?: string;
}

interface PriceState {
  [symbol: string]: PriceData;
}

interface UseLivePricesOptions {
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useLivePrices(
  trades: Trade[],
  options: UseLivePricesOptions = {}
) {
  const { refreshInterval = 30000, enabled = true } = options;
  const [prices, setPrices] = useState<PriceState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get open trades (trades without exit price)
  const openTrades = trades.filter(trade => !trade.exit_price && trade.status === 'open');

  const fetchPrices = useCallback(async () => {
    if (openTrades.length === 0) {
      setPrices({});
      return;
    }

    const symbols = [...new Set(openTrades.map(t => t.symbol))];
    const assetClasses: Record<string, string> = {};
    
    openTrades.forEach(trade => {
      assetClasses[trade.symbol] = trade.asset_class;
    });

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-prices', {
        body: { symbols, assetClasses },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.prices) {
        const newPrices: PriceState = {};
        data.prices.forEach((p: PriceData) => {
          newPrices[p.symbol] = p;
        });
        setPrices(newPrices);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [openTrades.map(t => t.symbol).join(',')]);

  // Calculate unrealized P&L for a trade
  const calculateUnrealizedPL = useCallback((trade: Trade): number | null => {
    const priceData = prices[trade.symbol];
    if (!priceData?.price || !trade.entry_price) return null;

    const currentPrice = priceData.price;
    const pips = trade.direction === 'buy'
      ? (currentPrice - trade.entry_price)
      : (trade.entry_price - currentPrice);

    // Standard forex lot calculation
    return pips * trade.lot_size * 100000;
  }, [prices]);

  // Get price data for a specific symbol
  const getPrice = useCallback((symbol: string): PriceData | null => {
    return prices[symbol] || null;
  }, [prices]);

  // Calculate total unrealized P&L
  const totalUnrealizedPL = openTrades.reduce((sum, trade) => {
    const pl = calculateUnrealizedPL(trade);
    return sum + (pl || 0);
  }, 0);

  useEffect(() => {
    if (!enabled || openTrades.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchPrices();

    // Set up interval for refreshing
    intervalRef.current = setInterval(fetchPrices, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, fetchPrices, refreshInterval, openTrades.length]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    openTrades,
    calculateUnrealizedPL,
    getPrice,
    totalUnrealizedPL,
    refetch: fetchPrices,
  };
}

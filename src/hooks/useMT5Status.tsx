import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useMT5Status() {
    const { user } = useAuth();
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [recentTrades, setRecentTrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);

            // Get the last used key timestamp for the user
            const { data: keyData } = await supabase
                .from('webhook_api_keys')
                .select('last_used_at')
                .eq('user_id', user.id)
                .order('last_used_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (keyData?.last_used_at) {
                setLastSync(keyData.last_used_at);
            }

            // Get last 5 trades with MT5 Auto-Sync strategy
            const { data: tradeData } = await supabase
                .from('trades')
                .select('id, symbol, direction, lot_size, profit_loss, exit_date')
                .eq('user_id', user.id)
                .eq('strategy', 'MT5 Auto-Sync')
                .order('exit_date', { ascending: false })
                .limit(5);

            setRecentTrades(tradeData || []);
            setLoading(false);
        };

        fetchData();

        // Subscribe to changes
        const tradeChannel = supabase
            .channel('mt5-sync-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trades',
                    filter: `user_id=eq.${user.id}`,
                },
                () => fetchData()
            )
            .subscribe();

        const keyChannel = supabase
            .channel('key-usage-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'webhook_api_keys',
                    filter: `user_id=eq.${user.id}`,
                },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tradeChannel);
            supabase.removeChannel(keyChannel);
        };
    }, [user]);

    return { lastSync, recentTrades, loading };
}

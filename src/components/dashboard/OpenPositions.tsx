import { Trade } from '@/types/trade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLivePrices } from '@/hooks/useLivePrices';
import { formatDistanceToNow } from 'date-fns';

interface OpenPositionsProps {
  trades: Trade[];
}

export function OpenPositions({ trades }: OpenPositionsProps) {
  const { 
    prices, 
    loading, 
    lastUpdated, 
    openTrades, 
    calculateUnrealizedPL, 
    totalUnrealizedPL,
    refetch 
  } = useLivePrices(trades, { refreshInterval: 30000 });

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  const formatPrice = (price: number | null, symbol: string) => {
    if (price === null) return '--';
    // Crypto typically has more decimal places
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
    return price.toFixed(isCrypto ? 2 : 5);
  };

  if (openTrades.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No open positions</p>
            <Button asChild size="sm">
              <Link to="/trades/new">Open a Trade</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Open Positions
            <Badge variant="secondary" className="ml-2">
              {openTrades.length}
            </Badge>
          </CardTitle>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-right ${totalUnrealizedPL >= 0 ? 'text-chart-profit' : 'text-chart-loss'}`}>
            <p className="text-xs text-muted-foreground">Unrealized P&L</p>
            <p className="font-bold">{formatCurrency(totalUnrealizedPL)}</p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {openTrades.map((trade) => {
            const priceData = prices[trade.symbol];
            const unrealizedPL = calculateUnrealizedPL(trade);
            const isProfit = unrealizedPL !== null && unrealizedPL >= 0;

            return (
              <Link 
                key={trade.id} 
                to={`/trades/${trade.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      trade.direction === 'buy' 
                        ? 'bg-chart-profit/10 text-chart-profit' 
                        : 'bg-chart-loss/10 text-chart-loss'
                    }`}>
                      {trade.direction === 'buy' 
                        ? <ArrowUpRight className="w-5 h-5" /> 
                        : <ArrowDownRight className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trade.symbol}</span>
                        <Badge variant="outline" className="text-xs uppercase">
                          {trade.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Entry: {trade.entry_price.toFixed(5)}</span>
                        <span>•</span>
                        <span>Lot: {trade.lot_size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {loading && !priceData ? (
                      <Skeleton className="h-5 w-20 mb-1" />
                    ) : priceData?.price !== null ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono text-sm">
                          {formatPrice(priceData?.price ?? null, trade.symbol)}
                        </span>
                        {priceData?.change24h !== null && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              (priceData?.change24h ?? 0) >= 0 
                                ? 'text-chart-profit border-chart-profit/30' 
                                : 'text-chart-loss border-chart-loss/30'
                            }`}
                          >
                            {(priceData?.change24h ?? 0) >= 0 ? '+' : ''}
                            {priceData?.change24h?.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
                    
                    <div className={`flex items-center gap-1 justify-end text-sm font-medium ${
                      isProfit ? 'text-chart-profit' : 'text-chart-loss'
                    }`}>
                      {unrealizedPL !== null ? (
                        <>
                          {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatCurrency(unrealizedPL)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {openTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Auto-refreshes every 30s</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/trades">View All Trades</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

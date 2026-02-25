import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trade } from '@/types/trade';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  const recentTrades = trades.slice(0, 5);

  const getStatusIcon = (status: string | null) => {
    if (status === 'win') return <ArrowUpRight className="w-4 h-4" />;
    if (status === 'loss') return <ArrowDownRight className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getStatusColor = (status: string | null) => {
    if (status === 'win') return 'bg-success/10 text-success border-success/20';
    if (status === 'loss') return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-muted text-muted-foreground border-muted';
  };

  const formatPL = (pl: number | null) => {
    if (pl === null) return '-';
    const formatted = Math.abs(pl).toFixed(2);
    return pl >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  return (
    <Card className="gradient-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">Recent Trades</CardTitle>
        <Link
          to="/trades"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trades yet. Start logging your trades!</p>
            <Link
              to="/trades/new"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Add your first trade
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTrades.map(trade => (
              <Link
                key={trade.id}
                to={`/trades/${trade.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    getStatusColor(trade.status)
                  )}>
                    {getStatusIcon(trade.status)}
                  </div>
                  <div>
                    <p className="font-medium">{trade.symbol}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.entry_date), 'MMM d, yyyy')}
                      </p>
                      {trade.needs_review && (
                        <Badge variant="secondary" className="h-4 text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30 uppercase">
                          Review
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-semibold',
                    trade.profit_loss !== null && trade.profit_loss > 0 && 'text-success',
                    trade.profit_loss !== null && trade.profit_loss < 0 && 'text-destructive',
                  )}>
                    {formatPL(trade.profit_loss)}
                  </p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {trade.direction}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

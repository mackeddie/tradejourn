import { PairStats } from '@/utils/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PairPerformanceProps {
  pairData: PairStats[];
}

export function PairPerformance({ pairData }: PairPerformanceProps) {
  if (pairData.length === 0) return null;

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  // Sort by total trades descending
  const sorted = [...pairData].sort((a, b) => b.trades - a.trades);

  return (
    <div className="space-y-6">
      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((pair) => {
          const isProfit = pair.totalPL > 0;
          const isBreakeven = pair.totalPL === 0;

          return (
            <Card key={pair.symbol} className="gradient-card group hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-lg tracking-tight">
                    {pair.symbol}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      isBreakeven
                        ? 'border-muted-foreground/40 text-muted-foreground'
                        : isProfit
                        ? 'border-success/40 text-success'
                        : 'border-destructive/40 text-destructive'
                    }
                  >
                    {isBreakeven ? (
                      <Minus className="h-3 w-3 mr-1" />
                    ) : isProfit ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatCurrency(pair.totalPL)}
                  </Badge>
                </div>

                {/* Win/Loss mini bar */}
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                  {pair.wins > 0 && (
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${(pair.wins / pair.trades) * 100}%` }}
                    />
                  )}
                  {pair.breakeven > 0 && (
                    <div
                      className="h-full bg-muted-foreground/40 transition-all"
                      style={{ width: `${(pair.breakeven / pair.trades) * 100}%` }}
                    />
                  )}
                  {pair.losses > 0 && (
                    <div
                      className="h-full bg-destructive transition-all"
                      style={{ width: `${(pair.losses / pair.trades) * 100}%` }}
                    />
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Trades</p>
                    <p className="font-semibold text-sm">{pair.trades}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-semibold text-sm">{pair.winRate.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">W / L</p>
                    <p className="font-semibold text-sm">
                      <span className="text-success">{pair.wins}</span>
                      {' / '}
                      <span className="text-destructive">{pair.losses}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stacked bar chart */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Win / Loss Breakdown by Pair</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: Math.max(280, sorted.length * 48) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted} layout="vertical" barCategoryGap="20%">
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'wins') return [value, 'Wins'];
                    if (name === 'losses') return [value, 'Losses'];
                    if (name === 'breakeven') return [value, 'Breakeven'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="wins" stackId="a" fill="hsl(var(--chart-profit))" name="wins" radius={[0, 0, 0, 0]} />
                <Bar dataKey="losses" stackId="a" fill="hsl(var(--chart-loss))" name="losses" radius={[0, 0, 0, 0]} />
                <Bar dataKey="breakeven" stackId="a" fill="hsl(var(--muted-foreground))" name="breakeven" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

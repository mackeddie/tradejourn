import { Trade } from '@/types/trade';
import { TradeStats, StrategyStats, getExitReasonStats } from '@/utils/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

interface PerformanceSummaryProps {
  trades: Trade[];
  stats: TradeStats;
  strategyStats: StrategyStats[];
}

export function PerformanceSummary({ trades, stats, strategyStats }: PerformanceSummaryProps) {
  const exitReasonStats = getExitReasonStats(trades);
  const topStrategies = strategyStats.slice(0, 3);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  if (trades.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lightbulb className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start Your Trading Journal</h3>
          <p className="text-muted-foreground max-w-md">
            Log your trades to get insights on your performance, best strategies, and areas for improvement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strategy Performance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Top Strategies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topStrategies.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Add strategies to your trades to see performance breakdown
            </p>
          ) : (
            topStrategies.map((strat, index) => (
              <div key={strat.strategy} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    <span className="font-medium">{strat.strategy}</span>
                  </div>
                  <span className={`font-semibold ${strat.totalPL >= 0 ? 'text-chart-profit' : 'text-chart-loss'}`}>
                    {formatCurrency(strat.totalPL)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{strat.trades} trades</span>
                  <span className={strat.winRate >= 50 ? 'text-chart-profit' : 'text-chart-loss'}>
                    {strat.winRate.toFixed(0)}% win rate
                  </span>
                  {strat.averageRR > 0 && (
                    <span>R:R {strat.averageRR.toFixed(1)}</span>
                  )}
                </div>
                <Progress 
                  value={strat.winRate} 
                  className="h-1.5"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Exit Reason Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            How You Exit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exitReasonStats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Log trades with exit reasons to see breakdown
            </p>
          ) : (
            exitReasonStats.map((exit) => (
              <div key={exit.reason} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{exit.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {exit.count} ({exit.percentage.toFixed(0)}%)
                    </span>
                    <span className={`font-semibold ${exit.totalPL >= 0 ? 'text-chart-profit' : 'text-chart-loss'}`}>
                      {formatCurrency(exit.totalPL)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={exit.percentage} 
                  className="h-1.5"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Win Rate Insight */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {stats.winRate >= 50 ? (
                  <TrendingUp className="w-4 h-4 text-chart-profit" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-chart-loss" />
                )}
                <span className="text-sm font-medium">Win Rate Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.winRate >= 60 
                  ? "Excellent win rate! Keep following your rules."
                  : stats.winRate >= 50
                  ? "Good win rate. Focus on increasing R:R to boost profits."
                  : stats.winRate >= 40
                  ? "Average win rate. Higher R:R trades can still be profitable."
                  : "Low win rate. Review entry criteria and consider tighter filters."
                }
              </p>
            </div>

            {/* R:R Insight */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {stats.averageRR >= 1.5 ? (
                  <TrendingUp className="w-4 h-4 text-chart-profit" />
                ) : (
                  <Target className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Risk/Reward</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.averageRR >= 2
                  ? "Great R:R ratio! You're letting winners run."
                  : stats.averageRR >= 1.5
                  ? "Solid R:R. Consider holding winners a bit longer."
                  : stats.averageRR >= 1
                  ? "Break-even R:R. Need higher win rate to profit."
                  : "Low R:R. Consider wider take profits or tighter stops."
                }
              </p>
            </div>

            {/* Expectancy Insight */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {stats.expectancy > 0 ? (
                  <TrendingUp className="w-4 h-4 text-chart-profit" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-chart-loss" />
                )}
                <span className="text-sm font-medium">Edge Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.expectancy > 50
                  ? "Strong positive expectancy. Your system has an edge."
                  : stats.expectancy > 0
                  ? "Positive expectancy. Keep refining for better results."
                  : stats.expectancy === 0
                  ? "Break-even system. Focus on increasing win rate or R:R."
                  : "Negative expectancy. Review your strategy and risk management."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

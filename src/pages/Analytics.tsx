import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { PairPerformance } from '@/components/analytics/PairPerformance';
import { ConfluenceAnalytics } from '@/components/analytics/ConfluenceAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  calculateStats,
  getEquityCurve,
  getTradesByAssetClass,
  getMonthlyPerformance,
  getWinLossDistribution,
  getStrategyPerformance,
  getExitReasonStats,
  getDayOfWeekPerformance,
  getPairPerformance,
} from '@/utils/analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Percent,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportTradeLog, exportAnalyticsReport } from '@/utils/exportAnalytics';
import { exportAnalyticsPdf } from '@/utils/exportPdf';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const COLORS = ['hsl(var(--chart-profit))', 'hsl(var(--chart-loss))', 'hsl(var(--muted-foreground))'];
const ASSET_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-profit))', 'hsl(var(--chart-loss))'];

export default function Analytics() {
  const { trades, loading } = useTrades();
  const [exporting, setExporting] = useState(false);
  const stats = calculateStats(trades);
  const equityCurve = getEquityCurve(trades);
  const assetData = getTradesByAssetClass(trades);
  const monthlyData = getMonthlyPerformance(trades);
  const winLossData = getWinLossDistribution(trades);
  const strategyData = getStrategyPerformance(trades);
  const exitData = getExitReasonStats(trades);
  const dayData = getDayOfWeekPerformance(trades);
  const pairData = getPairPerformance(trades);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div id="analytics-capture" className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Deep dive into your trading performance
            </p>
          </div>
          {trades.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportAnalyticsReport(trades)}>
                  Analytics Report (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTradeLog(trades)}>
                  Full Trade Log (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={exporting}
                  onClick={async () => {
                    setExporting(true);
                    try {
                      await exportAnalyticsPdf('analytics-capture');
                    } finally {
                      setExporting(false);
                    }
                  }}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    'Visual Report (.pdf)'
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total P&L"
            value={formatCurrency(stats.totalProfitLoss)}
            subtitle={`${stats.totalTrades} total trades`}
            icon={stats.totalProfitLoss >= 0 ? TrendingUp : TrendingDown}
            trend={stats.totalProfitLoss > 0 ? 'up' : stats.totalProfitLoss < 0 ? 'down' : 'neutral'}
          />
          <StatCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L / ${stats.breakevenTrades}BE`}
            icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />
          <StatCard
            title="Profit Factor"
            value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            subtitle="Gross profit / Gross loss"
            icon={Activity}
            trend={stats.profitFactor >= 1 ? 'up' : 'down'}
          />
          <StatCard
            title="Average Win"
            value={formatCurrency(stats.averageWin)}
            subtitle={`Best: ${formatCurrency(stats.largestWin)}`}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Average Loss"
            value={formatCurrency(-stats.averageLoss)}
            subtitle={`Worst: ${formatCurrency(stats.largestLoss)}`}
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="Expectancy"
            value={formatCurrency(stats.expectancy)}
            subtitle="Expected $ per trade"
            icon={Percent}
            trend={stats.expectancy > 0 ? 'up' : 'down'}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equity Curve */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              {equityCurve.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Complete some trades to see your equity curve
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={equityCurve}>
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                      />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Win/Loss Distribution */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Win/Loss Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {winLossData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Complete some trades to see distribution
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {winLossData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No monthly data available
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'profit') return [`$${value.toFixed(2)}`, 'Profit'];
                          if (name === 'winRate') return [`${value.toFixed(0)}%`, 'Win Rate'];
                          return [value, 'Trades'];
                        }}
                      />
                      <Bar
                        dataKey="profit"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day of Week Performance */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Performance by Day</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData}>
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'profit') return [`$${value.toFixed(2)}`, 'P&L'];
                          if (name === 'winRate') return [`${value.toFixed(0)}%`, 'Win Rate'];
                          return [value, 'Trades'];
                        }}
                      />
                      <Bar
                        dataKey="profit"
                        fill="hsl(var(--accent))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance by Asset Class */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Performance by Asset Class</CardTitle>
            </CardHeader>
            <CardContent>
              {assetData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trades to analyze
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetData} layout="vertical">
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'profit') return [`$${value.toFixed(2)}`, 'P&L'];
                          return [value, 'Trades'];
                        }}
                      />
                      <Bar
                        dataKey="profit"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategy Performance */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="font-display">Strategy Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {strategyData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Add strategies to your trades to see performance
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategyData.slice(0, 5)} layout="vertical">
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="strategy"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'totalPL') return [`$${value.toFixed(2)}`, 'P&L'];
                          if (name === 'winRate') return [`${value.toFixed(0)}%`, 'Win Rate'];
                          return [value, name];
                        }}
                      />
                      <Bar
                        dataKey="totalPL"
                        fill="hsl(var(--accent))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pair Performance */}
        <PairPerformance pairData={pairData} />

        {/* Confluence Analytics */}
        <ConfluenceAnalytics trades={trades} />
      </div>
    </AppLayout>
  );
}

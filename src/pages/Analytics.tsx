import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  calculateStats, 
  getEquityCurve, 
  getTradesByAssetClass,
  getMonthlyPerformance,
  getWinLossDistribution,
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
  Scale,
} from 'lucide-react';

const COLORS = ['hsl(145, 70%, 45%)', 'hsl(0, 85%, 60%)', 'hsl(220, 10%, 50%)'];

export default function Analytics() {
  const { trades, loading } = useTrades();
  const stats = calculateStats(trades);
  const equityCurve = getEquityCurve(trades);
  const assetData = getTradesByAssetClass(trades);
  const monthlyData = getMonthlyPerformance(trades);
  const winLossData = getWinLossDistribution(trades);

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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into your trading performance
          </p>
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
            title="Risk/Reward Ratio"
            value={stats.averageRR.toFixed(2)}
            subtitle="Avg win / Avg loss"
            icon={Scale}
            trend={stats.averageRR >= 1 ? 'up' : 'down'}
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
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
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
      </div>
    </AppLayout>
  );
}

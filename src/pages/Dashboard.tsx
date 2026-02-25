import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { PerformanceSummary } from '@/components/dashboard/PerformanceSummary';
import { calculateStats, getStrategyPerformance } from '@/utils/analytics';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Plus,
  Upload,
  Percent,
  Scale,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile } = useAuth();
  const { trades, loading } = useTrades();
  const stats = calculateStats(trades);
  const strategyStats = getStrategyPerformance(trades);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, {profile?.display_name || 'Trader'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your trading performance overview
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/import">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Link>
            </Button>
            <Button asChild>
              <Link to="/trades/new">
                <Plus className="w-4 h-4 mr-2" />
                Log Trade
              </Link>
            </Button>
          </div>
        </div>

        {/* Needs Review Alert */}
        {trades.filter(t => t.needs_review).length > 0 && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Review Pending</h3>
                <p className="text-sm text-muted-foreground">
                  You have {trades.filter(t => t.needs_review).length} new trades from MT5 that need setup details.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/trades">Review Now</Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
            icon={Target}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />
          <StatCard
            title="Profit Factor"
            value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            subtitle="Win/Loss ratio"
            icon={BarChart3}
            trend={stats.profitFactor >= 1 ? 'up' : 'down'}
          />
          <StatCard
            title="Avg R:R"
            value={stats.averageRR.toFixed(2)}
            subtitle="Risk to Reward"
            icon={Scale}
            trend={stats.averageRR >= 1 ? 'up' : 'down'}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Expectancy"
            value={formatCurrency(stats.expectancy)}
            subtitle="Per trade"
            icon={Percent}
            trend={stats.expectancy > 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Best Trade"
            value={formatCurrency(stats.largestWin)}
            subtitle="Single best"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Worst Trade"
            value={formatCurrency(stats.largestLoss)}
            subtitle="Single worst"
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="Avg Win"
            value={formatCurrency(stats.averageWin)}
            subtitle={`Avg Loss: ${formatCurrency(-stats.averageLoss)}`}
            icon={Target}
          />
        </div>

        {/* Performance Summary */}
        <PerformanceSummary trades={trades} stats={stats} strategyStats={strategyStats} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EquityCurve trades={trades} />
          <RecentTrades trades={trades} />
        </div>
      </div>
    </AppLayout>
  );
}

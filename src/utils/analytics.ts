import { Trade } from '@/types/trade';

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  openTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  averageRR: number;
}

export function calculateStats(trades: Trade[]): TradeStats {
  const closedTrades = trades.filter(t => t.status !== 'open');
  const wins = closedTrades.filter(t => t.status === 'win');
  const losses = closedTrades.filter(t => t.status === 'loss');
  const breakeven = closedTrades.filter(t => t.status === 'breakeven');
  const open = trades.filter(t => t.status === 'open');

  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalWinAmount = wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0));

  const averageWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  const averageLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;

  const winPLs = wins.map(t => t.profit_loss || 0);
  const lossPLs = losses.map(t => t.profit_loss || 0);

  const largestWin = winPLs.length > 0 ? Math.max(...winPLs) : 0;
  const largestLoss = lossPLs.length > 0 ? Math.min(...lossPLs) : 0;

  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;
  const averageRR = averageLoss > 0 ? averageWin / averageLoss : 0;

  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakevenTrades: breakeven.length,
    openTrades: open.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalProfitLoss: totalPL,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    profitFactor,
    averageRR,
  };
}

export function getEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sortedTrades = [...trades]
    .filter(t => t.exit_date && t.profit_loss !== null)
    .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());

  let cumulative = 0;
  return sortedTrades.map(trade => {
    cumulative += trade.profit_loss || 0;
    return {
      date: new Date(trade.exit_date!).toLocaleDateString(),
      equity: cumulative,
    };
  });
}

export function getTradesByAssetClass(trades: Trade[]): { name: string; value: number; profit: number }[] {
  const grouped = trades.reduce((acc, trade) => {
    const key = trade.asset_class;
    if (!acc[key]) {
      acc[key] = { count: 0, profit: 0 };
    }
    acc[key].count++;
    acc[key].profit += trade.profit_loss || 0;
    return acc;
  }, {} as Record<string, { count: number; profit: number }>);

  return Object.entries(grouped).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.count,
    profit: data.profit,
  }));
}

export function getMonthlyPerformance(trades: Trade[]): { month: string; profit: number; trades: number }[] {
  const closedTrades = trades.filter(t => t.exit_date && t.profit_loss !== null);
  
  const grouped = closedTrades.reduce((acc, trade) => {
    const date = new Date(trade.exit_date!);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { profit: 0, trades: 0 };
    }
    acc[monthKey].profit += trade.profit_loss || 0;
    acc[monthKey].trades++;
    return acc;
  }, {} as Record<string, { profit: number; trades: number }>);

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      profit: data.profit,
      trades: data.trades,
    }));
}

export function getWinLossDistribution(trades: Trade[]): { name: string; value: number }[] {
  const stats = calculateStats(trades);
  return [
    { name: 'Wins', value: stats.winningTrades },
    { name: 'Losses', value: stats.losingTrades },
    { name: 'Breakeven', value: stats.breakevenTrades },
  ].filter(d => d.value > 0);
}

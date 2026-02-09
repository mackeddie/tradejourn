import { Trade } from '@/types/trade';

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  averageRR: number;
  expectancy: number;
  averageRiskAmount: number;
  totalRiskAmount: number;
  averagePips: number;
  totalPips: number;
}

export interface StrategyStats {
  strategy: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPL: number;
  averageRR: number;
}

export interface ExitReasonStats {
  reason: string;
  count: number;
  percentage: number;
  totalPL: number;
}

export function calculateStats(trades: Trade[]): TradeStats {
  const completedTrades = trades.filter(t => t.status);
  const wins = completedTrades.filter(t => t.status === 'win');
  const losses = completedTrades.filter(t => t.status === 'loss');
  const breakeven = completedTrades.filter(t => t.status === 'breakeven');

  // Calculate profit/loss totals
  const totalPL = completedTrades.reduce((sum, t) => {
    if (t.reward_amount !== null) {
      return sum + (t.status === 'loss' ? -Math.abs(t.reward_amount) : t.reward_amount);
    }
    return sum + (t.profit_loss || 0);
  }, 0);

  const totalWinAmount = wins.reduce((sum, t) => sum + Math.abs(t.reward_amount || t.profit_loss || 0), 0);
  const totalLossAmount = losses.reduce((sum, t) => sum + Math.abs(t.reward_amount || t.profit_loss || 0), 0);

  const averageWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  const averageLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;

  // Largest win/loss
  const winAmounts = wins.map(t => Math.abs(t.reward_amount || t.profit_loss || 0));
  const lossAmounts = losses.map(t => -Math.abs(t.reward_amount || t.profit_loss || 0));

  const largestWin = winAmounts.length > 0 ? Math.max(...winAmounts) : 0;
  const largestLoss = lossAmounts.length > 0 ? Math.min(...lossAmounts) : 0;

  // Profit factor
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;

  // Average R:R from actual logged values
  const tradesWithRR = completedTrades.filter(t => t.risk_reward_ratio !== null);
  const averageRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.risk_reward_ratio || 0), 0) / tradesWithRR.length
    : averageLoss > 0 ? averageWin / averageLoss : 0;

  // Win rate
  const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;

  // Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss)
  const lossRate = completedTrades.length > 0 ? losses.length / completedTrades.length : 0;
  const expectancy = (winRate / 100 * averageWin) - (lossRate * averageLoss);

  // Risk stats
  const tradesWithRisk = completedTrades.filter(t => t.risk_amount !== null);
  const totalRiskAmount = tradesWithRisk.reduce((sum, t) => sum + (t.risk_amount || 0), 0);
  const averageRiskAmount = tradesWithRisk.length > 0 ? totalRiskAmount / tradesWithRisk.length : 0;

  // Pips stats
  const tradesWithPips = completedTrades.filter(t => t.pips !== null);
  const totalPips = tradesWithPips.reduce((sum, t) => sum + (t.pips || 0), 0);
  const averagePips = tradesWithPips.length > 0 ? totalPips / tradesWithPips.length : 0;

  return {
    totalTrades: completedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakevenTrades: breakeven.length,
    winRate,
    totalProfitLoss: totalPL,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    profitFactor,
    averageRR,
    expectancy,
    averageRiskAmount,
    totalRiskAmount,
    averagePips,
    totalPips,
  };
}

export function getEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sortedTrades = [...trades]
    .filter(t => t.exit_date && t.status)
    .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());

  let cumulative = 0;
  return sortedTrades.map(trade => {
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    cumulative += pl;
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
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[key].profit += pl;
    return acc;
  }, {} as Record<string, { count: number; profit: number }>);

  return Object.entries(grouped).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.count,
    profit: data.profit,
  }));
}

export function getMonthlyPerformance(trades: Trade[]): { month: string; profit: number; trades: number; winRate: number }[] {
  const completedTrades = trades.filter(t => t.exit_date && t.status);
  
  const grouped = completedTrades.reduce((acc, trade) => {
    const date = new Date(trade.exit_date!);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { profit: 0, trades: 0, wins: 0 };
    }
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[monthKey].profit += pl;
    acc[monthKey].trades++;
    if (trade.status === 'win') acc[monthKey].wins++;
    return acc;
  }, {} as Record<string, { profit: number; trades: number; wins: number }>);

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      profit: data.profit,
      trades: data.trades,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
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

export function getStrategyPerformance(trades: Trade[]): StrategyStats[] {
  const grouped = trades.reduce((acc, trade) => {
    const strategy = trade.strategy || 'No Strategy';
    if (!acc[strategy]) {
      acc[strategy] = { trades: 0, wins: 0, losses: 0, totalPL: 0, totalRR: 0, rrCount: 0 };
    }
    acc[strategy].trades++;
    if (trade.status === 'win') acc[strategy].wins++;
    if (trade.status === 'loss') acc[strategy].losses++;
    
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[strategy].totalPL += pl;
    
    if (trade.risk_reward_ratio !== null) {
      acc[strategy].totalRR += trade.risk_reward_ratio;
      acc[strategy].rrCount++;
    }
    return acc;
  }, {} as Record<string, { trades: number; wins: number; losses: number; totalPL: number; totalRR: number; rrCount: number }>);

  return Object.entries(grouped)
    .map(([strategy, data]) => ({
      strategy,
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      totalPL: data.totalPL,
      averageRR: data.rrCount > 0 ? data.totalRR / data.rrCount : 0,
    }))
    .sort((a, b) => b.totalPL - a.totalPL);
}

export function getExitReasonStats(trades: Trade[]): ExitReasonStats[] {
  const completedTrades = trades.filter(t => t.exit_reason);
  
  const grouped = completedTrades.reduce((acc, trade) => {
    const reason = trade.exit_reason || 'unknown';
    if (!acc[reason]) {
      acc[reason] = { count: 0, totalPL: 0 };
    }
    acc[reason].count++;
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[reason].totalPL += pl;
    return acc;
  }, {} as Record<string, { count: number; totalPL: number }>);

  const total = completedTrades.length;
  const reasonLabels: Record<string, string> = {
    tp_hit: 'Take Profit Hit',
    sl_hit: 'Stop Loss Hit',
    manual_close: 'Manual Close',
    breakeven: 'Breakeven Exit',
  };

  return Object.entries(grouped)
    .map(([reason, data]) => ({
      reason: reasonLabels[reason] || reason,
      count: data.count,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
      totalPL: data.totalPL,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getDayOfWeekPerformance(trades: Trade[]): { day: string; trades: number; winRate: number; profit: number }[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped = trades.reduce((acc, trade) => {
    const dayIndex = new Date(trade.entry_date).getDay();
    if (!acc[dayIndex]) {
      acc[dayIndex] = { trades: 0, wins: 0, profit: 0 };
    }
    acc[dayIndex].trades++;
    if (trade.status === 'win') acc[dayIndex].wins++;
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[dayIndex].profit += pl;
    return acc;
  }, {} as Record<number, { trades: number; wins: number; profit: number }>);

  return days.map((day, index) => ({
    day: day.slice(0, 3),
    trades: grouped[index]?.trades || 0,
    winRate: grouped[index]?.trades > 0 ? (grouped[index].wins / grouped[index].trades) * 100 : 0,
    profit: grouped[index]?.profit || 0,
  }));
}

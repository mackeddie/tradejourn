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

export interface PairStats {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPL: number;
}

export function getPairPerformance(trades: Trade[]): PairStats[] {
  const grouped = trades.reduce((acc, trade) => {
    const symbol = trade.symbol;
    if (!acc[symbol]) {
      acc[symbol] = { trades: 0, wins: 0, losses: 0, breakeven: 0, totalPL: 0 };
    }
    acc[symbol].trades++;
    if (trade.status === 'win') acc[symbol].wins++;
    if (trade.status === 'loss') acc[symbol].losses++;
    if (trade.status === 'breakeven') acc[symbol].breakeven++;
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);
    acc[symbol].totalPL += pl;
    return acc;
  }, {} as Record<string, { trades: number; wins: number; losses: number; breakeven: number; totalPL: number }>);

  return Object.entries(grouped)
    .map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      breakeven: data.breakeven,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      totalPL: data.totalPL,
    }))
    .sort((a, b) => b.trades - a.trades);
}

export interface RuleStats {
  rule: string;
  trades: number;
  wins: number;
  winRate: number;
  totalPL: number;
}

export function getRulePerformance(trades: Trade[]): RuleStats[] {
  const completedTrades = trades.filter(t => t.status);

  const rules = [
    { key: 'rule_in_plan', label: 'In Plan' },
    { key: 'rule_bos', label: 'BOS' },
    { key: 'rule_liquidity', label: 'Liquidity' },
    { key: 'rule_trend', label: 'Trend' },
    { key: 'rule_news', label: 'News Check' },
    { key: 'rule_rr', label: '1:2 R:R' }
  ];

  return rules.map(rule => {
    // Only count trades where this specific rule was marked "yes"
    const tradesWithRule = completedTrades.filter(t => (t as any)[rule.key] === 'yes');
    const wins = tradesWithRule.filter(t => t.status === 'win').length;

    const totalPL = tradesWithRule.reduce((sum, t) => {
      const pl = t.reward_amount !== null
        ? (t.status === 'loss' ? -Math.abs(t.reward_amount) : t.reward_amount)
        : (t.profit_loss || 0);
      return sum + pl;
    }, 0);

    return {
      rule: rule.label,
      trades: tradesWithRule.length,
      wins,
      winRate: tradesWithRule.length > 0 ? (wins / tradesWithRule.length) * 100 : 0,
      totalPL
    };
  }).filter(stat => stat.trades > 0);
}

export interface EmotionStats {
  emotion: string;
  count: number;
  totalPL: number;
  avgPL: number;
  wins: number;
  losses: number;
  winRate: number;
  expectancy: number;
}

export function getEmotionPerformance(trades: Trade[]): EmotionStats[] {
  const completedTrades = trades.filter(t => t.status);

  const grouped = completedTrades.reduce((acc, trade) => {
    let rawEmotions: string[] = [];

    // 1. Extract from emotions_array (mapped from 'emotions' column)
    const stored = trade.emotions_array as any;

    if (Array.isArray(stored)) {
      rawEmotions = [...stored];
    } else if (typeof stored === 'string') {
      const str = (stored as string).trim();
      if (str.startsWith('[') && str.endsWith(']')) {
        try { rawEmotions = JSON.parse(str); } catch (e) { rawEmotions = [str]; }
      } else if (str.startsWith('{') && str.endsWith('}')) {
        // Handle Postgres text[] format: {FOMO,Revenge}
        rawEmotions = str.substring(1, str.length - 1).split(',').map(s => s.replace(/"/g, '').trim());
      } else if (str.includes(',')) {
        rawEmotions = str.split(',').map(s => s.trim());
      } else if (str) {
        rawEmotions = [str];
      }
    }

    // 2. Add rule_emotions if present (from confluence checklist)
    if (trade.rule_emotions === 'yes') {
      rawEmotions.push('Calm');
    } else if (trade.rule_emotions === 'no') {
      rawEmotions.push('Anxious');
    }

    // 3. Normalize & Deduplicate
    // We trim, capitalize properly, and filter out junk data (like single-char remnants)
    const normalizedEmotions = Array.from(new Set(
      rawEmotions
        .map(e => String(e).trim())
        .filter(e => e.length > 1) // Ignore junk like 'C' 'o' '[' ','
        .map(e => {
          // Special Case for common acronyms
          if (e.toUpperCase() === 'FOMO') return 'FOMO';
          // General Title Case: "anxious" -> "Anxious"
          return e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
        })
    ));

    normalizedEmotions.forEach(emotion => {
      if (!acc[emotion]) {
        acc[emotion] = {
          count: 0,
          totalPL: 0,
          wins: 0,
          losses: 0,
          winAmount: 0,
          lossAmount: 0
        };
      }
      acc[emotion].count++;

      const pl = trade.reward_amount !== null
        ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
        : (trade.profit_loss || 0);

      acc[emotion].totalPL += pl;

      if (trade.status === 'win') {
        acc[emotion].wins++;
        acc[emotion].winAmount += Math.abs(pl);
      } else if (trade.status === 'loss') {
        acc[emotion].losses++;
        acc[emotion].lossAmount += Math.abs(pl);
      }
    });

    return acc;
  }, {} as Record<string, { count: number; totalPL: number; wins: number; losses: number; winAmount: number; lossAmount: number; }>);

  return Object.entries(grouped).map(([emotion, data]) => {
    const winRate = data.count > 0 ? (data.wins / data.count) : 0;
    const avgWin = data.wins > 0 ? data.winAmount / data.wins : 0;
    const avgLoss = data.losses > 0 ? data.lossAmount / data.losses : 0;

    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    return {
      emotion,
      count: data.count,
      totalPL: data.totalPL,
      avgPL: data.count > 0 ? data.totalPL / data.count : 0,
      wins: data.wins,
      losses: data.losses,
      winRate: winRate * 100,
      expectancy
    };
  }).filter(e => e.count > 0)
    .sort((a, b) => b.expectancy - a.expectancy);
}

export interface SetupQualityStats {
  quality: string;
  trades: number;
  wins: number;
  winRate: number;
  totalPL: number;
  expectancy: number;
}

export function getSetupQualityStats(trades: Trade[]): SetupQualityStats[] {
  const completedTrades = trades.filter(t => t.status && t.setup_type);

  const grouped = completedTrades.reduce((acc, trade) => {
    const quality = trade.setup_type!;
    if (!acc[quality]) acc[quality] = { trades: [], wins: 0, losses: 0, totalPL: 0, totalWinAmount: 0, totalLossAmount: 0 };

    acc[quality].trades.push(trade);

    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount) : trade.reward_amount)
      : (trade.profit_loss || 0);

    acc[quality].totalPL += pl;

    if (trade.status === 'win') {
      acc[quality].wins++;
      acc[quality].totalWinAmount += Math.abs(pl);
    } else if (trade.status === 'loss') {
      acc[quality].losses++;
      acc[quality].totalLossAmount += Math.abs(pl);
    }

    return acc;
  }, {} as Record<string, { trades: Trade[], wins: number; losses: number; totalPL: number, totalWinAmount: number, totalLossAmount: number }>);

  return Object.entries(grouped).map(([quality, data]) => {
    const totalCount = data.trades.length;
    const winRate = totalCount > 0 ? data.wins / totalCount : 0;
    const lossRate = totalCount > 0 ? data.losses / totalCount : 0;

    const avgWin = data.wins > 0 ? data.totalWinAmount / data.wins : 0;
    const avgLoss = data.losses > 0 ? data.totalLossAmount / data.losses : 0;

    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    return {
      quality,
      trades: totalCount,
      wins: data.wins,
      winRate: winRate * 100,
      totalPL: data.totalPL,
      expectancy
    };
  }).sort((a, b) => {
    const order: Record<string, number> = { 'A+': 3, 'A': 2, 'B': 1, 'C': 0 };
    return (order[b.quality] || 0) - (order[a.quality] || 0);
  });
}

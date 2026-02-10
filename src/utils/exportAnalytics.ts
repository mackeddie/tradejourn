import { Trade } from '@/types/trade';
import { 
  calculateStats, 
  getMonthlyPerformance, 
  getStrategyPerformance, 
  getExitReasonStats, 
  getDayOfWeekPerformance,
  getTradesByAssetClass,
} from '@/utils/analytics';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsv).join(',');
  const dataLines = rows.map(row => row.map(escapeCsv).join(','));
  return [headerLine, ...dataLines].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTradeLog(trades: Trade[]) {
  const headers = [
    'Date', 'Symbol', 'Asset Class', 'Direction', 'Status', 'Exit Reason',
    'Entry Price', 'Exit Price', 'Lot Size', 'Stop Loss', 'Take Profit',
    'P&L ($)', 'Pips', 'Risk ($)', 'Reward ($)', 'R:R Ratio',
    'Strategy', 'Reasoning', 'Emotions', 'Lessons',
  ];

  const rows = trades.map(t => [
    t.entry_date ? new Date(t.entry_date).toLocaleDateString() : '',
    t.symbol,
    t.asset_class,
    t.direction,
    t.status,
    t.exit_reason,
    t.entry_price,
    t.exit_price,
    t.lot_size,
    t.stop_loss,
    t.take_profit,
    t.profit_loss,
    t.pips,
    t.risk_amount,
    t.reward_amount,
    t.risk_reward_ratio,
    t.strategy,
    t.reasoning,
    t.emotions,
    t.lessons,
  ]);

  downloadFile(arrayToCsv(headers, rows), `trade-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

export function exportAnalyticsReport(trades: Trade[]) {
  const stats = calculateStats(trades);
  const monthly = getMonthlyPerformance(trades);
  const strategies = getStrategyPerformance(trades);
  const exitReasons = getExitReasonStats(trades);
  const dayPerf = getDayOfWeekPerformance(trades);
  const assetPerf = getTradesByAssetClass(trades);

  const sections: string[] = [];

  // Summary
  sections.push('=== PERFORMANCE SUMMARY ===');
  sections.push(arrayToCsv(
    ['Metric', 'Value'],
    [
      ['Total Trades', stats.totalTrades],
      ['Win Rate (%)', stats.winRate.toFixed(1)],
      ['Total P&L ($)', stats.totalProfitLoss.toFixed(2)],
      ['Profit Factor', stats.profitFactor === Infinity ? 'Infinity' : stats.profitFactor.toFixed(2)],
      ['Expectancy ($)', stats.expectancy.toFixed(2)],
      ['Average Win ($)', stats.averageWin.toFixed(2)],
      ['Average Loss ($)', stats.averageLoss.toFixed(2)],
      ['Largest Win ($)', stats.largestWin.toFixed(2)],
      ['Largest Loss ($)', stats.largestLoss.toFixed(2)],
      ['Average R:R', stats.averageRR.toFixed(2)],
      ['Winning Trades', stats.winningTrades],
      ['Losing Trades', stats.losingTrades],
      ['Breakeven Trades', stats.breakevenTrades],
      ['Total Pips', stats.totalPips.toFixed(1)],
      ['Average Pips', stats.averagePips.toFixed(1)],
    ]
  ));

  // Monthly
  sections.push('\n=== MONTHLY PERFORMANCE ===');
  sections.push(arrayToCsv(
    ['Month', 'P&L ($)', 'Trades', 'Win Rate (%)'],
    monthly.map(m => [m.month, m.profit.toFixed(2), m.trades, m.winRate.toFixed(1)])
  ));

  // Strategy
  if (strategies.length > 0) {
    sections.push('\n=== STRATEGY PERFORMANCE ===');
    sections.push(arrayToCsv(
      ['Strategy', 'Trades', 'Wins', 'Losses', 'Win Rate (%)', 'P&L ($)', 'Avg R:R'],
      strategies.map(s => [s.strategy, s.trades, s.wins, s.losses, s.winRate.toFixed(1), s.totalPL.toFixed(2), s.averageRR.toFixed(2)])
    ));
  }

  // Exit Reasons
  if (exitReasons.length > 0) {
    sections.push('\n=== EXIT REASON BREAKDOWN ===');
    sections.push(arrayToCsv(
      ['Exit Reason', 'Count', 'Percentage (%)', 'P&L ($)'],
      exitReasons.map(e => [e.reason, e.count, e.percentage.toFixed(1), e.totalPL.toFixed(2)])
    ));
  }

  // Day of Week
  sections.push('\n=== DAY OF WEEK PERFORMANCE ===');
  sections.push(arrayToCsv(
    ['Day', 'Trades', 'Win Rate (%)', 'P&L ($)'],
    dayPerf.map(d => [d.day, d.trades, d.winRate.toFixed(1), d.profit.toFixed(2)])
  ));

  // Asset Class
  if (assetPerf.length > 0) {
    sections.push('\n=== ASSET CLASS PERFORMANCE ===');
    sections.push(arrayToCsv(
      ['Asset Class', 'Trades', 'P&L ($)'],
      assetPerf.map(a => [a.name, a.value, a.profit.toFixed(2)])
    ));
  }

  downloadFile(sections.join('\n'), `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

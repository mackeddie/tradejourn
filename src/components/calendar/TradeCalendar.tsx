import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon, ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

interface TradeCalendarProps {
  trades: Trade[];
}

interface DayData {
  pnl: number;
  count: number;
  trades: Trade[];
}

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ date: string; data: DayData } | null>(null);

  // Aggregate trades by day
  const dayMap = useMemo(() => {
    const map: Record<string, DayData> = {};
    trades.forEach(trade => {
      const dateStr = trade.exit_date
        ? format(new Date(trade.exit_date), 'yyyy-MM-dd')
        : format(new Date(trade.entry_date), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0, trades: [] };
      map[dateStr].pnl += trade.profit_loss || 0;
      map[dateStr].count += 1;
      map[dateStr].trades.push(trade);
    });
    return map;
  }, [trades]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    let pnl = 0;
    let tradeDays = 0;
    const monthStr = format(currentDate, 'yyyy-MM');
    Object.entries(dayMap).forEach(([key, data]) => {
      if (key.startsWith(monthStr)) {
        pnl += data.pnl;
        tradeDays++;
      }
    });
    return { pnl, tradeDays };
  }, [dayMap, currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const formatPnl = (value: number) => {
    const abs = Math.abs(value).toFixed(0);
    return value >= 0 ? `$${abs}` : `-$${abs}`;
  };

  const formatPnlDetailed = (value: number) => {
    const abs = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${abs}` : `-$${abs}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-display font-bold min-w-[140px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <CalendarIcon className="w-4 h-4 text-muted-foreground ml-1" />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">PnL:</span>
            <span className={cn('font-bold', monthlySummary.pnl >= 0 ? 'text-success' : 'text-destructive')}>
              {formatPnl(monthlySummary.pnl)}
            </span>
          </div>
          <div className="text-muted-foreground">Days: {monthlySummary.tradeDays}</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => (
            <div key={i} className="py-2 text-center text-sm font-semibold text-muted-foreground">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const data = dayMap[key];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const isProfit = data && data.pnl > 0;
            const isLoss = data && data.pnl < 0;
            const isBreakeven = data && data.pnl === 0;

            return (
              <div
                key={key}
                onClick={() => inMonth && data && setSelectedDay({ date: key, data })}
                className={cn(
                  'min-h-[100px] border border-border/30 p-2 flex flex-col items-center transition-colors rounded-lg m-0.5',
                  !inMonth && 'opacity-30',
                  isProfit && 'bg-emerald-100 dark:bg-emerald-900/40',
                  isLoss && 'bg-red-100 dark:bg-red-900/40',
                  isBreakeven && 'bg-muted/50',
                  today && 'ring-2 ring-primary ring-inset',
                  inMonth && data && 'cursor-pointer hover:opacity-80',
                )}
              >
                <div className={cn(
                  'text-base font-bold',
                  today ? 'text-foreground' : 'text-muted-foreground',
                  data && inMonth && 'text-foreground',
                )}>
                  {format(day, 'd')}
                </div>
                {inMonth && data && (
                  <div className="mt-auto flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <span>{data.count}</span>
                      <ArrowLeftRight className="w-3 h-3" />
                    </div>
                    <div className={cn(
                      'text-sm font-bold',
                      isProfit && 'text-success',
                      isLoss && 'text-destructive',
                      isBreakeven && 'text-muted-foreground',
                    )}>
                      {formatPnl(data.pnl)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trade detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{format(new Date(selectedDay.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}</span>
                  <span className={cn(
                    'text-base font-bold',
                    selectedDay.data.pnl >= 0 ? 'text-success' : 'text-destructive',
                  )}>
                    {formatPnlDetailed(selectedDay.data.pnl)}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {selectedDay.data.trades.map(trade => (
                  <div
                    key={trade.id}
                    className={cn(
                      'rounded-lg border p-3 flex items-center gap-3',
                      trade.profit_loss && trade.profit_loss > 0 && 'border-success/30 bg-success/5',
                      trade.profit_loss && trade.profit_loss < 0 && 'border-destructive/30 bg-destructive/5',
                    )}
                  >
                    <div className={cn(
                      'rounded-full p-1.5',
                      trade.direction === 'buy' ? 'bg-success/20' : 'bg-destructive/20',
                    )}>
                      {trade.direction === 'buy'
                        ? <ArrowUpRight className="w-4 h-4 text-success" />
                        : <ArrowDownRight className="w-4 h-4 text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{trade.symbol}</span>
                        <Badge variant="outline" className="text-xs capitalize">{trade.direction}</Badge>
                        {trade.status && (
                          <Badge variant={trade.status === 'win' ? 'default' : trade.status === 'loss' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                            {trade.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {trade.lot_size} lots · {trade.entry_price} → {trade.exit_price ?? '—'}
                        {trade.pips != null && ` · ${trade.pips} pips`}
                      </div>
                    </div>
                    <div className={cn(
                      'text-sm font-bold whitespace-nowrap',
                      (trade.profit_loss ?? 0) >= 0 ? 'text-success' : 'text-destructive',
                    )}>
                      {formatPnlDetailed(trade.profit_loss ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

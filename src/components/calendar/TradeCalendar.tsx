import { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  getYear,
  setYear,
  isToday,
} from 'date-fns';

interface TradeCalendarProps {
  trades: Trade[];
}

interface DayData {
  pnl: number;
  count: number;
}

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get available years from trades
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(getYear(new Date()));
    trades.forEach(t => {
      if (t.exit_date) years.add(getYear(new Date(t.exit_date)));
      years.add(getYear(new Date(t.entry_date)));
    });
    return Array.from(years).sort();
  }, [trades]);

  // Aggregate trades by day (using exit_date for closed trades)
  const dayMap = useMemo(() => {
    const map: Record<string, DayData> = {};
    trades.forEach(trade => {
      const dateStr = trade.exit_date
        ? format(new Date(trade.exit_date), 'yyyy-MM-dd')
        : format(new Date(trade.entry_date), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0 };
      map[dateStr].pnl += trade.profit_loss || 0;
      map[dateStr].count += 1;
    });
    return map;
  }, [trades]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatPnl = (value: number) => {
    const abs = Math.abs(value).toFixed(2);
    return value >= 0 ? `$${abs}` : `-$${abs}`;
  };

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-1">
        {availableYears.map(year => (
          <Button
            key={year}
            variant={getYear(currentDate) === year ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentDate(setYear(currentDate, year))}
          >
            {year}
          </Button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-semibold">
            {format(currentDate, 'MMMM')}
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-secondary">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const data = dayMap[key];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const isProfit = data && data.pnl > 0;
            const isLoss = data && data.pnl < 0;

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[90px] border border-border/50 p-2 transition-colors',
                  !inMonth && 'opacity-40',
                  today && 'ring-2 ring-primary ring-inset',
                  data && isProfit && 'bg-success/15',
                  data && isLoss && 'bg-destructive/15',
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'd')}
                </div>
                {inMonth && (
                  <div className="mt-1 text-center">
                    <div
                      className={cn(
                        'text-sm font-semibold',
                        isProfit && 'text-success',
                        isLoss && 'text-destructive',
                        !data && 'text-muted-foreground',
                      )}
                    >
                      {data ? formatPnl(data.pnl) : '$0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data ? data.count : 0} trades
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

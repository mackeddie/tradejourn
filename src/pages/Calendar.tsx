import { AppLayout } from '@/components/layout/AppLayout';
import { TradeCalendar } from '@/components/calendar/TradeCalendar';
import { useTrades } from '@/hooks/useTrades';
import { Skeleton } from '@/components/ui/skeleton';

export default function Calendar() {
  const { trades, loading } = useTrades();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Trade Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Daily P&L overview at a glance
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <TradeCalendar trades={trades} />
        )}
      </div>
    </AppLayout>
  );
}

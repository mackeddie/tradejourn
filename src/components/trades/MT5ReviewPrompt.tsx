import { useEffect, useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Trade } from '@/types/trade';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PreTradeChecklist, PreTradeChecklistValues } from '@/components/tools/PreTradeChecklist';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MT5ReviewPrompt() {
  const { trades, updateTrade } = useTrades();
  const [open, setOpen] = useState(false);
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [checklistValues, setChecklistValues] = useState<PreTradeChecklistValues>({});
  const [emotions, setEmotions] = useState<string[]>([]);
  const navigate = useNavigate();

  const pendingTrades = useMemo(
    () =>
      trades.filter(
        (t) => t.needs_review && t.strategy === 'MT5 Auto-Sync'
      ),
    [trades]
  );

  useEffect(() => {
    if (pendingTrades.length === 0) {
      setOpen(false);
      setActiveTradeId(null);
      return;
    }

    const current =
      pendingTrades.find((t) => t.id === activeTradeId) ||
      pendingTrades[0];

    setActiveTradeId(current.id);
    setChecklistValues({
      setup_type: current.setup_type || '',
      probability: current.probability || '',
      rule_in_plan: (current.rule_in_plan as PreTradeChecklistValues['rule_in_plan']) || '',
      rule_bos: (current.rule_bos as PreTradeChecklistValues['rule_bos']) || '',
      rule_liquidity: (current.rule_liquidity as PreTradeChecklistValues['rule_liquidity']) || '',
      rule_trend: (current.rule_trend as PreTradeChecklistValues['rule_trend']) || '',
      rule_news: (current.rule_news as PreTradeChecklistValues['rule_news']) || '',
      rule_rr: (current.rule_rr as PreTradeChecklistValues['rule_rr']) || '',
      rule_emotions: (current.rule_emotions as PreTradeChecklistValues['rule_emotions']) || '',
      rule_lot_size: (current.rule_lot_size as PreTradeChecklistValues['rule_lot_size']) || '',
    });
    setEmotions(current.emotions_array || []);
    setOpen(true);
  }, [pendingTrades, activeTradeId]);

  const activeTrade: Trade | undefined = useMemo(
    () => pendingTrades.find((t) => t.id === activeTradeId) || pendingTrades[0],
    [pendingTrades, activeTradeId]
  );

  const handleSave = async () => {
    if (!activeTradeId) return;

    await updateTrade(activeTradeId, {
      setup_type: checklistValues.setup_type,
      probability: checklistValues.probability,
      rule_in_plan: checklistValues.rule_in_plan,
      rule_bos: checklistValues.rule_bos,
      rule_liquidity: checklistValues.rule_liquidity,
      rule_trend: checklistValues.rule_trend,
      rule_news: checklistValues.rule_news,
      rule_rr: checklistValues.rule_rr,
      rule_emotions: checklistValues.rule_emotions,
      rule_lot_size: checklistValues.rule_lot_size,
      emotions_array: emotions,
      needs_review: false,
    });

    if (pendingTrades.length <= 1) {
      setOpen(false);
      setActiveTradeId(null);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  const handleOpenFullEditor = () => {
    if (!activeTradeId) return;
    setOpen(false);
    navigate(`/trades/${activeTradeId}`);
  };

  if (!activeTrade || pendingTrades.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review new MT5 trade</DialogTitle>
          <DialogDescription>
            A new trade from MT5 was synced. Confirm the setup details before you fully log it in your journal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <div className="font-medium">
                {activeTrade.symbol}{' '}
                <Badge variant="outline" className="ml-1">
                  {activeTrade.direction?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Ticket {activeTrade.mt5_ticket || '-'} ·{' '}
                {new Date(activeTrade.entry_date).toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {pendingTrades.length} MT5 trade
              {pendingTrades.length > 1 ? 's need' : ' needs'} review
            </div>
          </div>

          <PreTradeChecklist
            values={checklistValues}
            onChange={setChecklistValues}
            hideStatusBanner
          />

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium">How were you feeling?</h4>
            <div className="flex flex-wrap gap-2">
              {['Confident', 'Anxious', 'FOMO', 'Revenge'].map((feeling) => {
                const isSelected = emotions.includes(feeling);
                return (
                  <Button
                    key={feeling}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setEmotions(prev =>
                        isSelected ? prev.filter(f => f !== feeling) : [...prev, feeling]
                      );
                    }}
                    className={cn(
                      "rounded-full px-4 h-8 text-xs font-normal",
                      isSelected && feeling === 'Confident' && "bg-green-500 hover:bg-green-600 border-none",
                      isSelected && feeling === 'Anxious' && "bg-yellow-500 hover:bg-yellow-600 border-none",
                      isSelected && (feeling === 'FOMO' || feeling === 'Revenge') && "bg-red-500 hover:bg-red-600 border-none",
                      !isSelected && "bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {feeling}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleSkip}>
            Remind me later
          </Button>
          <Button variant="ghost" onClick={handleOpenFullEditor}>
            Open full trade
          </Button>
          <Button onClick={handleSave}>
            Save checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


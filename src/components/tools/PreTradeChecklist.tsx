import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClipboardCheck, Target, Zap, AlertTriangle } from 'lucide-react';

const RULES = [
  {
    field: 'rule_in_plan',
    label: 'In trading plan?',
    description: 'Is this setup clearly defined in your trading plan?',
  },
  {
    field: 'rule_bos',
    label: 'BoS confirmed?',
    description: 'Has market structure clearly broken in your trade direction?',
  },
  {
    field: 'rule_liquidity',
    label: 'Liquidity identified?',
    description: 'Have you identified key liquidity pools and levels?',
  },
  {
    field: 'rule_trend',
    label: 'With the trend?',
    description: 'Are you trading in line with the higher-timeframe trend?',
  },
  {
    field: 'rule_news',
    label: 'Checked news?',
    description: 'Have you checked the calendar for high-impact news?',
  },
  {
    field: 'rule_rr',
    label: 'R:R ≥ 1:2?',
    description: 'Is the minimum risk-to-reward ratio at least 1:2?',
  },
  {
    field: 'rule_emotions',
    label: 'Emotionally calm?',
    description: 'Are you calm, focused and not trading from FOMO or revenge?',
  },
  {
    field: 'rule_lot_size',
    label: 'Correct lot size?',
    description: 'Is your position size correct for your planned risk?',
  },
] as const;

export type ChecklistRuleField = (typeof RULES)[number]['field'];
export type ChecklistRuleAnswer = 'yes' | 'no' | 'n/a' | '';

export interface PreTradeChecklistValues {
  setup_type?: string;
  probability?: string;
  rule_in_plan?: ChecklistRuleAnswer;
  rule_bos?: ChecklistRuleAnswer;
  rule_liquidity?: ChecklistRuleAnswer;
  rule_trend?: ChecklistRuleAnswer;
  rule_news?: ChecklistRuleAnswer;
  rule_rr?: ChecklistRuleAnswer;
  rule_emotions?: ChecklistRuleAnswer;
  rule_lot_size?: ChecklistRuleAnswer;
}

interface PreTradeChecklistProps {
  values?: PreTradeChecklistValues;
  onChange?: (values: PreTradeChecklistValues) => void;
  onReadyChange?: (ready: boolean) => void;
  hideStatusBanner?: boolean;
}

const DEFAULT_VALUES: PreTradeChecklistValues = {
  setup_type: '',
  probability: '',
  rule_in_plan: '',
  rule_bos: '',
  rule_liquidity: '',
  rule_trend: '',
  rule_news: '',
  rule_rr: '',
  rule_emotions: '',
  rule_lot_size: '',
};

export function PreTradeChecklist({
  values,
  onChange,
  onReadyChange,
  hideStatusBanner,
}: PreTradeChecklistProps) {
  const [internalValues, setInternalValues] = useState<PreTradeChecklistValues>(DEFAULT_VALUES);

  const currentValues = values ?? internalValues;

  const updateValues = (patch: Partial<PreTradeChecklistValues>) => {
    const next = { ...currentValues, ...patch };
    if (onChange) {
      onChange(next);
    } else {
      setInternalValues(next);
    }
  };

  const allRulesAnswered = RULES.every((rule) => {
    const value = currentValues[rule.field as ChecklistRuleField];
    return value === 'yes' || value === 'no' || value === 'n/a';
  });

  const isReady =
    allRulesAnswered &&
    !!currentValues.setup_type &&
    !!currentValues.probability;

  useEffect(() => {
    if (onReadyChange) {
      onReadyChange(isReady);
    }
  }, [isReady, onReadyChange]);

  return (
    <Card className="gradient-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          Pre-Trade Checklist
        </CardTitle>
        <CardDescription>
          Verify your rules before taking the setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Setup Type
          </Label>
          <RadioGroup
            value={currentValues.setup_type || ''}
            onValueChange={(value) =>
              updateValues({ setup_type: value })
            }
            className="grid grid-cols-3 gap-2"
          >
            {['Type 1', 'Type 2', 'Type 3'].map((type) => (
              <div key={type}>
                <RadioGroupItem
                  value={type}
                  id={type}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={type}
                  className="flex items-center justify-center p-2 text-xs rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                >
                  {type}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Probability Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Probability
          </Label>
          <RadioGroup
            value={currentValues.probability || ''}
            onValueChange={(value) =>
              updateValues({ probability: value })
            }
            className="grid grid-cols-2 gap-2"
          >
            {['High Prob', 'Low Prob'].map((prob) => (
              <div key={prob}>
                <RadioGroupItem
                  value={prob}
                  id={prob}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={prob}
                  className="flex items-center justify-center p-2 text-xs rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                >
                  {prob}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Technical Rules */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Technical Rules
          </Label>
          <div className="space-y-2">
            {RULES.map((rule) => {
              const value = (currentValues[
                rule.field as ChecklistRuleField
              ] || '') as ChecklistRuleAnswer;

              return (
                <div
                  key={rule.field}
                  className="flex flex-col space-y-1 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      {rule.label}
                    </span>
                    <RadioGroup
                      value={value}
                      onValueChange={(answer) =>
                        updateValues({
                          [rule.field]:
                            answer as ChecklistRuleAnswer,
                        } as Partial<PreTradeChecklistValues>)
                      }
                      className="flex items-center gap-2"
                    >
                      {['yes', 'no', 'n/a'].map((option) => (
                        <div
                          key={option}
                          className="flex items-center gap-1"
                        >
                          <RadioGroupItem
                            value={option}
                            id={`${rule.field}-${option}`}
                            className="h-3 w-3"
                          />
                          <Label
                            htmlFor={`${rule.field}-${option}`}
                            className="text-[11px] font-normal cursor-pointer uppercase"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {rule.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {!hideStatusBanner && (
          <>
            {isReady && (
              <div className="mt-4 p-3 rounded-lg bg-chart-profit/10 border border-chart-profit/20 text-chart-profit text-sm font-medium animate-in fade-in slide-in-from-top-1">
                ✨ All criteria met! You are disciplined and ready to trade.
              </div>
            )}

            {!isReady &&
              (currentValues.setup_type ||
                currentValues.probability ||
                RULES.some((rule) => currentValues[rule.field as ChecklistRuleField])) && (
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 text-muted-foreground text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Finish all selections to confirm readiness.
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

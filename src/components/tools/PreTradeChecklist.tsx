import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClipboardCheck, Target, Zap, AlertTriangle } from 'lucide-react';

const RULES = [
    "Is this setup in my trading plan?",
    "Technical: Break of Structure (BoS) confirmed?",
    "Technical: Liquidity levels identified?",
    "Am I trading with the trend?",
    "Did I check the news calendar for high-impact events?",
    "Is the risk-to-reward ratio at least 1:2?",
    "Am I emotionally calm and focused?",
    "Did I calculate the correct lot size for this risk?"
];

export function PreTradeChecklist() {
    const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});
    const [setupType, setSetupType] = useState<string>("");
    const [probability, setProbability] = useState<string>("");

    const toggleRule = (index: number) => {
        setCheckedRules(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const allRulesChecked = RULES.length === Object.values(checkedRules).filter(Boolean).length;
    const isReady = allRulesChecked && setupType !== "" && probability !== "";

    return (
        <Card className="gradient-card h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    Pre-Trade Checklist
                </CardTitle>
                <CardDescription>Verify your rules before taking the setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Setup Type Selection */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Setup Type
                    </Label>
                    <RadioGroup value={setupType} onValueChange={setSetupType} className="grid grid-cols-3 gap-2">
                        {['Type 1', 'Type 2', 'Type 3'].map((type) => (
                            <div key={type}>
                                <RadioGroupItem value={type} id={type} className="peer sr-only" />
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
                    <RadioGroup value={probability} onValueChange={setProbability} className="grid grid-cols-2 gap-2">
                        {['High Prob', 'Low Prob'].map((prob) => (
                            <div key={prob}>
                                <RadioGroupItem value={prob} id={prob} className="peer sr-only" />
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
                        {RULES.map((rule, index) => (
                            <div key={index} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    id={`rule-${index}`}
                                    checked={checkedRules[index] || false}
                                    onCheckedChange={() => toggleRule(index)}
                                    className="mt-0.5"
                                />
                                <Label
                                    htmlFor={`rule-${index}`}
                                    className={`text-xs leading-tight cursor-pointer ${checkedRules[index] ? 'text-muted-foreground line-through' : ''}`}
                                >
                                    {rule}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {isReady && (
                    <div className="mt-4 p-3 rounded-lg bg-chart-profit/10 border border-chart-profit/20 text-chart-profit text-sm font-medium animate-in fade-in slide-in-from-top-1">
                        ✨ All criteria met! You are disciplined and ready to trade.
                    </div>
                )}

                {!isReady && (setupType || probability || Object.keys(checkedRules).length > 0) && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 text-muted-foreground text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Finish all selections to confirm readiness.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

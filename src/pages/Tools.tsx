import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RiskCalculator } from '@/components/tools/RiskCalculator';
import { PreTradeChecklist, PreTradeChecklistValues } from '@/components/tools/PreTradeChecklist';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calculator, ClipboardCheck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Tools() {
    const [checklistValues, setChecklistValues] = useState<PreTradeChecklistValues>({});
    const navigate = useNavigate();

    const handleUseInNewTrade = () => {
        navigate('/trades/new', { state: { checklist: checklistValues } });
    };

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Wrench className="w-8 h-8 text-primary" />
                        </div>
                        Trading Tools
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Professional resources to help you maintain discipline and manage risk effectively.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <RiskCalculator />
                    </div>
                    <div className="space-y-4">
                        <PreTradeChecklist
                            values={checklistValues}
                            onChange={setChecklistValues}
                        />
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <p>
                                Use this checklist before taking a trade. You can send these answers into a new journal entry.
                            </p>
                            <Button size="sm" onClick={handleUseInNewTrade}>
                                Use in new trade
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Card className="bg-muted/30 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Coming Soon</CardTitle>
                            <CardDescription>We're building even more tools for professional traders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">• Position Scaling Calculator</li>
                                <li className="flex items-center gap-2">• Correlation Matrix</li>
                                <li className="flex items-center gap-2">• News Impact Calibrator</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

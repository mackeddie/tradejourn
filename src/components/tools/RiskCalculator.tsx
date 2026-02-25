import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Info } from 'lucide-react';

export function RiskCalculator() {
    const [accountSize, setAccountSize] = useState<number>(10000);
    const [riskPercent, setRiskPercent] = useState<number>(1);
    const [stopLossPips, setStopLossPips] = useState<number>(20);
    const [pipValue, setPipValue] = useState<number>(10); // Standard lot default
    const [lotSize, setLotSize] = useState<number>(0);
    const [riskAmount, setRiskAmount] = useState<number>(0);

    useEffect(() => {
        const calculatedRiskAmount = (accountSize * riskPercent) / 100;
        setRiskAmount(calculatedRiskAmount);

        if (stopLossPips > 0 && pipValue > 0) {
            // Basic formula: Lot Size = Risk Amount / (Stop Loss * Pip Value)
            // For Forex: Lot Size = Risk Amount / (Stop Loss * 10) [assuming 1 lot = $10/pip]
            const calculatedLotSize = calculatedRiskAmount / (stopLossPips * pipValue);
            setLotSize(Number(calculatedLotSize.toFixed(2)));
        } else {
            setLotSize(0);
        }
    }, [accountSize, riskPercent, stopLossPips, pipValue]);

    return (
        <Card className="gradient-card h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Risk Calculator
                </CardTitle>
                <CardDescription>Calculate your position size before entering a trade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="accountSize">Account Balance ($)</Label>
                        <Input
                            id="accountSize"
                            type="number"
                            value={accountSize}
                            onChange={(e) => setAccountSize(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="riskPercent">Risk Percentage (%)</Label>
                        <Input
                            id="riskPercent"
                            type="number"
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stopLossPips">Stop Loss (Pips)</Label>
                        <Input
                            id="stopLossPips"
                            type="number"
                            value={stopLossPips}
                            onChange={(e) => setStopLossPips(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pipValue">Pip Value ($ per full lot)</Label>
                        <Input
                            id="pipValue"
                            type="number"
                            value={pipValue}
                            onChange={(e) => setPipValue(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Amount to Risk:</span>
                        <span className="text-lg font-bold text-foreground">${riskAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Lot Size:</span>
                        <span className="text-2xl font-display font-bold text-primary">{lotSize}</span>
                    </div>
                </div>

                <div className="flex gap-2 p-3 rounded-md bg-muted/50 text-[10px] leading-tight text-muted-foreground">
                    <Info className="w-3 h-3 shrink-0" />
                    <p>
                        Standard lot calculation. For Forex, $10 pip value is typical for EURUSD.
                        Adjust based on your broker's contract specifications.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

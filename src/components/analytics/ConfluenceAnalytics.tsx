import { Trade } from '@/types/trade';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getRulePerformance, getEmotionPerformance, getSetupQualityStats } from '@/utils/analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export function ConfluenceAnalytics({ trades }: { trades: Trade[] }) {
    const ruleData = getRulePerformance(trades);
    const emotionData = getEmotionPerformance(trades);
    const qualityData = getSetupQualityStats(trades);

    // Use profit/loss colors dynamically for bars
    const getPLColor = (pl: number) => {
        return pl >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))";
    };

    if (ruleData.length === 0 && emotionData.length === 0 && qualityData.length === 0) {
        return null; // hide if user has never used confluence checklist yet
    }

    return (
        <div className="space-y-6 mt-12 animate-fade-in">
            <div>
                <h2 className="text-2xl font-display font-semibold">Confluence & Psychology</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Discover which technical rules and emotions lead to your most profitable trades.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Win Rate by Technical Rule */}
                <Card className="gradient-card">
                    <CardHeader>
                        <CardTitle className="font-display">Technical Rules</CardTitle>
                        <CardDescription>Performance when rule is checked "Yes"</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ruleData.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                No technical rule data recorded yet
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ruleData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis
                                            type="number"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `${val}%`}
                                            domain={[0, 100]}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="rule"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={80}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(val: number, name: string, props: any) => {
                                                if (name === 'winRate') return [`${val.toFixed(1)}%`, 'Win Rate'];
                                                return [val, name];
                                            }}
                                            labelFormatter={(label) => `Rule: ${label}`}
                                        />
                                        <Bar
                                            dataKey="winRate"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {ruleData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* P&L by Emotional State */}
                <Card className="gradient-card">
                    <CardHeader>
                        <CardTitle className="font-display">Psychology Edge</CardTitle>
                        <CardDescription>Expectancy per emotion (Value per trade)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {emotionData.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                No emotions recorded yet
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionData} layout="vertical" margin={{ left: 30, right: 20 }}>
                                        <XAxis
                                            type="number"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `$${val}`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="emotion"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={85}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(val: number, name: string, props: any) => {
                                                const data = props.payload;
                                                if (name === 'expectancy') return [`$${val.toFixed(2)}`, 'Expectancy'];
                                                if (name === 'winRate') return [`${val.toFixed(1)}%`, 'Win Rate'];
                                                if (name === 'count') return [val, 'Trade Count'];
                                                return [val, name];
                                            }}
                                        />
                                        <Bar
                                            dataKey="expectancy"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {emotionData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.expectancy >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Setup Quality Distribution */}
                <Card className="gradient-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-display">Model Setup Breakdown</CardTitle>
                        <CardDescription>Metrics based on subjective setup graded quality</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {qualityData.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                No setups recorded yet
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={qualityData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis
                                            type="number"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `$${val}`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="quality"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={40}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(val: number, name: string, props: any) => {
                                                if (name === 'expectancy') return [`$${val.toFixed(2)}`, 'Expectancy Value'];
                                                return [val, name];
                                            }}
                                        />
                                        <Bar
                                            dataKey="expectancy"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {qualityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.expectancy >= 0 ? "hsl(var(--accent))" : "hsl(var(--chart-loss))"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { TradeFormData, AssetClass, TradeDirection, TradeStatus, ExitReason } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  asset_class: z.enum(['forex', 'crypto', 'commodities', 'stocks']),
  direction: z.enum(['buy', 'sell']),
  entry_date: z.string().min(1, 'Entry date is required'),
  exit_date: z.string().optional(),
  entry_price: z.coerce.number().positive('Entry price must be positive'),
  exit_price: z.coerce.number().positive().optional().or(z.literal('')),
  lot_size: z.coerce.number().positive('Lot size must be positive'),
  stop_loss: z.coerce.number().positive().optional().or(z.literal('')),
  take_profit: z.coerce.number().positive().optional().or(z.literal('')),
  status: z.enum(['win', 'loss', 'breakeven']),
  exit_reason: z.enum(['sl_hit', 'tp_hit', 'manual_close', 'breakeven']),
  risk_reward_ratio: z.coerce.number().positive().optional().or(z.literal('')),
  pips: z.coerce.number().optional().or(z.literal('')),
  risk_amount: z.coerce.number().positive().optional().or(z.literal('')),
  reward_amount: z.coerce.number().optional().or(z.literal('')),
  strategy: z.string().max(100, 'Strategy too long').optional(),
  reasoning: z.string().max(1000, 'Reasoning too long').optional(),
  emotions: z.string().max(500, 'Emotions too long').optional(),
  lessons: z.string().max(1000, 'Lessons too long').optional(),
});

type FormData = z.infer<typeof tradeSchema>;

export default function NewTrade() {
  const [isLoading, setIsLoading] = useState(false);
  const { addTrade } = useTrades();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: '',
      asset_class: 'forex',
      direction: 'buy',
      entry_date: new Date().toISOString().slice(0, 16),
      exit_date: new Date().toISOString().slice(0, 16),
      entry_price: undefined,
      exit_price: '',
      lot_size: 0.01,
      stop_loss: '',
      take_profit: '',
      status: 'win',
      exit_reason: 'tp_hit',
      risk_reward_ratio: '',
      pips: '',
      risk_amount: '',
      reward_amount: '',
      strategy: '',
      reasoning: '',
      emotions: '',
      lessons: '',
    },
  });

  const watchStatus = form.watch('status');
  const watchExitReason = form.watch('exit_reason');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const tradeData: TradeFormData = {
      symbol: data.symbol.trim(),
      asset_class: data.asset_class as AssetClass,
      direction: data.direction as TradeDirection,
      entry_date: new Date(data.entry_date),
      exit_date: data.exit_date ? new Date(data.exit_date) : undefined,
      entry_price: data.entry_price,
      exit_price: data.exit_price ? Number(data.exit_price) : undefined,
      lot_size: data.lot_size,
      stop_loss: data.stop_loss ? Number(data.stop_loss) : undefined,
      take_profit: data.take_profit ? Number(data.take_profit) : undefined,
      status: data.status as TradeStatus,
      exit_reason: data.exit_reason as ExitReason,
      risk_reward_ratio: data.risk_reward_ratio ? Number(data.risk_reward_ratio) : undefined,
      pips: data.pips ? Number(data.pips) : undefined,
      risk_amount: data.risk_amount ? Number(data.risk_amount) : undefined,
      reward_amount: data.reward_amount ? Number(data.reward_amount) : undefined,
      strategy: data.strategy?.trim() || undefined,
      reasoning: data.reasoning?.trim() || undefined,
      emotions: data.emotions?.trim() || undefined,
      lessons: data.lessons?.trim() || undefined,
    };

    const { error } = await addTrade(tradeData);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error adding trade',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/trades');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-6">
          <Link 
            to="/trades" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trades
          </Link>
          <h1 className="text-3xl font-display font-bold">Log Trade</h1>
          <p className="text-muted-foreground mt-1">Record your completed trade with all details</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="outcome" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="outcome">Outcome</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="outcome">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Trade Outcome
                    </CardTitle>
                    <CardDescription>What was the result of this trade?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Selection */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Result</FormLabel>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'win', label: 'Win', icon: TrendingUp, color: 'text-chart-profit' },
                              { value: 'loss', label: 'Loss', icon: TrendingDown, color: 'text-chart-loss' },
                              { value: 'breakeven', label: 'Breakeven', icon: Target, color: 'text-muted-foreground' },
                            ].map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                                  field.value === option.value 
                                    ? "border-primary bg-primary/10" 
                                    : "border-muted hover:border-muted-foreground/50"
                                )}
                              >
                                <option.icon className={cn("w-6 h-6", option.color)} />
                                <span className="font-medium">{option.label}</span>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Exit Reason */}
                    <FormField
                      control={form.control}
                      name="exit_reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you exit?</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'tp_hit', label: 'Take Profit Hit', icon: TrendingUp },
                              { value: 'sl_hit', label: 'Stop Loss Hit', icon: AlertTriangle },
                              { value: 'manual_close', label: 'Manual Close', icon: Target },
                              { value: 'breakeven', label: 'Moved to Breakeven', icon: Target },
                            ].map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                                  field.value === option.value 
                                    ? "border-primary bg-primary/10" 
                                    : "border-muted hover:border-muted-foreground/50"
                                )}
                              >
                                <option.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{option.label}</span>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Risk/Reward */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="risk_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="50.00" {...field} />
                            </FormControl>
                            <FormDescription>How much did you risk?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reward_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {watchStatus === 'loss' ? 'Loss Amount ($)' : 'Profit Amount ($)'}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="100.00" {...field} />
                            </FormControl>
                            <FormDescription>
                              {watchStatus === 'loss' ? 'How much did you lose?' : 'How much did you make?'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="risk_reward_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk:Reward Ratio</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="2.0" {...field} />
                            </FormControl>
                            <FormDescription>e.g., 2 means 1:2 R:R</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pips"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pips {watchStatus === 'loss' && '(negative)'}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="25" {...field} />
                            </FormControl>
                            <FormDescription>Pips gained/lost</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="font-display">Trade Details</CardTitle>
                    <CardDescription>Enter the trade specifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pair/Symbol</FormLabel>
                            <FormControl>
                              <Input placeholder="EURUSD, BTCUSD, AAPL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="asset_class"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="forex">Forex</SelectItem>
                                <SelectItem value="crypto">Crypto</SelectItem>
                                <SelectItem value="commodities">Commodities</SelectItem>
                                <SelectItem value="stocks">Stocks/Indices</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direction</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="buy">Buy (Long)</SelectItem>
                                <SelectItem value="sell">Sell (Short)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lot_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lot Size / Position Size</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="entry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Date & Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exit_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Date & Time</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="entry_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="1.08500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exit_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="1.09000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stop_loss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stop Loss Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="1.08200" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="take_profit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Take Profit Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="1.09500" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="strategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy / Setup Used</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Breakout, Trend Following, Support Bounce" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="font-display">Trade Analysis</CardTitle>
                    <CardDescription>Document your thoughts for performance review</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="reasoning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why did you take this trade?</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your analysis, confluence factors, and what made you enter..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emotions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emotional State</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How were you feeling? Confident, anxious, FOMO, revenge trading?"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lessons"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lessons Learned</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What did you learn? What would you do differently next time?"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" asChild>
                <Link to="/trades">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Log Trade
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

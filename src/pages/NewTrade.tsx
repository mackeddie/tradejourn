import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  lessons: z.string().max(1000, 'Lessons too long').optional(),
  tags: z.string().optional(), // We'll handle comma separation
  screenshot_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  setup_type: z.enum(['Type 1', 'Type 2', 'Type 3']).optional().or(z.literal('')),
  probability: z.enum(['High Prob', 'Low Prob']).optional().or(z.literal('')),
  // New Checklist Fields
  rule_in_plan: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_bos: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_liquidity: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_trend: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_news: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_rr: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_emotions: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  rule_lot_size: z.enum(['yes', 'no', 'n/a']).optional().or(z.literal('')),
  emotions_array: z.array(z.string()).optional(),
  lessons_learned: z.string().max(1000, 'Lessons too long').optional(),
});

type FormData = z.infer<typeof tradeSchema>;

export default function NewTrade() {
  const [isLoading, setIsLoading] = useState(false);
  const { trades, addTrade, updateTrade } = useTrades();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const existingTrade = isEditing ? trades.find(t => t.id === id) : null;

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
      tags: '',
      screenshot_url: '',
      setup_type: '',
      probability: '',
    },
  });

  useEffect(() => {
    if (existingTrade) {
      form.reset({
        symbol: existingTrade.symbol,
        asset_class: existingTrade.asset_class as AssetClass,
        direction: existingTrade.direction as TradeDirection,
        entry_date: new Date(existingTrade.entry_date).toISOString().slice(0, 16),
        exit_date: existingTrade.exit_date ? new Date(existingTrade.exit_date).toISOString().slice(0, 16) : '',
        entry_price: existingTrade.entry_price,
        exit_price: existingTrade.exit_price ?? '',
        lot_size: existingTrade.lot_size,
        stop_loss: existingTrade.stop_loss ?? '',
        take_profit: existingTrade.take_profit ?? '',
        status: (existingTrade.status as TradeStatus) ?? 'win',
        exit_reason: (existingTrade.exit_reason as ExitReason) ?? 'tp_hit',
        risk_reward_ratio: existingTrade.risk_reward_ratio ?? '',
        pips: existingTrade.pips ?? '',
        risk_amount: existingTrade.risk_amount ?? '',
        reward_amount: existingTrade.reward_amount ?? '',
        strategy: existingTrade.strategy ?? '',
        lessons: existingTrade.lessons ?? '',
        tags: existingTrade.tags?.join(', ') ?? '',
        screenshot_url: existingTrade.screenshot_url ?? '',
        setup_type: (existingTrade.setup_type as "Type 1" | "Type 2" | "Type 3") ?? '',
        probability: (existingTrade.probability as "High Prob" | "Low Prob") ?? '',
      });
    }
  }, [existingTrade]);

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
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      screenshot_url: data.screenshot_url || undefined,
      setup_type: data.setup_type || undefined,
      probability: data.probability || undefined,
      rule_in_plan: data.rule_in_plan || undefined,
      rule_bos: data.rule_bos || undefined,
      rule_liquidity: data.rule_liquidity || undefined,
      rule_trend: data.rule_trend || undefined,
      rule_news: data.rule_news || undefined,
      rule_rr: data.rule_rr || undefined,
      rule_emotions: data.rule_emotions || undefined,
      rule_lot_size: data.rule_lot_size || undefined,
      emotions_array: data.emotions_array || undefined,
      lessons_learned: data.lessons_learned?.trim() || undefined,
      needs_review: false, // Clearing review flag on save
    };

    const { error } = isEditing && id
      ? await updateTrade(id, tradeData)
      : await addTrade(tradeData);
    setIsLoading(false);

    if (error) {
      toast({
        title: isEditing ? 'Error updating trade' : 'Error adding trade',
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
          <h1 className="text-3xl font-display font-bold">{isEditing ? 'Edit Trade' : 'Log Trade'}</h1>
          <p className="text-muted-foreground mt-1">{isEditing ? 'Update your trade details' : 'Record your completed trade with all details'}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="outcome" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="outcome">Outcome</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="confluence">Confluence</TabsTrigger>
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

              <TabsContent value="confluence">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="font-display">Technical Confluence</CardTitle>
                    <CardDescription>What made this setup valid?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="setup_type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Setup Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-3 gap-4"
                            >
                              {['Type 1', 'Type 2', 'Type 3'].map((type) => (
                                <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value={type} />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Trade Probability</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              {['High Prob', 'Low Prob'].map((prob) => (
                                <FormItem key={prob} className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value={prob} />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {prob}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium text-sm">Technical Rules checklist</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          { name: 'rule_in_plan', label: 'In trading plan?' },
                          { name: 'rule_bos', label: 'BoS confirmed?' },
                          { name: 'rule_liquidity', label: 'Liquidity identified?' },
                          { name: 'rule_trend', label: 'With the trend?' },
                          { name: 'rule_news', label: 'Checked news?' },
                          { name: 'rule_rr', label: 'R:R at least 1:2?' },
                          { name: 'rule_emotions', label: 'Emotionally calm?' },
                          { name: 'rule_lot_size', label: 'Correct lot size?' },
                        ].map((rule) => (
                          <FormField
                            key={rule.name}
                            control={form.control}
                            name={rule.name as any}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">{rule.label}</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex gap-4"
                                  >
                                    {['yes', 'no', 'n/a'].map((option) => (
                                      <FormItem key={option} className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value={option} className="h-3 w-3" />
                                        </FormControl>
                                        <FormLabel className="text-xs font-normal cursor-pointer capitalize">
                                          {option}
                                        </FormLabel>
                                      </FormItem>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input placeholder="trend, reversal, breakout (comma separated)" {...field} />
                            </FormControl>
                            <FormDescription>Separate tags with commas</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="screenshot_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Screenshot URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://tradingview.com/x/..." {...field} />
                            </FormControl>
                            <FormDescription>Link to your chart screenshot</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                      name="emotions_array"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How were you feeling?</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2">
                              {['Confident', 'Anxious', 'FOMO', 'Revenge'].map((feeling) => {
                                const isSelected = (field.value || []).includes(feeling);
                                return (
                                  <Button
                                    key={feeling}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      const newValue = isSelected
                                        ? (field.value || []).filter((f: string) => f !== feeling)
                                        : [...(field.value || []), feeling];
                                      field.onChange(newValue);
                                    }}
                                    className={cn(
                                      "rounded-full px-4",
                                      isSelected && feeling === 'Confident' && "bg-green-500 hover:bg-green-600",
                                      isSelected && feeling === 'Anxious' && "bg-yellow-500 hover:bg-yellow-600",
                                      isSelected && (feeling === 'FOMO' || feeling === 'Revenge') && "bg-red-500 hover:bg-red-600"
                                    )}
                                  >
                                    {feeling}
                                  </Button>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lessons_learned"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lessons Learned</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What did this trade teach you about your discipline or strategy?"
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
                {isEditing ? 'Update Trade' : 'Log Trade'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

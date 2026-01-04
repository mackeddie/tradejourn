import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { TradeFormData, AssetClass, TradeDirection } from '@/types/trade';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  asset_class: z.enum(['forex', 'crypto', 'commodities', 'stocks']),
  direction: z.enum(['buy', 'sell']),
  entry_date: z.string().min(1, 'Entry date is required'),
  exit_date: z.string().optional(),
  entry_price: z.coerce.number().positive('Entry price must be positive'),
  exit_price: z.coerce.number().positive().optional().or(z.literal('')),
  lot_size: z.coerce.number().positive('Lot size must be positive'),
  stop_loss: z.coerce.number().positive().optional().or(z.literal('')),
  take_profit: z.coerce.number().positive().optional().or(z.literal('')),
  strategy: z.string().optional(),
  reasoning: z.string().optional(),
  emotions: z.string().optional(),
  lessons: z.string().optional(),
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
      exit_date: '',
      entry_price: undefined,
      exit_price: '',
      lot_size: 0.01,
      stop_loss: '',
      take_profit: '',
      strategy: '',
      reasoning: '',
      emotions: '',
      lessons: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const tradeData: TradeFormData = {
      symbol: data.symbol,
      asset_class: data.asset_class as AssetClass,
      direction: data.direction as TradeDirection,
      entry_date: new Date(data.entry_date),
      exit_date: data.exit_date ? new Date(data.exit_date) : undefined,
      entry_price: data.entry_price,
      exit_price: data.exit_price ? Number(data.exit_price) : undefined,
      lot_size: data.lot_size,
      stop_loss: data.stop_loss ? Number(data.stop_loss) : undefined,
      take_profit: data.take_profit ? Number(data.take_profit) : undefined,
      strategy: data.strategy || undefined,
      reasoning: data.reasoning || undefined,
      emotions: data.emotions || undefined,
      lessons: data.lessons || undefined,
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
          <h1 className="text-3xl font-display font-bold">Add New Trade</h1>
          <p className="text-muted-foreground mt-1">Log a new trade with all the details</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Trade Details</TabsTrigger>
                <TabsTrigger value="notes">Notes & Psychology</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle className="font-display">Trade Information</CardTitle>
                    <CardDescription>Enter the basic trade details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symbol</FormLabel>
                            <FormControl>
                              <Input placeholder="EURUSD, BTCUSD, etc." {...field} />
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
                            <FormLabel>Lot Size</FormLabel>
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
                            <FormLabel>Exit Date & Time (Optional)</FormLabel>
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
                            <FormLabel>Exit Price (Optional)</FormLabel>
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
                            <FormLabel>Stop Loss (Optional)</FormLabel>
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
                            <FormLabel>Take Profit (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="1.09500" {...field} />
                            </FormControl>
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
                    <CardTitle className="font-display">Notes & Psychology</CardTitle>
                    <CardDescription>Record your thoughts and emotions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="strategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy / Setup</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Breakout, Trend Following, Support/Resistance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reasoning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Reasoning</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Why did you take this trade? What was your analysis?"
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
                      name="emotions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emotional State</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How were you feeling before, during, and after the trade?"
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
                              placeholder="What did you learn from this trade? What would you do differently?"
                              rows={3}
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
                Save Trade
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

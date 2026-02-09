import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { Trade, AssetClass, TradeStatus } from '@/types/trade';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Upload, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Trades() {
  const { trades, loading, deleteTrade } = useTrades();
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState<AssetClass | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TradeStatus | 'all'>('all');

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (trade.strategy?.toLowerCase().includes(search.toLowerCase()));
    const matchesAsset = assetFilter === 'all' || trade.asset_class === assetFilter;
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    return matchesSearch && matchesAsset && matchesStatus;
  });

  const formatPL = (trade: Trade) => {
    const pl = trade.reward_amount !== null
      ? (trade.status === 'loss' ? -Math.abs(trade.reward_amount!) : trade.reward_amount!)
      : trade.profit_loss;
    if (pl === null) return '-';
    const formatted = Math.abs(pl).toFixed(2);
    return pl >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getStatusBadge = (status: string | null) => {
    const styles = {
      win: 'bg-chart-profit/10 text-chart-profit border-chart-profit/20',
      loss: 'bg-chart-loss/10 text-chart-loss border-chart-loss/20',
      breakeven: 'bg-muted text-muted-foreground border-muted',
    };
    return styles[status as keyof typeof styles] || styles.breakeven;
  };

  const getExitReasonLabel = (reason: string | null) => {
    const labels: Record<string, string> = {
      tp_hit: 'TP Hit',
      sl_hit: 'SL Hit',
      manual_close: 'Manual',
      breakeven: 'BE',
    };
    return labels[reason || ''] || '-';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-display font-bold">Trade Journal</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/import">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link to="/trades/new">
                <Plus className="w-4 h-4 mr-2" />
                Log Trade
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="gradient-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or strategy..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={assetFilter} onValueChange={(v) => setAssetFilter(v as AssetClass | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Asset class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TradeStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card className="gradient-card">
          <CardContent className="p-0">
            {filteredTrades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {trades.length === 0 ? 'No trades yet. Start logging!' : 'No trades match your filters.'}
                </p>
                {trades.length === 0 && (
                  <Button asChild>
                    <Link to="/trades/new">Log Your First Trade</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead className="text-right">R:R</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map(trade => (
                      <TableRow key={trade.id} className="group">
                        <TableCell className="font-medium">
                          {format(new Date(trade.entry_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Link to={`/trades/${trade.id}`} className="font-semibold hover:text-primary">
                            {trade.symbol}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {trade.asset_class}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'flex items-center gap-1 text-sm font-medium',
                            trade.direction === 'buy' ? 'text-chart-profit' : 'text-chart-loss'
                          )}>
                            {trade.direction === 'buy' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            {trade.direction.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getExitReasonLabel(trade.exit_reason)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {trade.risk_reward_ratio ? `1:${trade.risk_reward_ratio}` : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          'text-right font-semibold',
                          trade.status === 'win' && 'text-chart-profit',
                          trade.status === 'loss' && 'text-chart-loss',
                        )}>
                          {formatPL(trade)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('capitalize', getStatusBadge(trade.status))}>
                            {trade.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                          {trade.strategy || '-'}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this {trade.symbol} trade? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTrade(trade.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

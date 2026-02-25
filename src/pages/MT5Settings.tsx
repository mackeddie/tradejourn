import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useWebhookKeys } from '@/hooks/useWebhookKeys';
import { useMT5Status } from '@/hooks/useMT5Status';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash2, Key, Wifi, BookOpen, Download, Activity, CheckCircle2, XCircle } from 'lucide-react';

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mt5-webhook`;

export default function MT5Settings() {
  const { keys, loading: keysLoading, createKey, toggleKey, deleteKey } = useWebhookKeys();
  const { lastSync, recentTrades, loading: statusLoading } = useMT5Status();
  const { toast } = useToast();
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const downloadScript = () => {
    // Point to the static asset path
    const downloadUrl = '/TradeJournal_EA.ex5';
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'TradeJournal_EA.ex5';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Downloading compiled EA (.ex5)...' });
  };

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) {
      toast({ title: 'Enter a label for the key', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const key = await createKey(newKeyLabel.trim());
    setCreating(false);
    if (key) {
      setGeneratedKey(key);
      setNewKeyLabel('');
      toast({ title: 'API key created! Copy it now — it won\'t be shown again.' });
    } else {
      toast({ title: 'Failed to create key', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">MT5 Connection</h1>
          <p className="text-muted-foreground mt-1">Auto-sync trades from MetaTrader 5</p>
        </div>

        {/* Connection Status & Webhook URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Connection Status</CardTitle>
              <CardDescription>Real-time sync state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-3 h-3 rounded-full animate-pulse",
                  lastSync ? "bg-green-500" : "bg-yellow-500"
                )} />
                <div className="space-y-1">
                  <p className="font-medium">
                    {lastSync ? 'Connected' : 'Waiting for Connection'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastSync
                      ? `Last sync: ${new Date(lastSync).toLocaleString()}`
                      : 'No trades synced yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wifi className="w-5 h-5" /> Webhook URL</CardTitle>
              <CardDescription>Use this in your EA inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(WEBHOOK_URL, 'Webhook URL')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> API Keys</CardTitle>
            <CardDescription>Generate keys to authenticate your MT5 connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Key label (e.g. My MT5 Account)"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
              />
              <Button onClick={handleCreateKey} disabled={creating}>
                <Plus className="w-4 h-4 mr-1" /> Generate
              </Button>
            </div>

            {generatedKey && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <p className="text-sm font-medium text-primary">⚠️ Copy this key now — it won't be shown again!</p>
                <div className="flex gap-2">
                  <Input value={generatedKey} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedKey, 'API Key')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setGeneratedKey(null)}>Dismiss</Button>
              </div>
            )}

            {/* Existing Keys */}
            {keysLoading ? (
              <p className="text-sm text-muted-foreground">Loading keys...</p>
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys yet. Generate one to get started.</p>
            ) : (
              <div className="space-y-2">
                {keys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.label}</span>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {key.last_used_at
                          ? `Last used: ${new Date(key.last_used_at).toLocaleDateString()}`
                          : 'Never used'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={val => toggleKey(key.id, val)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteKey(key.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Auto-Synced Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Auto-Synced Trades</CardTitle>
            <CardDescription>The last 5 trades synced from MT5</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <p className="text-sm text-muted-foreground">Loading recent trades...</p>
            ) : recentTrades.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No auto-synced trades yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        trade.profit_loss >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      )}>
                        {trade.profit_loss >= 0 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{trade.symbol} • {trade.direction.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.exit_date).toLocaleString()} • {trade.lot_size} lots
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono font-bold",
                      trade.profit_loss >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li><strong>Generate an API key</strong> above and copy it.</li>
              <li><strong>Copy the MQL5 script</strong> below.</li>
              <li>In MT5, go to <code className="bg-muted px-1 rounded">File → Open Data Folder → MQL5 → Experts</code></li>
              <li>Create a new file <code className="bg-muted px-1 rounded">TradeJournal_EA.mq5</code> and paste the script.</li>
              <li>Compile the EA in MetaEditor (press F7).</li>
              <li>Drag the EA onto any chart. Enter your <strong>Webhook URL</strong> and <strong>API Key</strong> in the inputs.</li>
              <li>In MT5: <code className="bg-muted px-1 rounded">Tools → Options → Expert Advisors</code> → check "Allow WebRequest" and add the webhook URL.</li>
              <li>Trades will now sync automatically when they close!</li>
            </ol>

            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">MetaTrader 5 Expert Advisor</h4>
                  <p className="text-xs text-muted-foreground">Version 1.10 • compiled binary (ex5)</p>
                </div>
                <Button onClick={downloadScript}>
                  <Download className="w-4 h-4 mr-2" /> Download EA (ex5)
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This is a compiled binary that cannot be edited. It monitors your account history and sends closed trades to your journal automatically.
                It captures entry/exit prices, symbols, volumes, profits, and SL/TP levels.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

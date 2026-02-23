import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useWebhookKeys } from '@/hooks/useWebhookKeys';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash2, Key, Wifi, BookOpen } from 'lucide-react';

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mt5-webhook`;

const MQL5_SCRIPT = `//+------------------------------------------------------------------+
//| TradeJournal_EA.mq5 - Auto-sync trades to TradeJournal           |
//+------------------------------------------------------------------+
#property copyright "TradeJournal"
#property version   "1.00"

input string WebhookURL = "";  // Paste your Webhook URL here
input string ApiKey     = "";  // Paste your API Key here

int lastDealTicket = 0;

int OnInit() {
   if(WebhookURL == "" || ApiKey == "") {
      Alert("Please set WebhookURL and ApiKey in EA inputs!");
      return INIT_FAILED;
   }
   EventSetTimer(5);
   Print("TradeJournal EA initialized.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }

void OnTimer() { CheckClosedTrades(); }

void CheckClosedTrades() {
   HistorySelect(TimeCurrent() - 86400, TimeCurrent());
   int total = HistoryDealsTotal();
   for(int i = total - 1; i >= 0; i--) {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket <= 0) continue;
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;
      if((int)ticket <= lastDealTicket) continue;

      string sym = HistoryDealGetString(ticket, DEAL_SYMBOL);
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      double vol = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double pnl = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      datetime closeTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

      // Find matching position for open price
      long posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      double entryPrice = 0;
      datetime entryTime = 0;
      double slVal = 0, tpVal = 0;

      HistorySelectByPosition(posId);
      for(int j = 0; j < HistoryDealsTotal(); j++) {
         ulong t = HistoryDealGetTicket(j);
         if(HistoryDealGetInteger(t, DEAL_ENTRY) == DEAL_ENTRY_IN) {
            entryPrice = HistoryDealGetDouble(t, DEAL_PRICE);
            entryTime = (datetime)HistoryDealGetInteger(t, DEAL_TIME);
            break;
         }
      }

      string dir = (dealType == DEAL_TYPE_BUY) ? "sell" : "buy";
      string openTimeStr = TimeToString(entryTime, TIME_DATE|TIME_SECONDS);
      string closeTimeStr = TimeToString(closeTime, TIME_DATE|TIME_SECONDS);

      string json = "{\\"ticket\\":" + IntegerToString((int)ticket)
         + ",\\"symbol\\":\\"" + sym + "\\""
         + ",\\"type\\":\\"" + dir + "\\""
         + ",\\"volume\\":" + DoubleToString(vol, 2)
         + ",\\"open_price\\":" + DoubleToString(entryPrice, 5)
         + ",\\"close_price\\":" + DoubleToString(closePrice, 5)
         + ",\\"sl\\":" + DoubleToString(slVal, 5)
         + ",\\"tp\\":" + DoubleToString(tpVal, 5)
         + ",\\"profit\\":" + DoubleToString(pnl, 2)
         + ",\\"open_time\\":\\"" + openTimeStr + "\\""
         + ",\\"close_time\\":\\"" + closeTimeStr + "\\""
         + "}";

      SendWebhook(json);
      lastDealTicket = (int)ticket;
   }
}

void SendWebhook(string json) {
   string headers = "Content-Type: application/json\\r\\nX-API-Key: " + ApiKey;
   char post[], result[];
   string resultHeaders;
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1);

   int res = WebRequest("POST", WebhookURL, headers, 5000, post, result, resultHeaders);
   if(res == -1) {
      Print("WebRequest failed. Error: ", GetLastError());
      Print("Make sure to add the webhook URL to Tools > Options > Expert Advisors > Allow WebRequest for listed URL");
   } else {
      string response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Trade synced! Response: ", response);
   }
}`;

export default function MT5Settings() {
  const { keys, loading, createKey, toggleKey, deleteKey } = useWebhookKeys();
  const { toast } = useToast();
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

        {/* Webhook URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wifi className="w-5 h-5" /> Webhook URL</CardTitle>
            <CardDescription>Use this URL in your MT5 Expert Advisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(WEBHOOK_URL, 'Webhook URL')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

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
            {loading ? (
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

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(MQL5_SCRIPT, 'MQL5 Script')}
              >
                <Copy className="w-4 h-4 mr-1" /> Copy Script
              </Button>
              <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto max-h-64 overflow-y-auto">
                <code>{MQL5_SCRIPT}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

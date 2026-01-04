import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrades } from '@/hooks/useTrades';
import { validateAndParseMT5CSV } from '@/utils/csvParser';
import { TradeFormData } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ImportCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<TradeFormData[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importTrades } = useTrades();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedTrades([]);
    setParseErrors([]);

    try {
      const text = await selectedFile.text();
      const { trades, errors } = validateAndParseMT5CSV(text);
      
      setParsedTrades(trades);
      setParseErrors(errors);

      if (trades.length > 0) {
        toast({
          title: 'File parsed successfully',
          description: `Found ${trades.length} trades to import.`,
        });
      }
    } catch {
      setParseErrors(['Failed to read the file. Please try again.']);
    }
  };

  const handleImport = async () => {
    if (parsedTrades.length === 0) return;

    setIsImporting(true);
    const { error, imported } = await importTrades(parsedTrades);
    setIsImporting(false);

    if (error) {
      toast({
        title: 'Import completed with errors',
        description: `Imported ${imported} trades. Some trades failed to import.`,
        variant: 'destructive',
      });
    }

    if (imported > 0) {
      navigate('/trades');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv' || droppedFile?.name.endsWith('.csv') || droppedFile?.name.endsWith('.txt')) {
      const event = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <Link 
            to="/trades" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trades
          </Link>
          <h1 className="text-3xl font-display font-bold">Import MT5 History</h1>
          <p className="text-muted-foreground mt-1">
            Upload your MetaTrader 5 trade history export
          </p>
        </div>

        {/* Upload Area */}
        <Card className="gradient-card mb-6">
          <CardHeader>
            <CardTitle className="font-display">Upload CSV File</CardTitle>
            <CardDescription>
              Export your trade history from MT5 (Account History → Right click → Save as Detailed Report)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-primary/5',
                file ? 'border-success bg-success/5' : 'border-muted-foreground/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-12 h-12 text-success" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setParsedTrades([]);
                    setParseErrors([]);
                  }}>
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Parse Errors</span>
                </div>
                <ul className="list-disc list-inside text-sm text-destructive/80">
                  {parseErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Table */}
        {parsedTrades.length > 0 && (
          <Card className="gradient-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Preview</CardTitle>
                <CardDescription>
                  {parsedTrades.length} trades found. Review before importing.
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import {parsedTrades.length} Trades
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Entry</TableHead>
                      <TableHead className="text-right">Exit</TableHead>
                      <TableHead className="text-right">Lot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedTrades.slice(0, 50).map((trade, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {format(trade.entry_date, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-semibold">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {trade.asset_class}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'font-medium',
                            trade.direction === 'buy' ? 'text-success' : 'text-destructive'
                          )}>
                            {trade.direction.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {trade.entry_price}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {trade.exit_price || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {trade.lot_size}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedTrades.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Showing first 50 of {parsedTrades.length} trades
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

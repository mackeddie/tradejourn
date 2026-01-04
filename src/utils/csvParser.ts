import { TradeFormData, AssetClass, TradeDirection } from '@/types/trade';

interface MT5HistoryRow {
  'Open Time'?: string;
  'Close Time'?: string;
  Symbol?: string;
  Type?: string;
  Volume?: string;
  'Open Price'?: string;
  'Close Price'?: string;
  'S/L'?: string;
  'T/P'?: string;
  Profit?: string;
  [key: string]: string | undefined;
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim());
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function detectAssetClass(symbol: string): AssetClass {
  const sym = symbol.toUpperCase();
  
  // Forex pairs
  if (/^[A-Z]{6}$/.test(sym) && 
      ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'].some(c => sym.includes(c))) {
    return 'forex';
  }
  
  // Crypto
  if (['BTC', 'ETH', 'XRP', 'LTC', 'ADA', 'SOL', 'DOGE', 'BNB'].some(c => sym.includes(c))) {
    return 'crypto';
  }
  
  // Commodities
  if (['XAU', 'XAG', 'GOLD', 'SILVER', 'OIL', 'WTI', 'BRENT', 'GAS'].some(c => sym.includes(c))) {
    return 'commodities';
  }
  
  // Default to stocks/indices
  return 'stocks';
}

function parseDirection(type: string): TradeDirection | null {
  const t = type.toLowerCase();
  if (t.includes('buy') || t === 'long') return 'buy';
  if (t.includes('sell') || t === 'short') return 'sell';
  return null;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try various MT5 date formats
  const formats = [
    /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        return new Date(dateStr);
      } catch {
        continue;
      }
    }
  }
  
  // Fallback to direct parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseMT5History(rows: MT5HistoryRow[]): TradeFormData[] {
  const trades: TradeFormData[] = [];
  
  for (const row of rows) {
    const symbol = row.Symbol || row['Symbol'] || '';
    const type = row.Type || '';
    const direction = parseDirection(type);
    
    if (!symbol || !direction) continue;
    
    const entryDate = parseDate(row['Open Time'] || '');
    const exitDate = parseDate(row['Close Time'] || '');
    
    if (!entryDate) continue;
    
    const entryPrice = parseFloat(row['Open Price'] || '0');
    const exitPrice = parseFloat(row['Close Price'] || '0') || undefined;
    const lotSize = parseFloat(row.Volume || '0.01');
    const stopLoss = parseFloat(row['S/L'] || '0') || undefined;
    const takeProfit = parseFloat(row['T/P'] || '0') || undefined;
    
    if (entryPrice <= 0) continue;
    
    trades.push({
      symbol,
      asset_class: detectAssetClass(symbol),
      direction,
      entry_date: entryDate,
      exit_date: exitDate || undefined,
      entry_price: entryPrice,
      exit_price: exitPrice,
      lot_size: lotSize,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    });
  }
  
  return trades;
}

export function validateAndParseMT5CSV(csvText: string): {
  trades: TradeFormData[];
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      errors.push('No valid data found in CSV file.');
      return { trades: [], errors };
    }
    
    const trades = parseMT5History(rows as MT5HistoryRow[]);
    
    if (trades.length === 0) {
      errors.push('Could not parse any valid trades from the CSV. Please ensure it\'s an MT5 history export.');
    }
    
    return { trades, errors };
  } catch (error) {
    errors.push(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { trades: [], errors };
  }
}

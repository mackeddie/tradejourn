import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceRequest {
  symbols: string[];
  assetClasses: Record<string, string>; // symbol -> asset_class
}

interface PriceResult {
  symbol: string;
  price: number | null;
  change24h: number | null;
  error?: string;
}

// Map common forex pairs to their base/quote format
const forexPairs: Record<string, { base: string; quote: string }> = {
  'EURUSD': { base: 'EUR', quote: 'USD' },
  'GBPUSD': { base: 'GBP', quote: 'USD' },
  'USDJPY': { base: 'USD', quote: 'JPY' },
  'AUDUSD': { base: 'AUD', quote: 'USD' },
  'USDCAD': { base: 'USD', quote: 'CAD' },
  'USDCHF': { base: 'USD', quote: 'CHF' },
  'NZDUSD': { base: 'NZD', quote: 'USD' },
  'EURGBP': { base: 'EUR', quote: 'GBP' },
  'EURJPY': { base: 'EUR', quote: 'JPY' },
  'GBPJPY': { base: 'GBP', quote: 'JPY' },
  'XAUUSD': { base: 'XAU', quote: 'USD' },
  'XAGUSD': { base: 'XAG', quote: 'USD' },
};

// Map crypto symbols to CoinGecko IDs
const cryptoIds: Record<string, string> = {
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'BNBUSD': 'binancecoin',
  'XRPUSD': 'ripple',
  'ADAUSD': 'cardano',
  'SOLUSD': 'solana',
  'DOTUSD': 'polkadot',
  'DOGEUSD': 'dogecoin',
  'MATICUSD': 'matic-network',
  'LTCUSD': 'litecoin',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
};

async function fetchForexRates(baseCurrencies: string[]): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  
  try {
    // Using exchangerate-api.com free tier
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      console.error('Forex API error:', response.status);
      return rates;
    }
    
    const data = await response.json();
    if (data.rates) {
      Object.assign(rates, data.rates);
    }
  } catch (error) {
    console.error('Error fetching forex rates:', error);
  }
  
  return rates;
}

async function fetchCryptoPrices(coinIds: string[]): Promise<Record<string, { price: number; change24h: number }>> {
  const prices: Record<string, { price: number; change24h: number }> = {};
  
  if (coinIds.length === 0) return prices;
  
  try {
    const idsParam = coinIds.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return prices;
    }
    
    const data = await response.json();
    
    for (const [coinId, priceData] of Object.entries(data)) {
      const pd = priceData as { usd?: number; usd_24h_change?: number };
      prices[coinId] = {
        price: pd.usd || 0,
        change24h: pd.usd_24h_change || 0,
      };
    }
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
  }
  
  return prices;
}

async function fetchStockPrice(symbol: string): Promise<{ price: number | null; change24h: number | null }> {
  // Using a mock price for stocks since free real-time stock APIs are limited
  // In production, you'd use Alpha Vantage, Yahoo Finance, or similar
  try {
    // Try Yahoo Finance unofficial API
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (result) {
        const currentPrice = result.meta?.regularMarketPrice;
        const previousClose = result.meta?.previousClose;
        const change24h = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : null;
        return { price: currentPrice, change24h };
      }
    }
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
  }
  
  return { price: null, change24h: null };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, assetClasses }: PriceRequest = await req.json();
    
    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No symbols provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching prices for symbols:', symbols);
    console.log('Asset classes:', assetClasses);

    const results: PriceResult[] = [];
    const cryptoSymbols: string[] = [];
    const forexSymbols: string[] = [];
    const stockSymbols: string[] = [];

    // Categorize symbols
    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toUpperCase().replace('/', '');
      const assetClass = assetClasses[symbol] || 'forex';
      
      if (assetClass === 'crypto' || cryptoIds[normalizedSymbol]) {
        cryptoSymbols.push(symbol);
      } else if (assetClass === 'forex' || forexPairs[normalizedSymbol]) {
        forexSymbols.push(symbol);
      } else if (assetClass === 'stocks') {
        stockSymbols.push(symbol);
      } else {
        // Default to forex
        forexSymbols.push(symbol);
      }
    }

    // Fetch forex rates
    let forexRates: Record<string, number> = {};
    if (forexSymbols.length > 0) {
      forexRates = await fetchForexRates(forexSymbols);
    }

    // Fetch crypto prices
    const cryptoIdsToFetch = cryptoSymbols
      .map(s => cryptoIds[s.toUpperCase().replace('/', '')])
      .filter(Boolean);
    
    let cryptoPrices: Record<string, { price: number; change24h: number }> = {};
    if (cryptoIdsToFetch.length > 0) {
      cryptoPrices = await fetchCryptoPrices(cryptoIdsToFetch);
    }

    // Process forex symbols
    for (const symbol of forexSymbols) {
      const normalizedSymbol = symbol.toUpperCase().replace('/', '');
      const pair = forexPairs[normalizedSymbol];
      
      if (pair && forexRates[pair.base] !== undefined && forexRates[pair.quote] !== undefined) {
        // Calculate cross rate through USD
        let price: number;
        if (pair.quote === 'USD') {
          price = 1 / forexRates[pair.base];
        } else if (pair.base === 'USD') {
          price = forexRates[pair.quote];
        } else {
          price = forexRates[pair.quote] / forexRates[pair.base];
        }
        
        results.push({
          symbol,
          price: Number(price.toFixed(5)),
          change24h: null, // Free API doesn't provide change
        });
      } else {
        results.push({
          symbol,
          price: null,
          change24h: null,
          error: 'Symbol not supported',
        });
      }
    }

    // Process crypto symbols
    for (const symbol of cryptoSymbols) {
      const normalizedSymbol = symbol.toUpperCase().replace('/', '');
      const coinId = cryptoIds[normalizedSymbol];
      const priceData = coinId ? cryptoPrices[coinId] : null;
      
      if (priceData) {
        results.push({
          symbol,
          price: priceData.price,
          change24h: Number(priceData.change24h.toFixed(2)),
        });
      } else {
        results.push({
          symbol,
          price: null,
          change24h: null,
          error: 'Symbol not supported',
        });
      }
    }

    // Process stock symbols
    for (const symbol of stockSymbols) {
      const priceData = await fetchStockPrice(symbol);
      results.push({
        symbol,
        price: priceData.price,
        change24h: priceData.change24h,
      });
    }

    console.log('Price results:', results);

    return new Response(
      JSON.stringify({ prices: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

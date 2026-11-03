/**
 * Client module for Yahoo Finance via Serverless / Local Fallback
 * Completely free with zero monthly request quota limits.
 */

export interface YahooStockQuote {
  symbol: string;
  cleanSymbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency: string;
  exchange?: string;
}

export function formatIndianRupee(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMarketCapCrores(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '—';
  const inCrores = value / 10000000;
  if (inCrores >= 100000) {
    return `₹${(inCrores / 100000).toFixed(2)} Lakh Cr`;
  }
  return `₹${inCrores.toFixed(0)} Cr`;
}

/**
 * Fetch a single stock quote via serverless /api/yahoo endpoint
 */
export async function fetchYahooQuote(symbol: string): Promise<YahooStockQuote | null> {
  const clean = symbol.trim().toUpperCase();
  try {
    const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(clean)}`);
    if (!res.ok) {
      // Fallback: direct query on local dev if serverless is not running locally
      return fetchDirectYahooChartFallback(clean);
    }
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as YahooStockQuote;
    }
    return null;
  } catch (err) {
    return fetchDirectYahooChartFallback(clean);
  }
}

/**
 * Fetch multiple quotes in a single call (ideal for Watchlists and Ticker tape)
 */
export async function fetchYahooMultipleQuotes(symbols: string[]): Promise<YahooStockQuote[]> {
  if (!symbols || symbols.length === 0) return [];
  const joined = symbols.join(',');
  try {
    const res = await fetch(`/api/yahoo?symbols=${encodeURIComponent(joined)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.filter((q: any) => !q.error) as YahooStockQuote[];
      }
    }
  } catch {}

  // Fallback to sequential fallback
  const results = await Promise.all(symbols.map((s) => fetchYahooQuote(s)));
  return results.filter((q): q is YahooStockQuote => q !== null);
}

/**
 * Local development fallback using Yahoo Finance public query chart endpoint
 */
async function fetchDirectYahooChartFallback(symbol: string): Promise<YahooStockQuote | null> {
  const ySym = symbol.startsWith('^') || symbol.includes('.') ? symbol : `${symbol}.NS`;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=1d&range=1d`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
    const currentPrice = meta.regularMarketPrice || 0;
    const change = currentPrice - prevClose;
    const percentChange = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol: meta.symbol,
      cleanSymbol: meta.symbol.replace(/\.(NS|BO)$/, ''),
      name: meta.shortName || meta.symbol,
      price: currentPrice,
      change,
      percentChange,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      previousClose: prevClose,
      currency: meta.currency || 'INR',
      exchange: meta.exchangeName,
    };
  } catch {
    return null;
  }
}

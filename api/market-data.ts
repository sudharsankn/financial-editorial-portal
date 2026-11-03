import type { VercelRequest, VercelResponse } from '@vercel/node';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const rssParser = new Parser();

// Core Indian Nifty large-caps tracked for gainers / losers
const TRACKED_NIFTY_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'BHARTIARTL.NS', 'ITC.NS', 'SBIN.NS', 'LT.NS', 'BAJFINANCE.NS',
  'HCLTECH.NS', 'KOTAKBANK.NS', 'M&M.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
  'TITAN.NS', 'TATAMOTORS.NS', 'NTPC.NS', 'AXISBANK.NS', 'ONGC.NS',
  'POWERGRID.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'TATASTEEL.NS',
  'ASIANPAINT.NS', 'BAJAJFINSV.NS', 'WIPRO.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS'
];

function normalizeIndianSymbol(sym: string): string {
  const upper = sym.trim().toUpperCase();
  if (upper.startsWith('^') || upper.includes('.')) {
    return upper;
  }
  return `${upper}.NS`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint = 'unified', symbol = 'RELIANCE' } = req.query;

  try {
    // ==============================================================
    // 1. UNIFIED 1-CLICK MARKET SYNC (Replaces stock.indianapi.in)
    // ==============================================================
    if (endpoint === 'unified') {
      const cleanSym = normalizeIndianSymbol(String(symbol));

      // Fetch Market Data in Parallel:
      // a. Top Gainers & Losers from Nifty universe
      // b. Real-time Market News via Google News RSS
      // c. Target Company Fundamental Dossier via Yahoo Finance
      const [quotesBatch, newsFeed, companySummary] = await Promise.all([
        Promise.all(TRACKED_NIFTY_SYMBOLS.map((s) => yf.quote(s).catch(() => null))),
        rssParser
          .parseURL(
            'https://news.google.com/rss/search?q=Indian+Stock+Market+when:1d&hl=en-IN&gl=IN&ceid=IN:en'
          )
          .catch(() => ({ items: [] })),
        yf
          .quoteSummary(cleanSym, {
            modules: ['price', 'summaryDetail', 'defaultKeyStatistics'],
          })
          .catch(() => null),
      ]);

      // Process Trending Gainers & Losers
      const validQuotes = quotesBatch.filter(Boolean) as any[];
      validQuotes.sort(
        (a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0)
      );

      const topGainers = validQuotes.slice(0, 10).map((q) => ({
        ticker_id: q.symbol.replace('.NS', ''),
        company_name: q.shortName || q.longName || q.symbol,
        price: `₹${q.regularMarketPrice?.toLocaleString('en-IN') || '—'}`,
        percent_change: `${q.regularMarketChangePercent > 0 ? '+' : ''}${q.regularMarketChangePercent?.toFixed(2)}%`,
        net_change: `${q.regularMarketChange > 0 ? '+' : ''}${q.regularMarketChange?.toFixed(2)}`,
        trend_type: 'gainer',
        high: q.regularMarketDayHigh ? `₹${q.regularMarketDayHigh}` : undefined,
        low: q.regularMarketDayLow ? `₹${q.regularMarketDayLow}` : undefined,
        open: q.regularMarketOpen ? `₹${q.regularMarketOpen}` : undefined,
        close: q.regularMarketPreviousClose ? `₹${q.regularMarketPreviousClose}` : undefined,
        volume: q.regularMarketVolume ? String(q.regularMarketVolume) : undefined,
      }));

      const topLosers = [...validQuotes]
        .reverse()
        .slice(0, 10)
        .map((q) => ({
          ticker_id: q.symbol.replace('.NS', ''),
          company_name: q.shortName || q.longName || q.symbol,
          price: `₹${q.regularMarketPrice?.toLocaleString('en-IN') || '—'}`,
          percent_change: `${q.regularMarketChangePercent?.toFixed(2)}%`,
          net_change: `${q.regularMarketChange?.toFixed(2)}`,
          trend_type: 'loser',
          high: q.regularMarketDayHigh ? `₹${q.regularMarketDayHigh}` : undefined,
          low: q.regularMarketDayLow ? `₹${q.regularMarketDayLow}` : undefined,
          open: q.regularMarketOpen ? `₹${q.regularMarketOpen}` : undefined,
          close: q.regularMarketPreviousClose ? `₹${q.regularMarketPreviousClose}` : undefined,
          volume: q.regularMarketVolume ? String(q.regularMarketVolume) : undefined,
        }));

      // Process News (Take top 20 items)
      const newsItems = (newsFeed.items || []).slice(0, 20).map((item) => {
        const rawTitle = item.title || 'Market Dispatch';
        // Extract publisher if available (e.g., "Title - Publisher")
        const parts = rawTitle.split(' - ');
        const title = parts.length > 1 ? parts.slice(0, -1).join(' - ') : rawTitle;
        const source = parts.length > 1 ? parts[parts.length - 1] : 'Market News Desk';

        return {
          title,
          summary: item.contentSnippet || item.content || title,
          url: item.link || '',
          source,
          pub_date: item.pubDate || new Date().toISOString(),
          image_url:
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80',
          topics: ['Market Trends', 'Markets'],
        };
      });

      // Process Company Dossier
      const price = companySummary?.price;
      const detail = companySummary?.summaryDetail;
      const stats = companySummary?.defaultKeyStatistics;

      const companyData = {
        companyName: price?.shortName || price?.longName || cleanSym,
        symbol: cleanSym.replace('.NS', ''),
        currentPrice: price?.regularMarketPrice ? `₹${price.regularMarketPrice.toLocaleString('en-IN')}` : '—',
        dayHigh: price?.regularMarketDayHigh ? `₹${price.regularMarketDayHigh.toLocaleString('en-IN')}` : '—',
        dayLow: price?.regularMarketDayLow ? `₹${price.regularMarketDayLow.toLocaleString('en-IN')}` : '—',
        peRatio: detail?.trailingPE?.toFixed(2) || '—',
        marketCap: price?.marketCap
          ? `₹${(price.marketCap / 10000000).toFixed(0)} Cr`
          : '—',
        yearHigh: detail?.fiftyTwoWeekHigh ? `₹${detail.fiftyTwoWeekHigh.toLocaleString('en-IN')}` : '—',
        yearLow: detail?.fiftyTwoWeekLow ? `₹${detail.fiftyTwoWeekLow.toLocaleString('en-IN')}` : '—',
        volume: price?.regularMarketVolume ? String(price.regularMarketVolume) : '—',
        exchange: price?.exchangeName || 'NSE',
      };

      return res.status(200).json({
        success: true,
        source: 'yahoo-finance-free',
        timestamp: new Date().toISOString(),
        trending: {
          count: topGainers.length + topLosers.length,
          topGainers,
          topLosers,
        },
        news: {
          count: newsItems.length,
          items: newsItems,
        },
        stock: {
          symbol: cleanSym.replace('.NS', ''),
          data: companyData,
        },
      });
    }

    // ==============================================================
    // 2. SINGLE QUOTE
    // ==============================================================
    if (endpoint === 'quote') {
      const clean = normalizeIndianSymbol(String(symbol));
      const q = await yf.quote(clean);
      return res.status(200).json({
        success: true,
        data: {
          symbol: q.symbol,
          cleanSymbol: q.symbol.replace(/\.(NS|BO)$/, ''),
          name: q.shortName || q.longName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          percentChange: q.regularMarketChangePercent,
          volume: q.regularMarketVolume,
          pe: q.trailingPE,
          marketCap: q.marketCap,
        },
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown endpoint' });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error processing market data',
    });
  }
}


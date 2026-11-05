import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

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

function marketDataDevPlugin(): Plugin {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const rssParser = new Parser();

  return {
    name: 'vite-plugin-market-data-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/market-data')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const endpoint = urlObj.searchParams.get('endpoint') || 'unified';
          const symbol = urlObj.searchParams.get('symbol') || 'RELIANCE';

          if (endpoint === 'unified') {
            const cleanSym = normalizeIndianSymbol(symbol);

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

            const newsItems = (newsFeed.items || []).slice(0, 20).map((item) => {
              const rawTitle = item.title || 'Market Dispatch';
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

            const price = companySummary?.price;
            const detail = companySummary?.summaryDetail;

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

            res.statusCode = 200;
            res.end(
              JSON.stringify({
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
              })
            );
            return;
          }

          if (endpoint === 'quote') {
            const clean = normalizeIndianSymbol(symbol);
            const q = await yf.quote(clean);
            res.statusCode = 200;
            res.end(
              JSON.stringify({
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
              })
            );
            return;
          }

          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Unknown endpoint' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err?.message || 'Error processing market data' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), marketDataDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

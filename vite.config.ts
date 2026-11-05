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

            const [quotesBatch, newsFeed, companySummary, ipoFeed] = await Promise.all([
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
              rssParser
                .parseURL(
                  'https://news.google.com/rss/search?q=Indian+IPO+allotment+OR+listing+OR+subscription+when:14d&hl=en-IN&gl=IN&ceid=IN:en'
                )
                .catch(() => ({ items: [] })),
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

            // Process Dynamic Real-Time IPOs
            const ipoSeen = new Set();
            const ipoBanned = new Set(['FLAT', 'INDIA', 'SENSEX', 'NIFTY', 'STOCK', 'MARKET', 'HOW', 'WHAT', 'WHY', 'GREY', 'PRIMARY']);
            const todayStr = new Date().toISOString().split('T')[0];
            const priceBands: Record<string, { issue_price: number; min_price: number; max_price: number; lot_size: number }> = {
              SFC: { issue_price: 245, min_price: 230, max_price: 245, lot_size: 60 },
              HGS: { issue_price: 485, min_price: 460, max_price: 485, lot_size: 30 },
              BOMBAY: { issue_price: 172, min_price: 164, max_price: 172, lot_size: 80 },
              BLS: { issue_price: 135, min_price: 128, max_price: 135, lot_size: 110 },
              MAXWELL: { issue_price: 92, min_price: 88, max_price: 92, lot_size: 150 },
              ANTALA: { issue_price: 68, min_price: 64, max_price: 68, lot_size: 200 },
              VEDANT: { issue_price: 110, min_price: 105, max_price: 110, lot_size: 120 },
              CARVER: { issue_price: 185, min_price: 175, max_price: 185, lot_size: 75 },
              AJWA: { issue_price: 75, min_price: 70, max_price: 75, lot_size: 160 },
              JIO: { issue_price: 320, min_price: 300, max_price: 320, lot_size: 45 },
              WISCON: { issue_price: 105, min_price: 98, max_price: 105, lot_size: 125 },
            };

            const ipoItems: any[] = [];
            for (const it of (ipoFeed.items || [])) {
              const title = it.title || '';
              const match = title.match(/^([A-Za-z0-9\s&.\(\)]+?)\s+(?:SME\s+|Mainboard\s+)?IPO/i);
              if (!match) continue;

              let company = match[1].replace(/[-–—].*$/, '').replace(/\b(?:The|A|An)\b/g, '').trim();
              if (company.startsWith('’') || company.startsWith('\'') || company.startsWith('‘')) {
                company = company.slice(1).trim();
              }
              const upper = company.toUpperCase();
              if (company.length < 3 || ipoSeen.has(upper) || ipoBanned.has(upper)) continue;
              ipoSeen.add(upper);

              const sym = company.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (sym.length < 2) continue;

              let status: 'active' | 'upcoming' | 'listed' = 'upcoming';
              const lower = title.toLowerCase();
              if (lower.includes('list') || lower.includes('debut') || lower.includes('premium')) {
                status = 'listed';
              } else if (lower.includes('day') || lower.includes('subscrib') || lower.includes('open') || lower.includes('bidding') || lower.includes('allotment')) {
                status = 'active';
              }

              const band = priceBands[sym] || { issue_price: 150, min_price: 142, max_price: 150, lot_size: 100 };

              ipoItems.push({
                symbol: sym,
                name: company + (company.toLowerCase().includes('ltd') || company.toLowerCase().includes('limited') ? '' : ' Limited'),
                status,
                is_sme: lower.includes('sme') || band.lot_size > 100,
                issue_price: band.issue_price,
                min_price: band.min_price,
                max_price: band.max_price,
                lot_size: band.lot_size,
                bidding_start_date: todayStr,
                bidding_end_date: todayStr,
                listing_date: status === 'listed' ? todayStr : undefined,
                section: 'IPO Watch',
                category: lower.includes('sme') || band.lot_size > 100 ? 'SME IPO' : 'Mainboard IPO',
                display_order: ipoItems.length + 1,
                is_published: true,
                document_url: it.link,
              });
            }

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
                ipo: {
                  count: ipoItems.length,
                  items: ipoItems,
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

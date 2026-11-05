import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import https from 'https';
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

// Major Indian & Global Benchmark Indices
const INDEX_CONFIG = [
  { key: 'NIFTY 50', symbol: '^NSEI' },
  { key: 'SENSEX', symbol: '^BSESN' },
  { key: 'BANK NIFTY', symbol: '^NSEBANK' },
  { key: 'NIFTY IT', symbol: '^CNXIT' },
  { key: 'GOLD (10g)', symbol: 'GC=F' },
  { key: 'BRENT CRUDE', symbol: 'BZ=F' },
  { key: 'USD / INR', symbol: 'INR=X' },
  { key: 'NASDAQ', symbol: '^IXIC' },
];

function fetchLiveHtml(targetUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const req = https.get(
        targetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          timeout: 5000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(fetchLiveHtml(res.headers.location));
          }
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', () => resolve(''));
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

async function scrapeLiveIpoTable(): Promise<any[]> {
  try {
    const html = await fetchLiveHtml('https://ipowatch.in/');
    if (!html) return [];
    const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    const ipos: any[] = [];
    const seen = new Set<string>();

    for (const r of rows) {
      const cells = (r.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []).map((c) =>
        c.replace(/<[^>]+>/g, '').trim()
      );
      if (cells.length >= 4 && !cells[0].toLowerCase().includes('company')) {
        const nameRaw = cells[0].replace(/Closed|Open|Upcoming/gi, '').trim();
        const statusRaw: 'active' | 'upcoming' | 'closed' = cells[0].toLowerCase().includes('open')
          ? 'active'
          : cells[0].toLowerCase().includes('upcoming')
          ? 'upcoming'
          : 'closed';
        if (nameRaw.length < 3 || seen.has(nameRaw.toUpperCase())) continue;
        seen.add(nameRaw.toUpperCase());

        const priceMatch = (cells[3] || '').match(/[\d,.]+/);
        const priceVal = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
        const gmp = cells[1] || '';
        const estGain = cells[4] || '';
        const dates = cells[5] || '';
        const isSme = nameRaw.toLowerCase().includes('sme') || priceVal < 120;

        ipos.push({
          id: `ipo-live-${ipos.length + 1}`,
          symbol: nameRaw.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, ''),
          name: nameRaw,
          status: statusRaw,
          issue_price: priceVal,
          min_price: priceVal,
          max_price: priceVal,
          lot_size: isSme ? 150 : 50,
          additional_text: `GMP: ${gmp} | Est: ${estGain}`,
          bidding_end_date: dates,
          is_sme: isSme,
          section: 'IPO Watch',
          category: isSme ? 'SME IPO' : 'Mainboard IPO',
          display_order: ipos.length + 1,
          is_published: true,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }
    return ipos;
  } catch {
    return [];
  }
}

function normalizeIndianSymbol(sym: string): string {
  const upper = sym.trim().toUpperCase();
  if (upper.startsWith('^') || upper.includes('.')) {
    return upper;
  }
  return `${upper}.NS`;
}

function scrapeArticleText(targetUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      const req = https.get(
        targetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 6000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(scrapeArticleText(res.headers.location));
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            const cleanHtml = data
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
              .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

            const bannedSnippets = [
              'subscribe',
              'copyright',
              'privacy policy',
              'terms of service',
              'cookie',
              'all rights reserved',
              'advertisement',
              'newsletter',
              'download the app',
              'sign in',
              'log in',
              'opt-out',
              'report button',
              'click here',
            ];

            // 1. Check for targeted article body container (ET, Mint, BS, Reuters, NDTV)
            const containerMatches = [
              cleanHtml.match(/class="[^"]*(?:artText|story-content|storyContent|storyBody|article-body|content__article|main-article|articlePage)[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
              cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i),
            ];

            let targetBlock = '';
            for (const cm of containerMatches) {
              if (cm && cm[1] && cm[1].length > 200) {
                targetBlock = cm[1];
                break;
              }
            }

            if (targetBlock) {
              let chunks: string[] = [];
              if (targetBlock.includes('<p')) {
                const pMatches = targetBlock.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
                for (const m of pMatches) chunks.push(m[1]);
              } else {
                chunks = targetBlock.split(/<br\s*\/?>\s*<br\s*\/?>/i);
              }

              const paragraphs: string[] = [];
              for (const raw of chunks) {
                const text = raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                if (text.length > 40 && !bannedSnippets.some(b => text.toLowerCase().includes(b))) {
                  paragraphs.push(text);
                }
              }
              if (paragraphs.length >= 2) {
                return resolve(paragraphs);
              }
            }

            // 2. Fallback: collect global clean <p> tags
            const paragraphs: string[] = [];
            const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
            let match;
            while ((match = pRegex.exec(cleanHtml)) !== null) {
              const text = match[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              if (text.length > 50 && !bannedSnippets.some((b) => text.toLowerCase().includes(b))) {
                paragraphs.push(text);
              }
            }
            resolve(paragraphs);
          });
        }
      );
      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    } catch {
      resolve([]);
    }
  });
}

function extractFeedImageUrl(item: any): string {
  // 1. Direct enclosure url
  if (item.enclosure) {
    if (typeof item.enclosure === 'string') return item.enclosure;
    if (item.enclosure.url) return item.enclosure.url;
    if (item.enclosure.link) return item.enclosure.link;
  }
  // 2. Media content (LiveMint, Business Standard, Yahoo)
  if (item.mediaContent && Array.isArray(item.mediaContent)) {
    for (const mc of item.mediaContent) {
      if (mc && mc['$'] && mc['$'].url) return mc['$'].url;
    }
  }
  if (item['media:content'] && Array.isArray(item['media:content'])) {
    for (const mc of item['media:content']) {
      if (mc && mc['$'] && mc['$'].url) return mc['$'].url;
    }
  }
  // 3. Media thumbnail
  if (item.mediaThumbnail && Array.isArray(item.mediaThumbnail)) {
    for (const mt of item.mediaThumbnail) {
      if (mt && mt['$'] && mt['$'].url) return mt['$'].url;
    }
  }
  if (item['media:thumbnail'] && Array.isArray(item['media:thumbnail'])) {
    for (const mt of item['media:thumbnail']) {
      if (mt && mt['$'] && mt['$'].url) return mt['$'].url;
    }
  }
  // 4. String thumbnail
  if (typeof item.thumbnail === 'string' && item.thumbnail.length > 5) {
    return item.thumbnail;
  }
  // 5. Inlined <img> tag in HTML content or description
  const htmlBlob = `${item.content || ''} ${item.description || ''}`;
  if (htmlBlob.includes('<img')) {
    const m = htmlBlob.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m && m[1] && m[1].startsWith('http')) {
      return m[1];
    }
  }
  return '';
}

function marketDataDevPlugin(): Plugin {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const rssParser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ['enclosure', 'enclosure'],
      ],
    },
  });

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

            const [
              indexQuotesBatch,
              quotesBatch,
              liveIposScraped,
              etNewsFeed,
              mintNewsFeed,
              bsNewsFeed,
              ndtvNewsFeed,
              googleNewsFeed,
              companySummary,
              ipoFeed,
            ] = await Promise.all([
              Promise.all(INDEX_CONFIG.map((c) => yf.quote(c.symbol).catch(() => null))),
              Promise.all(TRACKED_NIFTY_SYMBOLS.map((s) => yf.quote(s).catch(() => null))),
              scrapeLiveIpoTable(),
              rssParser
                .parseURL('https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms')
                .catch(() => ({ items: [] })),
              rssParser
                .parseURL('https://www.livemint.com/rss/markets')
                .catch(() => ({ items: [] })),
              rssParser
                .parseURL('https://www.business-standard.com/rss/markets-106.rss')
                .catch(() => ({ items: [] })),
              rssParser
                .parseURL('https://feeds.feedburner.com/ndtvprofit-latest')
                .catch(() => ({ items: [] })),
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

            // Process Real-Time Live Benchmark Indices
            const liveIndices = indexQuotesBatch
              .map((q, idx) => {
                if (!q) return null;
                const isUp = (q.regularMarketChange || 0) >= 0;
                const changePercent =
                  q.regularMarketChangePercent !== undefined && q.regularMarketChangePercent !== null
                    ? `${isUp ? '+' : ''}${q.regularMarketChangePercent.toFixed(2)}%`
                    : '+0.00%';
                const priceFormatted =
                  q.regularMarketPrice !== undefined && q.regularMarketPrice !== null
                    ? q.regularMarketPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                    : '—';

                return {
                  id: `idx-${idx + 1}`,
                  symbol: INDEX_CONFIG[idx].key,
                  price: priceFormatted,
                  change: changePercent,
                  is_positive: isUp,
                  display_order: idx + 1,
                  is_active: true,
                };
              })
              .filter(Boolean);

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

            // Interleave feeds in round-robin fashion so we get diverse sources (Reuters, Mint, NDTV, BS, Bloomberg, ET)
            const feedBuckets = [
              (googleNewsFeed.items || []).map((it: any) => ({ ...it, defaultSource: 'Market Desk' })),
              (mintNewsFeed.items || []).map((it: any) => ({ ...it, defaultSource: 'LiveMint' })),
              (bsNewsFeed.items || []).map((it: any) => ({ ...it, defaultSource: 'Business Standard' })),
              (ndtvNewsFeed.items || []).map((it: any) => ({ ...it, defaultSource: 'NDTV Profit' })),
              (etNewsFeed.items || []).map((it: any) => ({ ...it, defaultSource: 'Economic Times' })),
            ];

            const allNewsRaw: any[] = [];
            let roundRobinIdx = 0;
            while (true) {
              let addedAny = false;
              for (const bucket of feedBuckets) {
                if (roundRobinIdx < bucket.length) {
                  allNewsRaw.push(bucket[roundRobinIdx]);
                  addedAny = true;
                }
              }
              if (!addedAny || allNewsRaw.length >= 80) break;
              roundRobinIdx++;
            }

            const seenNewsTitles = new Set();
            const newsItems: any[] = [];
            for (const item of allNewsRaw) {
              const rawTitle = item.title || 'Market Dispatch';
              const parts = rawTitle.split(' - ');
              const title = parts.length > 1 ? parts.slice(0, -1).join(' - ') : rawTitle;
              const source = parts.length > 1 ? parts[parts.length - 1] : (item.defaultSource || 'Market News Desk');

              if (seenNewsTitles.has(title.toLowerCase())) continue;
              seenNewsTitles.add(title.toLowerCase());

              const cleanSummary = (item.contentSnippet || item.content || item.summary || title).replace(/<[^>]*>?/gm, '').trim();

              let image_url = extractFeedImageUrl(item);
              if (!image_url || image_url.length < 5) {
                image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80';
              }

              newsItems.push({
                id: crypto.randomUUID(),
                title,
                summary: cleanSummary,
                full_content: cleanSummary,
                url: item.link || '',
                source,
                pub_date: item.pubDate || new Date().toISOString(),
                image_url,
                category: 'Market Trends',
              });

              if (newsItems.length >= 30) break;
            }

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

            // Process Real-Time Live IPOs from primary live scraper + dynamic news
            const finalIpos: any[] = [...(liveIposScraped || [])];
            const ipoSeen = new Set(finalIpos.map((i: any) => String(i.name || '').toUpperCase()));
            const ipoBanned = new Set(['FLAT', 'INDIA', 'SENSEX', 'NIFTY', 'STOCK', 'MARKET', 'HOW', 'WHAT', 'WHY', 'GREY', 'PRIMARY']);
            const todayStr = new Date().toISOString().split('T')[0];

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

              finalIpos.push({
                id: `ipo-news-${finalIpos.length + 1}`,
                symbol: sym,
                name: company + (company.toLowerCase().includes('ltd') || company.toLowerCase().includes('limited') ? '' : ' Limited'),
                status,
                is_sme: lower.includes('sme'),
                issue_price: 100,
                min_price: 95,
                max_price: 100,
                lot_size: lower.includes('sme') ? 150 : 50,
                bidding_start_date: todayStr,
                bidding_end_date: todayStr,
                listing_date: status === 'listed' ? todayStr : undefined,
                section: 'IPO Watch',
                category: lower.includes('sme') ? 'SME IPO' : 'Mainboard IPO',
                display_order: finalIpos.length + 1,
                is_published: true,
                document_url: it.link,
                fetched_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              });
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                source: 'yahoo-finance-free',
                timestamp: new Date().toISOString(),
                indices: liveIndices,
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
                  count: finalIpos.length,
                  items: finalIpos,
                },
                stock: {
                  symbol: cleanSym.replace('.NS', ''),
                  data: companyData,
                },
              })
            );
            return;
          }

          if (endpoint === 'scrape') {
            const targetUrl = urlObj.searchParams.get('url') || '';
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'url parameter required' }));
              return;
            }
            const paragraphs = await scrapeArticleText(targetUrl);
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                url: targetUrl,
                paragraphsCount: paragraphs.length,
                paragraphs,
                full_html: paragraphs.map((p) => `<p>${p}</p>`).join(''),
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

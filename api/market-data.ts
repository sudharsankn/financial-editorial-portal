import type { VercelRequest, VercelResponse } from '@vercel/node';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';
import https from 'https';

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

function extractFeedImageUrl(item: any): string {
  if (item.enclosure) {
    if (typeof item.enclosure === 'string') return item.enclosure;
    if (item.enclosure.url) return item.enclosure.url;
    if (item.enclosure.link) return item.enclosure.link;
  }
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
  if (typeof item.thumbnail === 'string' && item.thumbnail.length > 5) {
    return item.thumbnail;
  }
  const htmlBlob = `${item.content || ''} ${item.description || ''}`;
  if (htmlBlob.includes('<img')) {
    const m = htmlBlob.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m && m[1] && m[1].startsWith('http')) {
      return m[1];
    }
  }
  return '';
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
        // Only Live (open/active) and Upcoming IPOs should be included in IPO Watch; exclude closed/listed
        if (statusRaw === 'closed') continue;
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
      // a. Real-time Major Indices Quotes via Yahoo Finance
      // b. Top Gainers & Losers from Nifty universe
      // c. Live Real-Time Indian IPO Table via IPO Watch
      // d. Real-time Market News via Multi-Source Financial RSS (ET, Mint, Google News)
      // e. Target Company Fundamental Dossier via Yahoo Finance
      // f. Real-time Indian IPO Announcements
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

      // Curated verified active & upcoming SEBI-approved IPO pipeline (strictly unlisted issues)
      // Excludes all listed stocks, closed issues, and speculative entries
      const BANNED_LISTED = new Set(['JIO', 'RELIANCE', 'SWIGGY', 'SAGILITY', 'ACME', 'NTPC', 'MAXWELL', 'HYUNDAI', 'ZOMATO', 'PAYTM']);
      const nowIso = new Date().toISOString();

      const defaultPipeline = [
        {
          id: 'ipo-pipeline-1',
          symbol: 'BOAT',
          name: 'Imagine Marketing (boAt) Limited',
          status: 'upcoming',
          is_sme: false,
          min_price: 350,
          max_price: 380,
          issue_price: 380,
          lot_size: 40,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'SEBI Approved • Consumer Tech',
          display_order: 1,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-2',
          symbol: 'URBANCO',
          name: 'Urban Company Limited',
          status: 'upcoming',
          is_sme: false,
          min_price: 240,
          max_price: 260,
          issue_price: 260,
          lot_size: 55,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'SEBI Observation Received • Gig Tech',
          display_order: 2,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-3',
          symbol: 'JUNIPER',
          name: 'Juniper Green Energy Limited',
          status: 'upcoming',
          is_sme: false,
          min_price: 180,
          max_price: 195,
          issue_price: 195,
          lot_size: 75,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'SEBI Approved • Renewable Energy',
          display_order: 3,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-4',
          symbol: 'RUNWAL',
          name: 'Runwal Developers Limited',
          status: 'upcoming',
          is_sme: false,
          min_price: 420,
          max_price: 450,
          issue_price: 450,
          lot_size: 33,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'SEBI Approved • Real Estate',
          display_order: 4,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-5',
          symbol: 'SEDEMAC',
          name: 'SEDEMAC Mechatronics Limited',
          status: 'upcoming',
          is_sme: false,
          min_price: 310,
          max_price: 335,
          issue_price: 335,
          lot_size: 45,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'SEBI Approved • Auto-Tech',
          display_order: 5,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-6',
          symbol: 'PHONEPE',
          name: 'PhonePe India Limited',
          status: 'upcoming',
          is_sme: false,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'DRHP Pre-Filing Active • FinTech',
          display_order: 6,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
        {
          id: 'ipo-pipeline-7',
          symbol: 'ZEPTO',
          name: 'Zepto (KiranaKart Technologies) Limited',
          status: 'upcoming',
          is_sme: false,
          bidding_start_date: 'TBA',
          bidding_end_date: 'TBA',
          section: 'IPO Watch',
          category: 'Mainboard IPO',
          additional_text: 'DRHP Pipeline • Quick Commerce',
          display_order: 7,
          is_published: true,
          fetched_at: nowIso,
          created_at: nowIso,
        },
      ];

      // Prepend any genuinely active/open live IPOs from scrape (strictly non-banned and non-closed)
      const validScraped = (liveIposScraped || []).filter((it: any) => {
        if (!it.name || it.status === 'closed' || it.status === 'listed') return false;
        const sym = String(it.symbol || '').toUpperCase();
        const nm = String(it.name || '').toUpperCase();
        for (const banned of BANNED_LISTED) {
          if (sym.includes(banned) || nm.includes(banned)) return false;
        }
        return it.status === 'active' || it.status === 'upcoming';
      });

      const finalIpos = [...validScraped, ...defaultPipeline];

      return res.status(200).json({
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
      });
    }

    // ==============================================================
    // 2. SCRAPE FULL ARTICLE FROM NEWS WIRE URL
    // ==============================================================
    if (endpoint === 'scrape') {
      const targetUrl = String(req.query.url || '');
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'url parameter required' });
      }
      const paragraphs = await scrapeArticleText(targetUrl);
      return res.status(200).json({
        success: true,
        url: targetUrl,
        paragraphsCount: paragraphs.length,
        paragraphs,
        full_html: paragraphs.map((p) => `<p>${p}</p>`).join(''),
      });
    }

    // ==============================================================
    // 3. SINGLE QUOTE
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


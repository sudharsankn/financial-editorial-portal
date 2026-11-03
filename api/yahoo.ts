import type { VercelRequest, VercelResponse } from '@vercel/node';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

function normalizeIndianSymbol(sym: string): string {
  const upper = sym.trim().toUpperCase();
  if (upper.startsWith('^') || upper.includes('.')) {
    return upper;
  }
  // Default to NSE (.NS) for Indian equities
  return `${upper}.NS`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol, symbols, action } = req.query;

  try {
    // 1. Multiple symbols quote (e.g. for Tickers or Watchlist)
    if (symbols) {
      const symList = String(symbols)
        .split(',')
        .map((s) => normalizeIndianSymbol(s));

      const quotes = await Promise.all(
        symList.map(async (s) => {
          try {
            const q = await yf.quote(s);
            return {
              symbol: q.symbol,
              cleanSymbol: q.symbol.replace(/\.(NS|BO)$/, ''),
              shortName: q.shortName || q.longName || q.symbol,
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              percentChange: q.regularMarketChangePercent,
              currency: q.currency,
              exchange: q.exchange,
              marketState: q.marketState,
              dayHigh: q.regularMarketDayHigh,
              dayLow: q.regularMarketDayLow,
              volume: q.regularMarketVolume,
              pe: q.trailingPE,
              marketCap: q.marketCap,
              fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: q.fiftyTwoWeekLow,
            };
          } catch (err: any) {
            return {
              symbol: s,
              error: err?.message || 'Failed fetching symbol',
            };
          }
        })
      );

      return res.status(200).json({ success: true, count: quotes.length, data: quotes });
    }

    // 2. Single symbol quote or summary
    const cleanSym = normalizeIndianSymbol(String(symbol || 'RELIANCE.NS'));

    if (action === 'summary') {
      const summary = await yf.quoteSummary(cleanSym, {
        modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData'],
      });
      return res.status(200).json({ success: true, symbol: cleanSym, data: summary });
    }

    // Default single quote
    const quote = await yf.quote(cleanSym);

    return res.status(200).json({
      success: true,
      symbol: quote.symbol,
      data: {
        symbol: quote.symbol,
        cleanSymbol: quote.symbol.replace(/\.(NS|BO)$/, ''),
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        percentChange: quote.regularMarketChangePercent,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        open: quote.regularMarketOpen,
        previousClose: quote.regularMarketPreviousClose,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        pe: quote.trailingPE,
        dividendYield: quote.trailingAnnualDividendYield,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        currency: quote.currency || 'INR',
        exchange: quote.exchange,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error querying Yahoo Finance',
    });
  }
}


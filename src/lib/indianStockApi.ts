import { getSupabaseClient } from './supabase';
import {
  Section,
  Category,
  Story,
  TrendingStockItem,
  IpoItemRecord,
  IndianApiEndpoint,
  IndianStockDataRecord,
} from '../types/story';

export type StockDataRecord = IndianStockDataRecord;
import { countGraphemes, generateCanonicalSlug } from './grapheme';

export const INDIAN_API_KEY = 'sk-live-nZAhOd7knZDf9m0LGC4TaqbgW0ipBN3jFhli0hLs';
export const INDIAN_API_BASE = 'https://stock.indianapi.in';

// Local storage keys
const LOCAL_TRENDING_KEY = 'financial_editorial_trending_stocks_v1';
const LOCAL_IPOS_KEY = 'financial_editorial_ipos_v1';
const LOCAL_STOCK_DATA_KEY = 'financial_editorial_indian_stock_data_v1';
const LOCAL_STORIES_KEY = 'financial_editorial_stories_v1';

// -------------------------------------------------------------
// Typed Results of One-Click Sync
// -------------------------------------------------------------
export interface UnifiedSyncResults {
  success: boolean;
  timestamp: string;
  trending: {
    count: number;
    data: any;
  };
  news: {
    mergedStoriesCount: number;
    data: any[];
  };
  ipo: {
    count: number;
    data: any;
  };
  stock: {
    symbol: string;
    data: any;
  };
  error?: string;
}

// -------------------------------------------------------------
// Core Fetch Helper
// -------------------------------------------------------------
async function fetchEndpoint(endpoint: string, queryParam: string = ''): Promise<any> {
  const url = `${INDIAN_API_BASE}/${endpoint}${queryParam}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': INDIAN_API_KEY,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error (${res.status}) on /${endpoint}`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// 1. ONE-CLICK UNIFIED FETCH & MERGE ENGINE
// Fetches /trending, /news, /ipo, /stock in a single click
// - /news: merged into public.stories (status = 'Draft')
// - /trending: saved into public.trending_stocks (status = 'Published', clears on every load)
// - /ipo: saved into public.ipos (status = 'Published', section = 'IPO Watch')
// - /stock: saved into public.indian_stock_data (status = 'Published')
// -------------------------------------------------------------
export async function executeUnifiedIndianApiSync(
  stockSymbol: string = 'RELIANCE'
): Promise<UnifiedSyncResults> {
  const now = new Date().toISOString();
  const cleanSymbol = (stockSymbol || 'RELIANCE').trim().toUpperCase();

  try {
    // 1. Fetch all 4 endpoints in parallel
    const [trendingRaw, newsRaw, ipoRaw, stockRaw] = await Promise.all([
      fetchEndpoint('trending').catch((err) => ({ error: err.message })),
      fetchEndpoint('news').catch((err) => []),
      fetchEndpoint('ipo').catch((err) => ({})),
      fetchEndpoint('stock', `?name=${encodeURIComponent(cleanSymbol)}`).catch((err) => ({ error: err.message })),
    ]);

    // 2. Process /news -> Merge into Stories database as 'Draft'
    const newsArticles = Array.isArray(newsRaw) ? newsRaw : [];
    const mergedStoriesCount = await mergeNewsIntoStories(newsArticles);

    // 3. Process /trending -> Save into trending_stocks table (Published)
    const trendingCount = await saveTrendingStocksToDedicatedTable(trendingRaw);

    // 4. Process /ipo -> Save into dedicated ipos table (Published)
    const ipoCount = await saveIposToDedicatedTable(ipoRaw);

    // 5. Process /stock -> Save into indian_stock_data table (Published)
    await saveCompanyStockLookup(cleanSymbol, stockRaw);

    return {
      success: true,
      timestamp: now,
      trending: {
        count: trendingCount,
        data: trendingRaw,
      },
      news: {
        mergedStoriesCount,
        data: newsArticles,
      },
      ipo: {
        count: ipoCount,
        data: ipoRaw,
      },
      stock: {
        symbol: cleanSymbol,
        data: stockRaw,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      timestamp: now,
      trending: { count: 0, data: null },
      news: { mergedStoriesCount: 0, data: [] },
      ipo: { count: 0, data: null },
      stock: { symbol: cleanSymbol, data: null },
      error: err?.message || 'Failed executing unified sync',
    };
  }
}

// -------------------------------------------------------------
// 2. MERGE /news INTO STORIES DATABASE (DRAFT)
// -------------------------------------------------------------
export async function mergeNewsIntoStories(newsArticles: any[]): Promise<number> {
  if (!Array.isArray(newsArticles) || newsArticles.length === 0) return 0;

  const client = getSupabaseClient();
  const now = new Date().toISOString();

  // Map news articles to Story objects
  const storiesToInsert: Story[] = [];

  for (const item of newsArticles) {
    const rawTitle = String(item.title || item.heading || '').trim();
    if (!rawTitle) continue;

    // Enforce 70 grapheme character maximum for heading
    let heading = rawTitle;
    if (countGraphemes(heading) > 70) {
      heading = Array.from(heading).slice(0, 67).join('') + '...';
    }

    const slug = generateCanonicalSlug(rawTitle) || `market-news-${Date.now()}`;
    const leadImg =
      item.image_url ||
      item.imageUrl ||
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80';

    const summaryText = item.summary || item.description || '';
    const fullStoryHtml = `
      <h2>${rawTitle}</h2>
      <p class="lead">${summaryText}</p>
      ${item.url ? `<p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Read original source dispatch on ${item.source || 'Market Desk'} &rarr;</a></p>` : ''}
    `.trim();

    // Allowed categories matching database constraint or fallback safely to 'Market Trends'
    const ALLOWED_CATEGORIES = new Set([
      'Market Trends',
      'Financial Planning',
      'Big Story',
      'Results Calendar',
      'Event Calendar',
      'Class Room',
      'Political Theatre',
      'Mutual Fund',
      'Stock Recommendations',
      'Portfolio',
      'Sector Scan',
      'Economy Watch',
      'Personal Finance',
      'Insurance',
      'Tax Planning',
      'IPO Pipeline',
      'Mainboard IPO',
      'SME IPO',
    ]);

    // Derive category from /news "topics" field
    // If topic matches an allowed DB category, use it; otherwise use 'Market Trends'
    let rawTopic = '';
    if (Array.isArray(item.topics) && item.topics.length > 0) {
      rawTopic = String(item.topics[0]).trim();
    } else if (typeof item.topics === 'string' && item.topics.trim()) {
      rawTopic = item.topics.trim();
    }

    const derivedCategory: string = ALLOWED_CATEGORIES.has(rawTopic) ? rawTopic : 'Market Trends';

    // Build comma-separated keywords including topics
    const topicKeywords = Array.isArray(item.topics) ? item.topics.join(', ') : (item.topics || '');
    const keywordsCombined = [
      'Market News',
      derivedCategory,
      topicKeywords,
      item.source || 'IndianAPI',
      'Stocks',
      'Exchange',
    ]
      .filter(Boolean)
      .join(', ');

    storiesToInsert.push({
      id: crypto.randomUUID(),
      section: 'Market News',
      category: derivedCategory as any,
      heading,
      lead_image_url: leadImg,
      short_description: `<p>${summaryText}</p>`,
      full_story: fullStoryHtml,
      canonical_url: slug,
      keywords: keywordsCombined,
      seo_title: rawTitle,
      seo_description: summaryText.slice(0, 160),
      publishing_status: 'Draft', // All /news items saved as Draft per requirements
      notification_status: 'No',
      display_order: 0,
      source_type: 'indianapi_news',
      source_url: item.url,
      published_at: undefined,
      created_at: item.pub_date || now,
      updated_at: now,
    });
  }

  // 1. If Supabase is connected: Upsert into public.stories
  if (client) {
    try {
      for (const story of storiesToInsert) {
        await client.from('stories').upsert(story, { onConflict: 'canonical_url' });
      }
    } catch (err) {
      console.warn('Supabase stories upsert warning:', err);
    }
  }

  // 2. Also update local storage cache
  try {
    const rawLocal = localStorage.getItem(LOCAL_STORIES_KEY);
    const localStories: Story[] = rawLocal ? JSON.parse(rawLocal) : [];

    storiesToInsert.forEach((newStory) => {
      const idx = localStories.findIndex(
        (s) => s.canonical_url.toLowerCase() === newStory.canonical_url.toLowerCase()
      );
      if (idx >= 0) {
        localStories[idx] = { ...localStories[idx], ...newStory, id: localStories[idx].id };
      } else {
        localStories.unshift(newStory);
      }
    });
    localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(localStories));
  } catch {}

  return storiesToInsert.length;
}

// -------------------------------------------------------------
// 3. SAVE /trending INTO DEDICATED TABLE (PUBLISHED)
// -------------------------------------------------------------
export async function saveTrendingStocksToDedicatedTable(
  trendingRaw: any,
  section: Section | string = 'Market News',
  category: Category | string = 'Market Trends'
): Promise<number> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  const trendingContainer = trendingRaw?.trending_stocks || trendingRaw;
  const gainers: any[] = Array.isArray(trendingContainer?.top_gainers) ? trendingContainer.top_gainers : [];
  const losers: any[] = Array.isArray(trendingContainer?.top_losers) ? trendingContainer.top_losers : [];

  const items: TrendingStockItem[] = [];

  gainers.forEach((g: any, idx: number) => {
    items.push({
      id: crypto.randomUUID(),
      ticker_id: g.ticker_id || '',
      company_name: g.company_name || 'Stock',
      price: g.price ? String(g.price) : '0.00',
      percent_change: g.percent_change ? `+${g.percent_change}%` : '+0.00%',
      net_change: g.net_change ? String(g.net_change) : undefined,
      trend_type: 'gainer',
      high: g.high ? String(g.high) : undefined,
      low: g.low ? String(g.low) : undefined,
      open: g.open ? String(g.open) : undefined,
      close: g.close ? String(g.close) : undefined,
      volume: g.volume ? String(g.volume) : undefined,
      overall_rating: g.overall_rating || undefined,
      short_term_trends: g.short_term_trends || undefined,
      exchange_type: g.exchange_type || 'BSE',
      section,
      category,
      is_published: true, // Published
      display_order: idx + 1,
      fetched_at: now,
      created_at: now,
    });
  });

  losers.forEach((l: any, idx: number) => {
    items.push({
      id: crypto.randomUUID(),
      ticker_id: l.ticker_id || '',
      company_name: l.company_name || 'Stock',
      price: l.price ? String(l.price) : '0.00',
      percent_change: l.percent_change ? (String(l.percent_change).startsWith('-') ? `${l.percent_change}%` : `-${l.percent_change}%`) : '-0.00%',
      net_change: l.net_change ? String(l.net_change) : undefined,
      trend_type: 'loser',
      high: l.high ? String(l.high) : undefined,
      low: l.low ? String(l.low) : undefined,
      open: l.open ? String(l.open) : undefined,
      close: l.close ? String(l.close) : undefined,
      volume: l.volume ? String(l.volume) : undefined,
      overall_rating: l.overall_rating || undefined,
      short_term_trends: l.short_term_trends || undefined,
      exchange_type: l.exchange_type || 'BSE',
      section,
      category,
      is_published: true, // Published
      display_order: 100 + idx + 1,
      fetched_at: now,
      created_at: now,
    });
  });

  if (items.length === 0) return 0;

  // Supabase: clear table on every load and insert fresh records
  if (client) {
    try {
      await client.from('trending_stocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('trending_stocks').insert(items);
    } catch (err) {
      console.warn('Supabase trending error:', err);
    }
  }

  // Local storage
  try {
    localStorage.setItem(LOCAL_TRENDING_KEY, JSON.stringify(items));
  } catch {}

  return items.length;
}

// -------------------------------------------------------------
// 4. SAVE /ipo INTO DEDICATED IPOS TABLE (PUBLISHED, SECTION: IPO Watch)
// -------------------------------------------------------------
export async function saveIposToDedicatedTable(
  ipoRaw: any,
  section: Section | string = 'IPO Watch',
  category: Category | string = 'IPO Pipeline'
): Promise<number> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  const categories: Array<{ key: 'active' | 'upcoming' | 'listed' | 'closed' | 'pre_apply'; label: string }> = [
    { key: 'active', label: 'active' },
    { key: 'upcoming', label: 'upcoming' },
    { key: 'listed', label: 'listed' },
    { key: 'closed', label: 'closed' },
  ];

  const items: IpoItemRecord[] = [];
  let order = 1;

  for (const cat of categories) {
    const list = Array.isArray(ipoRaw?.[cat.key]) ? ipoRaw[cat.key] : [];
    for (const ipo of list) {
      const isSme = Boolean(ipo.is_sme);
      items.push({
        id: crypto.randomUUID(),
        symbol: ipo.symbol || ipo.name || 'IPO',
        name: ipo.name || ipo.symbol || 'Public Issue',
        status: cat.key,
        is_sme: isSme,
        additional_text: ipo.additional_text || undefined,
        min_price: ipo.min_price != null ? Number(ipo.min_price) : null,
        max_price: ipo.max_price != null ? Number(ipo.max_price) : null,
        issue_price: ipo.issue_price != null ? Number(ipo.issue_price) : null,
        listing_price: ipo.listing_price != null ? Number(ipo.listing_price) : null,
        listing_gains: ipo.listing_gains || null,
        bidding_start_date: ipo.bidding_start_date || null,
        bidding_end_date: ipo.bidding_end_date || null,
        listing_date: ipo.listing_date || null,
        lot_size: ipo.lot_size != null ? Number(ipo.lot_size) : null,
        document_url: ipo.document_url || null,
        section,
        category: isSme ? 'SME IPO' : 'Mainboard IPO',
        is_published: true, // Published
        display_order: order++,
        fetched_at: now,
        created_at: now,
      });
    }
  }

  if (items.length === 0) return 0;

  // Supabase: clear table on every load and insert fresh records
  if (client) {
    try {
      await client.from('ipos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('ipos').insert(items);
    } catch (err) {
      console.warn('Supabase ipos error:', err);
    }
  }

  // Local storage
  try {
    localStorage.setItem(LOCAL_IPOS_KEY, JSON.stringify(items));
  } catch {}

  return items.length;
}

// -------------------------------------------------------------
// 5. SAVE /stock INTO INDIAN STOCK DATA TABLE (PUBLISHED)
// -------------------------------------------------------------
export async function saveCompanyStockLookup(
  symbol: string,
  stockData: any
): Promise<boolean> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  const record = {
    id: crypto.randomUUID(),
    endpoint: 'stock',
    query: symbol,
    title: `${symbol} Company Overview & Key Metrics`,
    summary: typeof stockData === 'object' && stockData?.companyName ? `${stockData.companyName} (${symbol}) fundamental dossier.` : 'Company stock details.',
    data: stockData,
    fetched_at: now,
    section: 'Investment Insights',
    category: 'Stock Recommendations',
    is_published: true,
    display_order: 1,
    created_at: now,
    updated_at: now,
  };

  if (client) {
    try {
      await client.from('indian_stock_data').insert(record);
    } catch (err) {
      console.warn('Supabase stock lookup error:', err);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STOCK_DATA_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_STOCK_DATA_KEY, JSON.stringify(list));
  } catch {}

  return true;
}

// -------------------------------------------------------------
// READ HELPERS FOR CONSUMER FEEDS & PANELS
// -------------------------------------------------------------
export async function fetchTrendingStocks(onlyPublished: boolean = true): Promise<TrendingStockItem[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('trending_stocks').select('*').order('display_order', { ascending: true });
      if (onlyPublished) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as TrendingStockItem[];
    } catch {}
  }

  try {
    const raw = localStorage.getItem(LOCAL_TRENDING_KEY);
    const list: TrendingStockItem[] = raw ? JSON.parse(raw) : [];
    return onlyPublished ? list.filter((i) => i.is_published) : list;
  } catch {
    return [];
  }
}

export async function fetchIpos(onlyPublished: boolean = true): Promise<IpoItemRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('ipos').select('*').order('display_order', { ascending: true });
      if (onlyPublished) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as IpoItemRecord[];
    } catch {}
  }

  try {
    const raw = localStorage.getItem(LOCAL_IPOS_KEY);
    const list: IpoItemRecord[] = raw ? JSON.parse(raw) : [];
    return onlyPublished ? list.filter((i) => i.is_published) : list;
  } catch {
    return [];
  }
}

export async function fetchSavedStockData(filters?: {
  endpoint?: IndianApiEndpoint;
  section?: string;
  category?: string;
  is_published?: boolean;
}): Promise<any[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('indian_stock_data').select('*').order('fetched_at', { ascending: false });
      if (filters?.endpoint) query = query.eq('endpoint', filters.endpoint);
      if (filters?.section) query = query.eq('section', filters.section);
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.is_published !== undefined) query = query.eq('is_published', filters.is_published);

      const { data, error } = await query;
      if (!error && data) return data;
    } catch {}
  }

  try {
    const raw = localStorage.getItem(LOCAL_STOCK_DATA_KEY);
    let list: any[] = raw ? JSON.parse(raw) : [];
    if (filters?.endpoint) list = list.filter((r) => r.endpoint === filters.endpoint);
    if (filters?.section) list = list.filter((r) => r.section === filters.section);
    if (filters?.category) list = list.filter((r) => r.category === filters.category);
    if (filters?.is_published !== undefined) list = list.filter((r) => r.is_published === filters.is_published);
    return list;
  } catch {
    return [];
  }
}

export async function getApiUsageEstimate(): Promise<{
  totalThisMonth: number;
  remaining: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { totalThisMonth: 0, remaining: 500 };
  }

  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const { data, error } = await client
      .from('indian_stock_data')
      .select('endpoint, fetched_at')
      .gte('fetched_at', monthStart.toISOString());

    const total = !error && data ? data.length : 0;
    return {
      totalThisMonth: total,
      remaining: Math.max(0, 500 - total),
    };
  } catch {
    return { totalThisMonth: 0, remaining: 500 };
  }
}

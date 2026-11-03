/**
 * Indian Stock Market API Service
 * Base URL: https://stock.indianapi.in
 * Rate limit: 500 requests/month — uses 6-hour Supabase caching per endpoint+query
 */

import { getSupabaseClient } from './supabase';
import { Section, Category, TrendingStockItem } from '../types/story';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const INDIAN_API_KEY = 'sk-live-nZAhOd7knZDf9m0LGC4TaqbgW0ipBN3jFhli0hLs';
export const INDIAN_API_BASE = 'https://stock.indianapi.in';

/** Valid endpoint identifiers for the Indian Stock API */
export type IndianApiEndpoint = 'trending' | 'news' | 'ipo' | 'stock';

/** Maximum age (ms) before cached data is considered stale */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const LOCAL_TRENDING_KEY = 'financial_editorial_trending_stocks_v1';

function getLocalTrendingStocks(): TrendingStockItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRENDING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function setLocalTrendingStocks(items: TrendingStockItem[]) {
  try {
    localStorage.setItem(LOCAL_TRENDING_KEY, JSON.stringify(items));
  } catch {}
}

const LOCAL_STOCK_DATA_KEY = 'financial_editorial_indian_stock_data_v1';

function getLocalStockData(): StockDataRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STOCK_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function setLocalStockData(records: StockDataRecord[]) {
  try {
    localStorage.setItem(LOCAL_STOCK_DATA_KEY, JSON.stringify(records));
  } catch {}
}


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockDataRecord {
  id: string;
  endpoint: IndianApiEndpoint;
  query?: string;
  data: unknown;
  fetched_at: string;
  section: string;
  category: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FetchApiResult {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
  cachedAgeMs?: number;
}

export interface ApiUsageEntry {
  endpoint: IndianApiEndpoint;
  count: number;
}

// ---------------------------------------------------------------------------
// Typed response shapes returned by the API endpoints
// ---------------------------------------------------------------------------

export interface TrendingStock {
  symbol?: string;
  companyName?: string;
  price?: number | string;
  change?: number | string;
  percentChange?: number | string;
  volume?: number | string;
  [key: string]: unknown;
}

export interface NewsArticle {
  title?: string;
  summary?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: string;
  [key: string]: unknown;
}

export interface IpoItem {
  company?: string;
  companyName?: string;
  openDate?: string;
  closeDate?: string;
  listingDate?: string;
  issuePrice?: number | string;
  lotSize?: number | string;
  [key: string]: unknown;
}

export interface StockDetail {
  companyName?: string;
  symbol?: string;
  currentPrice?: number | string;
  industry?: string;
  marketCap?: number | string;
  peRatio?: number | string;
  eps?: number | string;
  fiftyTwoWeekHigh?: number | string;
  fiftyTwoWeekLow?: number | string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Core API call
// ---------------------------------------------------------------------------

/**
 * Fetches data from the Indian Stock API with smart Supabase caching.
 * Before hitting the live API, checks if a cached record exists within the last 6 hours.
 */
export async function fetchFromIndianApi(
  endpoint: IndianApiEndpoint,
  query?: string
): Promise<FetchApiResult> {
  const client = getSupabaseClient();

  // --- 1. Check Supabase cache first ---
  if (client) {
    try {
      let cacheQuery = client
        .from('indian_stock_data')
        .select('*')
        .eq('endpoint', endpoint);

      if (endpoint === 'stock' && query) {
        cacheQuery = cacheQuery.eq('query', query);
      } else {
        // For non-stock endpoints, match rows with no query
        cacheQuery = cacheQuery.is('query', null);
      }

      const { data: cacheRows, error: cacheError } = await cacheQuery
        .order('fetched_at', { ascending: false })
        .limit(1);

      if (!cacheError && cacheRows && cacheRows.length > 0) {
        const cached = cacheRows[0] as StockDataRecord;
        const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
        if (ageMs < CACHE_TTL_MS) {
          return {
            success: true,
            data: cached.data,
            cached: true,
            cachedAgeMs: ageMs,
          };
        }
      }
    } catch {
      // cache check failed — proceed to live fetch
    }
  }

  // --- 2. Live API fetch ---
  try {
    let url = `${INDIAN_API_BASE}/${endpoint}`;
    if (endpoint === 'stock' && query) {
      url += `?name=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': INDIAN_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      return {
        success: false,
        error: `API error ${response.status}: ${errText}`,
      };
    }

    const data: unknown = await response.json();
    return { success: true, data, cached: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error calling IndianAPI';
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Supabase CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Upserts a fetched API response into the indian_stock_data table.
 * Uses the unique index on (endpoint, COALESCE(query, '')) for conflict resolution.
 */
export async function saveStockDataToSupabase(
  endpoint: IndianApiEndpoint,
  query: string | undefined,
  data: unknown,
  section: Section | string,
  category: Category | string
): Promise<{ success: boolean; record?: StockDataRecord; error?: string; isLocalFallback?: boolean }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  const record: StockDataRecord = {
    id: crypto.randomUUID(),
    endpoint,
    query: query || undefined,
    data,
    fetched_at: now,
    section: section as string,
    category: category as string,
    is_published: false,
    display_order: 0,
    created_at: now,
    updated_at: now,
  };

  if (client) {
    try {
      // 1. Try upserting directly
      const payload: any = {
        endpoint,
        query: query || null,
        data,
        fetched_at: now,
        section,
        category,
        is_published: false,
        display_order: 0,
        updated_at: now,
      };

      const { data: row, error } = await client
        .from('indian_stock_data')
        .insert(payload)
        .select()
        .single();

      if (!error && row) {
        return { success: true, record: row as StockDataRecord };
      }

      // If insert failed because table or constraint issue, report error or fallback
      if (error) {
        console.warn('Supabase save error, storing in local fallback:', error.message);
        // Fall through to local fallback so user action never fails
      }
    } catch (err: any) {
      console.warn('Supabase connection error:', err?.message);
    }
  }

  // Local storage fallback (consistent with stories & market tickers engine)
  const list = getLocalStockData();
  const existingIdx = list.findIndex(
    (r) => r.endpoint === endpoint && (r.query || '') === (query || '')
  );

  if (existingIdx >= 0) {
    record.id = list[existingIdx].id;
    record.created_at = list[existingIdx].created_at;
    list[existingIdx] = record;
  } else {
    list.unshift(record);
  }

  setLocalStockData(list);
  return {
    success: true,
    record,
    isLocalFallback: !client,
  };
}

/**
 * Fetches saved stock data records from Supabase with optional filters.
 */
export async function fetchSavedStockData(filters?: {
  endpoint?: IndianApiEndpoint;
  section?: string;
  category?: string;
  is_published?: boolean;
}): Promise<StockDataRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client
        .from('indian_stock_data')
        .select('*')
        .order('fetched_at', { ascending: false });

      if (filters?.endpoint) {
        query = query.eq('endpoint', filters.endpoint);
      }
      if (filters?.section) {
        query = query.eq('section', filters.section);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_published !== undefined) {
        query = query.eq('is_published', filters.is_published);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as StockDataRecord[];
      }
    } catch {}
  }

  // Local fallback
  let list = getLocalStockData();
  if (filters?.endpoint) {
    list = list.filter((r) => r.endpoint === filters.endpoint);
  }
  if (filters?.section) {
    list = list.filter((r) => r.section === filters.section);
  }
  if (filters?.category) {
    list = list.filter((r) => r.category === filters.category);
  }
  if (filters?.is_published !== undefined) {
    list = list.filter((r) => r.is_published === filters.is_published);
  }
  return list;
}

/**
 * Toggles the is_published state of a stock data record.
 */
export async function updateStockDataPublishStatus(
  id: string,
  is_published: boolean
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('indian_stock_data')
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return { success: true };
    } catch {}
  }

  // Local update
  const list = getLocalStockData();
  const item = list.find((r) => r.id === id);
  if (item) {
    item.is_published = is_published;
    item.updated_at = new Date().toISOString();
    setLocalStockData(list);
  }
  return { success: true };
}

/**
 * Deletes a stock data record by ID.
 */
export async function deleteStockData(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('indian_stock_data').delete().eq('id', id);
      if (!error) return { success: true };
    } catch {}
  }

  const list = getLocalStockData().filter((r) => r.id !== id);
  setLocalStockData(list);
  return { success: true };
}

/**
 * Counts today's actual API fetches (non-cached records) from Supabase,
 * grouped by endpoint. Used for the API usage banner.
 */
export async function getApiUsageEstimate(): Promise<{
  totalThisMonth: number;
  byEndpoint: ApiUsageEntry[];
  remaining: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { totalThisMonth: 0, byEndpoint: [], remaining: 500 };
  }

  try {
    // Start of current month UTC (e.g., 2026-11-01T00:00:00.000Z)
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const { data, error } = await client
      .from('indian_stock_data')
      .select('endpoint, fetched_at')
      .gte('fetched_at', monthStart.toISOString());

    if (error || !data) {
      return { totalThisMonth: 0, byEndpoint: [], remaining: 500 };
    }

    // Count per endpoint
    const countMap: Record<string, number> = {};
    for (const row of data as { endpoint: string; fetched_at: string }[]) {
      countMap[row.endpoint] = (countMap[row.endpoint] ?? 0) + 1;
    }

    const byEndpoint: ApiUsageEntry[] = (Object.entries(countMap) as [IndianApiEndpoint, number][]).map(
      ([endpoint, count]) => ({ endpoint, count })
    );

    const totalThisMonth = data.length;
    return {
      totalThisMonth,
      byEndpoint,
      remaining: Math.max(0, 500 - totalThisMonth),
    };
  } catch {
    return { totalThisMonth: 0, byEndpoint: [], remaining: 500 };
  }
}



/**
 * Clears the public.trending_stocks table and repopulates it with the latest
 * top gainers and losers from IndianAPI.
 */
export async function saveTrendingStocksToDedicatedTable(
  apiResponse: any,
  section: Section | string = 'Market News',
  category: Category | string = 'Market Trends'
): Promise<{ success: boolean; count?: number; error?: string }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  // Extract gainers and losers from response
  const trendingContainer = apiResponse?.trending_stocks || apiResponse;
  const gainers: any[] = Array.isArray(trendingContainer?.top_gainers) ? trendingContainer.top_gainers : [];
  const losers: any[] = Array.isArray(trendingContainer?.top_losers) ? trendingContainer.top_losers : [];

  const itemsToInsert: TrendingStockItem[] = [];

  gainers.forEach((g: any, idx: number) => {
    itemsToInsert.push({
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
      is_published: true,
      display_order: idx + 1,
      fetched_at: now,
      created_at: now,
    });
  });

  losers.forEach((l: any, idx: number) => {
    itemsToInsert.push({
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
      is_published: true,
      display_order: 100 + idx + 1,
      fetched_at: now,
      created_at: now,
    });
  });

  if (itemsToInsert.length === 0) {
    return { success: false, error: 'No trending stocks found in API response.' };
  }

  // 1. Try Supabase: Clear table and re-insert
  if (client) {
    try {
      // Clear existing records in trending_stocks on every load
      await client.from('trending_stocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data, error } = await client.from('trending_stocks').insert(itemsToInsert).select();
      if (!error) {
        return { success: true, count: data?.length || itemsToInsert.length };
      }
      console.warn('Supabase trending insert warning:', error.message);
    } catch (err: any) {
      console.warn('Supabase trending error:', err?.message);
    }
  }

  // 2. Local Fallback: Clear and save
  setLocalTrendingStocks(itemsToInsert);
  return { success: true, count: itemsToInsert.length };
}

/**
 * Fetches current trending stocks from public.trending_stocks or local storage
 */
export async function fetchTrendingStocks(onlyPublished: boolean = true): Promise<TrendingStockItem[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client
        .from('trending_stocks')
        .select('*')
        .order('display_order', { ascending: true });

      if (onlyPublished) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as TrendingStockItem[];
      }
    } catch {}
  }

  const list = getLocalTrendingStocks();
  if (onlyPublished) {
    return list.filter((item) => item.is_published);
  }
  return list;
}

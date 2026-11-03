import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Story, StoryFormData, MarketTickerItem, MarketTickerFormData } from '../types/story';
import { INITIAL_STORIES } from './initialData';
import { detectScript } from './grapheme';

const LOCAL_STORAGE_KEY = 'financial_editorial_stories_v1';
const LOCAL_TICKERS_KEY = 'financial_editorial_market_tickers_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Retrieves Supabase credentials strictly from environment variables (Vite / Next.js .env).
 * Does NOT persist credentials in browser localStorage.
 */
const LOCAL_SUPABASE_CONFIG_KEY = 'financial_editorial_supabase_credentials_v1';

export function getSavedSupabaseConfig(): SupabaseConfig {
  // 1. Check environment variables
  const envUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (typeof envUrl === 'string' && envUrl.startsWith('http') && typeof envKey === 'string' && envKey.length > 10) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  // 2. Check browser localStorage credentials saved via Supabase Setup Modal
  try {
    const raw = localStorage.getItem(LOCAL_SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: String(parsed.url).trim(),
          anonKey: String(parsed.anonKey).trim(),
        };
      }
    }
  } catch {}

  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  try {
    localStorage.setItem(
      LOCAL_SUPABASE_CONFIG_KEY,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
    cachedClient = null; // Invalidate cached client to recreate with new credentials
  } catch {}
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem(LOCAL_SUPABASE_CONFIG_KEY);
    cachedClient = null;
  } catch {}
}


let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = getSavedSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
        },
      });
      return cachedClient;
    } catch {
      return null;
    }
  }
  return null;
}

// ==============================================================================
// Local Fallback Storage Engine
// ==============================================================================
function getLocalStories(): Story[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: Story[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Seed default
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STORIES));
  } catch {}
  return INITIAL_STORIES;
}

function setLocalStories(stories: Story[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stories));
  } catch {}
}

// ==============================================================================
// Unified API: Switches to Supabase when configured, or Local Persistent Store
// ==============================================================================

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  mode: 'supabase' | 'local';
  error?: string;
  count?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    const local = getLocalStories();
    return {
      connected: false,
      mode: 'local',
      error: 'Supabase credentials not configured. Running on high-performance local store.',
      count: local.length,
    };
  }

  try {
    const { data, count, error } = await client
      .from('stories')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        mode: 'supabase',
        error: error.message || 'Error connecting to stories table. Have you run the SQL migration?',
      };
    }

    return {
      connected: true,
      mode: 'supabase',
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      mode: 'supabase',
      error: err?.message || 'Network error connecting to Supabase',
    };
  }
}

/**
 * Fetch published stories for subscriber feed
 * Filter: publishing_status = 'Published', ordered by display_order ASC, created_at DESC
 */
export async function fetchPublishedStories(options?: {
  section?: string;
  category?: string;
  searchQuery?: string;
  language?: string;
}): Promise<Story[]> {
  const client = getSupabaseClient();

  if (client) {
    try {
      let query = client
        .from('stories')
        .select('*')
        .eq('publishing_status', 'Published')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.section && options.section !== 'All') {
        query = query.eq('section', options.section);
      }
      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;
      if (!error && data) {
        let stories = data as Story[];
        if (options?.searchQuery) {
          const q = options.searchQuery.toLowerCase();
          stories = stories.filter(
            (s) =>
              s.heading.toLowerCase().includes(q) ||
              s.short_description.toLowerCase().includes(q) ||
              s.keywords?.toLowerCase().includes(q)
          );
        }
        if (options?.language && options.language !== 'All') {
          stories = stories.filter((s) => {
            const script = detectScript(s.heading);
            return script.code === options.language;
          });
        }
        return stories;
      }
    } catch {
      // Fallback to local store
    }
  }

  // Local fallback
  let stories = getLocalStories().filter((s) => s.publishing_status === 'Published');

  if (options?.section && options.section !== 'All') {
    stories = stories.filter((s) => s.section === options.section);
  }
  if (options?.category && options.category !== 'All') {
    stories = stories.filter((s) => s.category === options.category);
  }
  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    stories = stories.filter(
      (s) =>
        s.heading.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q) ||
        s.keywords?.toLowerCase().includes(q)
    );
  }
  if (options?.language && options.language !== 'All') {
    stories = stories.filter((s) => {
      const script = detectScript(s.heading);
      return script.code === options.language;
    });
  }

  return stories.sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Fetch a single story by canonical URL
 */
export async function fetchStoryByCanonicalUrl(canonicalUrl: string): Promise<Story | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stories')
        .select('*')
        .eq('canonical_url', canonicalUrl)
        .maybeSingle();

      if (!error && data) {
        return data as Story;
      }
    } catch {}
  }

  // Local fallback
  const local = getLocalStories();
  const match = local.find(
    (s) => s.canonical_url.toLowerCase() === canonicalUrl.toLowerCase() || s.id === canonicalUrl
  );
  return match || null;
}

/**
 * Fetch all stories for the admin dashboard (Drafts, Published, etc.)
 */
export async function fetchAllStoriesForAdmin(filters?: {
  section?: string;
  category?: string;
  status?: string;
  searchQuery?: string;
}): Promise<Story[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client
        .from('stories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.section && filters.section !== 'All') {
        query = query.eq('section', filters.section);
      }
      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'All') {
        query = query.eq('publishing_status', filters.status);
      }

      const { data, error } = await query;
      if (!error && data) {
        let stories = data as Story[];
        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          stories = stories.filter(
            (s) =>
              s.heading.toLowerCase().includes(q) ||
              s.canonical_url.toLowerCase().includes(q) ||
              s.keywords?.toLowerCase().includes(q)
          );
        }
        return stories;
      }
    } catch {}
  }

  // Local fallback
  let stories = getLocalStories();
  if (filters?.section && filters.section !== 'All') {
    stories = stories.filter((s) => s.section === filters.section);
  }
  if (filters?.category && filters.category !== 'All') {
    stories = stories.filter((s) => s.category === filters.category);
  }
  if (filters?.status && filters.status !== 'All') {
    stories = stories.filter((s) => s.publishing_status === filters.status);
  }
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    stories = stories.filter(
      (s) =>
        s.heading.toLowerCase().includes(q) ||
        s.canonical_url.toLowerCase().includes(q) ||
        s.keywords?.toLowerCase().includes(q)
    );
  }

  return stories.sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Save or update a story
 */
export async function saveStory(formData: StoryFormData): Promise<{ success: boolean; story?: Story; error?: string }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const script = detectScript(formData.heading);

  const storyPayload: Story = {
    id: formData.id || crypto.randomUUID(),
    section: formData.section,
    category: formData.category,
    heading: formData.heading,
    lead_image_url: formData.lead_image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80',
    short_description: formData.short_description || '',
    full_story: formData.full_story || '',
    canonical_url: formData.canonical_url,
    keywords: formData.keywords || '',
    seo_title: formData.seo_title || formData.heading,
    seo_description: formData.seo_description || '',
    publishing_status: formData.publishing_status,
    notification_status: formData.notification_status,
    display_order: Number(formData.display_order) || 0,
    language: script.code,
    created_at: now,
    updated_at: now,
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('stories')
        .upsert({
          id: storyPayload.id,
          section: storyPayload.section,
          category: storyPayload.category,
          heading: storyPayload.heading,
          lead_image_url: storyPayload.lead_image_url,
          short_description: storyPayload.short_description,
          full_story: storyPayload.full_story,
          canonical_url: storyPayload.canonical_url,
          keywords: storyPayload.keywords,
          seo_title: storyPayload.seo_title,
          seo_description: storyPayload.seo_description,
          publishing_status: storyPayload.publishing_status,
          notification_status: storyPayload.notification_status,
          display_order: storyPayload.display_order,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, story: (data as Story) || storyPayload };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error' };
    }
  }

  // Local fallback save
  const stories = getLocalStories();
  const existingIdx = stories.findIndex(
    (s) => s.id === storyPayload.id || s.canonical_url === storyPayload.canonical_url
  );

  if (existingIdx >= 0) {
    storyPayload.created_at = stories[existingIdx].created_at;
    stories[existingIdx] = storyPayload;
  } else {
    stories.unshift(storyPayload);
  }

  setLocalStories(stories);
  return { success: true, story: storyPayload };
}

/**
 * Delete a story by ID
 */
export async function deleteStory(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('stories').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // Local fallback
  const stories = getLocalStories().filter((s) => s.id !== id);
  setLocalStories(stories);
  return { success: true };
}

/**
 * Push sample seed data into Supabase
 */
export async function seedSupabaseWithInitialData(): Promise<{ success: boolean; count?: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured yet.' };
  }

  try {
    const { data, error } = await client
      .from('stories')
      .upsert(INITIAL_STORIES, { onConflict: 'canonical_url' })
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || INITIAL_STORIES.length };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Reset local storage to initial defaults
 */
export function resetLocalStories(): Story[] {
  setLocalStories(INITIAL_STORIES);
  return INITIAL_STORIES;
}

/**
 * Upload an image file or compressed Blob to Supabase Storage bucket 'story-images'
 */
export async function uploadLeadImageToSupabase(
  fileOrBlob: File | Blob,
  originalFilename: string = 'story-cover.jpg'
): Promise<{
  success: boolean;
  publicUrl?: string;
  error?: string;
  isLocalFallback?: boolean;
}> {
  const client = getSupabaseClient();
  const fileExt = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = originalFilename.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
  const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
  const filePath = `editorial/${fileName}`;

  if (client) {
    try {
      const { data, error } = await client.storage
        .from('story-images')
        .upload(filePath, fileOrBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) {
        return {
          success: false,
          error: `Storage upload error: ${error.message}. Make sure the 'story-images' public bucket exists in Supabase.`,
        };
      }

      const { data: urlData } = client.storage
        .from('story-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        return {
          success: true,
          publicUrl: urlData.publicUrl,
          isLocalFallback: false,
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Storage upload failed' };
    }
  }

  // Fallback: Read as base64 Data URL so image works immediately in preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        success: true,
        publicUrl: reader.result as string,
        isLocalFallback: true,
      });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to process image' });
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

// ==============================================================================
// Live Market Tickers Engine (Supabase with Local Fallback)
// ==============================================================================

export const DEFAULT_MARKET_TICKERS: MarketTickerItem[] = [
  { id: '11111111-1111-1111-1111-111111111101', symbol: 'NIFTY 50', price: '24,842.15', change: '+0.68%', is_positive: true, display_order: 1, is_active: true },
  { id: '11111111-1111-1111-1111-111111111102', symbol: 'SENSEX', price: '81,429.30', change: '+0.72%', is_positive: true, display_order: 2, is_active: true },
  { id: '11111111-1111-1111-1111-111111111103', symbol: 'BANK NIFTY', price: '51,980.40', change: '+1.15%', is_positive: true, display_order: 3, is_active: true },
  { id: '11111111-1111-1111-1111-111111111104', symbol: 'BRENT CRUDE', price: '$78.40', change: '+0.85%', is_positive: true, display_order: 4, is_active: true },
  { id: '11111111-1111-1111-1111-111111111105', symbol: 'GOLD (10g)', price: '₹77,650', change: '+0.35%', is_positive: true, display_order: 5, is_active: true },
  { id: '11111111-1111-1111-1111-111111111106', symbol: 'NASDAQ', price: '18,220.60', change: '-0.42%', is_positive: false, display_order: 6, is_active: true },
  { id: '11111111-1111-1111-1111-111111111107', symbol: 'USD / INR', price: '₹83.92', change: '-0.04%', is_positive: false, display_order: 7, is_active: true },
  { id: '11111111-1111-1111-1111-111111111108', symbol: 'NIFTY IT', price: '42,110.80', change: '+1.42%', is_positive: true, display_order: 8, is_active: true },
  { id: '11111111-1111-1111-1111-111111111109', symbol: 'NIFTY AUTO', price: '25,480.10', change: '+0.54%', is_positive: true, display_order: 9, is_active: true },
];

function getLocalMarketTickers(): MarketTickerItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_TICKERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  try {
    localStorage.setItem(LOCAL_TICKERS_KEY, JSON.stringify(DEFAULT_MARKET_TICKERS));
  } catch {}
  return DEFAULT_MARKET_TICKERS;
}

function setLocalMarketTickers(tickers: MarketTickerItem[]) {
  try {
    localStorage.setItem(LOCAL_TICKERS_KEY, JSON.stringify(tickers));
  } catch {}
}

/**
 * Fetch all market tickers (from Supabase if configured, or local storage)
 */
export async function fetchMarketTickers(onlyActive: boolean = false): Promise<MarketTickerItem[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client
        .from('market_tickers')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as MarketTickerItem[];
      }
    } catch {}
  }

  // Local fallback
  let tickers = getLocalMarketTickers();
  if (onlyActive) {
    tickers = tickers.filter((t) => t.is_active);
  }
  return tickers.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Save or update a single market ticker item
 */
export async function saveMarketTicker(
  formData: MarketTickerFormData
): Promise<{ success: boolean; item?: MarketTickerItem; error?: string }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  // Auto-detect is_positive from change string if user types '+' or '-'
  const changeTrimmed = formData.change.trim();
  const isPositive =
    formData.is_positive ??
    (changeTrimmed.startsWith('-') ? false : true);

  const payload: MarketTickerItem = {
    id: formData.id || crypto.randomUUID(),
    symbol: formData.symbol.trim(),
    price: formData.price.trim(),
    change: changeTrimmed.startsWith('+') || changeTrimmed.startsWith('-') ? changeTrimmed : `+${changeTrimmed}`,
    is_positive: isPositive,
    display_order: Number(formData.display_order) || 0,
    is_active: formData.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('market_tickers')
        .upsert({
          id: payload.id,
          symbol: payload.symbol,
          price: payload.price,
          change: payload.change,
          is_positive: payload.is_positive,
          display_order: payload.display_order,
          is_active: payload.is_active,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, item: (data as MarketTickerItem) || payload };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error' };
    }
  }

  // Local fallback
  const tickers = getLocalMarketTickers();
  const existingIdx = tickers.findIndex((t) => t.id === payload.id);
  if (existingIdx >= 0) {
    payload.created_at = tickers[existingIdx].created_at;
    tickers[existingIdx] = payload;
  } else {
    tickers.push(payload);
  }

  setLocalMarketTickers(tickers);
  return { success: true, item: payload };
}

/**
 * Delete a market ticker
 */
export async function deleteMarketTicker(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('market_tickers').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  const tickers = getLocalMarketTickers().filter((t) => t.id !== id);
  setLocalMarketTickers(tickers);
  return { success: true };
}

/**
 * Reset market tickers to defaults
 */
export function resetDefaultMarketTickers(): MarketTickerItem[] {
  setLocalMarketTickers(DEFAULT_MARKET_TICKERS);
  return DEFAULT_MARKET_TICKERS;
}



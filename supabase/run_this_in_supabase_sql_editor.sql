-- ==============================================================================
-- Idempotent Supabase Migration: Full Schema Setup
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard)
-- Project: https://yfsgudewhwialobsyrpg.supabase.co
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('Investment Insights', 'Market News', 'Special Coverage')),
  category TEXT NOT NULL CHECK (category IN (
    'Financial Planning',
    'Big Story',
    'Results Calendar',
    'Event Calendar',
    'Class Room',
    'Political Theatre',
    'Market Trends',
    'Mutual Fund',
    'Stock Recommendations',
    'Portfolio',
    'Sector Scan',
    'Economy Watch',
    'Personal Finance',
    'Insurance',
    'Tax Planning'
  )),
  heading VARCHAR(70) NOT NULL,
  lead_image_url TEXT,
  short_description TEXT,
  full_story TEXT,
  canonical_url TEXT NOT NULL UNIQUE,
  keywords TEXT,
  seo_title TEXT,
  seo_description TEXT,
  publishing_status TEXT NOT NULL DEFAULT 'Draft' CHECK (publishing_status IN ('Draft', 'Ready to Publish', 'Published', 'Retired')),
  notification_status TEXT NOT NULL DEFAULT 'No' CHECK (notification_status IN ('Yes', 'No')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_canonical_url ON public.stories (canonical_url);
CREATE INDEX IF NOT EXISTS idx_stories_publishing_status ON public.stories (publishing_status);
CREATE INDEX IF NOT EXISTS idx_stories_section ON public.stories (section);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories (category);

-- 2. Live Market Tickers Table
CREATE TABLE IF NOT EXISTS public.market_tickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price TEXT NOT NULL,
  change TEXT NOT NULL,
  is_positive BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_market_tickers_display_order ON public.market_tickers (display_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_market_tickers_is_active ON public.market_tickers (is_active);

-- 3. Indian Stock Market API Data Table
CREATE TABLE IF NOT EXISTS public.indian_stock_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL CHECK (endpoint IN ('trending', 'news', 'ipo', 'stock')),
  query TEXT,
  title TEXT,
  summary TEXT,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  section TEXT NOT NULL DEFAULT 'Market News',
  category TEXT NOT NULL DEFAULT 'Market Trends',
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_indian_stock_data_endpoint ON public.indian_stock_data (endpoint);
CREATE INDEX IF NOT EXISTS idx_indian_stock_data_is_published ON public.indian_stock_data (is_published);
CREATE INDEX IF NOT EXISTS idx_indian_stock_data_section ON public.indian_stock_data (section);
CREATE INDEX IF NOT EXISTS idx_indian_stock_data_category ON public.indian_stock_data (category);
CREATE INDEX IF NOT EXISTS idx_indian_stock_data_fetched_at ON public.indian_stock_data (fetched_at DESC);

-- 4. Dedicated Trending Stocks Table (Cleared & refreshed on every load)
CREATE TABLE IF NOT EXISTS public.trending_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_id TEXT,
  company_name TEXT NOT NULL,
  price TEXT NOT NULL,
  percent_change TEXT NOT NULL,
  net_change TEXT,
  trend_type TEXT NOT NULL CHECK (trend_type IN ('gainer', 'loser')),
  high TEXT,
  low TEXT,
  open TEXT,
  close TEXT,
  volume TEXT,
  overall_rating TEXT,
  short_term_trends TEXT,
  exchange_type TEXT DEFAULT 'BSE',
  section TEXT NOT NULL DEFAULT 'Market News',
  category TEXT NOT NULL DEFAULT 'Market Trends',
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trending_stocks_type ON public.trending_stocks (trend_type);
CREATE INDEX IF NOT EXISTS idx_trending_stocks_published ON public.trending_stocks (is_published);

-- 5. Row Level Security & Policies
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indian_stock_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_stocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public stories" ON public.stories;
CREATE POLICY "Public stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public market_tickers" ON public.market_tickers;
CREATE POLICY "Public market_tickers" ON public.market_tickers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public indian_stock_data" ON public.indian_stock_data;
CREATE POLICY "Public indian_stock_data" ON public.indian_stock_data FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public trending_stocks" ON public.trending_stocks;
CREATE POLICY "Public trending_stocks" ON public.trending_stocks FOR ALL USING (true) WITH CHECK (true);


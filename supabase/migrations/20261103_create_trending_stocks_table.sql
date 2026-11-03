-- ==============================================================================
-- Idempotent Supabase Migration: trending_stocks table
-- Dedicated table for Top Trending Indian Stocks (Gainers & Losers)
-- Cleared & refreshed on every load / sync from IndianAPI
-- ==============================================================================

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
CREATE INDEX IF NOT EXISTS idx_trending_stocks_fetched_at ON public.trending_stocks (fetched_at DESC);

ALTER TABLE public.trending_stocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published trending stocks" ON public.trending_stocks;
CREATE POLICY "Public can view published trending stocks"
  ON public.trending_stocks FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Editorial staff can manage all trending stocks" ON public.trending_stocks;
CREATE POLICY "Editorial staff can manage all trending stocks"
  ON public.trending_stocks FOR ALL
  USING (true)
  WITH CHECK (true);


-- ==============================================================================
-- Idempotent Supabase Migration: indian_stock_data table
-- Store Indian Stock Market API responses with caching, section/category taxonomy & publishing workflow
-- ==============================================================================

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

-- Automatic updated_at timestamp trigger
DROP TRIGGER IF EXISTS trigger_indian_stock_data_updated_at ON public.indian_stock_data;
CREATE TRIGGER trigger_indian_stock_data_updated_at
  BEFORE UPDATE ON public.indian_stock_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.indian_stock_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published stock data" ON public.indian_stock_data;
CREATE POLICY "Public can view published stock data"
  ON public.indian_stock_data
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Editorial staff can manage all stock data" ON public.indian_stock_data;
CREATE POLICY "Editorial staff can manage all stock data"
  ON public.indian_stock_data
  FOR ALL
  USING (true)
  WITH CHECK (true);


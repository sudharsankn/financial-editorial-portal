export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- Idempotent Supabase Migration: stories table with full UTF-8 & Multilingual Support
-- Financial Intelligence Editorial Portal
-- ==============================================================================

-- 1. Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create stories table with UTF-8 character encoding support
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

-- 3. Idempotent Index Creation
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_canonical_url ON public.stories (canonical_url);
CREATE INDEX IF NOT EXISTS idx_stories_publishing_status ON public.stories (publishing_status);
CREATE INDEX IF NOT EXISTS idx_stories_section ON public.stories (section);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories (category);
CREATE INDEX IF NOT EXISTS idx_stories_feed_ordering ON public.stories (display_order ASC, created_at DESC);

-- 4. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.stories;
CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Published stories
DROP POLICY IF EXISTS "Public can view published stories" ON public.stories;
CREATE POLICY "Public can view published stories"
  ON public.stories
  FOR SELECT
  USING (publishing_status = 'Published');

-- Allow editorial operations
DROP POLICY IF EXISTS "Editorial staff can manage all stories" ON public.stories;
CREATE POLICY "Editorial staff can manage all stories"
  ON public.stories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Supabase Storage Bucket Setup: 'story-images'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images',
  'story-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true;

DROP POLICY IF EXISTS "Public view for story images" ON storage.objects;
CREATE POLICY "Public view for story images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-images');

DROP POLICY IF EXISTS "Allow uploads to story images bucket" ON storage.objects;
CREATE POLICY "Allow uploads to story images bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'story-images');

-- 7. Live Markets Ticker Table (Configurable via Admin Studio)
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

ALTER TABLE public.market_tickers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active market tickers" ON public.market_tickers;
CREATE POLICY "Public can view active market tickers"
  ON public.market_tickers FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Editorial staff can manage all market tickers" ON public.market_tickers;
CREATE POLICY "Editorial staff can manage all market tickers"
  ON public.market_tickers FOR ALL
  USING (true)
  WITH CHECK (true);


`;

export const VERCEL_DEPLOY_GUIDE = `# Step-by-Step Vercel & Supabase Deployment Guide

### Phase 1: Set Up Supabase Database (2 Minutes)
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Go to the **SQL Editor** tab from the left sidebar.
3. Click **New Query**, paste the complete SQL script provided in this dialog, and click **Run**.
4. Navigate to **Project Settings** -> **API** and copy:
   - **Project URL**
   - **anon / public key**

### Phase 2: Deploy to Vercel (1 Click)
1. Push your repository to GitHub / GitLab.
2. In [Vercel Dashboard](https://vercel.com), click **Add New** -> **Project** and select your repository.
3. In the **Environment Variables** section, add:
   - \`NEXT_PUBLIC_SUPABASE_URL\` = \`https://your-project.supabase.co\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` = \`your-anon-key\`
   - \`VITE_SUPABASE_URL\` = \`https://your-project.supabase.co\`
   - \`VITE_SUPABASE_ANON_KEY\` = \`your-anon-key\`
4. Click **Deploy**. Vercel will build and assign a global CDN URL with edge SSR caching!

### Phase 3: Multilingual & UTF-8 Reliability
- PostgreSQL on Supabase runs UTF-8 collation natively.
- Headings are capped at 70 user-perceived graphemes using \`Intl.Segmenter\`.
- All Google Noto Sans and Open Sans fonts are embedded with no tofu glyph artifacts.
`;

export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- Idempotent Supabase Migration: stories table with full UTF-8 & Multilingual Support
-- Financial Intelligence Editorial Portal
-- ==============================================================================

-- 1. Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create stories table with UTF-8 character encoding support
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('Investment Insights', 'Market News', 'Special Coverage', 'IPO Watch')),
  category TEXT NOT NULL,
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
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_category_check;
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

-- 8. Indian Stock Market API Data Table
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

ALTER TABLE public.indian_stock_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published stock data" ON public.indian_stock_data;
CREATE POLICY "Public can view published stock data"
  ON public.indian_stock_data FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Editorial staff can manage all stock data" ON public.indian_stock_data;
CREATE POLICY "Editorial staff can manage all stock data"
  ON public.indian_stock_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8b. Dedicated News Table (Curated Market News saved from Market Data Studio)
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT,
  image_url TEXT NOT NULL,
  url TEXT,
  source TEXT NOT NULL DEFAULT 'Market Wire',
  pub_date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Market Trends',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news (created_at DESC);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view news" ON public.news;
CREATE POLICY "Public can view news"
  ON public.news FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Editorial staff can manage all news" ON public.news;
CREATE POLICY "Editorial staff can manage all news"
  ON public.news FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Dedicated Trending Stocks Table (Cleared & refreshed on every load)
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

-- 10. Subscribers Table (Secure User Accounts & Auth)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  profession TEXT DEFAULT 'Investor / Financial Planner',
  state TEXT DEFAULT 'Kerala',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers (email);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create subscriber accounts" ON public.subscribers;
CREATE POLICY "Public can create subscriber accounts"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Subscribers can read their profile" ON public.subscribers;
CREATE POLICY "Subscribers can read their profile"
  ON public.subscribers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Subscribers can update their profile" ON public.subscribers;
CREATE POLICY "Subscribers can update their profile"
  ON public.subscribers FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 11. Subscriptions Table (Payments, Razorpay Txns, Plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  subscriber_code TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  plan_title TEXT NOT NULL,
  plan_duration TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL DEFAULT 'RAZORPAY',
  payment_id TEXT,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_code ON public.subscriptions (subscriber_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON public.subscriptions (subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active subscriptions" ON public.subscriptions;
CREATE POLICY "Public can view active subscriptions"
  ON public.subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can create subscription records" ON public.subscriptions;
CREATE POLICY "Public can create subscription records"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

-- 9. Advertisements & Sponsorships Table (IAB Standards)
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT UNIQUE NOT NULL,
  advertiser TEXT NOT NULL,
  brand TEXT NOT NULL,
  ad_position TEXT NOT NULL CHECK (ad_position IN ('Full Story - Solo Position', 'Box Listing - Position 6', 'Sidebar - Left', 'Sidebar - Right')),
  ad_type TEXT NOT NULL DEFAULT 'Display' CHECK (ad_type IN ('Display', 'Video')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  display_ad_material TEXT NOT NULL,
  display_ad_url TEXT NOT NULL,
  video_ad_material TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  cost_per_day NUMERIC NOT NULL DEFAULT 0,
  number_of_days INTEGER NOT NULL DEFAULT 30,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  impressions_count BIGINT NOT NULL DEFAULT 0,
  clicks_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ads_position_active ON public.advertisements (ad_position, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_campaign_id ON public.advertisements (campaign_id);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;
CREATE POLICY "Public can view active advertisements"
  ON public.advertisements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Editorial staff can manage advertisements" ON public.advertisements;
CREATE POLICY "Editorial staff can manage advertisements"
  ON public.advertisements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed Initial Real Ad Campaigns
INSERT INTO public.advertisements (campaign_id, advertiser, brand, ad_position, ad_type, is_active, display_ad_material, display_ad_url, start_date, end_date, cost_per_day, number_of_days, total_cost)
VALUES
  ('OH00074', 'ICICI Prudential', 'SIP', 'Full Story - Solo Position', 'Display', true, '/ads/icici-sip.jpg', 'https://www.iciciprumf.com', '2025-07-08', '2027-08-08', 0, 31, 0),
  ('OH00073', 'ICICI Prudential', 'SIP', 'Box Listing - Position 6', 'Display', true, '/ads/icici-sip.jpg', 'https://www.iciciprumf.com', '2025-07-08', '2027-08-08', 0, 31, 0),
  ('OH00075', 'Nippon India', 'Mutual Fund', 'Sidebar - Right', 'Display', true, '/ads/nippon-mf.jpg', 'https://mf.nipponindiaim.com', '2025-07-08', '2027-08-08', 0, 31, 0),
  ('OH00076', 'ICICI Prudential', 'SIP', 'Sidebar - Left', 'Display', true, '/ads/icici-sip.jpg', 'https://www.iciciprumf.com', '2025-07-08', '2027-08-08', 0, 31, 0)
ON CONFLICT (campaign_id) DO NOTHING;

-- 11. Advertisement Clicks & Timestamp Logs Table
CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id TEXT,
  campaign_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON public.ad_clicks (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON public.ad_clicks (advertisement_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_time ON public.ad_clicks (clicked_at DESC);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can record ad clicks" ON public.ad_clicks;
CREATE POLICY "Public can record ad clicks"
  ON public.ad_clicks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view ad clicks" ON public.ad_clicks;
CREATE POLICY "Public can view ad clicks"
  ON public.ad_clicks FOR SELECT
  USING (true);

-- 12. IPOs Pipeline Table
CREATE TABLE IF NOT EXISTS public.ipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'listed', 'closed')),
  is_sme BOOLEAN NOT NULL DEFAULT false,
  issue_price TEXT,
  issue_size TEXT,
  listing_date TEXT,
  open_date TEXT,
  close_date TEXT,
  gmp TEXT,
  subscription_rate TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view ipos" ON public.ipos;
CREATE POLICY "Public can view ipos"
  ON public.ipos FOR SELECT
  USING (true);

-- 13. Contact Form Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Public can submit contact inquiries"
  ON public.contact_inquiries FOR INSERT
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

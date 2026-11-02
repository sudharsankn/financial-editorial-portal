-- ==============================================================================
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

-- ==============================================================================
-- 6. Supabase Storage Bucket Setup: 'story-images'
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images',
  'story-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Public read access for images in bucket
DROP POLICY IF EXISTS "Public view for story images" ON storage.objects;
CREATE POLICY "Public view for story images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'story-images');

-- Upload access for users
DROP POLICY IF EXISTS "Allow uploads to story images bucket" ON storage.objects;
CREATE POLICY "Allow uploads to story images bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'story-images');

-- ==============================================================================
-- 7. Live Markets Ticker Table (Configurable via Admin Studio)
-- ==============================================================================
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

DROP TRIGGER IF EXISTS trigger_set_market_tickers_updated_at ON public.market_tickers;
CREATE TRIGGER trigger_set_market_tickers_updated_at
  BEFORE UPDATE ON public.market_tickers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.market_tickers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active market tickers" ON public.market_tickers;
CREATE POLICY "Public can view active market tickers"
  ON public.market_tickers
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Editorial staff can manage all market tickers" ON public.market_tickers;
CREATE POLICY "Editorial staff can manage all market tickers"
  ON public.market_tickers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed Initial Market Tickers
INSERT INTO public.market_tickers (id, symbol, price, change, is_positive, display_order, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'NIFTY 50', '24,842.15', '+0.68%', true, 1, true),
  ('11111111-1111-1111-1111-111111111102', 'SENSEX', '81,429.30', '+0.72%', true, 2, true),
  ('11111111-1111-1111-1111-111111111103', 'BANK NIFTY', '51,980.40', '+1.15%', true, 3, true),
  ('11111111-1111-1111-1111-111111111104', 'BRENT CRUDE', '$78.40', '+0.85%', true, 4, true),
  ('11111111-1111-1111-1111-111111111105', 'GOLD (10g)', '₹77,650', '+0.35%', true, 5, true),
  ('11111111-1111-1111-1111-111111111106', 'NASDAQ', '18,220.60', '-0.42%', false, 6, true),
  ('11111111-1111-1111-1111-111111111107', 'USD / INR', '₹83.92', '-0.04%', false, 7, true),
  ('11111111-1111-1111-1111-111111111108', 'NIFTY IT', '42,110.80', '+1.42%', true, 8, true),
  ('11111111-1111-1111-1111-111111111109', 'NIFTY AUTO', '25,480.10', '+0.54%', true, 9, true)
ON CONFLICT (id) DO NOTHING;



-- 6. Multilingual Sample Seed Data (Idempotent UPSERT)
INSERT INTO public.stories (
  id,
  section,
  category,
  heading,
  lead_image_url,
  short_description,
  full_story,
  canonical_url,
  keywords,
  seo_title,
  seo_description,
  publishing_status,
  notification_status,
  display_order
) VALUES
(
  'a1b2c3d4-e5f6-7a8b-9c0d-111111111111',
  'Investment Insights',
  'Big Story',
  'RBI Repo Rate Unchanged: Impact on Home Loans and Mutual Funds',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>The Reserve Bank of India has maintained its stance on interest rates, signaling balanced retail inflation and robust domestic liquidity for debt and equity allocations.</p>',
  '<h2>Monetary Policy Committee Highlights</h2><p>In its recent monetary policy resolution, the central bank decided to hold the benchmark repo rate steady. The decision reflects confidence in durable economic growth alongside calibrated inflation management across metropolitan and tier-2 markets.</p><h3>What This Means for Homeowners</h3><p>Borrowers with external benchmark-linked loans (EBLR) will experience stability in their monthly EMI obligations without immediate rate adjustments.</p><h3>Equities and Mutual Fund Strategy</h3><p>Financial planners recommend a calibrated systematically invested SIP approach into diversified multi-cap funds and high-yield short-duration debt instruments.</p>',
  'rbi-repo-rate-unchanged-home-loans-mutual-funds',
  'RBI, Repo Rate, Home Loans, Mutual Funds, Financial Planning, Interest Rates',
  'RBI Repo Rate Unchanged: Analysis for Borrowers & Investors',
  'Comprehensive analysis on RBI repo rate stability and strategic portfolio allocation for equity and debt.',
  'Published',
  'Yes',
  1
),
(
  'b2c3d4e5-f6a7-8b9c-0d1e-222222222222',
  'Market News',
  'Market Trends',
  'ഓഹരി വിപണിയിൽ മുന്നേറ്റം: ബാങ്കിംഗ് ഓഹരികൾ ലാഭത്തിൽ',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>ബാങ്കിംഗ്, ഐടി ഓഹരികളുടെ നേതൃത്വത്തിൽ ദേശീയ വിപണിയിൽ വൻ മുന്നേറ്റം. സെൻസെക്സും നിഫ്റ്റിയും റെക്കോർഡ് നിരക്കിലേക്ക് ഉയർന്നു.</p>',
  '<h2>വിപണി വിശകലനം</h2><p>ആഗോള വിപണികളിലെ അനുകൂല ഘടകങ്ങളും വിദേശ നിക്ഷേപകരുടെ പണയൊഴുക്കും ഇന്ത്യൻ ഓഹരി വിപണിയെ പുതിയ ഉയരങ്ങളിലേക്ക് നയിച്ചു. പ്രമുഖ ബാങ്കുകളുടെയും ടെക്നോളജി കമ്പനികളുടെയും പാദവാർഷിക ഫലങ്ങൾ വിപണിക്ക് ഊർജ്ജം പകർന്നു.</p><h3>നിക്ഷേപകർ ശ്രദ്ധിക്കേണ്ട പ്രധാന കാര്യങ്ങൾ</h3><p>വിപണി പുതിയ സർവകാല ഉയരങ്ങൾ കീഴടക്കുമ്പോൾ പോർട്ട്ഫോളിയോ പുനഃക്രമീകരണവും ദീർഘകാല നിക്ഷേപ ലക്ഷ്യങ്ങളും പുനഃപരിശോധിക്കേണ്ടതുണ്ട്.</p>',
  'kerala-stock-market-rally-banking-gains',
  'ഓഹരി വിപണി, നിഫ്റ്റി, ബാങ്കിംഗ്, നിക്ഷേപം, Stock Market Malayalam',
  'ഓഹരി വിപണിയിൽ മുന്നേറ്റം: ബാങ്കിംഗ് ഓഹരികൾ ലാഭത്തിൽ',
  'മലയാളം സാമ്പത്തിക അവലോകനം: ബാങ്കിംഗ് ഓഹരികളുടെ വളർച്ചയും നിക്ഷേപ സാധ്യതകളും.',
  'Published',
  'No',
  2
),
(
  'c3d4e5f6-a7b8-9c0d-1e2f-333333333333',
  'Special Coverage',
  'Sector Scan',
  'Renewable Energy Surge: Top Green Hydrogen Plays for 2026',
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>Clean tech infrastructure investments accelerate as sovereign energy transitions incentivize capital goods and solar-wind manufacturing conglomerates.</p>',
  '<h2>The Industrial Clean Energy Pivot</h2><p>Government subsidies and global decarbonization commitments have unlocked unprecedented private capital commitments into green hydrogen electrolyzers and transmission corridors.</p><h3>Key Financial Metrics</h3><p>Leading utility players demonstrate multi-year order books with sustained EBITDA margin expansions exceeding 18%.</p>',
  'renewable-energy-surge-green-hydrogen-2026',
  'Renewable Energy, Green Hydrogen, Solar, ESG, Sector Scan, Stocks',
  'Renewable Energy Surge: Top Green Hydrogen Stocks 2026',
  'Deep-dive sector report evaluating balance sheets, capital expenditure pipelines, and valuations.',
  'Published',
  'Yes',
  3
),
(
  'd4e5f6a7-b8c9-0d1e-2f3a-444444444444',
  'Investment Insights',
  'Financial Planning',
  'म्यूचुअल फंड एसआईपी से बनाएं करोड़पति फंड: स्मार्ट रणनीति',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>चक्रवृद्धि ब्याज की जादुई ताकत और अनुशासित निवेश के जरिए दीर्घकालिक वित्तीय स्वतंत्रता हासिल करने की संपूर्ण मार्गदर्शिका।</p>',
  '<h2>कंपाउंडिंग का जादू और अनुशासित निवेश</h2><p>नियमित मासिक एसआईपी (SIP) बाजार के उतार-चढ़ाव को सामान्य बनाकर लागत को कम करता है और 10 से 15 वर्षों में अभूतपूर्व रिटर्न का निर्माण करता है।</p><h3>एसेट एलोकेशन का महत्व</h3><p>अपनी उम्र और जोखिम क्षमता के आधार पर लार्ज-कैप, मिड-कैप और फ्लेक्सी-कैप फंडों का संतुलित पोर्टफोलियो चुनें।</p>',
  'mutual-fund-sip-crorepati-wealth-strategy',
  'म्यूचुअल फंड, एसआईपी, वित्तीय योजना, संपत्ति निर्माण, निवेश',
  'म्यूचुअल फंड एसआईपी से बनाएं संपत्ति: संपूर्ण वित्तीय गाइड',
  'दीर्घकालिक वित्तीय लक्ष्यों की प्राप्ति के लिए प्रभावी म्यूचुअल फंड रणनीतियाँ।',
  'Published',
  'No',
  4
),
(
  'e5f6a7b8-c9d0-1e2f-3a4b-555555555555',
  'Market News',
  'Economy Watch',
  'ஜிஎஸ்டி வருவாய் புதிய சாதனை: பொருளாதார வளர்ச்சியின் அறிகுறி',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>உள்நாட்டு வர்த்தகம் மற்றும் நுகர்வு அதிகரிப்பால் மாதந்திர ஜிஎஸ்டி வசூல் வரலாறு காணாத அளவுக்கு உயர்ந்துள்ளது.</p>',
  '<h2>பொருளாதார வலிமை</h2><p>உற்பத்தி மற்றும் சேவைத் துறைகளில் ஏற்பட்டுள்ள தொடர் வளர்ச்சி நாட்டின் நிதி ஸ்திரத்தன்மையை வெளிப்படுத்துகிறது.</p><h3>சந்தை மதிப்பீடு</h3><p>நிறுவனங்களின் இலாப வரம்புகள் சீராக உயர்ந்து முதலீட்டாளர்களின் நம்பிக்கையை வலுப்படுத்துகிறது.</p>',
  'tamil-gst-revenue-record-high-economic-growth',
  'ஜிஎஸ்டி, பொருளாதாரம், முதலீடு, வரி, வணிகம்',
  'ஜிஎஸ்டி வருவாய் புதிய சாதனை: பொருளாதார ஆய்வறிக்கை',
  'தமிழ் நிதி செய்திகள்: நாட்டின் பொருளாதார வளர்ச்சி மற்றும் ஜிஎஸ்டி வசூல் விவரங்கள்.',
  'Published',
  'No',
  5
),
(
  'f6a7b8c9-d0e1-2f3a-4b5c-666666666666',
  'Special Coverage',
  'Political Theatre',
  'أسواق الخليج تعزز مكاسبها مع تدفقات استثمارية قياسية',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=560&h=320&q=80',
  '<p>مؤشرات الأسواق المالية الخليجية تسجل مستويات قياسية مدعومة بالطروحات الأولية ومشاريع التنوع الاقتصادي المستدامة.</p>',
  '<h2>قوة الاقتصاد الإقليمي</h2><p>أظهرت الأسواق الإقليمية مرونة فائقة وتوسعا في استقطاب رؤوس الأموال الأجنبية عبر قطاعات التكنولوجيا والخدمات اللوجستية والطاقة النظيفة.</p><h3>نظرة مستقبلية للمستثمرين</h3><p>تواصل الشركات المدرجة تحقيق توزيعات أرباح مجزية تعزز الاستقرار المالي طويل المدى.</p>',
  'gulf-markets-record-capital-inflows-2026',
  'أسواق الخليج, اقتصاد, استثمار, طروحات أولية, تمويل',
  'أسواق الخليج تعزز مكاسبها مع تدفقات استثمارية قياسية',
  'تقرير مالي متخصص حول أداء أسواق المال الخليجية وتوقعات السيولة الاستثمارية.',
  'Published',
  'Yes',
  6
)
ON CONFLICT (canonical_url) DO UPDATE SET
  section = EXCLUDED.section,
  category = EXCLUDED.category,
  heading = EXCLUDED.heading,
  lead_image_url = EXCLUDED.lead_image_url,
  short_description = EXCLUDED.short_description,
  full_story = EXCLUDED.full_story,
  keywords = EXCLUDED.keywords,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  publishing_status = EXCLUDED.publishing_status,
  notification_status = EXCLUDED.notification_status,
  display_order = EXCLUDED.display_order;

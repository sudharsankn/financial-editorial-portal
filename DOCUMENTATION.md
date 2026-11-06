# Financial Intelligence Editorial Portal — System Documentation

A high-coverage, multilingual financial editorial and market intelligence portal with real-time Indian stock market integration, automated image optimization, editorial workflow controls, IAB-standard advertising management, paid subscriptions with Razorpay gateway, and PostgreSQL persistence powered by Supabase.

---

## 1. Technologies & Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `^19.0.0` | Component-based UI with React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`) |
| **Build & Dev Tool** | Vite | `^6.2.0` | Ultra-fast HMR and ESM bundling with local API development middleware |
| **Language** | TypeScript | `^5.7.3` | Full strict-mode typing across entities, API models, and database payloads |
| **Styling & Theme** | Tailwind CSS | `^4.0.0` | Modern utility styling with `@tailwindcss/vite` |
| **Icons** | Lucide React | `^0.546.0` | Lightweight SVG icons |
| **Database & Storage** | Supabase (PostgreSQL) | `@supabase/supabase-js ^2.118.0` | Cloud database, Row Level Security (RLS), and binary Storage buckets (`story-images`) |
| **Payment Gateway** | Razorpay SDK | Client Checkout + Serverless | Unified payments with HMAC-SHA256 signature verification and sandbox simulator |
| **Market Data Engine** | Free Unlimited Engine | `yahoo-finance2` + `rss-parser` | 100% Free, zero-quota market data: live NSE/BSE stock quotes, trending gainers/losers, IPOs, and multilingual financial news |
| **News RSS Sources** | Real-Time Financial Wire | XML / RSS Feeds | Dhanam Online, GoodReturns Malayalam, TwentyFour News, LiveMint, Economic Times, Business Standard |
| **Image Extraction** | OpenGraph / Enclosure Parser | Native HTTPS + Regex | Dynamic lead image extraction directly from publisher articles, bypassing stock fallbacks |
| **Typography & Scripts** | Google Noto Sans / Open Sans | UTF-8 Collation | Native Unicode grapheme segmentation (`Intl.Segmenter`) supporting English, Malayalam, Hindi, Tamil |

---

## 2. Architecture & Data Flow

```
                                      +-------------------------------------------------+
                                      |   Free Unlimited Market Data Providers          |
                                      |   - Yahoo Finance (Indices & 30 Nifty Large-Caps)|
                                      |   - Malayalam RSS (Dhanam Online, GoodReturns)  |
                                      |   - English RSS (LiveMint, Economic Times, BS)   |
                                      |   - Chittorgarh IPO Wire                        |
                                      +------------------------+------------------------+
                                                               |
                                                 (Manual Click: "Fetch Data on Click")
                                                               v
+-----------------------------------+        +------------------------------------------+
| Admin Studio (/admin)             |        | Serverless API: /api/market-data         |
| - Market News Wire (Primary Tab)  +------->| (api/market-data.ts / vite-dev plugin)   |
| - Stories Manager                 |        | Concurrent Promise.all Ingestion         |
| - Advertisements Manager (IAB)    |        | OpenGraph Lead Image Scraper             |
| - Live Markets Ticker Studio      |        +---------------------+--------------------+
+-----------------+-----------------+                              |
                  |                                                |
                  | (CRUD / Publish / Ads / Tickers)               | (Trending, Indices, IPOs)
                  v                                                v
+---------------------------------------------------------------------------------------+
| Supabase PostgreSQL Database (https://yfsgudewhwialobsyrpg.supabase.co)               |
| - public.stories (Editorial journalism with UTF-8 & grapheme limits)                  |
| - public.advertisements (IAB campaigns, duration, cost, soft-delete, and status)     |
| - public.ad_clicks (Timestamped click tracking mapped to advertisement id)            |
| - public.subscribers (Hashed password credentials, member profile, and auth)          |
| - public.subscriptions (Razorpay payments, active subscriber codes, and plans)        |
| - public.market_tickers (Top marquee tape quotes)                                     |
| - public.trending_stocks (Live NSE/BSE gainers & losers)                             |
| - public.ipos (Active, upcoming & listed IPOs)                                        |
| - public.news (Saved raw news wire dispatches for drafting stories)                   |
| - public.indian_stock_data (JSONB cache for market endpoints)                         |
| - public.contact_inquiries (Customer inquiries submitted via Contact Us form)         |
| - storage.buckets: 'story-images' (Article photos & ad creatives)                     |
+------------------------------------+--------------------------------------------------+
                                     |
                                     | (is_published = true / is_active = true)
                                     v
+---------------------------------------------------------------------------------------+
| Public Customer / Subscriber View (Exact Hedge Ohari Replication)                     |
| - Multi-Line Mobile Market Ticker (Controls Line 1 + Full-Width Scrolling Line 2)     |
| - Mobile Hierarchy: Pulse Header -> Compact Top Movers -> Find Stories -> Categories  |
| - Desktop 3-Column Layout: Categories/Find Stories Sidebar | Feed Grid | Subscription |
| - Native IAB Ad Placements: Full Story Solo, Box Listing Pos 6, Left/Right Sidebars   |
| - Subscriber Paywall: Teaser excerpt, locked full story, and pricing upgrade modal     |
| - Reader Tools: Font size changer (S, M, L, XL), scroll progress bar, social share    |
| - Static Pages: About Us, Contact Us (with working DB submission), Terms, Privacy     |
| - Full Pagination: Section News Container, Ad Campaigns Table & Public Stories Grid  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Environment Configuration (`.env`)

```env
# Supabase Configuration (Vite Dev & Production)
VITE_SUPABASE_URL=https://yfsgudewhwialobsyrpg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1

# Supabase Configuration (Next.js / Vercel Edge SSR)
NEXT_PUBLIC_SUPABASE_URL=https://yfsgudewhwialobsyrpg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1

# Application Host URL
APP_URL="http://localhost:3000"

# Razorpay Payment Gateway Credentials
VITE_RAZORPAY_KEY_ID="rzp_test_9oy85KnsbS2V4P"
RAZORPAY_KEY_ID="rzp_test_9oy85KnsbS2V4P"
RAZORPAY_KEY_SECRET="SGNSZk9HMDxeYzR4xnT6lsoP"
```

---

## 4. Free Unlimited Market Data Engine & "Fetch Data on Click"

The application uses a **100% free, unlimited market intelligence engine** that completely replaces rate-limited third-party APIs (such as `stock.indianapi.in`). It incurs zero API subscription costs and imposes no monthly request caps.

### How "Fetch Data on Click" Works

1. **User Initiation**: The editor clicks **"Fetch Data on Click"** (`#btn-fetch-unified-data`) in the Admin Panel Market News Wire tab.
2. **Serverless Execution**: Request dispatched to `/api/market-data?endpoint=unified&symbol=RELIANCE`. Handled by Vite connect middleware in development and Vercel serverless function in production.
3. **Multi-Source Fetch**: Parallel execution via `Promise.all` across:
   - Yahoo Finance (Benchmark indices and 30 Nifty large-caps).
   - Malayalam RSS feeds (GoodReturns Malayalam, Dhanam Online, TwentyFour News).
   - English RSS feeds (LiveMint, Economic Times, Business Standard).
   - Chittorgarh IPO Wire.
4. **Authentic Lead Image Pipeline**: Automatically traverses `<enclosure>`, `<media:content>`, and embedded `<img>` tags. Falls back to `fetchArticleOgImage` to scrape OpenGraph metadata directly from publisher article URLs.
5. **Database Commit & Sync**: Trending stocks saved to `public.trending_stocks`, tickers to `public.market_tickers`, and IPOs to `public.ipos`.

---

## 5. Database Schema & Tables

The database operates on PostgreSQL with Row Level Security (RLS) enabled across all 11 tables and 1 binary storage bucket.

### 1. `public.stories`
Stores core editorial journalism in any script with strict grapheme limits.
- `id` (UUID, Primary Key)
- `section` (Text: `'Investment Insights' | 'Market News' | 'Special Coverage' | 'IPO Watch'`)
- `category` (Text: e.g. `'Big Story'`, `'Market Trends'`, `'Stock Recommendations'`)
- `heading` (VARCHAR(70): max 70 grapheme characters across English, Malayalam, Hindi, Tamil)
- `lead_image_url` (Text: 560x320 Retina JPG URL)
- `short_description` (Text: Rich text summary)
- `full_story` (Text: Full HTML content)
- `canonical_url` (Text, Unique: SEO slug)
- `keywords`, `seo_title`, `seo_description` (Text)
- `publishing_status` (Text: `'Draft' | 'Ready to Publish' | 'Published' | 'Retired'`)
- `notification_status` (Text: `'Yes' | 'No'`)
- `display_order` (Integer)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `public.advertisements`
Manages IAB-standard banner and video campaigns across the portal.
- `id` (UUID, Primary Key)
- `campaign_id` (Text, Unique: e.g. `'OH00074'`)
- `advertiser` (Text: e.g. `'ICICI Prudential'`)
- `brand` (Text: e.g. `'Mutual Fund'`)
- `ad_position` (Text: `'Full Story - Solo Position' | 'Box Listing - Position 6' | 'Sidebar - Left' | 'Sidebar - Right'`)
- `ad_type` (Text: `'Display' | 'Video'`)
- `is_active` (Boolean: default `true`)
- `is_deleted` (Boolean: default `false`, soft delete flag)
- `deleted_at` (TIMESTAMPTZ: soft delete timestamp)
- `display_ad_material` (Text: Creative banner image URL or Supabase storage path)
- `display_ad_url` (Text: Destination click-through URL)
- `video_ad_material` (Text: Optional video embed or file URL)
- `start_date` (Date: Campaign start date)
- `end_date` (Date: Campaign end date)
- `cost_per_day` (Numeric: Daily rate in ₹)
- `number_of_days` (Integer: Auto-calculated duration)
- `total_cost` (Numeric: Auto-calculated total cost in ₹)
- `impressions_count` (BigInt: Real-time views count)
- `clicks_count` (BigInt: Real-time clicks count)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. `public.ad_clicks`
Logs individual click events with high-resolution metadata for audit trails and billing verification.
- `id` (UUID, Primary Key)
- `advertisement_id` (Text: Optional UUID or string reference to `public.advertisements.id`)
- `campaign_id` (Text: References `public.advertisements.campaign_id`)
- `page_url` (Text: Current browser path where ad was clicked)
- `referrer` (Text: Browser referrer)
- `user_agent` (Text: Browser client string)
- `clicked_at` (TIMESTAMPTZ: High-precision UTC timestamp)
- `created_at` (TIMESTAMPTZ)

### 4. `public.subscribers`
User accounts, authentication credentials, and membership profiles.
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `password_hash` (Text: SHA-256 cryptographically hashed digest)
- `name` (Text: Full name)
- `mobile` (Text: Contact number)
- `profession` (Text: Default `'Investor / Financial Planner'`)
- `state` (Text: Default `'Kerala'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 5. `public.subscriptions`
Stores subscription purchases, Razorpay transaction links, validity periods, and membership tiers.
- `id` (UUID, Primary Key)
- `subscriber_id` (UUID, Foreign Key: `REFERENCES public.subscribers(id) ON DELETE CASCADE`)
- `subscriber_code` (Text, Unique: e.g. `'HEDGE-384912'`)
- `plan_id` (Text: `'monthly' | 'quarterly' | 'annual' | 'patron'`)
- `plan_title` (Text: Plan display name)
- `plan_duration` (Text: e.g. `'30 Days'`, `'365 Days'`)
- `amount_paid` (Numeric: Amount in INR)
- `currency` (Text: Default `'INR'`)
- `payment_method` (Text: Default `'RAZORPAY'`)
- `payment_id` (Text: Razorpay payment transaction ID)
- `order_id` (Text: Razorpay order ID)
- `status` (Text: `'active' | 'expired' | 'cancelled'`)
- `starts_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

### 6. `public.market_tickers`
Powers the top horizontal marquee ticker tape across all pages.
- `id` (UUID, Primary Key)
- `symbol` (Text: e.g. `'NIFTY 50'`, `'SENSEX'`, `'GOLD (10g)'`)
- `price` (Text: e.g. `'24,842.15'`)
- `change` (Text: e.g. `'+0.68%'`)
- `is_positive` (Boolean)
- `display_order` (Integer)
- `is_active` (Boolean)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 7. `public.trending_stocks`
Real-time top gainers and losers from the Indian stock market.
- `id` (UUID, Primary Key)
- `ticker_id` (Text: e.g. `'TATAMOTORS'`)
- `company_name` (Text)
- `price` (Text)
- `percent_change` (Text)
- `net_change` (Text)
- `trend_type` (Text: `'gainer' | 'loser'`)
- `volume`, `high`, `low`, `open`, `close` (Text)
- `is_published` (Boolean)
- `display_order` (Integer)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 8. `public.ipos`
Pipeline of upcoming, ongoing, and recently listed Mainboard and SME IPOs.
- `id` (UUID, Primary Key)
- `symbol` (Text)
- `name` (Text)
- `status` (Text: `'upcoming' | 'ongoing' | 'listed' | 'closed'`)
- `is_sme` (Boolean)
- `issue_price` (Text)
- `issue_size` (Text)
- `listing_date`, `open_date`, `close_date` (Text)
- `gmp` (Text: Grey Market Premium)
- `subscription_rate` (Text)
- `is_published` (Boolean)
- `display_order` (Integer)
- `created_at` (TIMESTAMPTZ)

### 9. `public.news`
Saved raw financial dispatches from RSS ingestion, available for 1-click story drafting.
- `id` (UUID, Primary Key)
- `title` (Text)
- `summary` (Text)
- `full_content` (Text)
- `image_url` (Text)
- `url` (Text, Source URL)
- `source` (Text: e.g. `'ധനം ഓൺലൈൻ'`, `'GoodReturns'`, `'LiveMint'`)
- `category` (Text)
- `pub_date` (Text)
- `created_at` (TIMESTAMPTZ)

### 10. `public.indian_stock_data`
Structured JSONB storage for market API snapshots and raw endpoint caches.
- `id` (UUID, Primary Key)
- `endpoint` (Text: `'trending' | 'news' | 'ipo' | 'stock'`)
- `query`, `title`, `summary` (Text)
- `data` (JSONB)
- `fetched_at` (TIMESTAMPTZ)
- `section`, `category` (Text)
- `is_published` (Boolean)
- `display_order` (Integer)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 11. `public.contact_inquiries`
Stores inquiries and feedback submitted via the Contact Us form.
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text)
- `mobile` (Text)
- `subject` (Text)
- `message` (Text)
- `created_at` (TIMESTAMPTZ)

### Storage Bucket: `story-images`
Public Supabase Storage bucket for binary media assets:
- **Max file size:** 5 MB.
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/jpg`.

---

## 6. Advertisement Engine & Campaign Manager

The advertisement engine provides publisher monetization capabilities aligned with IAB standards:

### Key Features
1. **IAB Standard Placements**:
   - `Full Story - Solo Position`: Premium banner placed at the top and midway through the full article view.
   - `Box Listing - Position 6`: Integrated directly into the 6th slot of the center news grid on the home feed.
   - `Sidebar - Left`: Banner placed within the desktop left navigation column.
   - `Sidebar - Right`: Sponsorship display placed below the Market Radar in the right sidebar.
2. **Auto-Calculations**:
   - Selecting a `Start Date` and `End Date` automatically computes duration in days and multiplies by `Cost per Day` to calculate `Total Cost (₹)`.
   - Editing duration automatically recalculates the `End Date`.
3. **Frontend Dynamic Status**:
   - If `end_date` is in the past, campaigns dynamically render an amber `Expired • തീയതി കഴിഞ്ഞു` badge without altering the database status column.
4. **Soft Delete & Trash Management**:
   - Deleting a campaign sets `is_deleted = true`, `is_active = false`, and records `deleted_at`.
   - Campaigns in Trash can be restored with a single click or permanently deleted.
5. **Timestamped Click Tracking**:
   - User clicks on any active banner call `recordAdClick(campaignId, adId, metadata)`.
   - Increments `clicks_count` and records a detailed audit row in `public.ad_clicks`.
   - The "Click Logs & Timestamps" modal allows administrators to review historical click events.

---

## 7. Subscription Checkout & Razorpay Integration

The portal features a subscriber paywall and tier management system:

### Architecture
- **Checkout Modal**: Allows readers to select between Monthly, Quarterly, Annual, and Lifetime Patron tiers.
- **Razorpay Integration**: Loads the official Razorpay standard checkout script.
- **Serverless Signature Verification**: Verifies `razorpay_order_id|razorpay_payment_id` using the HMAC-SHA256 signature algorithm against `RAZORPAY_KEY_SECRET`.
- **Sandbox Fallback**: If Razorpay credentials are unset in local development, an interactive sandbox simulator completes mock transactions for end-to-end testing.
- **Account Association**: Completed payments link the generated subscriber code directly to the authenticated subscriber in `public.subscriptions`.

---

## 8. Reader Experience & Paywall

- **Subscriber Paywall**: Unauthenticated or free readers viewing premium investment stories see a lead excerpt with the remainder of the article blurred/locked behind a subscription banner.
- **Dynamic Reading Progress Bar**: Positioned at the top of article detail pages, smoothly tracking scroll depth from 0% to 100%.
- **Font Size Adjuster**: Readers can toggle between Small (14px), Medium (16px), Large (18px), and Extra Large (20px) body font sizes.
- **Story Navigation**: Previous and Next story buttons at the bottom of article detail pages.
- **Social Sharing**: Modal supporting WhatsApp, Facebook, X (Twitter), LinkedIn, Telegram, and Email with one-click URL copying.

---

## 9. Editorial Taxonomy (Sections & Categories)

### Core Sections
1. **All Stories**: Comprehensive portal feed.
2. **Market News**: Breaking news, exchange wire, and macro policy.
3. **Investment Insights**: Fundamental analysis, equity research, asset allocation.
4. **Special Coverage**: Long-form investigative journalism and special reports.
5. **IPO Watch**: Dedicated tracking of Mainboard & SME IPO pipelines.

### Categories & Tags Taxonomy (Directly Mirroring Hedge Ohari)
- `Financial Planning`
- `Big Story`
- `Results Calendar`
- `Event Calendar`
- `Class Room`
- `Political Theatre`
- `Market Trends`
- `Mutual Fund`
- `Stock Recommendations`
- `Portfolio`
- `Sector Scan`
- `Economy Watch`
- `Personal Finance`
- `Insurance`
- `Tax Planning`
- `Commodity`
- `Currency`
- `Crypto / FinTech`

---

## 10. Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript compilation check
npx tsc --noEmit
```

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready for deployment on Vercel edge hosting.

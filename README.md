# Financial Intelligence Editorial Portal

[![React 19](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://financial-editorial-portal-opal.vercel.app)

A high-coverage, multilingual financial journalism and real-time market intelligence portal. Built to mirror the exact user experience, desktop 3-column layout, mobile hierarchy, and market desk of [Hedge Ohari](https://hedgeohari.com), powered by a 100% free unlimited financial data engine, Razorpay payment gateway, IAB-standard advertisement engine, subscriber authentication, and Supabase PostgreSQL.

---

## 🌐 Live URLs

* **Production Site:** [https://financial-editorial-portal-opal.vercel.app](https://financial-editorial-portal-opal.vercel.app)
* **Direct Deployment URL:** [https://financial-editorial-portal-607hb4z36-knsudharsan2003s-projects.vercel.app](https://financial-editorial-portal-607hb4z36-knsudharsan2003s-projects.vercel.app)
* **GitHub Repository:** [https://github.com/sudharsankn/financial-editorial-portal](https://github.com/sudharsankn/financial-editorial-portal)
* **Local Development:** [http://localhost:3000](http://localhost:3000)
* **Admin Studio:** [http://localhost:3000/admin](http://localhost:3000/admin) *(or click Admin in the top navbar)*

---

## 🚀 Key Features

* **Exact Hedge Ohari Replication:**
  * **Desktop 3-Column Layout:** Left Category & Find Stories Sidebar, Center News Grid + Market Pulse Desk, Right Subscription Box & Quick Actions.
  * **Dual-Line Market Ticker:** Top header features speed controls and real-time scrolling tape for NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX, and upcoming IPO alerts.
  * **Mobile-First UX Hierarchy:** Optimized for mobile screens with Market Pulse Header first, swipeable Top Movers carousel with Prev/Next buttons, minimizable Find Stories filter, and categorized story listings.
* **Multilingual Editorial Platform (Malayalam Primary):**
  * **Malayalam (`മലയാളം`)** is selected as the primary default language with authentic regional coverage.
  * Native Unicode grapheme segmentation (`Intl.Segmenter`) ensures strict $\le 70$ grapheme character constraints for headlines.
* **100% Free Unlimited Market Data Engine:**
  * Zero third-party subscription costs or monthly API request caps.
  * Concurrent real-time ingestion of live NSE/BSE quotes, top gainers, top losers, upcoming IPOs, and wire dispatches.
* **IAB-Standard Advertisements & Sponsorships Manager:**
  * Native ad slots matching standard IAB positions: `Full Story - Solo Position`, `Box Listing - Position 6`, `Sidebar - Left`, and `Sidebar - Right`.
  * Support for Display image banners and Video ad creatives.
  * Admin campaign manager with start/end date pickers, auto-calculated duration and total cost, live image preview, Supabase bucket media imports, and table pagination.
  * Automatic "Expired" status calculation for ended campaigns without database mutation.
  * Soft delete to Trash with 1-click campaign restoration and permanent purge.
* **Timestamped Ad Click Analytics (`public.ad_clicks`):**
  * Real-time click tracking mapped to `advertisement_id` and `campaign_id`.
  * Captures `page_url`, `referrer`, `user_agent`, and UTC click timestamp.
  * Interactive "Click Logs & Timestamps" modal in Admin Ads Manager.
* **User Authentication & Subscriber Dashboard (`public.subscribers`):**
  * Secure sign-up, sign-in, and password management with SHA-256 password hashing.
  * Dedicated "My Account" dashboard displaying active plan, subscriber code, and profile metadata.
  * Forgot/Reset password workflow.
* **Subscription Management & Razorpay Gateway (`public.subscriptions`):**
  * Integrated Razorpay payment gateway with serverless order creation and HMAC-SHA256 signature verification.
  * Transparent sandbox simulator fallback for zero-downtime test environments.
  * Tiered plans: Monthly (₹149), Quarterly (₹399), Annual (₹1,199), and Lifetime Patron.
* **Paywall & Enhanced Reading Experience:**
  * Subscriber paywall for exclusive investment insights with teaser content and locked article view.
  * Reader font size controls (Small, Medium, Large, Extra Large).
  * Reading progress bar dynamically tracking scroll depth on story details.
  * Previous & Next story navigation links.
  * Rich multi-platform social share modal (WhatsApp, Facebook, X/Twitter, LinkedIn, Telegram, Email).
* **Authentic Publisher News Photos:**
  * Automated extraction of original publisher photography from wire enclosures and OpenGraph tags, eliminating generic placeholders.
* **Static Company Pages & Contact Inquiries (`public.contact_inquiries`):**
  * Native pages for About Us (`/about-us`), Contact Us (`/contact-us`), Terms of Use (`/terms`), and Privacy Policy (`/privacy`).
  * Functional Contact Us form persisting inquiries directly to Supabase.
* **Real-Time Bookmark System:**
  * Persistent synchronization with browser `localStorage`.
  * Real-time counter badge on the navbar (`#btn-navbar-bookmarks`).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Strict-mode typing, hooks, and clean state synchronization |
| **Bundler & Dev Server** | Vite 6 | Lightning-fast HMR and ESM bundling |
| **Styling** | Tailwind CSS v4 | Clean utility styles with `@tailwindcss/vite` |
| **Icons** | Lucide React | High-performance SVG icons |
| **Database** | Supabase (PostgreSQL) | Relational persistence, RLS policies, and UTF-8 collation |
| **Media Storage** | Supabase Storage | `story-images` public bucket for article photos and ad banners |
| **Payments** | Razorpay SDK | Unified payment gateway with HMAC-SHA256 signature verification |
| **Market Engine** | Financial Wire + Yahoo Finance | Free unlimited feeds with zero rate-limit constraints |
| **Deployment** | Vercel | Production edge hosting with SPA rewrite routing |

---

## 🗄️ Database Schema (Supabase PostgreSQL)

The portal relies on a set of 11 relational PostgreSQL tables and 1 public storage bucket hosted on Supabase (`https://yfsgudewhwialobsyrpg.supabase.co`), configured with Row Level Security (RLS) and UTF-8 multilingual collation.

### Database Tables Overview

| Table Name | Purpose | Primary Key | Key Relationships |
| :--- | :--- | :--- | :--- |
| [`public.stories`](#1-publicstories) | Editorial articles and journalism | `id (UUID)` | Primary content store |
| [`public.advertisements`](#2-publicadvertisements) | IAB ad campaigns and banners | `id (UUID)` | `campaign_id (UNIQUE)` |
| [`public.ad_clicks`](#3-publicad_clicks) | Real-time click timestamps and logs | `id (UUID)` | Maps to `advertisements.id` / `campaign_id` |
| [`public.subscribers`](#4-publicsubscribers) | User authentication and accounts | `id (UUID)` | Parent to `subscriptions.subscriber_id` |
| [`public.subscriptions`](#5-publicsubscriptions) | Paid plans and Razorpay transactions | `id (UUID)` | `subscriber_id -> subscribers.id` (CASCADE) |
| [`public.market_tickers`](#6-publicmarket_tickers) | Header scrolling ticker tape symbols | `id (UUID)` | Active marquee feed |
| [`public.trending_stocks`](#7-publictrending_stocks) | Live Top Gainers & Losers | `id (UUID)` | Real-time market desk |
| [`public.ipos`](#8-publicipos) | Mainboard & SME IPO pipeline | `id (UUID)` | IPO Watch section |
| [`public.news`](#9-publicnews) | Raw wire news dispatches | `id (UUID)` | Staging for new stories |
| [`public.indian_stock_data`](#10-publicindian_stock_data) | Cached market data payloads | `id (UUID)` | JSONB endpoint cache |
| [`public.contact_inquiries`](#11-publiccontact_inquiries) | Submissions from Contact Us page | `id (UUID)` | Reader inquiries |

---

### Detailed Table Schemas

#### 1. `public.stories`
Stores all published, drafted, and scheduled editorial articles.
```sql
CREATE TABLE public.stories (
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
```
* **Indexes:** `idx_stories_canonical_url` (UNIQUE), `idx_stories_publishing_status`, `idx_stories_section`, `idx_stories_category`, `idx_stories_feed_ordering (display_order ASC, created_at DESC)`.
* **Triggers:** Automatic `updated_at` refresh via `handle_updated_at()`.
* **RLS Policies:** Public `SELECT` allowed for `publishing_status = 'Published'`; full CRUD for authenticated/editorial staff.

#### 2. `public.advertisements`
Manages IAB-standard banner and video advertising campaigns across the portal.
```sql
CREATE TABLE public.advertisements (
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
```
* **Indexes:** `idx_ads_campaign_id` (UNIQUE), `idx_ads_position_active (ad_position, is_active)`.
* **Soft Delete:** Filtered via `is_deleted = false`; campaigns can be moved to Trash and restored.

#### 3. `public.ad_clicks`
Logs individual click events with high-resolution metadata for audit trails and billing verification.
```sql
CREATE TABLE public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id TEXT,
  campaign_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```
* **Indexes:** `idx_ad_clicks_campaign`, `idx_ad_clicks_ad_id`, `idx_ad_clicks_time (clicked_at DESC)`.
* **RLS Policies:** Public `INSERT` with `WITH CHECK (true)` to record anonymous reader clicks; read access enabled.

#### 4. `public.subscribers`
User accounts, authentication credentials, and membership profiles.
```sql
CREATE TABLE public.subscribers (
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
```
* **Indexes:** `idx_subscribers_email` (UNIQUE).
* **Security:** Password stored exclusively as cryptographically salted/hashed digests; no plaintext passwords.

#### 5. `public.subscriptions`
Stores subscription purchases, Razorpay transaction links, validity periods, and membership tiers.
```sql
CREATE TABLE public.subscriptions (
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
```
* **Indexes:** `idx_subscriptions_code` (UNIQUE), `idx_subscriptions_subscriber`, `idx_subscriptions_status`.

#### 6. `public.market_tickers`
Configurable market ticker items scrolling across the top header ribbon.
```sql
CREATE TABLE public.market_tickers (
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
```
* **Indexes:** `idx_market_tickers_display_order (display_order ASC, created_at ASC)`, `idx_market_tickers_is_active`.

#### 7. `public.trending_stocks`
Real-time top gainers and losers from the Indian stock market.
```sql
CREATE TABLE public.trending_stocks (
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
```
* **Indexes:** `idx_trending_stocks_type`, `idx_trending_stocks_published`.

#### 8. `public.ipos`
Pipeline of upcoming, ongoing, and recently listed Mainboard and SME IPOs.
```sql
CREATE TABLE public.ipos (
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
```

#### 9. `public.news`
Saved raw news wire dispatches from RSS ingestion, available for 1-click story drafting.
```sql
CREATE TABLE public.news (
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
```
* **Indexes:** `idx_news_created_at (created_at DESC)`.

#### 10. `public.indian_stock_data`
Structured JSONB storage for market API snapshots and raw endpoint caches.
```sql
CREATE TABLE public.indian_stock_data (
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
```
* **Indexes:** `idx_indian_stock_data_endpoint`, `idx_indian_stock_data_is_published`, `idx_indian_stock_data_fetched_at`.

#### 11. `public.contact_inquiries`
Stores inquiries and feedback submitted via the Contact Us page form.
```sql
CREATE TABLE public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### Storage Bucket: `story-images`
Public Supabase Storage bucket (`storage.buckets`) configured for binary media assets:
* **Max file size limit:** 5 MB (5,242,880 bytes).
* **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/jpg`.
* **Public Access Policy:** Read-only access enabled for public; write access enabled for editors.

---

## ⚡ Step-by-Step: How to Run Locally

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **pnpm** installed
* A **Supabase** project (configured credentials provided in `.env`)

### 2. Clone the Repository
```bash
git clone https://github.com/sudharsankn/financial-editorial-portal.git
cd financial-editorial-portal
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory (or use `.env.example` as a template):

```env
# Supabase Configuration (Vite Dev & Production)
VITE_SUPABASE_URL="https://yfsgudewhwialobsyrpg.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1"

# Supabase Configuration (Next.js / Vercel Edge SSR)
NEXT_PUBLIC_SUPABASE_URL="https://yfsgudewhwialobsyrpg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1"

# Application Host URL
APP_URL="http://localhost:3000"

# Razorpay Payment Gateway Credentials
VITE_RAZORPAY_KEY_ID="rzp_test_9oy85KnsbS2V4P"
RAZORPAY_KEY_ID="rzp_test_9oy85KnsbS2V4P"
RAZORPAY_KEY_SECRET="SGNSZk9HMDxeYzR4xnT6lsoP"
```

### 5. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
* **Public Portal:** `http://localhost:3000`
* **Admin Studio:** `http://localhost:3000/admin`
* **Ad Manager:** `http://localhost:3000/admin` -> Advertisements tab
* **Contact Us:** `http://localhost:3000/contact-us`
* **Subscription Pricing:** `http://localhost:3000/subscribe`

### 6. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🔄 Step-by-Step: How "Fetch Data on Click" & "Fetch & Publish Stories" Work

The Admin Studio provides two high-performance 1-click workflows designed to serve both curated editorial oversight and rapid real-time wire publishing:

```mermaid
flowchart TD
    subgraph Actions["1-Click Action Bar (/admin -> Market News Wire)"]
        B1["Fetch Data on Click<br/>(Fetch and manually publish in Stories Manager)"]
        B2["Fetch & Publish Stories<br/>(Fetch and auto publish - zero duplicates)"]
    end

    subgraph Ingestion["Concurrent Multi-Source Ingestion Engine"]
        F1["Yahoo Finance API<br/>(Real-Time Indices & 30 Nifty Movers)"]
        F2["Multi-Source RSS Wire Engine<br/>(LiveMint, ET, BS, NDTV, GoodReturns, Dhanam)"]
        F3["SEBI DRHP Pipeline<br/>(Verified Unlisted IPOs)"]
    end

    B1 --> F1 & F2 & F3
    B2 --> F2

    F2 --> DEDUP{"4-Tier Duplicate Check<br/>1. Slug Check<br/>2. Heading Check<br/>3. Source URL Check<br/>4. In-Batch Filter"}

    DEDUP -->|Duplicate Found| SKIP["Safely Skip Article"]
    DEDUP -->|Unique Article| PUB["Direct Auto-Publish<br/>(publishing_status = 'Published')"]

    B1 --> STAGE["Review & Staging Wire<br/>- Filter by Language<br/>- Save to 'news' Table<br/>- 'Use in New Story' Manual Editor"]
    
    PUB --> STORE["Dual Persistence<br/>1. Supabase public.stories<br/>2. Local Storage Engine"]
    STAGE --> STORE
    STORE --> FEED["Live Reader Feed Updated (Instant Refresh)"]
```

### The Two 1-Click Publishing Workflows

| Action Button | Short & Crisp Instruction | Purpose & Editorial Flow |
| :--- | :--- | :--- |
| **"Fetch Data on Click"**<br/>(`#btn-fetch-unified-data`) | *Fetch and manually publish in Stories Manager* | **Curated & Guided Editorial:** Pulls all live benchmark indices, top gainers/losers, IPO pipeline, and wire articles into the staging area. Editors can review original dispatches, filter by language (Malayalam / English), save items to `public.news`, or click **"Use in New Story"** to open the Story Editor with pre-filled fields for manual editorial enhancement before publishing. |
| **"Fetch & Publish Stories"**<br/>(`#btn-fetch-and-publish-stories`) | *Fetch and auto publish (zero duplicates)* | **Automated Zero-Friction Publishing:** Instantly ingests fresh financial wire stories and creates them directly in **`Published`** mode (`publishing_status = 'Published'`). Enforces strict 4-layer duplicate prevention to ensure no story is ever duplicated. Dual-persists to Supabase `public.stories` and browser local storage, updating the reader portal without a page reload. |

### Strict 4-Layer Duplicate Prevention Engine
To prevent duplicate stories from polluting the editorial portal, **"Fetch & Publish Stories"** passes every incoming item through four strict uniqueness gates:
1. **Canonical Slug Validation**: Computes URL slug via `generateCanonicalSlug(title)` and checks against all existing slugs in the database and local storage.
2. **Normalized Unicode Heading Matching**: Normalizes NFC text and strips spaces and punctuation to catch duplicates even if headlines have minor typographical variations.
3. **Source URL De-duplication**: Matches the original article's destination link (`source_url`) against existing records.
4. **In-Batch De-duplication**: Tracks newly processed articles within the active stream so identical wire stories published across multiple wire sources (e.g. both Mint and ET covering the same earnings report) are ingested only once.

### Multi-Tier Data Sources & Fallback Hierarchy (Plan A / Plan B / Plan C)

1. **Benchmark Indices (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, GOLD, BRENT, USD/INR, NASDAQ)**:
   * **Plan A (Primary Source):** Yahoo Finance real-time quotes via `yahoo-finance2` node module.
   * **Plan B (Server-to-Client Fallback):** Per-symbol `.catch(() => null)` isolation + Supabase `public.market_tickers` last verified snapshot.
   * **Plan C (Offline Safety Net):** Browser `localStorage` (`financial_portal_tickers_v1`) + high-integrity default benchmarks.
2. **Top Movers (Gainers & Losers)**:
   * **Plan A:** Computes real-time percentage change across 30 core Indian Nifty 50 large-caps; dynamic sorting into top gainers and decliners.
   * **Plan B:** Client-side fallback (`runClientSideMarketFallback`) polling active quotes directly.
   * **Plan C:** Browser `localStorage` (`financial_portal_trending_stocks_v1`) + `DEFAULT_TRENDING_STOCKS`.
3. **Real-Time Market News Wire**:
   * **Plan A:** Multi-source concurrent RSS ingestion (LiveMint, Economic Times, Business Standard, NDTV Profit, GoodReturns Malayalam, Dhanam Online).
   * **Plan B:** Browser CORS proxy ingestion via `https://api.rss2json.com/v1/api.json`.
   * **Plan C:** Local news cache (`financial_portal_news_v1`) and Supabase `public.news`.
4. **IPO Watch (Strict Integrity Rules)**:
   * **Plan A:** Verified SEBI DRHP pipeline (boAt, Urban Company, Juniper Green Energy, Runwal Developers, SEDEMAC Mechatronics, PhonePe, Zepto).
   * **Integrity Gate:** Strict blocklist (`JIO`, `RELIANCE`, `SWIGGY`, `SAGILITY`, `ACME`, `NTPC`, `MAXWELL`, `HYUNDAI`, `ZOMATO`, `PAYTM`) permanently excludes listed secondary-market stocks.
   * **Plan B (Authentic Empty State):** Labeled "Open Now" *only* if today falls strictly between verified bidding start and end dates. When 0 IPOs are open today, displays authentic empty state (*"ഇന്ന് സബ്‌സ്‌ക്രിപ്ഷനായി പുതിയ ഐപിഒകൾ ലഭ്യമല്ല"*).
   * **Plan C:** Browser `localStorage` (`financial_portal_ipos_v3`).

---

## ✍️ Editorial & Admin Guide

### Accessing Admin Mode
1. Click the **Admin** button in the header or visit `/admin`.
2. The Admin Studio contains four primary tabs:
   * **Market News Wire:** Real-time news ingest, language filters, and 1-click story drafting.
   * **Stories Manager:** Full lifecycle management (`Draft`, `Ready to Publish`, `Published`, `Retired`) with live grapheme validation.
   * **Advertisements:** IAB campaign manager, duration & cost calculation, image uploads, soft delete, and click logs.
   * **Live Markets Studio:** Manage top scrolling ticker symbols and price changes.

### Publishing a New Story
1. Click **"+ Create New Story"**.
2. Fill in the fields:
   * **Section:** Choose from *Investment Insights*, *Market News*, *Special Coverage*, or *IPO Watch*.
   * **Category:** *Financial Planning*, *Big Story*, *Market Trends*, *Stock Recommendations*, *Commodities*, *Banking & Finance*, etc.
   * **Heading:** Up to 70 graphemes / characters (supports full Malayalam Unicode).
   * **Lead Image URL:** Direct URL to a 560x320 JPG/PNG or Supabase storage image.
   * **Short Description & Full Story:** Rich HTML or plain text content.
   * **Canonical URL Slug:** e.g. `lic-share-price-drops-after-jefferies-cuts-target-price`.
3. Set status to **"Published"** and click **"Save Story"**.

---

## 🚢 Deployment (Vercel)

The repository includes a [`vercel.json`](file:///d:/financial-editorial-portal/vercel.json) file preconfigured for single-page application (SPA) routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploying Updates
```bash
# Push commits to GitHub
git push origin main

# Deploy to Preview
npx vercel

# Deploy directly to Production
npx vercel --prod
```

---

## 📜 Available NPM Scripts

* `npm run dev`: Starts the local development server at `http://localhost:3000`.
* `npm run build`: Type-checks and creates an optimized production bundle in `dist/`.
* `npm run preview`: Locally previews the production build.
* `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).

---

## 📄 License
This project is proprietary and built for financial intelligence editorial operations.

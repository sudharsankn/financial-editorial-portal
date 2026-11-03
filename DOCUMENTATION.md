# Financial Intelligence Editorial Portal — System Documentation

A high-coverage, multilingual financial editorial and market intelligence portal with real-time Indian stock market integration, automated image optimization, editorial workflow controls, and PostgreSQL persistence powered by Supabase.

---

## 1. Technologies & Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `^19.0.0` | Component-based UI with React Hooks (`useState`, `useEffect`, `useCallback`) |
| **Build & Dev Tool** | Vite | `^6.2.0` | Ultra-fast HMR and ESM bundling |
| **Language** | TypeScript | `^5.7.3` | Full strict-mode typing across entities, API models, and database payloads |
| **Styling & Theme** | Tailwind CSS | `^4.0.0` | Modern utility styling with `@tailwindcss/vite` |
| **Icons** | Lucide React | `^0.546.0` | Lightweight SVG icons |
| **Database & Auth** | Supabase (PostgreSQL) | `@supabase/supabase-js ^2.118.0` | Cloud database, Row Level Security (RLS), and binary Storage buckets |
| **Market Data API** | Indian Stock Market API | `indianapi.in` | Live NSE/BSE stock quotes, trending gainers/losers, IPOs, and market news |
| **Typography & Scripts** | Google Noto Sans / Open Sans | UTF-8 Collation | Native Unicode grapheme segmentation (`Intl.Segmenter`) |

---

## 2. Architecture & Data Flow

```
                                      +------------------------------------+
                                      |   Indian Stock Market API          |
                                      |   https://stock.indianapi.in       |
                                      +-----------------+------------------+
                                                        |
                                          (Manual Click | 6hr Cache Guard)
                                                        v
+-----------------------------------+        +--------------------+
| Admin Studio                      |        | Cache & Quota Engine|
| - Stories Manager                 +------->| (indianStockApi.ts)|
| - Live Markets Ticker             |        | 500 req/mo Budget  |
| - IndianAPI Stock Data Studio     |        +---------+----------+
+-----------------+-----------------+                  |
                  |                                    |
                  | (Save / Publish)                   |
                  v                                    v
+-------------------------------------------------------------------------+
| Supabase PostgreSQL Database (https://yfsgudewhwialobsyrpg.supabase.co) |
| - public.stories (Multilingual editorial articles)                      |
| - public.market_tickers (Top marquee tape)                              |
| - public.indian_stock_data (Curated raw market feeds)                   |
| - public.trending_stocks (Live NSE/BSE gainers & losers)               |
+------------------------------------+------------------------------------+
                                     |
                                     | (is_published = true)
                                     v
+------------------------------------+------------------------------------+
| Public Customer / Subscriber View                                       |
| - Top Marquee Market Ticker Tape                                        |
| - Market Momentum: Trending Stocks Hero Strip (Gainers & Pullbacks)     |
| - Multilingual Editorial Stream (Sections & Categories)                 |
| - Curated Indian Market Wire (Company Dossiers, News & IPO Cards)       |
| - Top Movers Sidebar Widget                                             |
+-------------------------------------------------------------------------+
```

---

## 3. Environment Configuration (`.env`)

The portal connects to Supabase via standard client credentials:

```env
# Supabase Configuration (Vite Dev & Production)
VITE_SUPABASE_URL=https://yfsgudewhwialobsyrpg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1

# Supabase Configuration (Next.js / Vercel Edge SSR)
NEXT_PUBLIC_SUPABASE_URL=https://yfsgudewhwialobsyrpg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RcksFD4-e-ujGBtSDnE6Iw_VVEnOAU1

# Application Host URL
APP_URL="http://localhost:3000"
```

---

## 4. Indian Stock Market API Integration

- **Base URL:** `https://stock.indianapi.in`
- **Authentication Header:** `x-api-key: sk-live-nZAhOd7knZDf9m0LGC4TaqbgW0ipBN3jFhli0hLs`
- **Plan Quota:** **500 requests per month**

### Supported Endpoints

| Endpoint | Method | Parameter | Description |
|---|---|---|---|
| `/trending` | `GET` | — | Returns `top_gainers` and `top_losers` with price, net change, % change, volume, high/low, and rating |
| `/news` | `GET` | — | Curated Indian financial market wire (title, summary, URL, source, pub_date) |
| `/ipo` | `GET` | — | Active, upcoming, and listed IPOs with lot size and issue price |
| `/stock` | `GET` | `?name=<Company>` | Comprehensive company profile, real-time prices (NSE/BSE), balance sheet ratios, and shareholding |

### Quota Conservation Design:
1. **No Automated Polling:** Data is only retrieved on explicit click of **"Fetch Data on Click"** by an editorial admin.
2. **6-Hour Supabase Cache:** Identical queries within 6 hours are served directly from the database without deducting from the 500 requests/month limit.
3. **Live Monthly Budget Meter:** The Admin Studio tracks usage from the 1st of every calendar month (`X / 500 left`).

---

## 5. Database Schema & Tables

The database operates on PostgreSQL with Row Level Security (RLS) enabled.

### 1. `public.stories`
Stores core editorial journalism in any script with strict grapheme limits.
- `id` (UUID, Primary Key)
- `section` (Text: `'Investment Insights' | 'Market News' | 'Special Coverage'`)
- `category` (Text: e.g. `'Big Story'`, `'Market Trends'`, `'Stock Recommendations'`)
- `heading` (VARCHAR(70): max 70 grapheme characters across English, Malayalam, Hindi, Tamil, Arabic)
- `lead_image_url` (Text: 560x320 Retina JPG URL)
- `short_description` (Text: Rich Text summary)
- `full_story` (Text: Full HTML content)
- `canonical_url` (Text, Unique: SEO slug)
- `keywords`, `seo_title`, `seo_description` (Text)
- `publishing_status` (Text: `'Draft' | 'Ready to Publish' | 'Published' | 'Retired'`)
- `notification_status` (Text: `'Yes' | 'No'`)
- `display_order` (Integer)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `public.market_tickers`
Powers the top horizontal marquee ticker tape across all pages.
- `id` (UUID, Primary Key)
- `symbol` (Text: e.g. `'NIFTY 50'`, `'SENSEX'`, `'GOLD (10g)'`)
- `price` (Text: e.g. `'24,842.15'`)
- `change` (Text: e.g. `'+0.68%'`)
- `is_positive` (Boolean)
- `display_order` (Integer)
- `is_active` (Boolean)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. `public.indian_stock_data`
Raw and structured JSON payloads for company dossiers, news wires, and IPOs.
- `id` (UUID, Primary Key)
- `endpoint` (Text: `'trending' | 'news' | 'ipo' | 'stock'`)
- `query` (Text: e.g. `'RELIANCE'`)
- `title`, `summary` (Text)
- `data` (JSONB: complete raw response)
- `section`, `category` (Text: mapped editorial taxonomy)
- `is_published` (Boolean: gates visibility to subscribers)
- `display_order` (Integer)
- `fetched_at`, `created_at`, `updated_at` (TIMESTAMPTZ)

### 4. `public.trending_stocks`
Dedicated table for market momentum movers. **Cleared and refreshed on every load**.
- `id` (UUID, Primary Key)
- `ticker_id` (Text)
- `company_name` (Text)
- `price` (Text)
- `percent_change` (Text)
- `net_change` (Text)
- `trend_type` (Text: `'gainer' | 'loser'`)
- `high`, `low`, `open`, `close`, `volume` (Text)
- `overall_rating`, `short_term_trends` (Text)
- `exchange_type` (Text: `'BSE' | 'NSE'`)
- `section`, `category` (Text)
- `is_published` (Boolean)
- `display_order` (Integer)
- `fetched_at`, `created_at` (TIMESTAMPTZ)

---

## 6. Editorial Taxonomy (Sections & Categories)

### Sections
1. **Investment Insights**: Fundamental analysis, equity research, asset allocation.
2. **Market News**: Breaking news, exchange updates, and policy developments.
3. **Special Coverage**: In-depth macro series, sovereign bonds, and renewable energy transitions.

### Categories
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

---

## 7. Key Features & Workflows

### A. Admin Studio ([/admin](http://localhost:3000/admin))
- **Stories Manager Tab**: Full CRUD for multilingual articles, grapheme-length counter, 560x320 image compressor, auto-slug sync, and status toggles.
- **Live Markets Ticker Studio Tab**: Reorder, add, or edit assets on the top marquee tape with live chips.
- **IndianAPI Stock Data Studio Tab**: 
  - Select endpoint (`Trending`, `News`, `IPOs`, or `Company Lookup`).
  - Choose editorial Section and Category.
  - Click **"Fetch Data on Click"** $\rightarrow$ reviews live preview cards.
  - Click **"Save Data in Supabase"** $\rightarrow$ commits directly to cloud database.
  - Toggle **"Draft / Published"** to control subscriber visibility.

### B. Customer / Subscriber Feed ([/](http://localhost:3000/))
- **Top Marquee Ticker**: Continuous animated stock and commodity quotes.
- **Trending Stocks Hero Strip**: Prominent market momentum card strip with instant filtering for **All**, **Gainers (Green)**, and **Pullbacks (Red)**.
- **Sidebar Top Movers**: Live real-time NSE/BSE movers.
- **Multilingual Editorial Cards**: Responsive grid of published stories with canonical links and script tags.
- **Curated Indian Market Wire**: Formatted fundamental company cards, news briefs, and IPO dates.

---

## 8. Development & Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# TypeScript type check
npm run lint
```

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `/dist` directory ready for deployment on Vercel, Netlify, or AWS CloudFront.


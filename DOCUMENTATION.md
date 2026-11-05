# Financial Intelligence Editorial Portal — System Documentation

A high-coverage, multilingual financial editorial and market intelligence portal with real-time Indian stock market integration, automated image optimization, editorial workflow controls, and PostgreSQL persistence powered by Supabase.

---

## 1. Technologies & Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `^19.0.0` | Component-based UI with React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`) |
| **Build & Dev Tool** | Vite | `^6.2.0` | Ultra-fast HMR and ESM bundling with local API development middleware |
| **Language** | TypeScript | `^5.7.3` | Full strict-mode typing across entities, API models, and database payloads |
| **Styling & Theme** | Tailwind CSS | `^4.0.0` | Modern utility styling with `@tailwindcss/vite` |
| **Icons** | Lucide React | `^0.546.0` | Lightweight SVG icons |
| **Database & Storage** | Supabase (PostgreSQL) | `@supabase/supabase-js ^2.118.0` | Cloud database, Row Level Security (RLS), and binary Storage buckets |
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
| - Live Markets Ticker Studio      |        | OpenGraph Lead Image Scraper             |
+-----------------+-----------------+        +---------------------+--------------------+
                  |                                                |
                  | (Save / Publish)                               | (Trending, Indices, IPOs)
                  v                                                v
+---------------------------------------------------------------------------------------+
| Supabase PostgreSQL Database (https://yfsgudewhwialobsyrpg.supabase.co)               |
| - public.stories (Multilingual editorial journalism)                                  |
| - public.news (Saved raw news wire dispatches for drafting stories)                   |
| - public.market_tickers (Top marquee tape quotes)                                     |
| - public.trending_stocks (Live NSE/BSE gainers & losers)                             |
| - public.ipos (Active, upcoming & listed IPOs)                                        |
+------------------------------------+--------------------------------------------------+
                                     |
                                     | (is_published = true / is_active = true)
                                     v
+---------------------------------------------------------------------------------------+
| Public Customer / Subscriber View (Exact Hedge Ohari Replication)                     |
| - Multi-Line Mobile Market Ticker (Controls Line 1 + Full-Width Scrolling Line 2)     |
| - Mobile Hierarchy: Pulse Header -> Compact Top Movers -> Find Stories -> Categories  |
| - Desktop 3-Column Layout: Categories/Find Stories Sidebar | Feed Grid | Subscription |
| - Full Pagination: Section News Container & Public Stories Grid                      |
| - Authentic Lead Images: 100% publisher news photography parsed from original wire    |
+---------------------------------------------------------------------------------------+
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

## 4. Free Unlimited Market Data Engine & "Fetch Data on Click"

The application uses a **100% free, unlimited market intelligence engine** that completely replaces rate-limited third-party APIs (such as `stock.indianapi.in`). It incurs zero API subscription costs and imposes no monthly request caps.

### How "Fetch Data on Click" Works

The **"Fetch Data on Click"** action is the central data ingestion pipeline of the portal. It is triggered manually by editorial staff from the **Market News Wire** tab in the Admin Panel.

#### Step 1: User Initiation
1. The editor navigates to the Admin Studio at `/admin`.
2. On the **Market News Wire** tab, the editor clicks the purple button **"Fetch Data on Click"** (`#btn-fetch-unified-data`).
3. The button state changes to a spinning indicator (`Fetching All Market Data...`), disabling duplicate clicks.

#### Step 2: Client Execution (`executeUnifiedMarketSync`)
- In `src/components/StockDataPanel.tsx`, the `handleSingleClickFetch()` handler calls `executeUnifiedMarketSync('RELIANCE')` located in [`src/lib/marketData.ts`](file:///d:/financial-editorial-portal/src/lib/marketData.ts).
- It initiates an HTTP request to the serverless endpoint:
  ```http
  GET /api/market-data?endpoint=unified&symbol=RELIANCE
  ```
- In local development, this endpoint is served by Vite's connect middleware (`vite-plugin-market-data-dev` in [`vite.config.ts`](file:///d:/financial-editorial-portal/vite.config.ts)).
- In production on Vercel, it is handled by the serverless function in [`api/market-data.ts`](file:///d:/financial-editorial-portal/api/market-data.ts).
- If the endpoint cannot be reached, the engine automatically falls back to client-side direct ingestion (`runClientSideMarketFallback`).

#### Step 3: Concurrent Multi-Source Data Ingestion
The backend dispatches concurrent asynchronous requests using `Promise.all`:

1. **Benchmark Indices**:
   - Queries `yahoo-finance2` for 8 key benchmark assets: `^NSEI` (NIFTY 50), `^BSESN` (SENSEX), `^NSEBANK` (NIFTY BANK), `^CNXIT` (NIFTY IT), `GC=F` (Gold), `SI=F` (Silver), `INR=X` (USD/INR), and `CL=F` (Crude Oil).
2. **Top Gainers & Losers (Top Movers)**:
   - Queries `yahoo-finance2` for 30 tracked Nifty large-cap equities (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, Bharti Airtel, ITC, SBI, L&T, etc.).
   - Sorts quotes by percentage change to dynamically compute the top gainers and top pullbacks/losers.
3. **Primary Malayalam Financial News Feeds**:
   - **GoodReturns Malayalam Money News**: `https://malayalam.goodreturns.in/rss/feeds/malayalam-money-news-fb.xml`
   - **Dhanam Online** (Premier Kerala Finance Publication): `https://dhanamonline.com/feed`
   - **GoodReturns Personal Finance**: `https://malayalam.goodreturns.in/rss/feeds/malayalam-money-personal-finance-fb.xml`
   - **TwentyFour News Share Market**: `https://www.twentyfournews.com/tag/share-market/feed`
   - **TwentyFour News Business**: `https://www.twentyfournews.com/category/business/feed`
   - **GoodReturns Main Malayalam**: `https://malayalam.goodreturns.in/rss/feeds/goodreturns-malayalam-fb.xml`
   - **Google News Malayalam Business**: `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ml&gl=IN&ceid=IN:ml`
4. **English Financial News Feeds**:
   - **LiveMint Markets**: `https://www.livemint.com/rss/markets`
   - **Economic Times Stocks**: `https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms`
   - **Business Standard Markets**: `https://www.business-standard.com/rss/markets-106.rss`
5. **IPO Tracker**:
   - Scrapes live and upcoming SME & Mainboard IPO filings via Chittorgarh RSS / web scraper.

#### Step 4: Authentic Article Lead Image Pipeline
To ensure stories never show generic stock photos:
- The engine inspects RSS media fields in order: `enclosure.url` $\rightarrow$ `media:content` $\rightarrow$ `media:thumbnail` $\rightarrow$ HTML embedded `<img>`.
- If an item lacks an RSS image enclosure (common in TwentyFour News and Google News redirects), the engine invokes `fetchArticleOgImage(articleUrl)`:
  - Fetches the target wire page with a modern browser User-Agent header.
  - Follows redirects to the publisher's canonical destination.
  - Parses the HTML `<meta property="og:image" content="...">` or `<meta name="twitter:image" content="...">`.
  - Cleans and resolves relative URLs into absolute high-resolution JPEG/WebP links.

#### Step 5: Database Commit & Caching
Once the data payload is assembled:
1. **Trending Stocks**: Formatted as `TrendingStockItem[]` and saved to `public.trending_stocks`.
2. **Benchmark Indices**: Upserted into `public.market_tickers` and synced to `localStorage`.
3. **IPOs**: Saved into `public.ipos` with lot size, bidding dates, and price bands.
4. **Company Dossier**: Cached for fast fundamental lookup.

#### Step 6: Editorial Presentation & Drafting
- The fetched news dispatches are mapped into `NewsItemRecord` objects and delivered to the Admin Panel.
- Dispatches are prioritized with **Malayalam as the default language**, complete with language filtering pills (`[മലയാളം, English, All]`) and pagination.
- For any dispatch, the editor can click **"Save to News Table"** (`public.news`), which allows the dispatch to be selected from the "Create New Story" form and turned into a published editorial story with a single click.

---

## 5. Database Schema & Tables

The database operates on PostgreSQL with Row Level Security (RLS) enabled.

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

### 2. `public.news`
Stores raw financial dispatches saved by editors from the Market News Wire for drafting articles.
- `id` (UUID, Primary Key)
- `title` (Text)
- `summary` (Text)
- `full_content` (Text)
- `image_url` (Text)
- `url` (Text, Source URL)
- `source` (Text: e.g. `'ധനം ഓൺലൈൻ'`, `'GoodReturns'`, `'LiveMint'`)
- `category` (Text)
- `language` (Text: `'malayalam' | 'english'`)
- `pub_date` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

### 3. `public.market_tickers`
Powers the top horizontal marquee ticker tape across all pages.
- `id` (UUID, Primary Key)
- `symbol` (Text: e.g. `'NIFTY 50'`, `'SENSEX'`, `'GOLD (10g)'`)
- `price` (Text: e.g. `'24,842.15'`)
- `change` (Text: e.g. `'+0.68%'`)
- `is_positive` (Boolean)
- `display_order` (Integer)
- `is_active` (Boolean)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 4. `public.trending_stocks`
Dedicated table for market momentum movers (Top Gainers & Top Losers).
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

### 5. `public.ipos`
Stores active, upcoming, and listed SME & Mainboard IPOs.
- `id` (UUID, Primary Key)
- `symbol` (Text)
- `name` (Text)
- `status` (Text: `'active' | 'upcoming' | 'listed'`)
- `is_sme` (Boolean)
- `min_price`, `max_price`, `issue_price`, `listing_price` (Numeric)
- `lot_size` (Integer)
- `bidding_start_date`, `bidding_end_date`, `listing_date` (Text)
- `is_published` (Boolean)
- `created_at` (TIMESTAMPTZ)

---

## 6. Editorial Taxonomy (Sections & Categories)

### Core Sections
1. **All Stories**: Comprehensive portal feed.
2. **Market News**: Breaking news, exchange wire, and macro policy.
3. **Investment Insights**: Fundamental analysis, equity research, asset allocation.
4. **Special Coverage**: Long-form investigative journalism and special reports.
5. **IPO Watch**: Dedicated tracking of Mainboard & SME IPO pipelines.

### Hedge Ohari Categories & Tags Taxonomy
Directly mirroring `https://hedgeohari.com/`:
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

## 7. Key Features & Workflows

### A. Admin Studio (`/admin`)
- **Market News Wire Tab (Primary Tab)**:
  - Trigger 1-Click ingestion via **"Fetch Data on Click"**.
  - Filter news dispatches by language: `[മലയാളം, English, All]` (Malayalam selected by default).
  - Search news by headline keywords.
  - Read full article content scraped from original wires with real publisher lead photography.
  - Click **"Save to News Table"** to store dispatches in `public.news`.
  - Full pagination controls with items-per-page selector.
- **Stories Manager Tab**:
  - Full CRUD operations for articles in English, Malayalam, and other Indian scripts.
  - Real-time grapheme length counter with 70-grapheme ceiling for headlines.
  - Built-in 560x320 Retina image compressor and cropper with WebP/JPEG output.
  - Automatic canonical URL slug generator supporting transliterated Indic scripts.
  - Editorial statuses: `Draft`, `Ready to Publish`, `Published`, `Retired`.
- **Live Markets Ticker Studio Tab**:
  - Configure, re-order, and toggle assets on the top marquee ticker tape.

### B. Public Portal (`/`) — Hedge Ohari Structure

#### 1. Top Marquee Ticker (`#section-market-ticker`)
- **Mobile Multi-Line Display**:
  - Line 1: `#ticker-control-strip` spans full width with the green live pulse indicator, filter pills (`All`, `Indices`, `Movers`, `IPOs`), play/pause button, and 0.5x speed toggle.
  - Line 2: `#ticker-scroller-container` takes 100% viewport width (`w-full`), providing the continuous infinite ticker tape with full screen width.
- **Desktop Single-Line Display**: Seamless inline horizontal ribbon with status, filters, and scrolling quotes.

#### 2. Mobile View Layout Hierarchy (`< 1024px`)
Strictly ordered for optimal mobile user experience:
1. `#section-market-pulse-desk` (starting with `#section-market-pulse-header`) at the very top.
2. **Top Movers Ticker**:
   - Sleek compact cards (`card-mover-${stock.id}` e.g. `card-mover-trend-live-g-1`..`g-n`): `w-[145px]` card footprint, top accent trend bar (emerald for gainers, crimson for losers), bold symbols, percentage pill, price, and news search shortcut.
   - Next (`#btn-movers-next`) and Previous (`#btn-movers-prev`) buttons.
   - Smooth horizontal touch swipe and CSS snap scrolling.
3. `#section-find-stories`: Minimised by default (`filterExpanded = false`), expanding upon tap.
4. `#section-mobile-categories`: Horizontal category filter pill scroller.
5. `#section-stories-grid` + `#section-stories-pagination`: Editorial stories feed with previous/next page navigation.

#### 3. Desktop 3-Column Layout (`>= 1024px`)
- **Left Column (`#section-left-sidebar`)**:
  1. `#section-desktop-categories` (Categories vertical menu first).
  2. `#section-find-stories` (FIND STORIES taxonomy filter second, expanded by default).
  3. `#section-journal-promo-left` (Subscription promo third).
- **Center Feed (`#section-center-feed`)**:
  1. `#section-market-pulse-desk` with multi-column responsive grid.
  2. `#section-stories-grid` with 2-column cards.
  3. `#section-stories-pagination` page navigation.
- **Right Column (`#section-right-sidebar`)**:
  1. `#section-journal-subscription-right` (Non-sticky subscription card).
  2. `#section-market-radar-today` (Live benchmark index glance).
  3. `#section-visit-hedge-at` (Official social channel links).

---

## 8. Development & Deployment

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
Creates an optimized static bundle in the `/dist` directory ready for deployment on Vercel, Netlify, or AWS CloudFront.

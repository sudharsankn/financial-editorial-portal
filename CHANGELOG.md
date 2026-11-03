# Changelog

All notable changes to the Financial Editorial Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-03

### Removed
- **`stock.indianapi.in` Fully Removed**:
  - Completely purged external dependency on `stock.indianapi.in` and its 500 requests/month quota constraint.
  - Deleted legacy client module `src/lib/indianStockApi.ts`.
  - Removed all hardcoded IndianAPI URLs, API key constants, and usage rate limits.

### Added
- **Free Unlimited Market Data Engine (`src/lib/marketData.ts` & `api/market-data.ts`)**:
  - **1-Click Sync**: Replaced IndianAPI with a native, completely free, unlimited market sync engine powered by Yahoo Finance (`yahoo-finance2`) and Real-Time Financial Wire RSS (`rss-parser`).
  - **Live Trending Stocks**: Pulls top gainers and losers dynamically from the Indian Nifty 50 large-cap universe without rate limits.
  - **Real-Time Financial News**: Merges live Indian financial dispatches directly into `public.stories` with status `'Draft'`.
  - **Company Dossiers**: Fetches comprehensive fundamental metrics (P/E, Market Cap, 52-week High/Low, Volume) from Yahoo Finance.
  - **Persistent IPO Watch**: Integrates with `public.ipos` table for tracking active and upcoming IPOs.

### Improved
- **Updated UI Badges & Navigation**:
  - Replaced `"IndianAPI Stock Data"` with `"Market Data Studio (Free Engine)"`.
  - Updated article tags from `"IndianAPI Wire"` to `"Market Wire"`.
  - Reflected `"100% Free / Unlimited"` quota status throughout the Admin Panel.

---

## [1.3.0] - 2026-11-03

### Added
- **Dynamic Category Ingestion from `/news` Topics**:
  - Ingested stories from `/news` derive their `category` directly from news topics (`Industry`, `Companies`, `Markets`, `Economy`, `Money`, `Logistics`).
  - master `CATEGORIES` array updated for immediate filtering in feeds and dropdowns.

### Improved
- **Database Category Flexibility**:
  - Removed strict enum check constraint (`stories_category_check`) to prevent database write errors on new topic categories.

---

## [1.2.0] - 2026-11-03

### Added
- **1-Click Unified Sync**:
  - Merged news into story drafts, added dedicated `IPO Watch` section and relative publication timestamps (`"1 min ago"`).
  - Explicit section DOM IDs for streamlined editing navigation.

---

## [1.1.0] - 2026-11-03

### Added
- **Supabase Strict Environment Configuration**:
  - Migrated authentication and client initialization to strictly read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via `.env`.

---

## [1.0.0] - 2026-11-03

### Added
- Initial release of the Multilingual Financial Editorial Portal with Supabase persistence and Vercel deployment.

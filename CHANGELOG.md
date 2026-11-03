# Changelog

All notable changes to the Financial Editorial Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-11-03

### Added
- **Yahoo Finance Free Market Engine (Approach A)**:
  - Installed `yahoo-finance2` and created serverless backend endpoint `api/yahoo.ts` for Vercel and Node.js environments.
  - Added support for single quotes (`/api/yahoo?symbol=RELIANCE`), batch quotes (`/api/yahoo?symbols=^NSEI,TCS,INFY`), and company valuation summaries (`/api/yahoo?symbol=RELIANCE&action=summary`).
  - Automatically maps Indian tickers to `.NS` (NSE) and `.BO` (BSE) with full CORS handling.
  - Implemented client SDK module `src/lib/yahooFinance.ts` with browser-safe fallback, Rupee currency formatting (`formatIndianRupee`), and market capitalization formatting in Crores (`formatMarketCapCrores`).

### Improved
- **Unlimited Stock Quota Strategy**:
  - Offloaded general company financials and real-time ticker quotes to Yahoo Finance, eliminating consumption of the 500 requests/month quota on IndianStockAPI.
- **Stories Sync & Auto-Refresh**:
  - Connected `onRefreshStories` callback in Admin Panel to auto-reload stories table after 1-click sync without needing a page refresh.

### Fixed
- Fixed PostgreSQL `stories_category_check` violation by adding a safe category fallback to `'Market Trends'` while retaining exact topic tags in story keywords.

---

## [1.3.0] - 2026-11-03

### Added
- **Dynamic Category Ingestion from `/news` Topics**:
  - Ingested stories from `/news` now derive their `category` directly from the `topics` array returned by IndianAPI (e.g. `Industry`, `Companies`, `Markets`, `Economy`, `Money`, `Logistics`).
  - Added new dynamic category types to `Category` and included them in the master `CATEGORIES` array.
  - Category filter pills on the Subscriber Feed and Admin category dropdown now seamlessly filter by these topic categories.

### Improved
- **Database Category Flexibility**:
  - Removed strict enum check constraint (`stories_category_check`) in `run_this_in_supabase_sql_editor.sql` and `sqlMigration.ts` to support dynamic topic categories without breaking Supabase table constraints.
- **Article Tagging & Search**:
  - Integrated topic keywords into `story.keywords` so search queries for topics immediately return relevant stories.

---

## [1.2.0] - 2026-11-03

### Added
- **1-Click Unified IndianAPI Sync**:
  - Implemented single-click ingestion in the Admin Panel for all endpoints (`/trending`, `/news`, `/ipo`, and `/stock`) via `executeUnifiedIndianApiSync()`.
  - Removed mandatory editorial taxonomy / section dropdown selection prior to fetching data.
- **News Merge into Stories**:
  - Automatically merges `/news` items into `public.stories` with status `'Draft'` preserving the core story schema.
  - Added support for editorial stories coming either manually or via automated IndianAPI news wire ingestion.
  - Clamped ingested titles to 70 graphemes to enforce strict editorial standards.
- **Dedicated `IPO Watch` Section & Table**:
  - Created `public.ipos` table in Supabase to track active, upcoming, listed, and closed issues.
  - Added new editorial section `'IPO Watch'` with categories (`IPO Pipeline`, `Mainboard IPO`, `SME IPO`).
  - Integrated dedicated IPO Watch hub in Subscriber feed displaying bidding dates, price bands, lot sizes, and listing exchanges.
- **Relative Publish Timestamps**:
  - Added `formatTimeAgo()` utility (`src/lib/timeAgo.ts`) rendering relative publication times (`"just now"`, `"1 min ago"`, `"2 hours ago"`, `"yesterday"`).
  - Integrated relative timestamps across all Story Cards and the Admin Story Manager table.
- **Section DOM IDs**:
  - Added explicit HTML `id` attributes to each layout section for streamlined navigation, test automation, and in-place editing:
    - Admin sync tabs: `section-trending-container`, `section-news-container`, `section-ipo-container`, `section-stock-container`.
    - Subscriber view: `section-nav-strip`, `section-trending-strip`, `section-ipo-watch-hub`, `section-category-pills`, `section-stories-grid`, `section-sidebar-movers`, `section-sidebar-watchlist`.
- **Post-Fetch Tab Navigation**:
  - After a 1-click sync, the panel unlocks and surfaces 4 organized tabs: `Trending Stocks`, `Market News`, `IPOs`, and `Company Lookup`.

### Improved
- **Editorial Card Badges**: Story cards now visually distinguish between manual editorial articles and syndicated IndianAPI wire pieces.
- **Supabase Migration Script**: Updated `run_this_in_supabase_sql_editor.sql` to include columns `source_type`, `source_url`, and `published_at` for `public.stories`, along with full RLS policies for `public.ipos` and `public.trending_stocks`.

### Fixed
- Fixed TypeScript export type mismatch for `StockDataRecord` in `src/lib/indianStockApi.ts`.
- Fixed Supabase story schema compatibility ensuring external syndicated news attributes (`source_type`, `source_url`, `published_at`) do not cause insert/upsert failures.

---

## [1.1.0] - 2026-11-03

### Added
- **Supabase Strict Environment Configuration**:
  - Migrated authentication and client initialization to strictly read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via `.env` file instead of fallbacks.
  - Added environment variable documentation in `.env.example` and `README.md`.
- **System Documentation**:
  - Added `SYSTEM_DOCUMENTATION.md` detailing architecture, technology stack, database schemas, security rules, and API reference.

### Fixed
- Fixed issue where credentials stored in browser `localStorage` could conflict with live Supabase environment configuration.
- Fixed Vercel deployment build and TypeScript resolution for modern Vite + Tailwind CSS v4 setup.

---

## [1.0.0] - 2026-11-03

### Added
- Initial release of the Multilingual Financial Editorial Portal.
- Multilingual publishing workflow with 12 Indian regional languages + English.
- Real-time stock ticker and market data sidebar integration.
- Subscriber view with category filtering, reading mode, and dark/light mode toggle.
- Admin editorial dashboard with story creation, editing, scheduling, and deletion capabilities.
- Live Supabase persistence with Row Level Security (RLS).

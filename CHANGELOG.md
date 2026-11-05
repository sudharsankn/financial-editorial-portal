# Changelog

All notable changes to the Financial Editorial Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-11-05

### Added
- **Authentic News Article Lead Image Scraper & OpenGraph Parser**:
  - Replaced fallback static Unsplash stock imagery with real publisher lead images parsed directly from wire RSS feeds.
  - Multi-tier feed extractor parses `enclosure`, `media:content`, `media:thumbnail`, and embedded HTML `<img>` tags across Malayalam sources (Dhanam Online, GoodReturns Malayalam, TwentyFour News) and English sources (LiveMint, Economic Times, Business Standard).
  - Built direct OpenGraph/Twitter card lead photo scraper (`fetchArticleOgImage`) to extract original lead images from publisher article pages when feeds lack media enclosures.
- **Stories Feed & Wire News Pagination**:
  - Added `#section-stories-pagination` on public home page and subscriber feed with smooth page navigation, previous/next controls, and active page pill indicators.
  - Added full pagination to `#section-news-container` in Admin Panel Market News Wire with dispatches count and per-page selector.
- **Hedge Ohari Taxonomy in "FIND STORIES"**:
  - Integrated complete 18-item Category/Tags taxonomy matching `hedgeohari.com` (Financial Planning, Big Story, Results Calendar, Event Calendar, Class Room, Political Theatre, Market Trends, Mutual Fund, Stock Recommendations, Portfolio, Sector Scan, Economy Watch, Personal Finance, Insurance, Tax Planning, Commodity, Currency, Crypto / FinTech).
  - Added published month filter dropdown and quick `#tag` filter chips.
- **Right Sidebar "Visit Hedge at" Social Widget**:
  - Added official social channel cards for YouTube, Facebook, Twitter, Instagram, and LinkedIn in the right sidebar.

### Changed
- **Mobile-First Layout Hierarchy**:
  - Strictly re-ordered public layout on mobile screens (`< 1024px`):
    1. `#section-market-pulse-desk` (starting with `#section-market-pulse-header`) displayed at the top.
    2. Redesigned compact Top Movers cards (`card-mover-${stock.id}` e.g. `card-mover-trend-live-g-1`..`g-n`) with sleek `w-[145px]` card footprint, top accent trend bar (emerald for gainers, crimson for losers), high-density typography, price, and search filter shortcut.
    3. Mobile Next (`#btn-movers-next`) and Previous (`#btn-movers-prev`) buttons with horizontal touch swipe/scroll and CSS snap.
    4. `#section-find-stories` minimised by default on mobile (`filterExpanded = false`), expanding on tap.
    5. `#section-mobile-categories` horizontal scrolling category pill strip placed directly below Find Stories.
    6. Editorial `#section-stories-grid` with pagination.
- **Multi-Line Market Ticker on Mobile**:
  - Restructured `#section-market-ticker` from single-row flex to `flex flex-col sm:flex-row`.
  - On mobile screens, `#ticker-control-strip` sits on line 1 with full width (`w-full justify-between`) holding the live indicator, filter pills, play/pause, and speed controls.
  - `#ticker-scroller-container` drops to line 2 with 100% viewport width (`w-full sm:flex-1`), giving ticker quotes the full width to scroll without being squeezed by control buttons.
- **Admin Panel Market News Wire & Navigation Tabs**:
  - Moved **Market News Wire** to be the primary first tab in the Admin Panel.
  - Re-ordered language filter pills to `[മലയാളം, English, All]` with Malayalam set as primary default and `All` at the end.
  - Removed `(Primary)` badge and `Saved in DB` count from tab headers.
  - Made `#nav-admin-tabs` mobile-responsive with horizontal smooth scrolling (`overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap`) to prevent tabs from overflowing mobile viewports.
- **Desktop Sidebar Ordering**:
  - Left sidebar (`#section-left-sidebar`): ordered as `#section-desktop-categories` (first), `#section-find-stories` (second, expanded), `#section-journal-promo-left` (third).
  - Right sidebar (`#section-right-sidebar`): `#section-journal-subscription-right` (non-sticky), `#section-market-radar-today`, and `#section-visit-hedge-at`.

---

## [2.1.0] - 2026-11-03

### Changed
- **Direct Replication of Hedge Ohari UI (`https://hedgeohari.com/`)**:
  - Re-architected homepage layout to match the official **Hedge Ohari** structure with zero extraneous elements:
    - **Header (`HedgeNavbar.tsx`)**: Exact 60px height bar with left drawer hamburger menu, official Hedge Ohari center SVG logo, and right-aligned Subscribe button, bookmark counter, fly-in search bar, and Admin access.
    - **Left Sidebar (`section-left`)**: Sticky vertical category navigation tabs (`All Stories`, `Market News`, `Investment Insights`, `Special Coverage`, `IPO Watch`) with active purple indicator.
    - **Center Feed (`section-main`)**: Cards styled exactly as Hedge Ohari's `.each-grid` (white rounded box, 320px high lead image, Malayalam typography with `Noto Sans Malayalam`, relative publishing timestamp, share, and bookmark).
    - **Right Sidebar (`section-right`)**: Sticky journal subscription card with direct inquiry links.
    - **Slide-out Navigation Drawer (`HedgeDrawer.tsx`)**: Official `#903E97` purple brand drawer with mobile-first menu listing, section switcher, and links to Hedge Equities.
    - **Minimalist Footer (`HedgeFooter.tsx`)**: Official brand attribution, terms of use, privacy policy, and links.

### Removed
- **Extraneous Non-Hedge Home Widgets**:
  - Removed top marquee tickers, banner sliders, and non-canonical widgets from the public home page view, ensuring an identical, uncluttered experience faithful to `hedgeohari.com`.

---

## [2.0.0] - 2026-11-03

### Removed
- **`stock.indianapi.in` Fully Removed**:
  - Purged external dependency on `stock.indianapi.in` and its 500 requests/month quota constraint.
  - Deleted legacy client module `src/lib/indianStockApi.ts`.

### Added
- **Free Unlimited Market Data Engine (`src/lib/marketData.ts` & `api/market-data.ts`)**:
  - Powered by Yahoo Finance (`yahoo-finance2`) and Real-Time Financial Wire RSS (`rss-parser`).
  - Pulls top gainers and losers dynamically from the Nifty large-cap universe without rate limits.
  - Merges live Indian financial dispatches directly into `public.stories` with status `'Draft'`.

---

## [1.0.0] - 2026-11-03

### Added
- Initial release of the Multilingual Financial Editorial Portal with Supabase persistence and Vercel deployment.

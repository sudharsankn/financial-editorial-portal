# Changelog

All notable changes to the Financial Editorial Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

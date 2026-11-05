import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Story,
  SECTIONS,
  MarketTickerItem,
  TrendingStockItem,
  IpoItemRecord,
} from '../types/story';
import {
  Bookmark,
  Share2,
  Clock,
  Check,
  TrendingUp,
  TrendingDown,
  Flame,
  Rocket,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Globe,
  Youtube,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { formatTimeAgo } from '../lib/timeAgo';
import { DEFAULT_MARKET_TICKERS } from '../lib/supabase';
import { DEFAULT_TRENDING_STOCKS } from '../lib/marketData';

interface HedgeHomePageProps {
  stories: Story[];
  loading: boolean;
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  onSelectStory: (canonicalUrl: string) => void;
  onOpenSubscribe: () => void;
  marketTickers?: MarketTickerItem[];
  trendingStocks?: TrendingStockItem[];
  ipos?: IpoItemRecord[];
  onSearchSymbol?: (symbol: string) => void;
  onRefreshLiveMarket?: () => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (id: string) => void;
  showOnlyBookmarks?: boolean;
  onToggleShowBookmarks?: (show: boolean) => void;
}

type MarketDeskTab = 'indices' | 'movers' | 'ipos';
type MoversFilter = 'all' | 'gainers' | 'losers';
type IpoFilter = 'all' | 'active' | 'upcoming';

export const HedgeHomePage: React.FC<HedgeHomePageProps> = ({
  stories,
  loading,
  selectedSection,
  onSelectSection,
  onSelectStory,
  onOpenSubscribe,
  marketTickers = [],
  trendingStocks = [],
  ipos = [],
  onSearchSymbol,
  onRefreshLiveMarket,
  bookmarkedIds,
  onToggleBookmark,
  showOnlyBookmarks = false,
  onToggleShowBookmarks,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localBookmarkedIds, setLocalBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('hedge_saved_bookmarks');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const effectiveBookmarkedIds = bookmarkedIds || localBookmarkedIds;

  // Market Desk State
  const [deskExpanded, setDeskExpanded] = useState<boolean>(true);
  const [activeMarketTab, setActiveMarketTab] = useState<MarketDeskTab>('movers');
  const [moversFilter, setMoversFilter] = useState<MoversFilter>('all');
  const [ipoFilter, setIpoFilter] = useState<IpoFilter>('all');

  // Track mobile screen size for responsive DOM layout & conditional IDs
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FIND STORIES Filter States - minimised by default on mobile (< 1024px), open on desktop
  const [filterExpanded, setFilterExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [storySearchQuery, setStorySearchQuery] = useState<string>('');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  // Stories Listing Pagination
  const [storyPage, setStoryPage] = useState<number>(1);
  const [storiesPerPage, setStoriesPerPage] = useState<number>(8);

  // Top Movers carousel horizontal scroll ref and control handlers
  const moversScrollRef = useRef<HTMLDivElement>(null);
  const scrollMovers = (direction: 'left' | 'right') => {
    if (moversScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      moversScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Exact Hedge Ohari (hedgeohari.com) Category / Tags Taxonomy
  const HEDGE_OHARI_CATEGORIES_TAGS = [
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
    'Tax Planning',
    'Commodity',
    'Currency',
    'Crypto / FinTech',
  ];

  const availableCategories = useMemo(() => {
    const set = new Set<string>(HEDGE_OHARI_CATEGORIES_TAGS);
    stories.forEach((s) => {
      if (s.category) set.add(s.category);
      if (s.keywords) {
        s.keywords.split(',').forEach((k) => {
          const trimmed = k.trim();
          if (trimmed.length > 2 && trimmed.length < 35) {
            set.add(trimmed);
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stories]);

  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    stories.forEach((s) => {
      const dStr = s.published_at || s.created_at;
      if (dStr) {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          const key = dStr.slice(0, 7);
          const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          map.set(key, label);
        }
      }
    });
    return Array.from(map.entries());
  }, [stories]);

  const displayedStories = useMemo(() => {
    return stories.filter((story) => {
      // 0. Bookmarks filter
      if (showOnlyBookmarks && !effectiveBookmarkedIds.has(story.id)) {
        return false;
      }

      // 1. Text search
      if (storySearchQuery.trim()) {
        const q = storySearchQuery.toLowerCase();
        const matchHead = story.heading.toLowerCase().includes(q);
        const matchExcerpt = (story.short_description || '').toLowerCase().includes(q);
        const matchCat = (story.category || '').toLowerCase().includes(q);
        const matchSec = (story.section || '').toLowerCase().includes(q);
        const matchKw = (story.keywords || '').toLowerCase().includes(q);
        if (!matchHead && !matchExcerpt && !matchCat && !matchSec && !matchKw) {
          return false;
        }
      }

      // 2. Category / Tags filter (Exact match or keyword/heading inclusion)
      if (selectedCategoryTag !== 'all') {
        const catLower = selectedCategoryTag.toLowerCase();
        const matchCat = (story.category || '').toLowerCase() === catLower;
        const matchKw = (story.keywords || '').toLowerCase().includes(catLower);
        const matchHead = story.heading.toLowerCase().includes(catLower);
        if (!matchCat && !matchKw && !matchHead) {
          return false;
        }
      }

      // 3. Month filter
      if (selectedMonth !== 'all') {
        const dateStr = story.published_at || story.created_at;
        if (dateStr) {
          const itemMonth = dateStr.slice(0, 7);
          if (itemMonth !== selectedMonth) return false;
        }
      }

      return true;
    });
  }, [stories, storySearchQuery, selectedCategoryTag, selectedMonth, showOnlyBookmarks, effectiveBookmarkedIds]);

  const totalStoryPages = Math.max(1, Math.ceil(displayedStories.length / storiesPerPage));
  const validStoryPage = Math.min(storyPage, totalStoryPages);
  const storyStartIndex = (validStoryPage - 1) * storiesPerPage;
  const paginatedStories = useMemo(() => {
    return displayedStories.slice(storyStartIndex, storyStartIndex + storiesPerPage);
  }, [displayedStories, storyStartIndex, storiesPerPage]);

  const handleStoryPageChange = (newPage: number) => {
    const p = Math.max(1, Math.min(newPage, totalStoryPages));
    setStoryPage(p);
    const target = document.getElementById('section-stories-grid') || document.getElementById('section-center-feed');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    setStoryPage(1);
  }, [storySearchQuery, selectedCategoryTag, selectedMonth, selectedSection, showOnlyBookmarks]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(id);
    } else {
      setLocalBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem('hedge_saved_bookmarks', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
    }
  };

  const handleShare = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${story.canonical_url}`;
    if (navigator.share) {
      navigator.share({ title: story.heading, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(story.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const navSections = [
    { label: 'All Stories', value: 'All' },
    { label: 'Market News', value: 'Market News' },
    { label: 'Investment Insights', value: 'Investment Insights' },
    { label: 'Special Coverage', value: 'Special Coverage' },
    { label: 'IPO Watch', value: 'IPO Watch' },
  ];

  // Effective Datasets with Fallbacks
  const effectiveIndices =
    marketTickers.length > 0 ? marketTickers.filter((t) => t.is_active) : DEFAULT_MARKET_TICKERS;

  const effectiveTrending =
    trendingStocks.length > 0 ? trendingStocks : DEFAULT_TRENDING_STOCKS;

  // Filtered Movers
  const filteredMovers = useMemo(() => {
    if (moversFilter === 'gainers') {
      return effectiveTrending.filter((s) => s.trend_type === 'gainer');
    }
    if (moversFilter === 'losers') {
      return effectiveTrending.filter((s) => s.trend_type === 'loser');
    }
    return effectiveTrending;
  }, [effectiveTrending, moversFilter]);

  // Filtered IPOs
  const filteredIpos = useMemo(() => {
    if (ipoFilter === 'active') {
      return ipos.filter((i) => i.status === 'active');
    }
    if (ipoFilter === 'upcoming') {
      return ipos.filter((i) => i.status === 'upcoming');
    }
    return ipos;
  }, [ipos, ipoFilter]);

  // Top Gainer, Top Loser & Featured IPO with strict sorting
  const topGainer = useMemo(() => {
    const gainers = effectiveTrending.filter((s) => s.trend_type === 'gainer');
    if (gainers.length === 0) return null;
    return gainers.reduce((max, s) => {
      const sVal = parseFloat(String(s.percent_change).replace(/[^\d.-]/g, '')) || 0;
      const maxVal = parseFloat(String(max.percent_change).replace(/[^\d.-]/g, '')) || 0;
      return sVal > maxVal ? s : max;
    }, gainers[0]);
  }, [effectiveTrending]);

  const topLoser = useMemo(() => {
    const losers = effectiveTrending.filter((s) => s.trend_type === 'loser');
    if (losers.length === 0) return null;
    return losers.reduce((min, s) => {
      const sVal = parseFloat(String(s.percent_change).replace(/[^\d.-]/g, '')) || 0;
      const minVal = parseFloat(String(min.percent_change).replace(/[^\d.-]/g, '')) || 0;
      return sVal < minVal ? s : min;
    }, losers[0]);
  }, [effectiveTrending]);

  const featuredIpo = useMemo(() => {
    const openIpo = ipos.find((i) => i.status === 'active');
    if (openIpo) return openIpo;
    const upcomingIpo = ipos.find((i) => i.status === 'upcoming');
    if (upcomingIpo) return upcomingIpo;
    return ipos[0] || null;
  }, [ipos]);

  const mainIndex = useMemo(() => {
    return effectiveIndices.find((i) => i.symbol === 'NIFTY 50') || effectiveIndices[0];
  }, [effectiveIndices]);

  // Strip rich text HTML safely for grid preview
  const getExcerpt = (html: string) => {
    return html.replace(/<[^>]+>/g, '').trim();
  };

  // Reusable FIND STORIES Box with responsive ID attribution
  const renderFindStoriesBox = (isMobile = false) => {
    const isPrimary = isMobile === isMobileScreen;
    const sectionId = isPrimary ? 'section-find-stories' : (isMobile ? 'section-find-stories-mobile' : 'section-find-stories-desktop');
    const toggleBtnId = isPrimary ? 'btn-toggle-find-stories' : (isMobile ? 'btn-toggle-find-stories-mobile' : 'btn-toggle-find-stories-desktop');
    const bodyId = isPrimary ? 'panel-find-stories-body' : (isMobile ? 'panel-find-stories-body-mobile' : 'panel-find-stories-body-desktop');
    const inputSearchId = isPrimary ? 'input-find-stories-search' : (isMobile ? 'input-find-stories-search-mobile' : 'input-find-stories-search-desktop');
    const selectSectionId = isPrimary ? 'select-find-stories-section' : (isMobile ? 'select-find-stories-section-mobile' : 'select-find-stories-section-desktop');
    const selectCategoryId = isPrimary ? 'select-find-stories-category' : (isMobile ? 'select-find-stories-category-mobile' : 'select-find-stories-category-desktop');
    const selectMonthId = isPrimary ? 'select-find-stories-month' : (isMobile ? 'select-find-stories-month-mobile' : 'select-find-stories-month-desktop');
    const resetBtnId = isPrimary ? 'btn-find-stories-reset' : (isMobile ? 'btn-find-stories-reset-mobile' : 'btn-find-stories-reset-desktop');

    return (
      <div id={sectionId} className="bg-white rounded border border-[#E6E6E6] shadow-2xs overflow-hidden">
        <button
          id={toggleBtnId}
          type="button"
          onClick={() => setFilterExpanded(!filterExpanded)}
          className="w-full p-3.5 bg-[#FAF7FC] hover:bg-[#F3E5F5]/60 transition-colors border-b border-[#E6E6E6] text-left flex items-start justify-between gap-2 cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Search className="w-3.5 h-3.5 text-[#903E97]" />
              <h5 className="font-['Open_Sans'] font-extrabold text-xs text-[#262B2E] uppercase tracking-wider">
                FIND STORIES
              </h5>
              {(storySearchQuery || selectedCategoryTag !== 'all' || selectedMonth !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-[#903E97]" title="Active filter applied" />
              )}
            </div>
            <p className="text-[10px] text-[#676A6C] leading-normal">
              Filter stories by published month, sections, category &amp; tags.
            </p>
          </div>
          <div className="text-[#676A6C] p-0.5">
            {filterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {filterExpanded && (
          <div id={bodyId} className="p-3.5 space-y-3 bg-white text-xs">
            {/* Headline / Keyword Search */}
            <div>
              <label className="text-[10px] font-bold text-[#262B2E] uppercase tracking-wider block mb-1">
                Search Headline
              </label>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878787]" />
                <input
                  id={inputSearchId}
                  type="text"
                  value={storySearchQuery}
                  onChange={(e) => {
                    setStorySearchQuery(e.target.value);
                    setStoryPage(1);
                  }}
                  placeholder="Search keywords..."
                  className="w-full pl-7 pr-6 py-1.5 rounded border border-[#E6E6E6] text-xs text-[#262B2E] focus:border-[#903E97] outline-none"
                />
                {storySearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setStorySearchQuery('');
                      setStoryPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#878787] hover:text-[#262B2E] text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Section Filter */}
            <div>
              <label className="text-[10px] font-bold text-[#262B2E] uppercase tracking-wider block mb-1">
                Section
              </label>
              <select
                id={selectSectionId}
                value={selectedSection}
                onChange={(e) => {
                  onSelectSection(e.target.value);
                  setStoryPage(1);
                }}
                className="w-full bg-[#FAF7FC] border border-[#E6E6E6] rounded px-2.5 py-1.5 text-xs text-[#262B2E] font-medium focus:border-[#903E97] outline-none"
              >
                {navSections.map((sec) => (
                  <option key={sec.value} value={sec.value}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category / Tags Filter (Matching hedgeohari.com) */}
            {availableCategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-[#262B2E] uppercase tracking-wider">
                    Category / Tags
                  </label>
                  {selectedCategoryTag !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryTag('all');
                        setStoryPage(1);
                      }}
                      className="text-[10px] text-[#903E97] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <select
                  id={selectCategoryId}
                  value={selectedCategoryTag}
                  onChange={(e) => {
                    setSelectedCategoryTag(e.target.value);
                    setStoryPage(1);
                  }}
                  className="w-full bg-[#FAF7FC] border border-[#E6E6E6] rounded px-2.5 py-1.5 text-xs text-[#262B2E] font-medium focus:border-[#903E97] outline-none"
                >
                  <option value="all">All Categories &amp; Tags ({availableCategories.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Quick Tag Chips */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {['Mutual Fund', 'Stock Recommendations', 'Financial Planning', 'Tax Planning', 'Big Story'].map((tag) => {
                    const isTagActive = selectedCategoryTag.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryTag(isTagActive ? 'all' : tag);
                          setStoryPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          isTagActive
                            ? 'bg-[#903E97] text-white shadow-2xs'
                            : 'bg-[#FAF7FC] text-[#676A6C] hover:text-[#903E97] hover:bg-[#F3E5F5]/50 border border-[#E6E6E6]'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Publishing Month Filter */}
            {availableMonths.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-[#262B2E] uppercase tracking-wider block mb-1">
                  Publishing Month
                </label>
                <select
                  id={selectMonthId}
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setStoryPage(1);
                  }}
                  className="w-full bg-[#FAF7FC] border border-[#E6E6E6] rounded px-2.5 py-1.5 text-xs text-[#262B2E] font-medium focus:border-[#903E97] outline-none"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters */}
            {(storySearchQuery || selectedCategoryTag !== 'all' || selectedMonth !== 'all' || selectedSection !== 'All') && (
              <button
                id={resetBtnId}
                type="button"
                onClick={() => {
                  setStorySearchQuery('');
                  setSelectedCategoryTag('all');
                  setSelectedMonth('all');
                  onSelectSection('All');
                  setStoryPage(1);
                }}
                className="w-full py-1.5 text-[11px] font-bold text-[#903E97] bg-[#FAF7FC] hover:bg-[#F3E5F5] rounded border border-[#903E97]/25 transition-colors text-center cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-4 sm:py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ======================================================== */}
          {/* 1. LEFT SIDEBAR: FIND STORIES & Categories Menu (Desktop) */}
          {/* ======================================================== */}
          <aside id="section-left-sidebar" className="hidden lg:block w-full lg:w-56 xl:w-64 2xl:w-72 shrink-0 space-y-4">
            {/* Desktop Vertical Menu (Categories First as requested) */}
            <div id="section-desktop-categories" className="bg-white rounded border border-[#E6E6E6] shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-[#FAF7FC] border-b border-[#E6E6E6] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#903E97]">
                  Categories
                </span>
                <span className="w-2 h-2 rounded-full bg-[#0E8A54] animate-pulse" />
              </div>
              <ul className="divide-y divide-[#F2F2F2]">
                {navSections.map((sec) => {
                  const isActive = selectedSection === sec.value;
                  return (
                    <li key={sec.value}>
                      <button
                        id={`btn-desktop-category-${sec.value.toLowerCase().replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => {
                          onSelectSection(sec.value);
                          setStoryPage(1);
                          if (sec.value === 'IPO Watch') {
                            setActiveMarketTab('ipos');
                            setDeskExpanded(true);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold tracking-wide transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-[#903E97] text-white font-bold'
                            : 'text-[#262B2E] hover:bg-[#FAF7FC] hover:text-[#903E97]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {sec.value === 'IPO Watch' && <Rocket className="w-3.5 h-3.5" />}
                          {sec.value === 'Market News' && <Activity className="w-3.5 h-3.5" />}
                          {sec.label}
                        </span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Desktop FIND STORIES Box (Second as requested) */}
            {renderFindStoriesBox(false)}

            {/* Journal Subscription Promo */}
            <div id="section-journal-promo-left" className="p-4 bg-white rounded border border-[#E6E6E6] text-center shadow-2xs">
              <span className="text-[11px] font-bold text-[#262B2E] block mb-1">
                Hedge Ohari Print &amp; Digital
              </span>
              <p className="text-[10px] text-[#676A6C] mb-3 leading-normal">
                Malayalam Finance Journal for smart investors.
              </p>
              <button
                id="btn-subscribe-sidebar-left"
                type="button"
                onClick={onOpenSubscribe}
                className="w-full py-1.5 rounded bg-[#903E97] hover:bg-[#A045A8] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
              >
                Subscribe
              </button>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 2. CENTER FEED: Main Editorial Grid + Market Hub          */}
          {/* ======================================================== */}
          <main id="section-center-feed" className="flex-1 min-w-0 space-y-5">
            {/* ======================================================== */}
            {/* A. EXECUTIVE LIVE MARKET DESK (Movers, IPOs, Indices)     */}
            {/* ======================================================== */}
            <section id="section-market-pulse-desk" className="bg-white rounded border border-[#E6E6E6] shadow-2xs overflow-hidden transition-all duration-200">
              {/* Header Bar with Live Badge & View Selector */}
              <div id="section-market-pulse-header" className="p-3 sm:p-4 bg-[#FAF7FC] border-b border-[#E6E6E6] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0E8A54]/10 text-[#0E8A54] border border-[#0E8A54]/25 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54] animate-pulse" />
                    Market Pulse
                  </span>
                  <span className="text-xs font-bold text-[#262B2E] hidden sm:inline">
                    Live NSE &bull; BSE Terminal
                  </span>
                  {onRefreshLiveMarket && (
                    <button
                      id="btn-refresh-live-market"
                      type="button"
                      onClick={async () => {
                        setIsRefreshing(true);
                        await onRefreshLiveMarket();
                        setTimeout(() => setIsRefreshing(false), 800);
                      }}
                      title="Fetch latest live market exchange quotes"
                      className="p-1 rounded hover:bg-white text-[#676A6C] hover:text-[#903E97] transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#903E97]' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Desk Switcher Tabs */}
                <div id="nav-market-desk-tabs" className="flex items-center gap-1 bg-white p-1 rounded-md border border-[#E6E6E6]">
                  <button
                    id="tab-top-movers"
                    type="button"
                    onClick={() => {
                      setActiveMarketTab('movers');
                      setDeskExpanded(true);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      activeMarketTab === 'movers' && deskExpanded
                        ? 'bg-[#903E97] text-white shadow-xs'
                        : 'text-[#676A6C] hover:text-[#262B2E]'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-[#E65100]" />
                    <span>Top Movers</span>
                  </button>

                  <button
                    id="tab-upcoming-ipos"
                    type="button"
                    onClick={() => {
                      setActiveMarketTab('ipos');
                      setDeskExpanded(true);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      activeMarketTab === 'ipos' && deskExpanded
                        ? 'bg-[#903E97] text-white shadow-xs'
                        : 'text-[#676A6C] hover:text-[#262B2E]'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5 text-[#903E97]" />
                    <span>Upcoming IPOs</span>
                  </button>

                  <button
                    id="tab-live-indices"
                    type="button"
                    onClick={() => {
                      setActiveMarketTab('indices');
                      setDeskExpanded(true);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      activeMarketTab === 'indices' && deskExpanded
                        ? 'bg-[#903E97] text-white shadow-xs'
                        : 'text-[#676A6C] hover:text-[#262B2E]'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-[#0E8A54]" />
                    <span>Live Indices</span>
                  </button>
                </div>

                {/* Minimize / Expand Toggle */}
                <button
                  id="btn-toggle-market-desk"
                  type="button"
                  onClick={() => setDeskExpanded(!deskExpanded)}
                  className="text-xs font-semibold text-[#676A6C] hover:text-[#903E97] flex items-center gap-1 transition-colors"
                  title={deskExpanded ? 'Minimize Market Desk' : 'Expand Market Desk'}
                >
                  <span className="hidden md:inline">{deskExpanded ? 'Hide' : 'Show'}</span>
                  {deskExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Collapsible Content Area */}
              {deskExpanded && (
                <div id="panel-market-desk-body" className="p-4 sm:p-5">
                  {/* TAB 1: TOP MOVERS & TRENDING STOCKS */}
                  {activeMarketTab === 'movers' && (
                    <div id="panel-top-movers" className="space-y-3.5">
                      {/* Filter sub-strip */}
                      <div id="filters-top-movers" className="flex items-center justify-between pb-2.5 border-b border-[#F2F2F2] gap-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          <button
                            id="btn-movers-all"
                            type="button"
                            onClick={() => setMoversFilter('all')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors shrink-0 ${
                              moversFilter === 'all'
                                ? 'bg-[#262B2E] text-white'
                                : 'bg-[#F2F2F2] text-[#676A6C] hover:text-[#262B2E]'
                            }`}
                          >
                            All Movers ({effectiveTrending.length})
                          </button>
                          <button
                            id="btn-movers-gainers"
                            type="button"
                            onClick={() => setMoversFilter('gainers')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                              moversFilter === 'gainers'
                                ? 'bg-[#0E8A54] text-white'
                                : 'bg-[#E8F5EE] text-[#0E8A54] hover:bg-[#d5eee0]'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            Gainers
                          </button>
                          <button
                            id="btn-movers-losers"
                            type="button"
                            onClick={() => setMoversFilter('losers')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                              moversFilter === 'losers'
                                ? 'bg-[#D32F2F] text-white'
                                : 'bg-[#FDECEC] text-[#D32F2F] hover:bg-[#fad4d4]'
                            }`}
                          >
                            <TrendingDown className="w-3 h-3" />
                            Losers
                          </button>
                        </div>

                        {/* Mobile Next & Previous Carousel Navigation Controls */}
                        <div className="flex items-center gap-1 sm:hidden shrink-0">
                          <button
                            id="btn-movers-prev"
                            type="button"
                            onClick={() => scrollMovers('left')}
                            aria-label="Previous top movers"
                            className="p-1 rounded border border-[#E6E6E6] bg-white text-[#262B2E] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 active:scale-95 transition-all shadow-2xs"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id="btn-movers-next"
                            type="button"
                            onClick={() => scrollMovers('right')}
                            aria-label="Next top movers"
                            className="p-1 rounded border border-[#E6E6E6] bg-white text-[#262B2E] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 active:scale-95 transition-all shadow-2xs"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-[10px] text-[#878787] hidden sm:inline">
                          Prices update in real time
                        </span>
                      </div>

                      {/* Stock Cards Grid (Mobile swipeable carousel with snap & desktop responsive grid) */}
                      <div
                        id="grid-top-movers"
                        ref={moversScrollRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3 pb-1 sm:pb-0"
                      >
                        {filteredMovers.slice(0, 8).map((stock) => {
                          const isGainer = stock.trend_type === 'gainer';
                          const symbol = stock.ticker_id || stock.company_name;
                          const priceFormatted = String(stock.price).startsWith('₹')
                            ? stock.price
                            : `₹${stock.price}`;

                          return (
                            <div
                              key={stock.id}
                              id={`card-mover-${stock.id}`}
                              className="w-[145px] sm:w-auto shrink-0 snap-start sm:shrink p-2.5 sm:p-3 rounded-lg border border-[#E6E6E6] bg-gradient-to-b from-[#FAF7FC]/80 via-white to-white hover:bg-white hover:border-[#903E97]/40 hover:shadow-2xs transition-all duration-150 flex flex-col justify-between relative group overflow-hidden"
                            >
                              {/* Top accent line */}
                              <div
                                className={`absolute top-0 left-0 right-0 h-0.5 ${
                                  isGainer ? 'bg-[#0E8A54]' : 'bg-[#D32F2F]'
                                }`}
                              />

                              <div className="flex items-start justify-between gap-1 mb-1">
                                <div className="min-w-0 pr-1">
                                  <span className="font-extrabold text-[11px] sm:text-xs text-[#262B2E] tracking-tight block truncate">
                                    {symbol}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-[#676A6C] block truncate">
                                    {stock.company_name}
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tabular-nums shrink-0 ${
                                    isGainer
                                      ? 'bg-[#E8F5EE] text-[#0E8A54]'
                                      : 'bg-[#FDECEC] text-[#D32F2F]'
                                  }`}
                                >
                                  {isGainer ? (
                                    <TrendingUp className="w-2.5 h-2.5" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5" />
                                  )}
                                  {stock.percent_change}
                                </span>
                              </div>

                              <div className="pt-1.5 border-t border-[#F2F2F2] flex items-center justify-between mt-auto">
                                <span className="tabular-nums font-bold text-[11px] sm:text-xs text-[#262B2E]">
                                  {priceFormatted}
                                </span>

                                {onSearchSymbol && (
                                  <button
                                    type="button"
                                    onClick={() => onSearchSymbol(symbol)}
                                    title={`Filter news for ${symbol}`}
                                    className="p-1 rounded text-[#878787] hover:text-[#903E97] hover:bg-[#FAF7FC] transition-colors"
                                  >
                                    <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: UPCOMING & ACTIVE IPOS */}
                  {activeMarketTab === 'ipos' && (
                    <div id="panel-upcoming-ipos" className="space-y-3.5">
                      {/* Filter sub-strip */}
                      <div id="filters-upcoming-ipos" className="flex items-center justify-between pb-2.5 border-b border-[#F2F2F2]">
                        <div className="flex items-center gap-1.5">
                          <button
                            id="btn-ipos-all"
                            type="button"
                            onClick={() => setIpoFilter('all')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                              ipoFilter === 'all'
                                ? 'bg-[#903E97] text-white'
                                : 'bg-[#F2F2F2] text-[#676A6C] hover:text-[#262B2E]'
                            }`}
                          >
                            All IPOs ({ipos.length})
                          </button>
                          <button
                            id="btn-ipos-active"
                            type="button"
                            onClick={() => setIpoFilter('active')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 ${
                              ipoFilter === 'active'
                                ? 'bg-[#0E8A54] text-white'
                                : 'bg-[#E8F5EE] text-[#0E8A54] hover:bg-[#d5eee0]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54]" />
                            Open Now
                          </button>
                          <button
                            id="btn-ipos-upcoming"
                            type="button"
                            onClick={() => setIpoFilter('upcoming')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 ${
                              ipoFilter === 'upcoming'
                                ? 'bg-[#E65100] text-white'
                                : 'bg-[#FFF3E0] text-[#E65100] hover:bg-[#ffe6cc]'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            Upcoming Pipeline
                          </button>
                        </div>

                        <button
                          id="btn-ipos-explore-editorial"
                          type="button"
                          onClick={() => onSelectSection('IPO Watch')}
                          className="text-[11px] font-bold text-[#903E97] hover:underline flex items-center gap-0.5"
                        >
                          <span>Explore IPO Editorial</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* IPO Cards Grid */}
                      <div id="grid-upcoming-ipos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                        {filteredIpos.slice(0, 6).map((ipo) => {
                          const isOpen = ipo.status === 'active';
                          const isUpcoming = ipo.status === 'upcoming';
                          const priceDisplay =
                            ipo.min_price && ipo.max_price && ipo.min_price !== ipo.max_price
                              ? `₹${ipo.min_price} - ₹${ipo.max_price}`
                              : `₹${ipo.issue_price || ipo.max_price || 0}`;

                          return (
                            <div
                              key={ipo.id}
                              id={`card-ipo-${ipo.id}`}
                              className="p-3.5 rounded border border-[#E6E6E6] bg-white hover:border-[#903E97]/40 hover:shadow-2xs transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="font-extrabold text-xs text-[#262B2E]">
                                      {ipo.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-[#903E97]">
                                    {ipo.is_sme ? 'SME IPO' : 'Mainboard IPO'} &bull; {ipo.symbol}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                    isOpen
                                      ? 'bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30'
                                      : isUpcoming
                                      ? 'bg-[#FFF3E0] text-[#E65100] border border-[#E65100]/30'
                                      : 'bg-[#F2F2F2] text-[#676A6C]'
                                  }`}
                                >
                                  {isOpen ? 'Open Now' : isUpcoming ? 'Upcoming' : 'Listed'}
                                </span>
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-[#F2F2F2] text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-[#676A6C]">Price Band:</span>
                                  <span className="font-bold tabular-nums text-[#262B2E]">
                                    {priceDisplay}
                                  </span>
                                </div>
                                {ipo.lot_size && (
                                  <div className="flex justify-between">
                                    <span className="text-[#676A6C]">Lot Size:</span>
                                    <span className="font-semibold text-[#262B2E]">
                                      {ipo.lot_size} Shares
                                    </span>
                                  </div>
                                )}
                                {ipo.bidding_end_date && (
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-[#878787]">
                                      {isOpen ? 'Closes on:' : 'Bidding:'}
                                    </span>
                                    <span className="font-medium text-[#262B2E]">
                                      {ipo.bidding_end_date}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BENCHMARK INDICES */}
                  {activeMarketTab === 'indices' && (
                    <div id="panel-benchmark-indices" className="space-y-3">
                      <div id="grid-benchmark-indices" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                        {effectiveIndices.map((indexItem) => (
                          <div
                            key={indexItem.id}
                            id={`card-index-${indexItem.id}`}
                            className="p-3 rounded border border-[#E6E6E6] bg-[#FAF7FC]/50 hover:bg-white transition-all text-center"
                          >
                            <span className="font-bold text-[11px] text-[#262B2E] block mb-1">
                              {indexItem.symbol}
                            </span>
                            <span className="tabular-nums font-extrabold text-xs text-[#262B2E] block mb-1">
                              {indexItem.price}
                            </span>
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
                                indexItem.is_positive
                                  ? 'bg-[#E8F5EE] text-[#0E8A54]'
                                  : 'bg-[#FDECEC] text-[#D32F2F]'
                              }`}
                            >
                              {indexItem.is_positive ? (
                                <TrendingUp className="w-2.5 h-2.5" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5" />
                              )}
                              {indexItem.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ======================================================== */}
            {/* MOBILE ONLY (lg:hidden): Find Stories (minimised) + Categories */}
            {/* ======================================================== */}
            <div className="lg:hidden space-y-4">
              {/* Find Stories Box - Minimised by default on mobile */}
              {renderFindStoriesBox(true)}

              {/* Mobile / Tablet Horizontal Category Scroller */}
              <div id="section-mobile-categories" className="bg-white rounded border border-[#E6E6E6] p-2 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {navSections.map((sec) => {
                    const isActive = selectedSection === sec.value;
                    return (
                      <button
                        id={`btn-mobile-category-${sec.value.toLowerCase().replace(/\s+/g, '-')}`}
                        key={sec.value}
                        type="button"
                        onClick={() => {
                          onSelectSection(sec.value);
                          setStoryPage(1);
                          if (sec.value === 'IPO Watch') {
                            setActiveMarketTab('ipos');
                            setDeskExpanded(true);
                          }
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-[#903E97] text-white shadow-xs'
                            : 'bg-[#FAF7FC] text-[#262B2E] hover:bg-[#F2F2F2]'
                        }`}
                      >
                        {sec.value === 'IPO Watch' && <Rocket className="w-3.5 h-3.5" />}
                        {sec.value === 'Market News' && <Activity className="w-3.5 h-3.5" />}
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* B. MAIN EDITORIAL FEED GRID                               */}
            {/* ======================================================== */}
            {/* Active FIND STORIES Filter Tag Banner */}
            {(storySearchQuery || selectedCategoryTag !== 'all' || selectedMonth !== 'all') && (
              <div id="section-active-filters-banner" className="flex items-center justify-between p-2.5 px-3 bg-[#FAF7FC] border border-[#903E97]/25 rounded text-xs text-[#262B2E]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#903E97] uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    FIND STORIES Filter:
                  </span>
                  {storySearchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E6E6E6] text-[11px] font-medium">
                      Keyword: &ldquo;{storySearchQuery}&rdquo;
                    </span>
                  )}
                  {selectedCategoryTag !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E6E6E6] text-[11px] font-medium">
                      Category: {selectedCategoryTag}
                    </span>
                  )}
                  {selectedMonth !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#E6E6E6] text-[11px] font-medium">
                      Month: {availableMonths.find(([k]) => k === selectedMonth)?.[1] || selectedMonth}
                    </span>
                  )}
                  <span className="text-[#878787] text-[11px]">
                    ({displayedStories.length} {displayedStories.length === 1 ? 'story' : 'stories'})
                  </span>
                </div>
                <button
                  id="btn-clear-active-filters"
                  type="button"
                  onClick={() => {
                    setStorySearchQuery('');
                    setSelectedCategoryTag('all');
                    setSelectedMonth('all');
                  }}
                  className="text-[11px] font-bold text-[#903E97] hover:underline shrink-0"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Active Bookmarks Filter Banner */}
            {showOnlyBookmarks && (
              <div id="section-bookmarks-banner" className="flex items-center justify-between p-2.5 px-3 bg-[#FAF7FC] border border-[#903E97]/30 rounded text-xs text-[#262B2E] mb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 fill-current text-[#903E97]" />
                  <span className="font-bold text-[#903E97]">
                    Showing Saved Bookmarks ({displayedStories.length})
                  </span>
                </div>
                {onToggleShowBookmarks && (
                  <button
                    id="btn-clear-bookmarks-banner"
                    type="button"
                    onClick={() => onToggleShowBookmarks(false)}
                    className="text-[11px] font-bold text-[#903E97] hover:underline cursor-pointer"
                  >
                    View All Stories
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div id="section-stories-loading" className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-[#E6E6E6] p-5 animate-pulse space-y-3"
                  >
                    <div className="h-64 bg-[#E6E6E6] rounded" />
                    <div className="h-6 bg-[#E6E6E6] rounded w-3/4" />
                    <div className="h-4 bg-[#E6E6E6] rounded w-full" />
                  </div>
                ))}
              </div>
            ) : showOnlyBookmarks && displayedStories.length === 0 ? (
              <div id="section-stories-empty-bookmarks" className="bg-white rounded border border-[#E6E6E6] p-12 text-center text-[#676A6C] space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7FC] flex items-center justify-center text-[#903E97]">
                  <Bookmark className="w-6 h-6 text-[#903E97]/60" />
                </div>
                <p className="text-sm font-bold text-[#262B2E]">No saved bookmarks yet</p>
                <p className="text-xs text-[#676A6C]">Click the bookmark icon on any story card to save it for reading later.</p>
                {onToggleShowBookmarks && (
                  <button
                    id="btn-explore-after-empty-bookmarks"
                    type="button"
                    onClick={() => onToggleShowBookmarks(false)}
                    className="px-4 py-2 rounded bg-[#903E97] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Explore Stories
                  </button>
                )}
              </div>
            ) : stories.length === 0 ? (
              <div id="section-stories-empty-category" className="bg-white rounded border border-[#E6E6E6] p-12 text-center text-[#676A6C] space-y-3">
                <p className="text-sm font-semibold">No stories available in this category.</p>
                <button
                  id="btn-view-all-stories"
                  type="button"
                  onClick={() => onSelectSection('All')}
                  className="px-4 py-2 rounded bg-[#903E97] text-white text-xs font-bold"
                >
                  View All Stories
                </button>
              </div>
            ) : displayedStories.length === 0 ? (
              <div id="section-stories-empty-filter" className="bg-white rounded border border-[#E6E6E6] p-12 text-center text-[#676A6C] space-y-3">
                <p className="text-sm font-semibold">No stories match your active filter criteria.</p>
                <button
                  id="btn-clear-empty-filter"
                  type="button"
                  onClick={() => {
                    setStorySearchQuery('');
                    setSelectedCategoryTag('all');
                    setSelectedMonth('all');
                  }}
                  className="px-4 py-2 rounded bg-[#903E97] text-white text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div id="section-stories-grid" className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
                {paginatedStories.map((story, index) => {
                  const isHero = index === 0 && validStoryPage === 1;
                  const isSaved = effectiveBookmarkedIds.has(story.id);
                  const isCopied = copiedId === story.id;
                  const timeAgo = formatTimeAgo(story.published_at || story.created_at);
                  const excerpt = getExcerpt(story.short_description || story.full_story);

                  return (
                    <article
                      key={story.id}
                      id={`story-card-${story.id}`}
                      onClick={() => onSelectStory(story.canonical_url)}
                      className={`bg-white rounded border border-[#E6E6E6] shadow-2xs hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between ${
                        isHero ? 'xl:col-span-2' : ''
                      }`}
                    >
                      {/* Story Card Image (.grid-image) */}
                      {story.lead_image_url && (
                        <div
                          className={`w-full overflow-hidden bg-[#F2F2F2] relative ${
                            isHero ? 'h-56 sm:h-72 md:h-80 xl:h-96' : 'h-48 sm:h-56'
                          }`}
                        >
                          <img
                            src={story.lead_image_url}
                            alt={story.heading}
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#903E97] text-white shadow-xs">
                              {story.section}
                            </span>
                            {story.category && (
                              <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-white/95 text-[#262B2E] shadow-xs">
                                {story.category}
                              </span>
                            )}
                            {isHero && (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#262B2E] text-white shadow-xs hidden sm:inline-block">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Story Details (.grid-description) */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Heading (.grid-description-content h5) */}
                          <h2
                            id={`story-heading-${story.id}`}
                            className={`font-['Noto_Sans_Malayalam',_'Open_Sans',_sans-serif] font-bold text-[#262B2E] group-hover:text-[#903E97] transition-colors leading-[1.6] mb-2.5 ${
                              isHero
                                ? 'text-lg sm:text-[21px] xl:text-[23px]'
                                : 'text-base sm:text-lg'
                            }`}
                          >
                            {story.heading}
                          </h2>

                          {/* Excerpt */}
                          <p
                            className={`text-xs text-[#676A6C] leading-relaxed line-clamp-3 mb-4 ${
                              isHero ? 'sm:text-[14px]' : 'sm:text-[13px]'
                            }`}
                          >
                            {excerpt}
                          </p>
                        </div>

                        {/* Card Footer (.grid-description-footer) */}
                        <div className="pt-3 border-t border-[#F2F2F2] flex items-center justify-between text-xs text-[#878787]">
                          <span className="flex items-center gap-1 text-[11px] font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#903E97]" />
                            <span>{timeAgo}</span>
                          </span>

                          <div className="flex items-center gap-3">
                            {/* Share button */}
                            <button
                              id={`btn-share-story-${story.id}`}
                              type="button"
                              onClick={(e) => handleShare(story, e)}
                              className="p-1.5 hover:text-[#903E97] transition-colors"
                              title="Share"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-[#0E8A54]" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Bookmark button */}
                            <button
                              id={`btn-bookmark-story-${story.id}`}
                              type="button"
                              onClick={(e) => toggleBookmark(story.id, e)}
                              className="p-1.5 hover:text-[#903E97] transition-colors"
                              title="Bookmark"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isSaved ? 'fill-current text-[#903E97]' : ''}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Stories Pagination Bar */}
              {displayedStories.length > storiesPerPage && (
                <div
                  id="section-stories-pagination"
                  className="mt-6 p-4 bg-white rounded border border-[#E6E6E6] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#676A6C]"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      Showing <strong>{storyStartIndex + 1}</strong>–<strong>{Math.min(storyStartIndex + storiesPerPage, displayedStories.length)}</strong> of <strong>{displayedStories.length}</strong> stories
                    </span>
                    <span className="text-[#E6E6E6] hidden sm:inline">|</span>
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      <span>Per page:</span>
                      <select
                        value={storiesPerPage}
                        onChange={(e) => {
                          setStoriesPerPage(Number(e.target.value));
                          setStoryPage(1);
                        }}
                        className="px-2 py-1 rounded border border-[#E6E6E6] bg-white text-xs font-semibold text-[#262B2E] focus:outline-none focus:ring-1 focus:ring-[#903E97]"
                      >
                        <option value={6}>6</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>

                  {/* Page Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      id="btn-story-prev-page"
                      onClick={() => handleStoryPageChange(validStoryPage - 1)}
                      disabled={validStoryPage <= 1}
                      className="px-3 py-1.5 rounded border border-[#E6E6E6] bg-white text-[#262B2E] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E6E6E6] transition-all flex items-center gap-1 font-semibold"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalStoryPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalStoryPages <= 7) return true;
                          if (p === 1 || p === totalStoryPages) return true;
                          return Math.abs(p - validStoryPage) <= 1;
                        })
                        .reduce((acc, p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) {
                            acc.push('...');
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) => {
                          if (item === '...') {
                            return (
                              <span key={`story-ellipsis-${idx}`} className="px-2 text-xs text-[#878787]">
                                ...
                              </span>
                            );
                          }
                          const p = item;
                          const isActive = p === validStoryPage;
                          return (
                            <button
                              key={p}
                              type="button"
                              id={`btn-story-page-${p}`}
                              onClick={() => handleStoryPageChange(p)}
                              className={`min-w-8 h-8 px-2 rounded text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-[#903E97] text-white shadow-xs'
                                  : 'bg-white border border-[#E6E6E6] text-[#262B2E] hover:bg-[#FAF7FC] hover:border-[#903E97]/40'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      id="btn-story-next-page"
                      onClick={() => handleStoryPageChange(validStoryPage + 1)}
                      disabled={validStoryPage >= totalStoryPages}
                      className="px-3 py-1.5 rounded border border-[#E6E6E6] bg-white text-[#262B2E] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E6E6E6] transition-all flex items-center gap-1 font-semibold"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </main>

          {/* ======================================================== */}
          {/* 3. RIGHT SIDEBAR: Subscription & Fast Market Snapshot    */}
          {/* ======================================================== */}
          <aside id="section-right-sidebar" className="w-full lg:w-72 xl:w-80 2xl:w-96 shrink-0 space-y-4">
            {/* Journal Promo Card */}
            <div id="section-journal-subscription-right" className="bg-white rounded border border-[#E6E6E6] p-5 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7FC] border border-[#903E97]/20 flex items-center justify-center text-[#903E97] font-extrabold text-sm">
                ഓഹരി
              </div>
              <div>
                <h3 className="font-['Open_Sans'] font-extrabold text-base text-[#262B2E]">
                  Hedge Ohari
                </h3>
                <p className="text-xs text-[#903E97] font-semibold mt-0.5">
                  Malayalam Financial Journal
                </p>
              </div>
              <p className="text-xs text-[#676A6C] leading-normal">
                Comprehensive knowledge and guidance about Financial Planning and Wealth Creation.
              </p>
              <button
                id="btn-subscribe-sidebar-right"
                type="button"
                onClick={onOpenSubscribe}
                className="w-full py-2.5 rounded bg-[#903E97] hover:bg-[#A045A8] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Subscribe Now
              </button>

              {/* Fast Market Glance Mini-Widget */}
              <div id="section-market-radar-today" className="pt-3 border-t border-[#E6E6E6] text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#903E97] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54] animate-pulse" />
                    Market Radar Today
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#0E8A54]/10 text-[#0E8A54]">
                    Live
                  </span>
                </div>

                {/* Primary Benchmark Index */}
                {mainIndex && (
                  <div id="radar-main-index" className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#FAF7FC] border border-[#E6E6E6]">
                    <div>
                      <span className="font-extrabold text-[#262B2E] text-[11px] block">
                        {mainIndex.symbol}
                      </span>
                      <span className="text-[10px] text-[#676A6C] font-semibold tabular-nums">
                        {mainIndex.price}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-black tabular-nums flex items-center gap-0.5 ${
                        mainIndex.is_positive ? 'text-[#0E8A54]' : 'text-[#D32F2F]'
                      }`}
                    >
                      {mainIndex.is_positive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {mainIndex.change}
                    </span>
                  </div>
                )}

                {/* Top Gainer */}
                {topGainer && (
                  <div id="radar-top-gainer" className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#E8F5EE]/70 border border-[#0E8A54]/15">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#262B2E] text-[11px]">
                          {topGainer.ticker_id || topGainer.company_name}
                        </span>
                        <span className="text-[9px] font-bold px-1 rounded bg-[#0E8A54]/15 text-[#0E8A54]">
                          Gainer
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#58606E] tabular-nums">
                        {String(topGainer.price).startsWith('₹') ? topGainer.price : `₹${topGainer.price}`}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-[#0E8A54] tabular-nums">
                      {topGainer.percent_change}
                    </span>
                  </div>
                )}

                {/* Top Loser */}
                {topLoser && (
                  <div id="radar-top-loser" className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#FDECEC]/70 border border-[#D32F2F]/15">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#262B2E] text-[11px]">
                          {topLoser.ticker_id || topLoser.company_name}
                        </span>
                        <span className="text-[9px] font-bold px-1 rounded bg-[#D32F2F]/15 text-[#D32F2F]">
                          Loser
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#58606E] tabular-nums">
                        {String(topLoser.price).startsWith('₹') ? topLoser.price : `₹${topLoser.price}`}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-[#D32F2F] tabular-nums">
                      {topLoser.percent_change}
                    </span>
                  </div>
                )}

                {/* Featured IPO */}
                {featuredIpo && (
                  <div id="radar-featured-ipo" className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#FAF7FC] border border-[#903E97]/20">
                    <div className="min-w-0 pr-1">
                      <span className="font-bold text-[#262B2E] text-[11px] block truncate">
                        {featuredIpo.name}
                      </span>
                      <span className="text-[9px] font-bold text-[#903E97] block">
                        {featuredIpo.status === 'active' ? '● Open Now' : '● Upcoming'} &bull; {featuredIpo.is_sme ? 'SME' : 'Mainboard'}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#262B2E] tabular-nums shrink-0">
                      ₹{featuredIpo.issue_price || featuredIpo.max_price || 0}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E6E6E6] text-[11px] text-[#878787]">
                <span>Inquiries: </span>
                <a
                  href="mailto:ohari@hedgeequities.com"
                  className="text-[#903E97] hover:underline font-semibold"
                >
                  ohari@hedgeequities.com
                </a>
              </div>
            </div>

            {/* Visit Hedge at Card (Exact Hedge Ohari Pattern) */}
            <div id="section-visit-hedge-at" className="bg-white rounded border border-[#E6E6E6] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F2F2F2]">
                <h4 className="font-['Open_Sans'] font-extrabold text-xs text-[#262B2E] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#903E97]" />
                  <span>Visit Hedge at</span>
                </h4>
                <span className="text-[10px] text-[#878787] font-semibold">Official Channels</span>
              </div>

              <ul id="list-visit-hedge-channels" className="space-y-1.5 text-xs">
                <li>
                  <a
                    id="link-hedge-website"
                    href="https://hedgeequities.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#903E97] transition-colors border border-transparent hover:border-[#903E97]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-[#903E97]" />
                      <span>hedgeequities.com</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#903E97]" />
                  </a>
                </li>
                <li>
                  <a
                    id="link-hedge-youtube"
                    href="https://www.youtube.com/@hedgeequitiesltd"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#E62117] transition-colors border border-transparent hover:border-[#E62117]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Youtube className="w-3.5 h-3.5 text-[#E62117]" />
                      <span>Youtube</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#E62117]" />
                  </a>
                </li>
                <li>
                  <a
                    id="link-hedge-facebook"
                    href="https://www.facebook.com/hedgeequities/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#1877F2] transition-colors border border-transparent hover:border-[#1877F2]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>Facebook</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#1877F2]" />
                  </a>
                </li>
                <li>
                  <a
                    id="link-hedge-twitter"
                    href="https://twitter.com/hedge_equities"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#1D9BF0] transition-colors border border-transparent hover:border-[#1D9BF0]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Twitter className="w-3.5 h-3.5 text-[#1D9BF0]" />
                      <span>Twitter</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#1D9BF0]" />
                  </a>
                </li>
                <li>
                  <a
                    id="link-hedge-instagram"
                    href="https://www.instagram.com/hedgeequities/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#E1306C] transition-colors border border-transparent hover:border-[#E1306C]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      <span>Instagram</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#E1306C]" />
                  </a>
                </li>
                <li>
                  <a
                    id="link-hedge-linkedin"
                    href="https://www.linkedin.com/company/hedge-equities/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded hover:bg-[#FAF7FC] text-[#262B2E] hover:text-[#0A66C2] transition-colors border border-transparent hover:border-[#0A66C2]/20 group"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[11px]">
                      <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#878787] group-hover:text-[#0A66C2]" />
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

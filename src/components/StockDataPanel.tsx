import React, { useState, useEffect } from 'react';
import {
  TrendingStockItem,
  IpoItemRecord,
  NewsItemRecord,
  Story,
} from '../types/story';
import {
  executeUnifiedMarketSync,
  fetchTrendingStocks,
  fetchIpos,
  fetchSavedStockData,
  saveNewsItemToDatabase,
  fetchSavedNews,
  UnifiedMarketSyncResults,
} from '../lib/marketData';
import { formatTimeAgo } from '../lib/timeAgo';
import {
  TrendingUp,
  Newspaper,
  Calendar,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  BookmarkPlus,
  Check,
  Bookmark,
} from 'lucide-react';

interface StockDataPanelProps {
  onNotify?: (msg: { type: 'success' | 'error'; text: string }) => void;
  onRefreshAllData?: () => Promise<void>;
  onEditStory?: (story: Story) => void;
}

export const StockDataPanel: React.FC<StockDataPanelProps> = ({
  onNotify,
  onRefreshAllData,
  onEditStory,
}) => {
  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<UnifiedMarketSyncResults | null>(null);

  // Active view tab after fetch (Market News Wire is default)
  const [activeTab, setActiveTab] = useState<'news' | 'trending' | 'ipo'>('news');
  // Language filter for News Wire (Malayalam is primary and default)
  const [newsLanguage, setNewsLanguage] = useState<'malayalam' | 'all' | 'english'>('malayalam');
  // Pagination state for News Wire
  const [newsPage, setNewsPage] = useState<number>(1);
  const [newsPerPage, setNewsPerPage] = useState<number>(10);

  // Loaded database state
  const [trendingStocks, setTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [ipos, setIpos] = useState<IpoItemRecord[]>([]);
  const [savedNewsList, setSavedNewsList] = useState<NewsItemRecord[]>([]);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter for IPO sub-tab (strictly live/active and upcoming issues only)
  const [ipoFilter, setIpoFilter] = useState<'all' | 'active' | 'upcoming'>('all');

  const refreshPanelData = async () => {
    setLoading(true);
    try {
      const [trendList, ipoList, newsList] = await Promise.all([
        fetchTrendingStocks(false),
        fetchIpos(false),
        fetchSavedNews(),
      ]);
      setTrendingStocks(trendList);
      setIpos(ipoList);
      setSavedNewsList(newsList);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refreshPanelData();
  }, []);

  // 1-Click Unified Action (Free Yahoo Finance & News Engine)
  const handleSingleClickFetch = async () => {
    setSyncing(true);
    const res = await executeUnifiedMarketSync('RELIANCE');
    setSyncing(false);
    setLastSyncResult(res);

    if (res.success) {
      onNotify?.({
        type: 'success',
        text: `Fetched ${res.news.count} live market news items, ${res.trending.count} trending movers, and ${res.ipo.count} IPOs! You can now manually save news items to the 'news' table.`,
      });
      await refreshPanelData();
      if (onRefreshAllData) {
        await onRefreshAllData();
      }
    } else {
      onNotify?.({
        type: 'error',
        text: res.error || 'Failed to fetch market data.',
      });
    }
  };

  const handleSaveNews = async (item: NewsItemRecord) => {
    setSavingNewsId(item.id);
    const result = await saveNewsItemToDatabase(item);
    setSavingNewsId(null);
    if (result.success) {
      onNotify?.({
        type: 'success',
        text: `"${item.title.slice(0, 40)}..." saved to 'news' table! It is now available in Create New Story dropdown.`,
      });
      await refreshPanelData();
    } else {
      onNotify?.({
        type: 'error',
        text: result.error || 'Failed to save news.',
      });
    }
  };

  // Strictly Live (active) and Upcoming IPOs; exclude listed stocks
  const liveAndUpcomingIpos = ipos.filter(
    (item) => item.status === 'active' || item.status === 'upcoming'
  );
  const filteredIpos =
    ipoFilter === 'all'
      ? liveAndUpcomingIpos
      : liveAndUpcomingIpos.filter((item) => item.status === ipoFilter);

  return (
    <div className="space-y-6">
      {/* 1. Header with One-Click Fetch & Unlimited Free Status */}
      <div className="bg-white rounded-lg border border-[#E2E4E8] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E2E4E8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Open_Sans'] font-extrabold text-2xl text-[#1E2229]">
                Live Market Data Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#0E8A54]" />
                <span>Unlimited Free Engine</span>
              </span>
            </div>
            <p className="text-xs text-[#58606E]">
              Captures live market data in a single click: Review all real-time news with full images &amp; content, then manually save to <code className="text-xs font-mono">public.news</code> for story drafting.
            </p>
          </div>

          {/* Engine Status Badge */}
          <div className="bg-[#FAF7FC] border border-[#DA9CFF]/40 rounded-lg p-3 shrink-0 min-w-[260px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#1E2229] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#6A1B9A]" />
                <span>Data Quota Status</span>
              </span>
              <span className="font-bold text-[#0E8A54] text-xs">
                100% Free / Unlimited
              </span>
            </div>
            <p className="text-[11px] text-[#58606E]">
              Zero API rate limits or monthly request caps. Free Yahoo Finance &amp; Financial Wire integration active.
            </p>
          </div>
        </div>

        {/* 1-Click Action Bar */}
        <div className="pt-4 flex items-center justify-end">
          <button
            id="btn-fetch-unified-data"
            type="button"
            onClick={handleSingleClickFetch}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching All Market Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Fetch Data on Click</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. POST-FETCH 4 TABS NAVIGATION */}
      <div className="bg-white rounded-lg border border-[#E2E4E8] overflow-hidden shadow-xs">
        <div className="border-b border-[#E2E4E8] bg-[#FAF7FC]/50 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* TAB 1: Market News Wire FIRST */}
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'news'
                ? 'border-[#6A1B9A] text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Newspaper className="w-4 h-4 text-[#6A1B9A]" />
            <span>Market News Wire</span>
            {lastSyncResult?.news.items?.length ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 font-bold">
                {lastSyncResult.news.items.length} Fetched
              </span>
            ) : null}
          </button>

          {/* TAB 2: Trending Stocks SECOND */}
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'trending'
                ? 'border-[#6A1B9A] text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Flame className="w-4 h-4 text-[#D32F2F]" />
            <span>Trending Stocks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white border border-[#E2E4E8] font-mono">
              {trendingStocks.length}
            </span>
          </button>

          {/* TAB 3: IPOs THIRD */}
          <button
            type="button"
            onClick={() => setActiveTab('ipo')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ipo'
                ? 'border-[#6A1B9A] text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#0E8A54]" />
            <span>IPOs (Section: IPO Watch)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white border border-[#E2E4E8] font-mono">
              {liveAndUpcomingIpos.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENT: 1. TRENDING STOCKS */}
        {activeTab === 'trending' && (
          <div id="section-trending-container" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#D32F2F]" />
                  <span>Market Movers (Gainers &amp; Losers)</span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Saved in <code className="text-xs font-mono">public.trending_stocks</code> • Refreshed via Live Yahoo Finance • Status: Published
                </p>
              </div>
              <span className="text-xs text-[#8A92A0]">
                Total: <strong>{trendingStocks.length}</strong> items
              </span>
            </div>

            {trendingStocks.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No trending stocks loaded. Click <strong>&quot;Fetch Data on Click&quot;</strong> above to pull live market movers.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gainers Column */}
                <div className="border border-[#E2E4E8] rounded-lg p-4 bg-white">
                  <h4 className="font-bold text-xs text-[#0E8A54] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Gainers ({trendingStocks.filter((s) => s.trend_type === 'gainer').length})</span>
                  </h4>
                  <div className="space-y-2">
                    {trendingStocks
                      .filter((s) => s.trend_type === 'gainer')
                      .slice(0, 10)
                      .map((stock) => (
                        <div
                          key={stock.id}
                          className="flex items-center justify-between p-2 rounded bg-[#F4F4F6] hover:bg-[#E8F5EE]/40 text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-[#1E2229] block">{stock.ticker_id}</span>
                            <span className="text-[11px] text-[#58606E] truncate max-w-[180px] block">
                              {stock.company_name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-mono text-[#1E2229] block">{stock.price}</span>
                            <span className="text-[#0E8A54] font-bold font-mono text-[11px]">
                              {stock.percent_change}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Losers Column */}
                <div className="border border-[#E2E4E8] rounded-lg p-4 bg-white">
                  <h4 className="font-bold text-xs text-[#D32F2F] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 rotate-180" />
                    <span>Top Losers ({trendingStocks.filter((s) => s.trend_type === 'loser').length})</span>
                  </h4>
                  <div className="space-y-2">
                    {trendingStocks
                      .filter((s) => s.trend_type === 'loser')
                      .slice(0, 10)
                      .map((stock) => (
                        <div
                          key={stock.id}
                          className="flex items-center justify-between p-2 rounded bg-[#F4F4F6] hover:bg-[#FDECEC]/40 text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-[#1E2229] block">{stock.ticker_id}</span>
                            <span className="text-[11px] text-[#58606E] truncate max-w-[180px] block">
                              {stock.company_name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-mono text-[#1E2229] block">{stock.price}</span>
                            <span className="text-[#D32F2F] font-bold font-mono text-[11px]">
                              {stock.percent_change}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 2. MARKET NEWS */}
        {activeTab === 'news' && (() => {
          const allFetchedNews = lastSyncResult?.news.items || [];
          const malayalamCount = allFetchedNews.filter(
            (i) => i.language === 'malayalam' || /[\u0D00-\u0D7F]/.test(i.title)
          ).length;
          const englishCount = allFetchedNews.filter(
            (i) => i.language === 'english' || !/[\u0D00-\u0D7F]/.test(i.title)
          ).length;

          const displayedNews = allFetchedNews.filter((item) => {
            const isMl = item.language === 'malayalam' || /[\u0D00-\u0D7F]/.test(item.title);
            if (newsLanguage === 'malayalam') return isMl;
            if (newsLanguage === 'english') return !isMl;
            return true;
          });

          const totalNewsPages = Math.max(1, Math.ceil(displayedNews.length / newsPerPage));
          const validNewsPage = Math.min(newsPage, totalNewsPages);
          const startIndex = (validNewsPage - 1) * newsPerPage;
          const paginatedNews = displayedNews.slice(startIndex, startIndex + newsPerPage);

          const handleNewsPageChange = (newPage: number) => {
            const p = Math.max(1, Math.min(newPage, totalNewsPages));
            setNewsPage(p);
            const container = document.getElementById('section-news-container');
            if (container) {
              container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };

          return (
            <div id="section-news-container" className="p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-[#E2E4E8]">
                <div>
                  <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4 text-[#6A1B9A]" />
                    <span>Real-Time Market News Feed</span>
                  </h3>
                  <p className="text-xs text-[#58606E]">
                    Malayalam financial news is primary &amp; default. Toggle to English or All as needed. Click <strong>&quot;Save to News Table&quot;</strong> to draft stories.
                  </p>
                </div>

                {/* Language Switcher Filter: Malayalam first, English second, All at the end */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded-md border border-[#E2E4E8]">
                    <button
                      type="button"
                      onClick={() => {
                        setNewsLanguage('malayalam');
                        setNewsPage(1);
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        newsLanguage === 'malayalam'
                          ? 'bg-[#6A1B9A] text-white shadow-xs'
                          : 'text-[#58606E] hover:text-[#1E2229]'
                      }`}
                    >
                      <span>മലയാളം</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        newsLanguage === 'malayalam' ? 'bg-white/20 text-white' : 'bg-white text-[#6A1B9A]'
                      }`}>
                        {malayalamCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewsLanguage('english');
                        setNewsPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        newsLanguage === 'english'
                          ? 'bg-[#6A1B9A] text-white shadow-xs'
                          : 'text-[#58606E] hover:text-[#1E2229]'
                      }`}
                    >
                      <span>English</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        newsLanguage === 'english' ? 'bg-white/20 text-white' : 'bg-white text-[#58606E]'
                      }`}>
                        {englishCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewsLanguage('all');
                        setNewsPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        newsLanguage === 'all'
                          ? 'bg-[#6A1B9A] text-white shadow-xs'
                          : 'text-[#58606E] hover:text-[#1E2229]'
                      }`}
                    >
                      <span>All</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        newsLanguage === 'all' ? 'bg-white/20 text-white' : 'bg-white text-[#58606E]'
                      }`}>
                        {allFetchedNews.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* List of News Items from Latest Fetch */}
              {displayedNews.length > 0 ? (
                <div className="space-y-3">
                  {paginatedNews.map((item: NewsItemRecord) => {
                    const isSaved = savedNewsList.some((s) => s.title.toLowerCase() === item.title.toLowerCase());
                    const isSavingThis = savingNewsId === item.id;
                    const isMl = item.language === 'malayalam' || /[\u0D00-\u0D7F]/.test(item.title);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg border border-[#E2E4E8] bg-white hover:border-[#6A1B9A]/40 transition-all shadow-2xs flex flex-col sm:flex-row items-start gap-4"
                      >
                        {/* Image Thumbnail */}
                        <div className="w-full sm:w-44 h-28 shrink-0 rounded overflow-hidden bg-[#F4F4F6] border border-[#E2E4E8] relative">
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&h=320&q=80';
                            }}
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white backdrop-blur-xs">
                            {item.source}
                          </span>
                        </div>

                        {/* Content details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMl
                                  ? 'bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30'
                                  : 'bg-[#F4F4F6] text-[#58606E] border border-[#E2E4E8]'
                              }`}>
                                {isMl ? 'മലയാളം' : 'English'} &bull; {item.source}
                              </span>
                              <span className="text-[11px] text-[#8A92A0]">
                                {formatTimeAgo(item.pub_date)}
                              </span>
                              {isSaved && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Saved in news table</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-['Noto_Sans_Malayalam',_'Open_Sans',_sans-serif] font-bold text-sm text-[#1E2229] leading-snug">
                              {item.title}
                            </h4>
                            <p className="font-['Noto_Sans_Malayalam',_'Open_Sans',_sans-serif] text-xs text-[#58606E] mt-1.5 line-clamp-3 leading-relaxed">
                              {item.summary}
                            </p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F0F1F3]">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6A1B9A] hover:underline"
                              >
                                <span>Original Article</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : <span />}

                          <button
                            type="button"
                            onClick={() => handleSaveNews(item)}
                            disabled={isSavingThis || isSaved}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                              isSaved
                                ? 'bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 cursor-default'
                                : 'bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white shadow-xs'
                            }`}
                          >
                            {isSavingThis ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving to DB...</span>
                              </>
                            ) : isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Saved in News Table</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3.5 h-3.5" />
                                <span>Save to News Table</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Section News Pagination Bar */}
                {displayedNews.length > newsPerPage && (
                  <div
                    id="section-news-pagination"
                    className="pt-4 border-t border-[#E2E4E8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#58606E]"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        Showing <strong>{startIndex + 1}</strong>–<strong>{Math.min(startIndex + newsPerPage, displayedNews.length)}</strong> of <strong>{displayedNews.length}</strong> dispatches
                      </span>
                      <span className="text-[#E2E4E8] hidden sm:inline">|</span>
                      <div className="flex items-center gap-1.5 hidden sm:flex">
                        <span>Per page:</span>
                        <select
                          value={newsPerPage}
                          onChange={(e) => {
                            setNewsPerPage(Number(e.target.value));
                            setNewsPage(1);
                          }}
                          className="px-2 py-1 rounded border border-[#E2E4E8] bg-white text-xs font-semibold text-[#1E2229] focus:outline-none focus:ring-1 focus:ring-[#6A1B9A]"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={40}>40</option>
                        </select>
                      </div>
                    </div>

                    {/* Page Navigation Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id="btn-news-prev-page"
                        onClick={() => handleNewsPageChange(validNewsPage - 1)}
                        disabled={validNewsPage <= 1}
                        className="px-2.5 py-1.5 rounded border border-[#E2E4E8] bg-white text-[#1E2229] hover:bg-[#FAF7FC] hover:border-[#6A1B9A]/30 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E2E4E8] transition-all flex items-center gap-1 font-semibold"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      {/* Numeric Page Buttons */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalNewsPages }, (_, i) => i + 1)
                          .filter((p) => {
                            if (totalNewsPages <= 7) return true;
                            if (p === 1 || p === totalNewsPages) return true;
                            return Math.abs(p - validNewsPage) <= 1;
                          })
                          .reduce<(number | string)[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) {
                              acc.push('...');
                            }
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item, idx) => {
                            if (item === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#8A92A0]">
                                  ...
                                </span>
                              );
                            }
                            const p = item as number;
                            const isActive = p === validNewsPage;
                            return (
                              <button
                                key={p}
                                type="button"
                                id={`btn-news-page-${p}`}
                                onClick={() => handleNewsPageChange(p)}
                                className={`min-w-8 h-8 px-2 rounded text-xs font-bold transition-all ${
                                  isActive
                                    ? 'bg-[#6A1B9A] text-white shadow-xs'
                                    : 'bg-white border border-[#E2E4E8] text-[#58606E] hover:text-[#1E2229] hover:border-[#6A1B9A]/30'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                      </div>

                      <button
                        type="button"
                        id="btn-news-next-page"
                        onClick={() => handleNewsPageChange(validNewsPage + 1)}
                        disabled={validNewsPage >= totalNewsPages}
                        className="px-2.5 py-1.5 rounded border border-[#E2E4E8] bg-white text-[#1E2229] hover:bg-[#FAF7FC] hover:border-[#6A1B9A]/30 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E2E4E8] transition-all flex items-center gap-1 font-semibold"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-[#8A92A0] bg-[#FAF7FC]/30 rounded-lg border border-dashed border-[#E2E4E8]">
                <Newspaper className="w-8 h-8 text-[#8A92A0] mx-auto mb-2 opacity-50" />
                <p className="font-bold text-[#1E2229] mb-1">No market news listed yet</p>
                <p>Click <strong>&quot;Fetch Data on Click&quot;</strong> above to pull the latest market dispatches from Financial Wire.</p>
              </div>
            )}
          </div>
        );
      })()}

        {/* TAB CONTENT: 3. IPOS */}
        {activeTab === 'ipo' && (
          <div id="section-ipo-container" className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0E8A54]" />
                  <span>IPO Watch Hub</span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Dedicated Section: <strong>IPO Watch</strong> • Live &amp; Upcoming Issues • Refreshed Live
                </p>
              </div>

              {/* IPO Sub-filter */}
              <div className="flex items-center gap-1 bg-[#F4F4F6] p-0.5 rounded border border-[#E2E4E8] text-xs">
                {(['all', 'active', 'upcoming'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setIpoFilter(filterKey)}
                    className={`px-2.5 py-1 rounded capitalize font-semibold transition-colors ${
                      ipoFilter === filterKey
                        ? 'bg-white text-[#6A1B9A] shadow-2xs'
                        : 'text-[#58606E] hover:text-[#1E2229]'
                    }`}
                  >
                    {filterKey === 'all' ? 'All (Live & Upcoming)' : filterKey === 'active' ? 'Live (Open)' : 'Upcoming'}
                  </button>
                ))}
              </div>
            </div>

            {filteredIpos.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No IPOs found in category &quot;{ipoFilter}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {filteredIpos.map((ipo) => (
                  <div
                    key={ipo.id}
                    className="p-3.5 rounded-lg border border-[#E2E4E8] bg-white hover:border-[#6A1B9A]/40 transition-all text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-[#1E2229] block line-clamp-1">
                          {ipo.name || ipo.symbol}
                        </span>
                        <span className="font-mono text-[11px] text-[#6A1B9A] font-semibold">
                          {ipo.symbol}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ipo.status === 'active'
                            ? 'bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30'
                            : ipo.status === 'upcoming'
                              ? 'bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30'
                              : 'bg-[#F4F4F6] text-[#58606E]'
                        }`}
                      >
                        {ipo.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E4E8] text-[11px]">
                      <div>
                        <span className="text-[#8A92A0] block">Issue Price</span>
                        <span className="font-bold text-[#1E2229]">{ipo.issue_price ? `₹${ipo.issue_price}` : (ipo.min_price ? `₹${ipo.min_price} - ₹${ipo.max_price}` : '—')}</span>
                      </div>
                      <div>
                        <span className="text-[#8A92A0] block">Lot Size</span>
                        <span className="font-bold text-[#1E2229]">{ipo.lot_size ? `${ipo.lot_size} shares` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#8A92A0] block">Lot Size</span>
                        <span className="font-semibold text-[#1E2229]">{ipo.lot_size ? `${ipo.lot_size} shares` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#8A92A0] block">Bidding Dates</span>
                        <span className="font-semibold text-[#1E2229]">
                          {ipo.bidding_start_date ? `${ipo.bidding_start_date} → ${ipo.bidding_end_date || ''}` : 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8A92A0] pt-1">
                      <span>{ipo.is_sme ? 'SME IPO' : 'Mainboard IPO'}</span>
                      {ipo.document_url && (
                        <a
                          href={ipo.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#6A1B9A] inline-flex items-center gap-0.5"
                        >
                          <span>DRHP Doc</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

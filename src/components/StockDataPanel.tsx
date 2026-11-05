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
  Building2,
  SlidersHorizontal,
  ChevronRight,
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

  // Active view tab after fetch
  const [activeTab, setActiveTab] = useState<'trending' | 'news' | 'ipo' | 'stock'>('news');

  // Loaded database state
  const [trendingStocks, setTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [ipos, setIpos] = useState<IpoItemRecord[]>([]);
  const [stockDossiers, setStockDossiers] = useState<any[]>([]);
  const [savedNewsList, setSavedNewsList] = useState<NewsItemRecord[]>([]);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter for IPO sub-tab
  const [ipoFilter, setIpoFilter] = useState<'all' | 'active' | 'upcoming' | 'listed'>('all');

  const refreshPanelData = async () => {
    setLoading(true);
    try {
      const [trendList, ipoList, stockList, newsList] = await Promise.all([
        fetchTrendingStocks(false),
        fetchIpos(false),
        fetchSavedStockData({ endpoint: 'stock' }),
        fetchSavedNews(),
      ]);
      setTrendingStocks(trendList);
      setIpos(ipoList);
      setStockDossiers(stockList);
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

  const filteredIpos =
    ipoFilter === 'all' ? ipos : ipos.filter((item) => item.status === ipoFilter);

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
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30 font-bold">
                {lastSyncResult.news.items.length} Fetched
              </span>
            ) : null}
            {savedNewsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 font-bold">
                {savedNewsList.length} in DB
              </span>
            )}
          </button>

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
              {ipos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'stock'
                ? 'border-[#6A1B9A] text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#6A1B9A]" />
            <span>Company Lookup</span>
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
        {activeTab === 'news' && (
          <div id="section-news-container" className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Real-Time Market News Feed</span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Browse real-time headlines with lead images and wire URLs. Click <strong>&quot;Save to News Table&quot;</strong> to save any item to <code className="text-xs font-mono">public.news</code> for story drafting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#58606E] font-medium">
                  Saved in DB: <strong>{savedNewsList.length}</strong>
                </span>
              </div>
            </div>

            {/* List of News Items from Latest Fetch */}
            {lastSyncResult?.news.items && lastSyncResult.news.items.length > 0 ? (
              <div className="space-y-3">
                {lastSyncResult.news.items.map((item: NewsItemRecord) => {
                  const isSaved = savedNewsList.some((s) => s.title.toLowerCase() === item.title.toLowerCase());
                  const isSavingThis = savingNewsId === item.id;

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
                              'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white backdrop-blur-xs">
                          {item.source}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30">
                              {item.source}
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
                          <h4 className="font-bold text-sm text-[#1E2229] leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#58606E] mt-1.5 line-clamp-3 leading-relaxed">
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
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-[#8A92A0] bg-[#FAF7FC]/30 rounded-lg border border-dashed border-[#E2E4E8]">
                <Newspaper className="w-8 h-8 text-[#8A92A0] mx-auto mb-2 opacity-50" />
                <p className="font-bold text-[#1E2229] mb-1">No market news listed yet</p>
                <p>Click <strong>&quot;Fetch Data on Click&quot;</strong> above to pull the latest market dispatches from Financial Wire.</p>
              </div>
            )}
          </div>
        )}

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
                  Dedicated Section: <strong>IPO Watch</strong> • Saved in <code className="text-xs font-mono">public.ipos</code> • Status: <strong>Published</strong>
                </p>
              </div>

              {/* IPO Sub-filter */}
              <div className="flex items-center gap-1 bg-[#F4F4F6] p-0.5 rounded border border-[#E2E4E8] text-xs">
                {(['all', 'active', 'upcoming', 'listed'] as const).map((filterKey) => (
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
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>

            {filteredIpos.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No IPOs found in category &quot;{ipoFilter}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {/* TAB CONTENT: 4. COMPANY LOOKUP */}
        {activeTab === 'stock' && (
          <div id="section-stock-container" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Company Fundamental Dossier</span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Saved in <code className="text-xs font-mono">public.indian_stock_data</code> • Published • Powered by Yahoo Finance
                </p>
              </div>
            </div>

            {lastSyncResult?.stock.data && typeof lastSyncResult.stock.data === 'object' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#FAF7FC] p-4 rounded border border-[#DA9CFF]/40">
                  <div>
                    <h3 className="font-bold text-base text-[#1E2229]">
                      {lastSyncResult.stock.data.companyName || lastSyncResult.stock.symbol || 'Company'}
                    </h3>
                    <p className="text-xs text-[#58606E]">
                      Exchange: {lastSyncResult.stock.data.exchange || 'NSE'} • Symbol: {lastSyncResult.stock.data.symbol || lastSyncResult.stock.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[#0E8A54] block">
                      {lastSyncResult.stock.data.currentPrice || '—'}
                    </span>
                    <span className="text-[10px] text-[#8A92A0]">Live Trade</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">Market Cap</span>
                    <span className="font-bold text-[#1E2229] text-sm">{lastSyncResult.stock.data.marketCap || '—'}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">P/E Ratio</span>
                    <span className="font-bold text-[#1E2229] text-sm">{lastSyncResult.stock.data.peRatio || '—'}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">Day High</span>
                    <span className="font-bold text-[#0E8A54] text-sm">{lastSyncResult.stock.data.dayHigh || '—'}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">Day Low</span>
                    <span className="font-bold text-[#D32F2F] text-sm">{lastSyncResult.stock.data.dayLow || '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No company data loaded. Click <strong>&quot;Fetch Data on Click&quot;</strong> above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

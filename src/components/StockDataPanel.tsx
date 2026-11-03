import React, { useState, useEffect } from 'react';
import {
  TrendingStockItem,
  IpoItemRecord,
  Story,
} from '../types/story';
import {
  executeUnifiedIndianApiSync,
  fetchTrendingStocks,
  fetchIpos,
  fetchSavedStockData,
  getApiUsageEstimate,
  UnifiedSyncResults,
} from '../lib/indianStockApi';
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
  const [syncStockSymbol, setSyncStockSymbol] = useState('RELIANCE');
  const [lastSyncResult, setLastSyncResult] = useState<UnifiedSyncResults | null>(null);

  // Active view tab after fetch
  const [activeTab, setActiveTab] = useState<'trending' | 'news' | 'ipo' | 'stock'>('trending');

  // Loaded database state
  const [trendingStocks, setTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [ipos, setIpos] = useState<IpoItemRecord[]>([]);
  const [stockDossiers, setStockDossiers] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState({ totalThisMonth: 0, remaining: 500 });
  const [loading, setLoading] = useState(false);

  // Filter for IPO sub-tab
  const [ipoFilter, setIpoFilter] = useState<'all' | 'active' | 'upcoming' | 'listed'>('all');

  const refreshPanelData = async () => {
    setLoading(true);
    try {
      const [trendList, ipoList, stockList, usage] = await Promise.all([
        fetchTrendingStocks(false),
        fetchIpos(false),
        fetchSavedStockData({ endpoint: 'stock' }),
        getApiUsageEstimate(),
      ]);
      setTrendingStocks(trendList);
      setIpos(ipoList);
      setStockDossiers(stockList);
      setUsageStats(usage);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refreshPanelData();
  }, []);

  // 1-Click Unified Action
  const handleSingleClickFetch = async () => {
    setSyncing(true);
    const res = await executeUnifiedIndianApiSync(syncStockSymbol);
    setSyncing(false);
    setLastSyncResult(res);

    if (res.success) {
      onNotify?.({
        type: 'success',
        text: `Unified sync complete! Merged ${res.news.mergedStoriesCount} news drafts into stories, updated ${res.trending.count} trending stocks, ${res.ipo.count} IPOs, and ${res.stock.symbol} stock dossier!`,
      });
      await refreshPanelData();
      if (onRefreshAllData) {
        await onRefreshAllData();
      }
    } else {
      onNotify?.({
        type: 'error',
        text: res.error || 'Failed to complete unified sync from IndianAPI.',
      });
    }
  };

  const filteredIpos =
    ipoFilter === 'all' ? ipos : ipos.filter((item) => item.status === ipoFilter);

  return (
    <div className="space-y-6">
      {/* 1. Header with One-Click Fetch & Month Rate Gauge */}
      <div className="bg-white rounded-lg border border-[#E2E4E8] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E2E4E8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Open_Sans'] font-extrabold text-2xl text-[#1E2229]">
                Indian Stock Market API Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30">
                1-Click Unified Sync
              </span>
            </div>
            <p className="text-xs text-[#58606E]">
              Captures all live data from IndianAPI in a single click: /news into Stories (Draft), /trending, /ipo, and /stock (Published).
            </p>
          </div>

          {/* Monthly Budget Meter */}
          <div className="bg-[#FAF7FC] border border-[#DA9CFF]/40 rounded-lg p-3 shrink-0 min-w-[260px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#1E2229] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6A1B9A]" />
                <span>Monthly Request Budget</span>
              </span>
              <span className="font-bold text-[#6A1B9A] tabular-nums">
                {usageStats.remaining} / 500 left
              </span>
            </div>
            <div className="w-full bg-[#EBEEF7] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6A1B9A] transition-all duration-500"
                style={{ width: `${Math.min(100, (usageStats.totalThisMonth / 500) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8A92A0] mt-1 flex items-center justify-between">
              <span>Used this month: {usageStats.totalThisMonth} requests</span>
              <span className="text-[#0E8A54] font-medium">500 req/month plan</span>
            </p>
          </div>
        </div>

        {/* 1-Click Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1E2229] uppercase tracking-wide">
              Company Symbol for /stock:
            </span>
            <input
              type="text"
              value={syncStockSymbol}
              onChange={(e) => setSyncStockSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. RELIANCE, TATASTEEL"
              className="px-3 py-1.5 text-xs font-mono font-bold rounded border border-[#E2E4E8] uppercase focus:border-[#6A1B9A] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSingleClickFetch}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching All 4 Endpoints...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Fetch Data on Click (All Endpoints)</span>
              </>
            )}
          </button>
        </div>

        {/* Sync Summary Banner if just fetched */}
        {lastSyncResult && (
          <div className="mt-4 p-3 bg-[#E8F5EE] border border-[#0E8A54]/30 rounded text-xs text-[#0E8A54] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Sync Finished: <strong>{lastSyncResult.news.mergedStoriesCount}</strong> News Drafts in Stories •{' '}
                <strong>{lastSyncResult.trending.count}</strong> Trending Stocks •{' '}
                <strong>{lastSyncResult.ipo.count}</strong> IPOs •{' '}
                <strong>{lastSyncResult.stock.symbol}</strong> Dossier.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#58606E]">
              {formatTimeAgo(lastSyncResult.timestamp)}
            </span>
          </div>
        )}
      </div>

      {/* 2. TABBED RESULTS VIEW (Trending Stocks, Market News, IPOs, Company Lookup) */}
      <div className="bg-white rounded-lg border border-[#E2E4E8] overflow-hidden shadow-xs">
        {/* Tab Navigation with IDs for Direct Section Editing */}
        <div className="flex items-center overflow-x-auto border-b border-[#E2E4E8] bg-[#F4F4F6] text-xs">
          <button
            id="tab-section-trending"
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 py-3 px-5 font-bold border-b-2 transition-colors ${
              activeTab === 'trending'
                ? 'border-[#6A1B9A] bg-white text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#0E8A54]" />
            <span>Trending Stocks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54]">
              {trendingStocks.length}
            </span>
          </button>

          <button
            id="tab-section-news"
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 py-3 px-5 font-bold border-b-2 transition-colors ${
              activeTab === 'news'
                ? 'border-[#6A1B9A] bg-white text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Newspaper className="w-4 h-4 text-[#6A1B9A]" />
            <span>Market News (Merged into Stories)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF8E1] text-[#B78103]">
              Drafts
            </span>
          </button>

          <button
            id="tab-section-ipo"
            type="button"
            onClick={() => setActiveTab('ipo')}
            className={`flex items-center gap-2 py-3 px-5 font-bold border-b-2 transition-colors ${
              activeTab === 'ipo'
                ? 'border-[#6A1B9A] bg-white text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#6A1B9A]" />
            <span>IPOs (Section: IPO Watch)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EBEEF7] text-[#58606E]">
              {ipos.length}
            </span>
          </button>

          <button
            id="tab-section-stock"
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 py-3 px-5 font-bold border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-[#6A1B9A] bg-white text-[#6A1B9A]'
                : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#6A1B9A]" />
            <span>Company Lookup ({syncStockSymbol})</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FAF7FC] text-[#6A1B9A]">
              Dossier
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
                  <span>Dedicated Table: <code className="text-xs font-mono">public.trending_stocks</code></span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Status: <strong>Published</strong> • Automatically cleared and refreshed on every fetch
                </p>
              </div>
              <span className="text-xs text-[#8A92A0]">
                Last synced: {trendingStocks[0] ? formatTimeAgo(trendingStocks[0].fetched_at) : 'Not synced yet'}
              </span>
            </div>

            {trendingStocks.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No trending stocks loaded yet. Click <strong>&quot;Fetch Data on Click&quot;</strong> above to load live movers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F6] text-[#58606E] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3">Current Price</th>
                      <th className="py-2.5 px-3">Change %</th>
                      <th className="py-2.5 px-3">Trend Type</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Technical Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4E8]">
                    {trendingStocks.map((item) => {
                      const isGainer = item.trend_type === 'gainer';
                      return (
                        <tr key={item.id} className="hover:bg-[#FAF7FC]/50">
                          <td className="py-2.5 px-3 font-bold text-[#1E2229]">
                            {item.company_name}
                            {item.ticker_id && (
                              <span className="ml-1 text-[10px] text-[#8A92A0] font-mono">
                                ({item.ticker_id})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#1E2229]">
                            ₹{item.price}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isGainer ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                              }`}
                            >
                              {item.percent_change}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 capitalize font-semibold text-[#58606E]">
                            {item.trend_type}
                          </td>
                          <td className="py-2.5 px-3 text-[#58606E] font-mono text-[11px]">
                            {item.volume || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[#6A1B9A] font-semibold text-[11px]">
                            {item.overall_rating || item.short_term_trends || 'Bullish'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 2. MARKET NEWS (MERGED INTO STORIES) */}
        {activeTab === 'news' && (
          <div id="section-news-container" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Stories Table: <code className="text-xs font-mono">public.stories</code></span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Status: <strong>Draft</strong> (Ready for review in the Stories Manager tab before publishing)
                </p>
              </div>
            </div>

            {lastSyncResult?.news.data && lastSyncResult.news.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lastSyncResult.news.data.map((news: any, idx: number) => (
                  <div key={idx} className="p-4 rounded border border-[#E2E4E8] bg-[#FAF7FC]/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8A92A0]">
                      <span className="font-bold text-[#6A1B9A]">{news.source || 'Market Desk'}</span>
                      <span>{formatTimeAgo(news.pub_date)}</span>
                    </div>
                    <h4 className="font-bold text-xs text-[#1E2229] leading-snug line-clamp-2">
                      {news.title}
                    </h4>
                    <p className="text-xs text-[#58606E] line-clamp-3">{news.summary}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-[#FFF8E1] text-[#B78103] font-bold">
                        Draft in public.stories
                      </span>
                      {news.url && (
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#6A1B9A] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Original wire</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                Click <strong>&quot;Fetch Data on Click&quot;</strong> to merge the latest 20 financial dispatches into public.stories.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 3. IPOS (SECTION: IPO WATCH) */}
        {activeTab === 'ipo' && (
          <div id="section-ipo-container" className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2E4E8]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Dedicated Table: <code className="text-xs font-mono">public.ipos</code></span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Section: <strong>IPO Watch</strong> • Category: <strong>Mainboard IPO / SME IPO</strong> • Status: <strong>Published</strong>
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded border border-[#E2E4E8] text-xs">
                {(['all', 'active', 'upcoming', 'listed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setIpoFilter(st)}
                    className={`px-3 py-1 rounded font-bold capitalize transition-colors ${
                      ipoFilter === st ? 'bg-white text-[#6A1B9A] shadow-xs' : 'text-[#58606E]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredIpos.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8A92A0]">
                No IPOs found. Click <strong>&quot;Fetch Data on Click&quot;</strong> above to load active &amp; upcoming IPOs.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredIpos.map((ipo) => (
                  <div key={ipo.id} className="p-3.5 rounded border border-[#E2E4E8] bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1E2229] truncate" title={ipo.name}>
                        {ipo.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ipo.status === 'active'
                            ? 'bg-[#E8F5EE] text-[#0E8A54]'
                            : ipo.status === 'upcoming'
                            ? 'bg-[#FAF7FC] text-[#6A1B9A]'
                            : 'bg-[#EBEEF7] text-[#58606E]'
                        }`}
                      >
                        {ipo.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#58606E] space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Price Band:</span>
                        <strong className="text-[#1E2229] font-mono">
                          {ipo.min_price && ipo.max_price
                            ? `₹${ipo.min_price} - ₹${ipo.max_price}`
                            : ipo.issue_price
                            ? `₹${ipo.issue_price}`
                            : 'TBA'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lot Size:</span>
                        <strong className="text-[#1E2229] font-mono">{ipo.lot_size ? `${ipo.lot_size} shares` : 'TBA'}</strong>
                      </div>
                      {ipo.bidding_start_date && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Dates:</span>
                          <span>{ipo.bidding_start_date} to {ipo.bidding_end_date || 'Close'}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E2E4E8]/60 flex items-center justify-between text-[10px] text-[#8A92A0]">
                      <span className="font-semibold text-[#6A1B9A]">
                        {ipo.is_sme ? 'SME IPO' : 'Mainboard'}
                      </span>
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
                  <span>Company Fundamental Dossier ({syncStockSymbol})</span>
                </h3>
                <p className="text-xs text-[#58606E]">
                  Saved in <code className="text-xs font-mono">public.indian_stock_data</code> • Published
                </p>
              </div>
            </div>

            {lastSyncResult?.stock.data && typeof lastSyncResult.stock.data === 'object' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#FAF7FC] p-4 rounded border border-[#DA9CFF]/40">
                  <div>
                    <h3 className="font-bold text-base text-[#1E2229]">
                      {lastSyncResult.stock.data.companyName || syncStockSymbol}
                    </h3>
                    <p className="text-xs text-[#58606E]">
                      Industry: {lastSyncResult.stock.data.industry || 'Listed Corporation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[#0E8A54] block">
                      ₹{lastSyncResult.stock.data.currentPrice?.NSE || lastSyncResult.stock.data.currentPrice?.BSE || lastSyncResult.stock.data.currentPrice || '—'}
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
                    <span className="font-bold text-[#1E2229] text-sm">{lastSyncResult.stock.data.peRatio || lastSyncResult.stock.data.pe || '—'}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">52W High</span>
                    <span className="font-bold text-[#0E8A54] text-sm">{lastSyncResult.stock.data.yearHigh || lastSyncResult.stock.data.fiftyTwoWeekHigh || '—'}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-[#E2E4E8]">
                    <span className="text-[10px] text-[#8A92A0] uppercase block">52W Low</span>
                    <span className="font-bold text-[#D32F2F] text-sm">{lastSyncResult.stock.data.yearLow || lastSyncResult.stock.data.fiftyTwoWeekLow || '—'}</span>
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

import React, { useState, useEffect } from 'react';
import {
  IndianApiEndpoint,
  StockDataRecord,
  fetchFromIndianApi,
  saveStockDataToSupabase,
  saveTrendingStocksToDedicatedTable,
  fetchTrendingStocks,
  fetchSavedStockData,
  updateStockDataPublishStatus,
  deleteStockData,
  getApiUsageEstimate,
  ApiUsageEntry,
} from '../lib/indianStockApi';
import { SECTIONS, CATEGORIES, Section, Category, TrendingStockItem } from '../types/story';
import {
  TrendingUp,
  Newspaper,
  Calendar,
  Search,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface StockDataPanelProps {
  onNotify?: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export const StockDataPanel: React.FC<StockDataPanelProps> = ({ onNotify }) => {
  // Config selection
  const [selectedEndpoint, setSelectedEndpoint] = useState<IndianApiEndpoint>('trending');
  const [stockQuery, setStockQuery] = useState('');
  const [targetSection, setTargetSection] = useState<Section>('Market News');
  const [targetCategory, setTargetCategory] = useState<Category>('Market Trends');

  // Fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAge, setCachedAge] = useState<number | null>(null);

  // Storage / Saved items
  const [saving, setSaving] = useState(false);
  const [savedRecords, setSavedRecords] = useState<StockDataRecord[]>([]);
  const [trendingStocksList, setTrendingStocksList] = useState<TrendingStockItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Rate usage statistics
  const [usageStats, setUsageStats] = useState<{
    totalThisMonth: number;
    byEndpoint: ApiUsageEntry[];
    remaining: number;
  }>({ totalThisMonth: 0, byEndpoint: [], remaining: 500 });

  // Inspection modal
  const [inspectRecord, setInspectRecord] = useState<StockDataRecord | null>(null);

  // Refresh saved records & stats
  const refreshAll = async () => {
    setLoadingRecords(true);
    try {
      const [records, usage, trending] = await Promise.all([
        fetchSavedStockData(),
        getApiUsageEstimate(),
        fetchTrendingStocks(false),
      ]);
      setSavedRecords(records);
      setUsageStats(usage);
      setTrendingStocksList(trending);
    } catch {}
    setLoadingRecords(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Endpoint switch default tax mappings
  const handleEndpointChange = (ep: IndianApiEndpoint) => {
    setSelectedEndpoint(ep);
    setFetchedData(null);
    setIsCached(false);
    if (ep === 'trending') {
      setTargetSection('Market News');
      setTargetCategory('Market Trends');
    } else if (ep === 'news') {
      setTargetSection('Market News');
      setTargetCategory('Market Trends');
    } else if (ep === 'ipo') {
      setTargetSection('Investment Insights');
      setTargetCategory('Event Calendar');
    } else if (ep === 'stock') {
      setTargetSection('Investment Insights');
      setTargetCategory('Stock Recommendations');
    }
  };

  // Perform API call with 6h cache protection
  const handleFetch = async () => {
    if (selectedEndpoint === 'stock' && !stockQuery.trim()) {
      onNotify?.({ type: 'error', text: 'Please enter a stock symbol or company name (e.g., RELIANCE, TATA STEEL).' });
      return;
    }

    setFetching(true);
    setFetchedData(null);
    const query = selectedEndpoint === 'stock' ? stockQuery.trim() : undefined;
    const res = await fetchFromIndianApi(selectedEndpoint, query);
    setFetching(false);

    if (res.success) {
      setFetchedData(res.data);
      setIsCached(!!res.cached);
      setCachedAge(res.cachedAgeMs ?? null);
      if (res.cached) {
        onNotify?.({
          type: 'success',
          text: 'Loaded from Supabase 6-hour cache without consuming your 500 req/month quota!',
        });
      } else {
        onNotify?.({
          type: 'success',
          text: `Successfully fetched fresh ${selectedEndpoint.toUpperCase()} data from Indian Stock API.`,
        });
      }
      // update stats
      getApiUsageEstimate().then(setUsageStats);
    } else {
      onNotify?.({
        type: 'error',
        text: res.error || 'Failed to fetch from Indian Stock API.',
      });
    }
  };

  // Save to Supabase
  const handleSaveToSupabase = async () => {
    if (!fetchedData) return;

    setSaving(true);

    // If Trending Stocks: Save to dedicated table 'trending_stocks' (clears on every load)
    if (selectedEndpoint === 'trending') {
      const trendingRes = await saveTrendingStocksToDedicatedTable(
        fetchedData,
        targetSection,
        targetCategory
      );
      // Also save snapshot in general indian_stock_data table
      await saveStockDataToSupabase(
        selectedEndpoint,
        undefined,
        fetchedData,
        targetSection,
        targetCategory
      );
      setSaving(false);

      if (trendingRes.success) {
        onNotify?.({
          type: 'success',
          text: `Successfully cleared and refreshed dedicated Supabase table "public.trending_stocks" with ${trendingRes.count || 20} live gainers & losers!`,
        });
        await refreshAll();
      } else {
        onNotify?.({
          type: 'error',
          text: trendingRes.error || 'Failed to update trending_stocks table.',
        });
      }
      return;
    }

    const query = selectedEndpoint === 'stock' ? stockQuery.trim() : undefined;
    const res = await saveStockDataToSupabase(
      selectedEndpoint,
      query,
      fetchedData,
      targetSection,
      targetCategory
    );
    setSaving(false);

    if (res.success) {
      onNotify?.({
        type: 'success',
        text: `Stored in Supabase (public.indian_stock_data) under Section: "${targetSection}" & Category: "${targetCategory}"!`,
      });
      await refreshAll();
    } else {
      onNotify?.({
        type: 'error',
        text: res.error || 'Failed to save stock data to Supabase.',
      });
    }
  };

  // Toggle publish
  const handleTogglePublish = async (record: StockDataRecord) => {
    const nextStatus = !record.is_published;
    const res = await updateStockDataPublishStatus(record.id, nextStatus);
    if (res.success) {
      setSavedRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, is_published: nextStatus } : r))
      );
      onNotify?.({
        type: 'success',
        text: nextStatus
          ? `Published "${record.endpoint.toUpperCase()}" data! Now visible to subscribers on the portal.`
          : `Unpublished "${record.endpoint.toUpperCase()}". Moved to draft.`,
      });
    } else {
      onNotify?.({ type: 'error', text: res.error || 'Failed to update publishing status.' });
    }
  };

  // Delete
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" data record from Supabase?`)) {
      const res = await deleteStockData(id);
      if (res.success) {
        setSavedRecords((prev) => prev.filter((r) => r.id !== id));
        onNotify?.({ type: 'success', text: 'Record deleted.' });
      } else {
        onNotify?.({ type: 'error', text: res.error || 'Failed to delete record.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Monthly Quota Guard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E2E4E8]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Open_Sans'] font-extrabold text-2xl text-[#1E2229]">
              Indian Stock Market API Data Studio
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30">
              API Live
            </span>
          </div>
          <p className="text-xs text-[#58606E]">
            Direct connection to <code className="bg-[#EBEEF7] px-1 py-0.5 rounded text-[11px] font-mono">https://stock.indianapi.in</code>.
            Fetch real-time data, map Section/Category, and publish directly to the subscriber feed.
          </p>
        </div>

        {/* Quota Meter Badge */}
        <div className="bg-white border border-[#E2E4E8] rounded p-3 shadow-xs shrink-0 min-w-[240px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-[#1E2229] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#6A1B9A]" />
              <span>Monthly Request Budget</span>
            </span>
            <span className="font-bold text-[#6A1B9A] tabular-nums">
              {usageStats.remaining} / 500 left
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-[#EBEEF7] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                usageStats.remaining < 50 ? 'bg-[#D32F2F]' : 'bg-[#0E8A54]'
              }`}
              style={{
                width: `${Math.min(100, (usageStats.totalThisMonth / 500) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-[#8A92A0] mt-1 flex items-center justify-between">
            <span>Used this month: {usageStats.totalThisMonth} requests</span>
            <span className="text-[#0E8A54] font-medium">6h auto-caching</span>
          </p>
        </div>
      </div>

      {/* 2. Interactive Fetch Studio: Configure & Fetch */}
      <div className="bg-white rounded border border-[#E2E4E8] p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E4E8] pb-3">
          <span className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1.5">
            <Database className="w-4 h-4 text-[#6A1B9A]" />
            <span>Step 1: Choose Endpoint &amp; Editorial Taxonomy</span>
          </span>
          <span className="text-[11px] text-[#8A92A0]">Single-click fetch with rate-limit protection</span>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'trending', label: 'Trending Stocks', icon: TrendingUp, desc: 'Hot NSE/BSE movers' },
            { id: 'news', label: 'Market News', icon: Newspaper, desc: 'Curated financial feeds' },
            { id: 'ipo', label: 'IPOs', icon: Calendar, desc: 'Upcoming & active listings' },
            { id: 'stock', label: 'Company Lookup', icon: Search, desc: 'Balance sheet, price, ratios' },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedEndpoint === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleEndpointChange(item.id as IndianApiEndpoint)}
                className={`p-3 rounded border text-left transition-all ${
                  active
                    ? 'border-[#6A1B9A] bg-[#FAF7FC] ring-1 ring-[#6A1B9A] shadow-xs'
                    : 'border-[#E2E4E8] bg-white hover:border-[#6A1B9A]/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center ${
                      active ? 'bg-[#6A1B9A] text-white' : 'bg-[#EBEEF7] text-[#58606E]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-bold ${active ? 'text-[#6A1B9A]' : 'text-[#1E2229]'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A92A0] line-clamp-1">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Dynamic Query & Taxonomy Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
          {/* Stock Search query if endpoint === 'stock' */}
          {selectedEndpoint === 'stock' && (
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                Company Name or Symbol <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A92A0]" />
                <input
                  type="text"
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  placeholder="e.g. Reliance, Tata Steel, Infosys, HDFC"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none font-semibold"
                />
              </div>
            </div>
          )}

          {/* Target Section */}
          <div className={selectedEndpoint === 'stock' ? 'sm:col-span-4' : 'sm:col-span-6'}>
            <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
              Editorial Section <span className="text-[#BA1A1A]">*</span>
            </label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value as Section)}
              className="w-full bg-white border border-[#E2E4E8] rounded p-2 text-xs font-semibold focus:border-[#6A1B9A] outline-none"
            >
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Target Category */}
          <div className={selectedEndpoint === 'stock' ? 'sm:col-span-4' : 'sm:col-span-6'}>
            <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
              Category / Taxonomy Tag <span className="text-[#BA1A1A]">*</span>
            </label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as Category)}
              className="w-full bg-white border border-[#E2E4E8] rounded p-2 text-xs font-semibold focus:border-[#6A1B9A] outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-[#58606E] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0E8A54]" />
            <span>Endpoint: <code className="font-mono text-[#1E2229]">/{selectedEndpoint}{selectedEndpoint === 'stock' && stockQuery ? `?name=${encodeURIComponent(stockQuery)}` : ''}</code></span>
          </div>

          <button
            type="button"
            onClick={handleFetch}
            disabled={fetching}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            {fetching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching from IndianAPI...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Fetch Data on Click</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Live Preview & Save Container (when data has been fetched) */}
      {fetchedData && (
        <div className="bg-[#FAF7FC] border border-[#DA9CFF] rounded p-5 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DA9CFF]/40 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6A1B9A] uppercase tracking-wider">
                  Step 2: Review Response Preview
                </span>
                {isCached ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Cached (0 quota used)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6A1B9A]/10 text-[#6A1B9A]">
                    Live 200 OK
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#58606E]">
                Mapped to Section: <strong className="text-[#1E2229]">{targetSection}</strong> • Category: <strong className="text-[#1E2229]">{targetCategory}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveToSupabase}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0E8A54] hover:bg-[#0C7345] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 self-start sm:self-auto"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Data in Supabase</span>
                </>
              )}
            </button>
          </div>

          {/* Structured Cards Preview based on Endpoint */}
          <div className="bg-white rounded border border-[#E2E4E8] p-4 max-h-[360px] overflow-y-auto">
            {selectedEndpoint === 'trending' && (
              <div className="space-y-4">
                {/* Gainers */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#0E8A54] uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Gainers (Momentum Leaders)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {((fetchedData?.trending_stocks?.top_gainers || (Array.isArray(fetchedData) ? fetchedData : [])) as any[])
                      .slice(0, 6)
                      .map((stock: any, i: number) => (
                        <div key={i} className="p-2.5 rounded border border-[#0E8A54]/20 bg-[#E8F5EE]/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#1E2229] text-xs truncate max-w-[150px]">
                              {stock.company_name || stock.companyName || stock.symbol}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#0E8A54]">
                              ₹{stock.price}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#58606E] flex items-center justify-between">
                            <span className="font-semibold text-[#0E8A54]">
                              ▲ +{stock.percent_change || stock.percentChange}%
                            </span>
                            <span>Vol: {stock.volume || '—'}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Losers */}
                {fetchedData?.trending_stocks?.top_losers && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#D32F2F] uppercase tracking-wide">
                      <TrendingUp className="w-4 h-4 rotate-180" />
                      <span>Top Losers (Market Pullbacks)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {(fetchedData.trending_stocks.top_losers as any[]).slice(0, 6).map((stock: any, i: number) => (
                        <div key={i} className="p-2.5 rounded border border-[#D32F2F]/20 bg-[#FDECEC]/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#1E2229] text-xs truncate max-w-[150px]">
                              {stock.company_name || stock.symbol}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#D32F2F]">
                              ₹{stock.price}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#58606E] flex items-center justify-between">
                            <span className="font-semibold text-[#D32F2F]">
                              ▼ {String(stock.percent_change).startsWith('-') ? stock.percent_change : `-${stock.percent_change}`}%
                            </span>
                            <span>Vol: {stock.volume || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedEndpoint === 'news' && (
              <div className="space-y-3">
                {(Array.isArray(fetchedData) ? fetchedData.slice(0, 5) : [fetchedData]).map((news: any, i: number) => (
                  <div key={i} className="p-3 rounded border border-[#E2E4E8] bg-[#F4F4F6]/50">
                    <h4 className="font-bold text-xs text-[#1E2229] mb-1">
                      {news.title || news.heading || 'Market Headline'}
                    </h4>
                    <p className="text-[11px] text-[#58606E] line-clamp-2">
                      {news.summary || news.description || news.content || 'News details from national exchange updates...'}
                    </p>
                    <div className="mt-2 text-[10px] text-[#8A92A0] flex items-center justify-between">
                      <span>Source: {news.source || 'IndianAPI Market Desk'}</span>
                      <span>{news.publishedAt || 'Today'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedEndpoint === 'ipo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Array.isArray(fetchedData) ? fetchedData.slice(0, 6) : [fetchedData]).map((ipo: any, i: number) => (
                  <div key={i} className="p-3 rounded border border-[#E2E4E8] bg-[#F4F4F6]/50">
                    <div className="font-bold text-xs text-[#1E2229] mb-1">
                      {ipo.company || ipo.companyName || ipo.name || 'IPO Issue'}
                    </div>
                    <div className="text-[11px] text-[#58606E] space-y-0.5">
                      <div>Issue Price: <strong className="text-[#1E2229]">₹{ipo.issuePrice || ipo.priceBand || 'TBA'}</strong></div>
                      <div>Dates: {ipo.openDate || 'Open'} to {ipo.closeDate || 'Close'}</div>
                      <div>Listing: {ipo.listingDate || 'Upcoming'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedEndpoint === 'stock' && typeof fetchedData === 'object' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E4E8] pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#1E2229]">
                      {fetchedData.companyName || stockQuery.toUpperCase()}
                    </h3>
                    <span className="text-[11px] text-[#8A92A0]">
                      Industry: {fetchedData.industry || 'National Stock Exchange / BSE'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#0E8A54] block font-mono">
                      ₹{fetchedData.currentPrice?.NSE || fetchedData.currentPrice?.BSE || fetchedData.currentPrice || '—'}
                    </span>
                    <span className="text-[10px] text-[#8A92A0]">Live / Close Price</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-[#F4F4F6] rounded">
                    <span className="text-[10px] text-[#8A92A0] block">Market Cap</span>
                    <span className="font-bold text-[#1E2229]">{fetchedData.marketCap || '—'}</span>
                  </div>
                  <div className="p-2 bg-[#F4F4F6] rounded">
                    <span className="text-[10px] text-[#8A92A0] block">P/E Ratio</span>
                    <span className="font-bold text-[#1E2229]">{fetchedData.peRatio || fetchedData.pe || '—'}</span>
                  </div>
                  <div className="p-2 bg-[#F4F4F6] rounded">
                    <span className="text-[10px] text-[#8A92A0] block">52W High</span>
                    <span className="font-bold text-[#0E8A54]">{fetchedData.fiftyTwoWeekHigh || '—'}</span>
                  </div>
                  <div className="p-2 bg-[#F4F4F6] rounded">
                    <span className="text-[10px] text-[#8A92A0] block">52W Low</span>
                    <span className="font-bold text-[#D32F2F]">{fetchedData.fiftyTwoWeekLow || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* 4B. Dedicated Trending Stocks Table (public.trending_stocks - Refreshed on every load) */}
      {trendingStocksList.length > 0 && (
        <div className="bg-white rounded border border-[#E2E4E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E2E4E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#FAF7FC]">
            <div>
              <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0E8A54]" />
                <span>Dedicated Table: <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-[#E2E4E8]">public.trending_stocks</code></span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30">
                  Refreshed On Load
                </span>
              </h3>
              <p className="text-xs text-[#58606E]">
                Contains {trendingStocksList.length} top gainers and losers. Clears automatically and repopulates when new trending data is loaded.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8A92A0]">
              Last synced: {trendingStocksList[0]?.fetched_at ? new Date(trendingStocksList[0].fetched_at).toLocaleTimeString() : 'Recently'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F4F6] border-b border-[#E2E4E8] text-[#58606E] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Company Name</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Change %</th>
                  <th className="py-2.5 px-3">Trend Type</th>
                  <th className="py-2.5 px-3">High / Low</th>
                  <th className="py-2.5 px-3">Rating / Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E8]/80">
                {trendingStocksList.slice(0, 10).map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF7FC]/50">
                    <td className="py-2.5 px-4 font-bold text-[#1E2229]">
                      {t.company_name}
                      {t.ticker_id && <span className="ml-1.5 text-[10px] text-[#8A92A0] font-mono">({t.ticker_id})</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1E2229]">
                      ₹{t.price}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        t.trend_type === 'gainer' ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                      }`}>
                        {t.percent_change}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize font-semibold text-[#58606E]">
                      {t.trend_type}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#58606E] font-mono">
                      {t.high ? `₹${t.high} / ₹${t.low}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#6A1B9A] font-semibold">
                      {t.overall_rating || t.short_term_trends || 'Market Momentum'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Supabase Saved Records Table & Publishing Workflow */}
      <div className="bg-white rounded border border-[#E2E4E8] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E2E4E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#1E2229] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6A1B9A]" />
              <span>Step 3: Stored Market Data in Supabase (<code className="text-xs font-mono">public.indian_stock_data</code>)</span>
            </h3>
            <p className="text-xs text-[#58606E]">
              Once published, these real-time market cards automatically display on the public subscriber feed.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={loadingRecords}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] text-xs font-semibold text-[#58606E] hover:text-[#1E2229]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? 'animate-spin' : ''}`} />
            <span>Refresh Table</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F6] border-b border-[#E2E4E8] text-[#58606E] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Endpoint &amp; Query</th>
                <th className="py-3 px-3">Taxonomy Mapping</th>
                <th className="py-3 px-3">Fetched At</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4E8]/80">
              {savedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8A92A0]">
                    No stock market records in Supabase yet. Click &quot;Fetch Data on Click&quot; above to import.
                  </td>
                </tr>
              ) : (
                savedRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7FC]/60 transition-colors">
                    {/* Endpoint & Query */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EBEEF7] text-[#6A1B9A]">
                          /{item.endpoint}
                        </span>
                        {item.query && (
                          <span className="font-bold text-[#1E2229] font-mono">
                            {item.query.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Taxonomy */}
                    <td className="py-3 px-3">
                      <span className="block font-semibold text-[#1E2229]">
                        {item.section}
                      </span>
                      <span className="text-[11px] text-[#8A92A0]">
                        {item.category}
                      </span>
                    </td>

                    {/* Fetched At */}
                    <td className="py-3 px-3 text-[11px] text-[#8A92A0] whitespace-nowrap">
                      {new Date(item.fetched_at).toLocaleString()}
                    </td>

                    {/* Publish Status Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        title="Click to toggle Published / Draft"
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                          item.is_published
                            ? 'bg-[#E8F5EE] text-[#0E8A54]'
                            : 'bg-[#FFF8E1] text-[#B78103]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{item.is_published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectRecord(item)}
                          title="Inspect raw response JSON"
                          className="p-1 rounded hover:bg-[#EBEEF7] text-[#58606E] hover:text-[#6A1B9A]"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, `${item.endpoint} ${item.query || ''}`)}
                          title="Delete record from Supabase"
                          className="p-1 rounded hover:bg-[#FDECEC] text-[#58606E] hover:text-[#D32F2F]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#F4F4F6] border-t border-[#E2E4E8] text-xs text-[#8A92A0] flex items-center justify-between">
          <span>{savedRecords.length} records in public.indian_stock_data</span>
          <span className="text-[11px] font-mono">
            {savedRecords.filter((r) => r.is_published).length} published to user feed
          </span>
        </div>
      </div>

      {/* 5. JSON Inspection Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-[#181C23]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#E2E4E8] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E4E8] bg-[#F4F4F6]">
              <div>
                <h3 className="font-bold text-sm text-[#1E2229]">
                  JSON Inspector: /{inspectRecord.endpoint} {inspectRecord.query && `(${inspectRecord.query})`}
                </h3>
                <span className="text-[11px] text-[#8A92A0]">
                  Section: {inspectRecord.section} • Category: {inspectRecord.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="p-1 rounded hover:bg-[#E2E4E8] text-[#58606E]"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#1E2229] text-[#E8F5EE]">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(inspectRecord.data, null, 2)}
              </pre>
            </div>
            <div className="p-3 bg-[#F4F4F6] border-t border-[#E2E4E8] text-right">
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="px-4 py-1.5 rounded bg-[#6A1B9A] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


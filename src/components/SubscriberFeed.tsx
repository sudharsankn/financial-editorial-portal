import React, { useState } from 'react';
import { Story, SECTIONS, CATEGORIES, Section, Category, TrendingStockItem } from '../types/story';
import { StockDataRecord } from '../lib/indianStockApi';
import { StoryCard } from './StoryCard';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Mail,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers,
  Database,
  ArrowUpRight,
  Activity,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface SubscriberFeedProps {
  stories: Story[];
  loading: boolean;
  selectedSection: string;
  onSectionChange: (sec: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectStory: (canonicalUrl: string) => void;
  onOpenSupabaseModal: () => void;
  publishedStockData?: StockDataRecord[];
  publishedTrendingStocks?: TrendingStockItem[];
}

export const SubscriberFeed: React.FC<SubscriberFeedProps> = ({
  stories,
  loading,
  selectedSection,
  onSectionChange,
  selectedCategory,
  onCategoryChange,
  onSelectStory,
  onOpenSupabaseModal,
  publishedStockData = [],
  publishedTrendingStocks = [],
}) => {
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [trendingTab, setTrendingTab] = useState<'all' | 'gainers' | 'losers'>('all');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailSubscribed(true);
      setTimeout(() => {
        setEmailInput('');
        setEmailSubscribed(false);
      }, 3500);
    }
  };

  // Section tabs array
  const sectionTabs = ['All', ...SECTIONS];

  const gainers = publishedTrendingStocks.filter((s) => s.trend_type === 'gainer');
  const losers = publishedTrendingStocks.filter((s) => s.trend_type === 'loser');

  const filteredTrending =
    trendingTab === 'gainers'
      ? gainers
      : trendingTab === 'losers'
      ? losers
      : publishedTrendingStocks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Section Navigation Bar */}
      <div className="border-b border-[#E2E4E8]">
        <div className="flex items-center space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar py-1">
          {sectionTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onSectionChange(tab)}
              className={`pb-3 text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-colors relative ${
                selectedSection === tab
                  ? 'text-[#6A1B9A] border-b-2 border-[#6A1B9A]'
                  : 'text-[#58606E] hover:text-[#1E2229]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LIVE TRENDING STOCKS HERO STRIP (Customer View) */}
      {publishedTrendingStocks.length > 0 && (
        <section className="bg-white rounded-lg border border-[#E2E4E8] shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-[#E2E4E8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/20 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-[#D32F2F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-['Open_Sans'] font-extrabold text-sm sm:text-base text-[#1E2229]">
                    Market Momentum: Trending Stocks
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54] animate-pulse" />
                    <span>Live IndianAPI</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#58606E]">
                  Top gainers &amp; active movers listed on the National Stock Exchange &amp; BSE
                </p>
              </div>
            </div>

            {/* Filter Toggle Pill Buttons */}
            <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded border border-[#E2E4E8] self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setTrendingTab('all')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  trendingTab === 'all'
                    ? 'bg-white text-[#6A1B9A] shadow-xs'
                    : 'text-[#58606E] hover:text-[#1E2229]'
                }`}
              >
                All ({publishedTrendingStocks.length})
              </button>
              <button
                type="button"
                onClick={() => setTrendingTab('gainers')}
                className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                  trendingTab === 'gainers'
                    ? 'bg-[#E8F5EE] text-[#0E8A54] shadow-xs'
                    : 'text-[#58606E] hover:text-[#0E8A54]'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Gainers ({gainers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendingTab('losers')}
                className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                  trendingTab === 'losers'
                    ? 'bg-[#FDECEC] text-[#D32F2F] shadow-xs'
                    : 'text-[#58606E] hover:text-[#D32F2F]'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>Pullbacks ({losers.length})</span>
              </button>
            </div>
          </div>

          {/* Scrolling horizontal card strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3.5">
            {filteredTrending.slice(0, 10).map((stock) => {
              const isGainer = stock.trend_type === 'gainer';
              return (
                <div
                  key={stock.id}
                  className={`p-3 rounded border transition-all hover:shadow-xs flex flex-col justify-between ${
                    isGainer
                      ? 'border-[#0E8A54]/25 bg-linear-to-b from-white to-[#E8F5EE]/20 hover:border-[#0E8A54]'
                      : 'border-[#D32F2F]/25 bg-linear-to-b from-white to-[#FDECEC]/20 hover:border-[#D32F2F]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-xs text-[#1E2229] truncate" title={stock.company_name}>
                        {stock.company_name}
                      </span>
                      {stock.exchange_type && (
                        <span className="text-[9px] font-mono text-[#8A92A0] uppercase">
                          {stock.exchange_type}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-[#1E2229] font-mono mb-1">
                      ₹{stock.price}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E4E8]/60 flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold tabular-nums px-1.5 py-0.5 rounded ${
                        isGainer ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                      }`}
                    >
                      {isGainer ? '▲' : '▼'} {stock.percent_change}
                    </span>
                    <span className="text-[10px] text-[#8A92A0] truncate max-w-[65px]">
                      {stock.overall_rating || (isGainer ? 'Bullish' : 'Pullback')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => onCategoryChange('All')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'All'
              ? 'bg-[#6A1B9A] text-white shadow-2xs'
              : 'bg-white border border-[#E2E4E8] text-[#58606E] hover:border-[#6A1B9A]'
          }`}
        >
          All Topics
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#6A1B9A] text-white shadow-2xs'
                : 'bg-white border border-[#E2E4E8] text-[#58606E] hover:border-[#6A1B9A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Main Editorial Layout (9 cols Stories + 3 cols Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stories Stream (Cols 1 to 8) */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-[#58606E] font-medium">
                Fetching financial intelligence stories...
              </p>
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded border border-[#E2E4E8] p-12 text-center shadow-xs">
              <Filter className="w-8 h-8 text-[#8A92A0] mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-base text-[#1E2229] mb-1">
                No articles published under this taxonomy
              </h3>
              <p className="text-xs text-[#58606E] max-w-sm mx-auto mb-4">
                Try selecting &ldquo;All&rdquo; or explore other investment insights sections.
              </p>
              <button
                onClick={() => {
                  onSectionChange('All');
                  onCategoryChange('All');
                }}
                className="px-4 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stories.map((story, idx) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onSelectStory={onSelectStory}
                  featured={idx === 0 && selectedSection === 'All' && selectedCategory === 'All'}
                />
              ))}
            </div>
          )}

          {/* 5. Published General Stock Market Intelligence Cards */}
          {publishedStockData && publishedStockData.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#E2E4E8] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Open_Sans'] font-extrabold text-xl text-[#1E2229]">
                      Curated Indian Market Wire
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54] border border-[#0E8A54]/30">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-[#58606E]">
                    Fundamental company dossiers, market news wires &amp; IPO updates from IndianAPI
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedStockData.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded border border-[#E2E4E8] p-5 shadow-xs hover:border-[#6A1B9A]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3E5F5] text-[#6A1B9A]">
                            {record.endpoint === 'stock' ? (record.query?.toUpperCase() || 'EQUITY') : record.endpoint.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8A92A0]">
                            {record.section} • {record.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8A92A0]">
                          {new Date(record.fetched_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content preview based on endpoint */}
                      {record.endpoint === 'news' && (
                        <div>
                          <h4 className="font-bold text-sm text-[#1E2229] mb-1">
                            {Array.isArray(record.data) && record.data[0]?.title ? record.data[0].title : 'National Financial Market Wire'}
                          </h4>
                          <p className="text-xs text-[#58606E] line-clamp-3 mb-2">
                            {Array.isArray(record.data) && record.data[0]?.summary
                              ? record.data[0].summary
                              : Array.isArray(record.data) && record.data[0]?.description
                              ? record.data[0].description
                              : 'Curated financial news developments across listed Indian equities.'}
                          </p>
                        </div>
                      )}

                      {record.endpoint === 'ipo' && (
                        <div>
                          <h4 className="font-bold text-sm text-[#1E2229] mb-2">
                            Active &amp; Upcoming IPO Pipeline
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            {(Array.isArray(record.data) ? record.data.slice(0, 3) : [record.data]).map((ipo: any, idx: number) => (
                              <div key={idx} className="p-2 bg-[#F4F4F6] rounded flex items-center justify-between">
                                <span className="font-bold text-[#1E2229] truncate max-w-[180px]">{ipo.company || ipo.companyName || ipo.name}</span>
                                <span className="text-[11px] font-mono text-[#6A1B9A] font-bold">₹{ipo.issuePrice || ipo.priceBand || 'TBA'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.endpoint === 'stock' && typeof record.data === 'object' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-base text-[#1E2229]">
                              {(record.data as any).companyName || record.query?.toUpperCase()}
                            </h4>
                            <span className="text-base font-bold text-[#0E8A54] font-mono">
                              ₹{(record.data as any).currentPrice?.NSE || (record.data as any).currentPrice?.BSE || (record.data as any).currentPrice || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-[#58606E] mb-3">
                            Sector: {(record.data as any).industry || 'Publicly Traded Corporate'}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 bg-[#F4F4F6] rounded">
                              <span className="text-[10px] text-[#8A92A0] block">Market Cap</span>
                              <span className="font-bold text-[#1E2229]">{(record.data as any).marketCap || '—'}</span>
                            </div>
                            <div className="p-2 bg-[#F4F4F6] rounded">
                              <span className="text-[10px] text-[#8A92A0] block">P/E</span>
                              <span className="font-bold text-[#1E2229]">{(record.data as any).peRatio || (record.data as any).pe || '—'}</span>
                            </div>
                            <div className="p-2 bg-[#F4F4F6] rounded">
                              <span className="text-[10px] text-[#8A92A0] block">52W High</span>
                              <span className="font-bold text-[#0E8A54]">{(record.data as any).fiftyTwoWeekHigh || '—'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E4E8] flex items-center justify-between text-[11px] text-[#8A92A0]">
                      <span className="flex items-center gap-1 text-[#0E8A54] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54]" />
                        <span>Verified Indian Stock API</span>
                      </span>
                      <span>Category: {record.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail: Columns 9 to 12 (Sticky Utility & Market Summaries) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Live Top Movers Sidebar Widget if trending stocks available */}
          {publishedTrendingStocks.length > 0 ? (
            <div className="bg-white rounded border border-[#E2E4E8] p-5 shadow-[0_1px_3px_rgba(30,34,41,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E4E8] mb-3">
                <h3 className="font-['Open_Sans'] font-bold text-sm tracking-wide uppercase text-[#1E2229] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0E8A54]" />
                  <span>Top Movers (NSE / BSE)</span>
                </h3>
                <span className="text-[10px] font-bold text-[#0E8A54] bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>

              <div className="divide-y divide-[#E2E4E8]/60 text-xs">
                {publishedTrendingStocks.slice(0, 6).map((item) => {
                  const isGainer = item.trend_type === 'gainer';
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div className="truncate max-w-[150px]">
                        <span className="font-semibold text-[#1E2229] block truncate">{item.company_name}</span>
                        <span className="text-[10px] text-[#8A92A0]">{item.exchange_type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#1E2229]">₹{item.price}</div>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                            isGainer ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                          }`}
                        >
                          {isGainer ? '▲' : '▼'} {item.percent_change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fallback Market Watchlist Widget */
            <div className="bg-white rounded border border-[#E2E4E8] p-5 shadow-[0_1px_3px_rgba(30,34,41,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E4E8] mb-4">
                <h3 className="font-['Open_Sans'] font-bold text-sm tracking-wide uppercase text-[#1E2229] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Sector Watchlist</span>
                </h3>
                <span className="text-[11px] font-bold text-[#0E8A54] bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                  BSE / NSE
                </span>
              </div>

              <div className="divide-y divide-[#E2E4E8]/60 text-xs">
                {[
                  { name: 'Nifty Bank', val: '51,980.40', delta: '+1.15%', up: true },
                  { name: 'Nifty IT Index', val: '42,110.80', delta: '+1.42%', up: true },
                  { name: 'Nifty FMCG', val: '58,340.20', delta: '-0.28%', up: false },
                  { name: 'Nifty Pharma', val: '22,650.10', delta: '+0.88%', up: true },
                  { name: 'India VIX (Volatility)', val: '12.45', delta: '-3.12%', up: true },
                ].map((row, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#1E2229]">{row.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-[#58606E] font-medium">{row.val}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                          row.up ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                        }`}
                      >
                        {row.up ? '▲' : '▼'} {row.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Coverage Spotlight */}
          <div className="bg-[#FAF7FC] rounded border border-[#E4B5FF]/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#6A1B9A] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Special Editorial Series</span>
            </div>
            <h4 className="font-['Open_Sans'] font-bold text-base text-[#1E2229] mb-2 leading-snug">
              2026 Fiscal Framework &amp; Sovereign Energy Transitions
            </h4>
            <p className="text-xs text-[#58606E] multilingual-lead mb-4">
              Comprehensive multilingual dispatches analyzing state infrastructure bonds, green capex cycles, and corporate earnings trajectory.
            </p>
            <button
              onClick={() => onSectionChange('Special Coverage')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6A1B9A] hover:text-[#7B1FA2] group"
            >
              <span>Explore Special Coverage</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Supabase Database Connection Card */}
          <div className="bg-white rounded border border-[#E2E4E8] p-5 shadow-xs">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#F3E5F5] text-[#6A1B9A] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1E2229] uppercase tracking-wider">
                    Supabase Storage
                  </h4>
                  <p className="text-[11px] text-[#8A92A0]">PostgreSQL UTF-8 Schema</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#0E8A54]"></span>
            </div>
            <p className="text-xs text-[#58606E] mb-3 leading-relaxed">
              Native multi-language UTF-8 collation with row-level security and grapheme-accurate indexation.
            </p>
            <button
              onClick={onOpenSupabaseModal}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded border border-[#6A1B9A] text-[#6A1B9A] hover:bg-[#F3E5F5] text-xs font-bold transition-colors"
            >
              <span>View Migration SQL &amp; Sync</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Daily Financial Digest Newsletter */}
          <div className="bg-white rounded border border-[#E2E4E8] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#1E2229] font-bold text-sm">
              <Mail className="w-4 h-4 text-[#6A1B9A]" />
              <span>Daily Pre-Market Intelligence</span>
            </div>
            <p className="text-xs text-[#58606E] mb-3">
              Receive curated macro briefs and market openings every morning in your preferred script.
            </p>
            {emailSubscribed ? (
              <div className="p-3 bg-[#E8F5EE] border border-[#0E8A54]/30 rounded text-xs text-[#0E8A54] font-semibold text-center">
                ✓ You are subscribed to morning market dispatch!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="analyst@firm.com"
                  className="w-full px-3 py-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Join 42,000+ Market Subscribers
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

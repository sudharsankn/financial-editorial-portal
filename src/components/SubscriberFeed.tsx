import React, { useState } from 'react';
import { Story, SECTIONS, CATEGORIES, Section, Category, TrendingStockItem, IpoItemRecord } from '../types/story';
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
  Calendar,
  ExternalLink,
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
  publishedTrendingStocks?: TrendingStockItem[];
  publishedIpos?: IpoItemRecord[];
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
  publishedTrendingStocks = [],
  publishedIpos = [],
}) => {
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [trendingTab, setTrendingTab] = useState<'all' | 'gainers' | 'losers'>('all');
  const [ipoFilter, setIpoFilter] = useState<'all' | 'active' | 'upcoming'>('all');

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

  const sectionTabs = ['All', ...SECTIONS];

  const gainers = publishedTrendingStocks.filter((s) => s.trend_type === 'gainer');
  const losers = publishedTrendingStocks.filter((s) => s.trend_type === 'loser');
  const filteredTrending =
    trendingTab === 'gainers' ? gainers : trendingTab === 'losers' ? losers : publishedTrendingStocks;

  const filteredIpos =
    ipoFilter === 'all' ? publishedIpos : publishedIpos.filter((item) => item.status === ipoFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Section Navigation Bar */}
      <div id="section-nav-strip" className="border-b border-[#E2E4E8]">
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
      {publishedTrendingStocks.length > 0 && selectedSection !== 'IPO Watch' && (
        <section id="section-trending-strip" className="bg-white rounded-lg border border-[#E2E4E8] shadow-sm p-4 sm:p-5">
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
                    <span>Live Markets</span>
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

      {/* 3. DEDICATED SECTION VIEW: "IPO Watch" */}
      {selectedSection === 'IPO Watch' && (
        <section id="section-ipo-watch-hub" className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E2E4E8] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-[#6A1B9A]" />
                <h2 className="font-['Open_Sans'] font-extrabold text-xl text-[#1E2229]">
                  Indian IPO Watch: Pipeline &amp; New Listings
                </h2>
              </div>
              <p className="text-xs text-[#58606E]">
                Track current, upcoming and recently closed public issues with live price bands, lot sizes and DRHP filings.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded border border-[#E2E4E8] text-xs">
              {(['all', 'active', 'upcoming'] as const).map((st) => (
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
            <div className="bg-white rounded border border-[#E2E4E8] p-12 text-center text-xs text-[#8A92A0]">
              No IPO records found in this view.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredIpos.map((ipo) => (
                <div key={ipo.id} className="bg-white rounded-lg border border-[#E2E4E8] p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1E2229] truncate" title={ipo.name}>
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

                  <div className="text-xs text-[#58606E] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span>Price Band:</span>
                      <strong className="text-[#1E2229] font-mono text-sm">
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
                        <span>Bidding Dates:</span>
                        <span>{ipo.bidding_start_date} to {ipo.bidding_end_date || 'Close'}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E2E4E8]/60 flex items-center justify-between text-[11px] text-[#8A92A0]">
                    <span className="font-semibold text-[#6A1B9A] bg-[#FAF7FC] px-2 py-0.5 rounded">
                      {ipo.category}
                    </span>
                    {ipo.document_url && (
                      <a
                        href={ipo.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-[#6A1B9A] inline-flex items-center gap-1 font-semibold"
                      >
                        <span>SEBI Filing</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Category Filter Pills */}
      {selectedSection !== 'IPO Watch' && (
        <div id="section-category-pills" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
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
      )}

      {/* 5. Main Editorial Layout (Stories Stream + Sidebar) */}
      {selectedSection !== 'IPO Watch' && (
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
          </div>

          {/* Right Rail: Columns 9 to 12 (Sidebar with Live Top Movers) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Live Top Movers Sidebar Widget */}
            {publishedTrendingStocks.length > 0 && (
              <div id="section-sidebar-movers" className="bg-white rounded border border-[#E2E4E8] p-5 shadow-[0_1px_3px_rgba(30,34,41,0.04)]">
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
            )}

            {/* Special Coverage Spotlight */}
            <div id="section-special-series" className="bg-[#FAF7FC] rounded border border-[#E4B5FF]/50 p-5 shadow-xs">
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

            {/* Daily Financial Digest Newsletter */}
            <div id="section-newsletter-widget" className="bg-white rounded border border-[#E2E4E8] p-5 shadow-xs">
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
      )}
    </div>
  );
};

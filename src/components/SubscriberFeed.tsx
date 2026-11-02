import React, { useState } from 'react';
import { Story, SECTIONS, CATEGORIES, Section, Category } from '../types/story';
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
}) => {
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* 1. Section Navigation Bar */}
      <div className="border-b border-[#E2E4E8] mb-6">
        <div className="flex items-center space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar py-1">
          {sectionTabs.map((tab) => {
            const isActive = selectedSection === tab;
            return (
              <button
                key={tab}
                onClick={() => onSectionChange(tab)}
                className={`relative pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#6A1B9A]'
                    : 'text-[#58606E] hover:text-[#1E2229]'
                }`}
              >
                <span>{tab === 'All' ? 'All Stories' : tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6A1B9A] rounded-t-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category Chips Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
        <div className="flex items-center text-xs text-[#8A92A0] font-semibold uppercase pr-2 border-r border-[#E2E4E8] shrink-0">
          <Filter className="w-3.5 h-3.5 mr-1 text-[#6A1B9A]" />
          <span>Category</span>
        </div>

        <button
          onClick={() => onCategoryChange('All')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'All'
              ? 'bg-[#6A1B9A] text-white shadow-xs'
              : 'bg-white border border-[#E2E4E8] text-[#58606E] hover:border-[#C8CBD0]'
          }`}
        >
          All Topics
        </button>

        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#6A1B9A] text-white shadow-xs'
                  : 'bg-white border border-[#E2E4E8] text-[#58606E] hover:border-[#6A1B9A]/50 hover:text-[#1E2229]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. Main Editorial 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed: Columns 1 to 8 */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded border border-[#E2E4E8] p-5 h-80">
                  <div className="w-full aspect-[7/4] bg-[#EBEEF7] rounded mb-4" />
                  <div className="h-4 bg-[#EBEEF7] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[#EBEEF7] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-[#EBEEF7] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded border border-[#E2E4E8] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F3E5F5] text-[#6A1B9A] flex items-center justify-center mx-auto mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#1E2229] mb-1">No stories match your filter</h3>
              <p className="text-sm text-[#58606E] max-w-md mx-auto mb-5">
                Try selecting &ldquo;All Stories&rdquo; or clearing the active category filters to see more editorial analysis.
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

        {/* Right Rail: Columns 9 to 12 (Sticky Utility & Market Summaries) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Market Watchlist Widget */}
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

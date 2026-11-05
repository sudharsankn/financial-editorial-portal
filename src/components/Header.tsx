import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Database,
  Globe,
  PlusCircle,
  FileCode2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { checkSupabaseConnection } from '../lib/supabase';

interface HeaderProps {
  currentView: 'feed' | 'admin' | 'article';
  onNavigate: (view: 'feed' | 'admin', canonicalUrl?: string) => void;
  onOpenSupabaseModal: () => void;
  onOpenNextJsModal: () => void;
  onNewStory: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSupabaseModal,
  onOpenNextJsModal,
  onNewStory,
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    mode: 'supabase' | 'local';
  }>({ connected: false, mode: 'local' });

  useEffect(() => {
    checkSupabaseConnection().then((res) => {
      setDbStatus({ connected: res.connected, mode: res.mode });
    });
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="bg-white border-b border-[#E2E4E8] sticky top-0 z-30 shadow-[0_1px_3px_rgba(30,34,41,0.03)]">
      {/* Brand & Top Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo & Editorial Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded bg-[#6A1B9A] flex items-center justify-center text-white font-extrabold text-xl shadow-[0_2px_8px_rgba(106,27,154,0.25)] transition-transform group-hover:scale-105">
              FI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#1E2229] uppercase font-['Open_Sans']">
                  Financial Intelligence
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F3E5F5] text-[#6A1B9A]">
                  Editorial
                </span>
              </div>
              <p className="text-xs text-[#58606E] flex items-center gap-2 font-medium">
                <span>{todayStr}</span>
                <span className="w-1 h-1 rounded-full bg-[#C8CBD0]"></span>
                <span className="text-[#8A92A0]">Bilingual Market Desk</span>
              </p>
            </div>
          </button>
        </div>

        {/* Global Utilities: Search, Language, Mode Switch, DB Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-60 md:w-52 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A92A0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search stories, scripts..."
              className="w-full bg-[#F4F4F6] hover:bg-[#EBEEF7] focus:bg-white text-xs text-[#1E2229] pl-9 pr-3 py-1.5 rounded border border-[#E2E4E8] focus:border-[#6A1B9A] focus:ring-1 focus:ring-[#6A1B9A] transition-colors outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A92A0] hover:text-[#1E2229]"
              >
                ×
              </button>
            )}
          </div>

          {/* Script / Language Selector */}
          <div className="flex items-center bg-[#F4F4F6] border border-[#E2E4E8] rounded px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-[#6A1B9A] mr-1.5 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs text-[#1E2229] font-medium outline-none cursor-pointer pr-1"
            >
              <option value="All">All Scripts (UTF-8)</option>
              <option value="en">English</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>

          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabaseModal}
            title="Supabase Database Status & Setup"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] bg-white text-xs font-semibold text-[#1E2229] transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-[#6A1B9A]" />
            <span className="hidden sm:inline">Supabase</span>
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? 'bg-[#0E8A54]' : 'bg-[#E4B5FF] border border-[#6A1B9A]'
              }`}
            ></span>
          </button>

          {/* Next.js & Vercel Export Guide */}
          <button
            onClick={onOpenNextJsModal}
            title="Next.js App Router code & Vercel deployment guide"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] bg-white text-xs font-semibold text-[#58606E] hover:text-[#1E2229] transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#6A1B9A]" />
            <span className="hidden md:inline">Vercel Deploy</span>
          </button>

          {/* View Switcher: Subscriber vs Admin */}
          {currentView !== 'admin' ? (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onNewStory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Story</span>
              </button>
              <button
                onClick={() => onNavigate('feed')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#6A1B9A] text-[#6A1B9A] hover:bg-[#F3E5F5] text-xs font-bold transition-all"
              >
                <span>Subscriber View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';

interface HedgeNavbarProps {
  onNavigateHome: () => void;
  onOpenSidebar: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onOpenSubscribe: () => void;
}

export const HedgeNavbar: React.FC<HedgeNavbarProps> = ({
  onNavigateHome,
  onOpenSidebar,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  bookmarkCount,
  onOpenBookmarks,
  onOpenSubscribe,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localSearch);
    setShowSearch(false);
  };

  return (
    <>
      <header id="section-header-navbar" className="sticky top-0 z-40 bg-white border-b border-[#E6E6E6] shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 h-[60px] flex items-center justify-between">
          {/* Left: Hamburger Menu */}
          <div className="w-1/3 flex items-center">
            <button
              id="btn-navbar-menu"
              type="button"
              onClick={onOpenSidebar}
              className="p-2 -ml-2 text-[#262B2E] hover:text-[#903E97] transition-colors focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>

          {/* Center: Hedge Ohari Brand Logo */}
          <div className="w-1/3 flex items-center justify-center">
            <button
              id="btn-navbar-logo"
              type="button"
              onClick={onNavigateHome}
              className="focus:outline-none cursor-pointer group flex items-center justify-center"
            >
              <img
                src="/hedge-ohari-logo.svg"
                alt="Hedge Ohari"
                className="h-[46px] sm:h-[50px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
                onError={(e) => {
                  // Fallback text if SVG fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = document.getElementById('hedge-logo-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="hedge-logo-fallback" style={{ display: 'none' }} className="text-center">
                <span className="font-['Open_Sans'] font-black text-2xl text-[#903E97] tracking-tight">
                  HEDGE <span className="font-normal text-[#262B2E]">ഓഹരി</span>
                </span>
              </div>
            </button>
          </div>

          {/* Right: Subscribe, Bookmark Count, Search, Sign In / Admin */}
          <div className="w-1/3 flex items-center justify-end gap-2 sm:gap-4 text-xs font-semibold">
            {/* Subscribe Button */}
            <button
              id="btn-navbar-subscribe"
              type="button"
              onClick={onOpenSubscribe}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider bg-[#903E97] hover:bg-[#A045A8] text-white transition-all shadow-xs cursor-pointer"
            >
              SUBSCRIBE
            </button>

            {/* Bookmark Counter */}
            <button
              id="btn-navbar-bookmarks"
              type="button"
              onClick={onOpenBookmarks}
              className="flex items-center gap-1 text-[#262B2E] hover:text-[#903E97] p-1.5 transition-colors"
              title="Saved Articles"
            >
              <Bookmark className="w-4 h-4 fill-current text-[#903E97]" />
              <span className="text-xs font-bold font-mono">{bookmarkCount}</span>
            </button>

            {/* Search Toggle Icon */}
            <button
              id="btn-navbar-search"
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 text-[#262B2E] hover:text-[#903E97] transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Portal Shortcut */}
            <button
              id="btn-navbar-admin"
              type="button"
              onClick={onOpenAdmin}
              className="px-2.5 py-1 text-[11px] font-bold text-[#903E97] border border-[#903E97]/40 hover:bg-[#FAF7FC] rounded transition-colors uppercase tracking-wider"
            >
              ADMIN
            </button>
          </div>
        </div>

        {/* Fly-in Search Bar (Exact Hedge Ohari Pattern) */}
        {showSearch && (
          <div id="flyout-search-bar" className="border-t border-[#E6E6E6] bg-[#F2F2F2] py-3 px-4 sm:px-6 transition-all duration-300">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
                <input
                  id="input-navbar-search"
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search articles in Malayalam or English..."
                  autoFocus
                  className="w-full bg-white border border-[#E6E6E6] rounded px-4 py-2 text-xs font-medium text-[#262B2E] focus:border-[#903E97] outline-none"
                />
                <button
                  id="btn-navbar-search-submit"
                  type="submit"
                  className="px-5 py-2 rounded bg-[#903E97] hover:bg-[#A045A8] text-white text-xs font-bold uppercase transition-colors"
                >
                  Search
                </button>
              </form>
              <button
                id="btn-navbar-search-close"
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 text-[#676A6C] hover:text-[#262B2E]"
                title="Close Search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};


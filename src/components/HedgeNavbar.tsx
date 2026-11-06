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
  User,
} from 'lucide-react';
import { UserAccount } from '../lib/auth';

interface HedgeNavbarProps {
  onNavigateHome: () => void;
  onOpenSidebar?: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onOpenSubscribe: () => void;
  isBookmarksActive?: boolean;
  currentUser?: UserAccount | null;
  onOpenSignIn: () => void;
  onOpenMyAccount: () => void;
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
  isBookmarksActive = false,
  currentUser = null,
  onOpenSignIn,
  onOpenMyAccount,
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
          {/* Left: Drawer Hamburger & Brand Logo */}
          <div className="flex items-center gap-3">
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="p-1.5 text-[#262B2E] hover:text-[#903E97] transition-colors rounded-lg hover:bg-black/5 cursor-pointer"
                title="Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <button
              id="btn-navbar-logo"
              type="button"
              onClick={onNavigateHome}
              className="focus:outline-none cursor-pointer group flex items-center gap-2"
            >
              <img
                src="/hedge-ohari-logo.svg"
                alt="Hedge Ohari"
                className="h-[44px] sm:h-[48px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
                onError={(e) => {
                  // Fallback text if SVG fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = document.getElementById('hedge-logo-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="hedge-logo-fallback" style={{ display: 'none' }} className="text-left">
                <span className="font-['Open_Sans'] font-black text-2xl text-[#903E97] tracking-tight">
                  HEDGE <span className="font-normal text-[#262B2E]">ഓഹരി</span>
                </span>
              </div>
            </button>
          </div>

          {/* Right: Subscribe, Bookmark Count, Search, Sign In / My Account, Admin */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 text-xs font-semibold">
            {/* User Account / Sign In */}
            {currentUser ? (
              <button
                id="btn-navbar-account"
                type="button"
                onClick={onOpenMyAccount}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FAF7FC] border border-[#EADDF0] text-[#903E97] hover:bg-[#F2E8F7] transition-all cursor-pointer font-bold text-xs"
                title="എന്റെ അക്കൗണ്ട് (My Account)"
              >
                <div className="w-5 h-5 rounded-full bg-[#903E97] text-white flex items-center justify-center text-[10px] font-black uppercase">
                  {(currentUser.name || 'U').charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate text-xs font-semibold text-[#262B2E]">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                id="btn-navbar-signin"
                type="button"
                onClick={onOpenSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E6E6] hover:border-[#903E97]/50 text-xs font-bold text-[#262B2E] hover:text-[#903E97] hover:bg-[#FAF7FC] transition-all uppercase tracking-wider cursor-pointer"
                title="Sign In to Journal"
              >
                <User className="w-3.5 h-3.5 text-[#903E97]" />
                <span>SIGN IN</span>
              </button>
            )}

            {/* Subscribe Button */}
            <button
              id="btn-navbar-subscribe"
              type="button"
              onClick={onOpenSubscribe}
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#903E97] hover:bg-[#A045A8] text-white transition-all shadow-xs cursor-pointer"
            >
              SUBSCRIBE
            </button>

            {/* Bookmark Counter */}
            <button
              id="btn-navbar-bookmarks"
              type="button"
              onClick={onOpenBookmarks}
              className={`flex items-center gap-1.5 p-1.5 rounded transition-all cursor-pointer ${
                isBookmarksActive
                  ? 'bg-[#FAF7FC] text-[#903E97] ring-1 ring-[#903E97]/40 shadow-2xs font-bold'
                  : 'text-[#262B2E] hover:text-[#903E97]'
              }`}
              title={isBookmarksActive ? 'Viewing Bookmarked Articles (Click to view all)' : 'View Bookmarked Articles'}
            >
              <Bookmark className="w-4 h-4 fill-current text-[#903E97]" />
              <span className="text-xs font-bold font-mono">{bookmarkCount}</span>
            </button>

            {/* Search Toggle Icon */}
            <button
              id="btn-navbar-search"
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 text-[#262B2E] hover:text-[#903E97] transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Portal Shortcut */}
            <button
              id="btn-navbar-admin"
              type="button"
              onClick={onOpenAdmin}
              className="px-2 py-1 text-[11px] font-bold text-[#903E97] border border-[#903E97]/40 hover:bg-[#FAF7FC] rounded transition-colors uppercase tracking-wider cursor-pointer"
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


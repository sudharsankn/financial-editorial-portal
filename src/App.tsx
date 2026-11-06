/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Story, StoryFormData, MarketTickerItem } from './types/story';
import { fetchSavedStockData, fetchTrendingStocks, fetchIpos, fetchLiveMarketSnapshot } from './lib/marketData';
import { TrendingStockItem, IpoItemRecord } from './types/story';
import {
  fetchPublishedStories,
  fetchAllStoriesForAdmin,
  fetchStoryByCanonicalUrl,
  fetchMarketTickers,
  saveStory,
  deleteStory,
} from './lib/supabase';
import { HedgeNavbar } from './components/HedgeNavbar';
import { HedgeDrawer } from './components/HedgeDrawer';
import { HedgeHomePage } from './components/HedgeHomePage';
import { HedgeFooter } from './components/HedgeFooter';
import { MarketTicker } from './components/MarketTicker';
import { ArticleDetail } from './components/ArticleDetail';
import { AdminPanel } from './components/AdminPanel';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { NextJsExportModal } from './components/NextJsExportModal';
import { SubscriptionPage } from './components/SubscriptionPage';
import { SignInModal } from './components/SignInModal';
import { MyAccountPage } from './components/MyAccountPage';
import { StaticPageViewer, StaticPageType } from './components/StaticPageViewer';
import { getCurrentUser, logoutUser, UserAccount } from './lib/auth';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<
    'feed' | 'admin' | 'article' | 'subscribe' | 'my-account' | 'about-us' | 'contact-us' | 'terms-of-use' | 'privacy-policy'
  >(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'subscribe') return 'subscribe';
    if (path === 'my-account') return 'my-account';
    if (path === 'about-us') return 'about-us';
    if (path === 'contact-us') return 'contact-us';
    if (path === 'terms-of-use') return 'terms-of-use';
    if (path === 'privacy-policy') return 'privacy-policy';
    if (path === 'admin') return 'admin';
    if (path) return 'article';
    return 'feed';
  });
  const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'stories' | 'markets' | 'stocks'>('stories');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Filter & Search state
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stories Data
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [allAdminStories, setAllAdminStories] = useState<Story[]>([]);
  const [activeArticle, setActiveArticle] = useState<Story | null>(null);
  const [activeEditingStory, setActiveEditingStory] = useState<Story | null>(null);
  const [marketTickers, setMarketTickers] = useState<MarketTickerItem[]>([]);
  const [publishedStockData, setPublishedStockData] = useState<any[]>([]);
  const [publishedTrendingStocks, setPublishedTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [publishedIpos, setPublishedIpos] = useState<IpoItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [nextJsModalOpen, setNextJsModalOpen] = useState(false);

  // Saved Bookmarks Set & Real-Time Sync
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('hedge_saved_bookmarks');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('hedge_saved_bookmarks', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  // Load published stories for subscriber feed
  const loadSubscriberStories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublishedStories({
        section: selectedSection,
        category: selectedCategory,
        searchQuery: searchQuery,
        language: selectedLanguage,
      });
      setPublishedStories(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedCategory, searchQuery, selectedLanguage]);

  // Load admin stories
  const loadAdminStories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllStoriesForAdmin();
      setAllAdminStories(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // Load market tickers from Supabase or cached storage
  const loadMarketTickers = useCallback(async () => {
    try {
      const data = await fetchMarketTickers();
      setMarketTickers(data);
    } catch {}
  }, []);

  // Fetch real-time live market snapshot (Indices, Movers, and IPOs) directly from live exchange feeds
  const refreshLiveMarketData = useCallback(async () => {
    try {
      const snapshot = await fetchLiveMarketSnapshot();
      if (snapshot.indices && snapshot.indices.length > 0) {
        setMarketTickers(snapshot.indices);
      }
      if (snapshot.trending && snapshot.trending.length > 0) {
        setPublishedTrendingStocks(snapshot.trending);
      }
      if (snapshot.ipos && snapshot.ipos.length > 0) {
        setPublishedIpos(snapshot.ipos);
      }
    } catch (err) {
      console.warn('Live market refresh error:', err);
    }
  }, []);

  // Load published stock data, trending stocks & IPOs
  const loadPublishedStockData = useCallback(async () => {
    try {
      const [generalData, trendingData, ipoData] = await Promise.all([
        fetchSavedStockData({
          is_published: true,
          section: selectedSection !== 'All' ? selectedSection : undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
        }),
        fetchTrendingStocks(true),
        fetchIpos(true),
      ]);
      setPublishedStockData(generalData);
      if (trendingData.length > 0) setPublishedTrendingStocks(trendingData);
      if (ipoData.length > 0) setPublishedIpos(ipoData);
    } catch {}
  }, [selectedSection, selectedCategory]);

  // Reload based on view
  useEffect(() => {
    if (currentView === 'feed') {
      loadSubscriberStories();
      loadPublishedStockData();
      refreshLiveMarketData();
    } else if (currentView === 'admin') {
      loadAdminStories();
    }
  }, [currentView, loadSubscriberStories, loadAdminStories, loadPublishedStockData, refreshLiveMarketData]);

  // Periodic Live Market Polling (every 60 seconds while viewing the portal)
  useEffect(() => {
    if (currentView === 'feed') {
      const timer = setInterval(() => {
        refreshLiveMarketData();
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [currentView, refreshLiveMarketData]);

  useEffect(() => {
    loadMarketTickers();
  }, [loadMarketTickers]);

  // Load specific article when canonical URL changes
  useEffect(() => {
    if (currentView === 'article' && currentCanonicalUrl) {
      setLoading(true);
      fetchStoryByCanonicalUrl(currentCanonicalUrl).then((story) => {
        setActiveArticle(story);
        setLoading(false);
      });
    }
  }, [currentView, currentCanonicalUrl]);

  // Handle URL / Browser History synchronization
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'subscribe') {
        setCurrentView('subscribe');
        setCurrentCanonicalUrl(null);
      } else if (path === 'admin') {
        setCurrentView('admin');
        setCurrentCanonicalUrl(null);
      } else if (path) {
        setCurrentCanonicalUrl(path);
        setCurrentView('article');
      } else {
        setCurrentView('feed');
        setCurrentCanonicalUrl(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate to story detail
  const handleSelectStory = (canonicalUrl: string) => {
    setCurrentCanonicalUrl(canonicalUrl);
    setCurrentView('article');
    window.history.pushState(null, '', `/${canonicalUrl}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to any view / page
  const handleNavigate = (
    view:
      | 'feed'
      | 'admin'
      | 'subscribe'
      | 'my-account'
      | 'about-us'
      | 'contact-us'
      | 'terms-of-use'
      | 'privacy-policy'
  ) => {
    setCurrentView(view);
    setCurrentCanonicalUrl(null);
    if (view === 'feed') {
      window.history.pushState(null, '', '/');
    } else {
      window.history.pushState(null, '', `/${view}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setSignInModalOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    handleNavigate('feed');
  };

  const handleUpdateUser = (updated: UserAccount) => {
    setCurrentUser(updated);
  };

  // Admin: Save story
  const handleSaveStory = async (formData: StoryFormData) => {
    const res = await saveStory(formData);
    if (res.success) {
      await loadAdminStories();
      await loadSubscriberStories();
    }
    return res;
  };

  // Admin: Delete story
  const handleDeleteStory = async (id: string) => {
    const res = await deleteStory(id);
    if (res.success) {
      await loadAdminStories();
      await loadSubscriberStories();
    }
    return res;
  };

  // Admin: Start creating new story
  const handleNewStory = () => {
    setActiveEditingStory(null);
    setCurrentView('admin');
  };

  // Related stories for article details
  const relatedStories = activeArticle
    ? publishedStories.filter(
        (s) => s.id !== activeArticle.id && s.section === activeArticle.section
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2F2] text-[#262B2E] font-['Open_Sans',_sans-serif]">
      {/* 1. Header (Exact Hedge Ohari Navbar: Hamburger Left, Logo Center, Subscribe/Bookmark/Search Right) */}
      <HedgeNavbar
        onNavigateHome={() => {
          setShowOnlyBookmarks(false);
          handleNavigate('feed');
        }}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenAdmin={() => handleNavigate('admin')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          if (currentView !== 'feed') setCurrentView('feed');
        }}
        bookmarkCount={bookmarkedIds.size}
        isBookmarksActive={showOnlyBookmarks}
        onOpenBookmarks={() => {
          setShowOnlyBookmarks((prev) => !prev);
          setSelectedSection('All');
          if (currentView !== 'feed') handleNavigate('feed');
        }}
        onOpenSubscribe={() => {
          handleNavigate('subscribe');
        }}
        currentUser={currentUser}
        onOpenSignIn={() => setSignInModalOpen(true)}
        onOpenMyAccount={() => handleNavigate('my-account')}
      />

      {/* 2. Top Live Scrolling Market Index, Movers & Upcoming IPO Ticker */}
      {currentView !== 'admin' && (
        <MarketTicker
          tickers={marketTickers}
          trendingStocks={publishedTrendingStocks}
          ipos={publishedIpos}
          onOpenAdminMarkets={() => {
            setAdminTab('markets');
            handleNavigate('admin');
          }}
          onSelectCategory={(sec) => {
            setShowOnlyBookmarks(false);
            setSelectedSection(sec);
          }}
          onOpenIpoWatch={() => {
            setShowOnlyBookmarks(false);
            setSelectedSection('IPO Watch');
          }}
        />
      )}

      {/* 3. Slide-out Navigation Drawer (.aside-menu-container) */}
      <HedgeDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedSection={selectedSection}
        onSelectSection={(sec) => {
          setShowOnlyBookmarks(false);
          setSelectedSection(sec);
          if (currentView !== 'feed') handleNavigate('feed');
        }}
        onOpenSubscribe={() => {
          setSidebarOpen(false);
          handleNavigate('subscribe');
        }}
        onOpenBookmarks={() => {
          setShowOnlyBookmarks(true);
          setSelectedSection('All');
          if (currentView !== 'feed') handleNavigate('feed');
        }}
        onOpenAdmin={() => handleNavigate('admin')}
        currentUser={currentUser}
        onOpenSignIn={() => {
          setSidebarOpen(false);
          setSignInModalOpen(true);
        }}
        onOpenMyAccount={() => {
          setSidebarOpen(false);
          handleNavigate('my-account');
        }}
        onNavigatePage={(page) => {
          setSidebarOpen(false);
          handleNavigate(page);
        }}
      />

      {/* 4. Main Views */}
      <main className="flex-1">
        {/* VIEW A: HEDGE OHARI EXACT HOMEPAGE (Left Categories, Center Grid + Market Desk, Right Subscription Box) */}
        {currentView === 'feed' && (
          <HedgeHomePage
            stories={publishedStories}
            loading={loading}
            selectedSection={selectedSection}
            onSelectSection={(sec) => {
              setShowOnlyBookmarks(false);
              setSelectedSection(sec);
            }}
            onSelectStory={handleSelectStory}
            onOpenSubscribe={() => handleNavigate('subscribe')}
            marketTickers={marketTickers}
            trendingStocks={publishedTrendingStocks}
            ipos={publishedIpos}
            onRefreshLiveMarket={refreshLiveMarketData}
            onSearchSymbol={(sym) => {
              setSearchQuery(sym);
              if (currentView !== 'feed') setCurrentView('feed');
            }}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            showOnlyBookmarks={showOnlyBookmarks}
            onToggleShowBookmarks={setShowOnlyBookmarks}
          />
        )}

        {/* VIEW B: ARTICLE DETAIL VIEW */}
        {currentView === 'article' && activeArticle && (
          <ArticleDetail
            story={activeArticle}
            relatedStories={relatedStories}
            onBack={() => handleNavigate('feed')}
            onSelectRelated={handleSelectStory}
            onEditStory={(story) => {
              setActiveEditingStory(story);
              setAdminTab('stories');
              setCurrentView('admin');
            }}
            isBookmarked={bookmarkedIds.has(activeArticle.id)}
            onToggleBookmark={() => toggleBookmark(activeArticle.id)}
          />
        )}

        {/* ARTICLE NOT FOUND */}
        {currentView === 'article' && !activeArticle && !loading && (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <h2 className="text-xl font-bold mb-2">Story Not Found</h2>
            <p className="text-sm text-[#676A6C] mb-4">
              The article &ldquo;{currentCanonicalUrl}&rdquo; may have been moved or retired.
            </p>
            <button
              onClick={() => handleNavigate('feed')}
              className="px-4 py-2 rounded bg-[#903E97] text-white text-xs font-bold"
            >
              Back to Stories Feed
            </button>
          </div>
        )}

        {/* VIEW C: ADMIN EDITORIAL DASHBOARD */}
        {currentView === 'admin' && (
          <div className="bg-[#F4F4F6] min-h-screen py-4">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleNavigate('feed')}
                className="text-xs font-bold text-[#903E97] hover:underline flex items-center gap-1"
              >
                &larr; Back to Public Portal
              </button>
            </div>
            <AdminPanel
              stories={allAdminStories}
              loading={loading}
              onSaveStory={handleSaveStory}
              onDeleteStory={handleDeleteStory}
              onViewStory={handleSelectStory}
              activeEditingStory={activeEditingStory}
              onClearActiveStory={() => setActiveEditingStory(null)}
              marketTickers={marketTickers}
              onRefreshMarketTickers={loadMarketTickers}
              onRefreshStories={loadAdminStories}
              initialAdminTab={adminTab}
            />
          </div>
        )}
        {/* VIEW D: DEDICATED SUBSCRIPTION PAGE */}
        {currentView === 'subscribe' && (
          <SubscriptionPage
            onBackHome={() => handleNavigate('feed')}
            onSelectStory={handleSelectStory}
            onOpenMyAccount={() => handleNavigate('my-account')}
          />
        )}

        {/* VIEW E: SUBSCRIBER MY ACCOUNT DASHBOARD */}
        {currentView === 'my-account' && (
          currentUser ? (
            <MyAccountPage
              user={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNavigateHome={() => handleNavigate('feed')}
              onNavigateSubscribe={() => handleNavigate('subscribe')}
              onNavigateBookmarks={() => {
                setShowOnlyBookmarks(true);
                handleNavigate('feed');
              }}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#903E97]/10 text-[#903E97] flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <h2 className="text-xl font-bold text-[#262B2E]">ലോഗിൻ ആവശ്യമാണ് (Sign In Required)</h2>
              <p className="text-xs text-[#676A6C] max-w-sm mx-auto">
                നിങ്ങളുടെ സബ്സ്ക്രിപ്ഷനും പ്രൊഫൈൽ വിവരങ്ങളും പരിശോധിക്കാൻ ദയവായി അക്കൗണ്ടിലേക്ക് ലോഗിൻ ചെയ്യുക.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSignInModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#903E97] text-white text-xs font-bold shadow-md hover:bg-[#792f80] transition-colors cursor-pointer"
                >
                  ലോഗിൻ ചെയ്യുക (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('feed')}
                  className="px-5 py-2.5 rounded-xl border border-[#E6E6E6] text-[#262B2E] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                >
                  ഹോം പേജിലേക്ക് (Home)
                </button>
              </div>
            </div>
          )
        )}
        {/* VIEW F: STATIC IN-APP EDITORIAL & LEGAL PAGES */}
        {(['about-us', 'contact-us', 'terms-of-use', 'privacy-policy'] as StaticPageType[]).includes(
          currentView as StaticPageType
        ) && (
          <StaticPageViewer
            pageType={currentView as StaticPageType}
            onNavigateHome={() => handleNavigate('feed')}
            onNavigatePage={(page) => handleNavigate(page)}
          />
        )}
      </main>

      {/* 4. Hedge Ohari Minimalist Brand Footer */}
      {currentView !== 'admin' && (
        <HedgeFooter onNavigatePage={(page) => handleNavigate(page)} />
      )}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onNavigateSubscribe={() => handleNavigate('subscribe')}
      />

      {/* Modals for Supabase & Next.js export */}
      <SupabaseGuideModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onRefreshData={loadSubscriberStories}
      />
      <NextJsExportModal
        isOpen={nextJsModalOpen}
        onClose={() => setNextJsModalOpen(false)}
      />
    </div>
  );
}

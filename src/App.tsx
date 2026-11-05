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

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<'feed' | 'admin' | 'article'>('feed');
  const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'stories' | 'markets' | 'stocks'>('stories');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Bookmarks count from local storage
  const [bookmarkCount, setBookmarkCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('hedge_saved_bookmarks');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  });

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
      if (path && path !== 'admin') {
        setCurrentCanonicalUrl(path);
        setCurrentView('article');
      } else if (path === 'admin') {
        setCurrentView('admin');
        setCurrentCanonicalUrl(null);
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

  // Navigate back to feed or admin
  const handleNavigate = (view: 'feed' | 'admin') => {
    if (view === 'feed') {
      setCurrentView('feed');
      setCurrentCanonicalUrl(null);
      window.history.pushState(null, '', '/');
    } else if (view === 'admin') {
      setCurrentView('admin');
      window.history.pushState(null, '', '/admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        onNavigateHome={() => handleNavigate('feed')}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenAdmin={() => handleNavigate('admin')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          if (currentView !== 'feed') setCurrentView('feed');
        }}
        bookmarkCount={bookmarkCount}
        onOpenBookmarks={() => {
          // If bookmarks clicked, toggle bookmarks filter
          setSelectedSection('All');
        }}
        onOpenSubscribe={() => {
          window.open('https://hedgeohari.com/subscribe', '_blank');
        }}
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
          onSelectCategory={(sec) => setSelectedSection(sec)}
          onOpenIpoWatch={() => setSelectedSection('IPO Watch')}
        />
      )}

      {/* 3. Slide-out Navigation Drawer (.aside-menu-container) */}
      <HedgeDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedSection={selectedSection}
        onSelectSection={(sec) => {
          setSelectedSection(sec);
          if (currentView !== 'feed') handleNavigate('feed');
        }}
        onOpenSubscribe={() => {
          window.open('https://hedgeohari.com/subscribe', '_blank');
        }}
        onOpenBookmarks={() => {
          setSelectedSection('All');
        }}
        onOpenAdmin={() => handleNavigate('admin')}
      />

      {/* 4. Main Views */}
      <main className="flex-1">
        {/* VIEW A: HEDGE OHARI EXACT HOMEPAGE (Left Categories, Center Grid + Market Desk, Right Subscription Box) */}
        {currentView === 'feed' && (
          <HedgeHomePage
            stories={publishedStories}
            loading={loading}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            onSelectStory={handleSelectStory}
            onOpenSubscribe={() => window.open('https://hedgeohari.com/subscribe', '_blank')}
            marketTickers={marketTickers}
            trendingStocks={publishedTrendingStocks}
            ipos={publishedIpos}
            onRefreshLiveMarket={refreshLiveMarketData}
            onSearchSymbol={(sym) => {
              setSearchQuery(sym);
              if (currentView !== 'feed') setCurrentView('feed');
            }}
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
            <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
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
      </main>

      {/* 4. Hedge Ohari Minimalist Brand Footer */}
      {currentView === 'feed' && <HedgeFooter />}

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

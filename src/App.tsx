/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Story, StoryFormData, MarketTickerItem } from './types/story';
import { fetchSavedStockData, fetchTrendingStocks, fetchIpos, StockDataRecord } from './lib/indianStockApi';
import { TrendingStockItem, IpoItemRecord } from './types/story';
import {
  fetchPublishedStories,
  fetchAllStoriesForAdmin,
  fetchStoryByCanonicalUrl,
  fetchMarketTickers,
  saveStory,
  deleteStory,
} from './lib/supabase';
import { MarketTicker } from './components/MarketTicker';
import { Header } from './components/Header';
import { SubscriberFeed } from './components/SubscriberFeed';
import { ArticleDetail } from './components/ArticleDetail';
import { AdminPanel } from './components/AdminPanel';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { NextJsExportModal } from './components/NextJsExportModal';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<'feed' | 'admin' | 'article'>('feed');
  const [currentCanonicalUrl, setCurrentCanonicalUrl] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'stories' | 'markets' | 'stocks'>('stories');

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
  const [publishedStockData, setPublishedStockData] = useState<StockDataRecord[]>([]);
  const [publishedTrendingStocks, setPublishedTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [publishedIpos, setPublishedIpos] = useState<IpoItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [nextJsModalOpen, setNextJsModalOpen] = useState(false);


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

  // Load market tickers
  const loadMarketTickers = useCallback(async () => {
    try {
      const data = await fetchMarketTickers();
      setMarketTickers(data);
    } catch {}
  }, []);

  // Load published Indian stock data, trending stocks & IPOs
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
      setPublishedTrendingStocks(trendingData);
      setPublishedIpos(ipoData);
    } catch {}
  }, [selectedSection, selectedCategory]);

  // Reload based on view
  useEffect(() => {
    if (currentView === 'feed') {
      loadSubscriberStories();
      loadPublishedStockData();
    } else if (currentView === 'admin') {
      loadAdminStories();
    }
  }, [currentView, loadSubscriberStories, loadAdminStories, loadPublishedStockData]);

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
      } else {
        setCurrentView('feed');
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
  };

  // Navigate back to feed or admin
  const handleNavigate = (view: 'feed' | 'admin', canonicalUrl?: string) => {
    if (view === 'feed') {
      setCurrentView('feed');
      setCurrentCanonicalUrl(null);
      window.history.pushState(null, '', '/');
    } else if (view === 'admin') {
      setCurrentView('admin');
      window.history.pushState(null, '', '/admin');
    }
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
    <div className="min-h-screen flex flex-col bg-[#F4F4F6] text-[#1E2229]">
      {/* 1. Live Market Ticker Tape */}
      <MarketTicker
        tickers={marketTickers}
        onOpenAdminMarkets={() => {
          setAdminTab('markets');
          setCurrentView('admin');
        }}
      />

      {/* 2. Top Header Navigation */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenNextJsModal={() => setNextJsModalOpen(true)}
        onNewStory={handleNewStory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* 3. Main Views */}
      <main className="flex-1">
        {currentView === 'feed' && (
          <SubscriberFeed
            stories={publishedStories}
            loading={loading}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onSelectStory={handleSelectStory}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
            publishedTrendingStocks={publishedTrendingStocks}
            publishedIpos={publishedIpos}
          />
        )}

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

        {currentView === 'article' && !activeArticle && !loading && (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <h2 className="text-xl font-bold mb-2">Story Not Found</h2>
            <p className="text-sm text-[#58606E] mb-4">
              The article &ldquo;{currentCanonicalUrl}&rdquo; may have been moved or retired.
            </p>
            <button
              onClick={() => handleNavigate('feed')}
              className="px-4 py-2 rounded bg-[#6A1B9A] text-white text-xs font-bold"
            >
              Back to Stories Feed
            </button>
          </div>
        )}

        {currentView === 'admin' && (
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
        )}
      </main>


      {/* 4. Editorial Footer */}
      <footer className="bg-white border-t border-[#E2E4E8] mt-auto py-8 text-xs text-[#58606E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E2E4E8]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#6A1B9A] text-white flex items-center justify-center font-bold text-sm">
                FI
              </div>
              <div>
                <span className="font-extrabold text-[#1E2229] uppercase tracking-wider block">
                  Financial Intelligence Editorial
                </span>
                <span className="text-[11px] text-[#8A92A0]">
                  High-coverage multilingual equity &amp; macroeconomic research
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => {
                  setSelectedSection('Investment Insights');
                  setCurrentView('feed');
                }}
                className="hover:text-[#6A1B9A] transition-colors"
              >
                Investment Insights
              </button>
              <button
                onClick={() => {
                  setSelectedSection('Market News');
                  setCurrentView('feed');
                }}
                className="hover:text-[#6A1B9A] transition-colors"
              >
                Market News
              </button>
              <button
                onClick={() => {
                  setSelectedSection('Special Coverage');
                  setCurrentView('feed');
                }}
                className="hover:text-[#6A1B9A] transition-colors"
              >
                Special Coverage
              </button>
              <button
                onClick={() => {
                  setAdminTab('markets');
                  setCurrentView('admin');
                }}
                className="hover:text-[#6A1B9A] transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54]"></span>
                <span>Configure Live Markets</span>
              </button>
              <button
                onClick={() => setSupabaseModalOpen(true)}
                className="text-[#6A1B9A] hover:underline"
              >
                Supabase SQL Setup
              </button>
              <button
                onClick={() => setNextJsModalOpen(true)}
                className="text-[#6A1B9A] hover:underline"
              >
                Vercel Deploy Guide
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8A92A0]">
            <p>
              © {new Date().getFullYear()} Financial Intelligence Editorial. Standard UTF-8
              collation with Google Noto Sans and Open Sans universal typography.
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0E8A54]"></span>
              <span>PostgreSQL &amp; Supabase Integration Ready</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Supabase Guide Modal */}
      <SupabaseGuideModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onRefreshData={() => {
          loadSubscriberStories();
          loadAdminStories();
        }}
      />

      {/* Next.js & Vercel Guide Modal */}
      <NextJsExportModal
        isOpen={nextJsModalOpen}
        onClose={() => setNextJsModalOpen(false)}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Story, SECTIONS } from '../types/story';
import { Bookmark, Share2, Clock, Check, ArrowRight } from 'lucide-react';
import { formatTimeAgo } from '../lib/timeAgo';

interface HedgeHomePageProps {
  stories: Story[];
  loading: boolean;
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  onSelectStory: (canonicalUrl: string) => void;
  onOpenSubscribe: () => void;
}

export const HedgeHomePage: React.FC<HedgeHomePageProps> = ({
  stories,
  loading,
  selectedSection,
  onSelectSection,
  onSelectStory,
  onOpenSubscribe,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('hedge_saved_bookmarks');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('hedge_saved_bookmarks', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleShare = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${story.canonical_url}`;
    if (navigator.share) {
      navigator.share({ title: story.heading, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(story.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const navSections = [
    { label: 'All Stories', value: 'All' },
    { label: 'Market News', value: 'Market News' },
    { label: 'Investment Insights', value: 'Investment Insights' },
    { label: 'Special Coverage', value: 'Special Coverage' },
    { label: 'IPO Watch', value: 'IPO Watch' },
  ];

  // Strip rich text HTML safely for grid preview
  const getExcerpt = (html: string) => {
    return html.replace(/<[^>]+>/g, '').trim();
  };

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ======================================================== */}
          {/* 1. LEFT SIDEBAR: Vertical Tab Menu (.section-left)        */}
          {/* ======================================================== */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded border border-[#E6E6E6] shadow-2xs overflow-hidden sticky top-20">
              <div className="p-3.5 bg-[#FAF7FC] border-b border-[#E6E6E6]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#903E97]">
                  Categories
                </span>
              </div>
              <ul className="divide-y divide-[#F2F2F2]">
                {navSections.map((sec) => {
                  const isActive = selectedSection === sec.value;
                  return (
                    <li key={sec.value}>
                      <button
                        type="button"
                        onClick={() => onSelectSection(sec.value)}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold tracking-wide transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-[#903E97] text-white font-bold'
                            : 'text-[#262B2E] hover:bg-[#FAF7FC] hover:text-[#903E97]'
                        }`}
                      >
                        <span>{sec.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Journal Subscription Promo */}
              <div className="p-4 bg-[#FAF7FC] border-t border-[#E6E6E6] text-center">
                <span className="text-[11px] font-bold text-[#262B2E] block mb-1">
                  Hedge Ohari Print &amp; Digital
                </span>
                <p className="text-[10px] text-[#676A6C] mb-3 leading-normal">
                  Malayalam Finance Journal for smart investors.
                </p>
                <button
                  type="button"
                  onClick={onOpenSubscribe}
                  className="w-full py-1.5 rounded bg-[#903E97] hover:bg-[#A045A8] text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 2. CENTER FEED: Main Editorial Grid (.section-main)       */}
          {/* ======================================================== */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-[#E6E6E6] p-5 animate-pulse space-y-3"
                  >
                    <div className="h-64 bg-[#E6E6E6] rounded" />
                    <div className="h-6 bg-[#E6E6E6] rounded w-3/4" />
                    <div className="h-4 bg-[#E6E6E6] rounded w-full" />
                  </div>
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="bg-white rounded border border-[#E6E6E6] p-12 text-center text-[#676A6C] space-y-3">
                <p className="text-sm font-semibold">No stories available in this category.</p>
                <button
                  type="button"
                  onClick={() => onSelectSection('All')}
                  className="px-4 py-2 rounded bg-[#903E97] text-white text-xs font-bold"
                >
                  View All Stories
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => {
                  const isSaved = bookmarkedIds.has(story.id);
                  const isCopied = copiedId === story.id;
                  const timeAgo = formatTimeAgo(story.published_at || story.created_at);
                  const excerpt = getExcerpt(story.short_description || story.full_story);

                  return (
                    <article
                      key={story.id}
                      onClick={() => onSelectStory(story.canonical_url)}
                      className="bg-white rounded border border-[#E6E6E6] shadow-2xs hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer group"
                    >
                      {/* Story Card Image (.grid-image) */}
                      {story.lead_image_url && (
                        <div className="w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-[#F2F2F2] relative">
                          <img
                            src={story.lead_image_url}
                            alt={story.heading}
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#903E97] text-white shadow-xs">
                              {story.section}
                            </span>
                            {story.category && (
                              <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-white/95 text-[#262B2E] shadow-xs">
                                {story.category}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Story Details (.grid-description) */}
                      <div className="p-4 sm:p-5">
                        {/* Heading (.grid-description-content h5) */}
                        <h2 className="text-lg sm:text-[21px] font-['Noto_Sans_Malayalam',_'Open_Sans',_sans-serif] font-bold text-[#262B2E] group-hover:text-[#903E97] transition-colors leading-[1.6] mb-2.5">
                          {story.heading}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-xs sm:text-[13px] text-[#676A6C] leading-relaxed line-clamp-3 mb-4">
                          {excerpt}
                        </p>

                        {/* Card Footer (.grid-description-footer) */}
                        <div className="pt-3 border-t border-[#F2F2F2] flex items-center justify-between text-xs text-[#878787]">
                          <span className="flex items-center gap-1 text-[11px] font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#903E97]" />
                            <span>{timeAgo}</span>
                          </span>

                          <div className="flex items-center gap-3">
                            {/* Share button */}
                            <button
                              type="button"
                              onClick={(e) => handleShare(story, e)}
                              className="p-1.5 hover:text-[#903E97] transition-colors"
                              title="Share"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-[#0E8A54]" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Bookmark button */}
                            <button
                              type="button"
                              onClick={(e) => toggleBookmark(story.id, e)}
                              className="p-1.5 hover:text-[#903E97] transition-colors"
                              title="Bookmark"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isSaved ? 'fill-current text-[#903E97]' : ''}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* ======================================================== */}
          {/* 3. RIGHT SIDEBAR: Subscription & Ad Box (.section-right)  */}
          {/* ======================================================== */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            {/* Journal Promo Card */}
            <div className="bg-white rounded border border-[#E6E6E6] p-5 shadow-2xs text-center space-y-3 sticky top-20">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7FC] border border-[#903E97]/20 flex items-center justify-center text-[#903E97] font-extrabold text-sm">
                ഓഹരി
              </div>
              <div>
                <h3 className="font-['Open_Sans'] font-extrabold text-base text-[#262B2E]">
                  Hedge Ohari
                </h3>
                <p className="text-xs text-[#903E97] font-semibold mt-0.5">
                  Malayalam Financial Journal
                </p>
              </div>
              <p className="text-xs text-[#676A6C] leading-normal">
                Comprehensive knowledge and guidance about Financial Planning and Wealth Creation.
              </p>
              <button
                type="button"
                onClick={onOpenSubscribe}
                className="w-full py-2.5 rounded bg-[#903E97] hover:bg-[#A045A8] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Subscribe Now
              </button>

              <div className="pt-3 border-t border-[#E6E6E6] text-[11px] text-[#878787]">
                <span>Inquiries: </span>
                <a
                  href="mailto:ohari@hedgeequities.com"
                  className="text-[#903E97] hover:underline font-semibold"
                >
                  ohari@hedgeequities.com
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};


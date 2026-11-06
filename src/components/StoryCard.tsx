import React, { useState } from 'react';
import { Story } from '../types/story';
import { Bookmark, Share2, ArrowRight, Clock, Check, FileText } from 'lucide-react';
import { detectScript } from '../lib/grapheme';
import { formatTimeAgo } from '../lib/timeAgo';
import { ShareModal } from './ShareModal';

interface StoryCardProps {
  story: Story;
  onSelectStory: (canonicalUrl: string) => void;
  featured?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelectStory,
  featured = false,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isSaved = isBookmarked !== undefined ? isBookmarked : bookmarked;

  const script = detectScript(story.heading);
  const isRTL = script.isRTL;

  // Clean short description plain text snippet
  const snippet = story.short_description
    ? story.short_description.replace(/<[^>]*>?/gm, '').trim()
    : '';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareModalOpen(true);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark();
    } else {
      setBookmarked(!bookmarked);
    }
  };

  // Determine relative published time (e.g., "1 min ago", "2 hours ago")
  const displayTimeAgo = formatTimeAgo(story.published_at || story.created_at);

  return (
    <article
      onClick={() => onSelectStory(story.canonical_url)}
      className={`group cursor-pointer bg-white rounded-md border border-[#E2E4E8] hover:border-[#6A1B9A]/40 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(30,34,41,0.04)] hover:shadow-[0_4px_12px_rgba(106,27,154,0.08)] ${
        featured ? 'sm:col-span-2' : ''
      }`}
    >
      <div>
        {/* Lead Image Container */}
        <div className="relative aspect-[7/4] bg-[#EBEEF7] overflow-hidden">
          <img
            src={imgError ? 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&h=320&q=80' : story.lead_image_url}
            alt={story.heading}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Section badge on top-left of image */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase bg-[#181C23]/80 backdrop-blur-xs text-white shadow-xs">
              {story.section}
            </span>

            {(story.source_type === 'indianapi_news' || story.source_type === 'market_wire') && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0E8A54]/90 text-white shadow-xs">
                Market Wire
              </span>
            )}
          </div>

          {/* Script Badge on top-right */}
          <div className="absolute top-3 right-3">
            {script.code !== 'en' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6A1B9A]/90 text-white shadow-xs">
                {script.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Card Content with 20px - 24px inner padding */}
        <div className="p-5 sm:p-6 flex flex-col flex-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Header Line: Category Pill opposite Relative Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase text-[#6A1B9A] bg-[#6A1B9A]/5 border border-[#6A1B9A]/20">
              {story.category}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider text-[#8A92A0] flex items-center gap-1"
              title={new Date(story.created_at).toLocaleString()}
            >
              <Clock className="w-3 h-3 text-[#8A92A0]" />
              <span>{displayTimeAgo}</span>
            </span>
          </div>

          {/* Heading */}
          <h2
            className={`font-['Open_Sans'] font-bold text-[#1E2229] group-hover:text-[#6A1B9A] transition-colors line-clamp-2 leading-snug tracking-tight mb-2.5 ${
              featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-[19px]'
            }`}
          >
            {story.heading}
          </h2>

          {/* Short Description Excerpt */}
          <p className="text-sm text-[#58606E] line-clamp-3 multilingual-lead font-normal mb-4">
            {snippet}
          </p>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-[#E2E4E8]/60 flex items-center justify-between text-xs text-[#58606E] mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#6A1B9A] group-hover:underline inline-flex items-center gap-1">
            <span>Read full story</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>

          {story.publishing_status === 'Draft' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF8E1] text-[#B78103]">
              Draft
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Share */}
          <button
            onClick={handleShare}
            title={copied ? 'Link Copied!' : 'Copy Link'}
            className="p-1.5 rounded hover:bg-[#F4F4F6] text-[#58606E] hover:text-[#6A1B9A] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#0E8A54]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Bookmark */}
          <button
            onClick={handleBookmark}
            title={isSaved ? 'Saved' : 'Save Story'}
            className={`p-1.5 rounded hover:bg-[#F4F4F6] transition-colors ${
              isSaved ? 'text-[#6A1B9A]' : 'text-[#58606E] hover:text-[#6A1B9A]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rich Social Share Modal (WhatsApp, Facebook, X, LinkedIn, Telegram, Email) */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        story={story}
      />
    </article>
  );
};

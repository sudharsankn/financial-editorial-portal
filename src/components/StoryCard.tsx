import React, { useState } from 'react';
import { Story } from '../types/story';
import { Bookmark, Share2, ArrowRight, Clock, Check } from 'lucide-react';
import { detectScript } from '../lib/grapheme';

interface StoryCardProps {
  story: Story;
  onSelectStory: (canonicalUrl: string) => void;
  featured?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelectStory,
  featured = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const script = detectScript(story.heading);
  const isRTL = script.isRTL;

  // Format date: e.g. "OCT 8, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(new Date(story.created_at))
    .toUpperCase();

  // Clean short description plain text snippet
  const snippet = story.short_description
    ? story.short_description.replace(/<[^>]*>?/gm, '').trim()
    : '';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/${story.canonical_url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80';

  return (
    <article
      onClick={() => onSelectStory(story.canonical_url)}
      className={`group bg-white rounded border border-[#E2E4E8] hover:border-[#C8CBD0] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(30,34,41,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(30,34,41,0.08)] ${
        featured ? 'md:col-span-2 lg:col-span-2' : ''
      }`}
    >
      <div>
        {/* Lead Image Container: Strictly Calibrated 560x320 Aspect Ratio (7:4) */}
        <div className="relative w-full aspect-[7/4] overflow-hidden bg-[#EBEEF7]">
          <img
            src={imgError || !story.lead_image_url ? fallbackImage : story.lead_image_url}
            alt={story.heading}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
          />

          {/* Section Overlay Chip */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#181C23]/80 backdrop-blur-xs text-white shadow-xs">
              {story.section}
            </span>
            {script.code !== 'en' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6A1B9A]/90 text-white shadow-xs">
                {script.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Card Content with 20px - 24px inner padding */}
        <div className="p-5 sm:p-6 flex flex-col flex-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Header Line: Category Pill opposite Muted Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase text-[#6A1B9A] bg-[#6A1B9A]/5 border border-[#6A1B9A]/20">
              {story.category}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A92A0]">
              {formattedDate}
            </span>
          </div>

          {/* Heading (Max 70 grapheme characters, bold, crisp baseline) */}
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

      {/* Footer Strip: Reading time, actions & Read Full Story */}
      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-[#E2E4E8]/60 flex items-center justify-between text-xs text-[#58606E] mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-[11px] text-[#8A92A0]">
            <Clock className="w-3 h-3 text-[#58606E]" />
            <span>3 min read</span>
          </span>

          {story.notification_status === 'Yes' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A54]" title="Notification Broadcast Enabled"></span>
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
            title={bookmarked ? 'Saved' : 'Save Story'}
            className={`p-1.5 rounded hover:bg-[#F4F4F6] transition-colors ${
              bookmarked ? 'text-[#6A1B9A]' : 'text-[#58606E] hover:text-[#6A1B9A]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#6A1B9A]' : ''}`} />
          </button>

          {/* Ghost Action Button: Read Full Story */}
          <span className="inline-flex items-center gap-1 font-bold text-xs text-[#6A1B9A] group-hover:translate-x-0.5 transition-transform ml-1">
            <span>Read Story</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </article>
  );
};

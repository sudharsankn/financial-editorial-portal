import React, { useState, useEffect } from 'react';
import { Story } from '../types/story';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Bookmark,
  Check,
  Tag,
  Code,
  Globe,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { detectScript } from '../lib/grapheme';

interface ArticleDetailProps {
  story: Story;
  relatedStories: Story[];
  onBack: () => void;
  onSelectRelated: (canonicalUrl: string) => void;
  onEditStory?: (story: Story) => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  story,
  relatedStories,
  onBack,
  onSelectRelated,
  onEditStory,
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showSeoMeta, setShowSeoMeta] = useState(false);
  const [imgError, setImgError] = useState(false);

  const script = detectScript(story.heading);
  const isRTL = script.isRTL;

  // Scroll to top when article loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [story.id]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(story.created_at));

  const handleShare = () => {
    const fullUrl = `${window.location.origin}/${story.canonical_url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80';

  const keywordsArray = story.keywords
    ? story.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6A1B9A] hover:text-[#7B1FA2] transition-colors py-1.5 px-3 rounded hover:bg-[#F3E5F5]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Stories</span>
        </button>

        <div className="flex items-center gap-2">
          {onEditStory && (
            <button
              onClick={() => onEditStory(story)}
              className="text-xs font-semibold px-2.5 py-1 rounded border border-[#E2E4E8] text-[#58606E] hover:text-[#1E2229] hover:border-[#6A1B9A] transition-colors"
            >
              Edit in Admin
            </button>
          )}
          <button
            onClick={() => setShowSeoMeta(!showSeoMeta)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border border-[#E2E4E8] text-[#58606E] hover:text-[#6A1B9A] transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-[#6A1B9A]" />
            <span>SEO &amp; OpenGraph</span>
          </button>
        </div>
      </div>

      {/* SEO & Meta Inspector Drawer */}
      {showSeoMeta && (
        <div className="mb-8 p-5 bg-[#181C23] text-[#DFE2EC] rounded border border-[#4D4351] text-xs font-mono shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#4D4351] mb-3">
            <span className="font-bold text-[#DA9CFF] flex items-center gap-1.5 font-sans">
              <Globe className="w-3.5 h-3.5" />
              Next.js &amp; Vercel Edge SEO Metadata (Unicode UTF-8)
            </span>
            <span className="text-[10px] text-[#A69AA8]">{script.name}</span>
          </div>
          <div className="space-y-1 overflow-x-auto text-[11px] leading-relaxed">
            <p><span className="text-[#DA9CFF]">&lt;title&gt;</span>{story.seo_title || story.heading}<span className="text-[#DA9CFF]">&lt;/title&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;meta</span> name=&quot;description&quot; content=&quot;{story.seo_description || story.short_description.replace(/<[^>]*>/g, '').slice(0, 155)}&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;link</span> rel=&quot;canonical&quot; href=&quot;https://yourdomain.com/{story.canonical_url}&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;meta</span> property=&quot;og:title&quot; content=&quot;{story.heading}&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;meta</span> property=&quot;og:image&quot; content=&quot;{story.lead_image_url}&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;meta</span> property=&quot;og:type&quot; content=&quot;article&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
            <p><span className="text-[#DA9CFF]">&lt;meta</span> name=&quot;keywords&quot; content=&quot;{story.keywords}&quot; <span className="text-[#DA9CFF]">/&gt;</span></p>
          </div>
        </div>
      )}

      {/* Article Header */}
      <header className="mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Category & Section badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#6A1B9A] bg-[#6A1B9A]/5 border border-[#6A1B9A]/20">
            {story.category}
          </span>
          <span className="text-xs font-bold text-[#58606E] uppercase tracking-wider">
            {story.section}
          </span>
          {script.code !== 'en' && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3E5F5] text-[#6A1B9A]">
              {script.name}
            </span>
          )}
        </div>

        {/* Heading: Bold, Max 70 graphemes, universal script rendering */}
        <h1 className="font-['Open_Sans'] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#1E2229] leading-tight mb-4 tracking-tight">
          {story.heading}
        </h1>

        {/* Lead Excerpt (Short description) */}
        {story.short_description && (
          <div
            className="text-base sm:text-lg text-[#58606E] font-medium multilingual-lead mb-5 border-l-4 border-[#6A1B9A] pl-4 py-0.5"
            dangerouslySetInnerHTML={{ __html: story.short_description }}
          />
        )}

        {/* Metadata & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#E2E4E8] text-xs text-[#58606E]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#6A1B9A] text-white flex items-center justify-center font-bold text-xs">
                FI
              </div>
              <div>
                <span className="font-bold text-[#1E2229] block">Financial Desk</span>
                <span className="text-[#8A92A0] text-[11px]">Senior Market Analyst</span>
              </div>
            </div>

            <span className="hidden sm:inline w-1 h-1 rounded-full bg-[#C8CBD0]"></span>

            <span className="flex items-center gap-1 text-[#8A92A0]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>

            <span className="flex items-center gap-1 text-[#8A92A0]">
              <Clock className="w-3.5 h-3.5" />
              <span>4 min read</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] text-[#1E2229] text-xs font-semibold transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0E8A54]" />
                  <span className="text-[#0E8A54]">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#6A1B9A]" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] transition-colors ${
                bookmarked ? 'text-[#6A1B9A] bg-[#F3E5F5]' : 'text-[#58606E]'
              }`}
              title="Bookmark story"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#6A1B9A]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Lead Image: Exactly Calibrated 560x320 Aspect Ratio Container */}
      <div className="mb-8 rounded overflow-hidden border border-[#E2E4E8] bg-[#EBEEF7] shadow-sm">
        <div className="w-full aspect-[7/4] relative">
          <img
            src={imgError || !story.lead_image_url ? fallbackImage : story.lead_image_url}
            alt={story.heading}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="p-2.5 bg-white border-t border-[#E2E4E8] text-[11px] text-[#8A92A0] flex items-center justify-between">
          <span>Editorial Photography • Standard 560×320 JPG Framing</span>
          <span className="font-mono text-[10px]">Slug: /{story.canonical_url}</span>
        </div>
      </div>

      {/* Full Article Content */}
      <article
        className="prose prose-slate max-w-none mb-10 text-[#1E2229] leading-relaxed multilingual-lead [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1E2229] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#1E2229] [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:text-base [&_p]:text-[#1E2229] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#6A1B9A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#58606E] [&_a]:text-[#6A1B9A] [&_a]:font-semibold [&_a]:underline hover:[&_a]:text-[#7B1FA2]"
        dir={isRTL ? 'rtl' : 'ltr'}
        dangerouslySetInnerHTML={{ __html: story.full_story || '<p>Story content pending editorial review.</p>' }}
      />

      {/* Keywords / Tags */}
      {keywordsArray.length > 0 && (
        <div className="pt-6 pb-6 border-t border-[#E2E4E8] mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#58606E] uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-[#6A1B9A]" />
            <span>Indexed Taxonomy Keywords</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywordsArray.map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded bg-white border border-[#E2E4E8] text-xs font-medium text-[#58606E]"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Stories Section */}
      {relatedStories.length > 0 && (
        <section className="pt-8 border-t border-[#E2E4E8]">
          <h3 className="font-['Open_Sans'] font-bold text-xl text-[#1E2229] mb-4">
            Related Dispatches in {story.section}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedStories.slice(0, 3).map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectRelated(rel.canonical_url)}
                className="bg-white rounded border border-[#E2E4E8] hover:border-[#6A1B9A] p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[7/4] bg-[#EBEEF7] rounded overflow-hidden mb-2.5">
                    <img
                      src={rel.lead_image_url || fallbackImage}
                      alt={rel.heading}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-[#6A1B9A] bg-[#6A1B9A]/5 mb-1.5 uppercase">
                    {rel.category}
                  </span>
                  <h4 className="font-bold text-sm text-[#1E2229] line-clamp-2 leading-snug">
                    {rel.heading}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-[#6A1B9A] mt-3 block">
                  Read Dispatch →
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

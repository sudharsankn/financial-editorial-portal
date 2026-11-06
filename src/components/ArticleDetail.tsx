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
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { detectScript } from '../lib/grapheme';
import { ShareModal } from './ShareModal';
import { AdBanner } from './AdBanner';

interface ArticleDetailProps {
  story: Story;
  relatedStories: Story[];
  prevStory?: Story | null;
  nextStory?: Story | null;
  onBack: () => void;
  onSelectRelated: (canonicalUrl: string) => void;
  onEditStory?: (story: Story) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  isSubscribed?: boolean;
  onOpenSubscribe?: () => void;
  onOpenSignIn?: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  story,
  relatedStories,
  prevStory = null,
  nextStory = null,
  onBack,
  onSelectRelated,
  onEditStory,
  isBookmarked,
  onToggleBookmark,
  isSubscribed = false,
  onOpenSubscribe,
  onOpenSignIn,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(false);
  const isSaved = isBookmarked !== undefined ? isBookmarked : localBookmarked;
  const [showSeoMeta, setShowSeoMeta] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Accessibility Font Size state for Malayalam readability
  type FontSizeOption = 'small' | 'normal' | 'large' | 'xlarge';
  const [fontSize, setFontSize] = useState<FontSizeOption>(() => {
    try {
      const saved = localStorage.getItem('hedge_reader_font_size');
      if (saved === 'small' || saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  // Reading progress bar state (0 to 100%)
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSetFontSize = (size: FontSizeOption) => {
    setFontSize(size);
    try {
      localStorage.setItem('hedge_reader_font_size', size);
    } catch {}
  };

  const script = detectScript(story.heading);
  const isRTL = script.isRTL;

  // Determine if this is a subscriber-only premium story
  const isPremiumStory =
    story.is_premium === true ||
    ['Investment Insights', 'Special Coverage'].includes(story.section) ||
    ['Stock Recommendations', 'Portfolio', 'Big Story'].includes(story.category);

  // Story is locked if it is premium and reader is not an active subscriber
  const isLocked = isPremiumStory && !isSubscribed;

  // Helper to extract first 2 paragraphs for paywall preview
  const getPreviewStoryContent = (html: string) => {
    if (!html) return '<p>Story preview loading...</p>';
    const parts = html.split(/(<\/p>)/i);
    if (parts.length >= 4) {
      return parts.slice(0, 4).join('');
    }
    return html.slice(0, 400) + '...';
  };

  // Helper to insert Full Story - Solo Position Ad after Paragraph 3 (matching legacy Article.js)
  const renderStoryWithSoloAd = (html: string) => {
    if (!html) return <p>Story content pending editorial review.</p>;
    const parts = html.split(/(<\/p>)/i);
    // 3 paragraphs = 6 parts (0, 1, 2, 3, 4, 5)
    if (parts.length >= 6) {
      const firstChunk = parts.slice(0, 6).join('');
      const secondChunk = parts.slice(6).join('');
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: firstChunk }} />
          <AdBanner position="Full Story - Solo Position" format="in_article" />
          <div dangerouslySetInnerHTML={{ __html: secondChunk }} />
        </>
      );
    }
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <AdBanner position="Full Story - Solo Position" format="in_article" />
      </>
    );
  };

  // Keyboard navigation for Previous & Next story (legacy SwipeItem.js navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' && prevStory) {
        onSelectRelated(prevStory.canonical_url);
      } else if (e.key === 'ArrowRight' && nextStory) {
        onSelectRelated(nextStory.canonical_url);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevStory, nextStory, onSelectRelated]);

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
    setShareModalOpen(true);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&h=320&q=80';

  const keywordsArray = story.keywords
    ? story.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sticky Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-black/5">
        <div
          className="h-full bg-gradient-to-r from-[#903E97] via-[#B24CB9] to-[#792F80] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

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
            {/* Accessibility Font Size Adjuster (Malayalam Conjunct Clarity) */}
            <div className="inline-flex items-center rounded-lg border border-[#E2E4E8] bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleSetFontSize('small')}
                className={`px-2 py-0.5 rounded font-bold text-[10px] transition-colors cursor-pointer ${
                  fontSize === 'small'
                    ? 'bg-[#903E97] text-white shadow-xs'
                    : 'text-[#58606E] hover:text-[#903E97]'
                }`}
                title="ചെറിയ അക്ഷരങ്ങൾ (Small Font - 14px)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('normal')}
                className={`px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-[#903E97] text-white shadow-xs'
                    : 'text-[#58606E] hover:text-[#903E97]'
                }`}
                title="സാധാരണ അക്ഷരങ്ങൾ (Normal Font - 16px)"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('large')}
                className={`px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-[#903E97] text-white shadow-xs'
                    : 'text-[#58606E] hover:text-[#903E97]'
                }`}
                title="വലിയ അക്ഷരങ്ങൾ (Large Font - 18px)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('xlarge')}
                className={`px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-[#903E97] text-white shadow-xs'
                    : 'text-[#58606E] hover:text-[#903E97]'
                }`}
                title="കൂടുതൽ വലിയ അക്ഷരങ്ങൾ (Extra Large Font - 20px)"
              >
                A++
              </button>
            </div>

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
              id="btn-bookmark-article-detail"
              type="button"
              onClick={() => {
                if (onToggleBookmark) {
                  onToggleBookmark();
                } else {
                  setLocalBookmarked(!localBookmarked);
                }
              }}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                isSaved
                  ? 'border-[#903E97] text-[#903E97] bg-[#FAF7FC]'
                  : 'border-[#E2E4E8] text-[#58606E] hover:border-[#903E97] hover:text-[#903E97]'
              }`}
              title={isSaved ? 'Remove from bookmarks' : 'Bookmark story'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-[#903E97]' : ''}`} />
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

      {/* Paywall Container or Full Article Content */}
      {isLocked ? (
        <div className="relative mb-10">
          {/* Preview Story Content (First 2 paragraphs) */}
          <div
            className={`prose prose-slate max-w-none text-[#1E2229] leading-relaxed multilingual-lead [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1E2229] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#1E2229] [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#6A1B9A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#58606E] ${
              fontSize === 'small'
                ? '[&_p]:text-sm [&_p]:leading-relaxed text-sm'
                : fontSize === 'large'
                ? '[&_p]:text-lg [&_p]:leading-loose text-lg'
                : fontSize === 'xlarge'
                ? '[&_p]:text-xl [&_p]:leading-loose text-xl'
                : '[&_p]:text-base [&_p]:leading-relaxed text-base'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: getPreviewStoryContent(story.full_story) }}
          />

          {/* Bottom Gradient Fade Overlay */}
          <div className="h-32 -mt-20 relative bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/90 to-transparent pointer-events-none" />

          {/* Subscriber Exclusive Paywall Card */}
          <div className="relative -mt-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF] border border-[#E9D5FF] shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#903E97] text-white shadow-md mb-4 ring-8 ring-[#903E97]/10">
              <Lock className="w-6 h-6" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#903E97] bg-[#903E97]/10 mb-2">
              വരിക്കാർക്ക് മാത്രമുള്ള പ്രത്യേക ലേഖനം • Subscriber Exclusive
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#1E2229] mb-2 font-['Open_Sans']">
              തുടർന്ന് വായിക്കാൻ സബ്സ്ക്രൈബ് ചെയ്യുക
            </h3>

            <p className="text-sm text-[#58606E] max-w-xl mx-auto mb-6 leading-relaxed">
              ഈ ലേഖനം പൂർണ്ണമായി വായിക്കാൻ ദയവായി ഹെഡ്ജ് ഓഹരി സബ്സ്ക്രൈബ് ചെയ്യുക അല്ലെങ്കിൽ ലോഗിൻ ചെയ്യുക. വിദഗ്ദ്ധരുടെ ഓഹരി നിർദ്ദേശങ്ങളും വിപണി വിശകലനങ്ങളും ആദ്യമറിയാം.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenSubscribe}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#903E97] to-[#792f80] text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-[#792f80] hover:to-[#63226a] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>സബ്സ്ക്രൈബ് ചെയ്യുക (Starts ₹150)</span>
              </button>

              <button
                type="button"
                onClick={onOpenSignIn}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#903E97]/40 text-[#903E97] hover:bg-[#903E97]/5 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>ഇതിനകം വരിക്കാരാണോ? ലോഗിൻ ചെയ്യുക</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8A92A0] mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0E8A54]" />
              <span>Instant Razorpay Activation • Cancel Anytime • 100% Secure</span>
            </p>
          </div>

          {/* Full Story - Solo Position Ad below paywall */}
          <AdBanner position="Full Story - Solo Position" format="in_article" />
        </div>
      ) : (
        <>
          {isPremiumStory && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E8A54]/10 border border-[#0E8A54]/30 text-[#0E8A54] text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>✓ പ്രീമിയം സബ്സ്ക്രിപ്ഷൻ ആക്സസ് അൺലോക്ക് ചെയ്തു (Full Access Unlocked)</span>
            </div>
          )}
          <article
            className={`prose prose-slate max-w-none mb-10 text-[#1E2229] leading-relaxed multilingual-lead [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1E2229] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#1E2229] [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#6A1B9A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#58606E] [&_a]:text-[#6A1B9A] [&_a]:font-semibold [&_a]:underline hover:[&_a]:text-[#7B1FA2] ${
              fontSize === 'small'
                ? '[&_p]:text-sm [&_p]:leading-relaxed text-sm'
                : fontSize === 'large'
                ? '[&_p]:text-lg [&_p]:leading-loose text-lg'
                : fontSize === 'xlarge'
                ? '[&_p]:text-xl [&_p]:leading-loose text-xl'
                : '[&_p]:text-base [&_p]:leading-relaxed text-base'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {renderStoryWithSoloAd(story.full_story)}
          </article>
        </>
      )}

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

      {/* Previous & Next Story Navigation (Hedge Ohari Legacy Swipe / Reader Navigation) */}
      {(prevStory || nextStory) && (
        <div className="pt-6 pb-6 border-t border-[#E2E4E8] mb-8">
          <div className="flex items-center justify-between text-xs text-[#8A92A0] mb-3 font-semibold">
            <span>Navigate Stories (← / → arrow keys supported)</span>
            <span>Hedge Ohari Reader</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevStory ? (
              <button
                type="button"
                onClick={() => onSelectRelated(prevStory.canonical_url)}
                className="group flex items-start gap-3 p-3.5 rounded-xl border border-[#E2E4E8] hover:border-[#903E97] bg-white hover:bg-[#FAF7FC] transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#FAF7FC] group-hover:bg-[#903E97] text-[#903E97] group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#903E97] block mb-0.5">
                    &larr; മുൻപത്തെ ലേഖനം (Previous)
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E2229] group-hover:text-[#903E97] line-clamp-2 leading-snug">
                    {prevStory.heading}
                  </h4>
                </div>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextStory ? (
              <button
                type="button"
                onClick={() => onSelectRelated(nextStory.canonical_url)}
                className="group flex items-start justify-between gap-3 p-3.5 rounded-xl border border-[#E2E4E8] hover:border-[#903E97] bg-white hover:bg-[#FAF7FC] transition-all text-right shadow-xs cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#903E97] block mb-0.5">
                    അടുത്ത ലേഖനം (Next) &rarr;
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E2229] group-hover:text-[#903E97] line-clamp-2 leading-snug">
                    {nextStory.heading}
                  </h4>
                </div>
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#FAF7FC] group-hover:bg-[#903E97] text-[#903E97] group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}
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

      {/* Rich Social Share Modal (WhatsApp, Facebook, X, LinkedIn, Telegram, Email) */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        story={story}
      />
    </div>
  );
};

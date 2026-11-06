import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Mail, ExternalLink } from 'lucide-react';
import { Story } from '../types/story';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, story }) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !story) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hedgeohari.com';
  const fullUrl = `${origin}/${story.canonical_url}`;
  const shareHeading = story.heading || 'Hedge Ohari Financial Story';
  const shareText = `${shareHeading}\n\nവായിക്കൂ ഹെഡ്ജ് ഓഹരിയിൽ:\n${fullUrl}`;

  // Copy link handler
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Social share click helpers (matches legacy Share.js)
  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=640,height=560,toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1');
  };

  const handleWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    openShareWindow(fbUrl);
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareHeading)}`;
    openShareWindow(twitterUrl);
  };

  const handleLinkedIn = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    openShareWindow(liUrl);
  };

  const handleTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareHeading)}`;
    window.open(tgUrl, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(shareHeading);
    const body = encodeURIComponent(
      `Check out this financial story from Hedge Ohari:\n\n${shareHeading}\n\nRead the full dispatch:\n${fullUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shareHeading,
        text: story.short_description ? story.short_description.replace(/<[^>]+>/g, '').slice(0, 100) : shareHeading,
        url: fullUrl,
      }).catch(() => {});
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&h=225&q=80';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E6E6E6] overflow-hidden flex flex-col animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6] bg-[#FAF7FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#903E97]/10 text-[#903E97] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#262B2E] leading-tight">
                ലേഖനം പങ്കിടുക (Share Story)
              </h3>
              <p className="text-[11px] text-[#676A6C]">
                സുഹൃത്തുക്കളിലേക്കും സോഷ്യൽ മീഡിയയിലേക്കും ഷെയർ ചെയ്യാം
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#676A6C] hover:text-[#262B2E] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Story Preview Card */}
          <div className="flex gap-3.5 p-3 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF]">
            <img
              src={story.lead_image_url || fallbackImage}
              alt={story.heading}
              className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-lg flex-shrink-0 bg-[#E2E4E8]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[#903E97] bg-[#903E97]/10 w-fit mb-1">
                {story.category || story.section}
              </span>
              <h4 className="font-bold text-xs sm:text-sm text-[#262B2E] line-clamp-2 leading-snug">
                {story.heading}
              </h4>
            </div>
          </div>

          {/* Social Channels Grid */}
          <div>
            <span className="text-xs font-bold text-[#676A6C] uppercase tracking-wider block mb-3">
              സോഷ്യൽ മീഡിയയിൽ പങ്കിടുക (Share Via)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-[#1877F2] hover:bg-[#1877F2]/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.82 0-1.603.204-1.996.611-.393.407-.478 1.14-.478 2.213v1.156h4.529l-.612 3.667h-3.917v7.98c5.441-.85 9.601-5.548 9.601-11.218 0-6.307-5.114-11.421-11.421-11.421C5.114.85 0 5.964 0 12.271c0 5.67 4.16 10.368 9.101 11.22z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={handleTwitter}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-black hover:bg-black/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">X</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleLinkedIn}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 0-3.3 1.66 1.66 0 0 0 0 3.3m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">LinkedIn</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-[#229ED9] hover:bg-[#229ED9]/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">Telegram</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleEmail}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#E6E6E6] hover:border-[#676A6C] hover:bg-[#676A6C]/5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#676A6C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#262B2E] mt-1.5">Email</span>
              </button>
            </div>
          </div>

          {/* Copy Direct Link Section */}
          <div>
            <span className="text-xs font-bold text-[#676A6C] uppercase tracking-wider block mb-2">
              ഡയറക്റ്റ് ലിങ്ക് പകർത്തുക (Copy Link)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#E6E6E6] bg-[#FAF7FC] text-xs font-mono text-[#262B2E] truncate focus:outline-none focus:border-[#903E97]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-[#0E8A54] text-white'
                    : 'bg-[#903E97] hover:bg-[#792f80] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>പകർത്തി ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Native Share Sheet (Conditional) */}
          {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
            <div className="pt-2 border-t border-[#E6E6E6]">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 rounded-xl border border-[#903E97]/30 hover:border-[#903E97] hover:bg-[#903E97]/5 text-[#903E97] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>മറ്റ് ആപ്പുകളിൽ പങ്കിടുക (Open System Share Sheet)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


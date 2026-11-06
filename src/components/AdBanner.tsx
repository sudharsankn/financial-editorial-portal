import React, { useEffect, useState } from 'react';
import { AdCampaign, AdPosition } from '../types/ad';
import { recordAdClick, recordAdImpression, getAdForPosition, DEFAULT_AD_CAMPAIGNS } from '../lib/adService';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  ad?: AdCampaign | null;
  position: AdPosition;
  format: 'sidebar' | 'in_feed' | 'in_article';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ad: propAd,
  position,
  format,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const activeAd = propAd || getAdForPosition(DEFAULT_AD_CAMPAIGNS, position);

  useEffect(() => {
    if (activeAd?.campaign_id) {
      recordAdImpression(activeAd.campaign_id);
    }
  }, [activeAd?.campaign_id]);

  if (!activeAd) return null;

  const handleClick = () => {
    if (activeAd?.campaign_id) {
      recordAdClick(activeAd.campaign_id, activeAd.id, {
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });
    }
  };

  // 1. SIDEBAR AD FORMAT (IAB Standard 300x250 Medium Rectangle - Exact same size for Left & Right)
  if (format === 'sidebar') {
    return (
      <aside
        aria-label={`Advertisement: ${activeAd.advertiser}`}
        className={`bg-white rounded-xl border border-[#E6E6E6] p-3 shadow-2xs overflow-hidden transition-all hover:border-[#903E97]/40 ${className}`}
      >
        {/* Compliance Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0F0F0] text-[10px] text-[#878787]">
          <span className="font-bold tracking-wider uppercase text-[#903E97]">
            പരസ്യം • SPONSORED
          </span>
          <span className="text-[9px] font-semibold flex items-center gap-1 text-[#676A6C]">
            <span>{activeAd.advertiser}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </span>
        </div>

        {/* Ad Link & Media */}
        <a
          href={activeAd.display_ad_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="group block relative w-full aspect-[6/5] sm:aspect-[4/3] rounded-lg overflow-hidden bg-[#FAF7FC]"
          title={`${activeAd.advertiser} - ${activeAd.brand}`}
        >
          <img
            src={imgError ? '/ads/icici-sip.jpg' : activeAd.display_ad_material}
            alt={`${activeAd.advertiser} ${activeAd.brand} Advertisement`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </a>

        {/* Footer Link */}
        <div className="mt-2 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[10px]">
          <span className="font-medium text-[#262B2E] truncate">
            {activeAd.brand}
          </span>
          <a
            href={activeAd.display_ad_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            className="font-bold text-[#903E97] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Learn More</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </aside>
    );
  }

  // 2. BETWEEN STORIES IN-FEED AD FORMAT (IAB Standard 728x180 Responsive In-Listing)
  if (format === 'in_feed') {
    return (
      <div
        aria-label={`Sponsored dispatch: ${activeAd.advertiser}`}
        className={`col-span-full my-4 rounded-2xl border border-[#EADDF0] bg-gradient-to-r from-[#FAF7FC] via-white to-[#FAF7FC] p-4 sm:p-5 shadow-xs overflow-hidden transition-all hover:border-[#903E97] ${className}`}
      >
        {/* Compliance Tag */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EADDF0]/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#903E97]/10 text-[#903E97]">
              സ്പോൺസേർഡ് • SPONSORED
            </span>
            <span className="text-xs font-bold text-[#262B2E]">
              {activeAd.advertiser} {activeAd.brand}
            </span>
          </div>
          <span className="text-[10px] text-[#878787]">
            Box Listing • Position 6
          </span>
        </div>

        {/* Responsive Content Banner Layout */}
        <a
          href={activeAd.display_ad_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="group flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
        >
          <div className="w-full md:w-2/5 aspect-[16/9] md:aspect-[7/4] max-h-48 rounded-xl overflow-hidden bg-[#FAF7FC] shrink-0 border border-[#E6E6E6]">
            <img
              src={imgError ? '/ads/icici-sip.jpg' : activeAd.display_ad_material}
              alt={`${activeAd.advertiser} ${activeAd.brand} Ad`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-['Open_Sans'] font-extrabold text-base sm:text-lg text-[#262B2E] group-hover:text-[#903E97] transition-colors leading-snug mb-1">
              {activeAd.advertiser} — സുരക്ഷിതമായ നിക്ഷേപം, ഭാവിക്കായുള്ള സമ്പാദ്യം
            </h4>
            <p className="text-xs text-[#676A6C] leading-relaxed mb-3 line-clamp-2">
              വിദ്യാഭ്യാസം, റിട്ടയർമെന്റ്, സമ്പത്ത് വളർച്ച എന്നിവയ്ക്കായി അനുയോജ്യമായ മ്യൂച്വൽ ഫണ്ട് &amp; എസ്ഐപി പ്ലാനുകൾ പരിശോധിക്കുക.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#903E97] group-hover:bg-[#792f80] text-white text-xs font-bold shadow-xs transition-colors">
                <span>കൂടുതൽ വിവരങ്ങൾക്ക് (Visit Website)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </a>
      </div>
    );
  }

  // 3. IN-ARTICLE SOLO AD FORMAT (Inserted after Paragraph 3 in Full Story)
  return (
    <div
      aria-label={`In-Story Advertisement: ${activeAd.advertiser}`}
      className={`my-8 p-4 sm:p-5 rounded-2xl border border-[#EADDF0] bg-[#FAF7FC] shadow-xs overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EADDF0] text-[11px] text-[#878787]">
        <span className="font-bold text-[#903E97] uppercase tracking-wider">
          പരസ്യം • FEATURED SPONSORSHIP
        </span>
        <span className="text-[10px] text-[#676A6C]">
          {activeAd.advertiser} • Full Story Solo Placement
        </span>
      </div>

      <a
        href={activeAd.display_ad_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="group block relative w-full aspect-[2/1] sm:aspect-[7/3] max-h-72 rounded-xl overflow-hidden bg-white border border-[#E6E6E6]"
      >
        <img
          src={imgError ? '/ads/icici-sip.jpg' : activeAd.display_ad_material}
          alt={`${activeAd.advertiser} ${activeAd.brand} Full Story Ad`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
      </a>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#676A6C]">
          മ്യൂച്വൽ ഫണ്ട് നിക്ഷേപങ്ങൾ വിപണിയിലെ നഷ്ടസാധ്യതകൾക്ക് വിധേയമാണ്.
        </span>
        <a
          href={activeAd.display_ad_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="font-bold text-[#903E97] hover:underline flex items-center gap-1 shrink-0 text-xs"
        >
          <span>സന്ദർശിക്കുക (Visit)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};


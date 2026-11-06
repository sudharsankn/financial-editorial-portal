import React from 'react';
import { Globe, Mail, Phone, ExternalLink } from 'lucide-react';

interface HedgeFooterProps {
  onNavigatePage?: (page: 'about-us' | 'contact-us' | 'terms-of-use' | 'privacy-policy') => void;
}

export const HedgeFooter: React.FC<HedgeFooterProps> = ({ onNavigatePage }) => {
  return (
    <footer id="section-footer" className="bg-white border-t border-[#E6E6E6] py-10 text-xs text-[#676A6C]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E6E6E6]">
          {/* Logo & Description */}
          <div id="footer-brand-summary" className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img
              src="/hedge-ohari-logo.svg"
              alt="Hedge Ohari"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <p className="font-bold text-[#262B2E] text-sm">
                Hedge Ohari – Malayalam Finance Journal
              </p>
              <p className="text-xs text-[#676A6C] max-w-md mt-0.5">
                First Finance Journal in Malayalam providing comprehensive knowledge and insight about Financial Planning to help readers achieve Financial Freedom.
              </p>
            </div>
          </div>

          {/* Hedge Group Link */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              id="footer-hedge-equities-link"
              href="https://hedgeequities.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded border border-[#903E97]/40 text-[#903E97] hover:bg-[#FAF7FC] transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>hedgeequities.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom copyright & In-App Navigation */}
        <div id="footer-bottom-copyright" className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#878787]">
          <p>© {new Date().getFullYear()} Hedge Ohari &bull; Hedge School of Applied Economics (HSAE). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigatePage?.('about-us')}
              className="hover:text-[#903E97] transition-colors cursor-pointer"
            >
              About Hedge (ഞങ്ങളെക്കുറിച്ച്)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigatePage?.('contact-us')}
              className="hover:text-[#903E97] transition-colors cursor-pointer font-semibold text-[#903E97]"
            >
              Contact Us (ഓഫീസ് വിലാസം)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigatePage?.('terms-of-use')}
              className="hover:text-[#903E97] transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigatePage?.('privacy-policy')}
              className="hover:text-[#903E97] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};


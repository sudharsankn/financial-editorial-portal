import React from 'react';
import { Globe, Mail, Phone, ExternalLink } from 'lucide-react';

export const HedgeFooter: React.FC = () => {
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

        {/* Bottom copyright */}
        <div id="footer-bottom-copyright" className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#878787]">
          <p>© {new Date().getFullYear()} Hedge Ohari. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a id="link-footer-terms" href="https://hedgeohari.com/terms-of-use" target="_blank" rel="noreferrer" className="hover:text-[#903E97]">
              Terms of Use
            </a>
            <span>•</span>
            <a id="link-footer-privacy" href="https://hedgeohari.com/privacy-policy" target="_blank" rel="noreferrer" className="hover:text-[#903E97]">
              Privacy Policy
            </a>
            <span>•</span>
            <a id="link-footer-about" href="https://hedgeohari.com/about-us" target="_blank" rel="noreferrer" className="hover:text-[#903E97]">
              About Hedge
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};


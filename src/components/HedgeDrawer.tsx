import React from 'react';
import { X, Globe, ExternalLink } from 'lucide-react';
import { Section } from '../types/story';

interface HedgeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  onOpenSubscribe: () => void;
  onOpenBookmarks: () => void;
  onOpenAdmin: () => void;
}

const SECTIONS_LIST = [
  { label: 'HOME', value: 'All' },
  { label: 'MARKET NEWS', value: 'Market News' },
  { label: 'INVESTMENT INSIGHTS', value: 'Investment Insights' },
  { label: 'SPECIAL COVERAGE', value: 'Special Coverage' },
  { label: 'IPO WATCH', value: 'IPO Watch' },
];

export const HedgeDrawer: React.FC<HedgeDrawerProps> = ({
  isOpen,
  onClose,
  selectedSection,
  onSelectSection,
  onOpenSubscribe,
  onOpenBookmarks,
  onOpenAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer Container (Purple Brand #903E97 on hedgeohari.com) */}
      <aside className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#903E97] text-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out">
        {/* Top Header */}
        <div className="p-6 border-b border-white/15 flex items-center justify-between">
          <img
            src="/hedge-ohari-logo-white.svg"
            alt="Hedge Ohari"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu Listing */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-3 mb-2">
            Sections &amp; Coverage
          </p>
          {SECTIONS_LIST.map((item) => {
            const isActive = selectedSection === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onSelectSection(item.value);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-white/20 text-white shadow-inner font-extrabold'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}

          <div className="pt-6 pb-2 border-t border-white/15 my-4">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-3 mb-2">
              Reader Options
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenBookmarks();
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              BOOKMARKS
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenSubscribe();
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              SUBSCRIBE TO JOURNAL
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenAdmin();
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              EDITORIAL ADMIN PANEL
            </button>
          </div>
        </div>

        {/* Footer Brand Attribution */}
        <div className="p-6 border-t border-white/15 bg-black/10 text-xs text-white/70 space-y-2">
          <p className="font-bold text-white text-[11px] uppercase tracking-wider">
            Visit Hedge At
          </p>
          <a
            href="https://hedgeequities.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-white/85 hover:text-white text-xs underline underline-offset-2"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>hedgeequities.com</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
          </a>
          <p className="text-[10px] text-white/50 pt-2">
            © {new Date().getFullYear()} Hedge Ohari. Malayalam Financial Journal.
          </p>
        </div>
      </aside>
    </div>
  );
};

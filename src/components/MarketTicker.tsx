import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Settings2 } from 'lucide-react';
import { MarketTickerItem } from '../types/story';
import { fetchMarketTickers } from '../lib/supabase';

interface MarketTickerProps {
  tickers?: MarketTickerItem[];
  onOpenAdminMarkets?: () => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({
  tickers: externalTickers,
  onOpenAdminMarkets,
}) => {
  const [internalTickers, setInternalTickers] = useState<MarketTickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalTickers && externalTickers.length > 0) {
      setInternalTickers(externalTickers.filter((t) => t.is_active));
    } else {
      setLoading(true);
      fetchMarketTickers(true).then((data) => {
        setInternalTickers(data);
        setLoading(false);
      });
    }
  }, [externalTickers]);

  const activeItems = externalTickers && externalTickers.length > 0
    ? externalTickers.filter((t) => t.is_active)
    : internalTickers;

  return (
    <div className="w-full bg-white border-b border-[#E2E4E8] text-xs py-2 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Market Status Label */}
        <div className="flex items-center gap-2 text-[#58606E] font-semibold uppercase tracking-wider text-[11px] shrink-0 border-r border-[#E2E4E8] pr-3">
          <span className="w-2 h-2 rounded-full bg-[#0E8A54] animate-pulse"></span>
          <span>LIVE MARKETS</span>
          {onOpenAdminMarkets && (
            <button
              onClick={onOpenAdminMarkets}
              title="Configure Live Markets in Admin Studio"
              className="p-1 rounded hover:bg-[#F3E5F5] text-[#8A92A0] hover:text-[#6A1B9A] transition-colors ml-0.5"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scrolling / Overflowing Ticker Items */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth py-0.5 whitespace-nowrap">
          {activeItems.length === 0 ? (
            <span className="text-[#8A92A0] text-[11px] italic">
              No active market tickers configured in Admin Studio.
            </span>
          ) : (
            activeItems.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2 shrink-0">
                <span className="font-bold text-[#1E2229]">{item.symbol}</span>
                <span className="text-[#58606E] tabular-nums font-medium">{item.price}</span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                    item.is_positive
                      ? 'bg-[#E8F5EE] text-[#0E8A54]'
                      : 'bg-[#FDECEC] text-[#D32F2F]'
                  }`}
                >
                  {item.is_positive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {item.change}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Feed Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#8A92A0] shrink-0 border-l border-[#E2E4E8] pl-3">
          <Clock className="w-3 h-3 text-[#58606E]" />
          <span>Real-time Supabase Feed</span>
        </div>
      </div>
    </div>
  );
};


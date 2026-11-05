import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Settings2,
  Flame,
  Rocket,
  Activity,
  Pause,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MarketTickerItem, TrendingStockItem, IpoItemRecord } from '../types/story';
import { fetchMarketTickers, DEFAULT_MARKET_TICKERS } from '../lib/supabase';
import { DEFAULT_TRENDING_STOCKS } from '../lib/marketData';

interface MarketTickerProps {
  tickers?: MarketTickerItem[];
  trendingStocks?: TrendingStockItem[];
  ipos?: IpoItemRecord[];
  onOpenAdminMarkets?: () => void;
  onSelectCategory?: (category: string) => void;
  onOpenIpoWatch?: () => void;
}

type TickerCategoryFilter = 'all' | 'indices' | 'movers' | 'ipos';

interface UnifiedTickerItem {
  id: string;
  type: 'index' | 'mover' | 'ipo';
  badgeLabel?: string;
  symbol: string;
  name?: string;
  primaryValue: string;
  changeValue?: string;
  isPositive?: boolean;
  extraMeta?: string;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({
  tickers: externalTickers,
  trendingStocks: externalTrending = [],
  ipos: externalIpos = [],
  onOpenAdminMarkets,
  onSelectCategory,
  onOpenIpoWatch,
}) => {
  const [internalTickers, setInternalTickers] = useState<MarketTickerItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<TickerCategoryFilter>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [tickerSpeed, setTickerSpeed] = useState<'slow' | 'extra-slow' | 'standard'>('extra-slow');

  useEffect(() => {
    if (externalTickers && externalTickers.length > 0) {
      setInternalTickers(externalTickers.filter((t) => t.is_active));
    } else {
      fetchMarketTickers(true).then((data) => {
        if (data && data.length > 0) {
          setInternalTickers(data);
        } else {
          setInternalTickers(DEFAULT_MARKET_TICKERS);
        }
      });
    }
  }, [externalTickers]);

  const activeIndices =
    externalTickers && externalTickers.length > 0
      ? externalTickers.filter((t) => t.is_active)
      : internalTickers.length > 0
      ? internalTickers
      : DEFAULT_MARKET_TICKERS;

  const activeMovers =
    externalTrending.length > 0
      ? externalTrending.filter((s) => s.is_published)
      : DEFAULT_TRENDING_STOCKS;

  const activeIpos = externalIpos.length > 0 ? externalIpos.filter((i) => i.is_published) : [];

  // Build unified items stream based on the selected filter
  const unifiedStream: UnifiedTickerItem[] = useMemo(() => {
    const list: UnifiedTickerItem[] = [];

    // 1. Indices
    if (activeFilter === 'all' || activeFilter === 'indices') {
      activeIndices.forEach((item) => {
        list.push({
          id: `index-${item.id}`,
          type: 'index',
          badgeLabel: 'INDEX',
          symbol: item.symbol,
          primaryValue: item.price,
          changeValue: item.change,
          isPositive: item.is_positive,
        });
      });
    }

    // 2. Top Movers & Trending Stocks
    if (activeFilter === 'all' || activeFilter === 'movers') {
      activeMovers.forEach((stock) => {
        const isUp = stock.trend_type === 'gainer' || !String(stock.percent_change).startsWith('-');
        const changeRaw = String(stock.percent_change || '');
        const changeStr = changeRaw.includes('%') ? changeRaw : `${isUp ? '+' : ''}${changeRaw}%`;
        const symbolStr = stock.ticker_id || stock.company_name;
        const priceStr = String(stock.price).startsWith('₹') ? String(stock.price) : `₹${stock.price}`;

        list.push({
          id: `mover-${stock.id}`,
          type: 'mover',
          badgeLabel: stock.trend_type === 'gainer' ? 'GAINER' : 'LOSER',
          symbol: symbolStr,
          name: stock.company_name,
          primaryValue: priceStr,
          changeValue: changeStr,
          isPositive: isUp,
          extraMeta: stock.volume ? `Vol: ${stock.volume}` : undefined,
        });
      });
    }

    // 3. Upcoming & Active IPOs
    if (activeFilter === 'all' || activeFilter === 'ipos') {
      activeIpos.forEach((ipo) => {
        const statusLabel =
          ipo.status === 'active'
            ? 'IPO OPEN'
            : ipo.status === 'upcoming'
            ? 'UPCOMING IPO'
            : 'LISTED';

        const priceStr =
          ipo.min_price && ipo.max_price && ipo.min_price !== ipo.max_price
            ? `₹${ipo.min_price} - ₹${ipo.max_price}`
            : `₹${ipo.issue_price || ipo.max_price || 0}`;

        list.push({
          id: `ipo-${ipo.id}`,
          type: 'ipo',
          badgeLabel: statusLabel,
          symbol: ipo.symbol,
          name: ipo.name,
          primaryValue: priceStr,
          changeValue: ipo.category || (ipo.is_sme ? 'SME' : 'Mainboard'),
          isPositive: ipo.status === 'active',
          extraMeta: ipo.bidding_end_date ? `Closes: ${ipo.bidding_end_date}` : undefined,
        });
      });
    }

    return list;
  }, [activeFilter, activeIndices, activeMovers, activeIpos]);

  // Duplicate stream for seamless CSS infinite marquee
  const marqueeItems = useMemo(() => {
    if (unifiedStream.length === 0) return [];
    // Ensure we have enough items for full screen width loop
    const doubled = [...unifiedStream, ...unifiedStream];
    if (doubled.length < 16) {
      return [...doubled, ...doubled];
    }
    return doubled;
  }, [unifiedStream]);

  return (
    <div
      className={`w-full bg-[#0E131F] border-b border-[#1E2638] text-white text-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.15)] relative z-20 ${
        isPaused ? 'ticker-paused' : ''
      }`}
    >
      <div className="max-w-[100vw] mx-auto flex items-center">
        {/* ========================================================= */}
        {/* LEFT CONTROL STRIP: Status & View Switcher               */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0E17] border-r border-[#1E2638] shrink-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
          {/* Live Market Indicator */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#1E2638]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E676]"></span>
            </span>
            <span className="text-[10px] font-black tracking-wider text-[#00E676] uppercase hidden sm:inline">
              LIVE
            </span>
          </div>

          {/* Quick Pill Filter */}
          <div className="flex items-center gap-1 bg-[#141A29] p-0.5 rounded-md border border-[#232D42]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#903E97] text-white shadow-xs'
                  : 'text-[#8C98AC] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('indices')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                activeFilter === 'indices'
                  ? 'bg-[#903E97] text-white shadow-xs'
                  : 'text-[#8C98AC] hover:text-white'
              }`}
            >
              Indices
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('movers')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                activeFilter === 'movers'
                  ? 'bg-[#903E97] text-white shadow-xs'
                  : 'text-[#8C98AC] hover:text-white'
              }`}
            >
              <Flame className="w-2.5 h-2.5 text-[#FF9100]" />
              <span>Movers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ipos')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                activeFilter === 'ipos'
                  ? 'bg-[#903E97] text-white shadow-xs'
                  : 'text-[#8C98AC] hover:text-white'
              }`}
            >
              <Rocket className="w-2.5 h-2.5 text-[#A855F7]" />
              <span>IPOs</span>
            </button>
          </div>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live scrolling' : 'Pause ticker to read'}
            className="p-1 rounded bg-[#141A29] hover:bg-[#1E2638] text-[#8C98AC] hover:text-white border border-[#232D42] transition-colors"
          >
            {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
          </button>

          {/* Speed Toggle (Extra Slow 0.5x / Slow 0.75x / Standard 1.0x) */}
          <button
            type="button"
            onClick={() => {
              setTickerSpeed((prev) =>
                prev === 'extra-slow' ? 'slow' : prev === 'slow' ? 'standard' : 'extra-slow'
              );
            }}
            title={`Speed: ${
              tickerSpeed === 'extra-slow'
                ? 'Ultra Slow (180s - 0.5x)'
                : tickerSpeed === 'slow'
                ? 'Slow (120s - 0.75x)'
                : 'Standard (80s - 1.0x)'
            }. Click to cycle.`}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#141A29] hover:bg-[#1E2638] text-[#8C98AC] hover:text-white border border-[#232D42] transition-colors tabular-nums"
          >
            {tickerSpeed === 'extra-slow' ? '0.5x' : tickerSpeed === 'slow' ? '0.75x' : '1.0x'}
          </button>
        </div>

        {/* ========================================================= */}
        {/* CENTER: INFINITE SMOOTH SCROLLING MARQUEE TRACK           */}
        {/* ========================================================= */}
        <div className="overflow-hidden flex-1 relative py-1.5">
          {marqueeItems.length === 0 ? (
            <div className="px-4 text-[11px] text-[#8C98AC] italic">
              Loading market ticker data...
            </div>
          ) : (
            <div
              className="animate-ticker flex items-center gap-7"
              style={{
                animationDuration:
                  tickerSpeed === 'extra-slow' ? '180s' : tickerSpeed === 'slow' ? '120s' : '80s',
              }}
            >
              {marqueeItems.map((item, index) => {
                const isPositive = item.isPositive ?? true;

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="inline-flex items-center gap-2.5 shrink-0 px-2 py-0.5 rounded hover:bg-[#161D2E] transition-colors cursor-default group"
                    title={item.name ? `${item.name} (${item.symbol})` : item.symbol}
                  >
                    {/* Badge / Type tag */}
                    {item.badgeLabel && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded tracking-wider ${
                          item.type === 'ipo'
                            ? 'bg-[#7C3AED]/25 text-[#C084FC] border border-[#7C3AED]/40'
                            : item.type === 'mover'
                            ? isPositive
                              ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                              : 'bg-[#FF5252]/15 text-[#FF5252] border border-[#FF5252]/30'
                            : 'bg-[#2A3449] text-[#94A3B8]'
                        }`}
                      >
                        {item.badgeLabel}
                      </span>
                    )}

                    {/* Stock / Index Symbol */}
                    <span className="font-extrabold text-[12px] tracking-tight text-white group-hover:text-[#F3E5F5] transition-colors">
                      {item.symbol}
                    </span>

                    {/* Primary Value (Price or Price band) */}
                    <span className="tabular-nums font-semibold text-[12px] text-[#E2E8F0]">
                      {item.primaryValue}
                    </span>

                    {/* Change % or Category pill */}
                    {item.changeValue && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-extrabold tabular-nums ${
                          item.type === 'ipo'
                            ? 'bg-[#261E38] text-[#E9D5FF]'
                            : isPositive
                            ? 'bg-[#052E16] text-[#4ADE80] border border-[#166534]'
                            : 'bg-[#3B070B] text-[#F87171] border border-[#991B1B]'
                        }`}
                      >
                        {item.type !== 'ipo' && (
                          isPositive ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )
                        )}
                        <span>{item.changeValue}</span>
                      </span>
                    )}

                    {/* Separator diamond */}
                    <span className="text-[#232D42] text-[10px] ml-1">&#9670;</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT CONTROL: Admin Shortcut / Timestamp                */}
        {/* ========================================================= */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-[#0A0E17] border-l border-[#1E2638] shrink-0 z-30 text-[10px] text-[#8C98AC]">
          <Clock className="w-3 h-3 text-[#00E676]" />
          <span>Real-Time BSE/NSE</span>

          {onOpenAdminMarkets && (
            <button
              type="button"
              onClick={onOpenAdminMarkets}
              title="Admin Market Studio Settings"
              className="p-1 rounded hover:bg-[#1E2638] text-[#8C98AC] hover:text-[#903E97] transition-colors ml-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

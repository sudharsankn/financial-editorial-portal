import React, { useState, useEffect, useRef } from 'react';
import {
  Story,
  StoryFormData,
  SECTIONS,
  CATEGORIES,
  PUBLISHING_STATUSES,
  Section,
  Category,
  PublishingStatus,
  NotificationStatus,
  MarketTickerItem,
  MarketTickerFormData,
} from '../types/story';
import { RichTextEditor } from './RichTextEditor';
import { formatTimeAgo } from '../lib/timeAgo';
import { StockDataPanel } from './StockDataPanel';
import {
  countGraphemes,
  generateCanonicalSlug,
  detectScript,
} from '../lib/grapheme';
import {
  uploadLeadImageToSupabase,
  saveMarketTicker,
  deleteMarketTicker,
  resetDefaultMarketTickers,
} from '../lib/supabase';
import {
  compressAndCropTo560x320,
  formatBytes,
  CompressionResult,
} from '../lib/imageCompressor';
import {
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  UploadCloud,
  FileImage,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Globe,
  Settings2,
} from 'lucide-react';

interface AdminPanelProps {
  stories: Story[];
  loading: boolean;
  onSaveStory: (data: StoryFormData) => Promise<{ success: boolean; error?: string }>;
  onDeleteStory: (id: string) => Promise<{ success: boolean; error?: string }>;
  onViewStory: (canonicalUrl: string) => void;
  activeEditingStory: Story | null;
  onClearActiveStory: () => void;
  marketTickers: MarketTickerItem[];
  onRefreshMarketTickers: () => Promise<void>;
  initialAdminTab?: 'stories' | 'markets' | 'stocks';
}


const PRESET_IMAGES = [
  {
    name: 'Stock Exchange Floor',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80',
  },
  {
    name: 'Market Chart Bullish',
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=560&h=320&q=80',
  },
  {
    name: 'Green Energy Infrastructure',
    url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=560&h=320&q=80',
  },
  {
    name: 'Rupee & Currency Coins',
    url: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=560&h=320&q=80',
  },
  {
    name: 'Digital Banking & Tax',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=560&h=320&q=80',
  },
  {
    name: 'Global Financial Hub',
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=560&h=320&q=80',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  stories,
  loading,
  onSaveStory,
  onDeleteStory,
  onViewStory,
  activeEditingStory,
  onClearActiveStory,
  marketTickers,
  onRefreshMarketTickers,
  initialAdminTab = 'stories',
}) => {
  const [adminTab, setAdminTab] = useState<'stories' | 'markets' | 'stocks'>(initialAdminTab);
  // Mode: 'list' (dashboard) or 'editor' (form)
  const [mode, setMode] = useState<'list' | 'editor'>('list');

  // Filters for Dashboard list
  const [filterSection, setFilterSection] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Market Tickers Admin State
  const initialTickerState: MarketTickerFormData = {
    symbol: '',
    price: '',
    change: '+0.50%',
    is_positive: true,
    display_order: (marketTickers?.length || 0) + 1,
    is_active: true,
  };
  const [tickerFormData, setTickerFormData] = useState<MarketTickerFormData>(initialTickerState);
  const [tickerModalOpen, setTickerModalOpen] = useState(false);
  const [tickerSaving, setTickerSaving] = useState(false);
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);

  const handleOpenAddTicker = () => {
    setTickerFormData({
      symbol: '',
      price: '',
      change: '+0.50%',
      is_positive: true,
      display_order: (marketTickers?.length || 0) + 1,
      is_active: true,
    });
    setEditingTickerId(null);
    setTickerModalOpen(true);
  };

  const handleOpenEditTicker = (ticker: MarketTickerItem) => {
    setTickerFormData({
      id: ticker.id,
      symbol: ticker.symbol,
      price: ticker.price,
      change: ticker.change,
      is_positive: ticker.is_positive,
      display_order: ticker.display_order,
      is_active: ticker.is_active,
    });
    setEditingTickerId(ticker.id);
    setTickerModalOpen(true);
  };

  const handleSaveTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerFormData.symbol.trim() || !tickerFormData.price.trim() || !tickerFormData.change.trim()) {
      setMessage({ type: 'error', text: 'Symbol, Price, and Change are all required.' });
      return;
    }

    setTickerSaving(true);
    const res = await saveMarketTicker({
      ...tickerFormData,
      id: editingTickerId || undefined,
    });
    setTickerSaving(false);

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Market quote "${tickerFormData.symbol}" saved to Supabase (public.market_tickers)!`,
      });
      setTickerModalOpen(false);
      await onRefreshMarketTickers();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save market ticker.' });
    }
  };

  const handleDeleteTicker = async (id: string, symbol: string) => {
    if (window.confirm(`Delete "${symbol}" from live market ticker?`)) {
      const res = await deleteMarketTicker(id);
      if (res.success) {
        setMessage({ type: 'success', text: `Removed "${symbol}" from live markets.` });
        await onRefreshMarketTickers();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to delete ticker.' });
      }
    }
  };

  const handleToggleTickerActive = async (ticker: MarketTickerItem) => {
    const res = await saveMarketTicker({
      ...ticker,
      is_active: !ticker.is_active,
    });
    if (res.success) {
      await onRefreshMarketTickers();
    }
  };

  const handleResetTickers = async () => {
    if (window.confirm('Reset all live market tickers to default indices (NIFTY 50, SENSEX, BRENT, GOLD, NASDAQ)?')) {
      resetDefaultMarketTickers();
      await onRefreshMarketTickers();
      setMessage({ type: 'success', text: 'Live market tickers reset to defaults.' });
    }
  };


  // Form State
  const initialFormState: StoryFormData = {
    section: 'Investment Insights',
    category: 'Big Story',
    heading: '',
    lead_image_url:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=560&h=320&q=80',
    short_description: '',
    full_story: '',
    canonical_url: '',
    keywords: '',
    seo_title: '',
    seo_description: '',
    publishing_status: 'Draft',
    notification_status: 'No',
    display_order: 0,
  };

  const [formData, setFormData] = useState<StoryFormData>(initialFormState);
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Image Upload & Compression state
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [compressing, setCompressing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: string;
    compressedSize: string;
    savings: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }

    try {
      setCompressing(true);
      setMessage(null);

      // 1. Center-crop to exact 560x320 (Retina 1120x640) & compress to lightweight JPEG
      const compressed = await compressAndCropTo560x320(file, 1120, 640, 0.85);

      setCompressionStats({
        originalSize: formatBytes(compressed.originalSize),
        compressedSize: formatBytes(compressed.compressedSize),
        savings: compressed.savingsPercent,
      });

      setCompressing(false);
      setUploadingImage(true);

      // 2. Upload compressed JPEG blob to Supabase Storage bucket 'story-images'
      const uploadRes = await uploadLeadImageToSupabase(compressed.blob, file.name);
      setUploadingImage(false);

      if (uploadRes.success && uploadRes.publicUrl) {
        setFormData((prev) => ({ ...prev, lead_image_url: uploadRes.publicUrl! }));
        setMessage({
          type: 'success',
          text: uploadRes.isLocalFallback
            ? `Image compressed from ${formatBytes(compressed.originalSize)} to ${formatBytes(compressed.compressedSize)} (-${compressed.savingsPercent}%) and cropped to 560x320!`
            : `Image compressed (-${compressed.savingsPercent}%) and saved in Supabase bucket ('story-images')!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: uploadRes.error || 'Failed to upload image to Supabase Storage.',
        });
      }
    } catch (err: any) {
      setCompressing(false);
      setUploadingImage(false);
      setMessage({ type: 'error', text: err?.message || 'Error processing image' });
    }
  };


  // If activeEditingStory passed from props, open editor
  useEffect(() => {
    if (activeEditingStory) {
      setFormData(activeEditingStory);
      setAutoSlug(false);
      setMode('editor');
    }
  }, [activeEditingStory]);

  const handleFillSample = (lang: 'en' | 'ml' = 'en') => {
    if (lang === 'en') {
      setFormData({
        section: 'Investment Insights',
        category: 'Stock Recommendations',
        heading: 'Semiconductor Boom: Top 3 Indian Chip Design Stocks to Watch',
        lead_image_url:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=560&h=320&q=80',
        short_description:
          '<p>Government incentives and global fab tie-ups position domestic fabless semiconductor designers for exponential order book expansion.</p>',
        full_story:
          '<h2>The Global Silicon Re-shoring Wave</h2><p>With massive sovereign subsidy programs and multi-billion-dollar investments into automated testing and packaging facilities, India is rapidly advancing in the global electronics value chain.</p><h3>Key Growth Catalysts</h3><ul><li>Substantial fiscal capital subsidy payouts under the SPECS scheme</li><li>Automotive EV microcontroller design wins</li><li>Export orders to North America and Western Europe</li></ul><h3>Portfolio Takeaway</h3><p>Investors should adopt a staged accumulation approach given near-term valuation multiples.</p>',
        canonical_url: 'semiconductor-boom-top-3-indian-chip-stocks-2026',
        keywords: 'Semiconductors, Chip Design, Electronics, Stock Market, Investment Insights',
        seo_title: 'Semiconductor Boom: Top 3 Indian Chip Stocks to Watch in 2026',
        seo_description:
          'Discover top domestic semiconductor and embedded software plays benefiting from sovereign subsidy schemes and global export growth.',
        publishing_status: 'Published',
        notification_status: 'Yes',
        display_order: 1,
      });
      setAutoSlug(false);
      setMessage({ type: 'success', text: 'Loaded sample English article data into all fields!' });
    } else {
      setFormData({
        section: 'Market News',
        category: 'Market Trends',
        heading: 'കേരളത്തിലെ സ്റ്റാർട്ടപ്പുകൾക്ക് വൻ നിക്ഷേപ മുന്നേറ്റം',
        lead_image_url:
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=560&h=320&q=80',
        short_description:
          '<p>ഫിൻടെക്, ഹെൽത്ത്‌ടെക് മേഖലകളിലെ മുൻനിര കേരള സ്റ്റാർട്ടപ്പുകൾ ആഗോള വെഞ്ചർ കാപിറ്റൽ ഫണ്ടുകളിൽ നിന്ന് വൻ തുക സമാഹരിച്ചു.</p>',
        full_story:
          '<h2>ടെക്നോപാർക്കിലും ഇൻഫോപാർക്കിലും പുതിയ കുതിപ്പ്</h2><p>ദക്ഷിണേന്ത്യയിലെ പ്രമുഖ ടെക്നോളജി ഹബ്ബുകളായി കൊച്ചിയും തിരുവനന്തപുരവും അതിവേഗം വളരുകയാണ്. ഡിജിറ്റൽ ബാങ്കിംഗ് സൊല്യൂഷനുകൾ നൽകുന്ന സ്റ്റാർട്ടപ്പുകൾക്കാണ് കൂടുതൽ നിക്ഷേപം ലഭിച്ചത്.</p><h3>പ്രധാന നിക്ഷേപ നേട്ടങ്ങൾ</h3><p>പ്രാദേശിക സംരംഭകർക്ക് അന്താരാഷ്ട്ര വിപണിയിലേക്ക് ചുവടുവെക്കാൻ ഇത് വഴിയൊരുക്കുന്നു.</p>',
        canonical_url: 'kerala-startups-record-venture-capital-growth-2026',
        keywords: 'സ്റ്റാർട്ടപ്പ്, കേരളം, വെഞ്ചർ കാപിറ്റൽ, സാമ്പത്തിക വാർത്തകൾ, നിക്ഷേപം',
        seo_title: 'കേരളത്തിലെ സ്റ്റാർട്ടപ്പുകൾക്ക് വൻ നിക്ഷേപം: സമഗ്ര സാമ്പത്തിക റിപ്പോർട്ട്',
        seo_description:
          'കേരളത്തിലെ ടെക്നോളജി സ്റ്റാർട്ടപ്പുകളുടെ വിദേശ നിക്ഷേപ സമാഹരണവും ഭാവി വളർച്ചാ സാധ്യതകളും.',
        publishing_status: 'Published',
        notification_status: 'No',
        display_order: 2,
      });
      setAutoSlug(false);
      setMessage({ type: 'success', text: 'Loaded sample Malayalam multilingual article data!' });
    }
  };

  const handleStartCreate = () => {
    setFormData(initialFormState);
    setAutoSlug(true);
    onClearActiveStory();
    setMode('editor');
    setMessage(null);
  };

  const handleStartEdit = (story: Story) => {
    setFormData(story);
    setAutoSlug(false);
    setMode('editor');
    setMessage(null);
  };

  // Handle heading change with auto-slug and grapheme calculation
  const handleHeadingChange = (text: string) => {
    const updated: StoryFormData = { ...formData, heading: text };
    if (autoSlug) {
      updated.canonical_url = generateCanonicalSlug(text);
    }
    if (!formData.seo_title || formData.seo_title === formData.heading) {
      updated.seo_title = text;
    }
    setFormData(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const graphemeCount = countGraphemes(formData.heading);
    if (!formData.heading.trim()) {
      setMessage({ type: 'error', text: 'Heading is required.' });
      return;
    }
    if (graphemeCount > 70) {
      setMessage({
        type: 'error',
        text: `Heading exceeds 70 graphemes (currently ${graphemeCount} characters). Please shorten it.`,
      });
      return;
    }
    if (!formData.canonical_url.trim()) {
      setMessage({ type: 'error', text: 'Canonical URL slug is required.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await onSaveStory(formData);
    setSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Story successfully saved to Supabase / database!' });
      setTimeout(() => {
        setMode('list');
        onClearActiveStory();
      }, 1200);
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save story.' });
    }
  };

  const handleDelete = async (id: string, heading: string) => {
    if (window.confirm(`Are you sure you want to delete "${heading}"?`)) {
      const res = await onDeleteStory(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Story removed successfully.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to delete story.' });
      }
    }
  };

  // Quick toggle status between Draft and Published in table
  const handleTogglePublish = async (story: Story) => {
    const newStatus: PublishingStatus =
      story.publishing_status === 'Published' ? 'Draft' : 'Published';
    await onSaveStory({
      ...story,
      publishing_status: newStatus,
    });
  };

  // Filtered stories in dashboard
  const filteredStories = stories.filter((s) => {
    if (filterSection !== 'All' && s.section !== filterSection) return false;
    if (filterCategory !== 'All' && s.category !== filterCategory) return false;
    if (filterStatus !== 'All' && s.publishing_status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.heading.toLowerCase().includes(q) ||
        s.canonical_url.toLowerCase().includes(q) ||
        s.keywords?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const headingGraphemes = countGraphemes(formData.heading);
  const headingScript = detectScript(formData.heading);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Notifications Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#E8F5EE] border-[#0E8A54]/40 text-[#0E8A54]'
              : 'bg-[#FDECEC] border-[#D32F2F]/40 text-[#D32F2F]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-sm font-bold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Admin Studio Navigation Tabs: Stories Manager vs Live Markets */}
      <div className="flex items-center gap-2 border-b border-[#E2E4E8] mb-6">
        <button
          type="button"
          onClick={() => {
            setAdminTab('stories');
            setMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
            adminTab === 'stories'
              ? 'border-[#6A1B9A] text-[#6A1B9A]'
              : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stories Manager</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBEEF7] text-[#58606E]">
            {stories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('markets');
            setMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
            adminTab === 'markets'
              ? 'border-[#6A1B9A] text-[#6A1B9A]'
              : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#0E8A54]" />
          <span>Live Markets Ticker</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54]">
            {marketTickers?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('stocks');
            setMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
            adminTab === 'stocks'
              ? 'border-[#6A1B9A] text-[#6A1B9A]'
              : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
          }`}
        >
          <Globe className="w-4 h-4 text-[#6A1B9A]" />
          <span>IndianAPI Stock Data</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7FC] text-[#6A1B9A] border border-[#6A1B9A]/30">
            500/mo
          </span>
        </button>
      </div>

      {/* TAB 1: STORIES MANAGER */}
      {adminTab === 'stories' && (
        <>
          {/* VIEW: DASHBOARD LIST */}
          {mode === 'list' && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E4E8]">
                <div>
                  <h2 className="font-['Open_Sans'] font-extrabold text-2xl text-[#1E2229]">
                    Editorial Stories Manager
                  </h2>
                  <p className="text-xs text-[#58606E]">
                    Oversee multi-language articles, drafts, and publishing status in Supabase
                  </p>
                </div>

            <button
              onClick={handleStartCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Story</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded border border-[#E2E4E8] p-4 flex flex-wrap items-center gap-3 text-xs shadow-xs">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A92A0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by heading, slug, keywords..."
                className="w-full pl-9 pr-3 py-1.5 rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#8A92A0] font-semibold">Section:</span>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="bg-[#F4F4F6] border border-[#E2E4E8] rounded px-2.5 py-1 text-xs outline-none"
              >
                <option value="All">All Sections</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#8A92A0] font-semibold">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#F4F4F6] border border-[#E2E4E8] rounded px-2.5 py-1 text-xs outline-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#8A92A0] font-semibold">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#F4F4F6] border border-[#E2E4E8] rounded px-2.5 py-1 text-xs outline-none"
              >
                <option value="All">All Statuses</option>
                {PUBLISHING_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stories Data Table */}
          <div className="bg-white rounded border border-[#E2E4E8] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F6] border-b border-[#E2E4E8] text-[#58606E] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Story &amp; Script</th>
                    <th className="py-3 px-3">Taxonomy</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Order</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4E8]/80">
                  {filteredStories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8A92A0]">
                        No stories match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStories.map((story) => {
                      const script = detectScript(story.heading);
                      return (
                        <tr key={story.id} className="hover:bg-[#FAF7FC]/60 transition-colors">
                          {/* Image & Heading */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={story.lead_image_url}
                                alt=""
                                className="w-14 h-8 object-cover rounded border border-[#E2E4E8] shrink-0"
                              />
                              <div className="max-w-md">
                                <span className="font-bold text-[#1E2229] hover:text-[#6A1B9A] line-clamp-1">
                                  {story.heading}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8A92A0]">
                                  <span className="font-mono">/{story.canonical_url}</span>
                                  <span>•</span>
                                  <span className="text-[#6A1B9A] font-semibold">
                                    {script.name}
                                  </span>
                                  {story.source_type === 'indianapi_news' && (
                                    <>
                                      <span>•</span>
                                      <span className="bg-[#FAF7FC] text-[#6A1B9A] font-bold px-1.5 py-0.2 rounded border border-[#6A1B9A]/30">
                                        IndianAPI News
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Taxonomy */}
                          <td className="py-3 px-3">
                            <span className="block font-semibold text-[#1E2229]">
                              {story.section}
                            </span>
                            <span className="text-[11px] text-[#8A92A0]">
                              {story.category}
                            </span>
                          </td>

                          {/* Publishing Status */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleTogglePublish(story)}
                              title="Click to toggle Draft / Published"
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                story.publishing_status === 'Published'
                                  ? 'bg-[#E8F5EE] text-[#0E8A54]'
                                  : story.publishing_status === 'Ready to Publish'
                                  ? 'bg-[#F3E5F5] text-[#6A1B9A]'
                                  : story.publishing_status === 'Retired'
                                  ? 'bg-[#EBEEF7] text-[#8A92A0]'
                                  : 'bg-[#FFF8E1] text-[#B78103]'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              <span>{story.publishing_status}</span>
                            </button>
                          </td>

                          {/* Display Order */}
                          <td className="py-3 px-3 text-center tabular-nums font-bold text-[#58606E]">
                            {story.display_order}
                          </td>

                          {/* Date with Relative Time */}
                          <td className="py-3 px-3 text-[11px] text-[#8A92A0] whitespace-nowrap" title={new Date(story.created_at).toLocaleString()}>
                            <span className="font-semibold text-[#1E2229] block">{formatTimeAgo(story.created_at)}</span>
                            <span className="text-[10px] text-[#8A92A0]">{new Date(story.created_at).toLocaleDateString()}</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onViewStory(story.canonical_url)}
                                title="View public article"
                                className="p-1 rounded hover:bg-[#EBEEF7] text-[#58606E] hover:text-[#6A1B9A]"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(story)}
                                title="Edit story"
                                className="p-1 rounded hover:bg-[#EBEEF7] text-[#58606E] hover:text-[#6A1B9A]"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(story.id, story.heading)}
                                title="Delete story"
                                className="p-1 rounded hover:bg-[#FDECEC] text-[#58606E] hover:text-[#D32F2F]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-[#F4F4F6] border-t border-[#E2E4E8] text-xs text-[#8A92A0] flex items-center justify-between">
              <span>Showing {filteredStories.length} of {stories.length} stories</span>
              <span className="text-[11px]">Database table: public.stories (UTF-8)</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: STORY EDITOR FORM */}
      {mode === 'editor' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Top Bar with Back & Save */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E4E8]">
            <button
              type="button"
              onClick={() => {
                setMode('list');
                onClearActiveStory();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#58606E] hover:text-[#1E2229]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stories Manager</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] text-xs font-semibold text-[#1E2229]"
              >
                <Eye className="w-3.5 h-3.5 text-[#6A1B9A]" />
                <span>{previewOpen ? 'Hide Preview' : 'Live Preview'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{formData.id ? 'Update Story' : 'Save & Publish'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Drawer (if toggled) */}
          {previewOpen && (
            <div className="p-6 bg-[#FAF7FC] border border-[#DA9CFF] rounded mb-6">
              <span className="text-xs font-bold text-[#6A1B9A] uppercase tracking-wider block mb-3">
                Live Card Preview (Strict 560x320 Image Aspect Ratio)
              </span>
              <div className="max-w-md mx-auto bg-white rounded border border-[#E2E4E8] shadow-md p-4">
                <div className="aspect-[7/4] bg-[#EBEEF7] rounded overflow-hidden mb-3">
                  <img
                    src={formData.lead_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#6A1B9A] bg-[#6A1B9A]/5 uppercase">
                    {formData.category}
                  </span>
                  <span className="text-[10px] text-[#8A92A0]">NOW</span>
                </div>
                <h4 className="font-bold text-base text-[#1E2229] mb-1">
                  {formData.heading || 'Article Heading Preview...'}
                </h4>
                <div
                  className="text-xs text-[#58606E] line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: formData.short_description || '<p>Description excerpt...</p>',
                  }}
                />
              </div>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Core Editorial Content (Cols 1 to 8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section & Category Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1.5">
                    Section <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value as Section })
                    }
                    className="w-full bg-white border border-[#E2E4E8] rounded p-2.5 text-xs text-[#1E2229] font-medium focus:border-[#6A1B9A] outline-none"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1.5">
                    Category / Tag <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as Category })
                    }
                    className="w-full bg-white border border-[#E2E4E8] rounded p-2.5 text-xs text-[#1E2229] font-medium focus:border-[#6A1B9A] outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Heading with Live Grapheme Counter (Max 70 graphemes) */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1.5">
                    <span>Heading</span>
                    <span className="text-[#BA1A1A]">*</span>
                    <span className="text-[10px] font-normal text-[#8A92A0]">
                      (Max 70 Grapheme Characters across all scripts)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#6A1B9A] bg-[#F3E5F5] px-1.5 py-0.5 rounded">
                      {headingScript.name}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                        headingGraphemes > 70
                          ? 'bg-[#FDECEC] text-[#D32F2F]'
                          : headingGraphemes >= 60
                          ? 'bg-[#FFF8E1] text-[#B78103]'
                          : 'bg-[#E8F5EE] text-[#0E8A54]'
                      }`}
                    >
                      {headingGraphemes} / 70
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={formData.heading}
                  onChange={(e) => handleHeadingChange(e.target.value)}
                  placeholder="Enter headline (English, മലയാളം, हिन्दी, தமிழ், العربية...)"
                  className={`w-full p-2.5 text-sm font-semibold rounded border outline-none transition-colors ${
                    headingGraphemes > 70
                      ? 'border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]'
                      : 'border-[#E2E4E8] focus:border-[#6A1B9A] focus:ring-1 focus:ring-[#6A1B9A]'
                  }`}
                />

                {headingGraphemes > 70 && (
                  <p className="text-[11px] text-[#D32F2F] mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Heading exceeds 70 graphemes by {headingGraphemes - 70} characters.
                  </p>
                )}
              </div>

              {/* Short Description Rich Text Editor */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4">
                <RichTextEditor
                  label="Short Description (Summary Excerpt)"
                  value={formData.short_description}
                  onChange={(val) => setFormData({ ...formData, short_description: val })}
                  placeholder="Brief synopsis for subscriber feed cards and search results..."
                  minHeight="100px"
                  simple={true}
                  helperText="Appears on story cards"
                />
              </div>

              {/* Full Story Rich Text Editor */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4">
                <RichTextEditor
                  label="Full Story (Complete Article)"
                  value={formData.full_story}
                  onChange={(val) => setFormData({ ...formData, full_story: val })}
                  placeholder="Compose full editorial report with headers, bullet points, quotes and external links..."
                  minHeight="260px"
                  simple={false}
                  helperText="Full formatting & multi-script IME support"
                />
              </div>
            </div>

            {/* Right Column: Media, Canonical URL & Metadata (Cols 9 to 12) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Lead Image: Compression & Supabase Bucket Upload (560x320 JPG) */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-[#6A1B9A]" />
                    <span>Lead Image (560x320 JPG)</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#8A92A0]">Ratio: 7:4</span>
                </div>

                {/* Mode Selector: Upload & Compress vs URL */}
                <div className="flex rounded border border-[#E2E4E8] p-0.5 bg-[#F4F4F6] text-xs">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`flex-1 py-1 rounded font-semibold text-center transition-colors flex items-center justify-center gap-1 ${
                      imageTab === 'upload'
                        ? 'bg-white text-[#6A1B9A] shadow-2xs font-bold'
                        : 'text-[#58606E] hover:text-[#1E2229]'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload &amp; Compress</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`flex-1 py-1 rounded font-semibold text-center transition-colors ${
                      imageTab === 'url'
                        ? 'bg-white text-[#6A1B9A] shadow-2xs font-bold'
                        : 'text-[#58606E] hover:text-[#1E2229]'
                    }`}
                  >
                    <span>Image URL / Presets</span>
                  </button>
                </div>

                {/* Upload & Compress Zone */}
                {imageTab === 'upload' && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
                        compressing || uploadingImage
                          ? 'border-[#6A1B9A] bg-[#FAF7FC]'
                          : 'border-[#C8CBD0] hover:border-[#6A1B9A] hover:bg-[#FAF7FC]/50'
                      }`}
                    >
                      {compressing ? (
                        <div className="py-2 flex flex-col items-center gap-1.5 text-xs text-[#6A1B9A] font-semibold">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Compressing &amp; cropping to 560×320...</span>
                        </div>
                      ) : uploadingImage ? (
                        <div className="py-2 flex flex-col items-center gap-1.5 text-xs text-[#6A1B9A] font-semibold">
                          <UploadCloud className="w-5 h-5 animate-pulse" />
                          <span>Uploading to Supabase bucket &apos;story-images&apos;...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <UploadCloud className="w-6 h-6 text-[#6A1B9A] mb-0.5" />
                          <span className="text-xs font-bold text-[#1E2229]">
                            Click to Browse or Drag Image
                          </span>
                          <span className="text-[10px] text-[#8A92A0]">
                            Auto-crops to 560×320 &amp; compresses to lightweight JPG
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compression Savings Metrics Badge */}
                    {compressionStats && (
                      <div className="p-2 rounded bg-[#E8F5EE] border border-[#0E8A54]/30 text-[11px] text-[#0E8A54] flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Compressed to 560×320 JPG</span>
                        </span>
                        <span>
                          {compressionStats.originalSize} → {compressionStats.compressedSize} (-{compressionStats.savings}%)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct URL & Presets Zone */}
                {imageTab === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.lead_image_url}
                      onChange={(e) => setFormData({ ...formData, lead_image_url: e.target.value })}
                      placeholder="https://... (560x320 JPG URL)"
                      className="w-full p-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none"
                    />

                    <div>
                      <span className="text-[11px] font-semibold text-[#58606E] block mb-1">
                        Stock Presets (560x320):
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRESET_IMAGES.slice(0, 3).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, lead_image_url: p.url })}
                            className="text-[10px] p-1 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] text-left truncate text-[#58606E] hover:text-[#1E2229]"
                          >
                            {p.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live 560x320 Aspect Ratio Container Preview */}
                <div className="relative aspect-[7/4] bg-[#EBEEF7] rounded overflow-hidden border border-[#E2E4E8]">
                  <img
                    src={formData.lead_image_url}
                    alt="Lead preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', PRESET_IMAGES[0].url);
                    }}
                  />
                  <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    560 × 320 JPG
                  </span>
                </div>
              </div>

              {/* Canonical URL & Tooltip */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1">
                    <span>Canonical URL Slug</span>
                    <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <label className="text-[11px] text-[#6A1B9A] font-semibold flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="rounded text-[#6A1B9A]"
                    />
                    <span>Auto-sync</span>
                  </label>
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A92A0] font-mono">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.canonical_url}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setFormData({ ...formData, canonical_url: e.target.value });
                    }}
                    placeholder="unknown-story-of-princess-gouramma"
                    className="w-full pl-6 pr-3 py-2 text-xs font-mono rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none"
                  />
                </div>

                <div className="p-2 bg-[#F4F4F6] rounded text-[11px] text-[#58606E] flex items-start gap-1.5 leading-normal">
                  <HelpCircle className="w-3.5 h-3.5 text-[#6A1B9A] shrink-0 mt-0.5" />
                  <span>
                    &ldquo;Please give a proper name for the article page without space where space is replaced with hypen eg:unknown-story-of-princess-gouramma&rdquo;
                  </span>
                </div>
              </div>

              {/* Publishing & Notification Status */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1.5">
                    Publishing Status
                  </label>
                  <select
                    value={formData.publishing_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publishing_status: e.target.value as PublishingStatus,
                      })
                    }
                    className="w-full bg-white border border-[#E2E4E8] rounded p-2 text-xs font-semibold focus:border-[#6A1B9A] outline-none"
                  >
                    {PUBLISHING_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1.5">
                      Notification
                    </label>
                    <select
                      value={formData.notification_status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notification_status: e.target.value as NotificationStatus,
                        })
                      }
                      className="w-full bg-white border border-[#E2E4E8] rounded p-2 text-xs font-medium focus:border-[#6A1B9A] outline-none"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Broadcast)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full p-2 text-xs tabular-nums rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Keywords Section */}
              <div className="bg-white rounded border border-[#E2E4E8] p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="Stock Market, RBI, SIP, Mutual Funds"
                    className="w-full p-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none"
                  />
                  <span className="text-[10px] text-[#8A92A0] block mt-0.5">
                    &ldquo;Please add the relevant Keywords separated by commas&rdquo;
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder="Search engine optimized headline..."
                    className="w-full p-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase tracking-wide mb-1">
                    SEO Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.seo_description}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    placeholder="Meta description for Google Search and social cards..."
                    className="w-full p-2 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
      </>
    )}

    {/* TAB 3: INDIAN STOCK API STUDIO */}
    {adminTab === 'stocks' && (
      <StockDataPanel onNotify={(msg) => setMessage(msg)} onEditStory={handleStartEdit} />
    )}

    {/* TAB 2: LIVE MARKETS TICKER MANAGER */}
    {adminTab === 'markets' && (
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E4E8]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Open_Sans'] font-extrabold text-2xl text-[#1E2229]">
                Live Markets Ticker Studio
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E8A54] animate-pulse" title="Active Marquee Feed"></span>
            </div>
            <p className="text-xs text-[#58606E]">
              Configure every field displayed on the top marquee ticker tape. Saved directly in Supabase (<code className="bg-[#EBEEF7] px-1 py-0.5 rounded font-mono text-[11px]">public.market_tickers</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetTickers}
              className="px-3 py-2 rounded border border-[#E2E4E8] hover:border-[#6A1B9A] text-xs font-semibold text-[#58606E] hover:text-[#1E2229] transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={handleOpenAddTicker}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Market Quote</span>
            </button>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="bg-white rounded border border-[#E2E4E8] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0E8A54]" />
              <span>Live Ticker Tape Preview (Top Marquee)</span>
            </span>
            <span className="text-[11px] text-[#8A92A0]">
              Showing {marketTickers.filter((t) => t.is_active).length} active items
            </span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto p-2 bg-[#F4F4F6] rounded border border-[#E2E4E8] no-scrollbar">
            {marketTickers.filter((t) => t.is_active).length === 0 ? (
              <span className="text-xs text-[#8A92A0] italic">No active ticker items. Add or enable one below.</span>
            ) : (
              marketTickers
                .filter((t) => t.is_active)
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <div key={item.id} className="inline-flex items-center gap-2 shrink-0 bg-white px-2.5 py-1 rounded shadow-2xs">
                    <span className="font-bold text-[#1E2229] text-xs">{item.symbol}</span>
                    <span className="text-[#58606E] tabular-nums font-medium text-xs">{item.price}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        item.is_positive
                          ? 'bg-[#E8F5EE] text-[#0E8A54]'
                          : 'bg-[#FDECEC] text-[#D32F2F]'
                      }`}
                    >
                      {item.is_positive ? '▲' : '▼'} {item.change}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Tickers Data Table */}
        <div className="bg-white rounded border border-[#E2E4E8] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F4F6] border-b border-[#E2E4E8] text-[#58606E] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Live Preview Chip</th>
                  <th className="py-3 px-3">Asset / Symbol</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Change / Delta</th>
                  <th className="py-3 px-3 text-center">Order</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E8]/80">
                {marketTickers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8A92A0]">
                      No market tickers found. Click &quot;Add Market Quote&quot; or &quot;Reset to Defaults&quot;.
                    </td>
                  </tr>
                ) : (
                  marketTickers
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF7FC]/60 transition-colors">
                        {/* Preview Chip */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-2 border border-[#E2E4E8] bg-[#F4F4F6] px-2.5 py-1 rounded">
                            <span className="font-bold text-[#1E2229]">{item.symbol}</span>
                            <span className="text-[#58606E] tabular-nums">{item.price}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                                item.is_positive ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                              }`}
                            >
                              {item.is_positive ? '▲' : '▼'} {item.change}
                            </span>
                          </div>
                        </td>

                        {/* Symbol */}
                        <td className="py-3 px-3 font-bold text-[#1E2229]">
                          {item.symbol}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 font-mono font-medium text-[#1E2229]">
                          {item.price}
                        </td>

                        {/* Change */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] tabular-nums ${
                              item.is_positive ? 'bg-[#E8F5EE] text-[#0E8A54]' : 'bg-[#FDECEC] text-[#D32F2F]'
                            }`}
                          >
                            {item.is_positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {item.change}
                          </span>
                        </td>

                        {/* Display Order */}
                        <td className="py-3 px-3 text-center tabular-nums font-bold text-[#58606E]">
                          {item.display_order}
                        </td>

                        {/* Status (Toggle) */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTickerActive(item)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-transform hover:scale-105 ${
                              item.is_active
                                ? 'bg-[#E8F5EE] text-[#0E8A54]'
                                : 'bg-[#EBEEF7] text-[#8A92A0]'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Hidden'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTicker(item)}
                              title="Edit market quote"
                              className="p-1 rounded hover:bg-[#EBEEF7] text-[#58606E] hover:text-[#6A1B9A]"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTicker(item.id, item.symbol)}
                              title="Delete market quote"
                              className="p-1 rounded hover:bg-[#FDECEC] text-[#58606E] hover:text-[#D32F2F]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#F4F4F6] border-t border-[#E2E4E8] text-xs text-[#8A92A0] flex items-center justify-between">
            <span>Configuring live quotes for top marquee ticker tape</span>
            <span className="font-mono text-[11px]">Database table: public.market_tickers</span>
          </div>
        </div>

        {/* Modal: Add / Edit Market Quote */}
        {tickerModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#181C23]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded border border-[#E2E4E8] w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between p-4 border-b border-[#E2E4E8] bg-[#F4F4F6]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#6A1B9A] text-white flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#1E2229]">
                    {editingTickerId ? 'Edit Market Quote' : 'Add New Market Quote'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTickerModalOpen(false)}
                  className="p-1 rounded hover:bg-[#E2E4E8] text-[#58606E]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveTicker} className="p-5 space-y-4">
                {/* Live Preview of Chip */}
                <div className="p-3 rounded bg-[#FAF7FC] border border-[#DA9CFF]/50">
                  <span className="text-[10px] font-bold text-[#6A1B9A] uppercase tracking-wide block mb-1.5">
                    Live Marquee Chip Preview:
                  </span>
                  <div className="inline-flex items-center gap-2 bg-white border border-[#E2E4E8] px-3 py-1.5 rounded shadow-2xs">
                    <span className="font-bold text-[#1E2229] text-xs">
                      {tickerFormData.symbol || 'SYMBOL'}
                    </span>
                    <span className="text-[#58606E] tabular-nums text-xs">
                      {tickerFormData.price || '0.00'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                        tickerFormData.is_positive
                          ? 'bg-[#E8F5EE] text-[#0E8A54]'
                          : 'bg-[#FDECEC] text-[#D32F2F]'
                      }`}
                    >
                      {tickerFormData.is_positive ? '▲' : '▼'} {tickerFormData.change || '+0.00%'}
                    </span>
                  </div>
                </div>

                {/* Symbol / Asset Name */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                    Asset Symbol / Name <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tickerFormData.symbol}
                    onChange={(e) => setTickerFormData({ ...tickerFormData, symbol: e.target.value })}
                    placeholder="e.g. NIFTY 50, BRENT CRUDE, GOLD (10g), BITCOIN"
                    className="w-full p-2.5 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none font-semibold"
                  />
                </div>

                {/* Price and Change */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                      Current Price <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tickerFormData.price}
                      onChange={(e) => setTickerFormData({ ...tickerFormData, price: e.target.value })}
                      placeholder="e.g. 24,842.15 or $78.40"
                      className="w-full p-2.5 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                      Change / Delta <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tickerFormData.change}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isNeg = val.trim().startsWith('-');
                        setTickerFormData({
                          ...tickerFormData,
                          change: val,
                          is_positive: !isNeg,
                        });
                      }}
                      placeholder="e.g. +0.68% or -0.42%"
                      className="w-full p-2.5 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Trend Direction & Order */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                      Movement Color / Trend
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTickerFormData({ ...tickerFormData, is_positive: true })}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                          tickerFormData.is_positive
                            ? 'bg-[#E8F5EE] border-[#0E8A54] text-[#0E8A54]'
                            : 'bg-white border-[#E2E4E8] text-[#58606E]'
                        }`}
                      >
                        ▲ Gain (Green)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTickerFormData({ ...tickerFormData, is_positive: false })}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                          !tickerFormData.is_positive
                            ? 'bg-[#FDECEC] border-[#D32F2F] text-[#D32F2F]'
                            : 'bg-white border-[#E2E4E8] text-[#58606E]'
                        }`}
                      >
                        ▼ Loss (Red)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2229] uppercase mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={tickerFormData.display_order}
                      onChange={(e) =>
                        setTickerFormData({
                          ...tickerFormData,
                          display_order: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full p-2.5 text-xs rounded border border-[#E2E4E8] focus:border-[#6A1B9A] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="pt-2 border-t border-[#E2E4E8]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1E2229]">
                    <input
                      type="checkbox"
                      checked={tickerFormData.is_active}
                      onChange={(e) =>
                        setTickerFormData({ ...tickerFormData, is_active: e.target.checked })
                      }
                      className="rounded text-[#6A1B9A] focus:ring-[#6A1B9A]"
                    />
                    <span>Show on Top Marquee Ticker Tape</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E4E8]">
                  <button
                    type="button"
                    onClick={() => setTickerModalOpen(false)}
                    className="px-3 py-2 rounded border border-[#E2E4E8] text-xs font-semibold text-[#58606E] hover:text-[#1E2229]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tickerSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {tickerSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Quote</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
  );
};


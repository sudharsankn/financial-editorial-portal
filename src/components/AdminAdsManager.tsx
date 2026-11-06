import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AdCampaign, AdPosition, AdType, AdClickRecord } from '../types/ad';
import {
  fetchActiveAds,
  fetchAllAdminAds,
  fetchAdClickLogs,
  DEFAULT_AD_CAMPAIGNS,
  uploadAdImageToSupabase,
  softDeleteCampaign,
  restoreCampaign,
} from '../lib/adService';
import { getSupabaseClient } from '../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  RefreshCw,
  Check,
  Link,
  FileImage,
  Clock,
  RotateCcw,
  Search,
  Pause,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
  MousePointerClick,
} from 'lucide-react';

export const AdminAdsManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => {
    try {
      const local = localStorage.getItem('hedge_ad_campaigns');
      if (local) {
        const parsed: AdCampaign[] = JSON.parse(local);
        // Clear out legacy mock dummy numbers if present so fresh zero counts start
        return parsed.map((c) => {
          if (c.impressions_count === 1420 && c.clicks_count === 86) {
            return { ...c, impressions_count: 0, clicks_count: 0 };
          }
          if (c.impressions_count === 2890 && c.clicks_count === 142) {
            return { ...c, impressions_count: 0, clicks_count: 0 };
          }
          if (c.impressions_count === 3100 && c.clicks_count === 198) {
            return { ...c, impressions_count: 0, clicks_count: 0 };
          }
          if (c.impressions_count === 2450 && c.clicks_count === 110) {
            return { ...c, impressions_count: 0, clicks_count: 0 };
          }
          return c;
        });
      }
      return DEFAULT_AD_CAMPAIGNS;
    } catch {
      return DEFAULT_AD_CAMPAIGNS;
    }
  });

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'paused' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Image Upload & Import State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click Logs Modal State (Supabase ad_clicks tracking)
  const [clickLogsModalOpen, setClickLogsModalOpen] = useState(false);
  const [selectedAdForLogs, setSelectedAdForLogs] = useState<AdCampaign | null>(null);
  const [clickLogs, setClickLogs] = useState<AdClickRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleOpenClickLogs = async (ad: AdCampaign) => {
    setSelectedAdForLogs(ad);
    setClickLogsModalOpen(true);
    setLoadingLogs(true);
    try {
      const logs = await fetchAdClickLogs(ad.campaign_id);
      setClickLogs(logs);
    } catch {
      setClickLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Helper to check if campaign end date has crossed (Frontend only check)
  const isCampaignExpired = (endDateStr: string): boolean => {
    if (!endDateStr) return false;
    const today = new Date().toISOString().slice(0, 10);
    return endDateStr < today;
  };

  // Form State
  const initialFormState: Omit<AdCampaign, 'id'> = {
    campaign_id: `OH000${Math.floor(70 + Math.random() * 30)}`,
    advertiser: 'ICICI Prudential',
    brand: 'SIP',
    ad_position: 'Box Listing - Position 6',
    ad_type: 'Display',
    is_active: true,
    display_ad_material: '/ads/icici-sip.jpg',
    display_ad_url: 'https://www.iciciprumf.com',
    video_ad_material: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    cost_per_day: 100,
    number_of_days: 30,
    total_cost: 3000,
    impressions_count: 0,
    clicks_count: 0,
  };

  const [formData, setFormData] = useState<Omit<AdCampaign, 'id'>>(initialFormState);

  // Load from Supabase on mount
  useEffect(() => {
    const loadAds = async () => {
      setLoading(true);
      try {
        const ads = await fetchAllAdminAds();
        if (ads && ads.length > 0) {
          setCampaigns(ads);
          localStorage.setItem('hedge_ad_campaigns', JSON.stringify(ads));
        }
      } catch (err) {
        console.warn('Load ads note:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAds();
  }, []);

  const persistCampaigns = (updated: AdCampaign[]) => {
    setCampaigns(updated);
    try {
      localStorage.setItem('hedge_ad_campaigns', JSON.stringify(updated));
    } catch {}
  };

  const calculateDaysDifference = (startDateStr: string, endDateStr: string): number => {
    if (!startDateStr || !endDateStr) return 1;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleOpenAddModal = () => {
    const nextNum = Math.floor(75 + campaigns.length);
    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const days = calculateDaysDifference(start, end);
    const costPerDay = 100;
    setFormData({
      ...initialFormState,
      campaign_id: `OH000${nextNum}`,
      start_date: start,
      end_date: end,
      number_of_days: days,
      cost_per_day: costPerDay,
      total_cost: days * costPerDay,
    });
    setEditingCampaign(null);
    setUploadSuccessNotice(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (ad: AdCampaign) => {
    const days = calculateDaysDifference(ad.start_date, ad.end_date);
    const cost = days * (ad.cost_per_day || 0);
    setFormData({
      ...ad,
      number_of_days: ad.number_of_days || days,
      total_cost: ad.total_cost || cost,
    });
    setEditingCampaign(ad);
    setUploadSuccessNotice(null);
    setModalOpen(true);
  };

  const handleStartDateChange = (newStartDate: string) => {
    let newEndDate = formData.end_date;
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      const start = new Date(newStartDate);
      if (!isNaN(start.getTime())) {
        const daysToAdd = Math.max(1, formData.number_of_days || 30);
        newEndDate = new Date(start.getTime() + daysToAdd * 86400000).toISOString().slice(0, 10);
      }
    }
    const days = calculateDaysDifference(newStartDate, newEndDate);
    const cost = days * (formData.cost_per_day || 0);
    setFormData((prev) => ({
      ...prev,
      start_date: newStartDate,
      end_date: newEndDate,
      number_of_days: days,
      total_cost: cost,
    }));
  };

  const handleEndDateChange = (newEndDate: string) => {
    let newStartDate = formData.start_date;
    if (newStartDate && newEndDate && newEndDate < newStartDate) {
      newStartDate = newEndDate;
    }
    const days = calculateDaysDifference(newStartDate, newEndDate);
    const cost = days * (formData.cost_per_day || 0);
    setFormData((prev) => ({
      ...prev,
      start_date: newStartDate,
      end_date: newEndDate,
      number_of_days: days,
      total_cost: cost,
    }));
  };

  const handleDaysChange = (days: number) => {
    const safeDays = Math.max(1, days || 1);
    const cost = (formData.cost_per_day || 0) * safeDays;
    let newEndDate = formData.end_date;
    if (formData.start_date) {
      const start = new Date(formData.start_date);
      if (!isNaN(start.getTime())) {
        newEndDate = new Date(start.getTime() + safeDays * 86400000).toISOString().slice(0, 10);
      }
    }
    setFormData((prev) => ({
      ...prev,
      number_of_days: safeDays,
      end_date: newEndDate,
      total_cost: cost,
    }));
  };

  const handleCostPerDayChange = (costPerDay: number) => {
    const cost = (costPerDay || 0) * (formData.number_of_days || 1);
    setFormData((prev) => ({
      ...prev,
      cost_per_day: costPerDay,
      total_cost: cost,
    }));
  };

  // Upload creative directly to Supabase Storage Bucket ('ad-images' or 'story-images')
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadSuccessNotice(null);

    try {
      const res = await uploadAdImageToSupabase(file, file.name);
      setUploadingImage(false);

      if (res.success && res.publicUrl) {
        setFormData((prev) => ({
          ...prev,
          display_ad_material: res.publicUrl!,
        }));
        setUploadSuccessNotice(
          res.isLocalFallback
            ? 'ഇമേജ് പ്രിവ്യൂവിലേക്ക് ഇമ്പോർട്ട് ചെയ്തു (Imported to Preview).'
            : 'ഇമേജ് Supabase Storage Bucket-ലേക്ക് അപ്‌ലോഡ് ചെയ്തു (Stored in Supabase Bucket).'
        );
      } else {
        alert(res.error || 'Failed to upload creative image.');
      }
    } catch (err: any) {
      setUploadingImage(false);
      alert(err?.message || 'Error uploading creative to Supabase bucket.');
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const campaignRecord: AdCampaign = {
      id: editingCampaign ? editingCampaign.id : `ad_${Date.now()}`,
      ...formData,
      is_deleted: false,
      deleted_at: null,
    };

    // 1. Sync to Supabase table (parameterized query - zero SQL injection)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (editingCampaign) {
          await supabase
            .from('advertisements')
            .update({
              campaign_id: campaignRecord.campaign_id,
              advertiser: campaignRecord.advertiser,
              brand: campaignRecord.brand,
              ad_position: campaignRecord.ad_position,
              ad_type: campaignRecord.ad_type,
              is_active: campaignRecord.is_active,
              is_deleted: false,
              deleted_at: null,
              display_ad_material: campaignRecord.display_ad_material,
              display_ad_url: campaignRecord.display_ad_url,
              video_ad_material: campaignRecord.video_ad_material || null,
              start_date: campaignRecord.start_date,
              end_date: campaignRecord.end_date,
              cost_per_day: campaignRecord.cost_per_day,
              number_of_days: campaignRecord.number_of_days,
              total_cost: campaignRecord.total_cost,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingCampaign.id);
        } else {
          await supabase.from('advertisements').insert([
            {
              campaign_id: campaignRecord.campaign_id,
              advertiser: campaignRecord.advertiser,
              brand: campaignRecord.brand,
              ad_position: campaignRecord.ad_position,
              ad_type: campaignRecord.ad_type,
              is_active: campaignRecord.is_active,
              display_ad_material: campaignRecord.display_ad_material,
              display_ad_url: campaignRecord.display_ad_url,
              video_ad_material: campaignRecord.video_ad_material || null,
              start_date: campaignRecord.start_date,
              end_date: campaignRecord.end_date,
              cost_per_day: campaignRecord.cost_per_day,
              number_of_days: campaignRecord.number_of_days,
              total_cost: campaignRecord.total_cost,
            },
          ]);
        }
      } catch (err: any) {
        console.warn('Supabase campaign sync notice:', err?.message || err);
      }
    }

    // 2. Local State update
    let updatedList: AdCampaign[];
    if (editingCampaign) {
      updatedList = campaigns.map((c) => (c.id === editingCampaign.id ? campaignRecord : c));
    } else {
      updatedList = [campaignRecord, ...campaigns];
    }

    persistCampaigns(updatedList);
    setModalOpen(false);
    setMessage({
      type: 'success',
      text: `ക്യാമ്പെയ്ൻ ${campaignRecord.campaign_id} (${campaignRecord.advertiser}) വിജയകരമായി സേവ് ചെയ്തു.`,
    });
  };

  const handleSoftDeleteCampaign = async (id: string, campaignId: string) => {
    if (
      !window.confirm(
        `കാമ്പെയ്ൻ ${campaignId} സോഫ്റ്റ് ഡിലീറ്റ് ചെയ്യണോ? (Soft delete campaign? It will be moved to Trash and stopped from serving).`
      )
    ) {
      return;
    }

    await softDeleteCampaign(id);

    const updated = campaigns.map((c) =>
      c.id === id
        ? { ...c, is_deleted: true, is_active: false, deleted_at: new Date().toISOString() }
        : c
    );
    persistCampaigns(updated);
    setMessage({
      type: 'success',
      text: `കാമ്പെയ്ൻ ${campaignId} സോഫ്റ്റ് ഡിലീറ്റ് ചെയ്തു (Moved to Trash).`,
    });
  };

  const handleRestoreCampaign = async (id: string, campaignId: string) => {
    await restoreCampaign(id);

    const updated = campaigns.map((c) =>
      c.id === id ? { ...c, is_deleted: false, is_active: true, deleted_at: null } : c
    );
    persistCampaigns(updated);
    setMessage({
      type: 'success',
      text: `കാമ്പെയ്ൻ ${campaignId} വിജയകരമായി പുനഃസ്ഥാപിച്ചു (Restored to Active).`,
    });
  };

  const handlePermanentDelete = async (id: string, campaignId: string) => {
    if (
      !window.confirm(
        `കാമ്പെയ്ൻ ${campaignId} സ്ഥിരമായി ഡിലീറ്റ് ചെയ്യണോ? (Permanently delete? This cannot be undone).`
      )
    ) {
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('advertisements').delete().eq('id', id);
      } catch {}
    }

    const updated = campaigns.filter((c) => c.id !== id);
    persistCampaigns(updated);
    setMessage({
      type: 'success',
      text: `കാമ്പെയ്ൻ ${campaignId} സ്ഥിരമായി നീക്കം ചെയ്തു (Permanently purged).`,
    });
  };

  const handleToggleActive = async (campaign: AdCampaign) => {
    if (isCampaignExpired(campaign.end_date)) {
      if (
        window.confirm(
          `ഈ കാമ്പെയ്‌ന്റെ തീയതി കഴിഞ്ഞു (${campaign.end_date} - Expired). കാലാവധി നീട്ടാൻ എഡിറ്റ് ചെയ്യണോ?`
        )
      ) {
        handleOpenEditModal(campaign);
      }
      return;
    }

    const updatedStatus = !campaign.is_active;
    const updated = campaigns.map((c) =>
      c.id === campaign.id ? { ...c, is_active: updatedStatus } : c
    );
    persistCampaigns(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('advertisements')
          .update({ is_active: updatedStatus, updated_at: new Date().toISOString() })
          .eq('id', campaign.id);
      } catch {}
    }
  };

  // Metrics Calculations
  const activeCount = campaigns.filter(
    (c) => c.is_active && !c.is_deleted && !isCampaignExpired(c.end_date)
  ).length;
  const expiredCount = campaigns.filter(
    (c) => !c.is_deleted && isCampaignExpired(c.end_date)
  ).length;
  const pausedCount = campaigns.filter(
    (c) => !c.is_deleted && !c.is_active && !isCampaignExpired(c.end_date)
  ).length;
  const trashCount = campaigns.filter((c) => !!c.is_deleted).length;
  const totalNonDeleted = campaigns.filter((c) => !c.is_deleted).length;

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';

  // Filtered campaigns for table
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((ad) => {
      const isExpired = isCampaignExpired(ad.end_date);
      const isDel = !!ad.is_deleted;

      if (statusFilter === 'active' && (!ad.is_active || isExpired || isDel)) return false;
      if (statusFilter === 'expired' && (!isExpired || isDel)) return false;
      if (statusFilter === 'paused' && (ad.is_active || isExpired || isDel)) return false;
      if (statusFilter === 'trash' && !isDel) return false;
      if (statusFilter === 'all' && isDel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ad.campaign_id.toLowerCase().includes(q) ||
          ad.advertiser.toLowerCase().includes(q) ||
          ad.brand.toLowerCase().includes(q) ||
          ad.ad_position.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-[#E2E4E8] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#903E97]/10 text-[#903E97]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-[#1E2229]">
              പരസ്യ മാനേജ്‌മെന്റ് (Advertisements &amp; Sponsorships)
            </h2>
          </div>
          <p className="text-xs text-[#58606E]">
            IAB Standard Ad Placements: 300×250 (Sidebars), 728×180 (Between Stories), Solo Story Ads.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#903E97] hover:bg-[#792f80] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>പുതിയ പരസ്യം ചേർക്കുക (Add Campaign)</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#58606E] mb-1">ആക്ടീവ് (Active)</div>
          <div className="text-xl font-bold text-[#0E8A54] flex items-center gap-1.5">
            <span>{activeCount}</span>
            <span className="text-[10px] font-normal text-[#8A92A0]">/ {totalNonDeleted}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#58606E] mb-1">തീയതി കഴിഞ്ഞവ (Expired)</div>
          <div className="text-xl font-bold text-amber-600 flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{expiredCount}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#58606E] mb-1">നിഷ്‌ക്രിയം (Paused)</div>
          <div className="text-xl font-bold text-[#8A92A0] flex items-center gap-1.5">
            <Pause className="w-4 h-4 shrink-0" />
            <span>{pausedCount}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#58606E] mb-1">ഡിലീറ്റ് ചെയ്തവ (Trash)</div>
          <div className="text-xl font-bold text-red-600 flex items-center gap-1.5">
            <Archive className="w-4 h-4 shrink-0" />
            <span>{trashCount}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E4E8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#58606E] mb-1">Total Impressions</div>
          <div className="text-xl font-bold text-[#903E97] flex items-center gap-1.5">
            <span>{totalImpressions.toLocaleString()}</span>
            <span className="text-[10px] font-medium text-[#0E8A54] ml-auto">({avgCtr}% CTR)</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
            message.type === 'success'
              ? 'bg-[#E8F5EE] border-[#0E8A54]/30 text-[#0E8A54]'
              : 'bg-red-50 border-red-200 text-red-700'
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
            type="button"
            onClick={() => setMessage(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Campaigns Table Container with Status Tabs and Search */}
      <div className="bg-white rounded-xl border border-[#E2E4E8] shadow-xs overflow-hidden">
        {/* Table Filter Tabs & Search Header */}
        <div className="p-4 border-b border-[#E2E4E8] bg-[#FAF7FC] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#903E97] text-white shadow-xs'
                  : 'bg-white text-[#58606E] border border-[#E2E4E8] hover:bg-[#FAF7FC]'
              }`}
            >
              എല്ലാം ({totalNonDeleted})
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-[#0E8A54] text-white shadow-xs'
                  : 'bg-white text-[#58606E] border border-[#E2E4E8] hover:bg-[#FAF7FC]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>സജീവം ({activeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('expired');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'expired'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-[#58606E] border border-[#E2E4E8] hover:bg-[#FAF7FC]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>തീയതി കഴിഞ്ഞവ ({expiredCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('paused');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'paused'
                  ? 'bg-[#58606E] text-white shadow-xs'
                  : 'bg-white text-[#58606E] border border-[#E2E4E8] hover:bg-[#FAF7FC]'
              }`}
            >
              <Pause className="w-3 h-3" />
              <span>നിഷ്‌ക്രിയം ({pausedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('trash');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'trash'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-[#58606E] border border-[#E2E4E8] hover:bg-[#FAF7FC]'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Trash ({trashCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#8A92A0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Campaign ID, Brand..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs text-[#1E2229] outline-none focus:border-[#903E97]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A92A0] hover:text-[#1E2229]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E2229]">
            <thead className="bg-[#F8F9FA] border-b border-[#E2E4E8] text-[11px] font-bold text-[#58606E] uppercase">
              <tr>
                <th className="px-4 py-3">Campaign / Advertiser</th>
                <th className="px-4 py-3">Placement Position</th>
                <th className="px-4 py-3">Creative Preview</th>
                <th className="px-4 py-3">Flight Dates &amp; Cost</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4E8]">
              {paginatedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8A92A0]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Layers className="w-8 h-8 mx-auto text-[#D1D5DB]" />
                      <p className="font-semibold text-xs text-[#1E2229]">കാമ്പെയ്നുകൾ ലഭ്യമല്ല (No campaigns found)</p>
                      <p className="text-[11px] text-[#8A92A0]">
                        തിരഞ്ഞെടുത്ത ഫിൽട്ടറിൽ പരസ്യങ്ങൾ ഇല്ല. ഫിൽട്ടർ മാറ്റി നോക്കുക.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCampaigns.map((ad) => {
                  const isExpired = isCampaignExpired(ad.end_date);
                  const isDel = !!ad.is_deleted;

                  return (
                    <tr
                      key={ad.id}
                      className={`transition-colors ${
                        isDel
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : isExpired
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-[#FAF7FC]'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-[#903E97] mb-0.5">
                          {ad.campaign_id}
                        </div>
                        <div className="font-bold text-[#1E2229]">{ad.advertiser}</div>
                        <div className="text-[11px] text-[#58606E]">{ad.brand}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#FAF7FC] text-[#903E97] border border-[#EADDF0]">
                          {ad.ad_position}
                        </span>
                        <div className="text-[10px] text-[#8A92A0] mt-1">
                          Type: {ad.ad_type}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-12 rounded border border-[#E2E4E8] bg-[#F2F2F2] overflow-hidden shrink-0">
                            <img
                              src={ad.display_ad_material}
                              alt={ad.advertiser}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/ads/icici-sip.jpg';
                              }}
                            />
                          </div>
                          <a
                            href={ad.display_ad_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#903E97] hover:underline flex items-center gap-1 font-semibold truncate max-w-[120px]"
                            title={ad.display_ad_url}
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-[#58606E]">
                        <div className="font-semibold text-[#1E2229]">
                          {ad.start_date} → {ad.end_date}
                        </div>
                        <div className="text-[10px] text-[#8A92A0]">
                          {ad.number_of_days} Days @ ₹{ad.cost_per_day}/day
                        </div>
                        <div className="text-[11px] font-bold text-[#0E8A54] mt-0.5">
                          Total: ₹{Number(ad.total_cost || ((ad.number_of_days || 1) * (ad.cost_per_day || 0))).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[11px]">
                        <div className="font-semibold text-[#1E2229]">
                          {ad.impressions_count || 0} views
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenClickLogs(ad)}
                          className="text-[10px] text-[#0E8A54] hover:text-[#0a663e] font-bold flex items-center gap-1 hover:underline cursor-pointer text-left"
                          title="View Supabase timestamped click logs for this campaign"
                        >
                          <span>
                            {ad.clicks_count || 0} clicks (
                            {(ad.impressions_count && ad.clicks_count
                              ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(1)
                              : 0)}
                            % CTR)
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        </button>
                      </td>

                      {/* Status Column: Expired (Frontend check), Deleted, Paused, or Active */}
                      <td className="px-4 py-3.5">
                        {isDel ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                            <Archive className="w-3 h-3" />
                            <span>Soft Deleted</span>
                          </span>
                        ) : isExpired ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ad)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
                            title={`Flight expired on ${ad.end_date}. Click to extend end date.`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Expired</span>
                          </button>
                        ) : !ad.is_active ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ad)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#F2F2F2] text-[#8A92A0] hover:bg-[#e6e6e6] border border-[#E2E4E8] cursor-pointer transition-colors"
                            title="Paused. Click to activate."
                          >
                            <Pause className="w-3 h-3" />
                            <span>Paused</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ad)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E8F5EE] text-[#0E8A54] hover:bg-[#d4ede0] border border-[#0E8A54]/20 cursor-pointer transition-colors"
                            title="Active. Click to pause."
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </button>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isDel ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestoreCampaign(ad.id, ad.campaign_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7FC] hover:bg-[#903E97]/10 text-[#903E97] border border-[#EADDF0] text-[11px] font-bold transition-colors cursor-pointer"
                              title="Restore Campaign"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(ad.id, ad.campaign_id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#8A92A0] hover:text-red-600 transition-colors cursor-pointer"
                              title="Permanently Delete Campaign"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(ad)}
                              className="p-1.5 rounded-lg hover:bg-[#FAF7FC] text-[#58606E] hover:text-[#903E97] transition-colors cursor-pointer"
                              title="Edit Campaign"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSoftDeleteCampaign(ad.id, ad.campaign_id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#58606E] hover:text-red-600 transition-colors cursor-pointer"
                              title="Soft Delete Campaign (Archive)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 bg-[#FAF7FC] border-t border-[#E2E4E8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#58606E]">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-[#1E2229]">{filteredCampaigns.length === 0 ? 0 : startIndex + 1}</strong>
              –<strong className="text-[#1E2229]">{Math.min(startIndex + itemsPerPage, filteredCampaigns.length)}</strong> of{' '}
              <strong className="text-[#1E2229]">{filteredCampaigns.length}</strong> campaigns
            </span>
            <span className="text-[#D1D5DB] hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-[#E2E4E8] bg-white text-xs font-semibold text-[#1E2229] outline-none focus:border-[#903E97]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(validCurrentPage - 1)}
              disabled={validCurrentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E4E8] bg-white text-[#1E2229] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E2E4E8] transition-all flex items-center gap-1 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Numeric page buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 5) return true;
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - validCurrentPage) <= 1;
              })
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ad-ellipsis-${idx}`} className="px-2 text-xs text-[#878787]">
                      ...
                    </span>
                  );
                }
                const p = item as number;
                const isActive = p === validCurrentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#903E97] text-white shadow-xs'
                        : 'bg-white border border-[#E2E4E8] text-[#1E2229] hover:bg-[#FAF7FC] hover:border-[#903E97]/40'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

            <button
              type="button"
              onClick={() => handlePageChange(validCurrentPage + 1)}
              disabled={validCurrentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E4E8] bg-white text-[#1E2229] hover:bg-[#FAF7FC] hover:border-[#903E97]/40 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E2E4E8] transition-all flex items-center gap-1 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT CAMPAIGN MODAL WITH LIVE PREVIEW & IMPORT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#E6E6E6] overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6] bg-[#FAF7FC] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#903E97]/10 text-[#903E97] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2229]">
                    {editingCampaign ? 'പരസ്യ കാമ്പെയ്ൻ എഡിറ്റ് ചെയ്യുക' : 'പുതിയ പരസ്യ കാമ്പെയ്ൻ ചേർക്കുക'}
                  </h3>
                  <p className="text-[11px] text-[#58606E]">
                    Campaign Details, Image Storage in Supabase Bucket &amp; Live Layout Preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white text-[#58606E] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2-Column Responsive Layout (Form Left, Live Preview Right) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Campaign Input Fields & Image Import (7 cols) */}
              <form onSubmit={handleSaveCampaign} className="lg:col-span-7 space-y-4">
                {uploadSuccessNotice && (
                  <div className="p-3 bg-[#E8F5EE] border border-[#0E8A54]/30 text-[#0E8A54] rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{uploadSuccessNotice}</span>
                  </div>
                )}

                {/* Row 1: Campaign ID, Advertiser, Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                      Campaign ID
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.campaign_id}
                      onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7FC] border border-[#E2E4E8] rounded-xl text-xs font-mono font-bold text-[#903E97] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                      Advertiser
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.advertiser}
                      onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })}
                      placeholder="e.g. ICICI Prudential"
                      className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs text-[#1E2229] outline-none focus:border-[#903E97]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                      Brand / Product
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. SIP / Mutual Fund"
                      className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs text-[#1E2229] outline-none focus:border-[#903E97]"
                    />
                  </div>
                </div>

                {/* Row 2: Placement Slot & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                      Ad Position (Placement Slot)
                    </label>
                    <select
                      value={formData.ad_position}
                      onChange={(e) =>
                        setFormData({ ...formData, ad_position: e.target.value as AdPosition })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs font-semibold text-[#1E2229] outline-none focus:border-[#903E97]"
                    >
                      <option value="Sidebar - Left">Sidebar - Left (300×250 Standard Banner)</option>
                      <option value="Sidebar - Right">Sidebar - Right (300×250 Standard Banner)</option>
                      <option value="Box Listing - Position 6">Box Listing - Position 6 (Between Stories In-Feed)</option>
                      <option value="Full Story - Solo Position">Full Story - Solo Position (Inside Article Paragraph 3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                      Ad Type
                    </label>
                    <select
                      value={formData.ad_type}
                      onChange={(e) => setFormData({ ...formData, ad_type: e.target.value as AdType })}
                      className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs font-semibold text-[#1E2229] outline-none focus:border-[#903E97]"
                    >
                      <option value="Display">Display (Image Banner)</option>
                      <option value="Video">Video (HTML5 Video Banner)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Image Material - Supabase Bucket Upload & Import Options */}
                <div className="p-4 rounded-xl border border-[#EADDF0] bg-[#FAF7FC] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1E2229] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#903E97]" />
                      <span>Ad Creative Material (Supabase Storage)</span>
                    </label>
                    <span className="text-[10px] text-[#878787]">
                      PNG, JPG, WebP supported
                    </span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />

                  {/* Upload / Import Action Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#903E97] hover:bg-[#792f80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>അപ്‌ലോഡ് ചെയ്യുന്നു (Uploading to Supabase)...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>ഇമേജ് ഇമ്പോർട്ട് ചെയ്യുക (Upload / Import File)</span>
                        </>
                      )}
                    </button>

                    <span className="text-xs text-[#878787]">അല്ലെങ്കിൽ</span>

                    {/* Presets */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, display_ad_material: '/ads/icici-sip.jpg' })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-[#E2E4E8] bg-white hover:bg-[#FAF7FC] text-[11px] font-semibold text-[#58606E] transition-colors"
                    >
                      ICICI SIP Sample
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, display_ad_material: '/ads/nippon-mf.jpg' })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-[#E2E4E8] bg-white hover:bg-[#FAF7FC] text-[11px] font-semibold text-[#58606E] transition-colors"
                    >
                      Nippon MF Sample
                    </button>
                  </div>

                  {/* Creative URL input field */}
                  <div>
                    <span className="text-[10px] font-bold text-[#676A6C] block mb-1">
                      Creative Path / Supabase Public URL:
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.display_ad_material}
                      onChange={(e) =>
                        setFormData({ ...formData, display_ad_material: e.target.value })
                      }
                      placeholder="/ads/icici-sip.jpg or https://...supabase.co/storage/v1/object/public/ad-images/..."
                      className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs font-mono text-[#1E2229] outline-none focus:border-[#903E97]"
                    />
                  </div>
                </div>

                {/* Destination Click URL */}
                <div>
                  <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                    Destination Click URL (Display Ad URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.display_ad_url}
                    onChange={(e) => setFormData({ ...formData, display_ad_url: e.target.value })}
                    placeholder="https://www.iciciprumf.com"
                    className="w-full px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs text-[#1E2229] outline-none focus:border-[#903E97]"
                  />
                </div>

                {/* Row 4: Flight Dates & Costing with Auto-calculated Total Cost */}
                <div className="bg-[#FAF7FC] p-3.5 rounded-xl border border-[#EADDF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#903E97]" />
                      <span>തീയതികളും ചെലവും (Dates &amp; Costing)</span>
                    </span>
                    <span className="text-[10px] text-[#0E8A54] font-bold bg-[#E8F5EE] border border-[#0E8A54]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✓ Total Cost Auto-Calculated</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                        Days (ദിവസം)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.number_of_days}
                        onChange={(e) => handleDaysChange(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs font-semibold outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                        Cost / Day (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.cost_per_day}
                        onChange={(e) => handleCostPerDayChange(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1 flex items-center justify-between">
                        <span>Total Cost (₹)</span>
                        <span className="text-[9px] text-[#0E8A54] font-bold">Auto</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.total_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, total_cost: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 bg-[#F4FBF7] border border-[#0E8A54]/40 rounded-lg text-xs font-bold text-[#0E8A54] outline-none focus:border-[#0E8A54]"
                      />
                    </div>
                  </div>

                  {/* Dynamic calculation summary badge */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-[#676A6C] pt-1.5 border-t border-[#EADDF0]">
                    <span>
                      കാലാവധി: <strong className="text-[#1E2229] font-semibold">{formData.number_of_days || 1} Days</strong>
                    </span>
                    <span className="text-[#0E8A54] font-medium">
                      ({formData.number_of_days || 1} days × ₹{formData.cost_per_day || 0}) = 
                      <strong className="text-sm font-bold ml-1.5 text-[#0E8A54]">
                        ₹{Number(formData.total_cost || 0).toLocaleString('en-IN')}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-campaign-active-modal"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-[#903E97] focus:ring-[#903E97]"
                  />
                  <label htmlFor="chk-campaign-active-modal" className="text-xs font-bold text-[#1E2229] cursor-pointer">
                    കാമ്പെയ്ൻ സജീവമാക്കുക (Campaign is Active)
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E4E8]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-[#58606E] hover:bg-[#FAF7FC] cursor-pointer"
                  >
                    റദ്ദാക്കുക (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#903E97] hover:bg-[#792f80] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingCampaign ? 'അപ്‌ഡേറ്റ് ചെയ്യുക (Update)' : 'സേവ് ചെയ്യുക (Save Campaign)'}
                  </button>
                </div>
              </form>

              {/* RIGHT COLUMN: LIVE AD PREVIEW BEFORE SAVE (5 cols) */}
              <div className="lg:col-span-5 bg-[#FAF7FC] rounded-2xl border border-[#EADDF0] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EADDF0]">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#903E97]" />
                      <span className="font-bold text-xs text-[#1E2229]">
                        തത്സമയ പ്രിവ്യൂ (Live Ad Preview)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#903E97]/10 text-[#903E97]">
                      {formData.ad_position}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#676A6C] mb-3">
                    സേവ് ചെയ്യുന്നതിന് മുൻപ് ഉപയോക്താക്കൾക്ക് ഈ പരസ്യം എങ്ങനെ കാണപ്പെടുമെന്ന് ഇവിടെ പരിശോധിക്കാം:
                  </p>

                  {/* PREVIEW RENDERING ACCORDING TO PLACEMENT FORMAT */}

                  {/* 1. Sidebar format (300x250) */}
                  {(formData.ad_position === 'Sidebar - Left' ||
                    formData.ad_position === 'Sidebar - Right') && (
                    <div className="bg-white rounded-xl border border-[#E6E6E6] p-3 shadow-sm max-w-sm mx-auto">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0F0F0] text-[10px] text-[#878787]">
                        <span className="font-bold tracking-wider uppercase text-[#903E97]">
                          പരസ്യം • SPONSORED
                        </span>
                        <span className="text-[9px] font-semibold text-[#676A6C]">
                          {formData.advertiser || 'Advertiser'}
                        </span>
                      </div>

                      <div className="w-full aspect-[6/5] rounded-lg overflow-hidden bg-[#F2F2F2] border border-[#E6E6E6]">
                        <img
                          src={formData.display_ad_material || '/ads/icici-sip.jpg'}
                          alt="Creative Preview"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ads/icici-sip.jpg';
                          }}
                        />
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[10px]">
                        <span className="font-medium text-[#262B2E] truncate">
                          {formData.brand || 'Product'}
                        </span>
                        <span className="font-bold text-[#903E97] flex items-center gap-1">
                          <span>Learn More</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. Between Stories In-Feed format (728x180) */}
                  {formData.ad_position === 'Box Listing - Position 6' && (
                    <div className="rounded-xl border border-[#EADDF0] bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADDF0] text-[10px]">
                        <span className="px-2 py-0.5 rounded font-bold uppercase bg-[#903E97]/10 text-[#903E97]">
                          സ്പോൺസേർഡ് • SPONSORED
                        </span>
                        <span className="font-semibold text-[#676A6C]">
                          Box Listing • Position 6
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#F2F2F2] border border-[#E6E6E6]">
                          <img
                            src={formData.display_ad_material || '/ads/icici-sip.jpg'}
                            alt="Creative Preview"
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/ads/icici-sip.jpg';
                            }}
                          />
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-[#262B2E] leading-snug mb-1">
                            {formData.advertiser} — {formData.brand}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#903E97] text-white text-[11px] font-bold">
                            <span>കൂടുതൽ വിവരങ്ങൾക്ക് (Visit)</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. In-Article Solo format (600x300) */}
                  {formData.ad_position === 'Full Story - Solo Position' && (
                    <div className="rounded-xl border border-[#EADDF0] bg-white p-3.5 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADDF0] text-[10px]">
                        <span className="font-bold text-[#903E97] uppercase">
                          പരസ്യം • FEATURED SPONSORSHIP
                        </span>
                        <span className="text-[#676A6C]">
                          Full Story Solo Placement
                        </span>
                      </div>

                      <div className="w-full aspect-[2/1] rounded-lg overflow-hidden bg-[#F2F2F2] border border-[#E6E6E6]">
                        <img
                          src={formData.display_ad_material || '/ads/icici-sip.jpg'}
                          alt="Creative Preview"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ads/icici-sip.jpg';
                          }}
                        />
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-[#676A6C]">
                          {formData.advertiser} • {formData.brand}
                        </span>
                        <span className="font-bold text-[#903E97] flex items-center gap-1">
                          <span>സന്ദർശിക്കുക</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Metadata Pill */}
                <div className="mt-4 pt-3 border-t border-[#EADDF0] flex items-center justify-between text-[10px] text-[#878787]">
                  <span>Destination: {formData.display_ad_url || 'Not set'}</span>
                  <div className="text-right">
                    <span className="font-mono text-[#0E8A54] font-bold">
                      ₹{formData.cost_per_day}/day
                    </span>
                    <span className="text-[10px] text-[#58606E] ml-1.5 font-semibold">
                      • Total: ₹{Number(formData.total_cost || 0).toLocaleString('en-IN')} ({formData.number_of_days}d)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CLICK LOGS & TIMESTAMPS MODAL */}
      {clickLogsModalOpen && selectedAdForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E6E6E6] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6] bg-[#FAF7FC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0E8A54]/10 text-[#0E8A54] flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E2229]">
                    ക്ലിക്ക് ടൈംസ്റ്റാമ്പ് ലോഗുകൾ (Click Logs &amp; Timestamps)
                  </h3>
                  <p className="text-[11px] text-[#58606E]">
                    Campaign: <strong className="text-[#903E97] font-mono">{selectedAdForLogs.campaign_id}</strong> • {selectedAdForLogs.advertiser} ({selectedAdForLogs.brand})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClickLogsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white text-[#8A92A0] hover:text-[#1E2229] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta Banner */}
            <div className="px-6 py-2.5 bg-[#FAF7FC] border-b border-[#E2E4E8] flex items-center justify-between text-xs">
              <span className="text-[#58606E]">
                Mapped Advertisement ID: <code className="bg-white px-2 py-0.5 rounded border border-[#E2E4E8] text-[#1E2229] font-mono text-[10px]">{selectedAdForLogs.id}</code>
              </span>
              <span className="font-bold text-[#0E8A54]">
                ആകെ ക്ലിക്കുകൾ: {selectedAdForLogs.clicks_count || clickLogs.length}
              </span>
            </div>

            {/* Log Table Body */}
            <div className="overflow-y-auto p-4 flex-1">
              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-[#8A92A0]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#903E97]" />
                  <span>Supabase ad_clicks ടേബിളിൽ നിന്ന് ലോഗുകൾ ലഭ്യമാക്കുന്നു...</span>
                </div>
              ) : clickLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8A92A0] space-y-1">
                  <MousePointerClick className="w-8 h-8 mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-bold text-[#1E2229]">ക്ലിക്കുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല</p>
                  <p className="text-[11px]">
                    വെബ്‌സൈറ്റിൽ ഈ പരസ്യത്തിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ ഓരോ ക്ലിക്കിന്റെയും തീയതിയും സമയവും (Timestamp) ഇവിടെ തത്സമയം രേഖപ്പെടുത്തപ്പെടും.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E2E4E8]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] border-b border-[#E2E4E8] text-[10px] font-bold text-[#58606E] uppercase">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">ക്ലിക്ക് സമയം (Timestamp)</th>
                        <th className="px-3 py-2.5">പേജ് (Page URL)</th>
                        <th className="px-3 py-2.5">റഫറർ (Referrer)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E8] text-[11px]">
                      {clickLogs.map((log, idx) => (
                        <tr key={log.id || `log-${idx}`} className="hover:bg-[#FAF7FC]">
                          <td className="px-3 py-2 font-mono text-[#8A92A0]">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-[#1E2229]">
                            {new Date(log.clicked_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })}
                          </td>
                          <td className="px-3 py-2 truncate max-w-[180px] text-[#58606E]" title={log.page_url || ''}>
                            {log.page_url ? new URL(log.page_url).pathname : '/'}
                          </td>
                          <td className="px-3 py-2 text-[#8A92A0] truncate max-w-[120px]" title={log.referrer || 'Direct'}>
                            {log.referrer ? 'External' : 'Direct'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#E2E4E8] bg-[#FAF7FC] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#8A92A0]">
                Captured in Supabase table <code className="font-mono text-[#903E97]">public.ad_clicks</code>
              </span>
              <button
                type="button"
                onClick={() => setClickLogsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#903E97] hover:bg-[#792f80] text-white font-bold text-xs cursor-pointer transition-colors"
              >
                ക്ലോസ് ചെയ്യുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

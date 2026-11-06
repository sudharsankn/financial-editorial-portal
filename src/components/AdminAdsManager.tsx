import React, { useState, useEffect } from 'react';
import { AdCampaign, AdPosition, AdType } from '../types/ad';
import {
  fetchActiveAds,
  DEFAULT_AD_CAMPAIGNS,
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
} from 'lucide-react';

export const AdminAdsManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => {
    try {
      const local = localStorage.getItem('hedge_ad_campaigns');
      return local ? JSON.parse(local) : DEFAULT_AD_CAMPAIGNS;
    } catch {
      return DEFAULT_AD_CAMPAIGNS;
    }
  });

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        const ads = await fetchActiveAds();
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

  const handleOpenAddModal = () => {
    const nextNum = Math.floor(75 + campaigns.length);
    setFormData({
      ...initialFormState,
      campaign_id: `OH000${nextNum}`,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (ad: AdCampaign) => {
    setFormData({ ...ad });
    setEditingCampaign(ad);
    setModalOpen(true);
  };

  const handleDaysChange = (days: number) => {
    const cost = (formData.cost_per_day || 0) * days;
    setFormData((prev) => ({
      ...prev,
      number_of_days: days,
      total_cost: cost,
    }));
  };

  const handleCostPerDayChange = (costPerDay: number) => {
    const cost = costPerDay * (formData.number_of_days || 1);
    setFormData((prev) => ({
      ...prev,
      cost_per_day: costPerDay,
      total_cost: cost,
    }));
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const campaignRecord: AdCampaign = {
      id: editingCampaign ? editingCampaign.id : `ad_${Date.now()}`,
      ...formData,
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

  const handleDeleteCampaign = async (id: string, campaignId: string) => {
    if (!window.confirm(`Delete advertisement campaign ${campaignId}?`)) return;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('advertisements').delete().eq('id', id);
      } catch {}
    }

    const updated = campaigns.filter((c) => c.id !== id);
    persistCampaigns(updated);
    setMessage({ type: 'success', text: `Campaign ${campaignId} deleted.` });
  };

  const handleToggleActive = async (campaign: AdCampaign) => {
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
            ഹോം പേജ് സൈഡ്ബാറുകൾ, സ്റ്റോറികൾക്കിടയിലെ ബാനർ, ആർട്ടിക്കിൾ സോളോ പരസ്യങ്ങൾ എന്നിവ നിയന്ത്രിക്കുക.
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

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#E8F5EE] border-[#0E8A54]/30 text-[#0E8A54]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-[#E2E4E8] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E4E8] bg-[#FAF7FC] flex items-center justify-between">
          <span className="text-xs font-bold text-[#1E2229] uppercase tracking-wider">
            ആക്ടീവ് പരസ്യ കാമ്പെയ്നുകൾ ({campaigns.length})
          </span>
          <span className="text-[11px] text-[#58606E]">
            IAB Standard Placements: 300×250 (Sidebars) &amp; 728×180 (Between Stories)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E2229]">
            <thead className="bg-[#F8F9FA] border-b border-[#E2E4E8] text-[11px] font-bold text-[#58606E] uppercase">
              <tr>
                <th className="px-4 py-3">Campaign / Advertiser</th>
                <th className="px-4 py-3">Placement Position</th>
                <th className="px-4 py-3">Creative Preview</th>
                <th className="px-4 py-3">Flight Dates</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4E8]">
              {campaigns.map((ad) => (
                <tr key={ad.id} className="hover:bg-[#FAF7FC] transition-colors">
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
                  </td>

                  <td className="px-4 py-3.5 text-[11px]">
                    <div className="font-semibold text-[#1E2229]">
                      {ad.impressions_count || 0} views
                    </div>
                    <div className="text-[10px] text-[#0E8A54] font-bold">
                      {ad.clicks_count || 0} clicks (
                      {(ad.impressions_count && ad.clicks_count
                        ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(1)
                        : 0)}
                      % CTR)
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        ad.is_active
                          ? 'bg-[#E8F5EE] text-[#0E8A54] hover:bg-[#d4ede0]'
                          : 'bg-[#F2F2F2] text-[#8A92A0] hover:bg-[#e6e6e6]'
                      }`}
                    >
                      {ad.is_active ? 'Active' : 'Paused'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(ad)}
                      className="p-1.5 rounded hover:bg-[#FAF7FC] text-[#58606E] hover:text-[#903E97] transition-colors cursor-pointer"
                      title="Edit Campaign"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(ad.id, ad.campaign_id)}
                      className="p-1.5 rounded hover:bg-red-50 text-[#58606E] hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E6E6E6] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6] bg-[#FAF7FC]">
              <div>
                <h3 className="font-bold text-base text-[#1E2229]">
                  {editingCampaign ? 'പരസ്യ കാമ്പെയ്ൻ എഡിറ്റ് ചെയ്യുക' : 'പുതിയ പരസ്യ കാമ്പെയ്ൻ ചേർക്കുക'}
                </h3>
                <p className="text-[11px] text-[#58606E]">
                  Campaign Details, Placement Positions &amp; Creative Assets
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white text-[#58606E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 overflow-y-auto">
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

              {/* Row 2: Placement Position & Type */}
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

              {/* Row 3: Material Image & Destination URL */}
              <div>
                <label className="text-[11px] font-bold text-[#1E2229] uppercase tracking-wider block mb-1">
                  Display Ad Material (Image Path or URL)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={formData.display_ad_material}
                    onChange={(e) => setFormData({ ...formData, display_ad_material: e.target.value })}
                    placeholder="/ads/icici-sip.jpg"
                    className="flex-1 px-3 py-2 bg-white border border-[#E2E4E8] rounded-xl text-xs font-mono text-[#1E2229] outline-none focus:border-[#903E97]"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#8A92A0]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, display_ad_material: '/ads/icici-sip.jpg' })}
                    className="px-2 py-0.5 rounded bg-[#FAF7FC] hover:bg-[#F3E5F5] border border-[#EADDF0] text-[#903E97] font-semibold"
                  >
                    ICICI SIP Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, display_ad_material: '/ads/nippon-mf.jpg' })}
                    className="px-2 py-0.5 rounded bg-[#FAF7FC] hover:bg-[#F3E5F5] border border-[#EADDF0] text-[#903E97] font-semibold"
                  >
                    Nippon Mutual Fund Sample
                  </button>
                </div>
              </div>

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

              {/* Row 4: Dates & Costing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E4E8]">
                <div>
                  <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAF7FC] border border-[#E2E4E8] rounded-lg text-xs"
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
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAF7FC] border border-[#E2E4E8] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                    Cost Per Day (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.cost_per_day}
                    onChange={(e) => handleCostPerDayChange(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-[#E2E4E8] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#58606E] uppercase block mb-1">
                    Total Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-[#FAF7FC] border border-[#E2E4E8] rounded-lg text-xs font-bold text-[#0E8A54]"
                  />
                </div>
              </div>

              {/* Row 5: Active status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-campaign-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#903E97] focus:ring-[#903E97]"
                />
                <label htmlFor="chk-campaign-active" className="text-xs font-bold text-[#1E2229] cursor-pointer">
                  കാമ്പെയ്ൻ സജീവമാക്കുക (Campaign is Active)
                </label>
              </div>

              {/* Footer Buttons */}
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
                  className="px-5 py-2 rounded-xl bg-[#903E97] hover:bg-[#792f80] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingCampaign ? 'അപ്‌ഡേറ്റ് ചെയ്യുക (Update)' : 'സേവ് ചെയ്യുക (Save Campaign)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export type AdPosition =
  | 'Full Story - Solo Position'
  | 'Box Listing - Position 6'
  | 'Sidebar - Left'
  | 'Sidebar - Right';

export type AdType = 'Display' | 'Video';

export interface AdCampaign {
  id: string;
  campaign_id: string; // e.g. 'OH00074'
  advertiser: string; // e.g. 'ICICI'
  brand: string; // e.g. 'SIP'
  ad_position: AdPosition;
  ad_type: AdType;
  is_active: boolean;
  display_ad_material: string; // image path or URL (e.g. '/ads/icici-sip.jpg')
  display_ad_url: string; // click destination URL
  video_ad_material?: string | null;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string; // 'YYYY-MM-DD'
  cost_per_day: number;
  number_of_days: number;
  total_cost: number;
  impressions_count?: number;
  clicks_count?: number;
  created_at?: string;
  updated_at?: string;
}


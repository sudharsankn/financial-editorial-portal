import { AdCampaign, AdPosition } from '../types/ad';
import { getSupabaseClient } from './supabase';

export const DEFAULT_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'ad_oh00074',
    campaign_id: 'OH00074',
    advertiser: 'ICICI Prudential',
    brand: 'SIP',
    ad_position: 'Full Story - Solo Position',
    ad_type: 'Display',
    is_active: true,
    display_ad_material: '/ads/icici-sip.jpg',
    display_ad_url: 'https://www.iciciprumf.com',
    start_date: '2025-07-08',
    end_date: '2027-08-08',
    cost_per_day: 0,
    number_of_days: 31,
    total_cost: 0,
    impressions_count: 1420,
    clicks_count: 86,
  },
  {
    id: 'ad_oh00073',
    campaign_id: 'OH00073',
    advertiser: 'ICICI Prudential',
    brand: 'SIP',
    ad_position: 'Box Listing - Position 6',
    ad_type: 'Display',
    display_ad_material: '/ads/icici-sip.jpg',
    display_ad_url: 'https://www.iciciprumf.com',
    start_date: '2025-07-08',
    end_date: '2027-08-08',
    cost_per_day: 0,
    number_of_days: 31,
    total_cost: 0,
    is_active: true,
    impressions_count: 2890,
    clicks_count: 142,
  },
  {
    id: 'ad_oh00075',
    campaign_id: 'OH00075',
    advertiser: 'Nippon India',
    brand: 'Mutual Fund',
    ad_position: 'Sidebar - Right',
    ad_type: 'Display',
    display_ad_material: '/ads/nippon-mf.jpg',
    display_ad_url: 'https://mf.nipponindiaim.com',
    start_date: '2025-07-08',
    end_date: '2027-08-08',
    cost_per_day: 0,
    number_of_days: 31,
    total_cost: 0,
    is_active: true,
    impressions_count: 3100,
    clicks_count: 198,
  },
  {
    id: 'ad_oh00076',
    campaign_id: 'OH00076',
    advertiser: 'ICICI Prudential',
    brand: 'SIP',
    ad_position: 'Sidebar - Left',
    ad_type: 'Display',
    display_ad_material: '/ads/icici-sip.jpg',
    display_ad_url: 'https://www.iciciprumf.com',
    start_date: '2025-07-08',
    end_date: '2027-08-08',
    cost_per_day: 0,
    number_of_days: 31,
    total_cost: 0,
    is_active: true,
    impressions_count: 2450,
    clicks_count: 110,
  },
];

/**
 * Fetch all active advertisements from Supabase or fallback to defaults.
 * Zero SQL injection (uses PostgREST query builders).
 * Filters out expired ads (end_date < today) and soft-deleted ads.
 */
export async function fetchActiveAds(): Promise<AdCampaign[]> {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .lte('start_date', today)
        .gte('end_date', today);

      if (!error && data && data.length > 0) {
        return data as AdCampaign[];
      }
    } catch (err) {
      console.warn('Supabase advertisements notice (using seed ads):', err);
    }
  }

  // Fallback to local default campaigns (filter out expired or soft-deleted)
  return DEFAULT_AD_CAMPAIGNS.filter(
    (c) => c.is_active && !c.is_deleted && (!c.end_date || c.end_date >= today)
  );
}

/**
 * Fetch all advertisement campaigns for the Admin Manager studio.
 * Returns active, paused, expired, and soft-deleted campaigns for complete governance.
 */
export async function fetchAllAdminAds(): Promise<AdCampaign[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AdCampaign[];
      }
    } catch (err) {
      console.warn('Supabase fetch all admin advertisements notice:', err);
    }
  }

  return DEFAULT_AD_CAMPAIGNS;
}

/**
 * Select active ad for a specific placement position.
 * Strictly avoids expired (end_date < today) or soft-deleted campaigns.
 */
export function getAdForPosition(ads: AdCampaign[], position: AdPosition): AdCampaign | null {
  const today = new Date().toISOString().slice(0, 10);
  const matching = ads.filter(
    (ad) =>
      ad.ad_position === position &&
      ad.is_active !== false &&
      !ad.is_deleted &&
      (!ad.end_date || ad.end_date >= today)
  );

  if (matching.length === 0) {
    const fallback = DEFAULT_AD_CAMPAIGNS.find(
      (a) =>
        a.ad_position === position &&
        a.is_active !== false &&
        !a.is_deleted &&
        (!a.end_date || a.end_date >= today)
    );
    return fallback || null;
  }
  return matching[0];
}

/**
 * Soft delete an advertisement campaign (archives rather than permanently purges).
 */
export async function softDeleteCampaign(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          is_deleted: true,
          is_active: false,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!error) return true;

      // Fallback if is_deleted column is not yet on DB
      await supabase
        .from('advertisements')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      return true;
    } catch (err) {
      console.warn('Supabase soft delete notice:', err);
    }
  }
  return false;
}

/**
 * Restore a soft-deleted advertisement campaign.
 */
export async function restoreCampaign(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          is_deleted: false,
          is_active: true,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Supabase restore ad notice:', err);
    }
  }
  return false;
}

/**
 * Increment click count safely in Supabase.
 */
export async function recordAdClick(campaignId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('clicks_count')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (data) {
        await supabase
          .from('advertisements')
          .update({
            clicks_count: (data.clicks_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
      }
    } catch {}
  }
}

/**
 * Increment impression count safely in Supabase.
 */
export async function recordAdImpression(campaignId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('impressions_count')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (data) {
        await supabase
          .from('advertisements')
          .update({
            impressions_count: (data.impressions_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
      }
    } catch {}
  }
}

/**
 * Upload an advertisement creative to Supabase Storage bucket ('ad-images' or 'story-images').
 * Gracefully falls back to high-res Data URL so upload never fails.
 */
export async function uploadAdImageToSupabase(
  fileOrBlob: File | Blob,
  originalFilename: string = 'ad-banner.jpg'
): Promise<{
  success: boolean;
  publicUrl?: string;
  error?: string;
  isLocalFallback?: boolean;
}> {
  const client = getSupabaseClient();
  const fileExt = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = originalFilename.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
  const fileName = `ad_${Date.now()}_${cleanName}.${fileExt}`;
  const filePath = `campaigns/${fileName}`;

  if (client) {
    try {
      // First attempt 'ad-images' bucket, fallback to 'story-images'
      let bucketName = 'ad-images';
      let { error } = await client.storage
        .from(bucketName)
        .upload(filePath, fileOrBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: (fileOrBlob as any).type || 'image/jpeg',
        });

      if (error && (error.message?.includes('not found') || error.message?.includes('Bucket'))) {
        bucketName = 'story-images';
        const res = await client.storage
          .from(bucketName)
          .upload(filePath, fileOrBlob, {
            cacheControl: '31536000',
            upsert: true,
            contentType: (fileOrBlob as any).type || 'image/jpeg',
          });
        error = res.error;
      }

      if (!error) {
        const { data: urlData } = client.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return {
            success: true,
            publicUrl: urlData.publicUrl,
            isLocalFallback: false,
          };
        }
      }
      console.warn('Supabase ad storage notice:', error?.message);
    } catch (err: any) {
      console.warn('Supabase ad upload notice:', err?.message);
    }
  }

  // Graceful Local Fallback: Convert to Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        success: true,
        publicUrl: reader.result as string,
        isLocalFallback: true,
      });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to process ad image' });
    };
    reader.readAsDataURL(fileOrBlob);
  });
}


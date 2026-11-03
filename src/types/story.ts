export type Section =
  | 'Investment Insights'
  | 'Market News'
  | 'Special Coverage';

export const SECTIONS: Section[] = [
  'Investment Insights',
  'Market News',
  'Special Coverage',
];

export type Category =
  | 'Financial Planning'
  | 'Big Story'
  | 'Results Calendar'
  | 'Event Calendar'
  | 'Class Room'
  | 'Political Theatre'
  | 'Market Trends'
  | 'Mutual Fund'
  | 'Stock Recommendations'
  | 'Portfolio'
  | 'Sector Scan'
  | 'Economy Watch'
  | 'Personal Finance'
  | 'Insurance'
  | 'Tax Planning';

export const CATEGORIES: Category[] = [
  'Financial Planning',
  'Big Story',
  'Results Calendar',
  'Event Calendar',
  'Class Room',
  'Political Theatre',
  'Market Trends',
  'Mutual Fund',
  'Stock Recommendations',
  'Portfolio',
  'Sector Scan',
  'Economy Watch',
  'Personal Finance',
  'Insurance',
  'Tax Planning',
];

export type PublishingStatus = 'Draft' | 'Ready to Publish' | 'Published' | 'Retired';

export const PUBLISHING_STATUSES: PublishingStatus[] = [
  'Draft',
  'Ready to Publish',
  'Published',
  'Retired',
];

export type NotificationStatus = 'Yes' | 'No';

export interface Story {
  id: string;
  section: Section;
  category: Category;
  heading: string; // Max 70 grapheme characters
  lead_image_url: string; // 560x320 JPG URL
  short_description: string; // Rich Text / HTML
  full_story: string; // Rich Text / HTML
  canonical_url: string; // Unique URL slug
  keywords: string; // Comma-separated
  seo_title: string;
  seo_description: string;
  publishing_status: PublishingStatus;
  notification_status: NotificationStatus;
  display_order: number;
  language?: string; // e.g., 'en' | 'ml' | 'hi' | 'ta' | 'ar'
  created_at: string;
  updated_at: string;
}

export type StoryFormData = Omit<Story, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export interface MarketTickerItem {
  id: string;
  symbol: string; // e.g. "NIFTY 50"
  price: string; // e.g. "24,842.15"
  change: string; // e.g. "+0.68%"
  is_positive: boolean; // true = green gain, false = red loss
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type MarketTickerFormData = Omit<MarketTickerItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type IndianApiEndpoint = 'trending' | 'news' | 'ipo' | 'stock';

export interface IndianStockDataRecord {
  id: string;
  endpoint: IndianApiEndpoint;
  query?: string;
  title: string;
  summary: string;
  data: any;
  fetched_at: string;
  section: Section;
  category: Category;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type IndianStockDataFormData = Omit<IndianStockDataRecord, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export interface TrendingStockItem {
  id: string;
  ticker_id?: string;
  company_name: string;
  price: string;
  percent_change: string;
  net_change?: string;
  trend_type: 'gainer' | 'loser';
  high?: string;
  low?: string;
  open?: string;
  close?: string;
  volume?: string;
  overall_rating?: string;
  short_term_trends?: string;
  exchange_type?: string;
  section: Section | string;
  category: Category | string;
  is_published: boolean;
  display_order: number;
  fetched_at: string;
  created_at?: string;
}

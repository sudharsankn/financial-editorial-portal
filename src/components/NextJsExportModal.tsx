import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Rocket, FolderTree, Terminal } from 'lucide-react';

interface NextJsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NextJsExportModal: React.FC<NextJsExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'tree' | 'layout' | 'articlePage'>('guide');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const NEXTJS_LAYOUT_CODE = `// app/layout.tsx
import type { Metadata } from 'next';
import { Open_Sans, Noto_Sans_Malayalam, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const notoml = Noto_Sans_Malayalam({ subsets: ['malayalam'], variable: '--font-noto-ml', weight: ['400', '600', '700'] });
const notohi = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto-hi', weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: 'Financial Intelligence Editorial | Market News & Investment Insights',
  description: 'Premier multilingual financial intelligence & market news portal with Supabase database integration.',
  metadataBase: new URL(process.env.APP_URL || 'https://yourdomain.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="auto" className={\`\${openSans.variable} \${notoml.variable} \${notohi.variable}\`}>
      <body className="bg-[#F4F4F6] text-[#1E2229] antialiased">
        {children}
      </body>
    </html>
  );
}`;

  const NEXTJS_ARTICLE_CODE = `// app/[canonical_url]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { canonical_url: string } }): Promise<Metadata> {
  const { data: story } = await supabase
    .from('stories')
    .select('heading, seo_title, seo_description, lead_image_url, canonical_url, keywords')
    .eq('canonical_url', params.canonical_url)
    .single();

  if (!story) return { title: 'Story Not Found' };

  return {
    title: \`\${story.seo_title || story.heading} | Financial Intelligence\`,
    description: story.seo_description,
    keywords: story.keywords?.split(','),
    alternates: { canonical: \`/\${story.canonical_url}\` },
    openGraph: {
      title: story.heading,
      description: story.seo_description,
      images: [{ url: story.lead_image_url, width: 560, height: 320, alt: story.heading }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: story.heading,
      description: story.seo_description,
      images: [story.lead_image_url],
    },
  };
}

export default async function ArticlePage({ params }: { params: { canonical_url: string } }) {
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('canonical_url', params.canonical_url)
    .single();

  if (!story) notFound();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* 560x320 Calibrated Lead Image */}
      <div className="aspect-[7/4] bg-[#EBEEF7] rounded overflow-hidden mb-6">
        <img src={story.lead_image_url} alt={story.heading} className="w-full h-full object-cover" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{story.heading}</h1>
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story.full_story }} />
    </main>
  );
}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#181C23]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded border border-[#E2E4E8] w-full max-w-3xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E4E8] bg-[#F4F4F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#6A1B9A] text-white flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Open_Sans'] font-bold text-base text-[#1E2229]">
                Next.js App Router Architecture &amp; Vercel Deployment
              </h3>
              <p className="text-xs text-[#58606E]">
                Production-grade SSR, Unicode canonical slugs, and edge performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#E2E4E8] text-[#58606E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E4E8] bg-white px-4">
          {[
            { id: 'guide', label: '1. Vercel Deploy Guide' },
            { id: 'tree', label: '2. Next.js Tree' },
            { id: 'layout', label: '3. app/layout.tsx' },
            { id: 'articlePage', label: '4. [canonical_url]/page.tsx' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#6A1B9A] text-[#6A1B9A]'
                  : 'border-transparent text-[#58606E] hover:text-[#1E2229]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-[#1E2229]">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-[#FAF7FC] border border-[#E4B5FF] p-4 rounded">
                <h4 className="font-bold text-sm text-[#6A1B9A] mb-1">
                  1-Click Vercel Deployment Workflow
                </h4>
                <p className="text-xs text-[#58606E]">
                  This application is architected with complete parity between Vite and Next.js App Router standards.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase text-[#58606E] tracking-wider">
                  Step 1: Set Up Supabase Database
                </h5>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#58606E]">
                  <li>Create a free project at <span className="font-semibold text-[#1E2229]">supabase.com</span>.</li>
                  <li>Open the <span className="font-semibold text-[#1E2229]">SQL Editor</span> in Supabase.</li>
                  <li>Copy and execute the idempotent migration script from the Supabase tab in this app.</li>
                  <li>Retrieve your <code className="bg-[#EBEEF7] px-1 py-0.5 rounded">Project URL</code> and <code className="bg-[#EBEEF7] px-1 py-0.5 rounded">anon key</code> from Project Settings &gt; API.</li>
                </ol>

                <h5 className="font-bold text-xs uppercase text-[#58606E] tracking-wider pt-2">
                  Step 2: Deploy to Vercel
                </h5>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#58606E]">
                  <li>Push your repository to GitHub or GitLab.</li>
                  <li>Go to <span className="font-semibold text-[#1E2229]">vercel.com</span> &gt; Add New Project &gt; Import Repository.</li>
                  <li>Under <span className="font-semibold text-[#1E2229]">Environment Variables</span>, add:
                    <div className="bg-[#181C23] text-[#DFE2EC] p-3 rounded font-mono text-[11px] my-2">
                      <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
                      <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key</p>
                      <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
                      <p>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</p>
                    </div>
                  </li>
                  <li>Click <span className="font-semibold text-[#1E2229]">Deploy</span>. Vercel automatically sets up worldwide CDN caching, SSL, and instant rollbacks!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="space-y-3 font-mono text-[11px]">
              <span className="font-sans font-bold text-xs text-[#58606E] block mb-2">
                Standard Next.js 15+ App Router Project Structure
              </span>
              <div className="bg-[#181C23] text-[#DFE2EC] p-4 rounded border border-[#4D4351] leading-loose">
                <pre>{`my-financial-portal/
├── app/
│   ├── layout.tsx                # Universal font stacks (Open Sans, Noto Sans)
│   ├── page.tsx                  # Subscriber Story Listing Page (Stitch Design)
│   ├── [canonical_url]/
│   │   └── page.tsx              # Dynamic Article Details Page & SEO Metadata
│   ├── admin/
│   │   ├── page.tsx              # Stories Manager Dashboard
│   │   └── new/page.tsx          # 70-grapheme Story Editor Form
│   ├── api/
│   │   └── stories/route.ts      # Server-side Supabase REST handler
│   └── globals.css               # Tailwind CSS & design tokens
├── lib/
│   ├── supabase.ts               # Supabase SSR & client instances
│   ├── grapheme.ts               # Intl.Segmenter grapheme counter & slugifier
│   └── taxonomy.ts               # Master sections, categories & statuses
├── supabase/
│   └── migrations/
│       └── 20261102_stories.sql  # UTF-8 PostgreSQL table schema
├── .env.example
├── next.config.mjs
└── package.json`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#58606E]">app/layout.tsx</span>
                <button
                  onClick={() => copyToClipboard(NEXTJS_LAYOUT_CODE, 'layout')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6A1B9A] hover:underline"
                >
                  {copied === 'layout' ? <Check className="w-3.5 h-3.5 text-[#0E8A54]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'layout' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="bg-[#181C23] text-[#DFE2EC] p-4 rounded font-mono text-[11px] overflow-x-auto border border-[#4D4351]">
                <pre>{NEXTJS_LAYOUT_CODE}</pre>
              </div>
            </div>
          )}

          {activeTab === 'articlePage' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#58606E]">app/[canonical_url]/page.tsx</span>
                <button
                  onClick={() => copyToClipboard(NEXTJS_ARTICLE_CODE, 'article')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6A1B9A] hover:underline"
                >
                  {copied === 'article' ? <Check className="w-3.5 h-3.5 text-[#0E8A54]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'article' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="bg-[#181C23] text-[#DFE2EC] p-4 rounded font-mono text-[11px] overflow-x-auto border border-[#4D4351]">
                <pre>{NEXTJS_ARTICLE_CODE}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

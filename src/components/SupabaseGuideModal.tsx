import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  Key,
  Globe,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { SUPABASE_SQL_MIGRATION } from '../lib/sqlMigration';
import {
  getSavedSupabaseConfig,
  checkSupabaseConnection,
  seedSupabaseWithInitialData,
  resetLocalStories,
} from '../lib/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    mode: 'supabase' | 'local';
    error?: string;
    count?: number;
  }>({ tested: false, connected: false, mode: 'local' });
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSavedSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setTesting(true);
    setStatusMessage(null);
    const res = await checkSupabaseConnection();
    setConnectionStatus({
      tested: true,
      connected: res.connected,
      mode: res.mode,
      error: res.error,
      count: res.count,
    });
    setTesting(false);
  };


  const handleCopySql = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleSeedRemote = async () => {
    setSeeding(true);
    const res = await seedSupabaseWithInitialData();
    setSeeding(false);
    if (res.success) {
      setStatusMessage(`Successfully seeded ${res.count} multilingual stories to Supabase!`);
      testConnection();
      onRefreshData();
    } else {
      setStatusMessage(`Seeding error: ${res.error}`);
    }
  };

  const handleResetLocal = () => {
    if (window.confirm('Reset local storage to original 8 multilingual stories?')) {
      resetLocalStories();
      onRefreshData();
      setStatusMessage('Local storage reset to default multilingual seed stories.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#181C23]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded border border-[#E2E4E8] w-full max-w-3xl shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2E4E8] bg-[#F4F4F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#6A1B9A] text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Open_Sans'] font-bold text-base text-[#1E2229]">
                Supabase PostgreSQL Setup &amp; Migration
              </h3>
              <p className="text-xs text-[#58606E]">
                Native UTF-8 collation, RLS security rules, and real-time synchronization
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Connection Status Box */}
          <div
            className={`p-4 rounded border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              connectionStatus.connected
                ? 'bg-[#E8F5EE] border-[#0E8A54]/30 text-[#0E8A54]'
                : 'bg-[#FAF7FC] border-[#6A1B9A]/30 text-[#1E2229]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              {connectionStatus.connected ? (
                <CheckCircle2 className="w-5 h-5 text-[#0E8A54] shrink-0" />
              ) : (
                <Database className="w-5 h-5 text-[#6A1B9A] shrink-0" />
              )}
              <div>
                <span className="font-bold block text-sm">
                  {connectionStatus.connected
                    ? 'Connected to Live Supabase Database'
                    : 'Running in Resilient Local Storage Mode'}
                </span>
                <span className="text-[11px] opacity-80">
                  {connectionStatus.connected
                    ? `Connected to public.stories (${connectionStatus.count} records). All updates sync directly to PostgreSQL.`
                    : 'Full CRUD functionality is active. Enter your Supabase credentials below to connect your remote database.'}
                </span>
              </div>
            </div>

            <button
              onClick={testConnection}
              disabled={testing}
              className="px-3 py-1.5 rounded bg-white border border-[#E2E4E8] text-xs font-semibold text-[#1E2229] hover:border-[#6A1B9A] self-start sm:self-auto shrink-0 shadow-2xs"
            >
              {testing ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 bg-[#E8F5EE] text-[#0E8A54] text-xs rounded border border-[#0E8A54]/30 font-medium">
              {statusMessage}
            </div>
          )}

          {/* Step 1: SQL Migration Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E2229] uppercase tracking-wide flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#6A1B9A]" />
                <span>1. Idempotent SQL Migration Script (Supabase SQL Editor)</span>
              </label>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6A1B9A] hover:text-[#7B1FA2] bg-[#F3E5F5] px-2.5 py-1 rounded transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0E8A54]" />
                    <span className="text-[#0E8A54]">SQL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#58606E]">
              Run this in your Supabase project&apos;s SQL Editor. It creates the <code className="bg-[#EBEEF7] px-1 py-0.5 rounded font-mono text-[11px]">stories</code> table with UTF-8 character constraints, unique indexes, and triggers.
            </p>
            <div className="bg-[#181C23] text-[#DFE2EC] p-3 rounded font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed border border-[#4D4351]">
              <pre>{SUPABASE_SQL_MIGRATION}</pre>
            </div>
          </div>

          {/* Step 2: .env File Configuration (Stored in .env, not in browser localStorage) */}
          <div className="space-y-3 pt-2 border-t border-[#E2E4E8]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1E2229] uppercase tracking-wide">
                  2. Environment Configuration (.env &amp; Vercel)
                </h4>
                <p className="text-xs text-[#58606E]">
                  Credentials are read strictly from <code className="bg-[#EBEEF7] px-1 py-0.5 rounded font-mono text-[11px]">.env</code> and Vercel Environment Variables (never stored in browser localStorage).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const envText = `VITE_SUPABASE_URL="${url || 'https://your-project.supabase.co'}"\nVITE_SUPABASE_ANON_KEY="${anonKey || 'your-anon-key'}"\nNEXT_PUBLIC_SUPABASE_URL="${url || 'https://your-project.supabase.co'}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey || 'your-anon-key'}"`;
                  navigator.clipboard?.writeText(envText);
                  setCopiedEnv(true);
                  setTimeout(() => setCopiedEnv(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6A1B9A] hover:text-[#7B1FA2] bg-[#F3E5F5] px-2.5 py-1 rounded transition-colors shrink-0"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0E8A54]" />
                    <span className="text-[#0E8A54]">Copied .env!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy .env Template</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-[#181C23] text-[#DFE2EC] rounded font-mono text-[11px] leading-relaxed border border-[#4D4351]">
              <p className="text-[#8A92A0]"># Supabase Environment Variables</p>
              <p><span className="text-[#DA9CFF]">VITE_SUPABASE_URL</span>=&quot;{url || 'https://your-project.supabase.co'}&quot;</p>
              <p><span className="text-[#DA9CFF]">VITE_SUPABASE_ANON_KEY</span>=&quot;{anonKey ? `${anonKey.slice(0, 20)}...` : 'your-anon-public-key'}&quot;</p>
              <p className="text-[#8A92A0] mt-1"># For Next.js App Router / Vercel</p>
              <p><span className="text-[#DA9CFF]">NEXT_PUBLIC_SUPABASE_URL</span>=&quot;{url || 'https://your-project.supabase.co'}&quot;</p>
              <p><span className="text-[#DA9CFF]">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=&quot;{anonKey ? `${anonKey.slice(0, 20)}...` : 'your-anon-public-key'}&quot;</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="px-4 py-2 rounded bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {testing ? 'Testing .env...' : 'Test .env Connection'}
                </button>

                {connectionStatus.connected && (
                  <button
                    type="button"
                    onClick={handleSeedRemote}
                    disabled={seeding}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#6A1B9A] text-[#6A1B9A] hover:bg-[#F3E5F5] text-xs font-bold transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{seeding ? 'Seeding...' : 'Seed Sample Stories'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetLocal}
                className="text-[11px] text-[#8A92A0] hover:text-[#1E2229] underline"
              >
                Reset In-Memory Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

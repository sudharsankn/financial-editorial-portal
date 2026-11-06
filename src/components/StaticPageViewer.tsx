import React, { useState } from 'react';
import {
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  HelpCircle,
} from 'lucide-react';
import staticPages from '../lib/staticPageContents.json';
import { getSupabaseClient } from '../lib/supabase';

export type StaticPageType = 'about-us' | 'contact-us' | 'terms-of-use' | 'privacy-policy';

interface StaticPageViewerProps {
  pageType: StaticPageType;
  onNavigateHome: () => void;
  onNavigatePage: (page: StaticPageType) => void;
}

const PAGE_CONFIG: Record<
  StaticPageType,
  {
    titleMalayalam: string;
    titleEnglish: string;
    badge: string;
    jsonKey: string;
    icon: any;
  }
> = {
  'about-us': {
    titleMalayalam: 'ഞങ്ങളെക്കുറിച്ച്',
    titleEnglish: 'About Hedge Ohari',
    badge: 'ഹെഡ്ജ് സ്കൂൾ ഓഫ് അപ്ലൈഡ് ഇക്കണോമിക്സ് (HSAE)',
    jsonKey: 'About Us',
    icon: Building2,
  },
  'contact-us': {
    titleMalayalam: 'ബന്ധപ്പെടുക',
    titleEnglish: 'Contact Us & Editorial Office',
    badge: 'ഹെഡ്ജ് ഹൗസ്, കൊച്ചി, കേരളം',
    jsonKey: 'Contact Us',
    icon: Phone,
  },
  'terms-of-use': {
    titleMalayalam: 'ഉപയോക്തൃ നിബന്ധനകൾ',
    titleEnglish: 'Terms of Use & Subscriber Agreement',
    badge: 'നിയമപരമായ നിബന്ധനകൾ',
    jsonKey: 'Terms of Use',
    icon: FileText,
  },
  'privacy-policy': {
    titleMalayalam: 'സ്വകാര്യതാ നയം',
    titleEnglish: 'Online Privacy & Data Policy',
    badge: 'വിവര സംരക്ഷണ നയം',
    jsonKey: 'Privacy Policy',
    icon: Shield,
  },
};

export const StaticPageViewer: React.FC<StaticPageViewerProps> = ({
  pageType,
  onNavigateHome,
  onNavigatePage,
}) => {
  const config = PAGE_CONFIG[pageType] || PAGE_CONFIG['about-us'];
  const PageIcon = config.icon;
  const rawHtml = (staticPages as any)[config.jsonKey] || '';

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('ദയവായി എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക (Please fill in all fields).');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const cleanData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      };

      // Try saving to Supabase if connected
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('contact_inquiries').insert([cleanData]);
        } catch {}
      }

      // Save locally
      try {
        const saved = JSON.parse(localStorage.getItem('hedge_contact_inquiries') || '[]');
        saved.push(cleanData);
        localStorage.setItem('hedge_contact_inquiries', JSON.stringify(saved));
      } catch {}

      setSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setSubmitting(false);
      setErrorMsg('സന്ദേശം അയക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F8] text-[#262B2E] pb-24">
      {/* 1. TOP BREADCRUMB BAR */}
      <div className="bg-white border-b border-[#E6E6E6] sticky top-0 z-20 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-bold text-[#676A6C] hover:text-[#903E97] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>പ്രധാന പേജിലേക്ക് (Home)</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#878787]">
            <button onClick={onNavigateHome} className="hover:text-[#903E97]">
              Home
            </button>
            <span>/</span>
            <span className="font-bold text-[#903E97]">{config.titleEnglish}</span>
          </div>
        </div>
      </div>

      {/* 2. HERO HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#903E97] to-[#5C2361] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-xs border border-white/20">
            <PageIcon className="w-3.5 h-3.5" />
            <span>{config.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {config.titleMalayalam}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 font-medium">
            {config.titleEnglish} &bull; Hedge Ohari Financial Journal
          </p>
        </div>
      </div>

      {/* 3. PAGE BODY CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Tabs for Legal & Static Pages */}
        <div className="bg-white rounded-xl border border-[#E6E6E6] p-1.5 flex flex-wrap gap-1 shadow-2xs">
          {[
            { id: 'about-us', label: 'About Us (ഞങ്ങളെക്കുറിച്ച്)' },
            { id: 'contact-us', label: 'Contact Us (ഓഫീസ് വിലാസം)' },
            { id: 'terms-of-use', label: 'Terms of Use (നിബന്ധനകൾ)' },
            { id: 'privacy-policy', label: 'Privacy Policy (സ്വകാര്യത)' },
          ].map((tab) => {
            const isActive = pageType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigatePage(tab.id as StaticPageType)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#903E97] text-white shadow-xs'
                    : 'text-[#676A6C] hover:text-[#903E97] hover:bg-[#FAF7FC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Static HTML Content */}
        <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-xs p-6 sm:p-10">
          <div
            className="prose prose-sm sm:prose-base max-w-none text-[#262B2E] leading-relaxed
              prose-headings:font-bold prose-headings:text-[#262B2E]
              prose-p:text-xs sm:prose-p:text-sm prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-[#903E97] prose-a:font-semibold prose-a:underline
              prose-strong:text-[#262B2E] prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />

          {/* CONTACT US SPECIAL INTERACTIVE SECTION */}
          {pageType === 'contact-us' && (
            <div className="mt-10 pt-10 border-t border-[#E6E6E6] space-y-8">
              {/* Office Contact Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* General Enquiry */}
                <div className="bg-[#FAF7FC] border border-[#EADDF0] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#903E97]">
                    <Building2 className="w-4 h-4" />
                    <span>പ്രധാന ഓഫീസ് (Corporate Office)</span>
                  </div>
                  <div className="space-y-1.5 text-[#555]">
                    <p className="font-bold text-[#262B2E]">Hedge Ohari &bull; Hedge House</p>
                    <p>മാമംഗലം, പാലാരിവട്ടം (Mamangalam, Palarivattom)</p>
                    <p>കൊച്ചി (Cochin) – 682 025, കേരളം, ഇന്ത്യ</p>
                  </div>
                  <div className="pt-2 border-t border-[#EADDF0] space-y-1 text-[#262B2E]">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#903E97]" />
                      <span>ഫോൺ: +91 484 6130474 / 0484 2886000</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#903E97]" />
                      <span>മൊബൈൽ: +91 9072002958</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#903E97]" />
                      <a href="mailto:ohari@hedgegroup.in" className="text-[#903E97] font-semibold underline">
                        ohari@hedgegroup.in
                      </a>
                    </p>
                  </div>
                </div>

                {/* Advertisement & Subscriptions */}
                <div className="bg-[#FAF7FC] border border-[#EADDF0] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#903E97]">
                    <Mail className="w-4 h-4" />
                    <span>പരസ്യം &amp; സബ്സ്ക്രിപ്ഷൻ (Advertisement)</span>
                  </div>
                  <p className="text-[#676A6C]">
                    ഹെഡ്ജ് ഓഹരി ജേണലിൽ പരസ്യങ്ങൾ നൽകാനും പ്രത്യേക ബിസിനസ് ഫീച്ചറുകൾ പ്രസിദ്ധീകരിക്കാനും ബന്ധപ്പെടുക:
                  </p>
                  <div className="pt-2 border-t border-[#EADDF0] space-y-1 text-[#262B2E]">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#903E97]" />
                      <span>ഫോൺ: +91 9497837261</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#903E97]" />
                      <a href="mailto:support@hedgeohari.com" className="text-[#903E97] font-semibold underline">
                        support@hedgeohari.com
                      </a>
                    </p>
                    <p className="text-[11px] text-[#878787] pt-1">
                      ഹെഡ്ജ് സ്കൂൾ ഓഫ് അപ്ലൈഡ് ഇക്കണോമിക്സ് (HSAE)
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Inquiry Form */}
              <div className="bg-[#F8F9FA] border border-[#E6E6E6] rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#262B2E]">
                    ഞങ്ങൾക്ക് സന്ദേശം അയക്കുക (Send Us a Message)
                  </h3>
                  <p className="text-xs text-[#676A6C]">
                    നിങ്ങളുടെ സംശയങ്ങളോ അഭിപ്രായങ്ങളോ താഴെ നൽകാം. ഞങ്ങളുടെ എഡിറ്റോറിയൽ ടീം ഉടൻ മറുപടി നൽകുന്നതാണ്.
                  </p>
                </div>

                {submitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-5 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">നന്ദി! നിങ്ങളുടെ സന്ദേശം ലഭിച്ചു.</p>
                      <p>
                        ഞങ്ങളുടെ സപ്പോർട്ട് ടീം ഉടൻ നിങ്ങളുടെ ഇമെയിലിൽ ബന്ധപ്പെടും.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-2 text-xs font-bold text-emerald-700 underline"
                      >
                        മറ്റൊരു സന്ദേശം അയക്കുക
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#262B2E] mb-1">
                          പേര് (Your Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="നിങ്ങളുടെ പൂർണ്ണ നാമം"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#CCC] rounded-xl text-xs outline-none focus:border-[#903E97]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#262B2E] mb-1">
                          ഇമെയിൽ (Email Address) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#CCC] rounded-xl text-xs outline-none focus:border-[#903E97]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#262B2E] mb-1">
                        വിഷയം (Subject) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="സന്ദേശത്തിന്റെ വിഷയം"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#CCC] rounded-xl text-xs outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#262B2E] mb-1">
                        സന്ദേശം (Message) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="നിങ്ങളുടെ അന്വേഷണങ്ങൾ ഇവിടെ എഴുതുക..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#CCC] rounded-xl text-xs outline-none focus:border-[#903E97]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'അയക്കുന്നു...' : 'സന്ദേശം സമർപ്പിക്കുക (Submit Message)'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

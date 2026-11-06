import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  loginUser,
  checkSubscriberExists,
  resetUserPassword,
  UserAccount,
} from '../lib/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  onNavigateSubscribe: () => void;
}

type ModalView = 'sign-in' | 'forgot' | 'reset' | 'success';

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateSubscribe,
}) => {
  const [view, setView] = useState<ModalView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [subscriberName, setSubscriberName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Standard Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'ലോഗിൻ പരാജയപ്പെട്ടു. വിവരങ്ങൾ പരിശോധിക്കുക.');
    }
  };

  // Handle Forgot Password - Step 1: Check Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('സാധുവായ ഇമെയിൽ വിലാസം നൽകുക.');
      return;
    }

    setLoading(true);
    try {
      const result = await checkSubscriberExists(email);
      setLoading(false);
      if (result.exists && result.name) {
        setSubscriberName(result.name);
      } else {
        setSubscriberName('');
      }
      setView('reset');
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'പരിശോധന പരാജയപ്പെട്ടു.');
    }
  };

  // Handle Reset Password - Step 2: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം (Password must be at least 6 characters).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('പാസ്‌വേഡുകൾ പൊരുത്തപ്പെടുന്നില്ല (Passwords do not match).');
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(email, newPassword);
      setLoading(false);
      setPassword(newPassword);
      setView('success');
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'പാസ്‌വേഡ് മാറ്റാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.');
    }
  };

  // Quick Demo account filler
  const handleUseDemo = () => {
    setEmail('subscriber@hedgeohari.com');
    setPassword('hedge123');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E6E6E6]">
        {/* Header */}
        <div className="bg-[#FAF7FC] border-b border-[#EADDF0] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/hedge-ohari-logo.svg"
              alt="Hedge Ohari"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h2 className="font-bold text-sm text-[#262B2E]">
                {view === 'sign-in' && 'അക്കൗണ്ട് ലോഗിൻ (Sign In)'}
                {view === 'forgot' && 'പാസ്‌വേഡ് വീണ്ടെടുക്കൽ (Forgot Password)'}
                {view === 'reset' && 'പുതിയ പാസ്‌വേഡ് (Set Password)'}
                {view === 'success' && 'വിജയകരം (Success)'}
              </h2>
              <p className="text-[11px] text-[#676A6C]">Hedge Ohari Financial Editorial Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#878787] hover:text-[#262B2E] p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {view === 'sign-in' && (
            <>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#262B2E] mb-1">
                    ഇമെയിൽ വിലാസം (Email / Username)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#878787] absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs text-[#262B2E] placeholder-[#878787] focus:border-[#903E97] focus:ring-1 focus:ring-[#903E97] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#262B2E]">
                      പാസ്‌വേഡ് (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setView('forgot');
                      }}
                      className="text-[11px] text-[#903E97] hover:underline font-semibold cursor-pointer"
                    >
                      പാസ്‌വേഡ് മറന്നോ? (Forgot?)
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#878787] absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs text-[#262B2E] placeholder-[#878787] focus:border-[#903E97] focus:ring-1 focus:ring-[#903E97] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#878787] hover:text-[#262B2E] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>പരിശോധിക്കുന്നു...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>ലോഗിൻ ചെയ്യുക (Sign In)</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Fill Button */}
              <div className="mt-4 pt-4 border-t border-[#F0F0F0] text-center">
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="text-xs text-[#903E97] bg-[#FAF7FC] hover:bg-[#F2E8F7] border border-[#EADDF0] px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  ⚡ ഡെമോ സബ്സ്ക്രൈബർ അക്കൗണ്ട് ഉപയോഗിക്കുക (Quick Demo)
                </button>
              </div>

              {/* Subscribe CTA */}
              <div className="mt-5 text-center bg-[#F9F9FB] rounded-xl p-3.5 border border-[#E6E6E6]">
                <p className="text-xs text-[#676A6C]">പുതിയ വരിക്കാരനാണോ?</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateSubscribe();
                  }}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#903E97] hover:underline cursor-pointer"
                >
                  <span>ഇപ്പോൾ തന്നെ സബ്സ്ക്രൈബ് ചെയ്യുക (Subscribe Now)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* VIEW 2: FORGOT PASSWORD - EMAIL LOOKUP */}
          {view === 'forgot' && (
            <div>
              <div className="mb-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#903E97]/10 text-[#903E97] flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-[#262B2E]">പാസ്‌വേഡ് വീണ്ടെടുക്കുക</h3>
                <p className="text-xs text-[#676A6C] mt-1">
                  നിങ്ങളുടെ രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ വിലാസം നൽകുക
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#262B2E] mb-1">
                    രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ (Registered Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#878787] absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs text-[#262B2E] placeholder-[#878787] focus:border-[#903E97] focus:ring-1 focus:ring-[#903E97] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>അക്കൗണ്ട് പരിശോധിക്കുന്നു...</span>
                  ) : (
                    <>
                      <span>തുടരുക (Verify &amp; Continue)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setView('sign-in');
                  }}
                  className="text-xs text-[#676A6C] hover:text-[#262B2E] inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>തിരികെ ലോഗിൻ പേജിലേക്ക് (Back to Sign In)</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: SET NEW PASSWORD */}
          {view === 'reset' && (
            <div>
              <div className="mb-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0E8A54]/10 text-[#0E8A54] flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-[#262B2E]">
                  {subscriberName ? `${subscriberName}, പുതിയ പാസ്‌വേഡ് നൽകുക` : 'പുതിയ പാസ്‌വേഡ് സജ്ജീകരിക്കുക'}
                </h3>
                <p className="text-xs text-[#676A6C] font-mono mt-0.5">{email}</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#262B2E] mb-1">
                    പുതിയ പാസ്‌വേഡ് (New Password - Min 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#878787] absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ"
                      required
                      autoFocus
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs text-[#262B2E] placeholder-[#878787] focus:border-[#903E97] focus:ring-1 focus:ring-[#903E97] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-[#878787] hover:text-[#262B2E] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#262B2E] mb-1">
                    പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക (Confirm Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#878787] absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="പാസ്‌വേഡ് വീണ്ടും നൽകുക"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs text-[#262B2E] placeholder-[#878787] focus:border-[#903E97] focus:ring-1 focus:ring-[#903E97] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0E8A54] hover:bg-[#0b7044] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്യുന്നു...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>പാസ്‌വേഡ് സംരക്ഷിക്കുക (Save New Password)</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setView('forgot');
                  }}
                  className="text-xs text-[#676A6C] hover:text-[#262B2E] inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>മറ്റൊരു ഇമെയിൽ നൽകുക (Try Different Email)</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: RESET SUCCESS */}
          {view === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#0E8A54]/10 text-[#0E8A54] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="font-bold text-base text-[#262B2E]">പാസ്‌വേഡ് വിജയകരമായി മാറ്റി!</h3>
                <p className="text-xs text-[#676A6C] mt-1 max-w-xs mx-auto">
                  നിങ്ങളുടെ പുതിയ പാസ്‌വേഡ് സുരക്ഷിതമായി എൻക്രിപ്റ്റ് ചെയ്ത് സേവ് ചെയ്തിരിക്കുന്നു.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setView('sign-in');
                  }}
                  className="w-full py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>പുതിയ പാസ്‌വേഡ് ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

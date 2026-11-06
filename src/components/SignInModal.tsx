import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser, UserAccount } from '../lib/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  onNavigateSubscribe: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateSubscribe,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotHelper, setShowForgotHelper] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
              <h2 className="font-bold text-sm text-[#262B2E]">അക്കൗണ്ട് ലോഗിൻ</h2>
              <p className="text-[11px] text-[#676A6C]">Sign In to Hedge Ohari</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#878787] hover:text-[#262B2E] p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={() => setShowForgotHelper(!showForgotHelper)}
                  className="text-[11px] text-[#903E97] hover:underline font-semibold"
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
                  className="absolute right-3 top-2.5 text-[#878787] hover:text-[#262B2E]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Helper Box */}
            {showForgotHelper && (
              <div className="bg-[#FAF7FC] border border-[#EADDF0] rounded-xl p-3 text-[11px] text-[#676A6C] space-y-1">
                <p className="font-bold text-[#262B2E]">പാസ്‌വേഡ് പുനഃക്രമീകരിക്കാൻ:</p>
                <p>
                  ദയവായി രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പറോ ഇമെയിലോ ഉപയോഗിച്ച് ഞങ്ങളുടെ സപ്പോർട്ട് ടീമുമായി ബന്ധപ്പെടുക:
                </p>
                <p className="font-mono text-[#903E97] font-semibold">
                  support@hedgeohari.com | 0484 2886000
                </p>
              </div>
            )}

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
              className="text-xs text-[#903E97] bg-[#FAF7FC] hover:bg-[#F2E8F7] border border-[#EADDF0] px-3 py-1.5 rounded-lg font-semibold transition-colors"
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
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#903E97] hover:underline"
            >
              <span>ഇപ്പോൾ തന്നെ സബ്സ്ക്രൈബ് ചെയ്യുക (Subscribe Now)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

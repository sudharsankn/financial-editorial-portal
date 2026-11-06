import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Calendar,
  CreditCard,
  Clock,
  ArrowRight,
  Edit2,
  Check,
  LogOut,
  Bookmark,
  ChevronLeft,
  Mail,
  Phone,
  Briefcase,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { UserAccount, updateUserProfile, logoutUser } from '../lib/auth';

interface MyAccountPageProps {
  user: UserAccount;
  onUpdateUser: (user: UserAccount) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateSubscribe: () => void;
  onNavigateBookmarks: () => void;
}

export const MyAccountPage: React.FC<MyAccountPageProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onNavigateHome,
  onNavigateSubscribe,
  onNavigateBookmarks,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile);
  const [profession, setProfession] = useState(user.profession || 'Investor / Reader');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sub = user.subscription;
  const isSubscribed = sub && sub.status === 'active' && sub.daysRemaining > 0;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateUserProfile({ name, mobile, profession });
      onUpdateUser(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error updating profile');
    }
  };

  const initialLetter = (user.name || 'U').charAt(0).toUpperCase();

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
            <span>പ്രധാന പേജിലേക്ക് (Back to Home)</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#878787]">
            <span>Home</span>
            <span>/</span>
            <span className="font-bold text-[#903E97]">My Account</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Banner Alert if saved */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">നിങ്ങളുടെ പ്രൊഫൈൽ വിവരങ്ങൾ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു (Profile updated successfully!)</span>
          </div>
        )}

        {/* 2. PROFILE HERO CARD */}
        <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-[#903E97] to-[#5C2361] p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* User Avatar Circle */}
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shrink-0">
                {initialLetter}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user.name}</h1>
                  {isSubscribed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400 text-emerald-950 uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ആക്ടീവ് വരിക്കാരൻ (Subscriber)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-300 text-amber-950 uppercase tracking-wider">
                      സാധാരണ വായനക്കാരൻ (Free Reader)
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/80 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-80" />
                  <span>{user.email}</span>
                </p>
                {user.mobile && (
                  <p className="text-xs text-white/70 flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 opacity-80" />
                    <span>{user.mobile}</span>
                  </p>
                )}
                <p className="text-xs text-white/70 flex items-center justify-center sm:justify-start gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 opacity-80" />
                  <span>{user.profession || 'സാമ്പത്തിക നിക്ഷേപകൻ (Investor)'}</span>
                </p>
              </div>

              {/* Edit Profile Action Button */}
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'മാറ്റം വരുത്തൽ ഒഴിവാക്കുക' : 'പ്രൊഫൈൽ മാറ്റുക (Edit)'}</span>
              </button>
            </div>
          </div>

          {/* Inline Edit Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="p-6 bg-[#FAF7FC] border-b border-[#EADDF0] space-y-4">
              <h3 className="text-xs font-bold text-[#903E97] uppercase tracking-wider">
                പ്രൊഫൈൽ വിവരങ്ങൾ തിരുത്തുക (Edit Profile Details)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#262B2E] mb-1">പൂർണ്ണ നാമം (Name)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E6E6E6] rounded-lg text-xs outline-none focus:border-[#903E97]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#262B2E] mb-1">മൊബൈൽ നമ്പർ (Mobile)</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E6E6E6] rounded-lg text-xs outline-none focus:border-[#903E97]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#262B2E] mb-1">തൊഴിൽ (Profession)</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E6E6E6] rounded-lg text-xs outline-none focus:border-[#903E97]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#676A6C] hover:bg-black/5 font-semibold"
                >
                  റദ്ദാക്കുക (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs bg-[#903E97] text-white font-bold hover:bg-[#792f80] transition-colors"
                >
                  സേവ് ചെയ്യുക (Save Changes)
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. SUBSCRIPTION DETAILS CARD */}
        <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F0F0]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#262B2E] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#903E97]" />
                <span>എന്റെ സബ്സ്ക്രിപ്ഷൻ (My Subscription)</span>
              </h2>
              <p className="text-xs text-[#676A6C]">
                ഹെഡ്ജ് ഓഹരി ഡിജിറ്റൽ ജേണലിന്റെ ആക്ടീവ് സബ്സ്ക്രിപ്ഷൻ വിവരങ്ങൾ
              </p>
            </div>

            {isSubscribed && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Plan
                </span>
              </div>
            )}
          </div>

          {sub ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Subscriber ID */}
                <div className="bg-[#FAF7FC] p-4 rounded-xl border border-[#EADDF0]">
                  <p className="text-[11px] font-semibold text-[#676A6C]">സബ്സ്ക്രിപ്ഷൻ ഐഡി</p>
                  <p className="text-sm font-mono font-bold text-[#903E97] mt-1">{sub.subId}</p>
                  <p className="text-[10px] text-[#878787] mt-0.5">Subscriber ID</p>
                </div>

                {/* Metric 2: Plan Duration */}
                <div className="bg-[#FAF7FC] p-4 rounded-xl border border-[#EADDF0]">
                  <p className="text-[11px] font-semibold text-[#676A6C]">തിരഞ്ഞെടുത്ത പ്ലാൻ</p>
                  <p className="text-sm font-bold text-[#262B2E] mt-1">{sub.planTitle}</p>
                  <p className="text-[10px] text-[#878787] mt-0.5">{sub.planDuration}</p>
                </div>

                {/* Metric 3: Validity Period */}
                <div className="bg-[#FAF7FC] p-4 rounded-xl border border-[#EADDF0]">
                  <p className="text-[11px] font-semibold text-[#676A6C]">കാലാവധി തീരുന്ന തീയതി</p>
                  <p className="text-sm font-bold text-[#262B2E] mt-1">{sub.expiryDate}</p>
                  <p className="text-[10px] text-[#878787] mt-0.5">Expires On</p>
                </div>

                {/* Metric 4: Days Remaining */}
                <div className="bg-[#FAF7FC] p-4 rounded-xl border border-[#EADDF0]">
                  <p className="text-[11px] font-semibold text-[#676A6C]">ശേഷിക്കുന്ന ദിവസങ്ങൾ</p>
                  <p className={`text-base font-extrabold mt-1 ${sub.daysRemaining > 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {sub.daysRemaining} Days
                  </p>
                  <p className="text-[10px] text-[#878787] mt-0.5">Days for renewal</p>
                </div>
              </div>

              {/* Payment Details Sub-section */}
              <div className="bg-[#F9F9FB] rounded-xl p-4 border border-[#E6E6E6] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#676A6C]">അടച്ച തുക (Amount Paid):</span>
                  <span className="font-bold text-[#262B2E]">₹{sub.amountPaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#676A6C]">പേയ്‌മെന്റ് റഫറൻസ് (Txn ID):</span>
                  <span className="font-mono text-[11px] font-medium text-[#262B2E]">{sub.paymentId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#676A6C]">ആരംഭിച്ച തീയതി (Start Date):</span>
                  <span className="text-[#262B2E]">{sub.startDate}</span>
                </div>
              </div>

              {/* Actions for Subscribers */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onNavigateSubscribe}
                  className="w-full sm:w-auto px-6 py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>സബ്സ്ക്രിപ്ഷൻ പുതുക്കുക / അപ്‌ഗ്രേഡ് ചെയ്യുക (Renew / Upgrade)</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateBookmarks}
                  className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#F2F2F2] border border-[#E6E6E6] text-[#262B2E] rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-[#903E97]" />
                  <span>സേവ് ചെയ്ത ലേഖനങ്ങൾ ({localStorage.getItem('hedge_saved_bookmarks') ? JSON.parse(localStorage.getItem('hedge_saved_bookmarks') || '[]').length : 0})</span>
                </button>
              </div>
            </div>
          ) : (
            /* Non-subscriber state */
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[#262B2E]">സജീവ സബ്സ്ക്രിപ്ഷൻ കണ്ടെത്തിയില്ല</h3>
                <p className="text-xs text-[#676A6C] max-w-md mx-auto">
                  പ്രീമിയം ഇൻവെസ്റ്റ്‌മെന്റ് ലേഖനങ്ങളും വിപണി അവലോകനങ്ങളും പരിധിയില്ലാതെ വായിക്കാൻ ഹെഡ്ജ് ഓഹരി സബ്സ്ക്രൈബ് ചെയ്യുക.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateSubscribe}
                className="px-6 py-3 bg-[#903E97] hover:bg-[#792f80] text-white rounded-xl font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>ഇപ്പോൾ തന്നെ സബ്സ്ക്രൈബ് ചെയ്യുക (Subscribe Now)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 4. LOGOUT & FOOTER CONTROLS */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>അക്കൗണ്ടിൽ നിന്ന് പുറത്തുകടക്കുക (Sign Out)</span>
          </button>

          <p className="text-[11px] text-[#878787]">
            ഹെഡ്ജ് സ്കൂൾ ഓഫ് അപ്ലൈഡ് ഇക്കണോമിക്സ് (HSAE) &bull; ഹെഡ്ജ് ഇക്വിറ്റീസ്
          </p>
        </div>
      </div>
    </div>
  );
};


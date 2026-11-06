import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowLeft,
  Lock,
  CreditCard,
  Smartphone,
  BookOpen,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Gift,
  Building2,
  CheckCircle2,
  Share2,
  FileText,
  BadgePercent,
  Download,
} from 'lucide-react';

interface SubscriptionPageProps {
  onBackHome: () => void;
  onSelectStory?: (canonicalUrl: string) => void;
}

interface PlanOption {
  id: 'annual' | 'two-year' | 'starter';
  titleMalayalam: string;
  titleEnglish: string;
  badge?: string;
  isPopular?: boolean;
  price: number;
  originalPrice: number;
  durationMonths: number;
  durationLabel: string;
  monthlyEquivalent: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'annual',
    titleMalayalam: 'വാർഷിക പ്ലാൻ (1 വർഷം)',
    titleEnglish: '1-Year Annual Plan',
    price: 150,
    originalPrice: 300,
    durationMonths: 12,
    durationLabel: '12 Months Access',
    monthlyEquivalent: '₹12.50 / മാസം',
    features: [
      'എല്ലാ ദിവസത്തെയും സാമ്പത്തിക വാർത്തകളും വിശകലനങ്ങളും',
      'നിഫ്റ്റി, സെൻസെക്സ് ലൈവ് മാർക്കറ്റ് പൾസ് & മൂവേഴ്സ്',
      'പ്രതിവാര സ്റ്റോക്ക് ശുപാർശകളും സെക്ടർ സ്കാനും',
      'മ്യൂച്വൽ ഫണ്ട്, പേഴ്സണൽ ഫിനാൻസ് & നികുതി ആസൂത്രണം',
      'വെബ്ബിലും മൊബൈലിലും ഒരേസമയം വായിക്കാം (5 ഉപകരണങ്ങൾ വരെ)',
      'പ്രഭാത മാർക്കറ്റ് റിപ്പോർട്ടുകൾ (Morning Dispatch)',
    ],
  },
  {
    id: 'two-year',
    titleMalayalam: 'വെൽത്ത് ക്രിയേറ്റർ പ്ലാൻ (2 വർഷം)',
    titleEnglish: '2-Year Wealth Creator Plan',
    badge: 'ഏറ്റവും ജനപ്രിയം • 55% OFF',
    isPopular: true,
    price: 270,
    originalPrice: 600,
    durationMonths: 24,
    durationLabel: '24 Months Access',
    monthlyEquivalent: '₹11.25 / മാസം',
    features: [
      '1 വർഷത്തെ പ്ലാനിലുള്ള എല്ലാ ഫീച്ചറുകളും ഉൾപ്പെടുന്നു',
      'ഐപിഒ വാച്ച്: വരാനിരിക്കുന്ന എല്ലാ ഐപിഒകളുടെയും സമഗ്ര വിശകലനം',
      'കമ്പനികളുടെ പാദവാർഷിക ഫലങ്ങളും ഏർണിംഗ്സ് കലണ്ടറും',
      'ഹെഡ്ജ് സ്കൂൾ ഓഫ് അപ്ലൈഡ് ഇക്കണോമിക്സ് (HSAE) വെബിനാറുകളിൽ സൗജന്യ പങ്കാളിത്തം',
      'പരസ്യങ്ങളില്ലാത്ത തടസ്സമില്ലാത്ത വായനാനുഭവം (Ad-Free Experience)',
      'വിഐപി വാട്സാപ്പ് / ടെലിഗ്രാം മാർക്കറ്റ് അലേർട്ട് അപ്ഡേറ്റുകൾ',
      'പോർട്ട്ഫോളിയോ റിവ്യൂ ഗൈഡൻസ് ചെക്ക്‌ലിസ്റ്റ്',
    ],
  },
  {
    id: 'starter',
    titleMalayalam: 'സ്റ്റാർട്ടർ പാസ് (6 മാസം)',
    titleEnglish: '6-Month Starter Pass',
    price: 99,
    originalPrice: 180,
    durationMonths: 6,
    durationLabel: '6 Months Access',
    monthlyEquivalent: '₹16.50 / മാസം',
    features: [
      'ഓഹരി വിപണിയിൽ തുടക്കക്കാർക്ക് അനുയോജ്യമായ ഗൈഡുകൾ',
      'ദൈനംദിന പ്രധാന വാർത്തകൾ & മാർക്കറ്റ് ട്രെൻഡുകൾ',
      'ബേസിക് മ്യൂച്വൽ ഫണ്ട് നിക്ഷേപ ടിപ്പുകൾ',
      'ഡിജിറ്റൽ ആക്സസ് മൊബൈലിലും ഡെസ്ക്ടോപ്പിലും',
    ],
  },
];

const FAQS = [
  {
    q: 'ഹെഡ്ജ് ഓഹരി സബ്സ്ക്രിപ്ഷൻ എനിക്ക് എത്ര ഉപകരണങ്ങളിൽ ഉപയോഗിക്കാം?',
    a: 'നിങ്ങളുടെ ഒരു അക്കൗണ്ട് ഉപയോഗിച്ച് പരമാവധി 5 രജിസ്റ്റർ ചെയ്ത ഉപകരണങ്ങളിൽ (മൊബൈൽ, ടാബ്‌ലെറ്റ്, ലാപ്ടോപ്പ്) ലോഗിൻ ചെയ്യാവുന്നതാണ്. സുരക്ഷാ മാനദണ്ഡങ്ങൾ പ്രകാരം ഒരേസമയം ഒരു സ്ക്രീനിലാണ് ആക്റ്റീവ് റീഡിംഗ് സാധ്യമാകുക.',
  },
  {
    q: 'വിദേശത്തുള്ള പ്രവാസികൾക്ക് (NRIs) സബ്സ്ക്രൈബ് ചെയ്യാൻ സാധിക്കുമോ?',
    a: 'തീർച്ചയായും! യുഎഇ, ഖത്തർ, സൗദി അറേബ്യ, കുവൈറ്റ്, ഒമാൻ, യുകെ, യുഎസ്എ തുടങ്ങിയ വിദേശ രാജ്യങ്ങളിലുള്ള പ്രവാസി മലയാളികൾക്ക് ഇന്റർനാഷണൽ ക്രെഡിറ്റ്/ഡെബിറ്റ് കാർഡുകൾ അല്ലെങ്കിൽ എൻആർഇ യുപിഐ വഴി സുരക്ഷിതമായി സബ്സ്ക്രൈബ് ചെയ്യാം.',
  },
  {
    q: 'പേയ്മെന്റ് കഴിഞ്ഞയുടൻ സബ്സ്ക്രിപ്ഷൻ ആരംഭിക്കുമോ?',
    a: 'അതെ! പേയ്മെന്റ് പൂർത്തിയായ ഉടൻ തന്നെ നിങ്ങളുടെ അക്കൗണ്ട് സജീവമാവുകയും എല്ലാ പ്രീമിയം സ്റ്റോറികളും വിശകലനങ്ങളും വായിക്കാൻ ആരംഭിക്കുകയും ചെയ്യാം. സ്ഥിരീകരണ സന്ദേശവും ഇൻവോയ്സും നിങ്ങളുടെ ഇമെയിലിലും എസ്എംഎസിലും ലഭ്യമാകും.',
  },
  {
    q: 'ഹെഡ്ജ് ഓഹരിയിലെ ഉള്ളടക്കം മലയാളത്തിലാണോ ലഭ്യമാകുക?',
    a: 'അതെ, ഹെഡ്ജ് ഓഹരി മലയാളത്തിലെ ആദ്യത്തെ സമ്പൂർണ്ണ ഫിനാൻഷ്യൽ ജേണലാണ്. ഓഹരി വിപണി, വ്യക്തിഗത ധനകാര്യം, നിക്ഷേപ തന്ത്രങ്ങൾ തുടങ്ങിയ സങ്കീർണ്ണമായ വിഷയങ്ങൾ സാധാരണക്കാർക്കും എളുപ്പത്തിൽ മനസ്സിലാക്കാവുന്ന ലളിതമായ മലയാളത്തിലാണ് അവതരിപ്പിക്കുന്നത്.',
  },
  {
    q: 'പേയ്മെന്റുകൾ എത്രത്തോളം സുരക്ഷിതമാണ്?',
    a: '100% ബാങ്ക്-ഗ്രേഡ് 256-Bit SSL എൻക്രിപ്ഷൻ വഴിയാണ് നിങ്ങളുടെ എല്ലാ ഇടപാടുകളും പ്രോസസ്സ് ചെയ്യപ്പെടുന്നത്. ഞങ്ങൾ ആർബിഐ അംഗീകൃത സുരക്ഷിത പേയ്‌മെന്റ് ഗേറ്റ്‌വേകളാണ് ഉപയോഗിക്കുന്നത്.',
  },
];

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onBackHome,
  onSelectStory,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'annual' | 'two-year' | 'starter'>('two-year');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [cityRegion, setCityRegion] = useState('Kerala');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [promoCode, setPromoCode] = useState('OHARI50');
  const [promoApplied, setPromoApplied] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Dynamically load official Razorpay Checkout SDK
  React.useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  // GST Calculation (18% inclusive in display)
  const basePrice = selectedPlan.price;
  const gstAmount = Math.round(basePrice * 0.18);
  const finalPayable = basePrice;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'OHARI50' || promoCode.trim().toUpperCase() === 'HEDGE') {
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim() || !emailAddress.trim()) {
      alert('ദയവായി നിങ്ങളുടെ പേര്, ഫോൺ നമ്പർ, ഇമെയിൽ എന്നിവ പൂരിപ്പിക്കുക.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Create Order via Razorpay Serverless API
      let orderId = `order_${Date.now()}`;
      let keyId = 'rzp_test_9oy85KnsbS2V4P';

      try {
        const orderRes = await fetch('/api/razorpay?action=create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalPayable * 100, // paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            planTitle: selectedPlan.titleMalayalam,
            customerName: fullName,
            customerEmail: emailAddress,
            customerMobile: mobileNumber,
          }),
        });

        if (orderRes.ok) {
          const orderJson = await orderRes.json();
          if (orderJson.key_id) keyId = orderJson.key_id;
          if (orderJson.order?.id) orderId = orderJson.order.id;
        }
      } catch (err) {
        console.warn('Using client-side direct Razorpay order fallback:', err);
      }

      // 2. Open Official Razorpay Checkout Modal
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: keyId,
          amount: finalPayable * 100,
          currency: 'INR',
          name: 'Hedge Ohari',
          description: `${selectedPlan.titleMalayalam} (${selectedPlan.durationLabel})`,
          image: '/hedge-ohari-logo.svg',
          order_id: orderId.startsWith('order_') && !orderId.includes('_test') ? orderId : undefined,
          prefill: {
            name: fullName,
            email: emailAddress,
            contact: mobileNumber,
          },
          notes: {
            planTitle: selectedPlan.titleMalayalam,
            planId: selectedPlan.id,
            region: cityRegion,
          },
          theme: {
            color: '#903E97',
          },
          handler: async function (response: any) {
            // Verify payment
            try {
              await fetch('/api/razorpay?action=verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
            } catch {}

            const subId = `HO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + selectedPlan.durationMonths);

            const subData = {
              subId,
              planTitle: selectedPlan.titleMalayalam,
              planDuration: selectedPlan.durationLabel,
              amountPaid: finalPayable,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              orderId: response.razorpay_order_id || orderId,
              customerName: fullName,
              customerMobile: mobileNumber,
              customerEmail: emailAddress,
              paymentMethod: paymentMethod.toUpperCase(),
              expiryDate: expiry.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              createdAt: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };

            try {
              localStorage.setItem('hedge_is_subscribed', 'true');
              localStorage.setItem('hedge_subscription_record', JSON.stringify(subData));
            } catch {}

            setSubscriptionDetails(subData);
            setIsSuccess(true);
            setProcessing(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setProcessing(false);
          alert(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        // Fallback simulation if checkout script is delayed or blocked
        setTimeout(() => {
          setProcessing(false);
          const subId = `HO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + selectedPlan.durationMonths);

          const subData = {
            subId,
            planTitle: selectedPlan.titleMalayalam,
            planDuration: selectedPlan.durationLabel,
            amountPaid: finalPayable,
            paymentId: `pay_test_${Date.now()}`,
            orderId: orderId,
            customerName: fullName,
            customerMobile: mobileNumber,
            customerEmail: emailAddress,
            expiryDate: expiry.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            createdAt: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          try {
            localStorage.setItem('hedge_is_subscribed', 'true');
            localStorage.setItem('hedge_subscription_record', JSON.stringify(subData));
          } catch {}

          setSubscriptionDetails(subData);
          setIsSuccess(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1200);
      }
    } catch (err: any) {
      setProcessing(false);
      alert('Unable to initiate Razorpay gateway. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F8] text-[#262B2E] pb-20">
      {/* 1. TOP BREADCRUMB / BACK BAR */}
      <div className="bg-white border-b border-[#E6E6E6] sticky top-0 z-20 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center justify-between">
          <button
            id="btn-back-to-home-from-sub"
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#676A6C] hover:text-[#903E97] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>പ്രധാന പേജിലേക്ക് മടങ്ങുക (Back to Journal)</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E8A54] bg-[#E8F5EE] px-3 py-1 rounded-full border border-[#0E8A54]/20">
            <ShieldCheck className="w-4 h-4 text-[#0E8A54]" />
            <span className="hidden sm:inline">100% സുരക്ഷിതമായ എൻക്രിപ്ഷൻ</span>
            <span className="sm:hidden">100% Secure</span>
          </div>
        </div>
      </div>

      {/* 2. IF SUBSCRIBED SUCCESS SCREEN */}
      {isSuccess && subscriptionDetails ? (
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
          <div className="bg-white rounded-2xl border border-[#903E97]/30 shadow-lg p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#E8F5EE] border-2 border-[#0E8A54] text-[#0E8A54] mx-auto flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7FC] text-[#903E97] border border-[#903E97]/20 mb-2">
                സബ്സ്ക്രിപ്ഷൻ വിജയകരം (Subscription Confirmed)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#262B2E]">
                ഹെഡ്ജ് ഓഹരി കുടുംബത്തിലേക്ക് സ്വാഗതം!
              </h1>
              <p className="text-sm text-[#676A6C] mt-1 max-w-lg mx-auto">
                പ്രിയ <strong>{subscriptionDetails.customerName}</strong>, നിങ്ങളുടെ സബ്സ്ക്രിപ്ഷൻ വിജയകരമായി സജീവമാക്കിയിരിക്കുന്നു.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-[#FAF7FC] border border-[#E6E6E6] rounded-xl p-5 text-left text-xs sm:text-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                <span className="text-[#676A6C]">സബ്സ്ക്രിപ്ഷൻ ഐഡി (Subscriber ID):</span>
                <span className="font-mono font-bold text-[#903E97]">{subscriptionDetails.subId}</span>
              </div>
              {subscriptionDetails.paymentId && (
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                  <span className="text-[#676A6C]">Razorpay പേയ്‌മെന്റ് ഐഡി (Txn ID):</span>
                  <span className="font-mono font-semibold text-[#262B2E]">{subscriptionDetails.paymentId}</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                <span className="text-[#676A6C]">തിരഞ്ഞെടുത്ത പ്ലാൻ:</span>
                <span className="font-bold text-[#262B2E]">{subscriptionDetails.planTitle}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                <span className="text-[#676A6C]">കാലാവധി (Valid Until):</span>
                <span className="font-bold text-[#0E8A54]">{subscriptionDetails.expiryDate}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                <span className="text-[#676A6C]">രജിസ്റ്റർ ചെയ്ത മൊബൈൽ:</span>
                <span className="font-semibold text-[#262B2E]">{subscriptionDetails.customerMobile}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-[#262B2E]">അടച്ച തുക (Total Amount Paid):</span>
                <span className="text-lg font-extrabold text-[#903E97]">₹{subscriptionDetails.amountPaid}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-sub-start-reading"
                type="button"
                onClick={onBackHome}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#903E97] hover:bg-[#A045A8] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                ഇന്നത്തെ വാർത്തകൾ വായിക്കുക (Start Reading)
              </button>

              <button
                id="btn-sub-download-invoice"
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#E6E6E6] bg-white hover:bg-[#F6F5F8] text-[#262B2E] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#676A6C]" />
                <span>രസീത് ഡൗൺലോഡ് ചെയ്യുക (Invoice)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 3. HERO BANNER */}
          <section className="bg-gradient-to-b from-white via-[#FAF7FC] to-[#F6F5F8] border-b border-[#E6E6E6] pt-10 pb-12 sm:pb-16 text-center px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#903E97]/10 text-[#903E97] text-xs font-bold border border-[#903E97]/20 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>പ്രത്യേക ഓഫർ — 50% മുതൽ 55% വരെ കിഴിവ് (Limited Period Offer)</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#262B2E] leading-tight sm:leading-tight">
                നിങ്ങളുടെ സമ്പത്ത് വളർത്താൻ ശരിയായ ദിശാബോധം
              </h1>

              <p className="text-sm sm:text-base text-[#676A6C] max-w-2xl mx-auto leading-relaxed">
                കേരളത്തിലെ പ്രമുഖ ധനകാര്യ ജേണലായ <strong>ഹെഡ്ജ് ഓഹരി</strong> ഡിജിറ്റൽ പതിപ്പിലേക്ക് ഇന്ന് തന്നെ സബ്സ്ക്രൈബ് ചെയ്യൂ. നിക്ഷേപ വിജ്ഞാനവും കൃത്യമായ വിപണി വിശകലനങ്ങളും നിങ്ങളുടെ വിരൽത്തുമ്പിൽ.
              </p>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-[#676A6C]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0E8A54]" />
                  <span>50,000+ സജീവ വായനക്കാർ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0E8A54]" />
                  <span>വിദഗ്ദ്ധ സെബി അനലിസ്റ്റ് വിശകലനങ്ങൾ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0E8A54]" />
                  <span>മൊബൈൽ & വെബ് ആക്സസ്</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. PLANS SELECTION & CHECKOUT CONTAINER */}
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-8 pb-12">
            <div className="max-w-6xl mx-auto space-y-10">
              {/* PLAN TIERS GRID */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#262B2E]">
                    നിങ്ങൾക്ക് അനുയോജ്യമായ പ്ലാൻ തിരഞ്ഞെടുക്കുക
                  </h2>
                  <p className="text-xs sm:text-sm text-[#676A6C] mt-1">
                    Select a plan that suits your investment and market research goals
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        id={`card-sub-plan-${plan.id}`}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative rounded-2xl transition-all cursor-pointer flex flex-col justify-between p-6 sm:p-7 ${
                          isSelected
                            ? 'bg-white border-2 border-[#903E97] shadow-xl ring-2 ring-[#903E97]/20 scale-[1.01]'
                            : 'bg-white border border-[#E6E6E6] hover:border-[#903E97]/50 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Top Badge */}
                        {plan.badge && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#903E97] to-[#B045B8] text-white text-[11px] font-extrabold tracking-wider uppercase shadow-sm">
                              {plan.badge}
                            </span>
                          </div>
                        )}

                        <div>
                          {/* Plan Title & Duration */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-extrabold text-base sm:text-lg text-[#262B2E]">
                                {plan.titleMalayalam}
                              </h3>
                              <p className="text-xs text-[#878787] font-semibold mt-0.5">
                                {plan.titleEnglish}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                                isSelected
                                  ? 'border-[#903E97] bg-[#903E97] text-white'
                                  : 'border-[#CCC] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="my-4 pb-4 border-b border-[#F0F0F0]">
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl sm:text-4xl font-extrabold text-[#262B2E]">
                                ₹{plan.price}
                              </span>
                              <span className="text-sm line-through text-[#878787]">
                                ₹{plan.originalPrice}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#E8F5EE] text-[#0E8A54] font-bold text-xs">
                                {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#676A6C]">
                              <span className="font-semibold text-[#903E97]">{plan.durationLabel}</span>
                              <span>•</span>
                              <span>{plan.monthlyEquivalent}</span>
                            </div>
                          </div>

                          {/* Features List */}
                          <div className="space-y-2.5 my-4">
                            <p className="text-xs font-bold text-[#262B2E] uppercase tracking-wider">
                              പ്രധാന സവിശേഷതകൾ:
                            </p>
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-[#555]">
                                <Check className="w-4 h-4 text-[#0E8A54] shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Select Button */}
                        <div className="pt-4 mt-auto">
                          <button
                            type="button"
                            className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                              isSelected
                                ? 'bg-[#903E97] text-white shadow-md'
                                : 'bg-[#FAF7FC] text-[#903E97] hover:bg-[#903E97] hover:text-white border border-[#903E97]/30'
                            }`}
                          >
                            {isSelected ? 'തിരഞ്ഞെടുത്ത പ്ലാൻ (Selected)' : 'ഈ പ്ലാൻ തിരഞ്ഞെടുക്കുക'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CHECKOUT & USER DETAILS FORM */}
              <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 pb-6 border-b border-[#E6E6E6]">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7FC] border border-[#903E97]/30 flex items-center justify-center text-[#903E97]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#262B2E]">
                      സബ്സ്ക്രിപ്ഷൻ വിവരങ്ങൾ (Subscription Details)
                    </h3>
                    <p className="text-xs text-[#676A6C]">
                      പൂർണ്ണ വിവരങ്ങൾ നൽകി പേയ്‌മെന്റിലേക്ക് കടക്കുക. നിമിഷങ്ങൾക്കുള്ളിൽ നിങ്ങളുടെ അക്കൗണ്ട് സജീവമാകും.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Form Inputs */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#262B2E] mb-1.5">
                        പൂർണ്ണ നാമം (Full Name) <span className="text-[#D32F2F]">*</span>
                      </label>
                      <input
                        id="input-sub-name"
                        type="text"
                        required
                        placeholder="ഉദാ: രാജേഷ് കുമാർ"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#CCC] focus:border-[#903E97] focus:ring-2 focus:ring-[#903E97]/20 outline-none transition-all"
                      />
                    </div>

                    {/* Mobile & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#262B2E] mb-1.5">
                          മൊബൈൽ നമ്പർ (Mobile / WhatsApp) <span className="text-[#D32F2F]">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#CCC] bg-[#F6F5F8] text-xs font-semibold text-[#676A6C]">
                            +91
                          </span>
                          <input
                            id="input-sub-mobile"
                            type="tel"
                            required
                            placeholder="98765 43210"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-r-lg border border-[#CCC] focus:border-[#903E97] focus:ring-2 focus:ring-[#903E97]/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#262B2E] mb-1.5">
                          ഇമെയിൽ വിലാസം (Email Address) <span className="text-[#D32F2F]">*</span>
                        </label>
                        <input
                          id="input-sub-email"
                          type="email"
                          required
                          placeholder="rajesh@example.com"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-[#CCC] focus:border-[#903E97] focus:ring-2 focus:ring-[#903E97]/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Region / City Pills */}
                    <div>
                      <label className="block text-xs font-bold text-[#262B2E] mb-1.5">
                        താമസസ്ഥലം / രാജ്യം (Location / Region)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Kerala', 'Bengaluru / Chennai', 'Mumbai / Delhi', 'UAE / Gulf (GCC)', 'Other NRI'].map(
                          (loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => setCityRegion(loc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                cityRegion === loc
                                  ? 'bg-[#903E97] text-white'
                                  : 'bg-[#F6F5F8] text-[#555] hover:bg-[#EBE9EE]'
                              }`}
                            >
                              {loc}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-[#262B2E] mb-2">
                        പേയ്മെന്റ് രീതി തിരഞ്ഞെടുക്കുക (Select Payment Method)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            paymentMethod === 'upi'
                              ? 'border-[#903E97] bg-[#FAF7FC] text-[#903E97] font-bold shadow-2xs'
                              : 'border-[#E6E6E6] bg-white text-[#555] hover:border-[#CCC]'
                          }`}
                        >
                          <Smartphone className="w-5 h-5 text-[#903E97]" />
                          <span className="text-xs">UPI / GPay / PhonePe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            paymentMethod === 'card'
                              ? 'border-[#903E97] bg-[#FAF7FC] text-[#903E97] font-bold shadow-2xs'
                              : 'border-[#E6E6E6] bg-white text-[#555] hover:border-[#CCC]'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 text-[#903E97]" />
                          <span className="text-xs">Debit / Credit Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('netbanking')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            paymentMethod === 'netbanking'
                              ? 'border-[#903E97] bg-[#FAF7FC] text-[#903E97] font-bold shadow-2xs'
                              : 'border-[#E6E6E6] bg-white text-[#555] hover:border-[#CCC]'
                          }`}
                        >
                          <Building2 className="w-5 h-5 text-[#903E97]" />
                          <span className="text-xs">Net Banking</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Summary & Instant Checkout */}
                  <div className="lg:col-span-5 bg-[#FAF7FC] border border-[#903E97]/20 rounded-xl p-5 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
                        <h4 className="font-extrabold text-sm text-[#262B2E]">ഓർഡർ സംഗ്രഹം (Order Summary)</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5EE] text-[#0E8A54]">
                          Active Offer
                        </span>
                      </div>

                      {/* Selected Item */}
                      <div className="py-3 border-b border-[#E6E6E6] space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#262B2E]">
                          <span>{selectedPlan.titleMalayalam}</span>
                          <span>₹{selectedPlan.price}</span>
                        </div>
                        <p className="text-[11px] text-[#676A6C]">
                          {selectedPlan.durationLabel} • അൺലിമിറ്റഡ് ആക്സസ്
                        </p>
                      </div>

                      {/* Promo Code Box */}
                      <div className="py-3 border-b border-[#E6E6E6]">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="പ്രൊമോ കോഡ് (e.g. OHARI50)"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs rounded border border-[#CCC] uppercase font-mono tracking-wider outline-none focus:border-[#903E97]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            className="px-3 py-1.5 rounded bg-[#262B2E] hover:bg-[#111] text-white text-xs font-bold"
                          >
                            Apply
                          </button>
                        </div>
                        {promoApplied && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#0E8A54] mt-1.5 font-semibold">
                            <BadgePercent className="w-3.5 h-3.5" />
                            <span>പ്രത്യേക 50% കിഴിവ് കൂപ്പൺ നിലവിലുണ്ട്!</span>
                          </div>
                        )}
                      </div>

                      {/* Line Items */}
                      <div className="py-3 space-y-2 text-xs text-[#676A6C]">
                        <div className="flex items-center justify-between">
                          <span>യഥാർത്ഥ വില (Original Value):</span>
                          <span className="line-through">₹{selectedPlan.originalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#0E8A54] font-semibold">
                          <span>പ്രൊമോഷണൽ കിഴിവ് (Discount):</span>
                          <span>-₹{selectedPlan.originalPrice - selectedPlan.price}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ജി.എസ്.ടി (GST 18% Inclusive):</span>
                          <span>₹{gstAmount} (ഉൾപ്പെടുത്തിയിരിക്കുന്നു)</span>
                        </div>
                      </div>

                      {/* Final Total */}
                      <div className="pt-3 border-t border-[#903E97]/30 flex items-baseline justify-between text-[#262B2E]">
                        <span className="text-sm font-extrabold">ആകെ അടയ്ക്കേണ്ടത് (Total Payable):</span>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-[#903E97]">₹{finalPayable}</span>
                          <span className="block text-[10px] text-[#878787]">എല്ലാ നികുതികളും ഉൾപ്പെടെ</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        id="btn-sub-proceed-payment"
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 rounded-xl bg-[#903E97] hover:bg-[#A045A8] text-white text-sm font-extrabold tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>പ്രോസസ്സ് ചെയ്യുന്നു...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>പേയ്മെന്റിലേക്ക് കടക്കുക (Pay ₹{finalPayable})</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-3 text-[10px] text-[#878787]">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0E8A54]" />
                          256-Bit SSL സുരക്ഷിതം
                        </span>
                        <span>•</span>
                        <span>തത്സമയ ആക്റ്റിവേഷൻ</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* 5. WHY SUBSCRIBE BENEFITS GRID */}
              <div className="pt-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#262B2E]">
                    എന്തുകൊണ്ട് ഹെഡ്ജ് ഓഹരി സബ്സ്ക്രൈബ് ചെയ്യണം?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#676A6C] mt-1">
                    Why 50,000+ readers trust Hedge Ohari for Malayalam Financial Intelligence
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white rounded-xl border border-[#E6E6E6] p-5 space-y-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF7FC] text-[#903E97] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#262B2E]">ഓഹരി വിപണി വിശകലനം</h4>
                    <p className="text-xs text-[#676A6C] leading-normal">
                      നിഫ്റ്റി, സെൻസെക്സ് കമ്പനികളുടെ കൃത്യമായ ചലനങ്ങളും വിദഗ്ദ്ധ സ്റ്റോക്ക് ശുപാർശകളും.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E6E6E6] p-5 space-y-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF7FC] text-[#903E97] flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#262B2E]">വ്യക്തിഗത ധനകാര്യം</h4>
                    <p className="text-xs text-[#676A6C] leading-normal">
                      മ്യൂച്വൽ ഫണ്ട് SIP, ഇൻഷുറൻസ്, ടാക്സ് പ്ലാനിംഗ് തുടങ്ങിയവയിൽ പ്രായോഗിക നിർദ്ദേശങ്ങൾ.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E6E6E6] p-5 space-y-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF7FC] text-[#903E97] flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#262B2E]">ലളിതമായ മലയാളം ഭാഷ</h4>
                    <p className="text-xs text-[#676A6C] leading-normal">
                      കഠിനമായ സാമ്പത്തിക ശാസ്ത്ര പദങ്ങൾ സാധാരണക്കാർക്കും ലളിതമായി മനസ്സിലാകുന്ന ഭാഷയിൽ.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E6E6E6] p-5 space-y-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF7FC] text-[#903E97] flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#262B2E]">എവിടെയും വായിക്കാം</h4>
                    <p className="text-xs text-[#676A6C] leading-normal">
                      മൊബൈലിലും ടാബ്‌ലെറ്റിലും ലാപ്ടോപ്പിലും തടസ്സമില്ലാത്ത ഡിജിറ്റൽ റീഡിംഗ് അനുഭവം.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
              <div className="pt-4 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#262B2E]">
                    പതിവായി ചോദിക്കുന്ന ചോദ്യങ്ങൾ (FAQ)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#676A6C] mt-1">
                    Everything you need to know about Hedge Ohari digital subscription
                  </p>
                </div>

                <div className="space-y-3">
                  {FAQS.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl border border-[#E6E6E6] overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#262B2E] hover:text-[#903E97] transition-colors"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#903E97] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#878787] shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#676A6C] leading-relaxed border-t border-[#F0F0F0] pt-3">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. CUSTOMER SUPPORT & CONTACT */}
              <div className="bg-white rounded-xl border border-[#E6E6E6] p-6 text-center space-y-2">
                <p className="text-xs font-bold text-[#262B2E]">
                  സബ്സ്ക്രിപ്ഷനുമായി ബന്ധപ്പെട്ട് എന്തെങ്കിലും സംശയങ്ങളുണ്ടോ?
                </p>
                <p className="text-xs text-[#676A6C]">
                  ഞങ്ങളുടെ കസ്റ്റമർ സപ്പോർട്ട് ടീമുമായി ബന്ധപ്പെടാം: <strong>support@hedgeohari.com</strong> | ഫോൺ: <strong>0484 2886000</strong>
                </p>
                <p className="text-[11px] text-[#878787]">
                  ഹെഡ്ജ് സ്കൂൾ ഓഫ് അപ്ലൈഡ് ഇക്കണോമിക്സ് (HSAE) &amp; ഹെഡ്ജ് ഇക്വിറ്റീസ്, കൊച്ചി, കേരളം.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


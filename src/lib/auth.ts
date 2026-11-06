export interface SubscriptionInfo {
  subId: string;
  planTitle: string;
  planDuration: string;
  amountPaid: number;
  startDate: string;
  expiryDate: string;
  paymentId: string;
  status: 'active' | 'expired';
  daysRemaining: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  mobile: string;
  profession: string;
  avatar?: string;
  subscription?: SubscriptionInfo | null;
}

const STORAGE_KEY_USER = 'hedge_user';
const STORAGE_KEY_SUB = 'hedge_subscription_record';
const STORAGE_KEY_IS_SUB = 'hedge_is_subscribed';
const STORAGE_KEY_LOGGED_OUT = 'hedge_explicit_logout';

// Calculate days remaining between today and an expiry string
export function calculateDaysRemaining(expiryStr: string): number {
  try {
    const expiryDate = new Date(expiryStr);
    if (isNaN(expiryDate.getTime())) return 0;
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

// Convert localStorage subscription record into SubscriptionInfo
export function parseStoredSubscription(): SubscriptionInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUB);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const days = calculateDaysRemaining(data.expiryDate);

    return {
      subId: data.subId || `HO-${new Date().getFullYear()}-00000`,
      planTitle: data.planTitle || 'Hedge Ohari Plan',
      planDuration: data.planDuration || '1 Year',
      amountPaid: data.amountPaid || 150,
      startDate: data.createdAt || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      expiryDate: data.expiryDate || new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      paymentId: data.paymentId || 'pay_test',
      status: days > 0 ? 'active' : 'expired',
      daysRemaining: days,
    };
  } catch {
    return null;
  }
}

// Get current logged-in user
export function getCurrentUser(): UserAccount | null {
  try {
    // If user explicitly signed out, do not auto-login
    if (localStorage.getItem(STORAGE_KEY_LOGGED_OUT) === 'true') {
      return null;
    }

    const rawUser = localStorage.getItem(STORAGE_KEY_USER);
    const existingSub = parseStoredSubscription();

    if (rawUser) {
      const user: UserAccount = JSON.parse(rawUser);
      // Sync latest subscription status
      if (existingSub) {
        user.subscription = existingSub;
      }
      return user;
    }

    // If user record doesn't exist but a subscription record exists (e.g. from checkout), create a default user session
    if (existingSub) {
      const subRaw = JSON.parse(localStorage.getItem(STORAGE_KEY_SUB) || '{}');
      const newUser: UserAccount = {
        id: `usr_${Date.now()}`,
        name: subRaw.customerName || 'Hedge Subscriber',
        email: subRaw.customerEmail || 'subscriber@hedgeohari.com',
        mobile: subRaw.customerMobile || '',
        profession: 'Investor / Financial Planner',
        subscription: existingSub,
      };
      saveCurrentUser(newUser);
      return newUser;
    }

    return null;
  } catch {
    return null;
  }
}

// Save user to localStorage
export function saveCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      if (user.subscription && user.subscription.status === 'active') {
        localStorage.setItem(STORAGE_KEY_IS_SUB, 'true');
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_IS_SUB);
    }
  } catch {}
}

// Login simulation (supports demo accounts or newly registered emails)
export async function loginUser(email: string, password: string): Promise<UserAccount> {
  // Validate email & password format
  if (!email || !email.includes('@')) {
    throw new Error('സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (Please enter a valid email address)');
  }
  if (!password || password.length < 4) {
    throw new Error('പാസ്‌വേഡ് കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം (Password must be at least 4 characters)');
  }

  // Clear any logout flag
  try {
    localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
  } catch {}

  // Artificial short delay for realistic auth feedback
  await new Promise((res) => setTimeout(res, 400));

  const existingSub = parseStoredSubscription();

  // Create or retrieve user
  const user: UserAccount = {
    id: `usr_${Date.now()}`,
    name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    email: email.toLowerCase(),
    mobile: '+91 9876543210',
    profession: 'Investor / Reader',
    subscription: existingSub || {
      subId: `HO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      planTitle: '2-Year Super Saver (24 Months)',
      planDuration: '2 Years',
      amountPaid: 270,
      startDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      expiryDate: new Date(Date.now() + 730 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      paymentId: `pay_demo_${Date.now()}`,
      status: 'active',
      daysRemaining: 730,
    },
  };

  saveCurrentUser(user);
  return user;
}

// Logout user
export function logoutUser(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGGED_OUT, 'true');
  } catch {}
  saveCurrentUser(null);
}

// Update profile
export function updateUserProfile(data: { name: string; mobile: string; profession: string }): UserAccount {
  const current = getCurrentUser();
  if (!current) throw new Error('No user is currently signed in');

  const updated: UserAccount = {
    ...current,
    name: data.name.trim() || current.name,
    mobile: data.mobile.trim() || current.mobile,
    profession: data.profession.trim() || current.profession,
  };

  saveCurrentUser(updated);
  return updated;
}


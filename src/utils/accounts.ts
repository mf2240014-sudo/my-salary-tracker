import {
  AccountsRegistry,
  BudgetAppState,
  DEFAULT_VAULT_CONFIG,
  EMPTY_APP_STATE,
  LocalAccountRecord,
} from '../types/budget';
import {hashPassword, verifyPassword} from './cryptoSync';
import {getTodayISODate, normalizeBudgetState, STORAGE_KEY} from './format';

const ACCOUNTS_REGISTRY_KEY = 'bn_orbital_accounts_registry_v1';

function generateAccountId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function createGuestDemoState(): BudgetAppState {
  const today = getTodayISODate();
  return {
    onboardingCompleted: true,
    setup: {
      basicSalary: 14000,
      offDaysCount: 4,
      offDayRate: 700,
      overtimeIncome: 2800,
      homeContribution: 9500,
      officeFoodBudget: 3000,
      savingsPercent: 60,
    },
    profile: {
      name: 'অতিথি ব্যবহারকারী',
      avatarUrl: '',
    },
    vaultConfig: {
      home: {...DEFAULT_VAULT_CONFIG.home},
      officeFood: {...DEFAULT_VAULT_CONFIG.officeFood},
      savings: {...DEFAULT_VAULT_CONFIG.savings},
      personal: {...DEFAULT_VAULT_CONFIG.personal},
    },
    security: {
      pinEnabled: false,
      pinCode: '',
      soundEnabled: true,
      privacyMasked: false,
    },
    savingsGoal: 20000,
    buckets: {
      home: {allocated: 9500, spent: 0},
      officeFood: {allocated: 3000, spent: 280},
      savings: {allocated: 2580, spent: 0},
      personal: {allocated: 1720, spent: 150},
    },
    transactions: [
      {
        id: 'demo-salary-1',
        type: 'salary',
        date: today,
        createdAt: new Date().toISOString(),
        bucketId: 'home',
        note: 'ডেমো মাসিক আয় (বেসিক ১৪,০০০ + অফ-ডে ২,৮০০)',
        amount: 16800,
        salaryBreakdown: {
          home: 9500,
          officeFood: 3000,
          savings: 2580,
          personal: 1720,
        },
      },
      {
        id: 'demo-food-1',
        type: 'expense',
        date: today,
        createdAt: new Date().toISOString(),
        bucketId: 'officeFood',
        note: 'দুপুরের খাবার ও চা',
        amount: 280,
      },
      {
        id: 'demo-personal-1',
        type: 'expense',
        date: today,
        createdAt: new Date().toISOString(),
        bucketId: 'personal',
        note: 'যাতায়াত ভাড়া',
        amount: 150,
      },
    ],
    loans: [
      {
        id: 'demo-loan-1',
        type: 'receivable',
        personName: 'রাফি (বন্ধু)',
        amount: 1000,
        date: today,
        note: 'গত সপ্তাহের ধার',
        settled: false,
      },
    ],
  };
}

export function loadAccountsRegistry(): AccountsRegistry {
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccountsRegistry>;
      const accounts: LocalAccountRecord[] = Array.isArray(parsed.accounts)
        ? parsed.accounts
            .filter(
              (a): a is LocalAccountRecord =>
                Boolean(a && typeof a.id === 'string' && typeof a.username === 'string')
            )
            .map((a) => ({
              ...a,
              state: normalizeBudgetState(a.state ?? EMPTY_APP_STATE),
            }))
        : [];

      const activeExists =
        typeof parsed.activeAccountId === 'string' &&
        accounts.some((a) => a.id === parsed.activeAccountId);

      return {
        activeAccountId: activeExists ? parsed.activeAccountId! : null,
        accounts,
      };
    }

    // One-time seamless migration if user already had legacy single-user localStorage state
    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as Partial<BudgetAppState>;
      const normalized = normalizeBudgetState(legacyParsed);
      if (normalized.onboardingCompleted) {
        const now = new Date().toISOString();
        const fallbackUsername =
          normalizeUsername(normalized.profile.name || 'my_account') || 'my_account';
        const migratedAccount: LocalAccountRecord = {
          id: generateAccountId(),
          username: fallbackUsername,
          displayUsername: fallbackUsername,
          passwordHash: '',
          isGuest: false,
          createdAt: now,
          updatedAt: now,
          state: normalized,
        };
        const registry: AccountsRegistry = {
          activeAccountId: migratedAccount.id,
          accounts: [migratedAccount],
        };
        saveAccountsRegistry(registry);
        return registry;
      }
    }
  } catch {
    // Fallback cleanly to empty registry
  }

  return {
    activeAccountId: null,
    accounts: [],
  };
}

export function saveAccountsRegistry(registry: AccountsRegistry): void {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota errors
  }
}

export async function registerLocalAccount(
  registry: AccountsRegistry,
  params: {
    username: string;
    displayName: string;
    password: string;
    initialState?: BudgetAppState;
  }
): Promise<{registry: AccountsRegistry; account: LocalAccountRecord}> {
  const cleanUsername = normalizeUsername(params.username);
  if (cleanUsername.length < 3) {
    throw new Error('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
  }
  if (params.password.length < 4) {
    throw new Error('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
  }
  if (registry.accounts.some((a) => a.username === cleanUsername && !a.isGuest)) {
    throw new Error('এই ইউজারনেমটি ইতোমধ্যে এই ডিভাইসে ব্যবহৃত হয়েছে। অন্য ইউজারনেম দিন অথবা লগইন করুন।');
  }

  const passwordHash = await hashPassword(params.password);
  const now = new Date().toISOString();
  const baseState = params.initialState ?? {
    ...EMPTY_APP_STATE,
    onboardingCompleted: false,
    profile: {
      name: params.displayName.trim() || params.username.trim(),
      avatarUrl: '',
    },
  };

  const account: LocalAccountRecord = {
    id: generateAccountId(),
    username: cleanUsername,
    displayUsername: params.username.trim(),
    passwordHash,
    isGuest: false,
    createdAt: now,
    updatedAt: now,
    state: baseState,
  };

  const nextRegistry: AccountsRegistry = {
    activeAccountId: account.id,
    accounts: [account, ...registry.accounts.filter((a) => a.username !== cleanUsername)],
  };
  saveAccountsRegistry(nextRegistry);
  return {registry: nextRegistry, account};
}

export async function loginLocalAccount(
  registry: AccountsRegistry,
  params: {
    username: string;
    password: string;
  }
): Promise<{registry: AccountsRegistry; account: LocalAccountRecord}> {
  const cleanUsername = normalizeUsername(params.username);
  const target = registry.accounts.find((a) => a.username === cleanUsername);
  if (!target) {
    throw new Error('এই ডিভাইসে এই ইউজারনেমের কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
  }

  // Legacy migrated accounts without passwordHash can be claimed or logged in directly
  if (target.passwordHash) {
    const ok = await verifyPassword(params.password, target.passwordHash);
    if (!ok) {
      throw new Error('পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।');
    }
  }

  const nextRegistry: AccountsRegistry = {
    ...registry,
    activeAccountId: target.id,
  };
  saveAccountsRegistry(nextRegistry);
  return {registry: nextRegistry, account: target};
}

export function enterGuestMode(registry: AccountsRegistry): {
  registry: AccountsRegistry;
  account: LocalAccountRecord;
} {
  const existingGuest = registry.accounts.find((a) => a.isGuest);
  if (existingGuest) {
    const nextRegistry: AccountsRegistry = {
      ...registry,
      activeAccountId: existingGuest.id,
    };
    saveAccountsRegistry(nextRegistry);
    return {registry: nextRegistry, account: existingGuest};
  }

  const now = new Date().toISOString();
  const guestAccount: LocalAccountRecord = {
    id: generateAccountId(),
    username: 'guest_demo',
    displayUsername: 'অতিথি ডেমো',
    passwordHash: '',
    isGuest: true,
    createdAt: now,
    updatedAt: now,
    state: createGuestDemoState(),
  };

  const nextRegistry: AccountsRegistry = {
    activeAccountId: guestAccount.id,
    accounts: [...registry.accounts, guestAccount],
  };
  saveAccountsRegistry(nextRegistry);
  return {registry: nextRegistry, account: guestAccount};
}

export async function upsertRestoredAccount(
  registry: AccountsRegistry,
  params: {
    username: string;
    displayUsername: string;
    password: string;
    state: BudgetAppState;
  }
): Promise<{registry: AccountsRegistry; account: LocalAccountRecord}> {
  const cleanUsername = normalizeUsername(params.username);
  const passwordHash = await hashPassword(params.password);
  const now = new Date().toISOString();
  const existing = registry.accounts.find((a) => a.username === cleanUsername);

  const restoredAccount: LocalAccountRecord = {
    id: existing ? existing.id : generateAccountId(),
    username: cleanUsername,
    displayUsername: params.displayUsername || params.username.trim(),
    passwordHash,
    isGuest: false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state: {
      ...params.state,
      onboardingCompleted: true,
    },
  };

  const nextAccounts = existing
    ? registry.accounts.map((a) => (a.id === existing.id ? restoredAccount : a))
    : [restoredAccount, ...registry.accounts];

  const nextRegistry: AccountsRegistry = {
    activeAccountId: restoredAccount.id,
    accounts: nextAccounts,
  };
  saveAccountsRegistry(nextRegistry);
  return {registry: nextRegistry, account: restoredAccount};
}

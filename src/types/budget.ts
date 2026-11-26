export type BucketId = 'home' | 'officeFood' | 'savings' | 'personal';

export interface BucketMeta {
  id: BucketId;
  orderLabel: string;
  name: string;
  shortName: string;
  description: string;
}

export interface CustomVaultConfig {
  name: string;
  shortName: string;
  quickAmounts: number[];
}

export type VaultConfigMap = Record<BucketId, CustomVaultConfig>;

export interface BucketState {
  allocated: number;
  spent: number;
}

export type BucketsMap = Record<BucketId, BucketState>;

export type TransactionType = 'expense' | 'transfer' | 'salary';

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  bucketId: BucketId;
  toBucketId?: BucketId; // Only for 'transfer'
  note: string;
  amount: number;
  salaryBreakdown?: Record<BucketId, number>; // Only for 'salary'
}

export type LoanType = 'receivable' | 'payable';

export interface LoanRecord {
  id: string;
  type: LoanType;
  personName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  settled: boolean;
  settledAt?: string;
  settledVaultId?: 'savings' | 'personal';
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pinCode: string;
  soundEnabled: boolean;
  privacyMasked: boolean;
}

export interface IncomeSetupConfig {
  basicSalary: number;
  offDaysCount: number;
  offDayRate: number;
  overtimeIncome: number;
  homeContribution: number;
  officeFoodBudget: number;
  savingsPercent: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}

export interface BudgetAppState {
  onboardingCompleted: boolean;
  setup: IncomeSetupConfig;
  profile: UserProfile;
  vaultConfig: VaultConfigMap;
  security: SecuritySettings;
  savingsGoal: number;
  buckets: BucketsMap;
  transactions: TransactionRecord[];
  loans: LoanRecord[];
}

export interface LocalAccountRecord {
  id: string;
  username: string;
  displayUsername: string;
  passwordHash: string;
  isGuest?: boolean;
  createdAt: string;
  updatedAt: string;
  state: BudgetAppState;
}

export interface AccountsRegistry {
  activeAccountId: string | null;
  accounts: LocalAccountRecord[];
}

export const BUCKET_LIST: BucketMeta[] = [
  {
    id: 'home',
    orderLabel: '১.',
    name: 'বাসায় দেওয়া / ভাড়া',
    shortName: 'বাসা / ভাড়া',
    description: 'পরিবার ও বাসার মাসিক খরচ',
  },
  {
    id: 'officeFood',
    orderLabel: '২.',
    name: 'খাবার / বাজার',
    shortName: 'খাবার / বাজার',
    description: 'দুপুরের খাবার ও নাস্তা',
  },
  {
    id: 'savings',
    orderLabel: '৩.',
    name: 'মূল সঞ্চয়',
    shortName: 'মূল সঞ্চয়',
    description: 'ভবিষ্যতের জরুরি সঞ্চয় তহবিল',
  },
  {
    id: 'personal',
    orderLabel: '৪.',
    name: 'ব্যক্তিগত খরচ',
    shortName: 'ব্যক্তিগত খরচ',
    description: 'যাতায়াত ও ব্যক্তিগত খরচ',
  },
];

export const BUCKET_BY_ID: Record<BucketId, BucketMeta> = {
  home: BUCKET_LIST[0],
  officeFood: BUCKET_LIST[1],
  savings: BUCKET_LIST[2],
  personal: BUCKET_LIST[3],
};

export const DEFAULT_VAULT_CONFIG: VaultConfigMap = {
  home: {
    name: 'বাসায় দেওয়া / ভাড়া',
    shortName: 'বাসা',
    quickAmounts: [],
  },
  officeFood: {
    name: 'অফিস খাবার',
    shortName: 'খাবার',
    quickAmounts: [50, 80, 100],
  },
  savings: {
    name: 'মূল সঞ্চয়',
    shortName: 'মূল সঞ্চয়',
    quickAmounts: [],
  },
  personal: {
    name: 'নিজের হাতখরচ',
    shortName: 'হাতখরচ',
    quickAmounts: [],
  },
};

export const HOME_QUICK_AMOUNTS = [8000, 9000, 10000, 11000] as const;
export const OFFICE_FOOD_QUICK_AMOUNTS = [50, 80, 100] as const;
export const GOAL_QUICK_AMOUNTS = [15000, 20000, 30000] as const;

export const DEFAULT_AVATAR_URL =
  '/src/assets/images/avatar_bengali_user_1795716228624.jpg';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'ব্যবহারকারী',
  avatarUrl: '',
};

export const DEFAULT_SECURITY: SecuritySettings = {
  pinEnabled: false,
  pinCode: '',
  soundEnabled: true,
  privacyMasked: false,
};

export const DEFAULT_SETUP: IncomeSetupConfig = {
  basicSalary: 0,
  offDaysCount: 0,
  offDayRate: 700,
  overtimeIncome: 0,
  homeContribution: 0,
  officeFoodBudget: 0,
  savingsPercent: 60,
};

export const DEFAULT_SAVINGS_GOAL = 20000;

export const EMPTY_BUCKETS: BucketsMap = {
  home: {allocated: 0, spent: 0},
  officeFood: {allocated: 0, spent: 0},
  savings: {allocated: 0, spent: 0},
  personal: {allocated: 0, spent: 0},
};

export const EMPTY_APP_STATE: BudgetAppState = {
  onboardingCompleted: false,
  setup: DEFAULT_SETUP,
  profile: DEFAULT_PROFILE,
  vaultConfig: DEFAULT_VAULT_CONFIG,
  security: DEFAULT_SECURITY,
  savingsGoal: DEFAULT_SAVINGS_GOAL,
  buckets: EMPTY_BUCKETS,
  transactions: [],
  loans: [],
};

export function deriveShortName(fullName: string): string {
  const cleaned = fullName.trim();
  if (!cleaned) return 'ভল্ট';
  const parts = cleaned.split(/\s+/);
  return parts.length > 2 ? parts.slice(0, 2).join(' ') : cleaned;
}

export function getVaultDisplayName(
  vaultConfig: VaultConfigMap,
  bucketId: BucketId,
  withOrder = false
): string {
  const name = vaultConfig[bucketId]?.name?.trim() || BUCKET_BY_ID[bucketId].name;
  return withOrder ? `${BUCKET_BY_ID[bucketId].orderLabel} ${name}` : name;
}


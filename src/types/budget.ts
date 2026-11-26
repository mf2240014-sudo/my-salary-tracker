export type BucketId = 'home' | 'officeFood' | 'savings' | 'personal';

export interface BucketMeta {
  id: BucketId;
  orderLabel: string;
  name: string;
  shortName: string;
  description: string;
}

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
  setup: IncomeSetupConfig;
  profile: UserProfile;
  security: SecuritySettings;
  savingsGoal: number;
  buckets: BucketsMap;
  transactions: TransactionRecord[];
  loans: LoanRecord[];
}

export const BUCKET_LIST: BucketMeta[] = [
  {
    id: 'home',
    orderLabel: '১.',
    name: 'বাসায় দেওয়া ভল্ট',
    shortName: 'বাসা',
    description: 'পরিবার ও বাসার মাসিক খরচ',
  },
  {
    id: 'officeFood',
    orderLabel: '২.',
    name: 'অফিস খাবার ভল্ট',
    shortName: 'অফিস খাবার',
    description: 'দুপুরের খাবার ও নাস্তা',
  },
  {
    id: 'savings',
    orderLabel: '৩.',
    name: 'মূল সঞ্চয় ভল্ট',
    shortName: 'মূল সঞ্চয়',
    description: 'ভবিষ্যতের জরুরি সঞ্চয় তহবিল',
  },
  {
    id: 'personal',
    orderLabel: '৪.',
    name: 'নিজের হাতখরচ ভল্ট',
    shortName: 'হাতখরচ',
    description: 'যাতায়াত ও ব্যক্তিগত খরচ',
  },
];

export const BUCKET_BY_ID: Record<BucketId, BucketMeta> = {
  home: BUCKET_LIST[0],
  officeFood: BUCKET_LIST[1],
  savings: BUCKET_LIST[2],
  personal: BUCKET_LIST[3],
};

export const HOME_QUICK_AMOUNTS = [8000, 9000, 10000, 11000] as const;
export const OFFICE_FOOD_QUICK_AMOUNTS = [50, 80, 100] as const;
export const GOAL_QUICK_AMOUNTS = [15000, 20000, 30000] as const;

export const DEFAULT_AVATAR_URL =
  '/src/assets/images/avatar_bengali_user_1795716228624.jpg';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'মোহাম্মদ রাতুল',
  avatarUrl: DEFAULT_AVATAR_URL,
};

export const DEFAULT_SECURITY: SecuritySettings = {
  pinEnabled: false,
  pinCode: '',
  soundEnabled: true,
  privacyMasked: false,
};

export const DEFAULT_SETUP: IncomeSetupConfig = {
  basicSalary: 14000,
  offDaysCount: 4,
  offDayRate: 700,
  overtimeIncome: 2800,
  homeContribution: 9500,
  officeFoodBudget: 3000,
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
  setup: DEFAULT_SETUP,
  profile: DEFAULT_PROFILE,
  security: DEFAULT_SECURITY,
  savingsGoal: DEFAULT_SAVINGS_GOAL,
  buckets: EMPTY_BUCKETS,
  transactions: [],
  loans: [],
};

export function createInitialSeedState(todayISO: string): BudgetAppState {
  return {
    setup: DEFAULT_SETUP,
    profile: DEFAULT_PROFILE,
    security: DEFAULT_SECURITY,
    savingsGoal: DEFAULT_SAVINGS_GOAL,
    buckets: {
      home: {allocated: 9500, spent: 0},
      officeFood: {allocated: 3000, spent: 0},
      savings: {allocated: 2580, spent: 0},
      personal: {allocated: 1720, spent: 0},
    },
    transactions: [
      {
        id: 'seed-salary-current',
        type: 'salary',
        date: todayISO,
        createdAt: new Date().toISOString(),
        bucketId: 'home',
        note: 'মাসিক আয় বণ্টন (বেসিক ১৪,০০০ + অফ-ডে ২,৮০০)',
        amount: 16800,
        salaryBreakdown: {
          home: 9500,
          officeFood: 3000,
          savings: 2580,
          personal: 1720,
        },
      },
    ],
    loans: [],
  };
}

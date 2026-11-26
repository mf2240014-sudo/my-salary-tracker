import {
  BUCKET_BY_ID,
  BudgetAppState,
  createInitialSeedState,
  DEFAULT_PROFILE,
  DEFAULT_SECURITY,
  DEFAULT_SETUP,
  EMPTY_APP_STATE,
  TransactionRecord,
} from '../types/budget';

const STORAGE_KEY = 'bn_orbital_wealth_vault_v2';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

export function formatNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(safe);
  return toBengaliDigits(formatted);
}

export function formatBDT(amount: number, masked = false): string {
  if (masked) {
    return '৳ •••••';
  }
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(safe));
  const bnFormatted = toBengaliDigits(formatted);
  return safe < 0 ? `-৳ ${bnFormatted}` : `৳ ${bnFormatted}`;
}

export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatBengaliDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (Number.isNaN(dateObj.getTime())) return isoDate;

  try {
    return new Intl.DateTimeFormat('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return isoDate;
  }
}

export function formatBengaliMonth(yearMonth: string): string {
  const parts = yearMonth.split('-');
  if (parts.length !== 2) return yearMonth;
  const [y, m] = parts.map(Number);
  const dateObj = new Date(y, m - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return yearMonth;

  try {
    return new Intl.DateTimeFormat('bn-BD', {
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return yearMonth;
  }
}

function normalizeBudgetState(parsed: Partial<BudgetAppState>): BudgetAppState {
  const mergedSetup = {
    ...DEFAULT_SETUP,
    ...(parsed.setup ?? {}),
  };

  if (
    typeof parsed.setup?.offDaysCount === 'number' &&
    typeof parsed.setup?.offDayRate === 'number'
  ) {
    mergedSetup.overtimeIncome =
      Math.max(0, parsed.setup.offDaysCount) * Math.max(0, parsed.setup.offDayRate);
  }

  const rawPin = typeof parsed.security?.pinCode === 'string' ? parsed.security.pinCode : '';
  const validPin = /^\d{4}$/.test(rawPin) ? rawPin : '';

  return {
    setup: mergedSetup,
    profile: {
      name:
        typeof parsed.profile?.name === 'string' && parsed.profile.name.trim()
          ? parsed.profile.name
          : DEFAULT_PROFILE.name,
      avatarUrl:
        typeof parsed.profile?.avatarUrl === 'string' && parsed.profile.avatarUrl
          ? parsed.profile.avatarUrl
          : DEFAULT_PROFILE.avatarUrl,
    },
    security: {
      pinEnabled: Boolean(parsed.security?.pinEnabled && validPin),
      pinCode: validPin,
      soundEnabled:
        typeof parsed.security?.soundEnabled === 'boolean'
          ? parsed.security.soundEnabled
          : DEFAULT_SECURITY.soundEnabled,
      privacyMasked: Boolean(parsed.security?.privacyMasked),
    },
    savingsGoal:
      typeof parsed.savingsGoal === 'number' &&
      Number.isFinite(parsed.savingsGoal) &&
      parsed.savingsGoal >= 0
        ? parsed.savingsGoal
        : EMPTY_APP_STATE.savingsGoal,
    buckets: {
      home: {
        allocated: Number(parsed.buckets?.home?.allocated) || 0,
        spent: Number(parsed.buckets?.home?.spent) || 0,
      },
      officeFood: {
        allocated: Number(parsed.buckets?.officeFood?.allocated) || 0,
        spent: Number(parsed.buckets?.officeFood?.spent) || 0,
      },
      savings: {
        allocated: Number(parsed.buckets?.savings?.allocated) || 0,
        spent: Number(parsed.buckets?.savings?.spent) || 0,
      },
      personal: {
        allocated: Number(parsed.buckets?.personal?.allocated) || 0,
        spent: Number(parsed.buckets?.personal?.spent) || 0,
      },
    },
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    loans: Array.isArray(parsed.loans) ? parsed.loans : [],
  };
}

export function loadBudgetState(): BudgetAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialSeedState(getTodayISODate());
    }
    const parsed = JSON.parse(raw) as Partial<BudgetAppState>;
    return normalizeBudgetState(parsed);
  } catch {
    return createInitialSeedState(getTodayISODate());
  }
}

export function saveBudgetState(state: BudgetAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function clearBudgetState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_APP_STATE));
  } catch {
    // Ignore storage errors gracefully
  }
}

export function exportBackupJSON(state: BudgetAppState): void {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `orbital-wealth-vault-backup-${getTodayISODate()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupJSON(rawText: string): BudgetAppState | null {
  try {
    const parsed = JSON.parse(rawText) as {data?: Partial<BudgetAppState>} & Partial<BudgetAppState>;
    const candidate = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!candidate || typeof candidate !== 'object' || !candidate.buckets) {
      return null;
    }
    const validBucketKeys = ['home', 'officeFood', 'savings', 'personal'] as const;
    for (const key of validBucketKeys) {
      if (!candidate.buckets[key] || typeof candidate.buckets[key] !== 'object') {
        return null;
      }
    }
    return normalizeBudgetState(candidate);
  } catch {
    return null;
  }
}

function escapeCSVField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportTransactionsToCSV(transactions: TransactionRecord[]): void {
  const headers = ['তারিখ', 'ধরন', 'ভল্ট', 'বিবরণ / নোট', 'পরিমাণ (টাকা)'];

  const rows = transactions.map((tx) => {
    let typeLabel = 'খরচ';
    let bucketLabel = `${BUCKET_BY_ID[tx.bucketId].orderLabel} ${BUCKET_BY_ID[tx.bucketId].name}`;

    if (tx.type === 'transfer' && tx.toBucketId) {
      typeLabel = 'সমন্বয়';
      bucketLabel = `${BUCKET_BY_ID[tx.bucketId].name} → ${BUCKET_BY_ID[tx.toBucketId].name}`;
    } else if (tx.type === 'salary') {
      typeLabel = 'মাসিক আয়';
      bucketLabel = 'সকল ভল্ট';
    }

    return [
      escapeCSVField(tx.date),
      escapeCSVField(typeLabel),
      escapeCSVField(bucketLabel),
      escapeCSVField(tx.note),
      escapeCSVField(String(tx.amount)),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSVField).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `orbital-wealth-vault-history-${getTodayISODate()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

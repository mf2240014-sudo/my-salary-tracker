import {onAuthStateChanged, User as FirebaseUser} from 'firebase/auth';
import {
  Bell,
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  Menu,
  Sparkles,
  Upload,
  User,
  UserPlus,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {AISmartReportModal} from './components/AISmartReportModal';
import {CloudAuthScreen} from './components/CloudAuthScreen';
import {FullTransactionsView} from './components/FullTransactionsView';
import {IncomeSetupModal} from './components/IncomeSetupModal';
import {LiquidSavingsTank} from './components/LiquidSavingsTank';
import {LoansSummaryWidget, LoansView} from './components/LoansView';
import {OrbitalSalaryFlow} from './components/OrbitalSalaryFlow';
import {PinLockScreen} from './components/PinLockScreen';
import {ProfileModal} from './components/ProfileModal';
import {PublicFooter} from './components/PublicFooter';
import {QuickExpensePanel} from './components/QuickExpensePanel';
import {RecentTransactionsPanel} from './components/RecentTransactionsPanel';
import {ResetModal} from './components/ResetModal';
import {SettingsView} from './components/SettingsView';
import {NavSection, Sidebar} from './components/Sidebar';
import {VaultEditModal} from './components/VaultEditModal';
import {
  OnboardingPayload,
  WelcomeOnboardingModal,
} from './components/WelcomeOnboardingModal';
import {
  auth,
  fetchUserBudgetState,
  logoutFirebaseUser,
  saveUserBudgetState,
  subscribeUserBudgetState,
} from './firebase';
import {useOnlineStatus, usePWAInstall} from './hooks/usePWAInstall';
import {
  BUCKET_LIST,
  BucketId,
  BudgetAppState,
  CustomVaultConfig,
  EMPTY_APP_STATE,
  IncomeSetupConfig,
  LoanRecord,
  LoanType,
  SecuritySettings,
  TransactionRecord,
  UserProfile,
} from './types/budget';
import {playCoinChime, playSoftClick} from './utils/feedback';
import {
  exportBackupJSON,
  exportTransactionsToCSV,
  formatBDT,
  formatNumber,
  getTodayISODate,
  loadGuestBudgetState,
  normalizeBudgetState,
  parseBackupJSON,
  saveGuestBudgetState,
} from './utils/format';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCloudCacheKey(uid: string): string {
  return `bn_orbital_cloud_cache_${uid}`;
}

function loadCloudCache(uid: string): BudgetAppState | null {
  try {
    const raw = localStorage.getItem(getCloudCacheKey(uid));
    if (!raw) return null;
    return normalizeBudgetState(JSON.parse(raw) as Partial<BudgetAppState>);
  } catch {
    return null;
  }
}

function saveCloudCache(uid: string, state: BudgetAppState): void {
  try {
    localStorage.setItem(getCloudCacheKey(uid), JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [state, setState] = useState<BudgetAppState>(EMPTY_APP_STATE);

  const cloudReadyRef = useRef(false);
  const lastSyncedJsonRef = useRef('');

  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<NavSection>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isAIReportOpen, setIsAIReportOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
  const [editingVaultId, setEditingVaultId] = useState<BucketId | null>(null);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [selectedExpenseBucket, setSelectedExpenseBucket] = useState<BucketId>('officeFood');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const isOnline = useOnlineStatus();

  const expenseAmountRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);
  const backupContainerRef = useRef<HTMLDivElement | null>(null);
  const headerJsonInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let isCancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      cloudReadyRef.current = false;
      lastSyncedJsonRef.current = '';
      setFirebaseUser(user);

      if (!user) {
        setCloudLoading(false);
        setAuthLoading(false);
        return;
      }

      setIsGuestMode(false);
      setAuthLoading(false);
      setCloudLoading(true);
      setActiveView('dashboard');

      const defaultNewUserState: BudgetAppState = {
        ...EMPTY_APP_STATE,
        onboardingCompleted: false,
        profile: {
          name:
            user.displayName?.trim() ||
            user.email?.split('@')[0] ||
            'ব্যবহারকারী',
          avatarUrl: user.photoURL || '',
        },
      };

      try {
        const remoteState = await fetchUserBudgetState(user.uid);
        if (isCancelled) return;

        const resolvedState = remoteState ?? defaultNewUserState;
        lastSyncedJsonRef.current = JSON.stringify(resolvedState);
        if (remoteState) {
          saveCloudCache(user.uid, resolvedState);
        }
        cloudReadyRef.current = true;
        setState(resolvedState);
        setIsUnlocked(
          !(
            resolvedState.security.pinEnabled &&
            resolvedState.security.pinCode.length === 4
          )
        );
      } catch {
        if (isCancelled) return;
        const cached = loadCloudCache(user.uid);
        const fallbackState = cached ?? defaultNewUserState;
        lastSyncedJsonRef.current = JSON.stringify(fallbackState);
        cloudReadyRef.current = true;
        setState(fallbackState);
        setIsUnlocked(
          !(
            fallbackState.security.pinEnabled &&
            fallbackState.security.pinCode.length === 4
          )
        );
      } finally {
        if (!isCancelled) {
          setCloudLoading(false);
        }
      }

      if (isCancelled) return;

      unsubscribeSnapshot = subscribeUserBudgetState(
        user.uid,
        (remoteState, isLocalPending) => {
          if (isCancelled || isLocalPending || !remoteState) return;
          const remoteJson = JSON.stringify(remoteState);
          if (remoteJson === lastSyncedJsonRef.current) return;
          lastSyncedJsonRef.current = remoteJson;
          saveCloudCache(user.uid, remoteState);
          setState(remoteState);
        }
      );
    });

    return () => {
      isCancelled = true;
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  useEffect(() => {
    if (isGuestMode && !firebaseUser) {
      saveGuestBudgetState(state);
      return;
    }

    if (firebaseUser && cloudReadyRef.current) {
      const nextJson = JSON.stringify(state);
      if (nextJson === lastSyncedJsonRef.current) return;
      lastSyncedJsonRef.current = nextJson;
      saveCloudCache(firebaseUser.uid, state);
      void saveUserBudgetState(firebaseUser.uid, state, {
        email: firebaseUser.email,
        displayName: state.profile.name || firebaseUser.displayName,
      }).catch(() => {
        // Transient offline/network error; cached locally for next sync
      });
    }
  }, [state, firebaseUser, isGuestMode]);

  useEffect(() => {
    setAvatarImgError(false);
  }, [state.profile.avatarUrl]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen && !isBackupMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationsOpen &&
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        isBackupMenuOpen &&
        backupContainerRef.current &&
        !backupContainerRef.current.contains(event.target as Node)
      ) {
        setIsBackupMenuOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsBackupMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isNotificationsOpen, isBackupMenuOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const totals = useMemo(() => {
    let totalAllocated = 0;
    let totalSpent = 0;
    let hasNegativeVault = false;
    for (const meta of BUCKET_LIST) {
      const b = state.buckets[meta.id];
      totalAllocated += b.allocated;
      totalSpent += b.spent;
      if (b.allocated - b.spent < 0) {
        hasNegativeVault = true;
      }
    }
    const spentPct =
      totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    return {
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      hasNegativeVault,
      spentPct,
    };
  }, [state.buckets]);

  const paceStatus = useMemo(() => {
    if (totals.hasNegativeVault) {
      return {
        text: '⚠ সতর্কতা: কোনো ভল্টে ব্যালেন্সের চেয়ে বেশি খরচ হয়েছে',
        classes:
          'bg-rose-500/15 text-rose-300 border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      };
    }
    if (totals.totalAllocated > 0 && totals.spentPct >= 80) {
      return {
        text: `⚡ সতর্ক গতি: মোট বাজেটের ${formatNumber(totals.spentPct)}% খরচ হয়েছে`,
        classes:
          'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      };
    }
    if (totals.totalAllocated === 0) {
      return {
        text: '✔ ভল্ট প্রস্তুত: নতুন মাসের আয় সেটআপ করুন',
        classes:
          'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      };
    }
    return {
      text: '✔ নিরাপদ গতি: ৪টি ভল্ট সুরক্ষিত আছে',
      classes:
        'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    };
  }, [totals]);

  const smartAlerts = useMemo(() => {
    const calculatedOvertime =
      Math.max(0, state.setup.offDaysCount) * Math.max(0, state.setup.offDayRate);
    const mainSavings = state.buckets.savings.allocated - state.buckets.savings.spent;
    const goalPct =
      state.savingsGoal > 0
        ? Math.min(100, Math.round((Math.max(0, mainSavings) / state.savingsGoal) * 100))
        : 0;
    const masked = state.security.privacyMasked;

    const alerts: string[] = [];
    if (totals.hasNegativeVault) {
      alerts.push('⚠ একটি ভল্টে বরাদ্দের চেয়ে বেশি খরচ হয়েছে — ব্যালেন্স সমন্বয় করুন।');
    } else {
      alerts.push('🔔 ৪টি ভল্টই নিরাপদ সীমার মধ্যে আছে');
    }
    if (calculatedOvertime > 0) {
      alerts.push(
        `💡 এই মাসে অফ-ডে আয় থেকে ${formatBDT(calculatedOvertime, masked)} যুক্ত হয়েছে`
      );
    }
    alerts.push(
      `🎯 সঞ্চয় লক্ষ্যমাত্রার ${formatNumber(goalPct)}% (${formatBDT(mainSavings, masked)}) পূর্ণ হয়েছে`
    );
    return alerts;
  }, [
    state.setup,
    state.buckets.savings,
    state.savingsGoal,
    state.security.privacyMasked,
    totals.hasNegativeVault,
  ]);

  const handleUpdateSecurity = (
    next: Partial<SecuritySettings>,
    toastMsg?: string
  ) => {
    setState((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        ...next,
      },
    }));
    if (toastMsg) {
      showToast(toastMsg);
    }
  };

  const handleTogglePrivacyMask = () => {
    const nextMasked = !state.security.privacyMasked;
    playSoftClick(state.security.soundEnabled);
    handleUpdateSecurity(
      {privacyMasked: nextMasked},
      nextMasked ? 'প্রাইভেসি মোড চালু: টাকার পরিমাণ লুকানো হয়েছে।' : 'টাকার পরিমাণ দৃশ্যমান করা হয়েছে।'
    );
  };

  const handleToggleSound = () => {
    const nextSound = !state.security.soundEnabled;
    handleUpdateSecurity(
      {soundEnabled: nextSound},
      nextSound ? 'সাউন্ড ইফেক্ট চালু করা হয়েছে।' : 'সাউন্ড ইফেক্ট মিউট করা হয়েছে।'
    );
    if (nextSound) {
      playSoftClick(true);
    }
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      playSoftClick(state.security.soundEnabled);
      const accepted = await install();
      if (accepted) {
        playCoinChime(state.security.soundEnabled);
        showToast('অরবিটাল ওয়েলথ ভল্ট অ্যাপটি সফলভাবে ইনস্টল হয়েছে!');
      }
      return;
    }
    if (isIOS && !isInstalled) {
      setShowIOSInstallModal(true);
    }
  };

  const handleSetupChange = (nextSetup: IncomeSetupConfig) => {
    setState((prev) => ({
      ...prev,
      setup: nextSetup,
    }));
  };

  const handleSavingsGoalChange = (nextGoal: number) => {
    setState((prev) => ({
      ...prev,
      savingsGoal: nextGoal,
    }));
  };

  const handleSaveProfile = (nextProfile: UserProfile) => {
    playSoftClick(state.security.soundEnabled);
    setState((prev) => ({
      ...prev,
      profile: nextProfile,
    }));
    showToast('প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে।');
  };

  const handleUpdateCurrentMonthSalary = (
    breakdown: Record<BucketId, number>,
    totalIncome: number
  ) => {
    const calculatedOvertime =
      Math.max(0, state.setup.offDaysCount) * Math.max(0, state.setup.offDayRate);
    const noteText = `মাসিক আয় বণ্টন (বেসিক ${formatNumber(state.setup.basicSalary)} + অফ-ডে ${formatNumber(calculatedOvertime)})`;

    setState((prev) => {
      const latestSalaryIndex = prev.transactions.findIndex((t) => t.type === 'salary');
      let updatedTransactions = [...prev.transactions];

      if (latestSalaryIndex !== -1) {
        const prevTx = prev.transactions[latestSalaryIndex];
        updatedTransactions[latestSalaryIndex] = {
          ...prevTx,
          date: getTodayISODate(),
          note: noteText,
          amount: totalIncome,
          salaryBreakdown: breakdown,
        };
      } else {
        updatedTransactions = [
          {
            id: generateId(),
            type: 'salary',
            date: getTodayISODate(),
            createdAt: new Date().toISOString(),
            bucketId: 'home',
            note: noteText,
            amount: totalIncome,
            salaryBreakdown: breakdown,
          },
          ...prev.transactions,
        ];
      }

      return {
        ...prev,
        buckets: {
          home: {...prev.buckets.home, allocated: breakdown.home},
          officeFood: {...prev.buckets.officeFood, allocated: breakdown.officeFood},
          savings: {...prev.buckets.savings, allocated: breakdown.savings},
          personal: {...prev.buckets.personal, allocated: breakdown.personal},
        },
        transactions: updatedTransactions,
      };
    });

    playCoinChime(state.security.soundEnabled);
    showToast(
      `বর্তমান মাসের হিসাব ${formatBDT(totalIncome, state.security.privacyMasked)} অনুযায়ী আপডেট করা হয়েছে।`
    );
  };

  const handleAddNewMonthSalary = (
    breakdown: Record<BucketId, number>,
    totalIncome: number
  ) => {
    const calculatedOvertime =
      Math.max(0, state.setup.offDaysCount) * Math.max(0, state.setup.offDayRate);
    const newRecord: TransactionRecord = {
      id: generateId(),
      type: 'salary',
      date: getTodayISODate(),
      createdAt: new Date().toISOString(),
      bucketId: 'home',
      note: `নতুন মাসের আয় (বেসিক ${formatNumber(state.setup.basicSalary)} + অফ-ডে ${formatNumber(calculatedOvertime)})`,
      amount: totalIncome,
      salaryBreakdown: breakdown,
    };

    setState((prev) => ({
      ...prev,
      buckets: {
        home: {
          ...prev.buckets.home,
          allocated: prev.buckets.home.allocated + breakdown.home,
        },
        officeFood: {
          ...prev.buckets.officeFood,
          allocated: prev.buckets.officeFood.allocated + breakdown.officeFood,
        },
        savings: {
          ...prev.buckets.savings,
          allocated: prev.buckets.savings.allocated + breakdown.savings,
        },
        personal: {
          ...prev.buckets.personal,
          allocated: prev.buckets.personal.allocated + breakdown.personal,
        },
      },
      transactions: [newRecord, ...prev.transactions],
    }));

    playCoinChime(state.security.soundEnabled);
    showToast(
      `নতুন মাসের ${formatBDT(totalIncome, state.security.privacyMasked)} ৪টি ভল্টে যোগ করা হয়েছে।`
    );
  };

  const handleAddExpense = (payload: {
    bucketId: BucketId;
    note: string;
    amount: number;
    date: string;
  }) => {
    const newRecord: TransactionRecord = {
      id: generateId(),
      type: 'expense',
      date: payload.date,
      createdAt: new Date().toISOString(),
      bucketId: payload.bucketId,
      note: payload.note,
      amount: payload.amount,
    };

    setState((prev) => ({
      ...prev,
      buckets: {
        ...prev.buckets,
        [payload.bucketId]: {
          ...prev.buckets[payload.bucketId],
          spent: prev.buckets[payload.bucketId].spent + payload.amount,
        },
      },
      transactions: [newRecord, ...prev.transactions],
    }));

    playSoftClick(state.security.soundEnabled);
    showToast(
      `${state.vaultConfig[payload.bucketId].name} থেকে ${formatBDT(payload.amount, state.security.privacyMasked)} বিয়োগ হয়েছে।`
    );
  };

  const handleQuickVaultExpense = (bucketId: BucketId, amount: number) => {
    handleAddExpense({
      bucketId,
      note: `${state.vaultConfig[bucketId].shortName} (${formatBDT(amount)})`,
      amount,
      date: getTodayISODate(),
    });
  };

  const handleSaveVaultConfig = (
    bucketId: BucketId,
    nextConfig: CustomVaultConfig
  ) => {
    setState((prev) => ({
      ...prev,
      vaultConfig: {
        ...prev.vaultConfig,
        [bucketId]: nextConfig,
      },
    }));
    playSoftClick(state.security.soundEnabled);
    showToast(`"${nextConfig.name}" ভল্টের সেটিংস সেভ করা হয়েছে।`);
  };

  const handleCompleteOnboarding = (payload: OnboardingPayload) => {
    const today = getTodayISODate();
    const extraIncome = payload.setup.overtimeIncome;
    const initialSalaryTx: TransactionRecord = {
      id: generateId(),
      type: 'salary',
      date: today,
      createdAt: new Date().toISOString(),
      bucketId: 'home',
      note: `প্রাথমিক মাসিক আয় (বেসিক ${formatNumber(payload.setup.basicSalary)}${extraIncome > 0 ? ` + অতিরিক্ত ${formatNumber(extraIncome)}` : ''})`,
      amount: payload.totalIncome,
      salaryBreakdown: payload.breakdown,
    };

    setState((prev) => ({
      ...prev,
      onboardingCompleted: true,
      profile: payload.profile,
      setup: payload.setup,
      vaultConfig: payload.vaultConfig,
      savingsGoal: payload.savingsGoal,
      buckets: {
        home: {allocated: payload.breakdown.home, spent: 0},
        officeFood: {allocated: payload.breakdown.officeFood, spent: 0},
        savings: {allocated: payload.breakdown.savings, spent: 0},
        personal: {allocated: payload.breakdown.personal, spent: 0},
      },
      transactions: [initialSalaryTx],
    }));

    playCoinChime(state.security.soundEnabled);
    showToast(
      `স্বাগতম ${payload.profile.name}! আপনার ৪টি কাস্টম ভল্ট তৈরি হয়েছে।`
    );
  };

  const handleTransfer = (payload: {
    fromBucketId: BucketId;
    toBucketId: BucketId;
    amount: number;
    note: string;
    date: string;
  }) => {
    const newRecord: TransactionRecord = {
      id: generateId(),
      type: 'transfer',
      date: payload.date,
      createdAt: new Date().toISOString(),
      bucketId: payload.fromBucketId,
      toBucketId: payload.toBucketId,
      note: payload.note,
      amount: payload.amount,
    };

    setState((prev) => ({
      ...prev,
      buckets: {
        ...prev.buckets,
        [payload.fromBucketId]: {
          ...prev.buckets[payload.fromBucketId],
          allocated: prev.buckets[payload.fromBucketId].allocated - payload.amount,
        },
        [payload.toBucketId]: {
          ...prev.buckets[payload.toBucketId],
          allocated: prev.buckets[payload.toBucketId].allocated + payload.amount,
        },
      },
      transactions: [newRecord, ...prev.transactions],
    }));

    playSoftClick(state.security.soundEnabled);
    showToast(
      `${state.vaultConfig[payload.fromBucketId].shortName} থেকে ${state.vaultConfig[payload.toBucketId].shortName}-এ ${formatBDT(payload.amount, state.security.privacyMasked)} স্থানান্তর হয়েছে।`
    );
  };

  const handleTransferHomeAndSavings = (direction: 'toHome' | 'toSavings') => {
    const stepAmount = 1000;
    const fromId: BucketId = direction === 'toHome' ? 'savings' : 'home';
    const toId: BucketId = direction === 'toHome' ? 'home' : 'savings';

    const fromRemaining =
      state.buckets[fromId].allocated - state.buckets[fromId].spent;

    if (fromRemaining < stepAmount) {
      showToast(
        `"${state.vaultConfig[fromId].name}"-এ ${formatBDT(stepAmount, state.security.privacyMasked)} স্থানান্তরের জন্য পর্যাপ্ত ব্যালেন্স নেই।`
      );
      return;
    }

    handleTransfer({
      fromBucketId: fromId,
      toBucketId: toId,
      amount: stepAmount,
      note:
        direction === 'toHome'
          ? `${state.vaultConfig.savings.shortName} থেকে ${state.vaultConfig.home.shortName}-এ ১,০০০ টাকা`
          : `${state.vaultConfig.home.shortName} থেকে ${state.vaultConfig.savings.shortName}-এ ১,০০০ টাকা`,
      date: getTodayISODate(),
    });
  };

  const handleDeleteTransaction = (id: string) => {
    const target = state.transactions.find((t) => t.id === id);
    if (!target) return;

    setState((prev) => {
      const nextBuckets = {
        home: {...prev.buckets.home},
        officeFood: {...prev.buckets.officeFood},
        savings: {...prev.buckets.savings},
        personal: {...prev.buckets.personal},
      };

      if (target.type === 'expense') {
        nextBuckets[target.bucketId].spent = Math.max(
          0,
          nextBuckets[target.bucketId].spent - target.amount
        );
      } else if (target.type === 'transfer' && target.toBucketId) {
        nextBuckets[target.bucketId].allocated += target.amount;
        nextBuckets[target.toBucketId].allocated -= target.amount;
      } else if (target.type === 'salary' && target.salaryBreakdown) {
        for (const meta of BUCKET_LIST) {
          nextBuckets[meta.id].allocated = Math.max(
            0,
            nextBuckets[meta.id].allocated - (target.salaryBreakdown[meta.id] ?? 0)
          );
        }
      }

      return {
        ...prev,
        buckets: nextBuckets,
        transactions: prev.transactions.filter((t) => t.id !== id),
      };
    });

    playSoftClick(state.security.soundEnabled);
    if (target.type === 'expense') {
      showToast(
        `খরচ মুছে ফেলা হয়েছে এবং ${formatBDT(target.amount, state.security.privacyMasked)} "${state.vaultConfig[target.bucketId].name}"-এ ফেরত দেওয়া হয়েছে।`
      );
    } else if (target.type === 'transfer') {
      showToast('ভল্ট সমন্বয় বাতিল করে পূর্বের অবস্থায় ফেরত নেওয়া হয়েছে।');
    } else {
      showToast('আয়ের এন্ট্রিটি মুছে ফেলা হয়েছে।');
    }
  };

  const handleAddLoan = (payload: {
    type: LoanType;
    personName: string;
    amount: number;
    date: string;
    note: string;
  }) => {
    const newLoan: LoanRecord = {
      id: generateId(),
      type: payload.type,
      personName: payload.personName,
      amount: payload.amount,
      date: payload.date,
      note: payload.note,
      settled: false,
    };

    setState((prev) => ({
      ...prev,
      loans: [newLoan, ...prev.loans],
    }));

    playSoftClick(state.security.soundEnabled);
    showToast(
      `${payload.personName}-এর সাথে ${formatBDT(payload.amount, state.security.privacyMasked)} ${payload.type === 'receivable' ? 'পাওনা' : 'দেনা'} হিসাব যোগ হয়েছে।`
    );
  };

  const handleSettleLoan = (
    loanId: string,
    targetVaultId: 'savings' | 'personal' | 'none'
  ) => {
    const target = state.loans.find((l) => l.id === loanId);
    if (!target || target.settled) return;

    const today = getTodayISODate();

    setState((prev) => {
      const nextLoans = prev.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              settled: true,
              settledAt: today,
              settledVaultId:
                targetVaultId === 'none' ? undefined : targetVaultId,
            }
          : l
      );

      if (target.type === 'receivable' && targetVaultId !== 'none') {
        const creditTx: TransactionRecord = {
          id: generateId(),
          type: 'salary',
          date: today,
          createdAt: new Date().toISOString(),
          bucketId: targetVaultId,
          note: `পাওনা আদায় (${target.personName})`,
          amount: target.amount,
          salaryBreakdown: {
            home: 0,
            officeFood: 0,
            savings: targetVaultId === 'savings' ? target.amount : 0,
            personal: targetVaultId === 'personal' ? target.amount : 0,
          },
        };

        return {
          ...prev,
          loans: nextLoans,
          buckets: {
            ...prev.buckets,
            [targetVaultId]: {
              ...prev.buckets[targetVaultId],
              allocated: prev.buckets[targetVaultId].allocated + target.amount,
            },
          },
          transactions: [creditTx, ...prev.transactions],
        };
      }

      return {
        ...prev,
        loans: nextLoans,
      };
    });

    if (target.type === 'receivable' && targetVaultId !== 'none') {
      playCoinChime(state.security.soundEnabled);
      showToast(
        `${target.personName}-এর ${formatBDT(target.amount, state.security.privacyMasked)} "${state.vaultConfig[targetVaultId].name}"-এ যোগ করা হয়েছে!`
      );
    } else {
      playCoinChime(state.security.soundEnabled);
      showToast(`${target.personName}-এর হিসাবটি পরিশোধিত হিসেবে চিহ্নিত হয়েছে।`);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    setState((prev) => ({
      ...prev,
      loans: prev.loans.filter((l) => l.id !== loanId),
    }));
    playSoftClick(state.security.soundEnabled);
    showToast('ধার-দেনার এন্ট্রিটি মুছে ফেলা হয়েছে।');
  };

  const handleFocusDailyExpense = () => {
    setActiveView('dashboard');
    window.setTimeout(() => {
      const el = document.getElementById('daily-expense');
      el?.scrollIntoView({behavior: 'smooth', block: 'center'});
      expenseAmountRef.current?.focus();
    }, 100);
  };

  const handleConfirmReset = () => {
    setState((prev) => ({
      ...EMPTY_APP_STATE,
      onboardingCompleted: true,
      profile: prev.profile,
      vaultConfig: prev.vaultConfig,
      security: prev.security,
    }));
    setIsResetModalOpen(false);
    playSoftClick(state.security.soundEnabled);
    showToast('সব ভল্টের ব্যালেন্স ও তালিকা রিসেট করা হয়েছে।');
  };

  const handleEnterGuestMode = () => {
    const guestState = loadGuestBudgetState();
    setIsGuestMode(true);
    setState(guestState);
    setIsUnlocked(true);
    setActiveView('dashboard');
    playSoftClick(guestState.security.soundEnabled);
    showToast(
      'অতিথি ডেমো মোডে স্বাগতম! ক্লাউডে সেভ করতে চাইলে যেকোনো সময় লগইন করতে পারবেন।'
    );
  };

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    setIsMobileSidebarOpen(false);
    setIsBackupMenuOpen(false);
    setIsNotificationsOpen(false);

    if (firebaseUser) {
      cloudReadyRef.current = false;
      lastSyncedJsonRef.current = '';
      try {
        await logoutFirebaseUser();
        setState(EMPTY_APP_STATE);
        setIsUnlocked(true);
        playSoftClick(state.security.soundEnabled);
        showToast('সফলভাবে লগআউট করা হয়েছে।');
      } catch {
        showToast('লগআউট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
      return;
    }

    setIsGuestMode(false);
    setState(EMPTY_APP_STATE);
    setIsUnlocked(true);
    playSoftClick(state.security.soundEnabled);
  };

  const handleExportCSV = () => {
    if (state.transactions.length === 0) {
      showToast('ডাউনলোড করার মতো কোনো লেনদেন এখনো নেই।');
      return;
    }
    playSoftClick(state.security.soundEnabled);
    exportTransactionsToCSV(state.transactions, state.vaultConfig);
    showToast('CSV ফাইল ডাউনলোড শুরু হয়েছে।');
  };

  const handleExportJSON = () => {
    playSoftClick(state.security.soundEnabled);
    exportBackupJSON(state);
    setIsBackupMenuOpen(false);
    showToast('সম্পূর্ণ তথ্যের JSON ব্যাকআপ ডাউনলোড শুরু হয়েছে।');
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const imported = parseBackupJSON(content);
      if (!imported) {
        showToast('দুঃখিত, এটি সঠিক JSON ব্যাকআপ ফাইল নয়।');
        return;
      }
      setState(imported);
      setIsBackupMenuOpen(false);
      playCoinChime(imported.security.soundEnabled);
      showToast('ব্যাকআপ থেকে আপনার সকল ভল্ট ও হিসাব পুনরুদ্ধার হয়েছে।');
    };
    reader.onerror = () => {
      showToast('ফাইলটি পড়তে সমস্যা হয়েছে।');
    };
    reader.readAsText(file, 'utf-8');
  };

  if (authLoading || (firebaseUser && cloudLoading)) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="rounded-3xl bg-[#0b1324]/90 border border-emerald-400/25 px-8 py-7 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(16,185,129,0.16)] max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-300 animate-spin" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white leading-[1.4]">
              অরবিটাল ওয়েলথ ভল্ট
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5] flex items-center justify-center gap-1.5">
              <Cloud className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>ক্লাউড ডাটা লোড হচ্ছে...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser && !isGuestMode) {
    return (
      <>
        <CloudAuthScreen onEnterGuestMode={handleEnterGuestMode} />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#0d182e] border border-emerald-400/40 text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-2.5 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="leading-[1.5]">{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  if (state.security.pinEnabled && state.security.pinCode.length === 4 && !isUnlocked) {
    return (
      <PinLockScreen
        expectedPin={state.security.pinCode}
        userName={state.profile.name}
        onUnlock={() => {
          playCoinChime(state.security.soundEnabled);
          setIsUnlocked(true);
        }}
      />
    );
  }

  if (!state.onboardingCompleted) {
    return (
      <>
        <WelcomeOnboardingModal
          initialName={state.profile.name}
          initialAvatarUrl={state.profile.avatarUrl}
          onComplete={handleCompleteOnboarding}
          onImportJSON={handleImportJSON}
          onBackToAuth={handleLogout}
        />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#0d182e] border border-emerald-400/40 text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-2.5 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="leading-[1.5]">{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const mainSavingsBalance =
    state.buckets.savings.allocated - state.buckets.savings.spent;
  const canInstallPWA = isInstallable || (isIOS && !isInstalled);
  const privacyMasked = state.security.privacyMasked;

  return (
    <div className="min-h-screen flex bg-[#070b14] text-slate-100 relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute bottom-0 left-10 w-[420px] h-[420px] rounded-full bg-violet-500/8 blur-[140px]" />
      </div>

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectView={(v) => {
          playSoftClick(state.security.soundEnabled);
          setActiveView(v);
        }}
        onOpenIncomeSetup={() => setIsIncomeModalOpen(true)}
        onFocusDailyExpense={handleFocusDailyExpense}
        onOpenAIReport={() => {
          playSoftClick(state.security.soundEnabled);
          setIsAIReportOpen(true);
        }}
        onLogout={handleLogout}
        isGuest={!firebaseUser}
        accountDisplayName={state.profile.name}
        canInstallPWA={canInstallPWA}
        onInstallPWA={handleInstallPWA}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#070b14]/85 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
            {/* Mobile Hamburger */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="নেভিগেশন মেনু খুলুন"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white cursor-pointer"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Centered Glowing Status Pill Badge */}
            <div className="flex-1 flex justify-start lg:justify-center min-w-0">
              <div
                className={`inline-flex items-center px-3 sm:px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold leading-[1.5] truncate max-w-full ${paceStatus.classes}`}
              >
                <span className="truncate">{paceStatus.text}</span>
              </div>
            </div>

            {/* Top-Right Header Action Cluster */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* AI Smart Report Button */}
              <button
                type="button"
                onClick={() => {
                  playSoftClick(state.security.soundEnabled);
                  setIsAIReportOpen(true);
                }}
                aria-label="এআই স্মার্ট রিপোর্ট দেখুন"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-cyan-200 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-cyan-400/40 rounded-xl shadow-[0_0_16px_rgba(6,182,212,0.2)] transition-all whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">✨ এআই স্মার্ট রিপোর্ট</span>
                <span className="md:hidden hidden sm:inline">রিপোর্ট</span>
              </button>

              {/* PWA Install Button (when installable) */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  aria-label="অ্যাপ ইনস্টল করুন"
                  className="hidden xl:inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                >
                  <span>📲 অ্যাপ ইনস্টল</span>
                </button>
              )}

              {/* Header JSON Backup / Restore Dropdown */}
              <div ref={backupContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBackupMenuOpen((prev) => !prev)}
                  aria-label="JSON ব্যাকআপ ও রিস্টোর"
                  aria-expanded={isBackupMenuOpen}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-100 bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">ব্যাকআপ</span>
                </button>

                {isBackupMenuOpen && (
                  <div
                    role="menu"
                    aria-label="ডাটা ব্যাকআপ ও রিস্টোর মেনু"
                    className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-[#0b1324]/95 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.65)] p-2 z-50 space-y-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportJSON}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                    >
                      <FileJson className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>JSON ব্যাকআপ সেভ করুন</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => headerJsonInputRef.current?.click()}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/15 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>ব্যাকআপ রিস্টোর (.json)</span>
                    </button>
                  </div>
                )}
                <input
                  ref={headerJsonInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportJSON(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                  aria-label="JSON ব্যাকআপ ফাইল নির্বাচন করুন"
                />
              </div>

              {/* CSV Download */}
              <button
                type="button"
                onClick={handleExportCSV}
                aria-label="CSV ডাউনলোড"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_18px_rgba(16,185,129,0.3)] transition-all whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">CSV ডাউনলোড</span>
              </button>

              {/* Sound Mute / Unmute Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={
                  state.security.soundEnabled
                    ? 'সাউন্ড ইফেক্ট মিউট করুন'
                    : 'সাউন্ড ইফেক্ট চালু করুন'
                }
                title={
                  state.security.soundEnabled
                    ? 'সাউন্ড চালু আছে (মিউট করতে ক্লিক করুন)'
                    : 'সাউন্ড মিউট আছে (চালু করতে ক্লিক করুন)'
                }
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  state.security.soundEnabled
                    ? 'bg-slate-900/80 border-white/15 hover:border-emerald-400/50 text-emerald-300'
                    : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {state.security.soundEnabled ? (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {/* Privacy Eye Toggle Button */}
              <button
                type="button"
                onClick={handleTogglePrivacyMask}
                aria-label={
                  privacyMasked ? 'টাকার পরিমাণ দেখান' : 'টাকার পরিমাণ লুকান'
                }
                title={
                  privacyMasked ? 'প্রাইভেসি মোড চালু আছে' : 'প্রাইভেসি মোড চালু করুন'
                }
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  privacyMasked
                    ? 'bg-violet-500/20 border-violet-400/50 text-violet-200 shadow-[0_0_14px_rgba(139,92,246,0.35)]'
                    : 'bg-slate-900/80 border-white/15 hover:border-emerald-400/50 text-slate-200 hover:text-white'
                }`}
              >
                {privacyMasked ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {/* Notification Bell Button + Popover */}
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  aria-label="বাজেট নোটিফিকেশন দেখুন"
                  aria-expanded={isNotificationsOpen}
                  className="relative w-10 h-10 rounded-full bg-slate-900/80 border border-white/15 hover:border-emerald-400/50 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#070b14] shadow-[0_0_10px_rgba(244,63,94,0.85)]"
                    aria-hidden="true"
                  />
                </button>

                {isNotificationsOpen && (
                  <div
                    role="region"
                    aria-label="স্মার্ট বাজেট নোটিফিকেশন"
                    className="absolute right-0 mt-2.5 w-80 max-w-[90vw] rounded-2xl bg-[#0b1324]/95 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.65)] p-4 z-50"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                      <span className="text-sm font-bold text-white leading-[1.5]">
                        স্মার্ট বাজেট বার্তা
                      </span>
                      <span className="text-xs font-semibold text-emerald-300 font-num">
                        {formatNumber(smartAlerts.length)}টি আপডেট
                      </span>
                    </div>
                    <ul className="mt-2.5 space-y-2.5">
                      {smartAlerts.map((alert, idx) => (
                        <li
                          key={idx}
                          className="text-xs font-medium text-slate-200 leading-[1.55] bg-white/5 border border-white/8 rounded-xl px-3 py-2.5"
                        >
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* User Profile Avatar Circle */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title={`${state.profile.name} — প্রোফাইল ও ছবি সেটিংস`}
                aria-label={`${state.profile.name} প্রোফাইল`}
                className="w-10 h-10 rounded-full overflow-hidden border border-emerald-400/40 hover:border-emerald-300 bg-slate-900/80 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.2)] transition-all cursor-pointer shrink-0"
              >
                {!avatarImgError && state.profile.avatarUrl ? (
                  <img
                    src={state.profile.avatarUrl}
                    alt={state.profile.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {!isOnline && (
            <div className="bg-amber-500/15 border-t border-amber-400/30 px-4 py-1.5 text-center text-xs font-semibold text-amber-200 flex items-center justify-center gap-2">
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
              <span>অফলাইন মোড চালু — আপনার সকল হিসাব ডিভাইসে নিরাপদে সংরক্ষিত আছে</span>
            </div>
          )}

          {!firebaseUser && isGuestMode && (
            <div className="bg-cyan-500/12 border-t border-cyan-400/25 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-cyan-100">
              <span>
                অতিথি / ডেমো মোডে আছেন — যেকোনো ডিভাইস থেকে ক্লাউড সিঙ্ক পেতে লগইন করুন
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#041210] font-bold hover:from-emerald-300 hover:to-cyan-300 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ক্লাউড অ্যাকাউন্টে লগইন করুন</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {activeView === 'dashboard' && (
            <>
              {/* Centerpiece: Orbital Salary Flow Architecture */}
              <OrbitalSalaryFlow
                setup={state.setup}
                buckets={state.buckets}
                vaultConfig={state.vaultConfig}
                totalAllocated={totals.totalAllocated}
                privacyMasked={privacyMasked}
                onOpenIncomeSetup={() => setIsIncomeModalOpen(true)}
                onEditVault={(id) => setEditingVaultId(id)}
                onTransferHomeAndSavings={handleTransferHomeAndSavings}
                onQuickVaultExpense={handleQuickVaultExpense}
              />

              {/* Bottom 3-Column Interactive Grid (Equal Height h-full Panels) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <LiquidSavingsTank
                  savingsGoal={state.savingsGoal}
                  currentSavings={mainSavingsBalance}
                  savingsVaultName={state.vaultConfig.savings.name}
                  privacyMasked={privacyMasked}
                  onChangeGoal={handleSavingsGoalChange}
                />

                <QuickExpensePanel
                  buckets={state.buckets}
                  vaultConfig={state.vaultConfig}
                  selectedBucket={selectedExpenseBucket}
                  privacyMasked={privacyMasked}
                  onSelectBucket={setSelectedExpenseBucket}
                  amountInputRef={expenseAmountRef}
                  onAddExpense={handleAddExpense}
                />

                <RecentTransactionsPanel
                  transactions={state.transactions}
                  vaultConfig={state.vaultConfig}
                  privacyMasked={privacyMasked}
                  onDeleteTransaction={handleDeleteTransaction}
                  onViewAllHistory={() => setActiveView('history')}
                />
              </div>

              {/* Compact Loan & Due Summary Widget */}
              <LoansSummaryWidget
                loans={state.loans}
                privacyMasked={privacyMasked}
                onOpenLoansView={() => setActiveView('loans')}
              />
            </>
          )}

          {activeView === 'loans' && (
            <LoansView
              loans={state.loans}
              vaultConfig={state.vaultConfig}
              privacyMasked={privacyMasked}
              onAddLoan={handleAddLoan}
              onSettleLoan={handleSettleLoan}
              onDeleteLoan={handleDeleteLoan}
            />
          )}

          {activeView === 'history' && (
            <FullTransactionsView
              transactions={state.transactions}
              vaultConfig={state.vaultConfig}
              privacyMasked={privacyMasked}
              onDeleteTransaction={handleDeleteTransaction}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              buckets={state.buckets}
              vaultConfig={state.vaultConfig}
              savingsGoal={state.savingsGoal}
              privacyMasked={privacyMasked}
              security={state.security}
              onChangeGoal={handleSavingsGoalChange}
              onUpdateSecurity={(next, msg) => {
                playSoftClick(state.security.soundEnabled);
                handleUpdateSecurity(next, msg);
              }}
              onLockNow={() => {
                playSoftClick(state.security.soundEnabled);
                setIsUnlocked(false);
              }}
              onReopenOnboarding={() => {
                playSoftClick(state.security.soundEnabled);
                setState((prev) => ({...prev, onboardingCompleted: false}));
              }}
              onTransfer={handleTransfer}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
              onRequestReset={() => setIsResetModalOpen(true)}
            />
          )}

          <PublicFooter />
        </main>
      </div>

      {/* Income Setup Modal */}
      <IncomeSetupModal
        isOpen={isIncomeModalOpen}
        setup={state.setup}
        vaultConfig={state.vaultConfig}
        onClose={() => setIsIncomeModalOpen(false)}
        onChangeSetup={handleSetupChange}
        onUpdateCurrentMonthSalary={handleUpdateCurrentMonthSalary}
        onAddNewMonthSalary={handleAddNewMonthSalary}
      />

      {/* Vault Edit Modal */}
      <VaultEditModal
        key={editingVaultId ?? 'closed'}
        isOpen={Boolean(editingVaultId)}
        bucketId={editingVaultId}
        vaultConfig={editingVaultId ? state.vaultConfig[editingVaultId] : null}
        onClose={() => setEditingVaultId(null)}
        onSave={handleSaveVaultConfig}
      />

      {/* AI Smart Monthly Report Modal */}
      <AISmartReportModal
        isOpen={isAIReportOpen}
        onClose={() => setIsAIReportOpen(false)}
        buckets={state.buckets}
        vaultConfig={state.vaultConfig}
        savingsGoal={state.savingsGoal}
        loans={state.loans}
        privacyMasked={privacyMasked}
      />

      {/* Profile Modal */}
      <ProfileModal
        key={`${firebaseUser?.uid ?? 'guest'}-${state.profile.name}-${isProfileModalOpen}`}
        isOpen={isProfileModalOpen}
        profile={state.profile}
        accountEmail={firebaseUser?.email ?? null}
        isGuest={!firebaseUser}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onCancel={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {/* iOS Safari Install Instructions Modal */}
      {showIOSInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#0b1324] border border-emerald-400/35 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <h3 id="ios-install-title" className="text-base font-bold text-white">
                📲 আইফোনে অ্যাপ ইনস্টল করুন
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSInstallModal(false)}
                aria-label="বন্ধ করুন"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 space-y-2.5 text-sm text-slate-200 leading-[1.6]">
              <li>১. Safari ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> আইকনে ট্যাপ করুন।</li>
              <li>২. তালিকা থেকে <strong>&ldquo;Add to Home Screen&rdquo;</strong> অপশনটি বেছে নিন।</li>
              <li>৩. ডান কোণায় <strong>Add</strong> চাপলেই অ্যাপটি হোম স্ক্রিনে যুক্ত হবে।</li>
            </ol>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#0d182e] border border-emerald-400/40 text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-2.5 text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="leading-[1.5]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

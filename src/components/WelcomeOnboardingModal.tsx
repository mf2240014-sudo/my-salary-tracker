import {Camera, Check, Rocket, Upload, User} from 'lucide-react';
import {useRef, useState} from 'react';
import {
  BucketId,
  DEFAULT_VAULT_CONFIG,
  deriveShortName,
  IncomeSetupConfig,
  UserProfile,
  VaultConfigMap,
} from '../types/budget';
import {
  compressProfileImage,
  formatBDT,
  formatNumber,
} from '../utils/format';

export interface OnboardingPayload {
  profile: UserProfile;
  setup: IncomeSetupConfig;
  vaultConfig: VaultConfigMap;
  breakdown: Record<BucketId, number>;
  totalIncome: number;
  savingsGoal: number;
}

interface WelcomeOnboardingModalProps {
  initialName?: string;
  initialAvatarUrl?: string;
  onComplete: (payload: OnboardingPayload) => void;
  onImportJSON: (file: File) => void;
  onBackToAuth?: () => void;
}

interface QuickTemplate {
  id: string;
  label: string;
  basicSalary: number;
  extraIncome: number;
  homeAmount: number;
  foodAmount: number;
  savingsPct: number;
  savingsGoal: number;
  names: Record<BucketId, string>;
  foodQuickAmounts: number[];
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'employee',
    label: '💼 চাকরিজীবী (১৪,০০০ + ২,৮০০ ৳)',
    basicSalary: 14000,
    extraIncome: 2800,
    homeAmount: 9500,
    foodAmount: 3000,
    savingsPct: 60,
    savingsGoal: 20000,
    names: {
      home: 'বাসায় দেওয়া / ভাড়া',
      officeFood: 'অফিস খাবার',
      savings: 'মূল সঞ্চয়',
      personal: 'নিজের হাতখরচ',
    },
    foodQuickAmounts: [50, 80, 100],
  },
  {
    id: 'corporate',
    label: '🏢 কর্পোরেট (৩০,০০০ ৳)',
    basicSalary: 30000,
    extraIncome: 0,
    homeAmount: 15000,
    foodAmount: 5000,
    savingsPct: 60,
    savingsGoal: 50000,
    names: {
      home: 'বাসা ভাড়া ও সংসার',
      officeFood: 'খাবার / বাজার',
      savings: 'মূল সঞ্চয়',
      personal: 'ব্যক্তিগত খরচ',
    },
    foodQuickAmounts: [100, 150, 250],
  },
  {
    id: 'student',
    label: '🎓 ছাত্র / পার্সোনাল (১০,০০০ ৳)',
    basicSalary: 10000,
    extraIncome: 0,
    homeAmount: 4500,
    foodAmount: 3000,
    savingsPct: 50,
    savingsGoal: 10000,
    names: {
      home: 'মেস / বাসা ভাড়া',
      officeFood: 'দৈনিক খাবার',
      savings: 'ভবিষ্যৎ সঞ্চয়',
      personal: 'পড়াশোনা ও হাতখরচ',
    },
    foodQuickAmounts: [40, 60, 100],
  },
];

export function WelcomeOnboardingModal({
  initialName = '',
  initialAvatarUrl = '',
  onComplete,
  onImportJSON,
  onBackToAuth,
}: WelcomeOnboardingModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [basicSalary, setBasicSalary] = useState('');
  const [extraIncome, setExtraIncome] = useState('');

  const [homeName, setHomeName] = useState(DEFAULT_VAULT_CONFIG.home.name);
  const [homeAmount, setHomeAmount] = useState('');

  const [foodName, setFoodName] = useState(DEFAULT_VAULT_CONFIG.officeFood.name);
  const [foodAmount, setFoodAmount] = useState('');
  const [foodQuickAmounts, setFoodQuickAmounts] = useState<number[]>(
    DEFAULT_VAULT_CONFIG.officeFood.quickAmounts
  );

  const [savingsName, setSavingsName] = useState(DEFAULT_VAULT_CONFIG.savings.name);
  const [personalName, setPersonalName] = useState(DEFAULT_VAULT_CONFIG.personal.name);
  const [savingsPct, setSavingsPct] = useState(60);
  const [savingsGoal, setSavingsGoal] = useState(20000);
  const [error, setError] = useState('');

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const numericBasic = Math.max(0, Math.round(Number(basicSalary) || 0));
  const numericExtra = Math.max(0, Math.round(Number(extraIncome) || 0));
  const totalIncome = numericBasic + numericExtra;

  const numericHome = Math.max(0, Math.round(Number(homeAmount) || 0));
  const numericFood = Math.max(0, Math.round(Number(foodAmount) || 0));
  const remainingAfterFixed = totalIncome - numericHome - numericFood;

  const positiveRemaining = Math.max(0, remainingAfterFixed);
  const savingsAmount = Math.round((positiveRemaining * savingsPct) / 100);
  const personalAmount = positiveRemaining - savingsAmount;
  const personalPct = 100 - savingsPct;

  const applyTemplate = (tpl: QuickTemplate) => {
    setSelectedTemplate(tpl.id);
    setBasicSalary(String(tpl.basicSalary));
    setExtraIncome(String(tpl.extraIncome));
    setHomeName(tpl.names.home);
    setHomeAmount(String(tpl.homeAmount));
    setFoodName(tpl.names.officeFood);
    setFoodAmount(String(tpl.foodAmount));
    setFoodQuickAmounts(tpl.foodQuickAmounts);
    setSavingsName(tpl.names.savings);
    setPersonalName(tpl.names.personal);
    setSavingsPct(tpl.savingsPct);
    setSavingsGoal(tpl.savingsGoal);
    setError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressedDataUrl = await compressProfileImage(file, 200, 0.7);
      setAvatarUrl(compressedDataUrl);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'প্রোফাইল ছবিটি আপলোড করা যায়নি।'
      );
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalIncome <= 0) {
      setError('দয়া করে আপনার মাসিক মূল বেতন বা আয় লিখুন (অথবা উপরের যেকোনো টেমপ্লেট বেছে নিন)।');
      return;
    }
    if (remainingAfterFixed < 0) {
      setError('প্রথম দুটি ভল্টের মোট বরাদ্দ আপনার মোট মাসিক আয়ের চেয়ে বেশি হয়ে গেছে।');
      return;
    }

    const finalHomeName = homeName.trim() || DEFAULT_VAULT_CONFIG.home.name;
    const finalFoodName = foodName.trim() || DEFAULT_VAULT_CONFIG.officeFood.name;
    const finalSavingsName = savingsName.trim() || DEFAULT_VAULT_CONFIG.savings.name;
    const finalPersonalName = personalName.trim() || DEFAULT_VAULT_CONFIG.personal.name;

    onComplete({
      profile: {
        name: name.trim() || 'আমার অ্যাকাউন্ট',
        avatarUrl,
      },
      setup: {
        basicSalary: numericBasic,
        offDaysCount: numericExtra > 0 ? 1 : 0,
        offDayRate: numericExtra,
        overtimeIncome: numericExtra,
        homeContribution: numericHome,
        officeFoodBudget: numericFood,
        savingsPercent: savingsPct,
      },
      vaultConfig: {
        home: {
          name: finalHomeName,
          shortName: deriveShortName(finalHomeName),
          quickAmounts: [],
        },
        officeFood: {
          name: finalFoodName,
          shortName: deriveShortName(finalFoodName),
          quickAmounts: foodQuickAmounts,
        },
        savings: {
          name: finalSavingsName,
          shortName: deriveShortName(finalSavingsName),
          quickAmounts: [],
        },
        personal: {
          name: finalPersonalName,
          shortName: deriveShortName(finalPersonalName),
          quickAmounts: [],
        },
      },
      breakdown: {
        home: numericHome,
        officeFood: numericFood,
        savings: savingsAmount,
        personal: personalAmount,
      },
      totalIncome,
      savingsGoal,
    });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 relative overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Ambient Radial Glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/4 w-[460px] h-[460px] rounded-full bg-emerald-500/12 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-500/12 blur-[140px]" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative z-10 w-full max-w-3xl rounded-3xl bg-[#0b1324]/90 backdrop-blur-2xl border border-emerald-400/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] p-5 sm:p-8 my-4"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/15 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-400" />
            </div>
            <div>
              <h1
                id="onboarding-title"
                className="text-xl sm:text-2xl font-bold text-white leading-[1.4]"
              >
                অরবিটাল ওয়েলথ ভল্টে স্বাগতম
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
                আপনার নিজের আয়, ৪টি ভল্টের নাম ও বাজেট অনুযায়ী ড্যাশবোর্ড সাজিয়ে নিন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onBackToAuth && (
              <button
                type="button"
                onClick={onBackToAuth}
                className="min-h-[40px] px-3 py-2 inline-flex items-center justify-center text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                অ্যাকাউন্ট স্ক্রিনে ফিরুন
              </button>
            )}

            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              className="min-h-[40px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ব্যাকআপ (.json) রিস্টোর</span>
            </button>
          </div>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleBackupImport}
            className="hidden"
            aria-label="JSON ব্যাকআপ ফাইল নির্বাচন করুন"
          />
        </div>

        {/* Quick Templates */}
        <div className="mt-5">
          <span className="block text-xs font-semibold text-emerald-300 leading-[1.5] mb-2">
            এক ক্লিকে শুরু করতে যেকোনো কুইক টেমপ্লেট বেছে নিন (অথবা নিচে কাস্টম তথ্য দিন):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {QUICK_TEMPLATES.map((tpl) => {
              const active = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-xs sm:text-[13px] font-bold text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="leading-[1.4]">{tpl.label}</span>
                  {active && <Check className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name & Optional Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-[#070b14]/70 border border-white/10">
            <div className="sm:col-span-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-emerald-400/50 bg-slate-900 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'প্রোফাইল ছবি'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-emerald-300" aria-hidden="true" />
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <span>ছবি (ঐচ্ছিক)</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="প্রোফাইল ছবি আপলোড করুন"
              />
            </div>

            <div className="sm:col-span-8">
              <label
                htmlFor="onboarding-name"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1"
              >
                আপনার নাম
              </label>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full min-h-[42px] px-3.5 py-2 bg-[#0b1324] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Monthly Income Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="onboarding-basic"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                মাসিক মূল বেতন (৳)
              </label>
              <input
                id="onboarding-basic"
                type="number"
                inputMode="numeric"
                min={0}
                value={basicSalary}
                onChange={(e) => {
                  setBasicSalary(e.target.value);
                  setError('');
                }}
                placeholder="যেমন: ২০০০০"
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="onboarding-extra"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                অতিরিক্ত / ওভারটাইম আয় (৳)
              </label>
              <input
                id="onboarding-extra"
                type="number"
                inputMode="numeric"
                min={0}
                value={extraIncome}
                onChange={(e) => {
                  setExtraIncome(e.target.value);
                  setError('');
                }}
                placeholder="০"
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/30 px-4 py-2.5 flex flex-col justify-center">
              <span className="text-xs font-semibold text-emerald-300">মোট মাসিক আয়</span>
              <span className="text-xl font-bold text-white font-num mt-0.5">
                {formatBDT(totalIncome)}
              </span>
            </div>
          </div>

          {/* 4 Vaults Custom Names & Initial Allocations */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white leading-[1.5]">
              ৪টি ভল্টের নাম ও প্রাথমিক বরাদ্দ সেট করুন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Vault 1 */}
              <div className="p-3.5 rounded-2xl bg-violet-500/8 border border-violet-400/30 space-y-2.5">
                <span className="text-xs font-bold text-violet-300">১ম ভল্ট (ফিক্সড খরচ)</span>
                <input
                  type="text"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  aria-label="১ম ভল্টের নাম"
                  placeholder="বাসায় দেওয়া / ভাড়া"
                  className="w-full min-h-[40px] px-3 py-1.5 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-violet-400"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={homeAmount}
                  onChange={(e) => {
                    setHomeAmount(e.target.value);
                    setError('');
                  }}
                  aria-label="১ম ভল্টে বরাদ্দ (টাকা)"
                  placeholder="বরাদ্দ (৳) যেমন: ৯৫০০"
                  className="w-full min-h-[40px] px-3 py-1.5 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white font-num focus:outline-none focus:border-violet-400"
                />
              </div>

              {/* Vault 2 */}
              <div className="p-3.5 rounded-2xl bg-amber-500/8 border border-amber-400/30 space-y-2.5">
                <span className="text-xs font-bold text-amber-300">২য় ভল্ট (দৈনন্দিন / বাজার)</span>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  aria-label="২য় ভল্টের নাম"
                  placeholder="খাবার / বাজার"
                  className="w-full min-h-[40px] px-3 py-1.5 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={foodAmount}
                  onChange={(e) => {
                    setFoodAmount(e.target.value);
                    setError('');
                  }}
                  aria-label="২য় ভল্টে বরাদ্দ (টাকা)"
                  placeholder="বরাদ্দ (৳) যেমন: ৩০০০"
                  className="w-full min-h-[40px] px-3 py-1.5 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white font-num focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Remaining Split for Vault 3 & 4 */}
            <div className="p-4 rounded-2xl bg-[#070b14]/75 border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-slate-200">
                  অবশিষ্ট টাকা বণ্টন ({formatBDT(remainingAfterFixed)})
                </span>
                <span className="font-bold text-emerald-300 font-num">
                  {formatNumber(savingsPct)}% / {formatNumber(personalPct)}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={savingsPct}
                onChange={(e) => setSavingsPct(Number(e.target.value))}
                aria-label="মূল সঞ্চয়ের শতাংশ"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${savingsPct}%, rgba(255,255,255,0.12) ${savingsPct}%, rgba(255,255,255,0.12) 100%)`,
                }}
                className="w-full vault-slider cursor-pointer"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-400/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span>৩য় ভল্ট ({formatNumber(savingsPct)}%)</span>
                    <span className="font-num">{formatBDT(savingsAmount)}</span>
                  </div>
                  <input
                    type="text"
                    value={savingsName}
                    onChange={(e) => setSavingsName(e.target.value)}
                    aria-label="৩য় ভল্টের নাম"
                    placeholder="মূল সঞ্চয়"
                    className="w-full min-h-[38px] px-3 py-1.5 bg-[#0b1324] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-400/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>৪র্থ ভল্ট ({formatNumber(personalPct)}%)</span>
                    <span className="font-num">{formatBDT(personalAmount)}</span>
                  </div>
                  <input
                    type="text"
                    value={personalName}
                    onChange={(e) => setPersonalName(e.target.value)}
                    aria-label="৪র্থ ভল্টের নাম"
                    placeholder="ব্যক্তিগত খরচ"
                    className="w-full min-h-[38px] px-3 py-1.5 bg-[#0b1324] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[50px] px-5 py-3 inline-flex items-center justify-center gap-2 text-base font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_28px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <Rocket className="w-5 h-5" aria-hidden="true" />
            <span>আমার ভল্ট তৈরি করুন</span>
          </button>
        </form>
      </div>
    </div>
  );
}

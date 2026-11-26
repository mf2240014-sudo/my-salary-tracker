import {
  ArrowLeftRight,
  FileJson,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Upload,
} from 'lucide-react';
import {useRef, useState} from 'react';
import {
  BUCKET_LIST,
  BucketId,
  BucketsMap,
  getVaultDisplayName,
  SecuritySettings,
  VaultConfigMap,
} from '../types/budget';
import {formatBDT, getTodayISODate} from '../utils/format';

interface SettingsViewProps {
  buckets: BucketsMap;
  vaultConfig: VaultConfigMap;
  savingsGoal: number;
  privacyMasked: boolean;
  security: SecuritySettings;
  onChangeGoal: (nextGoal: number) => void;
  onUpdateSecurity: (next: Partial<SecuritySettings>, message?: string) => void;
  onLockNow: () => void;
  onReopenOnboarding: () => void;
  onTransfer: (payload: {
    fromBucketId: BucketId;
    toBucketId: BucketId;
    amount: number;
    note: string;
    date: string;
  }) => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onOpenTransferModal: () => void;
  onRequestReset: () => void;
}

export function SettingsView({
  buckets,
  vaultConfig,
  savingsGoal,
  privacyMasked,
  security,
  onChangeGoal,
  onUpdateSecurity,
  onLockNow,
  onReopenOnboarding,
  onTransfer,
  onExportJSON,
  onImportJSON,
  onOpenTransferModal,
  onRequestReset,
}: SettingsViewProps) {
  const [fromBucket, setFromBucket] = useState<BucketId>('savings');
  const [toBucket, setToBucket] = useState<BucketId>('home');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [pinDraft, setPinDraft] = useState('');
  const [pinError, setPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fromRemaining = buckets[fromBucket].allocated - buckets[fromBucket].spent;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.round(Number(amount));

    if (fromBucket === toBucket) {
      setError('একই ভল্টের মধ্যে স্থানান্তর করা যাবে না।');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('০-এর চেয়ে বেশি টাকার পরিমাণ লিখুন।');
      return;
    }
    if (numericAmount > fromRemaining) {
      setError(
        `"${vaultConfig[fromBucket].name}"-এ পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ${formatBDT(fromRemaining, privacyMasked)})।`
      );
      return;
    }

    onTransfer({
      fromBucketId: fromBucket,
      toBucketId: toBucket,
      amount: numericAmount,
      note:
        note.trim() ||
        `${vaultConfig[fromBucket].shortName} থেকে ${vaultConfig[toBucket].shortName}-এ সমন্বয়`,
      date: getTodayISODate(),
    });
    setAmount('');
    setNote('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
    e.target.value = '';
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pinDraft.replace(/\D/g, '');
    if (cleaned.length !== 4) {
      setPinError('দয়া করে ঠিক ৪ সংখ্যার (০-৯) একটি পিন কোড লিখুন।');
      return;
    }
    onUpdateSecurity(
      {pinCode: cleaned, pinEnabled: true},
      '৪-ডিজিট পিন লক সফলভাবে চালু ও সংরক্ষণ করা হয়েছে।'
    );
    setPinDraft('');
    setPinError('');
  };

  const handleTogglePin = () => {
    if (security.pinEnabled) {
      onUpdateSecurity(
        {pinEnabled: false},
        'পিন লক সাময়িকভাবে বন্ধ করা হয়েছে।'
      );
      setPinError('');
      return;
    }

    if (security.pinCode.length === 4) {
      onUpdateSecurity(
        {pinEnabled: true},
        '৪-ডিজিট পিন লক চালু করা হয়েছে।'
      );
      setPinError('');
      return;
    }

    setPinError('চালু করার আগে নিচে ৪ সংখ্যার নতুন পিন লিখে সংরক্ষণ করুন।');
  };

  const handleDisableAndClearPin = () => {
    onUpdateSecurity(
      {pinEnabled: false, pinCode: ''},
      'পিন কোড মুছে ফেলা হয়েছে।'
    );
    setPinDraft('');
    setPinError('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Custom Vault Transfer */}
      <section
        aria-label="ভল্ট ব্যালেন্স সমন্বয়"
        className="rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6"
      >
        <div className="pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white leading-[1.5]">
            ভল্ট ব্যালেন্স সমন্বয় (ট্রান্সফার)
          </h2>
          <p className="text-sm font-medium text-slate-300 leading-[1.5]">
            যেকোনো দুটি ভল্টের মধ্যে প্রয়োজনীয় টাকা স্থানান্তর করুন
          </p>
        </div>

        <form onSubmit={handleTransferSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-from"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                কোন ভল্ট থেকে
              </label>
              <select
                id="settings-from"
                value={fromBucket}
                onChange={(e) => {
                  setFromBucket(e.target.value as BucketId);
                  setError('');
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                {BUCKET_LIST.map((b) => {
                  const rem = buckets[b.id].allocated - buckets[b.id].spent;
                  return (
                    <option key={b.id} value={b.id} className="bg-[#0b1120]">
                      {getVaultDisplayName(vaultConfig, b.id, true)} ({formatBDT(rem, privacyMasked)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-to"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                কোন ভল্টে
              </label>
              <select
                id="settings-to"
                value={toBucket}
                onChange={(e) => {
                  setToBucket(e.target.value as BucketId);
                  setError('');
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                {BUCKET_LIST.map((b) => {
                  const rem = buckets[b.id].allocated - buckets[b.id].spent;
                  return (
                    <option key={b.id} value={b.id} className="bg-[#0b1120]">
                      {getVaultDisplayName(vaultConfig, b.id, true)} ({formatBDT(rem, privacyMasked)})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-amount"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                পরিমাণ (৳)
              </label>
              <input
                id="settings-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                placeholder="যেমন: ১০০০"
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="settings-note"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                কারণ / নোট
              </label>
              <input
                id="settings-note"
                type="text"
                value={note}
                placeholder="যেমন: জরুরি সমন্বয়"
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
            <span>ব্যালেন্স স্থানান্তর করুন</span>
          </button>
        </form>
      </section>

      {/* Savings Goal, Backup & Reset */}
      <section
        aria-label="সেটিংস, ব্যাকআপ ও রিসেট"
        className="rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-6"
      >
        <div>
          <div className="pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white leading-[1.5]">
              সঞ্চয়ের টার্গেট ও ডাটা ব্যাকআপ
            </h2>
            <p className="text-sm font-medium text-slate-300 leading-[1.5]">
              কাস্টম সঞ্চয় লক্ষ্যমাত্রা সেট করুন এবং JSON ব্যাকআপ সংরক্ষণ করুন
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="settings-goal-input"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              সঞ্চয়ের টার্গেট (৳)
            </label>
            <input
              id="settings-goal-input"
              type="number"
              inputMode="numeric"
              min={0}
              value={savingsGoal === 0 ? '' : savingsGoal}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                if (!Number.isNaN(v)) onChangeGoal(v);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExportJSON}
              className="min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 rounded-xl transition-colors cursor-pointer"
            >
              <FileJson className="w-4 h-4" aria-hidden="true" />
              <span>Export Backup (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Import Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="JSON ব্যাকআপ ফাইল নির্বাচন করুন"
            />
          </div>

          <button
            type="button"
            onClick={onOpenTransferModal}
            className="mt-3 w-full min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>📲 অ্যাকাউন্ট ট্রান্সফার / সিঙ্ক কোড তৈরি করুন</span>
          </button>
        </div>

        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onReopenOnboarding}
            className="w-full min-h-[46px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl transition-colors cursor-pointer"
          >
            <span>নতুন সেটআপ / টেমপ্লেট উইজার্ড</span>
          </button>

          <button
            type="button"
            onClick={onRequestReset}
            className="w-full min-h-[46px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>সব হিসাব রিসেট করুন</span>
          </button>
        </div>
      </section>

      {/* 4-Digit PIN Lock & Security Section */}
      <section
        aria-label="প্রাইভেসি ও ৪-ডিজিট পিন লক"
        className="lg:col-span-2 rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-[1.5]">
                প্রাইভেসি ও ৪-ডিজিট পিন লক
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
                অ্যাপ খোলার সময় ৪ সংখ্যার সিকিউরিটি পিন লক চালু রাখুন যাতে আপনার হিসাব সুরক্ষিত থাকে
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePin}
              className={`min-h-[42px] px-4 py-2 inline-flex items-center gap-2 text-xs sm:text-sm font-bold rounded-xl border transition-colors cursor-pointer ${
                security.pinEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/45 hover:bg-emerald-500/30'
                  : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
              }`}
            >
              {security.pinEnabled ? (
                <>
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>পিন লক চালু আছে</span>
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4" aria-hidden="true" />
                  <span>পিন লক চালু করুন</span>
                </>
              )}
            </button>

            {security.pinEnabled && security.pinCode.length === 4 && (
              <button
                type="button"
                onClick={onLockNow}
                className="min-h-[42px] px-4 py-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>এখনই লক করুন</span>
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSavePin}
          className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-5">
            <label
              htmlFor="security-pin-input"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              {security.pinCode.length === 4
                ? 'নতুন ৪-ডিজিট পিন কোড (পরিবর্তন করতে)'
                : '৪ সংখ্যার পিন কোড সেট করুন'}
            </label>
            <input
              id="security-pin-input"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pinDraft}
              onChange={(e) => {
                setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4));
                setPinError('');
              }}
              placeholder="যেমন: ১২৩৪"
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white tracking-[0.35em] font-num placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all cursor-pointer"
            >
              {security.pinCode.length === 4 ? 'পিন পরিবর্তন ও চালু করুন' : 'পিন সংরক্ষণ করুন'}
            </button>
          </div>

          {security.pinCode.length === 4 && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleDisableAndClearPin}
                className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 rounded-xl transition-colors cursor-pointer"
              >
                পিন মুছে ফেলুন
              </button>
            </div>
          )}
        </form>

        {pinError && (
          <p className="mt-3 text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-2 rounded-xl">
            {pinError}
          </p>
        )}
      </section>
    </div>
  );
}

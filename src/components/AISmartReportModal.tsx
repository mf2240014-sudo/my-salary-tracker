import {Sparkles, TrendingUp, X} from 'lucide-react';
import {BucketsMap, LoanRecord, VaultConfigMap} from '../types/budget';
import {formatBDT, formatNumber} from '../utils/format';

interface AISmartReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  buckets: BucketsMap;
  vaultConfig: VaultConfigMap;
  savingsGoal: number;
  loans: LoanRecord[];
  privacyMasked: boolean;
}

function toBengaliLocative(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '';
  const lastChar = trimmed.slice(-1);

  if (lastChar === 'া') {
    return `${trimmed}য়`;
  }
  if (/^[িীুূৃেৈোৌইঈউঊএঐওঔয়]$/.test(lastChar)) {
    return `${trimmed}তে`;
  }
  if (/^[\u0995-\u09B9\u09DC\u09DD\u09CE]$/.test(lastChar)) {
    return `${trimmed}ে`;
  }
  return `${trimmed}-এ`;
}

export function AISmartReportModal({
  isOpen,
  onClose,
  buckets,
  vaultConfig,
  savingsGoal,
  loans,
  privacyMasked,
}: AISmartReportModalProps) {
  if (!isOpen) return null;

  const officeFoodName = vaultConfig.officeFood.name || 'অফিস খাবার';
  const personalName = vaultConfig.personal.name || 'নিজের হাতখরচ';
  const savingsName = vaultConfig.savings.name || 'মূল সঞ্চয়';
  const officeFoodLocative = toBengaliLocative(officeFoodName);
  const personalLocative = toBengaliLocative(personalName);

  const totalAllocated =
    buckets.home.allocated +
    buckets.officeFood.allocated +
    buckets.savings.allocated +
    buckets.personal.allocated;

  const totalSpent =
    buckets.home.spent +
    buckets.officeFood.spent +
    buckets.savings.spent +
    buckets.personal.spent;

  const totalRemaining = totalAllocated - totalSpent;

  const officeFoodRemaining = Math.max(
    0,
    buckets.officeFood.allocated - buckets.officeFood.spent
  );
  const personalRemaining = Math.max(
    0,
    buckets.personal.allocated - buckets.personal.spent
  );
  const savingsRemaining = Math.max(
    0,
    buckets.savings.allocated - buckets.savings.spent
  );

  // Days remaining in current month (inclusive of today)
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);

  const dailyOfficeAllowance = Math.round(officeFoodRemaining / daysLeft);
  const dailyPersonalAllowance = Math.round(personalRemaining / daysLeft);

  const savingsRatePct =
    totalAllocated > 0
      ? Math.max(0, Math.round((savingsRemaining / totalAllocated) * 100))
      : 0;

  const goalProgressPct =
    savingsGoal > 0
      ? Math.min(100, Math.round((savingsRemaining / savingsGoal) * 100))
      : 0;

  // Projected end-of-month savings: Main Savings + 35% of currently unspent food/personal buffer
  const projectedSavings =
    savingsRemaining + Math.round((officeFoodRemaining + personalRemaining) * 0.35);

  const activeReceivable = loans
    .filter((l) => !l.settled && l.type === 'receivable')
    .reduce((acc, l) => acc + l.amount, 0);

  const activePayable = loans
    .filter((l) => !l.settled && l.type === 'payable')
    .reduce((acc, l) => acc + l.amount, 0);

  const healthHeadline =
    totalRemaining < 0
      ? 'সতর্কতা: কিছু ভল্টে বাজেট অতিক্রম হয়েছে'
      : savingsRatePct >= 15
        ? 'চমৎকার আর্থিক শৃঙ্খলা! আপনার সঞ্চয়ের হার বেশ শক্তিশালী।'
        : 'বাজেট স্থিতিশীল আছে — খরচ নিয়ন্ত্রণে রাখলে সঞ্চয় আরও বাড়বে।';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-bengali-report"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#0b1324] border border-cyan-400/35 shadow-[0_0_55px_rgba(6,182,212,0.22)] p-5 sm:p-6 my-auto font-bengali-report">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="ai-report-title"
                className="text-lg sm:text-xl font-bold text-white leading-[1.6]"
              >
                এআই স্মার্ট মাসিক রিপোর্ট ও পরামর্শ
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.6]">
                আপনার ৪টি ভল্টের বর্তমান অবস্থা ও ব্যয়ের গতির তাৎক্ষণিক বিশ্লেষণ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Executive Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-violet-500/15 border border-emerald-400/30 p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold leading-[1.6]">
              <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{healthHeadline}</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-200 leading-[1.6] mt-1.5">
              এই মাসে মোট বরাদ্দ{' '}
              <strong className="text-white font-num">
                {formatBDT(totalAllocated, privacyMasked)}
              </strong>
              -এর মধ্যে এখন পর্যন্ত খরচ হয়েছে{' '}
              <strong className="text-amber-300 font-num">
                {formatBDT(totalSpent, privacyMasked)}
              </strong>{' '}
              এবং অবশিষ্ট রয়েছে{' '}
              <strong className="text-emerald-300 font-num">
                {formatBDT(totalRemaining, privacyMasked)}
              </strong>
              ।
            </p>
          </div>

          {/* 3 Key Insight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <span className="text-xs font-semibold text-slate-300 leading-[1.6] block">
                মোট আয়ের তুলনায় সঞ্চয়
              </span>
              <span className="text-2xl font-bold text-emerald-300 font-num block mt-1">
                {formatNumber(savingsRatePct)}%
              </span>
              <span className="text-xs font-medium text-slate-300 leading-[1.6] block mt-1">
                লক্ষ্যমাত্রার {formatNumber(goalProgressPct)}% পূর্ণ
              </span>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <span className="text-xs font-semibold text-slate-300 leading-[1.6] block">
                দৈনিক {officeFoodName} সীমা (বাকি {formatNumber(daysLeft)} দিন)
              </span>
              <span className="text-2xl font-bold text-amber-300 font-num block mt-1">
                {formatBDT(dailyOfficeAllowance, privacyMasked)}
              </span>
              <span className="text-xs font-medium text-slate-300 leading-[1.6] block mt-1">
                প্রতিদিন {officeFoodLocative} খরচযোগ্য
              </span>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <span className="text-xs font-semibold text-slate-300 leading-[1.6] block">
                দৈনিক {personalName} সীমা
              </span>
              <span className="text-2xl font-bold text-cyan-300 font-num block mt-1">
                {formatBDT(dailyPersonalAllowance, privacyMasked)}
              </span>
              <span className="text-xs font-medium text-slate-300 leading-[1.6] block mt-1">
                মাস শেষ পর্যন্ত প্রতিদিন ব্যবহারযোগ্য
              </span>
            </div>
          </div>

          {/* Personalized Bengali Recommendations */}
          <div className="rounded-2xl bg-[#070b14]/80 border border-white/10 p-4 space-y-2.5">
            <h3 className="text-sm font-bold text-white leading-[1.6]">
              ব্যক্তিগত আর্থিক পরামর্শ ও মাস শেষের পূর্বাভাস
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-200 leading-[1.6]">
              <li>
                • বর্তমান গতির ওপর ভিত্তি করে মাস শেষে আপনার সম্ভাব্য মোট সঞ্চয় দাঁড়াতে পারে প্রায়{' '}
                <strong className="text-emerald-300 font-num">
                  {formatBDT(projectedSavings, privacyMasked)}
                </strong>
                ।
              </li>
              <li>
                • {officeFoodLocative} দৈনিক{' '}
                <strong className="text-amber-300 font-num">
                  {formatBDT(dailyOfficeAllowance, privacyMasked)}
                </strong>{' '}
                এবং {personalLocative}{' '}
                <strong className="text-cyan-300 font-num">
                  {formatBDT(dailyPersonalAllowance, privacyMasked)}
                </strong>{' '}
                সীমার মধ্যে থাকলে কোনো বাড়তি চাপ ছাড়াই মাস শেষ করা সম্ভব।
              </li>
              {(activeReceivable > 0 || activePayable > 0) && (
                <li>
                  • আপনার বকেয়া হিসাবে{' '}
                  <strong className="text-emerald-300 font-num">
                    {formatBDT(activeReceivable, privacyMasked)}
                  </strong>{' '}
                  পাওনা এবং{' '}
                  <strong className="text-rose-300 font-num">
                    {formatBDT(activePayable, privacyMasked)}
                  </strong>{' '}
                  দেনা রয়েছে — পাওনা আদায় হলে সরাসরি {savingsName} ভল্টে যোগ করতে পারবেন।
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all cursor-pointer leading-[1.6]"
          >
            বুঝেছি, ধন্যবাদ
          </button>
        </div>
      </div>
    </div>
  );
}

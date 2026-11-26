import {PlusCircle, RefreshCw, X} from 'lucide-react';
import {BucketId, HOME_QUICK_AMOUNTS, IncomeSetupConfig} from '../types/budget';
import {formatBDT, formatNumber} from '../utils/format';

interface IncomeSetupModalProps {
  isOpen: boolean;
  setup: IncomeSetupConfig;
  onClose: () => void;
  onChangeSetup: (next: IncomeSetupConfig) => void;
  onUpdateCurrentMonthSalary: (
    breakdown: Record<BucketId, number>,
    totalIncome: number
  ) => void;
  onAddNewMonthSalary: (
    breakdown: Record<BucketId, number>,
    totalIncome: number
  ) => void;
}

export function IncomeSetupModal({
  isOpen,
  setup,
  onClose,
  onChangeSetup,
  onUpdateCurrentMonthSalary,
  onAddNewMonthSalary,
}: IncomeSetupModalProps) {
  if (!isOpen) return null;

  const basic = Math.max(0, setup.basicSalary || 0);
  const offDays = Math.max(0, setup.offDaysCount || 0);
  const offRate = Math.max(0, setup.offDayRate || 0);
  const overtime = offDays * offRate;
  const totalIncome = basic + overtime;

  const home = Math.max(0, setup.homeContribution || 0);
  const officeFood = Math.max(0, setup.officeFoodBudget || 0);
  const remainingAfterFixed = totalIncome - home - officeFood;

  const savingsPct = Math.min(100, Math.max(0, Math.round(setup.savingsPercent)));
  const personalPct = 100 - savingsPct;

  const positiveRemaining = Math.max(0, remainingAfterFixed);
  const savingsAmount = Math.round((positiveRemaining * savingsPct) / 100);
  const personalAmount = positiveRemaining - savingsAmount;

  const isOverFixed = remainingAfterFixed < 0;
  const canSubmit = totalIncome > 0 && !isOverFixed;

  const breakdown: Record<BucketId, number> = {
    home,
    officeFood,
    savings: savingsAmount,
    personal: personalAmount,
  };

  const updateNumericField = (key: keyof IncomeSetupConfig, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : Math.max(0, Number(rawValue));
    if (Number.isNaN(parsed)) return;

    const next = {
      ...setup,
      [key]: parsed,
    };

    if (key === 'offDaysCount' || key === 'offDayRate') {
      const nextDays = key === 'offDaysCount' ? parsed : Math.max(0, setup.offDaysCount || 0);
      const nextRate = key === 'offDayRate' ? parsed : Math.max(0, setup.offDayRate || 0);
      next.overtimeIncome = nextDays * nextRate;
    }

    onChangeSetup(next);
  };

  const handleSavingsPctChange = (rawPct: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(rawPct)));
    onChangeSetup({
      ...setup,
      savingsPercent: clamped,
    });
  };

  const handleUpdateCurrentMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onUpdateCurrentMonthSalary(breakdown, totalIncome);
    onClose();
  };

  const handleAddNewMonth = () => {
    if (!canSubmit) return;
    onAddNewMonthSalary(breakdown, totalIncome);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-setup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-3xl bg-[#0b1324] border border-emerald-400/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] p-5 sm:p-6 my-auto">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2
              id="income-setup-modal-title"
              className="text-lg sm:text-xl font-bold text-white leading-[1.5]"
            >
              আয় সেটআপ ও মাসিক বণ্টন
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
              বেসিক স্যালারি, অফ-ডে ডিউটি ও ফিক্সড খরচ ঠিক করে ৪টি ভল্টে বণ্টন করুন
            </p>
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

        <form onSubmit={handleUpdateCurrentMonth} className="mt-5 space-y-4">
          {/* Basic Salary */}
          <div>
            <label
              htmlFor="modal-basic-salary"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              বেসিক স্যালারি (৳)
            </label>
            <input
              id="modal-basic-salary"
              type="number"
              inputMode="numeric"
              min={0}
              value={setup.basicSalary === 0 ? '' : setup.basicSalary}
              onChange={(e) => updateNumericField('basicSalary', e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            />
          </div>

          {/* Off-Day Duty */}
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 leading-[1.5]">
                অফ-ডে ডিউটি
              </span>
              <span className="text-sm font-bold text-cyan-300 font-num">
                {formatNumber(offDays)} দিন × {formatNumber(offRate)} = {formatBDT(overtime)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="modal-off-days"
                  className="block text-xs font-semibold text-slate-300 leading-[1.5] mb-1"
                >
                  অফ-ডে সংখ্যা (দিন)
                </label>
                <input
                  id="modal-off-days"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={setup.offDaysCount === 0 ? '' : setup.offDaysCount}
                  onChange={(e) => updateNumericField('offDaysCount', e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label
                  htmlFor="modal-off-rate"
                  className="block text-xs font-semibold text-slate-300 leading-[1.5] mb-1"
                >
                  দৈনিক রেট (৳)
                </label>
                <input
                  id="modal-off-rate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={setup.offDayRate === 0 ? '' : setup.offDayRate}
                  onChange={(e) => updateNumericField('offDayRate', e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Total Income Banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25">
            <span className="text-sm font-semibold text-emerald-200 leading-[1.5]">
              মোট মাসিক আয়
            </span>
            <span className="text-lg font-bold text-white font-num">
              {formatBDT(totalIncome)}
            </span>
          </div>

          {/* Home Contribution + Quick Buttons */}
          <div>
            <label
              htmlFor="modal-home"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              বাসায় দেওয়া (৳)
            </label>
            <input
              id="modal-home"
              type="number"
              inputMode="numeric"
              min={0}
              value={setup.homeContribution === 0 ? '' : setup.homeContribution}
              onChange={(e) => updateNumericField('homeContribution', e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-violet-400"
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {HOME_QUICK_AMOUNTS.map((amt) => {
                const active = home === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      onChangeSetup({...setup, homeContribution: amt})
                    }
                    className={`min-h-[38px] px-2 py-1 text-xs font-bold font-num rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-violet-500/25 text-violet-200 border-violet-400/60'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {formatNumber(amt)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Office Food */}
          <div>
            <label
              htmlFor="modal-office-food"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              অফিস খাবার (৳)
            </label>
            <input
              id="modal-office-food"
              type="number"
              inputMode="numeric"
              min={0}
              value={setup.officeFoodBudget === 0 ? '' : setup.officeFoodBudget}
              onChange={(e) => updateNumericField('officeFoodBudget', e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Savings Percentage */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="modal-savings-pct"
                className="text-sm font-semibold text-slate-200 leading-[1.5]"
              >
                সঞ্চয়ের হার % (অবশিষ্ট {formatBDT(remainingAfterFixed)})
              </label>
              <span className="text-sm font-bold text-emerald-300 font-num">
                {formatNumber(savingsPct)}%
              </span>
            </div>

            {isOverFixed ? (
              <p className="text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-2 rounded-xl">
                বাসা ও অফিস খাবারের পরিমাণ মোট আয়ের চেয়ে বেশি হয়ে গেছে।
              </p>
            ) : (
              <>
                <input
                  id="modal-savings-pct"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={savingsPct}
                  onChange={(e) => handleSavingsPctChange(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${savingsPct}%, rgba(255,255,255,0.12) ${savingsPct}%, rgba(255,255,255,0.12) 100%)`,
                  }}
                  className="w-full vault-slider cursor-pointer"
                />
                <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-300">
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    মূল সঞ্চয় ({formatNumber(savingsPct)}%):{' '}
                    <strong className="text-emerald-300 font-num">{formatBDT(savingsAmount)}</strong>
                  </div>
                  <div className="bg-white/5 rounded-xl px-3 py-2 text-right">
                    নিজের হাতখরচ ({formatNumber(personalPct)}%):{' '}
                    <strong className="text-cyan-300 font-num">{formatBDT(personalAmount)}</strong>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-[48px] px-4 py-3 inline-flex items-center justify-center gap-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>বর্তমান মাসের হিসাব আপডেট করুন</span>
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleAddNewMonth}
              className="min-h-[48px] px-4 py-3 inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>নতুন মাস যোগ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

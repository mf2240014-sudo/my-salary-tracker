import {Target} from 'lucide-react';
import {GOAL_QUICK_AMOUNTS} from '../types/budget';
import {formatBDT, formatNumber} from '../utils/format';

interface LiquidSavingsTankProps {
  savingsGoal: number;
  currentSavings: number;
  savingsVaultName?: string;
  privacyMasked: boolean;
  onChangeGoal: (nextGoal: number) => void;
}

export function LiquidSavingsTank({
  savingsGoal,
  currentSavings,
  savingsVaultName = 'মূল সঞ্চয়',
  privacyMasked,
  onChangeGoal,
}: LiquidSavingsTankProps) {
  const safeGoal = Math.max(0, savingsGoal);
  const safeCurrent = Math.max(0, currentSavings);
  const progressPct =
    safeGoal > 0 ? Math.min(100, Math.round((safeCurrent / safeGoal) * 100)) : 0;
  const remainingNeeded = Math.max(0, safeGoal - safeCurrent);
  const isGoalReached = safeGoal > 0 && safeCurrent >= safeGoal;

  const visualHeightPct =
    progressPct === 0 ? 0 : Math.min(100, Math.max(10, progressPct));

  return (
    <section
      aria-label="সঞ্চয় লক্ষ্যমাত্রা"
      className="h-full rounded-2xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white leading-[1.5]">
            সঞ্চয় লক্ষ্যমাত্রা
          </h2>
          <p className="text-xs font-medium text-slate-300 leading-[1.5]">
            {savingsVaultName}-এর জমানো অর্থের অগ্রগতি
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      {/* Vertical Rounded Glass Capsule Tank */}
      <div className="my-5 flex flex-col items-center">
        <div
          className="relative w-32 h-48 rounded-[2.75rem] bg-[#070d1b] border-2 border-cyan-400/35 shadow-[inset_0_0_24px_rgba(6,182,212,0.18),0_0_24px_rgba(16,185,129,0.12)] overflow-hidden flex items-center justify-center"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`সঞ্চয় লক্ষ্যমাত্রার ${formatNumber(progressPct)} শতাংশ পূর্ণ`}
        >
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
            style={{height: `${visualHeightPct}%`}}
          >
            <div className="absolute -top-3.5 left-0 w-[200%] h-4 overflow-hidden animate-wave-slide">
              <svg
                viewBox="0 0 240 20"
                preserveAspectRatio="none"
                className="w-full h-full"
                aria-hidden="true"
              >
                <path
                  d="M0 10 Q 30 0 60 10 T 120 10 T 180 10 T 240 10 L 240 20 L 0 20 Z"
                  fill="url(#liquidWaveGrad)"
                />
                <defs>
                  <linearGradient id="liquidWaveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.92" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.92" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="w-full h-full bg-gradient-to-t from-emerald-600/90 via-emerald-500/80 to-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.5)]" />
          </div>

          <div
            className="pointer-events-none absolute top-3 left-3 bottom-3 w-2.5 rounded-full bg-white/10"
            aria-hidden="true"
          />

          <div className="relative z-10 text-center px-2">
            <span className="text-3xl font-bold text-white font-num drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {privacyMasked ? '••%' : `${formatNumber(progressPct)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Below Tank Target & Quick Selector Chips */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-white leading-[1.5]">
            সঞ্চয়ের টার্গেট:{' '}
            <span className="text-cyan-300 font-num">
              {formatBDT(safeGoal, privacyMasked)}
            </span>
          </span>
          <span className="text-xs font-semibold text-emerald-300 font-num">
            জমা: {formatBDT(safeCurrent, privacyMasked)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {GOAL_QUICK_AMOUNTS.map((preset) => {
            const active = safeGoal === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeGoal(preset)}
                className={`min-h-[38px] px-2 py-1 text-xs font-bold font-num rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {formatNumber(preset)}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-medium text-slate-300 leading-[1.5] text-center">
          {isGoalReached ? (
            <span className="text-emerald-300 font-semibold">
              অভিনন্দন! আপনার সঞ্চয়ের লক্ষ্যমাত্রা পূরণ হয়েছে।
            </span>
          ) : (
            <>
              লক্ষ্যে পৌঁছাতে আরও প্রয়োজন:{' '}
              <strong className="text-white font-num">
                {formatBDT(remainingNeeded, privacyMasked)}
              </strong>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

import {Home, PiggyBank, Utensils, Wallet} from 'lucide-react';
import {
  BucketsMap,
  IncomeSetupConfig,
  OFFICE_FOOD_QUICK_AMOUNTS,
} from '../types/budget';
import {formatBDT, formatNumber} from '../utils/format';

interface OrbitalSalaryFlowProps {
  setup: IncomeSetupConfig;
  buckets: BucketsMap;
  totalAllocated: number;
  privacyMasked: boolean;
  onOpenIncomeSetup: () => void;
  onTransferHomeAndSavings: (direction: 'toHome' | 'toSavings') => void;
  onQuickOfficeFoodExpense: (amount: number) => void;
}

export function OrbitalSalaryFlow({
  setup,
  buckets,
  totalAllocated,
  privacyMasked,
  onOpenIncomeSetup,
  onTransferHomeAndSavings,
  onQuickOfficeFoodExpense,
}: OrbitalSalaryFlowProps) {
  const overtime =
    Math.max(0, setup.offDaysCount) * Math.max(0, setup.offDayRate);
  const configuredTotal = Math.max(0, setup.basicSalary) + overtime;
  const hubAmount = totalAllocated > 0 ? totalAllocated : configuredTotal;

  const homeRemaining = buckets.home.allocated - buckets.home.spent;
  const officeRemaining = buckets.officeFood.allocated - buckets.officeFood.spent;
  const savingsRemaining = buckets.savings.allocated - buckets.savings.spent;
  const personalRemaining = buckets.personal.allocated - buckets.personal.spent;

  const savingsPct = Math.min(100, Math.max(0, Math.round(setup.savingsPercent)));
  const personalPct = 100 - savingsPct;

  const getRemainingPct = (allocated: number, spent: number) => {
    if (allocated <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((allocated - spent) / allocated) * 100)));
  };

  return (
    <section
      aria-label="অরবিটাল স্যালারি ফ্লো"
      className="relative rounded-3xl bg-[#0b1222]/80 border border-white/10 p-4 sm:p-6 lg:p-8 overflow-hidden"
    >
      {/* Subtle Ambient Corner Glows */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-500/18 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/18 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/18 blur-3xl"
        aria-hidden="true"
      />

      {/* Desktop Bright Glowing Curved SVG Connector Lines + Moving Light Orbs */}
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        className="hidden lg:block pointer-events-none absolute inset-0 w-full h-full z-0"
        aria-hidden="true"
      >
        <defs>
          <filter id="neonLineGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="orbGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Top-Left Violet Connector: Hub Left Edge (405, 195) -> Home Card Inner Edge (322, 102) */}
        <path
          id="path-home"
          d="M 405 192 C 370 192, 362 102, 322 102"
          fill="none"
          stroke="#8b5cf6"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          filter="url(#neonLineGlow)"
        />
        <path
          d="M 405 192 C 370 192, 362 102, 322 102"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonLineGlow)"
          className="animate-energy-flow"
        />
        <circle r="4" fill="#ddd6fe" filter="url(#orbGlow)">
          <animateMotion dur="2.2s" repeatCount="indefinite">
            <mpath href="#path-home" />
          </animateMotion>
        </circle>

        {/* Bottom-Left Emerald Connector: Hub Left Edge (405, 208) -> Savings Card Inner Edge (322, 298) */}
        <path
          id="path-savings"
          d="M 405 208 C 370 208, 362 298, 322 298"
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          filter="url(#neonLineGlow)"
        />
        <path
          d="M 405 208 C 370 208, 362 298, 322 298"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonLineGlow)"
          className="animate-energy-flow"
        />
        <circle r="4" fill="#a7f3d0" filter="url(#orbGlow)">
          <animateMotion dur="2.4s" repeatCount="indefinite" begin="0.4s">
            <mpath href="#path-savings" />
          </animateMotion>
        </circle>

        {/* Top-Right Amber Connector: Hub Right Edge (595, 192) -> Office Food Card Inner Edge (678, 102) */}
        <path
          id="path-food"
          d="M 595 192 C 630 192, 638 102, 678 102"
          fill="none"
          stroke="#f59e0b"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          filter="url(#neonLineGlow)"
        />
        <path
          d="M 595 192 C 630 192, 638 102, 678 102"
          fill="none"
          stroke="#fcd34d"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonLineGlow)"
          className="animate-energy-flow"
        />
        <circle r="4" fill="#fde68a" filter="url(#orbGlow)">
          <animateMotion dur="2.1s" repeatCount="indefinite" begin="0.2s">
            <mpath href="#path-food" />
          </animateMotion>
        </circle>

        {/* Bottom-Right Cyan Connector: Hub Right Edge (595, 208) -> Personal Card Inner Edge (678, 298) */}
        <path
          id="path-personal"
          d="M 595 208 C 630 208, 638 298, 678 298"
          fill="none"
          stroke="#06b6d4"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          filter="url(#neonLineGlow)"
        />
        <path
          d="M 595 208 C 630 208, 638 298, 678 298"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonLineGlow)"
          className="animate-energy-flow"
        />
        <circle r="4" fill="#a5f3fc" filter="url(#orbGlow)">
          <animateMotion dur="2.3s" repeatCount="indefinite" begin="0.6s">
            <mpath href="#path-personal" />
          </animateMotion>
        </circle>
      </svg>

      {/* Orbital Grid: 2 Left Cards — Center Reactor Circle — 2 Right Cards */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        {/* Left Column Vaults (Desktop cols 1-4) */}
        <div className="order-2 lg:order-1 lg:col-span-4 space-y-5">
          {/* 1. Home Vault (Violet Radial Glow) */}
          <article
            style={{
              background:
                'radial-gradient(circle at top left, rgba(139, 92, 246, 0.24), rgba(13, 20, 38, 0.94) 72%)',
            }}
            className="rounded-2xl backdrop-blur-md border border-violet-500/45 p-4 sm:p-5 shadow-[0_0_28px_rgba(139,92,246,0.18)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                <Home className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-[1.5]">
                ১. বাসায় দেওয়া ভল্ট
              </h3>
            </div>

            <div className="mt-3.5 flex items-baseline justify-between gap-3">
              <div
                className={`text-2xl font-bold font-num leading-[1.4] ${
                  homeRemaining < 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatBDT(homeRemaining, privacyMasked)}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onTransferHomeAndSavings('toHome')}
                  title="মূল সঞ্চয় থেকে ১,০০০ টাকা বাসার ভল্টে আনুন"
                  className="min-h-[34px] px-2.5 py-1 text-xs font-bold font-num rounded-lg bg-violet-500/25 hover:bg-violet-500/40 text-violet-100 border border-violet-400/45 transition-colors cursor-pointer"
                >
                  +১,০০০
                </button>
                <button
                  type="button"
                  onClick={() => onTransferHomeAndSavings('toSavings')}
                  title="বাসার ভল্ট থেকে ১,০০০ টাকা মূল সঞ্চয়ে পাঠান"
                  className="min-h-[34px] px-2.5 py-1 text-xs font-bold font-num rounded-lg bg-white/8 hover:bg-violet-500/25 text-slate-200 border border-white/15 transition-colors cursor-pointer"
                >
                  -১,০০০
                </button>
              </div>
            </div>

            <div className="mt-3.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300"
                style={{
                  width: `${getRemainingPct(buckets.home.allocated, buckets.home.spent)}%`,
                }}
              />
            </div>
          </article>

          {/* 3. Main Savings Vault (Emerald Radial Glow) */}
          <article
            style={{
              background:
                'radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.24), rgba(13, 20, 38, 0.94) 72%)',
            }}
            className="rounded-2xl backdrop-blur-md border border-emerald-500/45 p-4 sm:p-5 shadow-[0_0_28px_rgba(16,185,129,0.18)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <PiggyBank className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-[1.5]">
                ৩. মূল সঞ্চয় ভল্ট
              </h3>
            </div>

            <div className="mt-3.5">
              <div
                className={`text-2xl font-bold font-num leading-[1.4] ${
                  savingsRemaining < 0 ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                {formatBDT(savingsRemaining, privacyMasked)}
              </div>
              <p className="text-xs font-medium text-slate-200 leading-[1.5] mt-1">
                বাকি টাকার {formatNumber(savingsPct)}% সঞ্চয়
              </p>
            </div>

            <div className="mt-3.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-300"
                style={{
                  width: `${getRemainingPct(buckets.savings.allocated, buckets.savings.spent)}%`,
                }}
              />
            </div>
          </article>
        </div>

        {/* Center Glowing Perfect Circle Reactor Hub (Desktop cols 5-8) */}
        <div className="order-1 lg:order-2 lg:col-span-4 flex items-center justify-center py-3 lg:py-0">
          <div className="relative flex items-center justify-center w-64 h-64 aspect-square shrink-0">
            {/* Rotating Outer Orbit Ring with Glowing Dots */}
            <div
              className="absolute inset-0 rounded-full border border-cyan-400/25 animate-orbital-spin pointer-events-none"
              aria-hidden="true"
            >
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,1)]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,1)]" />
              <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.95)]" />
              <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.95)]" />
            </div>

            {/* Perfect Circular Hub with Double Neon Emerald-Cyan Ring */}
            <button
              type="button"
              onClick={onOpenIncomeSetup}
              title="মাসিক আয় সেটআপ খুলুন"
              className="group relative w-56 h-56 aspect-square shrink-0 rounded-full bg-[#091326]/95 backdrop-blur-xl border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.36),inset_0_0_32px_rgba(6,182,212,0.2)] hover:border-cyan-300 hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] transition-all duration-200 flex flex-col items-center justify-center px-5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {/* Inner Neon Ring */}
              <span
                className="pointer-events-none absolute inset-2.5 rounded-full border border-cyan-400/45 shadow-[inset_0_0_14px_rgba(6,182,212,0.22)]"
                aria-hidden="true"
              />

              <span className="relative text-xs font-semibold text-emerald-300 leading-[1.5]">
                মোট মাসিক আয়
              </span>
              <span className="relative text-3xl sm:text-[2rem] font-bold text-white font-num leading-[1.35] mt-1">
                {formatBDT(hubAmount, privacyMasked)}
              </span>
              <span className="relative text-xs font-medium text-slate-200 leading-[1.5] mt-1.5">
                {privacyMasked
                  ? 'বেসিক ••••• + অফ-ডে ••••'
                  : `বেসিক ${formatNumber(setup.basicSalary)} + অফ-ডে ${formatNumber(overtime)}`}
              </span>
              <span className="relative mt-2 text-[11px] font-semibold text-cyan-300/95 group-hover:text-cyan-200 transition-colors">
                পরিবর্তন করতে ক্লিক করুন
              </span>
            </button>
          </div>
        </div>

        {/* Right Column Vaults (Desktop cols 9-12) */}
        <div className="order-3 lg:order-3 lg:col-span-4 space-y-5">
          {/* 2. Office Food Vault (Warm Amber/Gold Radial Glow) */}
          <article
            style={{
              background:
                'radial-gradient(circle at top right, rgba(245, 158, 11, 0.22), rgba(13, 20, 38, 0.94) 72%)',
            }}
            className="rounded-2xl backdrop-blur-md border border-amber-500/45 p-4 sm:p-5 shadow-[0_0_28px_rgba(245,158,11,0.18)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <Utensils className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-[1.5]">
                ২. অফিস খাবার ভল্ট
              </h3>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
              <div
                className={`text-2xl font-bold font-num leading-[1.4] ${
                  officeRemaining < 0 ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {formatBDT(officeRemaining, privacyMasked)}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {OFFICE_FOOD_QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onQuickOfficeFoodExpense(amt)}
                    title={`আজকের খাবার ${formatBDT(amt)} খরচ যোগ করুন`}
                    className="min-h-[34px] px-2.5 py-1 text-xs font-bold font-num rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-100 border border-amber-400/45 transition-colors cursor-pointer"
                  >
                    -{formatNumber(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                style={{
                  width: `${getRemainingPct(
                    buckets.officeFood.allocated,
                    buckets.officeFood.spent
                  )}%`,
                }}
              />
            </div>
          </article>

          {/* 4. Personal Expenses Vault (Cyan Radial Glow) */}
          <article
            style={{
              background:
                'radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.24), rgba(13, 20, 38, 0.94) 72%)',
            }}
            className="rounded-2xl backdrop-blur-md border border-cyan-500/45 p-4 sm:p-5 shadow-[0_0_28px_rgba(6,182,212,0.18)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Wallet className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-[1.5]">
                ৪. নিজের হাতখরচ ভল্ট
              </h3>
            </div>

            <div className="mt-3.5">
              <div
                className={`text-2xl font-bold font-num leading-[1.4] ${
                  personalRemaining < 0 ? 'text-rose-400' : 'text-cyan-300'
                }`}
              >
                {formatBDT(personalRemaining, privacyMasked)}
              </div>
              <p className="text-xs font-medium text-slate-200 leading-[1.5] mt-1">
                বাকি টাকার {formatNumber(personalPct)}% হাতখরচ
              </p>
            </div>

            <div className="mt-3.5 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-300 transition-all duration-300"
                style={{
                  width: `${getRemainingPct(
                    buckets.personal.allocated,
                    buckets.personal.spent
                  )}%`,
                }}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

import {LockOpen, ShieldCheck} from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="mt-8 pt-6 pb-6 border-t border-white/10 text-center">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-2.5">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-[#0e1629]/85 border border-emerald-400/25 text-xs sm:text-sm font-semibold text-emerald-200 leading-[1.6]">
          <LockOpen className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
          <span>
            🔓 উন্মুক্ত ও স্বাধীন প্ল্যাটফর্ম • আপনার সকল হিসাব সম্পূর্ণ আপনার নিজের ডিভাইসে সুরক্ষিত থাকে (১০০% প্রাইভেসি)
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400 leading-[1.5]">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
            <span>MIT Open-Source License</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>অরবিটাল ওয়েলথ ভল্ট — সবার জন্য উন্মুক্ত ব্যক্তিগত অর্থ ব্যবস্থাপনা</span>
        </div>
      </div>
    </footer>
  );
}

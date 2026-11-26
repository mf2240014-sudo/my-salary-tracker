import {
  Download,
  Handshake,
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  ReceiptText,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';

export type NavSection = 'dashboard' | 'loans' | 'history' | 'settings';

interface SidebarProps {
  activeView: NavSection;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectView: (view: NavSection) => void;
  onOpenIncomeSetup: () => void;
  onFocusDailyExpense: () => void;
  onOpenAIReport: () => void;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
}

export function Sidebar({
  activeView,
  isMobileOpen,
  onCloseMobile,
  onSelectView,
  onOpenIncomeSetup,
  onFocusDailyExpense,
  onOpenAIReport,
  canInstallPWA,
  onInstallPWA,
}: SidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#0b1120]/95 backdrop-blur-xl border-r border-white/10">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center justify-between gap-3 px-2 py-3 mb-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 border border-emerald-400/50 shadow-[0_0_16px_rgba(16,185,129,0.45)]">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </div>
            <span className="text-base font-bold text-white leading-[1.5] truncate">
              অরবিটাল ওয়েলথ ভল্ট
            </span>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="মেনু বন্ধ করুন"
            className="lg:hidden min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Primary Menu */}
        <nav aria-label="সাইডবার নেভিগেশন" className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              onSelectView('dashboard');
              onCloseMobile();
            }}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">ড্যাশবোর্ড</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenIncomeSetup();
              onCloseMobile();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <span className="whitespace-nowrap">আয় সেটআপ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onFocusDailyExpense();
              onCloseMobile();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
          >
            <ReceiptText className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="whitespace-nowrap">দৈনিক খরচ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectView('loans');
              onCloseMobile();
            }}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'loans'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Handshake className="w-4 h-4 shrink-0 text-violet-300" aria-hidden="true" />
            <span className="whitespace-nowrap">🤝 ধার-দেনা</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectView('history');
              onCloseMobile();
            }}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ListOrdered className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">লেনদেনের তালিকা</span>
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onOpenAIReport();
                onCloseMobile();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-bold text-cyan-200 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-cyan-400/35 shadow-[0_0_16px_rgba(6,182,212,0.18)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <span className="whitespace-nowrap">✨ এআই স্মার্ট রিপোর্ট</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Install & Settings / Reset */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        {canInstallPWA && (
          <button
            type="button"
            onClick={() => {
              onInstallPWA();
              onCloseMobile();
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-[0_0_18px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">📲 অ্যাপ ইনস্টল করুন</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onSelectView('settings');
            onCloseMobile();
          }}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${
            activeView === 'settings'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">রিসেট / সেটিংস</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen z-30">
        {navContent}
      </aside>

      {/* Mobile Collapsible Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

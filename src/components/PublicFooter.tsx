import {ExternalLink, LockOpen, ShieldCheck} from 'lucide-react';

const WHATSAPP_INQUIRY_URL =
  'https://wa.me/8801791951375?text=%E0%A6%86%E0%A6%B8%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%86%E0%A6%AE%E0%A6%BE%E0%A6%B0%20%E0%A6%AC%E0%A7%8D%E0%A6%AF%E0%A6%AC%E0%A6%B8%E0%A6%BE%20%E0%A6%AC%E0%A6%BE%20%E0%A6%A6%E0%A7%8B%E0%A6%95%E0%A6%BE%E0%A6%A8%E0%A7%87%E0%A6%B0%20%E0%A6%9C%E0%A6%A8%E0%A7%8D%E0%A6%AF%20%E0%A6%8F%E0%A6%95%E0%A6%9F%E0%A6%BF%20%E0%A6%95%E0%A6%BE%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A6%AE%20%E0%A6%93%E0%A7%9F%E0%A7%87%E0%A6%AC%20%E0%A6%85%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%AA%20%E0%A6%AC%E0%A6%BE%E0%A6%A8%E0%A6%BE%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4';

export function PublicFooter() {
  return (
    <footer className="mt-8 pt-6 pb-6 border-t border-white/10 text-center">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-3">
        {/* Direct WhatsApp Custom Business App CTA */}
        <a
          href={WHATSAPP_INQUIRY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-400/30 hover:to-cyan-400/30 border border-emerald-400/45 text-xs sm:text-sm font-bold text-emerald-100 hover:text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] hover:shadow-[0_0_32px_rgba(6,182,212,0.38)] transition-all leading-[1.5]"
        >
          <span>💼 আপনার ব্যবসা বা দোকানের জন্য এমন অ্যাপ বানাতে চান? যোগাযোগ করুন</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
        </a>

        {/* Open-Source & 100% Privacy Badge */}
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

        {/* Ready-to-Use Ad Banner Slot */}
        <div
          id="ad-banner-slot"
          className="w-full max-w-[728px] mx-auto my-3 flex items-center justify-center overflow-hidden"
        >
          {/* PASTE_MONETAG_OR_ADSTERRA_SCRIPT_HERE */}
        </div>
      </div>
    </footer>
  );
}

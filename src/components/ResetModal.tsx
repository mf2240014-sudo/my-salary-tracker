import {AlertTriangle} from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetModal({isOpen, onCancel, onConfirm}: ResetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-[#0b1324] border border-rose-500/35 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/35 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="reset-dialog-title"
              className="text-lg font-bold text-white leading-[1.5]"
            >
              সব হিসাব রিসেট করবেন?
            </h3>
            <p className="text-sm font-medium text-slate-300 mt-1 leading-[1.5]">
              এটি করলে আপনার ৪টি ভল্টের বর্তমান ব্যালেন্স, মাসিক আয় এবং খরচের সম্পূর্ণ তালিকা শূন্য হয়ে যাবে। আপনি চাইলে আগে CSV বা JSON ব্যাকআপ ডাউনলোড করে রাখতে পারেন।
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল করুন
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer"
          >
            হ্যাঁ, সব মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}

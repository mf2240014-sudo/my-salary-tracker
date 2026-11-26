import {MinusCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {BUCKET_LIST, BucketId, BucketsMap} from '../types/budget';
import {formatBDT, getTodayISODate} from '../utils/format';

interface QuickExpensePanelProps {
  buckets: BucketsMap;
  selectedBucket: BucketId;
  privacyMasked: boolean;
  onSelectBucket: (bucketId: BucketId) => void;
  amountInputRef?: React.RefObject<HTMLInputElement | null>;
  onAddExpense: (payload: {
    bucketId: BucketId;
    note: string;
    amount: number;
    date: string;
  }) => void;
}

export function QuickExpensePanel({
  buckets,
  selectedBucket,
  privacyMasked,
  onSelectBucket,
  amountInputRef,
  onAddExpense,
}: QuickExpensePanelProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [selectedBucket, amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('দয়া করে ০-এর চেয়ে বেশি টাকার পরিমাণ লিখুন।');
      return;
    }

    onAddExpense({
      bucketId: selectedBucket,
      note: note.trim() || 'দৈনন্দিন খরচ',
      amount: Math.round(numericAmount),
      date: getTodayISODate(),
    });

    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <section
      id="daily-expense"
      aria-label="প্রতিদিনের খরচ যোগ করুন"
      className="h-full rounded-2xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6 flex flex-col justify-between"
    >
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-bold text-white leading-[1.5]">
          প্রতিদিনের খরচ যোগ করুন
        </h2>
        <p className="text-xs font-medium text-slate-300 leading-[1.5]">
          যেকোনো ভল্ট বেছে নিয়ে তাৎক্ষণিক খরচ বিয়োগ করুন
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="vault-select"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              ভল্ট নির্বাচন করুন
            </label>
            <select
              id="vault-select"
              value={selectedBucket}
              onChange={(e) => onSelectBucket(e.target.value as BucketId)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            >
              {BUCKET_LIST.map((b) => {
                const rem = buckets[b.id].allocated - buckets[b.id].spent;
                return (
                  <option key={b.id} value={b.id} className="bg-[#0b1120] text-white">
                    {b.orderLabel} {b.name} ({formatBDT(rem, privacyMasked)})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="quick-expense-amount"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              টাকার পরিমাণ ৳
            </label>
            <input
              ref={amountInputRef}
              id="quick-expense-amount"
              type="number"
              inputMode="numeric"
              min={1}
              value={amount}
              placeholder="যেমন: ১৫০"
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 font-num focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            />
          </div>

          <div>
            <label
              htmlFor="quick-expense-note"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              বিবরণ যেমন: দুপুরের খাবার, বাসায় পাঠানো
            </label>
            <input
              id="quick-expense-note"
              type="text"
              value={note}
              placeholder="বিবরণ লিখুন..."
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-2 rounded-xl leading-[1.5]"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-2 w-full min-h-[48px] px-4 py-3 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
        >
          <MinusCircle className="w-5 h-5" aria-hidden="true" />
          <span>ভল্ট থেকে বিয়োগ করুন</span>
        </button>
      </form>
    </section>
  );
}

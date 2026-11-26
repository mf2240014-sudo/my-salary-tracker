import {Download, Search, Trash2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {
  BUCKET_BY_ID,
  BUCKET_LIST,
  BucketId,
  TransactionRecord,
  TransactionType,
} from '../types/budget';
import {
  formatBDT,
  formatBengaliDate,
  formatBengaliMonth,
  formatNumber,
  getTodayISODate,
} from '../utils/format';

interface FullTransactionsViewProps {
  transactions: TransactionRecord[];
  privacyMasked: boolean;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
}

type TypeFilter = 'all' | TransactionType;

export function FullTransactionsView({
  transactions,
  privacyMasked,
  onDeleteTransaction,
  onExportCSV,
}: FullTransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [bucketFilter, setBucketFilter] = useState<'all' | BucketId>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(getTodayISODate().slice(0, 7));
    for (const tx of transactions) {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.slice(0, 7));
      }
    }
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (
        bucketFilter !== 'all' &&
        tx.bucketId !== bucketFilter &&
        tx.toBucketId !== bucketFilter
      ) {
        return false;
      }
      if (monthFilter !== 'all' && !tx.date.startsWith(monthFilter)) {
        return false;
      }
      if (!q) return true;
      const bName = BUCKET_BY_ID[tx.bucketId].name.toLowerCase();
      const toBName = tx.toBucketId ? BUCKET_BY_ID[tx.toBucketId].name.toLowerCase() : '';
      return (
        tx.note.toLowerCase().includes(q) ||
        bName.includes(q) ||
        toBName.includes(q) ||
        tx.date.includes(q)
      );
    });
  }, [transactions, searchQuery, typeFilter, bucketFilter, monthFilter]);

  const filteredExpenseSum = useMemo(() => {
    return filtered
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [filtered]);

  const getBucketDisplay = (tx: TransactionRecord): string => {
    if (tx.type === 'salary') return 'সকল ভল্ট (মাসিক আয়)';
    if (tx.type === 'transfer' && tx.toBucketId) {
      return `${BUCKET_BY_ID[tx.bucketId].name} → ${BUCKET_BY_ID[tx.toBucketId].name}`;
    }
    return `${BUCKET_BY_ID[tx.bucketId].orderLabel} ${BUCKET_BY_ID[tx.bucketId].name}`;
  };

  return (
    <section
      aria-label="লেনদেনের তালিকা"
      className="rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white leading-[1.5]">
            লেনদেনের তালিকা
          </h1>
          <p className="text-sm font-medium text-slate-300 leading-[1.5]">
            মাস ও ভল্ট অনুযায়ী খরচ খুঁজুন অথবা মুছে দিয়ে ভল্টে টাকা ফেরত আনুন
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCSV}
          disabled={transactions.length === 0}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>CSV ডাউনলোড</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#080d1a] border border-white/10 rounded-xl overflow-x-auto">
          {(
            [
              {id: 'all', label: 'সব'},
              {id: 'expense', label: 'খরচ'},
              {id: 'transfer', label: 'সমন্বয়'},
              {id: 'salary', label: 'মাসিক আয়'},
            ] as const
          ).map((tab) => {
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 lg:max-w-2xl">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিবরণ খুঁজুন..."
              aria-label="খরচের তালিকা খুঁজুন"
              className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <select
            aria-label="মাস ও বছর ফিল্টার"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="min-h-[42px] px-3 py-2 text-sm bg-[#080d1a] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="all" className="bg-[#0b1120]">
              সকল মাস ও বছর
            </option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym} className="bg-[#0b1120]">
                {formatBengaliMonth(ym)}
              </option>
            ))}
          </select>

          <select
            aria-label="ভল্ট ফিল্টার"
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value as 'all' | BucketId)}
            className="min-h-[42px] px-3 py-2 text-sm bg-[#080d1a] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="all" className="bg-[#0b1120]">
              সকল ভল্ট
            </option>
            {BUCKET_LIST.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0b1120]">
                {b.orderLabel} {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-medium text-slate-300">
          <span>
            মোট পাওয়া গেছে:{' '}
            <strong className="text-white font-num">
              {formatNumber(filtered.length)}টি
            </strong>{' '}
            লেনদেন
          </span>
          <span>
            এই তালিকায় মোট খরচ:{' '}
            <strong className="text-amber-300 font-num">
              {formatBDT(filteredExpenseSum, privacyMasked)}
            </strong>
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6 py-12 text-center border-t border-white/10">
          <p className="text-sm font-semibold text-slate-300 leading-[1.5]">
            কোনো লেনদেন পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-white/10 text-xs font-bold text-slate-300">
                <th className="py-3 pr-4">তারিখ</th>
                <th className="py-3 px-4">ভল্ট</th>
                <th className="py-3 px-4">বিবরণ / নোট</th>
                <th className="py-3 px-4 text-right">পরিমাণ (৳)</th>
                <th className="py-3 pl-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {filtered.map((tx) => {
                const amtText =
                  tx.type === 'salary'
                    ? `+${formatBDT(tx.amount, privacyMasked)}`
                    : tx.type === 'transfer'
                      ? formatBDT(tx.amount, privacyMasked)
                      : `-${formatBDT(tx.amount, privacyMasked)}`;

                const amtColor =
                  tx.type === 'salary'
                    ? 'text-emerald-400'
                    : tx.type === 'transfer'
                      ? 'text-violet-300'
                      : 'text-amber-300';

                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 pr-4 text-slate-300 whitespace-nowrap font-num">
                      {formatBengaliDate(tx.date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {getBucketDisplay(tx)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">{tx.note}</td>
                    <td className={`py-3.5 px-4 text-right font-bold font-num whitespace-nowrap ${amtColor}`}>
                      {amtText}
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>মুছুন</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

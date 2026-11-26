import {ArrowLeftRight, Home, PiggyBank, Trash2, Utensils, Wallet} from 'lucide-react';
import {BUCKET_BY_ID, BucketId, TransactionRecord} from '../types/budget';
import {formatBDT, formatBengaliDate} from '../utils/format';

interface RecentTransactionsPanelProps {
  transactions: TransactionRecord[];
  privacyMasked: boolean;
  onDeleteTransaction: (id: string) => void;
  onViewAllHistory: () => void;
}

function VaultIcon({bucketId, type}: {bucketId: BucketId; type: TransactionRecord['type']}) {
  if (type === 'transfer') {
    return (
      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-300 flex items-center justify-center shrink-0">
        <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (bucketId === 'home') {
    return (
      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-300 flex items-center justify-center shrink-0">
        <Home className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (bucketId === 'officeFood') {
    return (
      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
        <Utensils className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (bucketId === 'savings') {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
        <PiggyBank className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
      <Wallet className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}

export function RecentTransactionsPanel({
  transactions,
  privacyMasked,
  onDeleteTransaction,
  onViewAllHistory,
}: RecentTransactionsPanelProps) {
  const recent = transactions.slice(0, 5);

  const getVaultLabel = (tx: TransactionRecord): string => {
    if (tx.type === 'salary') return 'মাসিক আয় বণ্টন';
    if (tx.type === 'transfer' && tx.toBucketId) {
      return `${BUCKET_BY_ID[tx.bucketId].shortName} → ${BUCKET_BY_ID[tx.toBucketId].shortName}`;
    }
    return BUCKET_BY_ID[tx.bucketId].name;
  };

  return (
    <section
      aria-label="সাম্প্রতিক লেনদেন"
      className="h-full rounded-2xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white leading-[1.5]">
            সাম্প্রতিক লেনদেন
          </h2>
          <p className="text-xs font-medium text-slate-300 leading-[1.5]">
            মুছে দিলে ব্যয়কৃত টাকা ভল্টে ফেরত যাবে
          </p>
        </div>

        {transactions.length > 0 && (
          <button
            type="button"
            onClick={onViewAllHistory}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline whitespace-nowrap cursor-pointer"
          >
            সব দেখুন
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-semibold text-slate-300 leading-[1.5]">
            এখনো কোনো লেনদেন নেই
          </p>
          <p className="text-xs text-slate-400 leading-[1.5] mt-1">
            বাম পাশের ফর্ম বা ভল্টের কুইক বাটন ব্যবহার করে লেনদেন যোগ করুন।
          </p>
        </div>
      ) : (
        <div className="mt-2 divide-y divide-white/10 flex-1">
          {recent.map((tx) => {
            const amountText =
              tx.type === 'salary'
                ? `+${formatBDT(tx.amount, privacyMasked)}`
                : tx.type === 'transfer'
                  ? formatBDT(tx.amount, privacyMasked)
                  : `-${formatBDT(tx.amount, privacyMasked)}`;

            const amountColor =
              tx.type === 'salary'
                ? 'text-emerald-400'
                : tx.type === 'transfer'
                  ? 'text-violet-300'
                  : 'text-amber-300';

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <VaultIcon bucketId={tx.bucketId} type={tx.type} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white leading-[1.5] truncate">
                      {tx.note}
                    </div>
                    <div className="text-xs font-medium text-slate-300 leading-[1.5] flex flex-wrap items-center gap-x-1.5">
                      <span>{getVaultLabel(tx)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-num">{formatBengaliDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold font-num ${amountColor}`}>
                    {amountText}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(tx.id)}
                    aria-label={`${tx.note} মুছুন`}
                    title="মুছুন ও ভল্টে ফেরত দিন"
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

import {ArrowRight, CheckCircle2, Handshake, PlusCircle, Trash2} from 'lucide-react';
import {useState} from 'react';
import {LoanRecord, LoanType, VaultConfigMap} from '../types/budget';
import {formatBDT, formatBengaliDate, formatNumber, getTodayISODate} from '../utils/format';

interface LoansSummaryWidgetProps {
  loans: LoanRecord[];
  privacyMasked: boolean;
  onOpenLoansView: () => void;
}

export function LoansSummaryWidget({
  loans,
  privacyMasked,
  onOpenLoansView,
}: LoansSummaryWidgetProps) {
  const activeReceivable = loans
    .filter((l) => !l.settled && l.type === 'receivable')
    .reduce((acc, l) => acc + l.amount, 0);
  const activePayable = loans
    .filter((l) => !l.settled && l.type === 'payable')
    .reduce((acc, l) => acc + l.amount, 0);
  const activeCount = loans.filter((l) => !l.settled).length;

  return (
    <section
      aria-label="বকেয়া ও ধার-দেনা সারাংশ"
      className="rounded-2xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-400/35 text-violet-300 flex items-center justify-center shrink-0">
          <Handshake className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white leading-[1.5]">
            বকেয়া ও ধার-দেনা ট্র্যাকার
          </h2>
          <p className="text-xs font-medium text-slate-300 leading-[1.5]">
            {activeCount > 0
              ? `চলমান ${formatNumber(activeCount)}টি হিসাব (মূল ৪ ভল্ট থেকে আলাদা)`
              : 'বন্ধু বা সহকর্মীদের সাথে পাওনা ও দেনার হিসাব আলাদা রাখুন'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div>
          <span className="text-xs font-medium text-slate-300 block">মোট পাওনা</span>
          <span className="text-base font-bold text-emerald-300 font-num">
            {formatBDT(activeReceivable, privacyMasked)}
          </span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-300 block">মোট দেনা</span>
          <span className="text-base font-bold text-rose-300 font-num">
            {formatBDT(activePayable, privacyMasked)}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenLoansView}
          className="min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-violet-200 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <span>ধার-দেনা দেখুন</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

interface LoansViewProps {
  loans: LoanRecord[];
  vaultConfig: VaultConfigMap;
  privacyMasked: boolean;
  onAddLoan: (payload: {
    type: LoanType;
    personName: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
  onSettleLoan: (loanId: string, targetVaultId: 'savings' | 'personal' | 'none') => void;
  onDeleteLoan: (loanId: string) => void;
}

export function LoansView({
  loans,
  vaultConfig,
  privacyMasked,
  onAddLoan,
  onSettleLoan,
  onDeleteLoan,
}: LoansViewProps) {
  const [loanType, setLoanType] = useState<LoanType>('receivable');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayISODate());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const [settlingLoan, setSettlingLoan] = useState<LoanRecord | null>(null);

  const activeReceivable = loans
    .filter((l) => !l.settled && l.type === 'receivable')
    .reduce((acc, l) => acc + l.amount, 0);
  const activePayable = loans
    .filter((l) => !l.settled && l.type === 'payable')
    .reduce((acc, l) => acc + l.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.round(Number(amount));
    if (!personName.trim()) {
      setError('দয়া করে ব্যক্তির নাম লিখুন।');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('দয়া করে ০-এর চেয়ে বেশি টাকার পরিমাণ লিখুন।');
      return;
    }

    onAddLoan({
      type: loanType,
      personName: personName.trim(),
      amount: numericAmount,
      date: date || getTodayISODate(),
      note: note.trim(),
    });

    setPersonName('');
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#0e1629]/85 border border-emerald-500/35 p-5">
          <span className="text-xs font-semibold text-slate-300 block">
            মোট পাওনা টাকা (পাবেন)
          </span>
          <span className="text-2xl font-bold text-emerald-300 font-num mt-1 block">
            {formatBDT(activeReceivable, privacyMasked)}
          </span>
        </div>

        <div className="rounded-2xl bg-[#0e1629]/85 border border-rose-500/35 p-5">
          <span className="text-xs font-semibold text-slate-300 block">
            মোট দেনা টাকা (দিবেন)
          </span>
          <span className="text-2xl font-bold text-rose-300 font-num mt-1 block">
            {formatBDT(activePayable, privacyMasked)}
          </span>
        </div>

        <div className="rounded-2xl bg-[#0e1629]/85 border border-cyan-500/35 p-5">
          <span className="text-xs font-semibold text-slate-300 block">
            নিট পাওনা-দেনা অবস্থান
          </span>
          <span
            className={`text-2xl font-bold font-num mt-1 block ${
              activeReceivable - activePayable >= 0 ? 'text-cyan-300' : 'text-amber-300'
            }`}
          >
            {formatBDT(activeReceivable - activePayable, privacyMasked)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add Loan Form */}
        <section
          aria-label="নতুন ধার বা পাওনা যোগ করুন"
          className="lg:col-span-5 rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6"
        >
          <div className="pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white leading-[1.5]">
              বকেয়া ও ধার-দেনা যোগ করুন
            </h2>
            <p className="text-xs font-medium text-slate-300 leading-[1.5]">
              এটি আপনার মাসিক ৪টি বেতন ভল্ট থেকে আলাদা হিসেবে সংরক্ষিত থাকবে
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#080d1a] border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setLoanType('receivable')}
                className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  loanType === 'receivable'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                পাওনা টাকা (দিলাম)
              </button>
              <button
                type="button"
                onClick={() => setLoanType('payable')}
                className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  loanType === 'payable'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                দেনা টাকা (নিলাম)
              </button>
            </div>

            <div>
              <label
                htmlFor="loan-person"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                ব্যক্তির নাম
              </label>
              <input
                id="loan-person"
                type="text"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setError('');
                }}
                placeholder="যেমন: করিম ভাই, সহকর্মী রাকিব"
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="loan-amount"
                  className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                >
                  পরিমাণ (৳)
                </label>
                <input
                  id="loan-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  placeholder="যেমন: ১০০০"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label
                  htmlFor="loan-date"
                  className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                >
                  তারিখ
                </label>
                <input
                  id="loan-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white font-num focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="loan-note"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                বিবরণ / নোট (ঐচ্ছিক)
              </label>
              <input
                id="loan-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: অফিসে নাস্তার বিল বা জরুরি ধার"
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#080d1a] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>হিসাব যোগ করুন</span>
            </button>
          </form>
        </section>

        {/* Loans List */}
        <section
          aria-label="ধার-দেনার তালিকা"
          className="lg:col-span-7 rounded-3xl bg-[#0e1629]/85 backdrop-blur-md border border-white/10 p-5 sm:p-6"
        >
          <div className="pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white leading-[1.5]">
              বকেয়া ও ধার-দেনার তালিকা
            </h2>
            <p className="text-xs font-medium text-slate-300 leading-[1.5]">
              পাওনা টাকা পরিশোধিত হলে সরাসরি মূল সঞ্চয় বা হাতখরচ ভল্টে যোগ করতে পারবেন
            </p>
          </div>

          {loans.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-300">
                এখনো কোনো পাওনা বা দেনার হিসাব যোগ করা হয়নি।
              </p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-white/10">
              {loans.map((loan) => {
                const isReceivable = loan.type === 'receivable';
                return (
                  <div
                    key={loan.id}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      loan.settled ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white leading-[1.5]">
                          {loan.personName}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isReceivable ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          · {isReceivable ? 'পাওনা টাকা' : 'দেনা টাকা'}
                        </span>
                        {loan.settled && (
                          <span className="text-xs font-semibold text-cyan-300">
                            · ✔ পরিশোধিত
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-medium text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span className="font-num">{formatBengaliDate(loan.date)}</span>
                        {loan.note && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{loan.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <span
                        className={`text-base font-bold font-num ${
                          isReceivable ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {formatBDT(loan.amount, privacyMasked)}
                      </span>

                      {!loan.settled && (
                        <button
                          type="button"
                          onClick={() => {
                            if (loan.type === 'receivable') {
                              setSettlingLoan(loan);
                            } else {
                              onSettleLoan(loan.id, 'none');
                            }
                          }}
                          className="min-h-[36px] px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>✔ পরিশোধিত (Settled)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteLoan(loan.id)}
                        aria-label={`${loan.personName} মুছুন`}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
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
      </div>

      {/* Settle Receivable Vault Selection Modal */}
      {settlingLoan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settle-loan-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#0b1324] border border-emerald-400/35 p-6 shadow-[0_0_45px_rgba(16,185,129,0.2)]">
            <h3
              id="settle-loan-title"
              className="text-lg font-bold text-white leading-[1.5]"
            >
              আদায়কৃত টাকা কোন ভল্টে যোগ করবেন?
            </h3>
            <p className="text-sm font-medium text-slate-300 leading-[1.5] mt-1">
              {settlingLoan.personName}-এর কাছ থেকে পাওয়া{' '}
              <strong className="text-emerald-300 font-num">
                {formatBDT(settlingLoan.amount, privacyMasked)}
              </strong>{' '}
              সরাসরি আপনার ভল্টে যুক্ত করতে নিচের যেকোনো একটি অপশন বেছে নিন:
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onSettleLoan(settlingLoan.id, 'savings');
                  setSettlingLoan(null);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl transition-all cursor-pointer"
              >
                ৩. {vaultConfig.savings.name}-এ যোগ করুন
              </button>

              <button
                type="button"
                onClick={() => {
                  onSettleLoan(settlingLoan.id, 'personal');
                  setSettlingLoan(null);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 text-sm font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl transition-colors cursor-pointer"
              >
                ৪. {vaultConfig.personal.name}-এ যোগ করুন
              </button>

              <button
                type="button"
                onClick={() => {
                  onSettleLoan(settlingLoan.id, 'none');
                  setSettlingLoan(null);
                }}
                className="w-full min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                শুধু পরিশোধিত হিসেবে চিহ্নিত করুন (ভল্টে যোগ নয়)
              </button>

              <button
                type="button"
                onClick={() => setSettlingLoan(null)}
                className="w-full min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

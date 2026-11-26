import {Plus, Trash2, X} from 'lucide-react';
import {useState} from 'react';
import {
  BUCKET_BY_ID,
  BucketId,
  CustomVaultConfig,
  deriveShortName,
} from '../types/budget';
import {formatNumber} from '../utils/format';

interface VaultEditModalProps {
  isOpen: boolean;
  bucketId: BucketId | null;
  vaultConfig: CustomVaultConfig | null;
  onClose: () => void;
  onSave: (bucketId: BucketId, nextConfig: CustomVaultConfig) => void;
}

export function VaultEditModal({
  isOpen,
  bucketId,
  vaultConfig,
  onClose,
  onSave,
}: VaultEditModalProps) {
  const [name, setName] = useState(vaultConfig?.name ?? '');
  const [amounts, setAmounts] = useState<string[]>(
    vaultConfig?.quickAmounts?.map((n) => String(n)) ?? []
  );
  const [newChipInput, setNewChipInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !bucketId || !vaultConfig) return null;

  const orderLabel = BUCKET_BY_ID[bucketId].orderLabel;

  const handleAddChip = () => {
    const val = Math.round(Number(newChipInput));
    if (!Number.isFinite(val) || val <= 0) {
      setError('০-এর চেয়ে বেশি টাকার পরিমাণ লিখুন।');
      return;
    }
    if (amounts.length >= 4) {
      setError('সর্বোচ্চ ৪টি কুইক বাটন রাখা যাবে।');
      return;
    }
    setAmounts((prev) => [...prev, String(val)]);
    setNewChipInput('');
    setError('');
  };

  const handleUpdateChip = (index: number, raw: string) => {
    setAmounts((prev) => prev.map((item, idx) => (idx === index ? raw : item)));
    setError('');
  };

  const handleRemoveChip = (index: number) => {
    setAmounts((prev) => prev.filter((_, idx) => idx !== index));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('দয়া করে ভল্টের নাম লিখুন।');
      return;
    }

    const parsedQuick = amounts
      .map((a) => Math.round(Number(a)))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 4);

    onSave(bucketId, {
      name: trimmed,
      shortName: deriveShortName(trimmed),
      quickAmounts: parsedQuick,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0b1324] border border-emerald-400/30 shadow-[0_0_45px_rgba(16,185,129,0.2)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2
              id="vault-edit-title"
              className="text-lg font-bold text-white leading-[1.5]"
            >
              {orderLabel} ভল্ট কাস্টমাইজ করুন
            </h2>
            <p className="text-xs font-medium text-slate-300 leading-[1.5]">
              ভল্টের নাম ও দ্রুত খরচ বিয়োগের বাটন পরিবর্তন করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="vault-edit-name"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              ভল্টের নাম
            </label>
            <input
              id="vault-edit-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="যেমন: বাজার খরচ, গাড়ির তেল"
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-200 leading-[1.5]">
                কুইক খরচ বাটন (এক ক্লিকে বিয়োগ)
              </span>
              <span className="text-xs text-slate-400 font-num">
                {formatNumber(amounts.length)} / ৪টি
              </span>
            </div>

            {amounts.length > 0 && (
              <div className="space-y-2 mb-3">
                {amounts.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-300">
                        -৳
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={val}
                        onChange={(e) => handleUpdateChip(idx, e.target.value)}
                        aria-label={`কুইক বাটন ${idx + 1}`}
                        className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white font-num focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChip(idx)}
                      aria-label="বাটন মুছুন"
                      className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {amounts.length < 4 && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={newChipInput}
                  onChange={(e) => {
                    setNewChipInput(e.target.value);
                    setError('');
                  }}
                  placeholder="নতুন অংক (যেমন: ১৫০)"
                  aria-label="নতুন কুইক বাটন পরিমাণ"
                  className="flex-1 min-h-[42px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-sm text-white font-num placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleAddChip}
                  className="min-h-[42px] px-3.5 py-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>যোগ</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

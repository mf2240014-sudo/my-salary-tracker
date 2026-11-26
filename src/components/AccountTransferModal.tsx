import {
  Check,
  Copy,
  Download,
  KeyRound,
  Lock,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import {useState} from 'react';
import {LocalAccountRecord} from '../types/budget';
import {generateAccountSyncCode, verifyPassword} from '../utils/cryptoSync';
import {getTodayISODate} from '../utils/format';

interface AccountTransferModalProps {
  isOpen: boolean;
  account: LocalAccountRecord;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function AccountTransferModal({
  isOpen,
  account,
  onClose,
  onToast,
}: AccountTransferModalProps) {
  const requiresExistingPassword = Boolean(account.passwordHash);
  const [transferUsername, setTransferUsername] = useState(
    account.isGuest ? 'my_vault' : account.displayUsername
  );
  const [password, setPassword] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalUser = requiresExistingPassword
      ? account.displayUsername
      : transferUsername.trim();

    if (finalUser.length < 3) {
      setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return;
    }
    if (password.length < 4) {
      setError('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন (এটি দিয়েই অন্য ডিভাইসে আনলক করতে হবে)।');
      return;
    }

    setIsGenerating(true);
    try {
      if (requiresExistingPassword) {
        const matches = await verifyPassword(password, account.passwordHash);
        if (!matches) {
          setError('আপনার বর্তমান অ্যাকাউন্টের পাসওয়ার্ড সঠিক নয়।');
          setIsGenerating(false);
          return;
        }
      }

      const code = await generateAccountSyncCode({
        username: finalUser,
        displayUsername: finalUser,
        password,
        state: account.state,
      });
      setSyncCode(code);
      setCopied(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'সিঙ্ক কোড তৈরি করতে সমস্যা হয়েছে।'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      onToast('এনক্রিপ্টেড সিঙ্ক কোড ক্লিপবোর্ডে কপি হয়েছে!');
    } catch {
      onToast('কপি করতে সমস্যা হয়েছে — টেক্সট বক্স থেকে কোডটি কপি করুন।');
    }
  };

  const handleDownloadTxt = () => {
    if (!syncCode) return;
    const content = [
      'Orbital Wealth Vault — Encrypted Portable Account Sync Code',
      `Username: ${requiresExistingPassword ? account.displayUsername : transferUsername.trim()}`,
      `Date: ${getTodayISODate()}`,
      '',
      'Paste the code below inside "Restore Account" on any browser or phone with your username & password:',
      '',
      syncCode,
    ].join('\n');

    const blob = new Blob([content], {type: 'text/plain;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbital-vault-sync-${getTodayISODate()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('সিঙ্ক কোড ফাইল (.txt) ডাউনলোড হয়েছে।');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#0b1324] border border-cyan-400/35 shadow-[0_0_55px_rgba(6,182,212,0.22)] p-5 sm:p-6 my-auto">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="transfer-modal-title"
                className="text-lg font-bold text-white leading-[1.5]"
              >
                📲 অ্যাকাউন্ট ট্রান্সফার / সিঙ্ক কোড
              </h2>
              <p className="text-xs font-medium text-slate-300 leading-[1.5]">
                অন্য যেকোনো ফোন বা Google Chrome প্রোফাইলে আপনার সম্পূর্ণ অ্যাকাউন্ট নিয়ে যান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/25 p-3.5 flex items-start gap-2.5 text-xs font-medium text-emerald-200 leading-[1.6]">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              আপনার সকল ভল্ট, মাসিক আয়, খরচ ও ধার-দেনার হিসাব <strong>AES-256-GCM</strong> পাসওয়ার্ড এনক্রিপশনের মাধ্যমে নিরাপদ সিঙ্ক কোডে রূপান্তরিত হবে।
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            {requiresExistingPassword ? (
              <div className="rounded-xl bg-[#070b14] border border-white/10 px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">অ্যাকাউন্ট ইউজারনেম</span>
                <span className="font-bold text-cyan-300">@{account.displayUsername}</span>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="sync-username-input"
                  className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                >
                  সিঙ্ক করার জন্য ইউজারনেম সেট করুন
                </label>
                <input
                  id="sync-username-input"
                  type="text"
                  value={transferUsername}
                  onChange={(e) => {
                    setTransferUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="sync-password-input"
                className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
              >
                {requiresExistingPassword
                  ? 'নিরাপত্তা যাচাইয়ের জন্য আপনার পাসওয়ার্ড দিন'
                  : 'এনক্রিপশন পাসওয়ার্ড সেট করুন (কমপক্ষে ৪ অক্ষর)'}
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="sync-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-2 rounded-xl"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full min-h-[46px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-[#041210] bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              <span>
                {isGenerating
                  ? 'এনক্রিপ্টেড কোড তৈরি হচ্ছে...'
                  : 'এনক্রিপ্টেড সিঙ্ক কোড তৈরি করুন'}
              </span>
            </button>
          </form>

          {syncCode && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <label
                htmlFor="generated-sync-code"
                className="block text-xs font-bold text-emerald-300"
              >
                আপনার সুরক্ষিত সিঙ্ক কোড (কপি বা ফাইল হিসেবে সংরক্ষণ করুন):
              </label>
              <textarea
                id="generated-sync-code"
                readOnly
                rows={4}
                value={syncCode}
                onClick={(e) => e.currentTarget.select()}
                className="w-full px-3.5 py-2.5 bg-[#070b14] border border-emerald-400/40 rounded-xl text-xs font-mono text-emerald-200 focus:outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/45 rounded-xl transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>কোড কপি করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>ফাইল সেভ (.txt)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

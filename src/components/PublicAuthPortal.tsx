import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  UserPlus,
} from 'lucide-react';
import {useRef, useState} from 'react';
import {LocalAccountRecord} from '../types/budget';
import {PublicFooter} from './PublicFooter';

type AuthTab = 'register' | 'login' | 'restore';

interface PublicAuthPortalProps {
  savedAccounts: LocalAccountRecord[];
  onRegister: (payload: {
    username: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  onLogin: (payload: {username: string; password: string}) => Promise<void>;
  onRestoreFromSyncCode: (payload: {
    syncCode: string;
    username: string;
    password: string;
  }) => Promise<void>;
  onEnterGuestMode: () => void;
}

export function PublicAuthPortal({
  savedAccounts,
  onRegister,
  onLogin,
  onRestoreFromSyncCode,
  onEnterGuestMode,
}: PublicAuthPortalProps) {
  const realAccounts = savedAccounts.filter((a) => !a.isGuest);
  const [activeTab, setActiveTab] = useState<AuthTab>(
    realAccounts.length > 0 ? 'login' : 'register'
  );

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Login state
  const [loginUsername, setLoginUsername] = useState(
    realAccounts[0]?.displayUsername ?? ''
  );
  const [loginPassword, setLoginPassword] = useState('');

  // Restore state
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreUsername, setRestoreUsername] = useState('');
  const [restorePassword, setRestorePassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const syncFileRef = useRef<HTMLInputElement | null>(null);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = regUsername.trim();
    if (!regName.trim()) {
      setError('দয়া করে আপনার নাম লিখুন।');
      return;
    }
    if (cleanUser.length < 3) {
      setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (যেমন: tanvir বা rahim_bd)।');
      return;
    }
    if (regPassword.length < 4) {
      setError('নিরাপত্তার জন্য কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন।');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না। দয়া করে আবার যাচাই করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        username: cleanUser,
        displayName: regName.trim(),
        password: regPassword,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginUsername.trim()) {
      setError('দয়া করে আপনার ইউজারনেম লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin({
        username: loginUsername.trim(),
        password: loginPassword,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'লগইন করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!restoreCode.trim()) {
      setError('দয়া করে অন্য ডিভাইস থেকে পাওয়া অ্যাকাউন্ট ট্রান্সফার / সিঙ্ক কোডটি পেস্ট করুন।');
      return;
    }
    if (!restoreUsername.trim() || !restorePassword) {
      setError('সিঙ্ক কোড আনলক করতে আপনার ইউজারনেম এবং পাসওয়ার্ড দিন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRestoreFromSyncCode({
        syncCode: restoreCode.trim(),
        username: restoreUsername.trim(),
        password: restorePassword,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'সিঙ্ক কোড থেকে অ্যাকাউন্ট আনা যায়নি।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const match = reader.result.match(/OWV1\.[A-Za-z0-9_-]+/);
        setRestoreCode(match ? match[0] : reader.result.trim());
        setError('');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient Radial Glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-36 left-1/5 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-1/3 right-1/6 w-[440px] h-[440px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Open Public Welcome & Guest Mode */}
          <section className="lg:col-span-6 flex flex-col justify-between rounded-3xl bg-[#0b1324]/85 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
            <div className="space-y-5">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/15 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white leading-[1.4]">
                  অরবিটাল ওয়েলথ ভল্ট
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold text-emerald-300 leading-[1.5]">
                  সবার জন্য উন্মুক্ত — নিজস্ব অ্যাকাউন্ট তৈরি করুন
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35] text-balance">
                  নিজের স্যালারি, ৪টি ভল্ট ও দৈনিক হিসাব — সম্পূর্ণ আপনার নিয়ন্ত্রণে
                </h1>
                <p className="text-sm font-medium text-slate-300 leading-[1.6]">
                  কোনো কেন্দ্রীয় সার্ভার বা থার্ড-পার্টি ট্র্যাকিং ছাড়াই সম্পূর্ণ আপনার ব্রাউজারে অ্যাকাউন্ট তৈরি করুন এবং এনক্রিপ্টেড সিঙ্ক কোডের মাধ্যমে যেকোনো ফোন বা ব্রাউজারে ব্যবহার করুন।
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm font-medium text-slate-200 leading-[1.6]">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>একই ডিভাইসে একাধিক স্বাধীন অ্যাকাউন্ট তৈরি ও সহজে পরিবর্তন করার সুবিধা</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-cyan-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>পাসওয়ার্ড-সুরক্ষিত এনক্রিপ্টেড সিঙ্ক কোড দিয়ে যেকোনো Chrome বা ফোনে রিস্টোর</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>অফলাইনে কাজ করে — এআই স্মার্ট মাসিক রিপোর্ট, ধার-দেনা ও সঞ্চয় লক্ষ্য ট্র্যাকার</span>
                </li>
              </ul>
            </div>

            {/* Instant Guest / Demo Mode CTA */}
            <div className="mt-7 pt-5 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={onEnterGuestMode}
                className="w-full min-h-[48px] px-5 py-3 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.18)] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>অতিথি হিসেবে দেখুন (Guest / Demo Mode)</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
              <p className="text-xs text-slate-400 text-center leading-[1.5]">
                অ্যাকাউন্ট খোলার আগেই এক ক্লিকে ডেমো ড্যাশবোর্ড ঘুরে দেখুন
              </p>
            </div>
          </section>

          {/* Right Column: Register / Login / Portable Restore */}
          <section className="lg:col-span-6 rounded-3xl bg-[#0b1324]/90 backdrop-blur-xl border border-emerald-400/25 shadow-[0_0_50px_rgba(16,185,129,0.14)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Segmented Tabs */}
              <div
                role="tablist"
                aria-label="অ্যাকাউন্ট অ্যাক্সেস অপশন"
                className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#070b14] border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  onClick={() => switchTab('register')}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/45'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">নতুন অ্যাকাউন্ট</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  onClick={() => switchTab('login')}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/45'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">লগইন করুন</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'restore'}
                  onClick={() => switchTab('restore')}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'restore'
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/45'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">রিস্টোর</span>
                </button>
              </div>

              {/* TAB 1: Register New Independent Account */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white leading-[1.5]">
                      নতুন ফ্রি অ্যাকাউন্ট তৈরি করুন
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
                      তৈরির পরের ধাপে আপনার বেতন ও ৪টি ভল্ট কাস্টমাইজ করতে পারবেন
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      আপনার পূর্ণ নাম
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        setError('');
                      }}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-username"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      ইউজারনেম (অ্যাকাউন্ট আইডি)
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      autoComplete="username"
                      value={regUsername}
                      onChange={(e) => {
                        setRegUsername(e.target.value);
                        setError('');
                      }}
                      placeholder="যেমন: tanvir_bd"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                      >
                        পাসওয়ার্ড
                      </label>
                      <div className="relative">
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            setError('');
                          }}
                          placeholder="কমপক্ষে ৪ অক্ষর"
                          className="w-full min-h-[44px] pl-3.5 pr-10 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                      >
                        পাসওয়ার্ড নিশ্চিত করুন
                      </label>
                      <input
                        id="reg-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="পুনরায় লিখুন"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>{isSubmitting ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: Login to Existing Local Accounts */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white leading-[1.5]">
                      আপনার অ্যাকাউন্টে লগইন করুন
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
                      এই ডিভাইসে সংরক্ষিত যেকোনো অ্যাকাউন্টে প্রবেশ করুন
                    </p>
                  </div>

                  {realAccounts.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-xs font-semibold text-emerald-300">
                        এই ডিভাইসে সংরক্ষিত অ্যাকাউন্টসমূহ (ক্লিক করে বেছে নিন):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {realAccounts.map((acc) => {
                          const selected =
                            loginUsername.trim().toLowerCase() === acc.username;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setLoginUsername(acc.displayUsername);
                                setError('');
                              }}
                              className={`min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-emerald-500/18 border-emerald-400/50 text-white'
                                  : 'bg-[#070b14] border-white/10 text-slate-200 hover:border-white/25'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">
                                  {acc.state.profile.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  @{acc.displayUsername}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="login-username"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      ইউজারনেম
                    </label>
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        setError('');
                      }}
                      placeholder="আপনার ইউজারনেম লিখুন"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      পাসওয়ার্ড
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="আপনার পাসওয়ার্ড দিন"
                        className="w-full min-h-[44px] pl-3.5 pr-10 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>{isSubmitting ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}</span>
                  </button>
                </form>
              )}

              {/* TAB 3: Restore Account from Another Device / Browser */}
              {activeTab === 'restore' && (
                <form onSubmit={handleRestoreSubmit} className="mt-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white leading-[1.5]">
                        অন্য ডিভাইস/ব্রাউজার থেকে অ্যাকাউন্ট আনুন (Restore Account)
                      </h2>
                      <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5]">
                        আগের ডিভাইসের এনক্রিপ্টেড সিঙ্ক কোড + ইউজারনেম ও পাসওয়ার্ড দিয়ে আনলক করুন
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => syncFileRef.current?.click()}
                      className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 rounded-xl shrink-0 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>ফাইল (.txt)</span>
                    </button>
                    <input
                      ref={syncFileRef}
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleSyncFileUpload}
                      className="hidden"
                      aria-label="সিঙ্ক কোড টেক্সট ফাইল নির্বাচন করুন"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="restore-code"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      অ্যাকাউন্ট ট্রান্সফার / সিঙ্ক কোড
                    </label>
                    <textarea
                      id="restore-code"
                      rows={3}
                      value={restoreCode}
                      onChange={(e) => {
                        setRestoreCode(e.target.value);
                        setError('');
                      }}
                      placeholder="এখানে আপনার OWV1... সিঙ্ক কোডটি পেস্ট করুন"
                      className="w-full px-3.5 py-2.5 bg-[#070b14] border border-white/15 rounded-xl text-xs font-mono text-cyan-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="restore-username"
                        className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                      >
                        ইউজারনেম
                      </label>
                      <input
                        id="restore-username"
                        type="text"
                        value={restoreUsername}
                        onChange={(e) => {
                          setRestoreUsername(e.target.value);
                          setError('');
                        }}
                        placeholder="আপনার ইউজারনেম"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="restore-password"
                        className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                      >
                        পাসওয়ার্ড
                      </label>
                      <input
                        id="restore-password"
                        type={showPassword ? 'text' : 'password'}
                        value={restorePassword}
                        onChange={(e) => {
                          setRestorePassword(e.target.value);
                          setError('');
                        }}
                        placeholder="অ্যাকাউন্টের পাসওয়ার্ড"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#041210] bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl shadow-[0_0_24px_rgba(6,182,212,0.3)] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {isSubmitting
                        ? 'ডিক্রিপ্ট ও আনলক হচ্ছে...'
                        : 'অ্যাকাউন্ট আনুন ও লগইন করুন'}
                    </span>
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 text-center leading-[1.5]">
              কোনো ইমেইল ভেরিফিকেশন বা ক্লাউড ট্র্যাকিং ছাড়াই সম্পূর্ণ নিরাপদ ও স্বাধীন ব্যবহার।
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

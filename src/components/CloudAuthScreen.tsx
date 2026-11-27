import {
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import {useState} from 'react';
import {
  loginWithEmail,
  loginWithGooglePopup,
  mapFirebaseAuthError,
  registerWithEmail,
  sendResetPasswordEmail,
} from '../firebase';
import {PublicFooter} from './PublicFooter';

type AuthMode = 'login' | 'register';

interface CloudAuthScreenProps {
  onEnterGuestMode: () => void;
}

export function CloudAuthScreen({onEnterGuestMode}: CloudAuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setInfoMessage('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    setIsGoogleLoading(true);
    try {
      await loginWithGooglePopup();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('দয়া করে একটি সঠিক ইমেইল ঠিকানা লিখুন।');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('নিরাপত্তার জন্য পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।');
        return;
      }
      if (password !== confirmPassword) {
        setError('পাসওয়ার্ড দুটি মিলছে না। দয়া করে আবার যাচাই করুন।');
        return;
      }

      setIsEmailLoading(true);
      try {
        await registerWithEmail(trimmedEmail, password, name.trim());
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setIsEmailLoading(false);
      }
      return;
    }

    if (!password) {
      setError('দয়া করে আপনার পাসওয়ার্ড দিন।');
      return;
    }

    setIsEmailLoading(true);
    try {
      await loginWithEmail(trimmedEmail, password);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfoMessage('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('পাসওয়ার্ড রিসেট লিংক পেতে আগে উপরের ঘরে আপনার ইমেইল ঠিকানাটি লিখুন।');
      return;
    }

    setIsResetLoading(true);
    try {
      await sendResetPasswordEmail(trimmedEmail);
      setInfoMessage(
        `${trimmedEmail} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`
      );
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsResetLoading(false);
    }
  };

  const busy = isGoogleLoading || isEmailLoading || isResetLoading;

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

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Cloud Welcome & Guest Demo */}
          <section className="lg:col-span-6 flex flex-col justify-between rounded-3xl bg-[#0b1324]/85 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
            <div className="space-y-5">
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
                  অরবিটাল ওয়েলথ ভল্ট — ক্লাউড লগইন
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-[1.35] text-balance">
                  আপনার স্যালারি, ৪টি ভল্ট ও দৈনিক হিসাব — এখন রিয়েল-টাইম ক্লাউড সিঙ্কে
                </h1>
                <p className="text-sm font-medium text-slate-300 leading-[1.6]">
                  একবার Google বা ইমেইল দিয়ে লগইন করলেই মোবাইল, ল্যাপটপ কিংবা যেকোনো Chrome ব্রাউজারে আপনার সম্পূর্ণ হিসাব স্বয়ংক্রিয়ভাবে সিঙ্ক থাকবে।
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm font-medium text-slate-200 leading-[1.6]">
                <li className="flex items-start gap-2.5">
                  <Cloud className="w-4 h-4 text-cyan-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>যেকোনো ফোন বা কম্পিউটার থেকে লগইন করলেই সাথে সাথে আপনার সকল ভল্ট লোড হবে</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>Firebase Cloud Auth &amp; Firestore দ্বারা আপনার নিজস্ব অ্যাকাউন্ট সুরক্ষিত</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-1" aria-hidden="true" />
                  <span>এআই স্মার্ট মাসিক রিপোর্ট, সঞ্চয় লক্ষ্য, ধার-দেনা ও CSV/JSON ব্যাকআপ</span>
                </li>
              </ul>
            </div>

            {/* Guest / Demo Mode Button */}
            <div className="mt-7 pt-5 border-t border-white/10 space-y-2.5">
              <button
                type="button"
                onClick={onEnterGuestMode}
                className="w-full min-h-[48px] px-5 py-3 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.18)] transition-all cursor-pointer"
              >
                <span>👀 অতিথি হিসেবে ডেমো দেখুন</span>
              </button>
              <p className="text-xs text-slate-400 text-center leading-[1.5]">
                লগইন ছাড়াই এক ক্লিকে সম্পূর্ণ ড্যাশবোর্ড ঘুরে দেখুন
              </p>
            </div>
          </section>

          {/* Right Column: Google 1-Click + Email/Password Auth Card */}
          <section className="lg:col-span-6 rounded-3xl bg-[#0b1324]/90 backdrop-blur-xl border border-emerald-400/25 shadow-[0_0_50px_rgba(16,185,129,0.14)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-[1.4]">
                  অরবিটাল ওয়েলথ ভল্ট — ক্লাউড লগইন
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5] mt-1">
                  নিরাপদ ক্লাউড সিঙ্ক শুরু করতে লগইন করুন অথবা নতুন অ্যাকাউন্ট খুলুন
                </p>
              </div>

              {/* Primary 1-Click Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full min-h-[50px] px-5 py-3 inline-flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base shadow-[0_4px_24px_rgba(255,255,255,0.14)] transition-all disabled:opacity-60 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>
                  {isGoogleLoading
                    ? 'Google-এ সংযুক্ত হচ্ছে...'
                    : 'Google দিয়ে ১-ক্লিকে লগইন করুন'}
                </span>
              </button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-slate-400">
                  অথবা ইমেইল ব্যবহার করুন
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Email / Password Tabs */}
              <div
                role="tablist"
                aria-label="ইমেইল লগইন অথবা রেজিস্ট্রেশন"
                className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#070b14] border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => switchMode('login')}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/45'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>লগইন (Login)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => switchMode('register')}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/45'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>নতুন অ্যাকাউন্ট (Register)</span>
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="cloud-name"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      আপনার নাম (ঐচ্ছিক)
                    </label>
                    <input
                      id="cloud-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="cloud-email"
                    className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                  >
                    ইমেইল ঠিকানা
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="cloud-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                        setInfoMessage('');
                      }}
                      placeholder="name@example.com"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="cloud-password"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5]"
                    >
                      পাসওয়ার্ড
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={busy}
                        className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline cursor-pointer disabled:opacity-60"
                      >
                        {isResetLoading ? 'পাঠানো হচ্ছে...' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="cloud-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'register' ? 'new-password' : 'current-password'
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder={
                        mode === 'register' ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড' : 'আপনার পাসওয়ার্ড দিন'
                      }
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

                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="cloud-confirm-password"
                      className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
                    >
                      পাসওয়ার্ড নিশ্চিত করুন
                    </label>
                    <input
                      id="cloud-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 rounded-xl"
                  >
                    {error}
                  </p>
                )}

                {infoMessage && (
                  <div
                    role="status"
                    className="text-xs sm:text-sm font-semibold text-emerald-200 bg-emerald-500/15 border border-emerald-400/35 px-3.5 py-2.5 rounded-xl flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{infoMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#041210] bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                      <span>{isEmailLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {isEmailLoading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 text-center leading-[1.5]">
              আপনার সকল বাজেট ও সঞ্চয়ের তথ্য রিয়েল-টাইমে আপনার নিজস্ব ক্লাউড অ্যাকাউন্টে সংরক্ষিত থাকে।
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

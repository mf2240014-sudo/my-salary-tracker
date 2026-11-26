import {Delete, Lock} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toBengaliDigits} from '../utils/format';

interface PinLockScreenProps {
  expectedPin: string;
  userName: string;
  onUnlock: () => void;
}

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function PinLockScreen({
  expectedPin,
  userName,
  onUnlock,
}: PinLockScreenProps) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    setError(false);

    if (next.length === 4) {
      if (next === expectedPin) {
        onUnlock();
      } else {
        setError(true);
        window.setTimeout(() => {
          setEntered('');
        }, 450);
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setEntered((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0b1324]/90 backdrop-blur-2xl border border-emerald-400/30 shadow-[0_0_55px_rgba(16,185,129,0.2)] p-6 sm:p-7 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-bold text-white leading-[1.5] mt-4">
          অরবিটাল ওয়েলথ ভল্ট
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-300 leading-[1.5] mt-1">
          স্বাগতম {userName} — আনলক করতে ৪ সংখ্যার পিন দিন
        </p>

        {/* 4 PIN Dots */}
        <div
          className="flex items-center justify-center gap-4 my-6"
          aria-label="পিন কোড ঘর"
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < entered.length;
            return (
              <span
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                    : filled
                      ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)] scale-110'
                      : 'bg-white/5 border-white/25'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-300 mb-3">
            পিন সঠিক হয়নি, আবার চেষ্টা করুন।
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {KEYPAD_DIGITS.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/45 text-xl font-bold text-white font-num transition-colors cursor-pointer active:scale-95"
            >
              {toBengaliDigits(digit)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setEntered('');
              setError(false);
            }}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            মুছুন
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/45 text-xl font-bold text-white font-num transition-colors cursor-pointer active:scale-95"
          >
            ০
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="একটি সংখ্যা মুছুন"
            className="h-14 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 text-slate-200 hover:text-rose-300 inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <Delete className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

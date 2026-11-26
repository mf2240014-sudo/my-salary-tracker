import {Camera, RotateCcw, User, X} from 'lucide-react';
import {useRef, useState} from 'react';
import {UserProfile} from '../types/budget';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (next: UserProfile) => void;
}

export function ProfileModal({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
}: ProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setImgError(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'আমার অ্যাকাউন্ট',
      avatarUrl,
    });
    onClose();
  };

  const handleResetAvatar = () => {
    setAvatarUrl('');
    setImgError(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0b1324] border border-emerald-400/30 shadow-[0_0_45px_rgba(16,185,129,0.2)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2
              id="profile-modal-title"
              className="text-lg font-bold text-white leading-[1.5]"
            >
              প্রোফাইল ও ছবি সেটিংস
            </h2>
            <p className="text-xs font-medium text-slate-300 leading-[1.5]">
              আপনার নাম ও প্রোফাইল ছবি পরিবর্তন করুন
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
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.3)] bg-[#070b14] flex items-center justify-center">
              {!imgError && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'প্রোফাইল ছবি'}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-emerald-300" aria-hidden="true" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-xl transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <span>নতুন ছবি আপলোড</span>
              </button>

              {avatarUrl !== '' && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ছবি সরান</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              aria-label="প্রোফাইল ছবি নির্বাচন করুন"
            />
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="profile-name-input"
              className="block text-sm font-semibold text-slate-200 leading-[1.5] mb-1.5"
            >
              আপনার নাম
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#070b14] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            />
          </div>

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

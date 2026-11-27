import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  DocumentData,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import {BudgetAppState} from './types/budget';
import {normalizeBudgetState} from './utils/format';

export const firebaseConfig = {
  apiKey: 'AIzaSyDmwuGGN_bGVzPisnx_T9SzehAydzCrzCc',
  authDomain: 'orbital-vault.firebaseapp.com',
  projectId: 'orbital-vault',
  storageBucket: 'orbital-vault.firebasestorage.app',
  messagingSenderId: '756866523354',
  appId: '1:756866523354:web:aba909922fbe0216f885e3',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: 'select_account'});

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = sanitizeForFirestore(v);
      }
    }
    return result as T;
  }
  return value;
}

export function extractFirebaseErrorDetails(error: unknown): {
  code: string;
  message: string;
} {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as {code?: unknown}).code ?? '')
      : '';
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : error instanceof Error
        ? error.message
        : String(error ?? '');
  return {code, message};
}

export function mapFirebaseAuthError(error: unknown): string {
  const {code, message} = extractFirebaseErrorDetails(error);

  if (code.startsWith('auth/api-key-not-valid')) {
    return 'Firebase Authentication-এর জন্য API Key-টি এখনো সক্রিয় নয় (Identity Toolkit API অনুমতি প্রয়োজন)। অনুগ্রহ করে Google Cloud Console > APIs & Services > Credentials-এ গিয়ে এই API Key-র "API restrictions"-এ Identity Toolkit API যুক্ত করুন অথবা Firebase Console থেকে Authentication চালু করে নতুন Web API Key দিন।';
  }

  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google লগইন পপআপটি বন্ধ করা হয়েছে। আবার চেষ্টা করুন।';
    case 'auth/popup-blocked':
      return 'ব্রাউজারে পপআপ ব্লক করা আছে। অনুগ্রহ করে পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।';
    case 'auth/invalid-email':
      return 'ইমেইল ঠিকানাটি সঠিক নয়।';
    case 'auth/user-disabled':
      return 'এই অ্যাকাউন্টটি সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে।';
    case 'auth/user-not-found':
      return 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। নতুন অ্যাকাউন্ট তৈরি করুন।';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    case 'auth/too-many-requests':
      return 'অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। নেটওয়ার্ক পরীক্ষা করে আবার চেষ্টা করুন।';
    case 'auth/operation-not-allowed':
      return 'Firebase কনসোলে এই লগইন পদ্ধতিটি (Google / Email) এখনো চালু করা হয়নি।';
    case 'auth/unauthorized-domain':
      return 'এই ডোমেইনটি Firebase Authentication Authorized Domains তালিকায় যুক্ত নেই।';
    default:
      return message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  }
}

export async function loginWithGooglePopup(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  if (displayName && displayName.trim()) {
    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    });
  }
  return credential.user;
}

export async function sendResetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export async function fetchUserBudgetState(
  uid: string
): Promise<BudgetAppState | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data() as DocumentData;
  const rawState = (data.budgetState ?? data) as Partial<BudgetAppState>;
  return normalizeBudgetState(rawState);
}

export async function saveUserBudgetState(
  uid: string,
  state: BudgetAppState,
  meta?: {email?: string | null; displayName?: string | null}
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const cleanState = sanitizeForFirestore(state);
  await setDoc(
    userRef,
    sanitizeForFirestore({
      uid,
      email: meta?.email ?? null,
      displayName: meta?.displayName ?? state.profile.name,
      updatedAt: new Date().toISOString(),
      budgetState: cleanState,
    }),
    {merge: true}
  );
}

export function subscribeUserBudgetState(
  uid: string,
  onData: (state: BudgetAppState | null, isLocalPending: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (!snap.exists()) {
        onData(null, snap.metadata.hasPendingWrites);
        return;
      }
      const data = snap.data() as DocumentData;
      const rawState = (data.budgetState ?? data) as Partial<BudgetAppState>;
      onData(normalizeBudgetState(rawState), snap.metadata.hasPendingWrites);
    },
    (err) => {
      onError?.(err);
    }
  );
}

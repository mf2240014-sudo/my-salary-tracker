import {BudgetAppState} from '../types/budget';
import {normalizeBudgetState} from './format';

const SYNC_PREFIX = 'OWV1.';
const PBKDF2_ITERATIONS = 120000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function assertWebCrypto(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('এই ব্রাউজারে এনক্রিপশন সুবিধা (Web Crypto) সাপোর্ট করছে না।');
  }
  return crypto.subtle;
}

async function derivePBKDF2Bits(
  secretText: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const subtle = assertWebCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(secretText),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function deriveAESGCMKey(
  username: string,
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const subtle = assertWebCrypto();
  const encoder = new TextEncoder();
  const normalizedSecret = `${username.trim().toLowerCase()}::${password}`;
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(normalizedSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt']
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashBytes = await derivePBKDF2Bits(password, salt, 100000);
  return `${toBase64Url(salt)}:${toBase64Url(hashBytes)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  try {
    const salt = fromBase64Url(parts[0]);
    const expectedHash = parts[1];
    const derived = await derivePBKDF2Bits(password, salt, 100000);
    return constantTimeEqual(toBase64Url(derived), expectedHash);
  } catch {
    return false;
  }
}

export interface PortableAccountPayload {
  v: 1;
  username: string;
  displayUsername: string;
  exportedAt: string;
  state: BudgetAppState;
}

export async function generateAccountSyncCode(params: {
  username: string;
  displayUsername: string;
  password: string;
  state: BudgetAppState;
}): Promise<string> {
  const subtle = assertWebCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAESGCMKey(params.username, params.password, salt);

  const payload: PortableAccountPayload = {
    v: 1,
    username: params.username.trim().toLowerCase(),
    displayUsername: params.displayUsername.trim() || params.username.trim(),
    exportedAt: new Date().toISOString(),
    state: params.state,
  };

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(payload));
  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    aesKey,
    plaintextBytes
  );
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  const combined = new Uint8Array(salt.length + iv.length + ciphertextBytes.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertextBytes, salt.length + iv.length);

  return `${SYNC_PREFIX}${toBase64Url(combined)}`;
}

export async function decryptAccountSyncCode(params: {
  syncCode: string;
  username: string;
  password: string;
}): Promise<PortableAccountPayload> {
  const subtle = assertWebCrypto();
  const cleanedCode = params.syncCode.replace(/\s+/g, '').trim();
  if (!cleanedCode.startsWith(SYNC_PREFIX)) {
    throw new Error('সিঙ্ক কোডটি সঠিক ফরম্যাটে নেই (OWV1. দিয়ে শুরু হতে হবে)।');
  }

  let combined: Uint8Array;
  try {
    combined = fromBase64Url(cleanedCode.slice(SYNC_PREFIX.length));
  } catch {
    throw new Error('সিঙ্ক কোডটি ক্ষতিগ্রস্ত বা অসম্পূর্ণ।');
  }

  if (combined.length <= 28) {
    throw new Error('সিঙ্ক কোডটি অসম্পূর্ণ।');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const aesKey = await deriveAESGCMKey(params.username, params.password, salt);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      aesKey,
      ciphertext as BufferSource
    );
  } catch {
    throw new Error('ইউজারনেম, পাসওয়ার্ড অথবা সিঙ্ক কোড সঠিক নয়। দয়া করে আবার যাচাই করুন।');
  }

  const decoder = new TextDecoder();
  const parsed = JSON.parse(decoder.decode(decryptedBuffer)) as Partial<PortableAccountPayload>;
  if (!parsed || parsed.v !== 1 || !parsed.state) {
    throw new Error('সিঙ্ক কোডের ভেতরের তথ্য পাওয়া যায়নি।');
  }

  const normalizedInputUser = params.username.trim().toLowerCase();
  if (parsed.username && parsed.username !== normalizedInputUser) {
    throw new Error('প্রদত্ত ইউজারনেমটি এই সিঙ্ক কোডের সাথে মিলছে না।');
  }

  return {
    v: 1,
    username: normalizedInputUser,
    displayUsername: parsed.displayUsername || params.username.trim(),
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    state: {
      ...normalizeBudgetState(parsed.state),
      onboardingCompleted: true,
    },
  };
}

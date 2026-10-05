import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and de-duplicate Tailwind conflicts. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const AR_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** Convert a Firestore value / Date / ISO string into a JS Date (or null). */
export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** 12/09/2026 */
export const formatDate = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '—';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

/** الجمعة 12 سبتمبر 2026 */
export const formatLongDate = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '—';
  return `${AR_WEEKDAYS[date.getDay()]} ${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** 08:30 م */
export const formatTime = (value?: string): string => {
  if (!value) return '—';
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? 'م' : 'ص';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(display).padStart(2, '0')}:${(rawMinute || '00').padStart(2, '0')} ${suffix}`;
};

/** "منذ 3 ساعات" */
export const timeAgo = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-US');
};

/** 1 → "الأول", 2 → "الثاني" … */
const ORDINALS = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
];
export const ordinal = (position: number): string => ORDINALS[position - 1] || `الـ${position}`;

export const initials = (name?: string): string => {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
};

/** 1999 → 27 سنة */
export const ageFromBirthYear = (birthYear?: number): string => {
  if (!birthYear) return '—';
  const age = new Date().getFullYear() - birthYear;
  return `${age} سنة`;
};

export const percent = (value: number, total: number): number => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

/** "+5" / "0" / "-3" */
export const withSign = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Human friendly Firebase error message in Arabic. */
export const firebaseErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'permission-denied': 'لا تملك الصلاحية لتنفيذ هذا الإجراء. تواصل مع مدير الدوري.',
    unauthenticated: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.',
    'storage/unauthorized': 'تخزين الملفات غير مفعّل لهذا الحساب بعد. يمكنك لصق رابط الصورة بدلاً من الرفع.',
    'storage/unknown': 'تعذّر الوصول إلى خدمة تخزين الصور. جرّب لصق رابط الصورة مباشرة.',
    'storage/retry-limit-exceeded': 'استغرق الرفع وقتاً طويلاً. تحقق من الاتصال وحاول مجدداً.',
    'storage/canceled': 'تم إلغاء عملية الرفع.',
    'auth/network-request-failed': 'فشل الاتصال بالشبكة، تأكد من الإنترنت.',
    'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.',
    'auth/popup-blocked': 'تم حجب النافذة المنبثقة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.',
  };
  if (map[code]) return map[code];
  if (code && map[code.replace('firestore/', '')]) return map[code.replace('firestore/', '')];
  const message = (error as { message?: string })?.message;
  return message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
};

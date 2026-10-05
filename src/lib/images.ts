import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { firebaseErrorMessage, uid } from './utils';

export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10MB

export interface ProcessedImage {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  extension: 'png' | 'jpg';
}

const readFileAsDataURL = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('الملف ليس صورة صالحة.'));
    image.src = src;
  });

/**
 * Downscale + compress an image fully in the browser, preserving transparency
 * for logos (PNG) and switching to JPEG for photographs.
 */
export const processImage = async (file: File, maxSize = 640, quality = 0.88): Promise<ProcessedImage> => {
  if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة (PNG, JPG, WEBP).');
  if (file.size > MAX_RAW_BYTES) throw new Error('حجم الصورة كبير جداً، الحد الأقصى 10 ميغابايت.');

  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('متصفحك لا يدعم معالجة الصور.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  // Detect transparency so transparent logos stay crisp PNGs.
  let hasAlpha = false;
  try {
    const { data } = ctx.getImageData(0, 0, width, height);
    for (let i = 3; i < data.length; i += 4 * 37) {
      if (data[i] < 248) {
        hasAlpha = true;
        break;
      }
    }
  } catch {
    hasAlpha = false;
  }

  const extension: 'png' | 'jpg' = hasAlpha ? 'png' : 'jpg';
  const mime = hasAlpha ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, hasAlpha ? undefined : quality),
  );
  if (!blob) throw new Error('تعذّر معالجة الصورة.');

  return { blob, previewUrl: URL.createObjectURL(blob), width, height, extension };
};

export interface UploadImageOptions {
  /** Storage folder, e.g. "team-logos" or "player-photos". */
  folder: string;
  maxSize?: number;
  quality?: number;
  onProgress?: (stage: 'processing' | 'uploading' | 'done') => void;
}

/**
 * Compress then upload an image to Firebase Storage and return its public URL.
 * Throws a human-readable Arabic error when Storage is not reachable so the UI
 * can gracefully offer the "paste a link" alternative.
 */
export const uploadImage = async (
  file: File,
  { folder, maxSize, quality, onProgress }: UploadImageOptions,
): Promise<{ url: string; width: number; height: number }> => {
  onProgress?.('processing');
  const processed = await processImage(file, maxSize, quality);

  try {
    onProgress?.('uploading');
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
    const objectRef = ref(storage, `uploads/${safeFolder}/${Date.now()}-${uid()}.${processed.extension}`);
    const snapshot = await uploadBytes(objectRef, processed.blob, {
      contentType: processed.blob.type,
      cacheControl: 'public, max-age=31536000',
    });
    const url = await getDownloadURL(snapshot.ref);
    onProgress?.('done');
    return { url, width: processed.width, height: processed.height };
  } catch (error) {
    onProgress?.('done');
    throw new Error(firebaseErrorMessage(error));
  } finally {
    setTimeout(() => URL.revokeObjectURL(processed.previewUrl), 5000);
  }
};

/** Best-effort removal of a previously uploaded storage object. */
export const removeStorageImage = async (url?: string): Promise<void> => {
  if (!url || !url.includes('firebasestorage')) return;
  try {
    await deleteObject(ref(storage, url));
  } catch {
    /* silent — the file may already be gone or belong to another bucket */
  }
};

/** Static placeholder used when a team has no crest uploaded yet. */
export const placeholderLogo = (name?: string): string => {
  const letter = encodeURIComponent((name || 'ف').trim().charAt(0));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e8c158"/><stop offset="55%" stop-color="#b8912b"/><stop offset="100%" stop-color="#6d531d"/>
      </linearGradient>
    </defs>
    <rect width="240" height="240" rx="52" fill="#0d121e"/>
    <path d="M120 30l62 26v58c0 42-26 76-62 92-36-16-62-50-62-92V56z" fill="none" stroke="url(#g)" stroke-width="7"/>
    <text x="120" y="146" font-size="96" font-family="Cairo, sans-serif" font-weight="800" fill="url(#g)" text-anchor="middle">${decodeURIComponent(letter.replace(/%20/g, ''))}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

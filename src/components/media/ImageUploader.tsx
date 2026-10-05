import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/images';
import { Button } from '../ui/Button';
import { Input } from '../ui/Form';

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  /** Storage folder, e.g. "team-logos" */
  folder: string;
  label?: string;
  hint?: string;
  /** Preview shape */
  shape?: 'square' | 'circle' | 'wide';
  maxSize?: number;
  quality?: number;
  disabled?: boolean;
  className?: string;
  /** Renders the small helper line about the recommended ratio */
  recommended?: string;
}

const SHAPES = {
  square: 'h-24 w-24 rounded-3xl',
  circle: 'h-24 w-24 rounded-full',
  wide: 'h-28 w-44 rounded-3xl',
};

export const ImageUploader = ({
  value,
  onChange,
  folder,
  label,
  hint,
  shape = 'square',
  maxSize = 640,
  quality = 0.88,
  disabled,
  className,
  recommended,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | 'processing' | 'uploading'>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const handleFile = async (file?: File | null) => {
    if (!file || disabled) return;
    setError(null);
    try {
      setBusy('processing');
      const result = await uploadImage(file, {
        folder,
        maxSize,
        quality,
        onProgress: (stage) => setBusy(stage === 'done' ? null : stage),
      });
      onChange(result.url);
    } catch (uploadError) {
      setError((uploadError as Error).message);
      setShowLink(true);
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    void handleFile(file);
  };

  const onSelect = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-ink-200">{label}</span>
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setLinkValue('');
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-400 transition-colors hover:text-rose-glow"
            >
              <Trash2 className="h-3 w-3" />
              إزالة
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !disabled) inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'group relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-300',
            SHAPES[shape],
            dragging
              ? 'border-gold-400/80 bg-gold-400/12 scale-[1.02]'
              : 'border-white/15 bg-ink-950/50 hover:border-gold-400/50 hover:bg-white/5',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {value ? (
            <img src={value} alt="معاينة" className="h-full w-full object-cover" />
          ) : busy ? (
            <div className="flex flex-col items-center gap-2 text-gold-300">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="px-2 text-center text-[10px] font-bold">
                {busy === 'processing' ? 'جاري المعالجة' : 'جاري الرفع'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-2 text-center text-ink-400 group-hover:text-gold-300">
              <ImagePlus className="h-6 w-6" />
              <span className="text-[10px] font-bold leading-tight">اختر صورة<br />أو اسحبها هنا</span>
            </div>
          )}
          {busy && value && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-gold-300" />
            </div>
          )}
        </div>

        <div className="min-w-[12rem] flex-1 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="glass"
              disabled={disabled || !!busy}
              loading={!!busy}
              icon={<UploadCloud className="h-3.5 w-3.5" />}
              onClick={() => inputRef.current?.click()}
            >
              {value ? 'تغيير الصورة' : 'رفع صورة'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<Link2 className="h-3.5 w-3.5" />}
              onClick={() => setShowLink((current) => !current)}
            >
              رابط صورة
            </Button>
          </div>

          {recommended && <p className="text-[11px] text-ink-400">{recommended}</p>}

          {showLink && (
            <div className="flex items-center gap-2">
              <Input
                dir="ltr"
                placeholder="https://example.com/logo.png"
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                className="py-2 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => {
                  if (linkValue.trim()) {
                    onChange(linkValue.trim());
                    setError(null);
                  }
                }}
              >
                تطبيق
              </Button>
            </div>
          )}

          {hint && !error && <p className="text-[11px] leading-relaxed text-ink-400">{hint}</p>}
          {error && (
            <p className="rounded-xl border border-amber-glow/25 bg-amber-glow/10 px-3 py-2 text-[11px] leading-relaxed text-amber-glow">
              {error} — يمكنك لصق رابط الصورة مباشرة كبديل.
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelect}
        disabled={disabled}
      />
    </div>
  );
};

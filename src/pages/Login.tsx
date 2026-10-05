import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessage } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const Login = () => {
  const { signInWithGoogle, user, profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user && profile) {
    return <Navigate to={profile.role === 'team' ? '/team-dashboard' : '/admin'} replace />;
  }

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (signInError) {
      setError(firebaseErrorMessage(signInError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 py-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      {/* Brand side */}
      <div className="space-y-8">
        <div className="space-y-5">
          <Badge tone="gold" dot>
            منطقة الدخول الآمن
          </Badge>
          <h1 className="font-heading text-3xl font-black leading-tight text-white sm:text-5xl">
            منصة إدارة <span className="text-gradient-gold">دوري صوب الشامية</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
            الدخول مخصص لإدارة الدوري، اللجان العاملة، وحسابات الفرق المشاركة. تعرض كل فئة أدواتها الخاصة فقط حسب الصلاحيات
            الممنوحة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard variant="soft" padding="md" className="space-y-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-300/25 bg-gold-400/12">
              <ShieldCheck className="h-5 w-5 text-gold-200" />
            </span>
            <h3 className="text-sm font-bold text-white">الإدارة واللجان</h3>
            <p className="text-[11px] leading-relaxed text-ink-300">
              إدارة الفرق واللاعبين، جدولة المباريات، احتساب الترتيب، الانضباط، والتبليغات.
            </p>
          </GlassCard>
          <GlassCard variant="soft" padding="md" className="space-y-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-glow/25 bg-emerald-glow/12">
              <Users className="h-5 w-5 text-emerald-glow" />
            </span>
            <h3 className="text-sm font-bold text-white">حسابات الفرق</h3>
            <p className="text-[11px] leading-relaxed text-ink-300">
              رفع شعار الفريق وصور اللاعبين، ترتيب التشكيلة، ومتابعة العقوبات والاعتراضات.
            </p>
          </GlassCard>
          <GlassCard variant="soft" padding="md" className="space-y-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-glow/25 bg-sky-glow/12">
              <Sparkles className="h-5 w-5 text-sky-glow" />
            </span>
            <h3 className="text-sm font-bold text-white">تحديث لحظي</h3>
            <p className="text-[11px] leading-relaxed text-ink-300">
              كل تعديل يظهر فوراً على الموقع العام بدون أي خطوة نشر إضافية.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Login card */}
      <GlassCard variant="strong" padding="lg" glow="gold" className="mx-auto w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-gold-300/35 bg-[linear-gradient(150deg,rgba(232,193,88,0.3),rgba(13,18,30,0.9))]">
          <Trophy className="h-10 w-10 text-gold-200" />
        </span>
        <h2 className="font-heading text-2xl font-bold text-white">تسجيل الدخول</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          استخدم حساب Google المعتمد من إدارة الدوري للوصول إلى لوحة التحكم الخاصة بك.
        </p>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-glow/25 bg-rose-glow/10 p-3.5 text-right text-xs leading-relaxed text-rose-glow">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          variant="glass"
          size="lg"
          block
          loading={loading}
          icon={<GoogleIcon />}
          className="mt-7 bg-white/90 text-ink-950 hover:bg-white"
          onClick={() => void handleLogin()}
        >
          المتابعة باستخدام Google
        </Button>

        <p className="mt-5 text-[11px] leading-relaxed text-ink-400">
          بالدخول أنت توافق على سياسة استخدام المنصة. لا يتم منح أي صلاحيات إدارية تلقائياً — يقوم المدير العام بتعيين
          الأدوار.
        </p>
      </GlassCard>
    </div>
  );
};

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from './ui/GlassCard';
import { Spinner } from './ui/Feedback';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GlassCard variant="strong" padding="lg" glow="gold" className="flex flex-col items-center gap-4 text-center">
          <Spinner className="h-8 w-8 border-gold-400" />
          <p className="text-sm font-bold text-white">جاري التحقق من الصلاحيات…</p>
          <p className="text-xs text-ink-300">يتم تحميل ملفك الشخصي وأدوارك في المنصة.</p>
        </GlassCard>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <GlassCard variant="strong" padding="lg" className="max-w-md space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-glow/25 bg-rose-glow/10">
            <ShieldAlert className="h-8 w-8 text-rose-glow" />
          </span>
          <h1 className="font-heading text-xl font-bold text-white">لا تملك صلاحية الوصول</h1>
          <p className="text-sm leading-relaxed text-ink-300">
            دورك الحالي لا يسمح بفتح هذه اللوحة. تواصل مع المدير العام لتعديل صلاحياتك.
          </p>
          <Link to="/" className="inline-block">
            <Button variant="glass">العودة للصفحة الرئيسية</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
};

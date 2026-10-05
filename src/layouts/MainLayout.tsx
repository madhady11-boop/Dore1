import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTournamentData } from '../hooks/useTournamentData';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { ROLE_LABELS } from '../lib/constants';
import { Button } from '../components/ui/Button';

const navLinks = [
  { name: 'الرئيسية', path: '/', icon: Trophy },
  { name: 'المباريات', path: '/matches', icon: CalendarDays },
  { name: 'الترتيب', path: '/standings', icon: LayoutDashboard },
  { name: 'الفرق', path: '/teams', icon: Users },
  { name: 'التبليغات', path: '/announcements', icon: Megaphone },
];

export const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, logout } = useAuth();
  const { isDemo } = useTournamentData();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const panelLink = profile?.role === 'team' ? '/team-dashboard' : '/admin';
  const panelLabel = profile?.role === 'team' ? 'لوحة الفريق' : 'لوحة التحكم';

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb animate-float-slow right-[-10%] top-[-12%] h-[28rem] w-[28rem] bg-gold-500/22" />
        <div className="orb animate-float left-[-12%] top-[18%] h-[24rem] w-[24rem] bg-sky-glow/16" />
        <div className="orb animate-drift bottom-[-16%] left-1/3 h-[26rem] w-[26rem] bg-emerald-glow/14" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(232,193,88,0.1),transparent_55%)]" />
      </div>

      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-500',
          scrolled ? 'glass-nav border-white/10 shadow-[0_20px_50px_-40px_rgba(0,0,0,1)]' : 'border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-300/35 bg-[linear-gradient(150deg,rgba(232,193,88,0.28),rgba(13,18,30,0.85))] shadow-[0_12px_30px_-14px_rgba(232,193,88,0.65)] transition-transform duration-500 group-hover:scale-105">
              <Trophy className="h-6 w-6 text-gold-200" />
              <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-ink-950 bg-emerald-glow" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-base font-extrabold text-white sm:text-lg">دوري صوب الشامية</span>
              <span className="text-[11px] font-semibold text-gold-300/90">دوري الدرجة الأولى للفِرَق الشعبية</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300',
                    isActive
                      ? 'glass-soft text-gold-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-ink-200 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={cn('h-4 w-4', isActive && 'text-gold-300')} />
                    {link.name}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gold-400" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {profile ? (
              <div className="flex items-center gap-2">
                <Link
                  to={panelLink}
                  className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-gold-100 transition-colors hover:border-gold-400/50"
                >
                  <Shield className="h-4 w-4 text-gold-300" />
                  {panelLabel}
                </Link>
                <div className="group relative">
                  <button className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold-400/20 text-[10px] font-black text-gold-100">
                      {(profile.displayName || profile.email || '؟').slice(0, 1)}
                    </span>
                    <span className="max-w-28 truncate">{profile.displayName || profile.email}</span>
                  </button>
                  <div className="glass-strong invisible absolute left-0 top-full z-50 mt-2 w-56 translate-y-1 rounded-2xl p-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-bold text-white">{profile.email}</p>
                      <p className="mt-1 text-[10px] font-bold text-gold-300">{ROLE_LABELS[profile.role] || profile.role}</p>
                    </div>
                    <div className="hairline my-1" />
                    <Link
                      to={panelLink}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-ink-100 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      الانتقال إلى لوحتي
                    </Link>
                    <button
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-ink-100 transition-colors hover:bg-rose-glow/12 hover:text-rose-glow"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button size="md" icon={<Shield className="h-4 w-4" />}>
                  دخول المنصة
                </Button>
              </Link>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="glass flex h-11 w-11 items-center justify-center rounded-2xl text-white lg:hidden"
            aria-label="القائمة"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        <div
          className={cn(
            'glass-nav overflow-hidden border-t border-white/8 transition-[max-height,opacity] duration-500 lg:hidden',
            menuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="space-y-1.5 px-4 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                    isActive ? 'bg-gold-400/12 text-gold-100' : 'text-ink-200 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </NavLink>
            ))}
            <div className="hairline my-2" />
            {profile ? (
              <Link
                to={panelLink}
                className="flex items-center justify-between rounded-2xl bg-gold-400/12 px-4 py-3 text-sm font-bold text-gold-100"
              >
                {panelLabel}
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f4e0a1,#d4af37)] px-4 py-3 text-sm font-black text-ink-950"
              >
                <Shield className="h-4 w-4" />
                دخول المنصة
              </Link>
            )}
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-gold flex flex-wrap items-center gap-3 rounded-3xl px-5 py-3.5 text-xs font-bold text-gold-100">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-200" />
            وضع العرض التجريبي: قاعدة البيانات فارغة حالياً، لذلك تُعرض بيانات نموذجية لتوضيح الشكل النهائي. أضف فرقك
            ومبارياتك من لوحة التحكم وستظهر بياناتك الحقيقية تلقائياً.
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>

      <footer className="relative mt-10 border-t border-white/8">
        <div className="glass-nav">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-300/30 bg-gold-400/12">
                    <Trophy className="h-5 w-5 text-gold-200" />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">دوري صوب الشامية</h3>
                    <p className="text-xs text-gold-300/85">بإشراف مؤسسة الحكيم للشباب والرياضة</p>
                  </div>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-ink-300">
                  المنصة الرسمية لدوري الدرجة الأولى للفِرَق الشعبية — النتائج، الترتيب، التشكيلات، والقرارات الرسمية في مكان
                  واحد.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-heading text-sm font-bold text-white">روابط سريعة</h4>
                <ul className="space-y-2 text-sm text-ink-300">
                  {navLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="transition-colors hover:text-gold-200">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-heading text-sm font-bold text-white">للإدارات</h4>
                <ul className="space-y-2 text-sm text-ink-300">
                  <li>
                    <Link to="/login" className="transition-colors hover:text-gold-200">
                      دخول الإدارة واللجان
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="transition-colors hover:text-gold-200">
                      دخول حسابات الفرق
                    </Link>
                  </li>
                  <li>
                    <Link to="/announcements" className="transition-colors hover:text-gold-200">
                      التبليغات الرسمية
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="hairline my-8" />
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-ink-400 sm:flex-row">
              <p>© {new Date().getFullYear()} دوري صوب الشامية — جميع الحقوق محفوظة.</p>
              <p>{user ? `مرحباً ${profile?.displayName || user.email}` : 'منصة رياضية مجتمعية'}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

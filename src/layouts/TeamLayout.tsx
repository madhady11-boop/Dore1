import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Menu,
  ShieldAlert,
  Shirt,
  Users,
  X,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { TeamBadge } from '../components/football/Avatars';

const links = [
  { name: 'نظرة عامة', path: '/team-dashboard', icon: Home, end: true },
  { name: 'التشكيلة واللاعبون', path: '/team-dashboard/squad', icon: Users },
  { name: 'شعار ومعلومات الفريق', path: '/team-dashboard/profile', icon: Shirt },
  { name: 'المباريات', path: '/team-dashboard/matches', icon: CalendarDays },
  { name: 'العقوبات', path: '/team-dashboard/disciplinary', icon: ShieldAlert },
  { name: 'الاعتراضات', path: '/team-dashboard/objections', icon: FileText },
];

interface TeamHeaderInfo {
  name: string;
  logo?: string;
}

export const TeamLayout = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [team, setTeam] = useState<TeamHeaderInfo | null>(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!profile?.teamId) return;
      try {
        const snap = await getDoc(doc(db, 'teams', profile.teamId));
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          setTeam({ name: data.name || 'فريقي', logo: data.logo });
        }
      } catch {
        /* ignore */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profile?.teamId]);

  const active = links.find((link) => link.path === location.pathname);

  const SidebarContent = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
        <TeamBadge name={team?.name || profile?.displayName || 'فريقي'} logo={team?.logo} size="sm" />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading text-sm font-extrabold text-white">
            {team?.name || 'لوحة الفريق'}
          </span>
          <span className="text-[10px] font-bold text-emerald-glow/90">حساب فريق معتمد</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-300',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(25,195,125,0.2),rgba(25,195,125,0.05))] text-emerald-100'
                  : 'text-ink-300 hover:bg-white/6 hover:text-white',
              )
            }
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      {!compact && (
        <div className="space-y-1 border-t border-white/8 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-ink-300 hover:bg-white/6 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            عرض الموقع العام
          </Link>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-ink-300 hover:bg-rose-glow/12 hover:text-rose-glow"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(25,195,125,0.16),transparent_55%),radial-gradient(circle_at_8%_100%,rgba(232,193,88,0.12),transparent_55%)]" />
        <div className="orb animate-float-slow left-[8%] top-[10%] h-72 w-72 bg-emerald-glow/14" />
      </div>

      <aside className="glass-panel fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-white/8 lg:flex">
        <SidebarContent />
      </aside>

      <div
        className={cn('fixed inset-0 z-50 lg:hidden', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'glass-strong absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col transition-transform duration-500',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute left-3 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-ink-200"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent />
        </aside>
      </div>

      <div className="lg:pr-72">
        <header className="glass-nav sticky top-0 z-30 border-b border-white/8">
          <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="glass flex h-10 w-10 items-center justify-center rounded-xl text-white lg:hidden"
                aria-label="القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-glow/80">لوحة الفريق</p>
                <h1 className="font-heading text-base font-bold text-white sm:text-lg">{active?.name || 'لوحة الفريق'}</h1>
              </div>
            </div>
            <div className="glass hidden items-center gap-3 rounded-2xl px-3 py-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-glow/18 text-xs font-black text-emerald-100">
                {(profile?.displayName || 'ف').slice(0, 1)}
              </span>
              <span className="max-w-40 truncate text-xs font-bold text-white">
                {profile?.displayName || profile?.email}
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {!profile?.teamId && (
            <div className="glass-soft mb-6 flex items-start gap-3 rounded-3xl border-amber-glow/25 p-4 text-sm text-amber-glow">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">حسابك غير مرتبط بفريق حتى الآن.</p>
                <p className="text-xs leading-relaxed text-amber-glow/85">
                  تواصل مع إدارة الدوري لربط حسابك بأحد الفرق، وستتمكن بعدها من إدارة اللاعبين والشعارات والتشكيلة.
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

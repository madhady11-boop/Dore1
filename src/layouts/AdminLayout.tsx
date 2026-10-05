import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTournamentData } from '../hooks/useTournamentData';
import { ADMIN_ROLES, ROLE_LABELS } from '../lib/constants';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  end?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const ALL = [...ADMIN_ROLES] as string[];

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'الملخص',
    items: [{ name: 'لوحة القيادة', path: '/admin', icon: LayoutDashboard, roles: ALL, end: true }],
  },
  {
    title: 'البطولة',
    items: [
      { name: 'الفرق والشعارات', path: '/admin/teams', icon: Users, roles: ['super_admin', 'tournament_manager'] },
      {
        name: 'اللاعبون والتشكيلات',
        path: '/admin/players',
        icon: UserCog,
        roles: ['super_admin', 'tournament_manager', 'stats_manager'],
      },
      {
        name: 'المباريات والنتائج',
        path: '/admin/matches',
        icon: CalendarDays,
        roles: ['super_admin', 'tournament_manager', 'stats_manager'],
      },
      {
        name: 'جدول الترتيب',
        path: '/admin/standings',
        icon: Activity,
        roles: ['super_admin', 'tournament_manager', 'stats_manager'],
      },
      { name: 'الحكام', path: '/admin/referees', icon: ShieldCheck, roles: ['super_admin', 'tournament_manager'] },
    ],
  },
  {
    title: 'الانضباط والمالية',
    items: [
      {
        name: 'العقوبات والاعتراضات',
        path: '/admin/disciplinary',
        icon: ShieldAlert,
        roles: ['super_admin', 'tournament_manager', 'disciplinary_committee'],
      },
      {
        name: 'المالية والغرامات',
        path: '/admin/finances',
        icon: Wallet,
        roles: ['super_admin', 'tournament_manager', 'disciplinary_committee'],
      },
    ],
  },
  {
    title: 'المحتوى والنظام',
    items: [
      {
        name: 'التبليغات والأخبار',
        path: '/admin/announcements',
        icon: Megaphone,
        roles: ['super_admin', 'tournament_manager', 'media_manager'],
      },
      { name: 'المستخدمون والصلاحيات', path: '/admin/users', icon: UserCog, roles: ['super_admin'] },
      { name: 'الإعدادات', path: '/admin/settings', icon: Settings, roles: ALL },
    ],
  },
];

export const AdminLayout = () => {
  const { profile, logout } = useAuth();
  const { isDemo } = useTournamentData();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const saved = window.localStorage.getItem('admin-sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      window.localStorage.setItem('admin-sidebar-collapsed', current ? '0' : '1');
      return !current;
    });
  };

  const role = profile?.role || '';
  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.roles.includes(role)),
      })).filter((group) => group.items.length > 0),
    [role],
  );

  const activeItem = groups.flatMap((group) => group.items).find((item) => item.path === location.pathname);

  return (
    <div className="relative min-h-screen">
      {/* Ambient panel background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(232,193,88,0.16),transparent_55%),radial-gradient(circle_at_10%_110%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="orb animate-float-slow right-[6%] top-[12%] h-80 w-80 bg-gold-500/14" />
        <div className="orb animate-drift bottom-[4%] left-[2%] h-72 w-72 bg-sky-glow/12" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'glass-panel fixed inset-y-0 right-0 z-40 hidden flex-col border-l border-white/8 transition-[width] duration-500 lg:flex',
          collapsed ? 'w-[5.5rem]' : 'w-72',
        )}
      >
        <div className="flex h-18 items-center justify-between gap-2 border-b border-white/8 px-4">
          <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold-300/35 bg-gold-400/12">
              <ShieldCheck className="h-5 w-5 text-gold-200" />
            </span>
            {!collapsed && (
              <span className="flex flex-col leading-tight">
                <span className="font-heading text-sm font-extrabold text-white">لوحة التحكم</span>
                <span className="text-[10px] font-bold text-gold-300/85">منطقة الإدارة واللجان</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              {!collapsed && (
                <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-400">{group.title}</p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    title={item.name}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-300',
                        isActive
                          ? 'bg-[linear-gradient(135deg,rgba(232,193,88,0.2),rgba(232,193,88,0.06))] text-gold-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
                          : 'text-ink-300 hover:bg-white/6 hover:text-white',
                        collapsed && 'justify-center px-0',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-gold-300')} />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                        {isActive && !collapsed && (
                          <span className="absolute left-2 h-6 w-1 rounded-full bg-gold-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/8 p-3">
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-ink-300 transition-colors hover:bg-white/6 hover:text-white"
          >
            {collapsed ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            {!collapsed && 'تصغير القائمة'}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-ink-300 transition-colors hover:bg-white/6 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            {!collapsed && 'عرض الموقع العام'}
          </Link>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-ink-300 transition-colors hover:bg-rose-glow/12 hover:text-rose-glow"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'glass-strong absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto p-4 transition-transform duration-500',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 font-heading text-base font-bold text-white">
              <ShieldCheck className="h-5 w-5 text-gold-300" />
              لوحة التحكم
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-ink-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-colors',
                        isActive ? 'bg-gold-400/15 text-gold-100' : 'text-ink-200 hover:bg-white/6 hover:text-white',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <div className="hairline my-4" />
          <Link
            to="/"
            className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-ink-200 hover:bg-white/6"
          >
            <ExternalLink className="h-4 w-4" />
            عرض الموقع العام
          </Link>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-rose-glow hover:bg-rose-glow/10"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </aside>
      </div>

      {/* Main column */}
      <div className={cn('transition-[padding] duration-500', collapsed ? 'lg:pr-[5.5rem]' : 'lg:pr-72')}>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300/80">لوحة التحكم</p>
                <h1 className="font-heading text-base font-bold text-white sm:text-lg">
                  {activeItem?.name || 'لوحة القيادة'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="glass-soft hidden items-center gap-2 rounded-2xl px-3 py-2 text-xs text-ink-300 md:flex">
                <Search className="h-3.5 w-3.5" />
                <span>ابحث في اللوحة…</span>
              </div>
              {isDemo && (
                <Badge tone="amber" size="sm" className="hidden sm:inline-flex">
                  قاعدة البيانات فارغة — بيانات نموذجية
                </Badge>
              )}
              <button className="glass relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-200 transition-colors hover:text-white">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-glow" />
              </button>
              <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400/18 text-xs font-black text-gold-100">
                  {(profile?.displayName || profile?.email || '؟').slice(0, 1)}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-32 truncate text-xs font-bold text-white">
                    {profile?.displayName || profile?.email}
                  </span>
                  <span className="text-[10px] font-bold text-gold-300/90">{ROLE_LABELS[role] || role}</span>
                </span>
              </div>
            </div>
          </div>
          {collapsed && (
            <div className="hidden px-8 pb-3 lg:block">
              <Badge tone="gold" size="sm">
                وضع القائمة المصغّرة
              </Badge>
            </div>
          )}
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/8 px-4 py-6 text-center text-[11px] text-ink-400 sm:px-8">
          <FileText className="mx-auto mb-2 h-4 w-4 text-ink-500" />
          منصة إدارة دوري صوب الشامية — كل التعديلات تُسجَّل لحظياً في قاعدة البيانات.
        </footer>
      </div>
    </div>
  );
};

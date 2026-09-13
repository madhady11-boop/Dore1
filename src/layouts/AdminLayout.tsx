import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, ShieldAlert, 
  Settings, LogOut, ArrowRight, Activity, FileText, Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export const AdminLayout = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const sidebarLinks = [
    { name: 'لوحة القيادة', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'الفرق', path: '/admin/teams', icon: <Users className="w-5 h-5" /> },
    { name: 'اللاعبين', path: '/admin/players', icon: <Users className="w-5 h-5" /> },
    { name: 'الحكام', path: '/admin/referees', icon: <ShieldAlert className="w-5 h-5" /> },
    { name: 'المباريات والنتائج', path: '/admin/matches', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'جدول الترتيب', path: '/admin/standings', icon: <Activity className="w-5 h-5" /> },
    { name: 'العقوبات والاعتراضات', path: '/admin/disciplinary', icon: <ShieldAlert className="w-5 h-5" /> },
    { name: 'التبليغات والأخبار', path: '/admin/announcements', icon: <Megaphone className="w-5 h-5" /> },
    { name: 'المالية', path: '/admin/finances', icon: <FileText className="w-5 h-5" /> },
    { name: 'الإعدادات', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col hidden lg:flex fixed inset-y-0 right-0 z-10">
        <div className="h-20 flex items-center px-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group">
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-medium">العودة للموقع</span>
          </Link>
        </div>
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-heading font-bold text-white mb-1">لوحة الإدارة</h2>
          <p className="text-xs text-primary font-medium">{profile?.displayName || profile?.email}</p>
          <span className="inline-block mt-2 px-2.5 py-1 bg-zinc-800 rounded-md text-[10px] uppercase tracking-wider text-zinc-400">
            {profile?.role.replace('_', ' ')}
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pr-72">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

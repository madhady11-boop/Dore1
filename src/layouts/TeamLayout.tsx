import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Users, CalendarDays, ShieldAlert, 
  LogOut, ArrowRight, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export const TeamLayout = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const sidebarLinks = [
    { name: 'نظرة عامة', path: '/team-dashboard', icon: <Activity className="w-5 h-5" /> },
    { name: 'قائمة اللاعبين', path: '/team-dashboard/players', icon: <Users className="w-5 h-5" /> },
    { name: 'المباريات', path: '/team-dashboard/matches', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'العقوبات', path: '/team-dashboard/disciplinary', icon: <ShieldAlert className="w-5 h-5" /> },
    { name: 'الاعتراضات', path: '/team-dashboard/objections', icon: <FileText className="w-5 h-5" /> },
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
          <h2 className="text-xl font-heading font-bold text-white mb-1">لوحة الفريق</h2>
          <p className="text-xs text-primary font-medium">{profile?.displayName || 'حساب فريق'}</p>
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

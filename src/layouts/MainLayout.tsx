import { Outlet, Link } from 'react-router-dom';
import { Trophy, Menu, X, CalendarDays, Users, LayoutDashboard, Search, Home as HomeIcon, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  const navLinks = [
    { name: 'الرئيسية', path: '/', icon: <HomeIcon className="w-5 h-5" /> },
    { name: 'المباريات', path: '/matches', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'الترتيب', path: '/standings', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'الفرق', path: '/teams', icon: <Users className="w-5 h-5" /> },
    { name: 'التبليغات', path: '/announcements', icon: <Megaphone className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-xl text-white tracking-tight">دوري صوب الشامية</span>
                  <span className="text-xs text-primary font-medium">دوري الدرجة الأولى للفِرَق الشعبية</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors py-2 text-sm font-medium"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Search className="w-5 h-5" />
              </button>
              {profile ? (
                profile.role !== 'team' && profile.role !== 'unregistered' ? (
                  <Link
                    to="/admin"
                    className="bg-primary/10 text-primary border border-primary/30 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary hover:text-black transition-all"
                  >
                    لوحة الإدارة
                  </Link>
                ) : (
                  <Link
                    to="/team-dashboard"
                    className="bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-zinc-700 transition-all"
                  >
                    لوحة الفريق
                  </Link>
                )
              ) : (
                <Link
                  to="/login"
                  className="bg-primary text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-zinc-400 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-zinc-300 hover:bg-zinc-800 hover:text-white block px-3 py-3 rounded-xl text-base font-medium"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-zinc-800 px-3">
                {profile ? (
                   <Link
                   to={profile.role !== 'team' ? "/admin" : "/team-dashboard"}
                   className="flex justify-center w-full bg-primary/10 text-primary border border-primary/30 px-5 py-3 rounded-xl text-base font-bold"
                 >
                   {profile.role !== 'team' ? "لوحة الإدارة" : "لوحة الفريق"}
                 </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center w-full bg-primary text-black px-5 py-3 rounded-xl text-base font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-2xl text-white mb-2">دوري صوب الشامية</h3>
          <p className="text-zinc-500 mb-8">بإشراف مؤسسة الحكيم للشباب والرياضة</p>
          <div className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} جميع الحقوق محفوظة. تم التطوير لمنصة دوري الدرجة الأولى.
          </div>
        </div>
      </footer>
    </div>
  );
};

import { Link } from 'react-router-dom';
import { CalendarDays, Trophy, Activity, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export const Home = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent z-10" />
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee7a99833cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30 mix-blend-luminosity"
        />
        <div className="relative z-20 p-8 md:p-12 lg:p-16 flex flex-col items-start justify-center min-h-[400px]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            الموسم 2026 - جارية الآن
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-extrabold text-white mb-4 leading-tight tracking-tight">
            دوري <span className="text-primary">صوب الشامية</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-8 leading-relaxed">
            المنصة الرسمية لدوري الدرجة الأولى للفِرَق الشعبية. تابع المباريات، الإحصائيات، وآخر أخبار البطولة لحظة بلحظة.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/matches" className="px-8 py-4 rounded-full bg-primary text-black font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              المباراة القادمة
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/standings" className="px-8 py-4 rounded-full bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all border border-zinc-700">
              جدول الترتيب
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Match Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              المباراة القادمة
            </h2>
            <Link to="/matches" className="text-sm text-primary hover:underline">عرض الكل</Link>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex-1 text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-800 rounded-full border-2 border-zinc-700 flex items-center justify-center mb-4 text-3xl font-bold">🦅</div>
              <h3 className="text-xl font-bold text-white">تحدي المنصورية</h3>
              <p className="text-sm text-zinc-500 mt-1">المركز الأول</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium mb-3">
                الجولة 6
              </div>
              <div className="text-4xl font-heading font-black text-primary mb-1">VS</div>
              <div className="text-sm text-zinc-400">الجمعة 8:30 مساءً</div>
              <div className="text-xs text-zinc-500 mt-1">ملعب صوب الشامية</div>
            </div>

            <div className="flex-1 text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-800 rounded-full border-2 border-zinc-700 flex items-center justify-center mb-4 text-3xl font-bold">⚡</div>
              <h3 className="text-xl font-bold text-white">شباب الشامية</h3>
              <p className="text-sm text-zinc-500 mt-1">المركز الثالث</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            إحصائيات سريعة
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col">
              <span className="text-3xl font-heading font-black text-white mb-1">56</span>
              <span className="text-sm text-zinc-400">مباراة ملعوبة</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col">
              <span className="text-3xl font-heading font-black text-white mb-1">324</span>
              <span className="text-sm text-zinc-400">هدف مسجل</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col">
              <span className="text-3xl font-heading font-black text-white mb-1">16</span>
              <span className="text-sm text-zinc-400">فريق مشارك</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col">
              <span className="text-3xl font-heading font-black text-white mb-1">184</span>
              <span className="text-sm text-zinc-400">بطاقة صفراء</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              هداف البطولة
              <Trophy className="w-5 h-5 text-primary" />
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl">👤</div>
              <div>
                <div className="font-bold text-white">مساعد ياسين</div>
                <div className="text-sm text-zinc-400">تحدي المنصورية</div>
              </div>
              <div className="mr-auto font-heading font-black text-2xl text-primary">8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

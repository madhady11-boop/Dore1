import { Trophy, Users, CalendarDays, ShieldAlert, FileText, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { profile } = useAuth();

  const stats = [
    { label: 'عدد الفرق', value: '16', icon: <Users className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'عدد اللاعبين', value: '320', icon: <Users className="w-5 h-5" />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'إجمالي المباريات', value: '56', icon: <CalendarDays className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'المباريات المكتملة', value: '42', icon: <CalendarDays className="w-5 h-5" />, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'المباريات المؤجلة', value: '3', icon: <CalendarDays className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'العقوبات', value: '11', icon: <ShieldAlert className="w-5 h-5" />, color: 'text-accent-red', bg: 'bg-accent-red/10' },
    { label: 'الاعتراضات', value: '4', icon: <FileText className="w-5 h-5" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'المبالغ المستحقة', value: '850,000', suffix: 'د.ع', icon: <Trophy className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">مرحباً، {profile?.displayName || 'المدير'} 👋</h1>
          <p className="text-zinc-400">إليك نظرة عامة على إحصائيات البطولة لهذا اليوم.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/matches" className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
            إضافة نتيجة
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-32 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">{stat.label}</span>
              <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-heading font-bold text-white">{stat.value}</span>
              {stat.suffix && <span className="text-zinc-500 text-sm font-medium">{stat.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">آخر النتائج المدخلة</h2>
            <Link to="/admin/matches" className="text-sm text-primary hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold">تحدي المنصورية</span>
                <span className="bg-zinc-800 px-3 py-1 rounded-full font-bold text-primary">3 - 2</span>
                <span className="font-bold">شباب الشامية</span>
              </div>
              <span className="text-xs text-zinc-500">منذ ساعتين</span>
            </div>
            {/* Mock entries */}
            <div className="p-4 rounded-2xl bg-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold">نسور الفرات</span>
                <span className="bg-zinc-800 px-3 py-1 rounded-full font-bold text-primary">1 - 1</span>
                <span className="font-bold">أبطال المدينة</span>
              </div>
              <span className="text-xs text-zinc-500">منذ 5 ساعات</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">قرارات انضباطية أخيرة</h2>
            <Link to="/admin/disciplinary" className="text-sm text-primary hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-800/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">قرار رقم 014 - تحدي المنصورية</h4>
                <p className="text-xs text-zinc-400 mt-1">غرامة مالية + إيقاف إداري بسبب عدم تسديد أجور التحكيم.</p>
                <span className="text-[10px] text-zinc-500 mt-2 block">13/09/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

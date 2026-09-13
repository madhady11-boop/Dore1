import { useAuth } from '../../contexts/AuthContext';
import { Users, CalendarDays, ShieldAlert, FileText } from 'lucide-react';

export const TeamDashboard = () => {
  const { profile } = useAuth();

  const stats = [
    { label: 'عدد اللاعبين', value: '18', icon: <Users className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'المباريات', value: '8', icon: <CalendarDays className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'العقوبات', value: '1', icon: <ShieldAlert className="w-5 h-5" />, color: 'text-accent-red', bg: 'bg-accent-red/10' },
    { label: 'المستحقات', value: '50,000', suffix: 'د.ع', icon: <FileText className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">مرحباً، {profile?.displayName || 'الفريق'} 👋</h1>
        <p className="text-zinc-400">نظرة عامة على فريقك.</p>
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
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, User, Trophy } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  coach: string;
  establishedYear: number;
  logo?: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  points: number;
}

export const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const q = query(collection(db, 'teams'), orderBy('points', 'desc'));
        const snapshot = await getDocs(q);
        const fetched: Team[] = [];
        snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as Team));
        setTeams(fetched);
      } catch (error) {
        console.error("Error fetching teams: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center md:text-right max-w-2xl">
        <h1 className="text-4xl font-heading font-extrabold text-white mb-4">الفرق المشاركة</h1>
        <p className="text-zinc-400 text-lg">تعرف على الفرق المتنافسة في البطولة، تصفح تشكيلاتها، نتائجها، وإحصائياتها.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link 
              key={team.id} 
              to={`/teams/${team.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-primary/50 transition-colors group relative overflow-hidden block"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 text-primary" />
                  )}
                </div>
                
                <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-500 mb-0.5">النقاط</span>
                  <span className="font-heading font-black text-lg text-white leading-none">{team.points || 0}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
              
              <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-400 mb-6">
                <span className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800/50">
                  <User className="w-3.5 h-3.5" />
                  {team.coach || 'غير محدد'}
                </span>
                <span className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800/50">
                  <Trophy className="w-3.5 h-3.5" />
                  {team.establishedYear || '-'}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-zinc-800/50">
                <div className="text-center">
                  <div className="text-xs text-zinc-500 font-bold mb-1">لعب</div>
                  <div className="text-sm font-heading font-bold text-white">{team.played || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 font-bold mb-1">فاز</div>
                  <div className="text-sm font-heading font-bold text-accent-green">{team.won || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 font-bold mb-1">تعادل</div>
                  <div className="text-sm font-heading font-bold text-zinc-300">{team.drew || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 font-bold mb-1">خسر</div>
                  <div className="text-sm font-heading font-bold text-accent-red">{team.lost || 0}</div>
                </div>
              </div>
            </Link>
          ))}
          {teams.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-3xl">
              لا توجد فرق مسجلة حالياً.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

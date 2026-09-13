import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trophy, Plus, ShieldAlert, Users, Search } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  coach: string;
  captain: string;
  establishedYear: number;
  points: number;
}

export const AdminTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', coach: '', captain: '', establishedYear: new Date().getFullYear() });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedTeams: Team[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTeams.push({ id: doc.id, ...doc.data() } as Team);
      });
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error fetching teams: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'teams'), {
        ...newTeam,
        played: 0,
        won: 0,
        drew: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewTeam({ name: '', coach: '', captain: '', establishedYear: new Date().getFullYear() });
      fetchTeams(); // Refresh list
    } catch (error) {
      console.error("Error adding team: ", error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">إدارة الفرق</h1>
          <p className="text-zinc-400">إضافة وتعديل الفرق المشاركة في البطولة.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة فريق جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">إضافة فريق جديد</h2>
          <form onSubmit={handleAddTeam} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم الفريق</label>
              <input 
                required
                type="text" 
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: تحدي المنصورية"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم المدرب</label>
              <input 
                type="text" 
                value={newTeam.coach}
                onChange={(e) => setNewTeam({...newTeam, coach: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="اسم مدرب الفريق"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">كابتن الفريق</label>
              <input 
                type="text" 
                value={newTeam.captain}
                onChange={(e) => setNewTeam({...newTeam, captain: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="اسم قائد الفريق"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">سنة التأسيس</label>
              <input 
                type="number" 
                value={newTeam.establishedYear}
                onChange={(e) => setNewTeam({...newTeam, establishedYear: parseInt(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary text-black hover:bg-primary-dark transition-colors font-bold"
              >
                حفظ الفريق
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="ابحث عن فريق..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto text-zinc-400 text-sm">
          <span>الإجمالي: <strong className="text-white">{teams.length}</strong> فرق</span>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-primary/50 transition-colors group">
              <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 mx-auto text-2xl shadow-inner group-hover:scale-110 transition-transform">
                🦅
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-1">{team.name}</h3>
              <p className="text-xs text-zinc-500 text-center mb-6">تأسس عام {team.establishedYear}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm bg-zinc-950/50 p-2 rounded-lg">
                  <span className="text-zinc-500">المدرب</span>
                  <span className="font-medium text-zinc-300">{team.coach || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-zinc-950/50 p-2 rounded-lg">
                  <span className="text-zinc-500">الكابتن</span>
                  <span className="font-medium text-zinc-300">{team.captain || 'غير محدد'}</span>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  اللاعبين
                </button>
                <button className="flex-1 bg-primary/10 hover:bg-primary border border-primary/20 hover:text-black text-primary py-2.5 rounded-xl text-sm font-bold transition-colors">
                  تعديل
                </button>
              </div>
            </div>
          ))}

          {teams.length === 0 && !loading && (
             <div className="col-span-full py-12 text-center text-zinc-500">
               لا توجد فرق مضافة حتى الآن.
             </div>
          )}
        </div>
      )}
    </div>
  );
};

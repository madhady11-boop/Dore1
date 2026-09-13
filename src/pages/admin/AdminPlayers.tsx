import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Search, User, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface Team {
  id: string;
  name: string;
}

interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position: string;
  birthYear: number;
  photo?: string;
  status: string;
}

export const AdminPlayers = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: '',
    position: 'مهاجم',
    birthYear: '',
    photo: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    } else {
      setPlayers([]);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      const q = query(collection(db, 'teams'), orderBy('name'));
      const snapshot = await getDocs(q);
      const fetched: Team[] = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, name: doc.data().name }));
      setTeams(fetched);
      if (fetched.length > 0) setSelectedTeamId(fetched[0].id);
    } catch (error) {
      console.error("Error fetching teams: ", error);
    }
  };

  const fetchPlayers = async (teamId: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'players'), where('teamId', '==', teamId));
      const snapshot = await getDocs(q);
      const fetched: Player[] = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as Player));
      
      // Sort in memory by number
      fetched.sort((a, b) => (a.number || 0) - (b.number || 0));
      
      setPlayers(fetched);
    } catch (error) {
      console.error("Error fetching players: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    try {
      await addDoc(collection(db, 'players'), {
        teamId: selectedTeamId,
        name: newPlayer.name,
        number: parseInt(newPlayer.number) || 0,
        position: newPlayer.position,
        birthYear: parseInt(newPlayer.birthYear) || 2000,
        photo: newPlayer.photo || '',
        status: 'active',
        goals: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewPlayer({ name: '', number: '', position: 'مهاجم', birthYear: '', photo: '' });
      fetchPlayers(selectedTeamId);
    } catch (error) {
      console.error("Error adding player: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا اللاعب؟')) return;
    try {
      await deleteDoc(doc(db, 'players', id));
      fetchPlayers(selectedTeamId);
    } catch (error) {
      console.error("Error deleting player: ", error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">إدارة اللاعبين</h1>
          <p className="text-zinc-400">إضافة وتعديل أسماء وأرقام اللاعبين لكل فريق مشارك.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={!selectedTeamId}
          className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          إضافة لاعب للفريق
        </button>
      </div>

      {/* Team Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <label className="font-bold text-white whitespace-nowrap">اختر الفريق:</label>
        <select 
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full md:w-96 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-bold"
        >
          <option value="">-- يرجى اختيار فريق --</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {showAddForm && selectedTeamId && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 border-t-4 border-t-primary">
          <h2 className="text-xl font-bold text-white mb-6">إضافة لاعب جديد لفريق ({teams.find(t=>t.id === selectedTeamId)?.name})</h2>
          <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400">الاسم الثلاثي أو الرباعي</label>
              <input 
                required
                type="text" 
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: محمد علي حسن"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رقم القميص</label>
              <input 
                required
                type="number" 
                min="1" max="99"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: 10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">سنة التولد</label>
              <input 
                required
                type="number" 
                min="1970" max="2010"
                value={newPlayer.birthYear}
                onChange={(e) => setNewPlayer({...newPlayer, birthYear: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: 1999"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">المركز</label>
              <select 
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="حارس مرمى">حارس مرمى</option>
                <option value="مدافع">مدافع</option>
                <option value="ظهير">ظهير</option>
                <option value="وسط">وسط</option>
                <option value="صانع ألعاب">صانع ألعاب</option>
                <option value="جناح">جناح</option>
                <option value="مهاجم">مهاجم</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رابط صورة اللاعب (اختياري)</label>
              <input 
                type="url" 
                value={newPlayer.photo}
                onChange={(e) => setNewPlayer({...newPlayer, photo: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="https://..."
                dir="ltr"
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
                حفظ اللاعب
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors group relative overflow-hidden">
              <button 
                onClick={() => handleDelete(player.id)}
                className="absolute top-4 left-4 p-2 bg-zinc-950/80 text-zinc-500 hover:text-accent-red hover:bg-accent-red/20 rounded-lg transition-colors z-10 opacity-0 group-hover:opacity-100"
                title="حذف اللاعب"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-700" />
                )}
                <div className="absolute bottom-0 right-0 bg-primary text-black text-xs font-black px-1.5 py-0.5 rounded-tl-lg">
                  {player.number}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{player.name}</h3>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 mb-4">
                  <span className="bg-zinc-800 px-2 py-1 rounded-md">{player.position}</span>
                  <span className="bg-zinc-800 px-2 py-1 rounded-md">مواليد {player.birthYear}</span>
                </div>
              </div>
            </div>
          ))}

          {players.length === 0 && selectedTeamId && !loading && (
             <div className="col-span-full py-16 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
               <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-white mb-2">لا يوجد لاعبين</h3>
               <p className="text-zinc-500">هذا الفريق لا يمتلك أي لاعب مسجل في القائمة.</p>
             </div>
          )}
          
          {!selectedTeamId && (
            <div className="col-span-full py-16 text-center text-zinc-500">
               الرجاء اختيار فريق من القائمة لعرض وإدارة لاعبيه.
             </div>
          )}
        </div>
      )}
    </div>
  );
};

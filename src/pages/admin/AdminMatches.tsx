import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CalendarDays, Plus, Edit, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  round: string;
  stadiumId: string;
  status: 'upcoming' | 'finished' | 'postponed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
}

export const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Match State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatch, setNewMatch] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    round: '',
    stadiumId: 'ملعب صوب الشامية',
  });

  // Edit Match State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editScore, setEditScore] = useState({ homeScore: 0, awayScore: 0, status: 'finished' as Match['status'] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Teams
      const teamsSnapshot = await getDocs(query(collection(db, 'teams'), orderBy('name')));
      const fetchedTeams: Team[] = [];
      teamsSnapshot.forEach((doc) => fetchedTeams.push({ id: doc.id, name: doc.data().name }));
      setTeams(fetchedTeams);

      // Fetch Matches
      const matchesSnapshot = await getDocs(query(collection(db, 'matches'), orderBy('createdAt', 'desc')));
      const fetchedMatches: Match[] = [];
      matchesSnapshot.forEach((doc) => fetchedMatches.push({ id: doc.id, ...doc.data() } as Match));
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMatch.homeTeamId === newMatch.awayTeamId) {
      alert('لا يمكن اختيار نفس الفريق للمواجهة');
      return;
    }
    try {
      await addDoc(collection(db, 'matches'), {
        ...newMatch,
        status: 'upcoming',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewMatch({ homeTeamId: '', awayTeamId: '', date: '', time: '', round: '', stadiumId: 'ملعب صوب الشامية' });
      fetchData();
    } catch (error) {
      console.error("Error adding match: ", error);
    }
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      await updateDoc(doc(db, 'matches', editingMatch.id), {
        homeScore: editScore.homeScore,
        awayScore: editScore.awayScore,
        status: editScore.status,
        updatedAt: serverTimestamp(),
      });
      setEditingMatch(null);
      fetchData();
    } catch (error) {
      console.error("Error updating match: ", error);
    }
  };

  const getTeamName = (id: string) => {
    return teams.find(t => t.id === id)?.name || 'فريق غير معروف';
  };

  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'upcoming': return <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> قادمة</span>;
      case 'finished': return <span className="flex items-center gap-1 text-accent-green bg-accent-green/10 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> منتهية</span>;
      case 'postponed': return <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-xs font-bold"><AlertCircle className="w-3 h-3" /> مؤجلة</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-accent-red bg-accent-red/10 px-3 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" /> ملغاة</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">إدارة المباريات</h1>
          <p className="text-zinc-400">جدولة المباريات، تحديث النتائج، وإدارة الأحداث.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          جدولة مباراة جديدة
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 border-t-4 border-t-primary">
          <h2 className="text-xl font-bold text-white mb-6">تفاصيل المباراة الجديدة</h2>
          <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الفريق المضيف (الأول)</label>
              <select 
                required
                value={newMatch.homeTeamId}
                onChange={(e) => setNewMatch({...newMatch, homeTeamId: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">اختر الفريق...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الفريق الضيف (الثاني)</label>
              <select 
                required
                value={newMatch.awayTeamId}
                onChange={(e) => setNewMatch({...newMatch, awayTeamId: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">اختر الفريق...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">التاريخ</label>
              <input 
                required
                type="date" 
                value={newMatch.date}
                onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الوقت</label>
              <input 
                required
                type="time" 
                value={newMatch.time}
                onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الجولة / المرحلة</label>
              <input 
                required
                type="text" 
                value={newMatch.round}
                onChange={(e) => setNewMatch({...newMatch, round: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: الجولة الأولى، نصف النهائي..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الملعب</label>
              <input 
                required
                type="text" 
                value={newMatch.stadiumId}
                onChange={(e) => setNewMatch({...newMatch, stadiumId: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="اسم الملعب"
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
                جدولة المباراة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6">تحديث نتيجة المباراة</h2>
            
            <div className="flex items-center justify-between mb-8 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="text-center flex-1">
                <div className="font-bold text-white mb-2">{getTeamName(editingMatch.homeTeamId)}</div>
                <input 
                  type="number" 
                  min="0"
                  value={editScore.homeScore}
                  onChange={(e) => setEditScore({...editScore, homeScore: parseInt(e.target.value) || 0})}
                  className="w-16 h-16 text-center text-3xl font-heading font-black bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-primary mx-auto"
                />
              </div>
              <div className="text-zinc-500 font-bold text-xl px-4">-</div>
              <div className="text-center flex-1">
                <div className="font-bold text-white mb-2">{getTeamName(editingMatch.awayTeamId)}</div>
                <input 
                  type="number" 
                  min="0"
                  value={editScore.awayScore}
                  onChange={(e) => setEditScore({...editScore, awayScore: parseInt(e.target.value) || 0})}
                  className="w-16 h-16 text-center text-3xl font-heading font-black bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-primary mx-auto"
                />
              </div>
            </div>

            <form onSubmit={handleUpdateMatch} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">حالة المباراة</label>
                <select 
                  value={editScore.status}
                  onChange={(e) => setEditScore({...editScore, status: e.target.value as Match['status']})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="finished">منتهية</option>
                  <option value="upcoming">قادمة (لم تبدأ)</option>
                  <option value="postponed">مؤجلة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingMatch(null)}
                  className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary text-black hover:bg-primary-dark transition-colors font-bold"
                >
                  حفظ النتيجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <CalendarDays className="w-4 h-4" />
                  <span>{match.date} • {match.time}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{match.round}</span>
                </div>
                {getStatusBadge(match.status)}
              </div>

              <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-3 text-xl">🦅</div>
                  <span className="font-bold text-white text-center line-clamp-1">{getTeamName(match.homeTeamId)}</span>
                </div>
                
                <div className="px-6 flex flex-col items-center justify-center">
                  {match.status === 'finished' ? (
                    <div className="flex items-center gap-3 text-3xl font-heading font-black text-white bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
                      <span>{match.homeScore}</span>
                      <span className="text-zinc-600">-</span>
                      <span>{match.awayScore}</span>
                    </div>
                  ) : (
                    <div className="text-xl font-heading font-black text-zinc-600">VS</div>
                  )}
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-3 text-xl">⚡</div>
                  <span className="font-bold text-white text-center line-clamp-1">{getTeamName(match.awayTeamId)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-zinc-800/50 flex gap-2">
                <button 
                  onClick={() => {
                    setEditingMatch(match);
                    setEditScore({ 
                      homeScore: match.homeScore || 0, 
                      awayScore: match.awayScore || 0, 
                      status: match.status 
                    });
                  }}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  تحديث النتيجة
                </button>
              </div>
            </div>
          ))}

          {matches.length === 0 && (
             <div className="col-span-full py-16 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
               <CalendarDays className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-white mb-2">لا توجد مباريات</h3>
               <p className="text-zinc-500">قم بجدولة المباراة الأولى عبر الزر أعلاه.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

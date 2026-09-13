import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trophy, Edit2, Save, X, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface TeamStats {
  id: string;
  name: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  logo?: string;
}

export const AdminStandings = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    won: 0,
    drew: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'teams'));
      const snapshot = await getDocs(q);
      const fetchedTeams: TeamStats[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedTeams.push({
          id: docSnap.id,
          name: data.name,
          played: data.played || 0,
          won: data.won || 0,
          drew: data.drew || 0,
          lost: data.lost || 0,
          goalsFor: data.goalsFor || 0,
          goalsAgainst: data.goalsAgainst || 0,
          points: data.points || 0,
          logo: data.logo,
        });
      });

      // Sort: Points (desc) -> Goal Difference (desc) -> Goals For (desc)
      fetchedTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });

      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error fetching standings: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (team: TeamStats) => {
    setEditingId(team.id);
    setEditForm({
      won: team.won,
      drew: team.drew,
      lost: team.lost,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (teamId: string) => {
    setSaving(true);
    try {
      // Auto-calculate played and points
      const played = editForm.won + editForm.drew + editForm.lost;
      const points = (editForm.won * 3) + (editForm.drew * 1);

      await updateDoc(doc(db, 'teams', teamId), {
        won: editForm.won,
        drew: editForm.drew,
        lost: editForm.lost,
        goalsFor: editForm.goalsFor,
        goalsAgainst: editForm.goalsAgainst,
        played: played,
        points: points,
        updatedAt: serverTimestamp()
      });

      setEditingId(null);
      await fetchStandings(); // Re-fetch and re-sort
    } catch (error) {
      console.error("Error saving team stats: ", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">إدارة جدول الترتيب</h1>
          <p className="text-zinc-400">تحديث إحصائيات الفرق (فوز، تعادل، خسارة، أهداف). سيتم حساب النقاط وترتيب الجدول تلقائياً.</p>
        </div>
        <button 
          onClick={fetchStandings}
          className="bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2"
        >
          <Activity className="w-5 h-5" />
          تحديث البيانات
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase font-heading text-xs">
                <tr>
                  <th className="px-6 py-4 rounded-tr-3xl text-center w-16">المركز</th>
                  <th className="px-6 py-4">الفريق</th>
                  <th className="px-3 py-4 text-center">لعب</th>
                  <th className="px-3 py-4 text-center text-accent-green">فاز</th>
                  <th className="px-3 py-4 text-center text-zinc-300">تعادل</th>
                  <th className="px-3 py-4 text-center text-accent-red">خسر</th>
                  <th className="px-3 py-4 text-center">له</th>
                  <th className="px-3 py-4 text-center">عليه</th>
                  <th className="px-3 py-4 text-center text-primary font-bold">فارق</th>
                  <th className="px-3 py-4 text-center font-bold text-white text-base">نقاط</th>
                  <th className="px-6 py-4 rounded-tl-3xl text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {teams.map((team, index) => {
                  const isEditing = editingId === team.id;
                  const currentPlayed = isEditing ? (editForm.won + editForm.drew + editForm.lost) : team.played;
                  const currentPoints = isEditing ? ((editForm.won * 3) + editForm.drew) : team.points;
                  const currentGF = isEditing ? editForm.goalsFor : team.goalsFor;
                  const currentGA = isEditing ? editForm.goalsAgainst : team.goalsAgainst;
                  const currentGD = currentGF - currentGA;

                  return (
                    <tr 
                      key={team.id} 
                      className={clsx(
                        "hover:bg-zinc-800/20 transition-colors",
                        isEditing && "bg-primary/5"
                      )}
                    >
                      <td className="px-6 py-4 text-center">
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold font-heading",
                          index === 0 ? "bg-primary text-black" :
                          index === 1 ? "bg-zinc-300 text-black" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-zinc-950 text-zinc-500"
                        )}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                            🦅
                          </div>
                          <span className="font-bold text-white text-base">{team.name}</span>
                        </div>
                      </td>
                      
                      {/* لعب */}
                      <td className="px-3 py-4 text-center font-bold text-zinc-300">
                        {currentPlayed}
                      </td>

                      {/* فاز */}
                      <td className="px-3 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min="0" value={editForm.won} onChange={e => setEditForm({...editForm, won: parseInt(e.target.value)||0})} className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white focus:border-primary outline-none" />
                        ) : (
                          <span className="text-zinc-400">{team.won}</span>
                        )}
                      </td>

                      {/* تعادل */}
                      <td className="px-3 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min="0" value={editForm.drew} onChange={e => setEditForm({...editForm, drew: parseInt(e.target.value)||0})} className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white focus:border-primary outline-none" />
                        ) : (
                          <span className="text-zinc-400">{team.drew}</span>
                        )}
                      </td>

                      {/* خسر */}
                      <td className="px-3 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min="0" value={editForm.lost} onChange={e => setEditForm({...editForm, lost: parseInt(e.target.value)||0})} className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white focus:border-primary outline-none" />
                        ) : (
                          <span className="text-zinc-400">{team.lost}</span>
                        )}
                      </td>

                      {/* له */}
                      <td className="px-3 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min="0" value={editForm.goalsFor} onChange={e => setEditForm({...editForm, goalsFor: parseInt(e.target.value)||0})} className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white focus:border-primary outline-none" />
                        ) : (
                          <span className="text-zinc-400">{team.goalsFor}</span>
                        )}
                      </td>

                      {/* عليه */}
                      <td className="px-3 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min="0" value={editForm.goalsAgainst} onChange={e => setEditForm({...editForm, goalsAgainst: parseInt(e.target.value)||0})} className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center text-white focus:border-primary outline-none" />
                        ) : (
                          <span className="text-zinc-400">{team.goalsAgainst}</span>
                        )}
                      </td>

                      {/* فارق الأهداف */}
                      <td className="px-3 py-4 text-center font-bold" dir="ltr">
                        <span className={clsx(
                          currentGD > 0 ? "text-accent-green" : currentGD < 0 ? "text-accent-red" : "text-zinc-500"
                        )}>
                          {currentGD > 0 ? `+${currentGD}` : currentGD}
                        </span>
                      </td>

                      {/* النقاط */}
                      <td className="px-3 py-4 text-center">
                        <span className="text-xl font-heading font-black text-white">
                          {currentPoints}
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleSave(team.id)}
                              disabled={saving}
                              className="p-2 bg-primary/20 text-primary hover:bg-primary hover:text-black rounded-lg transition-colors"
                              title="حفظ"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEditClick(team)}
                            className="p-2 bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-primary hover:border-primary/50 rounded-lg transition-all mx-auto block"
                            title="تعديل الإحصائيات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {teams.length === 0 && (
              <div className="text-center py-16 text-zinc-500">
                لا توجد فرق مضافة حتى الآن لتشكيل جدول الترتيب.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

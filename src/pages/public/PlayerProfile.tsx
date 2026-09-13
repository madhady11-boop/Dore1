import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Star, Activity, Edit2, User, Calendar, Shield, Save, X } from 'lucide-react';

interface Player {
  id: string;
  teamId: string;
  name: string;
  photo?: string;
  number?: number;
  birthYear?: number;
  position?: string;
  status: 'active' | 'suspended' | 'excluded' | 'unregistered';
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  matchesPlayed?: number;
  motm?: number;
}

interface Team {
  id: string;
  name: string;
}

export const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { profile } = useAuth();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    goals: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0,
    motm: 0,
  });
  const [saving, setSaving] = useState(false);

  // Check if current user has permission to edit
  const canEdit = profile && (
    profile.role === 'super_admin' || 
    profile.role === 'tournament_manager' || 
    profile.role === 'stats_manager' || 
    (profile.role === 'team' && profile.teamId === player?.teamId)
  );

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const playerDoc = await getDoc(doc(db, 'players', playerId));
      if (playerDoc.exists()) {
        const playerData = { id: playerDoc.id, ...playerDoc.data() } as Player;
        setPlayer(playerData);
        
        // Setup initial edit form state
        setEditForm({
          goals: playerData.goals || 0,
          yellowCards: playerData.yellowCards || 0,
          redCards: playerData.redCards || 0,
          matchesPlayed: playerData.matchesPlayed || 0,
          motm: playerData.motm || 0,
        });

        // Fetch team
        if (playerData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', playerData.teamId));
          if (teamDoc.exists()) {
            setTeam({ id: teamDoc.id, name: teamDoc.data().name } as Team);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching player: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId || !player) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'players', playerId), {
        goals: editForm.goals,
        yellowCards: editForm.yellowCards,
        redCards: editForm.redCards,
        matchesPlayed: editForm.matchesPlayed,
        motm: editForm.motm,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      setPlayer({
        ...player,
        ...editForm
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating player stats: ", error);
    } finally {
      setSaving(false);
    }
  };

  const statusLabels = {
    active: { label: 'فعال', color: 'text-accent-green bg-accent-green/10' },
    suspended: { label: 'موقوف', color: 'text-yellow-500 bg-yellow-500/10' },
    excluded: { label: 'مستبعد', color: 'text-accent-red bg-accent-red/10' },
    unregistered: { label: 'غير مسجل', color: 'text-zinc-500 bg-zinc-500/10' },
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl mx-auto">
        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">اللاعب غير موجود</h3>
        <p className="text-zinc-500">عذراً، لم نتمكن من العثور على بطاقة هذا اللاعب.</p>
        <Link to="/teams" className="inline-block mt-6 px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark">
          العودة للفرق
        </Link>
      </div>
    );
  }

  const statStatus = statusLabels[player.status] || statusLabels.unregistered;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Player Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-zinc-800" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 px-6 sm:px-10 pt-16 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
            <div className="w-32 h-32 rounded-3xl bg-zinc-950 border-4 border-zinc-900 shadow-xl flex items-center justify-center shrink-0 relative overflow-hidden">
              {player.photo ? (
                <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-zinc-700" />
              )}
              {player.number && (
                <div className="absolute bottom-0 right-0 bg-primary text-black font-heading font-black px-2 py-1 rounded-tl-xl text-lg">
                  {player.number}
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">{player.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statStatus.color}`}>
                  {statStatus.label}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 font-medium">
                {team && (
                  <Link to={`/teams/${team.id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Shield className="w-4 h-4" />
                    {team.name}
                  </Link>
                )}
                {player.position && (
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    {player.position}
                  </span>
                )}
                {player.birthYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    مواليد {player.birthYear}
                  </span>
                )}
              </div>
            </div>
            
            {canEdit && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center gap-2 self-start sm:self-end"
              >
                <Edit2 className="w-4 h-4" />
                تحديث الإحصائيات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {isEditing ? (
        <form onSubmit={handleUpdateStats} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              تحديث إحصائيات اللاعب
            </h2>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الأهداف</label>
              <input 
                type="number" min="0"
                value={editForm.goals}
                onChange={(e) => setEditForm({...editForm, goals: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-2xl font-heading font-black text-center"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">المباريات الملعوبة</label>
              <input 
                type="number" min="0"
                value={editForm.matchesPlayed}
                onChange={(e) => setEditForm({...editForm, matchesPlayed: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-2xl font-heading font-black text-center"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رجل المباراة (MOTM)</label>
              <input 
                type="number" min="0"
                value={editForm.motm}
                onChange={(e) => setEditForm({...editForm, motm: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-2xl font-heading font-black text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">بطاقات صفراء</label>
              <input 
                type="number" min="0"
                value={editForm.yellowCards}
                onChange={(e) => setEditForm({...editForm, yellowCards: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-500 focus:outline-none focus:border-yellow-500 text-2xl font-heading font-black text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">بطاقات حمراء</label>
              <input 
                type="number" min="0"
                value={editForm.redCards}
                onChange={(e) => setEditForm({...editForm, redCards: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-red-500/30 rounded-xl px-4 py-3 text-red-500 focus:outline-none focus:border-red-500 text-2xl font-heading font-black text-center"
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary text-black hover:bg-primary-dark transition-colors font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ الإحصائيات
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <div className="text-2xl">⚽</div>
            </div>
            <span className="text-4xl font-heading font-black text-white mb-1">{player.goals || 0}</span>
            <span className="text-sm text-zinc-400 font-medium">الأهداف</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-zinc-300" />
            </div>
            <span className="text-4xl font-heading font-black text-white mb-1">{player.matchesPlayed || 0}</span>
            <span className="text-sm text-zinc-400 font-medium">المباريات</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3">
              <div className="w-5 h-7 bg-yellow-500 rounded-sm" />
            </div>
            <span className="text-4xl font-heading font-black text-white mb-1">{player.yellowCards || 0}</span>
            <span className="text-sm text-zinc-400 font-medium">إنذار أصفر</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3">
              <div className="w-5 h-7 bg-red-500 rounded-sm" />
            </div>
            <span className="text-4xl font-heading font-black text-white mb-1">{player.redCards || 0}</span>
            <span className="text-sm text-zinc-400 font-medium">طرد أحمر</span>
          </div>

          {player.motm !== undefined && player.motm > 0 && (
            <div className="md:col-span-4 bg-gradient-to-r from-primary/20 via-zinc-900 to-zinc-900 border border-primary/20 rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-primary" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">نجم المباراة (MOTM)</h3>
                <p className="text-zinc-400 text-sm">حصل هذا اللاعب على جائزة رجل المباراة <strong className="text-primary">{player.motm}</strong> مرات خلال هذا الموسم.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, User, CalendarDays, ChevronRight, Activity, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

interface Team {
  id: string;
  name: string;
  coach: string;
  captain: string;
  establishedYear: number;
  logo?: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  points: number;
}

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo?: string;
  birthYear: number;
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}

export const TeamProfile = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allTeams, setAllTeams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchTeamData(teamId);
    }
  }, [teamId]);

  const fetchTeamData = async (id: string) => {
    setLoading(true);
    try {
      // 1. Fetch Team info
      const teamDoc = await getDoc(doc(db, 'teams', id));
      if (teamDoc.exists()) {
        setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team);
      }

      // 2. Fetch all teams for match opponent names mapping
      const teamsSnap = await getDocs(collection(db, 'teams'));
      const teamMap: Record<string, string> = {};
      teamsSnap.forEach(doc => {
        teamMap[doc.id] = doc.data().name;
      });
      setAllTeams(teamMap);

      // 3. Fetch Players
      const playersQ = query(collection(db, 'players'), where('teamId', '==', id));
      const playersSnap = await getDocs(playersQ);
      const fetchedPlayers: Player[] = [];
      playersSnap.forEach(doc => fetchedPlayers.push({ id: doc.id, ...doc.data() } as Player));
      fetchedPlayers.sort((a, b) => (a.number || 0) - (b.number || 0));
      setPlayers(fetchedPlayers);

      // 4. Fetch Matches
      // Since Firestore doesn't easily allow logical OR on multiple fields without composite indexes,
      // we'll fetch both where homeTeamId == id and awayTeamId == id and combine them.
      const homeQ = query(collection(db, 'matches'), where('homeTeamId', '==', id));
      const awayQ = query(collection(db, 'matches'), where('awayTeamId', '==', id));
      
      const [homeSnap, awaySnap] = await Promise.all([getDocs(homeQ), getDocs(awayQ)]);
      const fetchedMatches: Match[] = [];
      
      homeSnap.forEach(doc => fetchedMatches.push({ id: doc.id, ...doc.data() } as Match));
      awaySnap.forEach(doc => {
        // avoid duplicates if somehow same (shouldn't happen)
        if (!fetchedMatches.some(m => m.id === doc.id)) {
          fetchedMatches.push({ id: doc.id, ...doc.data() } as Match);
        }
      });
      
      // Sort matches by date descending
      fetchedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMatches(fetchedMatches);

    } catch (error) {
      console.error("Error fetching team details: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl mx-auto">
        <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">الفريق غير موجود</h3>
        <p className="text-zinc-500">عذراً، لم نتمكن من العثور على بيانات هذا الفريق.</p>
        <Link to="/teams" className="inline-block mt-6 px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark">
          العودة للفرق
        </Link>
      </div>
    );
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const pastMatches = matches.filter(m => m.status === 'finished');

  return (
    <div className="space-y-12 pb-12">
      {/* Team Header */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-950 border-4 border-zinc-800 rounded-3xl flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-16 h-16 text-zinc-700" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-4">{team.name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
              <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 rounded-xl flex flex-col">
                <span className="text-zinc-500 text-xs mb-0.5">المدرب</span>
                <span className="text-white">{team.coach || 'غير محدد'}</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 rounded-xl flex flex-col">
                <span className="text-zinc-500 text-xs mb-0.5">الكابتن</span>
                <span className="text-white">{team.captain || 'غير محدد'}</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 rounded-xl flex flex-col">
                <span className="text-zinc-500 text-xs mb-0.5">سنة التأسيس</span>
                <span className="text-white">{team.establishedYear || '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 text-center min-w-[140px]">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-heading font-black text-white mb-1">{team.points || 0}</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">نقطة</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Matches */}
        <div className="lg:col-span-1 space-y-8">
          {/* Upcoming Matches */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              المباريات القادمة
            </h2>
            
            <div className="space-y-4">
              {upcomingMatches.length > 0 ? upcomingMatches.map(match => (
                <div key={match.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="text-xs text-zinc-500 font-bold text-center">
                    {match.date} • {match.time}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx("font-bold text-sm truncate flex-1 text-center", match.homeTeamId === team.id ? "text-primary" : "text-white")}>
                      {allTeams[match.homeTeamId]}
                    </span>
                    <span className="text-zinc-600 font-black text-sm">VS</span>
                    <span className={clsx("font-bold text-sm truncate flex-1 text-center", match.awayTeamId === team.id ? "text-primary" : "text-white")}>
                      {allTeams[match.awayTeamId]}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-zinc-500 text-sm py-4">لا توجد مباريات قادمة قريباً.</div>
              )}
            </div>
          </section>

          {/* Past Results */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-green" />
              أحدث النتائج
            </h2>
            
            <div className="space-y-4">
              {pastMatches.slice(0, 5).length > 0 ? pastMatches.slice(0, 5).map(match => {
                const isHome = match.homeTeamId === team.id;
                const teamScore = isHome ? match.homeScore : match.awayScore;
                const opponentScore = isHome ? match.awayScore : match.homeScore;
                const result = teamScore! > opponentScore! ? 'W' : teamScore! < opponentScore! ? 'L' : 'D';
                const resultColor = result === 'W' ? 'bg-accent-green text-black' : result === 'L' ? 'bg-accent-red text-white' : 'bg-zinc-500 text-white';

                return (
                  <div key={match.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                    <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs", resultColor)}>
                      {result}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3 font-bold text-sm">
                      <span className={clsx("truncate text-left w-20", isHome ? "text-primary" : "text-white")}>
                        {allTeams[match.homeTeamId]}
                      </span>
                      <span className="bg-zinc-900 px-2 py-1 rounded text-white min-w-[3rem] text-center">
                        {match.homeScore} - {match.awayScore}
                      </span>
                      <span className={clsx("truncate text-right w-20", !isHome ? "text-primary" : "text-white")}>
                        {allTeams[match.awayTeamId]}
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-zinc-500 text-sm py-4">لم يلعب الفريق أي مباراة بعد.</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Players */}
        <div className="lg:col-span-2">
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              تشكيلة الفريق
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {players.map(player => (
                <Link key={player.id} to={`/players/${player.id}`} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-primary/50 transition-colors group relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-600" />
                    )}
                    <div className="absolute bottom-0 right-0 bg-primary text-black text-xs font-black px-1.5 py-0.5 rounded-tl-lg">
                      {player.number}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">{player.name}</h3>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md inline-block">
                      {player.position}
                    </span>
                  </div>
                </Link>
              ))}

              {players.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">
                  لم يتم إضافة لاعبي هذا الفريق بعد.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

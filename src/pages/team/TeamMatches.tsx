import { useMemo, useState } from 'react';
import { CalendarDays, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { matchesForTeam, sortMatchesDesc, type MatchLike } from '../../lib/stats';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { Tabs } from '../../components/ui/Tabs';
import { MatchCard } from '../../components/football/MatchCard';

export const TeamMatches = () => {
  const { profile } = useAuth();
  const { teams, matches, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);
  const [filter, setFilter] = useState<'all' | MatchLike['status']>('all');

  const teamId = profile?.teamId || '';
  const teamMatches = useMemo(() => sortMatchesDesc(matchesForTeam(teamId, matches)), [matches, teamId]);
  const filtered = useMemo(
    () => (filter === 'all' ? teamMatches : teamMatches.filter((match) => match.status === filter)),
    [teamMatches, filter],
  );

  const stats = useMemo(() => {
    const finished = teamMatches.filter((match) => match.status === 'finished');
    let won = 0;
    let drew = 0;
    let lost = 0;
    let scored = 0;
    let conceded = 0;
    finished.forEach((match) => {
      const isHome = match.homeTeamId === teamId;
      const goalsFor = (isHome ? match.homeScore : match.awayScore) ?? 0;
      const goalsAgainst = (isHome ? match.awayScore : match.homeScore) ?? 0;
      scored += goalsFor;
      conceded += goalsAgainst;
      if (goalsFor > goalsAgainst) won += 1;
      else if (goalsFor === goalsAgainst) drew += 1;
      else lost += 1;
    });
    return { played: finished.length, won, drew, lost, scored, conceded };
  }, [teamMatches, teamId]);

  if (loading) return <LoadingBlock rows={5} label="جاري تحميل مباريات الفريق..." />;

  if (!teamId) {
    return <EmptyState title="حسابك غير مرتبط بفريق" icon={<CalendarDays className="h-6 w-6" />} />;
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-black text-white">مباريات الفريق</h1>
        <p className="text-sm text-ink-300">كل مباريات فريقك: المواعيد القادمة والنتائج المعتمدة مع سجل الأداء.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="مباريات لعبت" value={stats.played} icon={<CalendarDays className="h-[18px] w-[18px]" />} tone="sky" compact />
        <StatTile
          label="السجل"
          value={`${stats.won}-${stats.drew}-${stats.lost}`}
          icon={<Trophy className="h-[18px] w-[18px]" />}
          tone="gold"
          compact
          hint="فوز - تعادل - خسارة"
        />
        <StatTile
          label="أهداف الفريق"
          value={stats.scored}
          suffix={`/${stats.conceded} عليه`}
          icon={<Trophy className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
        />
        <StatTile
          label="قادمة"
          value={teamMatches.filter((match) => match.status === 'upcoming').length}
          icon={<CalendarDays className="h-[18px] w-[18px]" />}
          tone="violet"
          compact
        />
      </div>

      <Tabs<'all' | MatchLike['status']>
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'all', label: 'الكل', count: teamMatches.length },
          { value: 'upcoming', label: 'قادمة' },
          { value: 'finished', label: 'منتهية' },
          { value: 'postponed', label: 'مؤجلة' },
          { value: 'cancelled', label: 'ملغاة' },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد مباريات"
          description="سيتم عرض مباريات فريقك هنا بمجرد جدولتها من قبل لجنة المسابقات."
          icon={<CalendarDays className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              homeTeam={teamsById[match.homeTeamId]}
              awayTeam={teamsById[match.awayTeamId]}
              highlightTeamId={teamId}
            />
          ))}
        </div>
      )}

      <SectionTitle
        title="ملاحظة"
        subtitle="إذا لاحظت خطأً في نتيجة أو موعد، يمكنك تقديم اعتراض رسمي من صفحة «الاعتراضات» خلال المدة النظامية."
        icon={<Trophy className="h-4 w-4" />}
      />
    </div>
  );
};

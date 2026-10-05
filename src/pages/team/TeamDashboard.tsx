import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Medal,
  ShieldAlert,
  Shirt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import {
  buildStandings,
  groupSquadByLine,
  lastResultsForTeam,
  matchesForTeam,
  nextMatchForTeam,
} from '../../lib/stats';
import { LINE_LABELS, LINE_COLORS, type Line } from '../../lib/constants';
import { formatNumber } from '../../lib/utils';
import { Badge, RankChip } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
import { FormPills } from '../../components/football/FormPills';
import { MatchCard } from '../../components/football/MatchCard';

export const TeamDashboard = () => {
  const { profile } = useAuth();
  const { teams, players, matches, decisions, objections, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);

  const teamId = profile?.teamId || '';
  const team = teams.find((item) => item.id === teamId);
  const squad = useMemo(() => players.filter((player) => player.teamId === teamId), [players, teamId]);
  const lines = useMemo(() => groupSquadByLine(squad), [squad]);
  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const row = standings.find((item) => item.teamId === teamId);
  const teamMatches = useMemo(() => matchesForTeam(teamId, matches), [matches, teamId]);
  const nextMatch = useMemo(() => nextMatchForTeam(teamId, teamMatches), [teamMatches, teamId]);
  const recent = useMemo(() => lastResultsForTeam(teamId, teamMatches, 4), [teamMatches, teamId]);

  const suspended = squad.filter((player) => player.status === 'suspended');
  const fines = useMemo(
    () => decisions.filter((decision) => decision.targetId === teamId && (decision.amount ?? 0) > 0),
    [decisions, teamId],
  );
  const finesTotal = fines.reduce((sum, decision) => sum + (decision.amount ?? 0), 0);
  const myObjections = objections.filter((objection) => objection.teamId === teamId);
  const topScorer = [...squad].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0];

  if (loading) return <LoadingBlock rows={6} label="جاري تحميل بيانات فريقك..." />;

  if (!teamId || !team) {
    return (
      <EmptyState
        title="لم يتم ربط حسابك بفريق بعد"
        description="بعد أن تربط إدارة الدوري حسابك بأحد الفرق ستظهر هنا كل تفاصيل فريقك وإحصائياته."
        icon={<ShieldAlert className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-7">
      {/* Hero */}
      <GlassCard variant="strong" padding="lg" glow="gold" className="space-y-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <TeamBadge name={team.name} logo={team.logo} size="xl" />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-black text-white sm:text-3xl">{team.name}</h1>
              {row && <RankChip rank={row.rank} />}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald" size="sm">
                {squad.length} لاعب مسجّل
              </Badge>
              {row && (
                <Badge tone="gold" size="sm">
                  {row.points} نقطة · المركز {row.rank}
                </Badge>
              )}
              {row && <FormPills form={row.form} size="sm" />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/team-dashboard/squad">
              <Button icon={<Users className="h-4 w-4" />}>إدارة اللاعبين</Button>
            </Link>
            <Link to="/team-dashboard/profile">
              <Button variant="glass" icon={<Shirt className="h-4 w-4" />}>
                الشعار والبيانات
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="سجل الفريق"
          value={`${row?.won ?? 0}-${row?.drew ?? 0}-${row?.lost ?? 0}`}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
          hint={`${row?.played ?? 0} مباراة · ${row?.goalsFor ?? 0} هدف مسجّل`}
        />
        <StatTile
          label="اللاعبون الموقوفون"
          value={suspended.length}
          icon={<ShieldAlert className="h-[18px] w-[18px]" />}
          tone={suspended.length ? 'rose' : 'neutral'}
          compact
          hint={suspended.map((player) => player.name).slice(0, 2).join('، ') || 'لا يوجد إيقافات'}
        />
        <StatTile
          label="الغرامات"
          value={formatNumber(finesTotal)}
          suffix="د.ع"
          icon={<Wallet className="h-[18px] w-[18px]" />}
          tone="amber"
          compact
          hint={`${fines.length} قرار مالي`}
        />
        <StatTile
          label="الاعتراضات"
          value={myObjections.length}
          icon={<FileText className="h-[18px] w-[18px]" />}
          tone="sky"
          compact
          hint={`${myObjections.filter((item) => item.status === 'pending').length} قيد المراجعة`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        {/* Next match + results */}
        <div className="space-y-5">
          <SectionTitle title="المباراة القادمة" icon={<CalendarDays className="h-5 w-5" />} />
          {nextMatch ? (
            <MatchCard
              match={nextMatch}
              homeTeam={teamsById[nextMatch.homeTeamId]}
              awayTeam={teamsById[nextMatch.awayTeamId]}
              highlightTeamId={teamId}
            />
          ) : (
            <EmptyState title="لا توجد مباريات قادمة مجدولة" icon={<CalendarDays className="h-6 w-6" />} />
          )}

          <SectionTitle title="آخر النتائج" icon={<Medal className="h-5 w-5" />} />
          {recent.length ? (
            <div className="grid gap-4">
              {recent.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  homeTeam={teamsById[match.homeTeamId]}
                  awayTeam={teamsById[match.awayTeamId]}
                  highlightTeamId={teamId}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <EmptyState title="لم تُلعب مباريات بعد" icon={<Medal className="h-6 w-6" />} />
          )}
        </div>

        {/* Squad summary + alerts */}
        <div className="space-y-5">
          <SectionTitle
            title="ملخص التشكيلة"
            icon={<Shirt className="h-5 w-5" />}
            action={
              <Link to="/team-dashboard/squad" className="text-xs font-bold text-gold-300 hover:text-gold-100">
                ترتيب التشكيلة ←
              </Link>
            }
          />

          <GlassCard padding="lg" className="space-y-4">
            {(Object.keys(lines) as Line[]).map((line) => (
              <div key={line} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={LINE_COLORS[line].text}>{LINE_LABELS[line]}</span>
                  <span className="text-ink-400">{lines[line].length} لاعب</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${squad.length ? (lines[line].length / squad.length) * 100 : 0}%`,
                      background: LINE_COLORS[line].hex,
                    }}
                  />
                </div>
              </div>
            ))}
            {squad.length === 0 && (
              <p className="text-xs text-ink-300">لم تتم إضافة أي لاعب بعد — ابدأ من صفحة إدارة اللاعبين.</p>
            )}
          </GlassCard>

          {topScorer && (topScorer.goals ?? 0) > 0 && (
            <GlassCard padding="md" className="flex items-center gap-4">
              <PlayerAvatar
                name={topScorer.name}
                photo={topScorer.photo}
                number={topScorer.number}
                size="md"
              />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-gold-300">هداف الفريق</p>
                <p className="font-heading text-base font-bold text-white">{topScorer.name}</p>
                <p className="text-xs text-ink-300">{topScorer.matchesPlayed ?? 0} مباراة</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl font-black text-gold-200">{topScorer.goals}</p>
                <p className="text-[10px] text-ink-400">هدف</p>
              </div>
            </GlassCard>
          )}

          {suspended.length > 0 && (
            <GlassCard padding="md" className="space-y-3 border-rose-glow/25">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-glow">
                <AlertTriangle className="h-4 w-4" />
                تنبيهات الإيقاف
              </h3>
              {suspended.map((player) => (
                <div key={player.id} className="flex items-center gap-3 text-xs">
                  <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="xs" />
                  <span className="flex-1 font-bold text-white">{player.name}</span>
                  <Badge tone="rose" size="sm">
                    موقوف
                  </Badge>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

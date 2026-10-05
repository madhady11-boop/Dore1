import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Crown,
  Medal,
  ShieldAlert,
  Shirt,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import {
  buildStandings,
  groupSquadByLine,
  lastResultsForTeam,
  matchesForTeam,
  nextMatchForTeam,
  sortMatchesDesc,
} from '../../lib/stats';
import { LINE_LABELS, LINE_COLORS, type Line } from '../../lib/constants';
import { ageFromBirthYear, cn } from '../../lib/utils';
import { Badge, RankChip } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { Tabs } from '../../components/ui/Tabs';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
import { FormationPitch } from '../../components/football/FormationPitch';
import { FormPills } from '../../components/football/FormPills';
import { MatchCard } from '../../components/football/MatchCard';

type TabValue = 'formation' | 'squad' | 'matches' | 'stats';

export const TeamProfile = () => {
  const { teamId = '' } = useParams<{ teamId: string }>();
  const { teams, players, matches, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);
  const [tab, setTab] = useState<TabValue>('formation');

  const team = teams.find((item) => item.id === teamId);
  const squad = useMemo(
    () => players.filter((player) => player.teamId === teamId).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
    [players, teamId],
  );
  const lines = useMemo(() => groupSquadByLine(squad), [squad]);
  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const row = standings.find((item) => item.teamId === teamId);
  const teamMatches = useMemo(() => matchesForTeam(teamId, matches), [matches, teamId]);
  const history = useMemo(() => sortMatchesDesc(teamMatches), [teamMatches]);
  const upcoming = useMemo(() => nextMatchForTeam(teamId, teamMatches), [teamMatches, teamId]);
  const recent = useMemo(() => lastResultsForTeam(teamId, teamMatches, 6), [teamMatches, teamId]);
  const scorers = useMemo(
    () =>
      [...squad]
        .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
        .filter((player) => (player.goals ?? 0) > 0)
        .slice(0, 5),
    [squad],
  );
  const cards = squad.reduce(
    (acc, player) => ({
      yellow: acc.yellow + (player.yellowCards ?? 0),
      red: acc.red + (player.redCards ?? 0),
    }),
    { yellow: 0, red: 0 },
  );

  if (loading) return <LoadingBlock rows={6} label="جاري تحميل بيانات الفريق..." />;

  if (!team) {
    return (
      <EmptyState
        title="الفريق غير موجود"
        description="لم نتمكن من العثور على بيانات هذا الفريق، قد يكون الرابط غير صحيح."
        icon={<ShieldAlert className="h-6 w-6" />}
        action={
          <Link to="/teams">
            <Button variant="glass" icon={<ArrowRight className="h-4 w-4" />}>
              العودة لقائمة الفرق
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8 pb-6">
      {/* ============ HEADER ============ */}
      <section className="glass-strong noise relative overflow-hidden rounded-4xl p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-25%,rgba(232,193,88,0.28),transparent_55%),radial-gradient(circle_at_5%_120%,rgba(56,189,248,0.16),transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-right">
            <TeamBadge name={team.name} logo={team.logo} size="hero" className="shadow-glass" />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h1 className="font-heading text-3xl font-black text-white sm:text-4xl">{team.name}</h1>
                {row && <RankChip rank={row.rank} className="h-8 w-8 text-sm" />}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge tone="neutral" icon={<User className="h-3 w-3" />}>
                  المدرب: {team.coach || 'غير محدد'}
                </Badge>
                <Badge tone="neutral" icon={<Crown className="h-3 w-3" />}>
                  الكابتن: {team.captain || 'غير محدد'}
                </Badge>
                <Badge tone="neutral" icon={<Trophy className="h-3 w-3" />}>
                  تأسس {team.establishedYear || '—'}
                </Badge>
                <Badge tone="neutral" icon={<Users className="h-3 w-3" />}>
                  {squad.length} لاعب
                </Badge>
              </div>
              {row && (
                <div className="flex items-center justify-center gap-3 sm:justify-start">
                  <span className="text-[11px] font-bold text-ink-300">آخر 5 مباريات</span>
                  <FormPills form={row.form} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <MiniStat label="النقاط" value={row?.points ?? 0} accent="text-gold-200" />
            <MiniStat label="المركز" value={row ? `${row.rank}` : '—'} accent="text-white" />
            <MiniStat label="فارق الأهداف" value={row ? (row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff) : 0} accent="text-emerald-glow" />
          </div>
        </div>
      </section>

      {/* ============ QUICK STATS ============ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="سجل الفريق"
          value={`${row?.won ?? 0}-${row?.drew ?? 0}-${row?.lost ?? 0}`}
          icon={<Activity className="h-[18px] w-[18px]" />}
          tone="sky"
          hint={`${row?.played ?? 0} مباراة لعبت`}
        />
        <StatTile
          label="الأهداف"
          value={row?.goalsFor ?? 0}
          suffix={`/${row?.goalsAgainst ?? 0}`}
          icon={<Shirt className="h-[18px] w-[18px]" />}
          tone="emerald"
          hint="مسجّلة / مستقبلة"
        />
        <StatTile
          label="البطاقات"
          value={cards.yellow + cards.red}
          icon={<ShieldAlert className="h-[18px] w-[18px]" />}
          tone="rose"
          hint={`${cards.yellow} صفراء · ${cards.red} حمراء`}
        />
        <StatTile
          label="المباراة القادمة"
          value={upcoming ? upcoming.time || '—' : 'لا يوجد'}
          icon={<CalendarDays className="h-[18px] w-[18px]" />}
          tone="gold"
          hint={
            upcoming
              ? `ضد ${teamsById[upcoming.homeTeamId === team.id ? upcoming.awayTeamId : upcoming.homeTeamId]?.name || '—'}`
              : 'لم يتم جدولة مباريات قادمة'
          }
        />
      </section>

      {/* ============ TABS ============ */}
      <Tabs<TabValue>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'formation', label: 'التشكيلة الأساسية', icon: <Shirt className="h-4 w-4" /> },
          { value: 'squad', label: 'قائمة اللاعبين', icon: <Users className="h-4 w-4" />, count: squad.length },
          { value: 'matches', label: 'المباريات', icon: <CalendarDays className="h-4 w-4" />, count: teamMatches.length },
          { value: 'stats', label: 'الإحصائيات', icon: <Medal className="h-4 w-4" /> },
        ]}
      />

      {tab === 'formation' && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {squad.length ? (
            <FormationPitch lines={lines} formation={team.formation} />
          ) : (
            <EmptyState
              title="لم يتم إضافة لاعبين بعد"
              description="ستظهر التشكيلة المرتبة هنا بمجرد أن تضيف إدارة الفريق كشف اللاعبين."
              icon={<Users className="h-6 w-6" />}
            />
          )}

          <div className="space-y-5">
            <SectionTitle title="توزيع الخطوط" icon={<Activity className="h-5 w-5" />} />
            <GlassCard padding="md" className="space-y-4">
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
            </GlassCard>

            {scorers.length > 0 && (
              <>
                <SectionTitle title="هدافو الفريق" icon={<Medal className="h-5 w-5" />} />
                <GlassCard padding="none" className="divide-y divide-white/6">
                  {scorers.map((player) => (
                    <Link
                      key={player.id}
                      to={`/players/${player.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                    >
                      <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="sm" />
                      <span className="flex-1 truncate text-sm font-bold text-white">{player.name}</span>
                      <Badge tone="gold" size="sm">
                        {player.goals} هدف
                      </Badge>
                    </Link>
                  ))}
                </GlassCard>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'squad' && (
        <div className="space-y-6">
          {(Object.keys(lines) as Line[]).map((line) =>
            lines[line].length ? (
              <section key={line} className="space-y-3">
                <SectionTitle
                  title={LINE_LABELS[line]}
                  icon={<span className={cn('h-3 w-3 rounded-full', LINE_COLORS[line].bg)} />}
                  subtitle={`${lines[line].length} لاعب`}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lines[line].map((player) => (
                    <Link key={player.id} to={`/players/${player.id}`}>
                      <GlassCard hover padding="sm" className="flex items-center gap-3">
                        <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{player.name}</p>
                          <p className="truncate text-[11px] text-ink-300">
                            {player.position || LINE_LABELS[line]} · {ageFromBirthYear(player.birthYear)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-heading text-lg font-black text-gold-200">{player.goals ?? 0}</p>
                          <p className="text-[10px] text-ink-400">هدف</p>
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null,
          )}
          {squad.length === 0 && <EmptyState title="لا يوجد لاعبون مسجلون" icon={<Users className="h-6 w-6" />} />}
        </div>
      )}

      {tab === 'matches' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <SectionTitle title="المباريات القادمة" icon={<CalendarDays className="h-5 w-5" />} />
            {history.filter((m) => m.status === 'upcoming').length ? (
              <div className="grid gap-4">
                {history
                  .filter((m) => m.status === 'upcoming')
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      homeTeam={teamsById[match.homeTeamId]}
                      awayTeam={teamsById[match.awayTeamId]}
                      highlightTeamId={team.id}
                      variant="compact"
                    />
                  ))}
              </div>
            ) : (
              <EmptyState title="لا توجد مباريات قادمة" icon={<CalendarDays className="h-6 w-6" />} />
            )}
          </section>

          <section className="space-y-4">
            <SectionTitle title="آخر النتائج" icon={<Activity className="h-5 w-5" />} />
            {recent.length ? (
              <div className="grid gap-4">
                {recent.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    homeTeam={teamsById[match.homeTeamId]}
                    awayTeam={teamsById[match.awayTeamId]}
                    highlightTeamId={team.id}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="لم تُلعب أي مباراة بعد" icon={<Activity className="h-6 w-6" />} />
            )}
          </section>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard padding="lg" className="space-y-5">
            <SectionTitle title="الأداء الهجومي" icon={<Shirt className="h-5 w-5" />} />
            <div className="space-y-4">
              <MetricBar label="نسبة الفوز" value={row?.won ?? 0} total={row?.played ?? 0} color="bg-emerald-glow" />
              <MetricBar label="نسبة التعادل" value={row?.drew ?? 0} total={row?.played ?? 0} color="bg-white/45" />
              <MetricBar label="نسبة الخسارة" value={row?.lost ?? 0} total={row?.played ?? 0} color="bg-rose-glow" />
              <MetricBar
                label="معدل التسجيل"
                value={Number(((row?.goalsFor ?? 0) / Math.max(1, row?.played ?? 1)).toFixed(2))}
                total={5}
                color="bg-gold-400"
                suffix="هدف/مباراة"
              />
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="space-y-5">
            <SectionTitle title="أبرز اللاعبين" icon={<Medal className="h-5 w-5" />} />
            {squad.length ? (
              <div className="space-y-3">
                {[...squad]
                  .sort((a, b) => (b.motm ?? 0) - (a.motm ?? 0) || (b.matchesPlayed ?? 0) - (a.matchesPlayed ?? 0))
                  .slice(0, 5)
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <span className="w-5 text-center font-heading text-sm font-black text-ink-400">{index + 1}</span>
                      <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{player.name}</p>
                        <p className="text-[11px] text-ink-300">
                          {player.matchesPlayed ?? 0} مباراة · {player.motm ?? 0} نجم مباراة
                        </p>
                      </div>
                      <Badge tone="neutral" size="sm">
                        {player.goals ?? 0} هدف
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-ink-300">لا توجد إحصائيات فردية بعد.</p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, accent }: { label: string; value: string | number; accent: string }) => (
  <div className="glass-soft min-w-[6rem] rounded-2xl px-4 py-3 text-center">
    <p className={cn('font-heading text-2xl font-black tabular-nums', accent)}>{value}</p>
    <p className="text-[10px] font-bold text-ink-400">{label}</p>
  </div>
);

const MetricBar = ({
  label,
  value,
  total,
  color,
  suffix,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  suffix?: string;
}) => {
  const percentage = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-ink-200">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

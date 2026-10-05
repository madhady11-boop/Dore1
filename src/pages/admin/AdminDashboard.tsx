import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Megaphone,
  Plus,
  ShieldAlert,
  Target,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { useAuth } from '../../contexts/AuthContext';
import { buildStandings, buildSummary, rankPlayersBy, sortMatchesDesc } from '../../lib/stats';
import { ROLE_LABELS } from '../../lib/constants';
import { formatDate, formatNumber } from '../../lib/utils';
import { Badge, RankChip } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
import { MatchCard } from '../../components/football/MatchCard';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const { teams, players, matches, decisions, objections, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);

  const summary = useMemo(() => buildSummary(teams, players, matches), [teams, players, matches]);
  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const recentResults = useMemo(
    () => sortMatchesDesc(matches).filter((m) => m.status === 'finished').slice(0, 4),
    [matches],
  );
  const nextMatches = useMemo(() => sortMatchesDesc(matches).filter((m) => m.status === 'upcoming').slice(0, 4), [matches]);
  const topScorers = useMemo(() => rankPlayersBy(players, teams, 'goals', 5), [players, teams]);
  const pendingObjections = useMemo(() => objections.filter((item) => item.status === 'pending'), [objections]);
  const fines = useMemo(
    () => decisions.reduce((sum, decision) => sum + (decision.amount ?? 0), 0),
    [decisions],
  );
  const publishedDecisions = useMemo(() => decisions.filter((item) => item.status !== 'draft').length, [decisions]);

  const quickActions = [
    { label: 'إضافة فريق', path: '/admin/teams', icon: <Plus className="h-4 w-4" /> },
    { label: 'إضافة لاعب', path: '/admin/players', icon: <Users className="h-4 w-4" /> },
    { label: 'جدولة مباراة', path: '/admin/matches', icon: <CalendarDays className="h-4 w-4" /> },
    { label: 'تبليغ جديد', path: '/admin/announcements', icon: <Megaphone className="h-4 w-4" /> },
  ];

  if (loading) return <LoadingBlock rows={8} label="جاري تحميل مؤشرات اللوحة..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <Badge tone="gold" size="sm">
            {ROLE_LABELS[profile?.role || ''] || 'مستخدم'}
          </Badge>
          <h1 className="font-heading text-2xl font-black text-white sm:text-3xl">
            مرحباً {profile?.displayName || 'بك'} 👋
          </h1>
          <p className="text-sm text-ink-300">نظرة شاملة على البطولة — {formatDate(new Date())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.path + action.label} to={action.path}>
              <Button variant="glass" size="sm" icon={action.icon}>
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="الفرق المسجلة" value={summary.teams} icon={<Users className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile
          label="اللاعبون"
          value={summary.players}
          icon={<Users className="h-[18px] w-[18px]" />}
          tone="violet"
          compact
          hint={`${players.filter((p) => p.status === 'suspended').length} لاعب موقوف`}
        />
        <StatTile
          label="المباريات"
          value={summary.matches}
          icon={<CalendarDays className="h-[18px] w-[18px]" />}
          tone="sky"
          compact
          progress={summary.matches ? (summary.playedMatches / summary.matches) * 100 : 0}
          hint={`${summary.playedMatches} منتهية · ${summary.upcomingMatches} قادمة`}
        />
        <StatTile
          label="الأهداف"
          value={summary.goals}
          icon={<Target className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
          hint={`معدل ${summary.avgGoals} لكل مباراة`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="قرارات انضباطية"
          value={decisions.length}
          icon={<ShieldAlert className="h-[18px] w-[18px]" />}
          tone="rose"
          compact
          hint={`${publishedDecisions} منشورة`}
        />
        <StatTile
          label="اعتراضات قيد المراجعة"
          value={pendingObjections.length}
          icon={<FileText className="h-[18px] w-[18px]" />}
          tone="amber"
          compact
        />
        <StatTile
          label="إجمالي الغرامات"
          value={formatNumber(fines)}
          suffix="د.ع"
          icon={<Wallet className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
        />
        <StatTile
          label="البطاقات"
          value={summary.yellowCards + summary.redCards}
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          tone="rose"
          compact
          hint={`${summary.yellowCards} صفراء · ${summary.redCards} حمراء`}
        />
      </div>

      {/* Recent + upcoming */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle
            title="آخر النتائج المعتمدة"
            icon={<Activity className="h-5 w-5" />}
            action={
              <Link to="/admin/matches" className="text-xs font-bold text-gold-300 hover:text-gold-100">
                إدارة المباريات ←
              </Link>
            }
          />
          {recentResults.length ? (
            <div className="grid gap-4">
              {recentResults.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  homeTeam={teamsById[match.homeTeamId]}
                  awayTeam={teamsById[match.awayTeamId]}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد نتائج بعد" icon={<Activity className="h-6 w-6" />} />
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle
            title="مباريات قادمة"
            icon={<CalendarDays className="h-5 w-5" />}
            action={
              <Link to="/admin/matches" className="text-xs font-bold text-gold-300 hover:text-gold-100">
                جدولة مباراة ←
              </Link>
            }
          />
          {nextMatches.length ? (
            <div className="grid gap-4">
              {nextMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  homeTeam={teamsById[match.homeTeamId]}
                  awayTeam={teamsById[match.awayTeamId]}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد مباريات مجدولة" icon={<CalendarDays className="h-6 w-6" />} />
          )}
        </div>
      </div>

      {/* Table + scorers + objections */}
      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard padding="lg" className="space-y-5 xl:col-span-2">
          <SectionTitle
            title="مقدمة جدول الترتيب"
            icon={<Trophy className="h-5 w-5" />}
            action={
              <Link to="/admin/standings" className="text-xs font-bold text-gold-300 hover:text-gold-100">
                الجدول الكامل ←
              </Link>
            }
          />
          {standings.slice(0, 5).length ? (
            <div className="space-y-2">
              {standings.slice(0, 5).map((row) => (
                <div
                  key={row.teamId}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-2.5"
                >
                  <RankChip rank={row.rank} />
                  <TeamBadge name={row.name} logo={row.logo} size="xs" />
                  <span className="flex-1 truncate text-sm font-bold text-white">{row.name}</span>
                  <span className="text-[11px] text-ink-300">
                    {row.won}-{row.drew}-{row.lost}
                  </span>
                  <Badge tone="gold" size="sm">
                    {row.points} نقطة
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد بيانات" icon={<Trophy className="h-6 w-6" />} />
          )}
        </GlassCard>

        <div className="space-y-6">
          <GlassCard padding="lg" className="space-y-4">
            <SectionTitle title="الهدافون" icon={<Target className="h-5 w-5" />} />
            {topScorers.length ? (
              topScorers.map((row, index) => (
                <div key={row.player.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-heading text-sm font-black text-ink-400">{index + 1}</span>
                  <PlayerAvatar name={row.player.name} photo={row.player.photo} size="xs" showNumber={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{row.player.name}</p>
                    <p className="truncate text-[10px] text-ink-400">{row.team?.name}</p>
                  </div>
                  <Badge tone="gold" size="sm">
                    {row.value}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-300">لا توجد أهداف مسجلة.</p>
            )}
          </GlassCard>

          <GlassCard padding="lg" className="space-y-4">
            <SectionTitle
              title="اعتراضات قيد المراجعة"
              icon={<FileText className="h-5 w-5" />}
              action={
                <Link to="/admin/disciplinary" className="text-xs font-bold text-gold-300 hover:text-gold-100">
                  الكل ←
                </Link>
              }
            />
            {pendingObjections.length ? (
              pendingObjections.slice(0, 4).map((objection) => (
                <div
                  key={objection.id}
                  className="space-y-1 rounded-2xl border border-white/8 bg-white/4 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-white">
                      {teamsById[objection.teamId]?.name || 'فريق'}
                    </span>
                    <Badge tone="sky" size="sm">
                      قيد المراجعة
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-ink-300">{objection.details || objection.type || '—'}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-300">لا توجد اعتراضات قيد المراجعة.</p>
            )}
            <Link to="/admin/disciplinary" className="block">
              <Button variant="glass" size="sm" block iconEnd={<ArrowUpRight className="h-3.5 w-3.5" />}>
                إدارة الانضباط
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

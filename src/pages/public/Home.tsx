import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Flame,
  Medal,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { buildStandings, buildSummary, rankPlayersBy, sortMatchesAsc, sortMatchesDesc } from '../../lib/stats';
import { formatDate, timeAgo } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { MatchCard } from '../../components/football/MatchCard';
import { StandingsTable } from '../../components/football/StandingsTable';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';

export const Home = () => {
  const { teams, players, matches, announcements, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);

  const summary = useMemo(() => buildSummary(teams, players, matches), [teams, players, matches]);
  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const orderedMatches = useMemo(() => sortMatchesAsc(matches), [matches]);
  const recentResults = useMemo(() => sortMatchesDesc(matches).filter((m) => m.status === 'finished').slice(0, 4), [matches]);
  const nextMatches = useMemo(() => orderedMatches.filter((m) => m.status === 'upcoming').slice(0, 4), [orderedMatches]);
  const topScorers = useMemo(() => rankPlayersBy(players, teams, 'goals', 5), [players, teams]);
  const bestAttack = standings[0];
  const featuredMatch = nextMatches[0];
  const latestAnnouncement = useMemo(
    () =>
      [...announcements].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0],
    [announcements],
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="shimmer h-80 rounded-4xl border border-white/8" />
        <LoadingBlock rows={6} label="جاري تحميل بيانات الدوري..." />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-6">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-4xl border border-white/10">
        <div className="glass-strong noise relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-20%,rgba(232,193,88,0.28),transparent_55%),radial-gradient(circle_at_5%_120%,rgba(56,189,248,0.18),transparent_55%)]" />
          <div className="relative z-10 grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:p-14">
            <div className="space-y-7">
              <Badge tone="gold" dot size="md">
                الموسم {new Date().getFullYear()} — البطولة جارية
              </Badge>
              <div className="space-y-4">
                <h1 className="font-heading text-4xl font-black leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                  دوري <span className="text-gradient-gold glow-text-gold">صوب الشامية</span>
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
                  المنصة الرسمية لدوري الدرجة الأولى للفِرَق الشعبية. تابع المباريات لحظة بلحظة، جدول الترتيب، التشكيلات،
                  الهدافين، والقرارات الرسمية للجنة الانضباط.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/matches">
                  <Button size="lg" icon={<CalendarDays className="h-5 w-5" />} iconEnd={<ArrowLeft className="h-4 w-4" />}>
                    جدول المباريات
                  </Button>
                </Link>
                <Link to="/standings">
                  <Button size="lg" variant="glass" icon={<Trophy className="h-5 w-5" />}>
                    ترتيب الدوري
                  </Button>
                </Link>
                <Link to="/teams">
                  <Button size="lg" variant="ghost" icon={<ShieldCheck className="h-5 w-5" />}>
                    الفرق المشاركة
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature card: leader / next match */}
            <div className="space-y-4">
              {featuredMatch ? (
                <MatchCard
                  match={featuredMatch}
                  homeTeam={teamsById[featuredMatch.homeTeamId]}
                  awayTeam={teamsById[featuredMatch.awayTeamId]}
                  variant="featured"
                  highlightTeamId={featuredMatch.homeTeamId}
                />
              ) : (
                <GlassCard variant="gold" glow="gold" className="text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-gold-300" />
                  <h3 className="font-heading text-lg font-bold text-white">انطلاق الموسم قريباً</h3>
                  <p className="mt-1 text-sm text-ink-200">لم يتم جدولة مباريات قادمة حتى الآن.</p>
                </GlassCard>
              )}

              {topScorers[0] && (
                <GlassCard variant="glass" className="flex items-center gap-4">
                  <PlayerAvatar
                    name={topScorers[0].player.name}
                    photo={topScorers[0].player.photo}
                    number={topScorers[0].player.number}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-gold-300">هداف البطولة</p>
                    <p className="font-heading text-base font-bold text-white">{topScorers[0].player.name}</p>
                    <p className="text-xs text-ink-300">{topScorers[0].team?.name || '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-3xl font-black text-gold-200">{topScorers[0].value}</p>
                    <p className="text-[10px] font-bold text-ink-400">هدف</p>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SUMMARY ================= */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="الفِرق المشاركة"
          value={summary.teams}
          icon={<ShieldCheck className="h-[18px] w-[18px]" />}
          tone="gold"
          hint={`${summary.players} لاعب مسجّل في كشوفات البطولة`}
        />
        <StatTile
          label="المباريات المكتملة"
          value={summary.playedMatches}
          suffix={`من ${summary.matches}`}
          icon={<CalendarDays className="h-[18px] w-[18px]" />}
          tone="sky"
          progress={summary.matches ? (summary.playedMatches / summary.matches) * 100 : 0}
          hint={`${summary.upcomingMatches} مباراة قادمة`}
        />
        <StatTile
          label="الأهداف المسجلة"
          value={summary.goals}
          icon={<Target className="h-[18px] w-[18px]" />}
          tone="emerald"
          hint={`معدل ${summary.avgGoals} هدف لكل مباراة`}
        />
        <StatTile
          label="البطاقات"
          value={summary.yellowCards + summary.redCards}
          icon={<Flame className="h-[18px] w-[18px]" />}
          tone="rose"
          hint={`${summary.yellowCards} صفراء · ${summary.redCards} حمراء`}
        />
      </section>

      {/* ================= MATCHES + STANDINGS ================= */}
      <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <SectionTitle
            eyebrow="لحظة بلحظة"
            title="المباريات القادمة"
            icon={<CalendarDays className="h-5 w-5" />}
            action={
              <Link to="/matches" className="text-xs font-bold text-gold-300 transition-colors hover:text-gold-100">
                عرض الكل ←
              </Link>
            }
          />
          {nextMatches.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
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
            <EmptyState
              title="لا توجد مباريات مجدولة"
              description="سيتم نشر جدول الجولات القادمة من قبل لجنة المسابقات."
              icon={<CalendarDays className="h-6 w-6" />}
            />
          )}
        </div>

        <div className="space-y-5">
          <SectionTitle
            eyebrow="المنافسة"
            title="ترتيب الدوري"
            icon={<Trophy className="h-5 w-5" />}
            action={
              <Link to="/standings" className="text-xs font-bold text-gold-300 transition-colors hover:text-gold-100">
                الجدول كاملاً ←
              </Link>
            }
          />
          {standings.length ? (
            <StandingsTable rows={standings} limit={6} compact linkTeams />
          ) : (
            <EmptyState title="لا توجد بيانات ترتيب" icon={<Activity className="h-6 w-6" />} />
          )}
        </div>
      </section>

      {/* ================= SCORERS + RESULTS ================= */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionTitle
            eyebrow="الأرقام تتحدث"
            title="هدافو البطولة"
            icon={<Medal className="h-5 w-5" />}
          />
          <GlassCard padding="none" className="divide-y divide-white/6">
            {topScorers.length === 0 && (
              <div className="p-6 text-center text-sm text-ink-300">لم تُسجَّل أهداف حتى الآن.</div>
            )}
            {topScorers.map((row, index) => (
              <Link
                key={row.player.id}
                to={`/players/${row.player.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/5 sm:px-5"
              >
                <span className="w-6 text-center font-heading text-sm font-black text-ink-400">{index + 1}</span>
                <PlayerAvatar
                  name={row.player.name}
                  photo={row.player.photo}
                  number={row.player.number}
                  size="sm"
                  showNumber={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{row.player.name}</p>
                  <p className="truncate text-[11px] text-ink-300">{row.team?.name || '—'}</p>
                </div>
                <Badge tone="gold" size="sm">
                  {row.value} هدف
                </Badge>
              </Link>
            ))}
          </GlassCard>
        </div>

        <div className="space-y-5">
          <SectionTitle eyebrow="آخر الجولات" title="أحدث النتائج" icon={<Activity className="h-5 w-5" />} />
          <div className="grid gap-4">
            {recentResults.length ? (
              recentResults.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  homeTeam={teamsById[match.homeTeamId]}
                  awayTeam={teamsById[match.awayTeamId]}
                  variant="compact"
                />
              ))
            ) : (
              <EmptyState
                title="لا توجد نتائج بعد"
                description="ستظهر النتائج هنا فور اعتمادها من لجنة المسابقات."
                icon={<Activity className="h-6 w-6" />}
              />
            )}
          </div>
        </div>
      </section>

      {/* ================= ANNOUNCEMENTS ================= */}
      {latestAnnouncement && (
        <section className="space-y-5">
          <SectionTitle
            eyebrow="رسمياً"
            title="آخر التبليغات"
            icon={<Megaphone className="h-5 w-5" />}
            action={
              <Link to="/announcements" className="text-xs font-bold text-gold-300 transition-colors hover:text-gold-100">
                كل التبليغات ←
              </Link>
            }
          />
          <GlassCard variant="gold" glow="gold" padding="lg" hover>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge tone="gold" size="sm">
                  {latestAnnouncement.issuer || 'اللجنة المنظمة'}
                </Badge>
                <h3 className="font-heading text-xl font-bold text-white sm:text-2xl">{latestAnnouncement.title}</h3>
                <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-100">
                  {latestAnnouncement.content?.slice(0, 320)}
                  {(latestAnnouncement.content?.length || 0) > 320 ? '…' : ''}
                </p>
              </div>
              <div className="space-y-2 text-xs text-ink-200">
                <p className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(latestAnnouncement.date) !== '—'
                    ? formatDate(latestAnnouncement.date)
                    : timeAgo(latestAnnouncement.createdAt)}
                </p>
                <Link to="/announcements">
                  <Button size="sm" variant="glass" iconEnd={<ArrowLeft className="h-3.5 w-3.5" />}>
                    اقرأ التفاصيل
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* ================= BEST ATTACK TEASER ================= */}
      {bestAttack && (
        <section className="grid gap-4 sm:grid-cols-3">
          <GlassCard variant="panel" className="flex items-center gap-4">
            <TeamBadge name={bestAttack.name} logo={bestAttack.logo} size="md" />
            <div>
              <p className="text-[11px] font-bold text-gold-300">متصدر الترتيب</p>
              <p className="font-heading text-base font-bold text-white">{bestAttack.name}</p>
              <p className="text-xs text-ink-300">{bestAttack.points} نقطة</p>
            </div>
          </GlassCard>
          <GlassCard variant="panel" className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-glow/25 bg-emerald-glow/12">
              <Target className="h-6 w-6 text-emerald-glow" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-emerald-glow">أقوى هجوم</p>
              <p className="font-heading text-base font-bold text-white">
                {[...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0]?.name || '—'}
              </p>
              <p className="text-xs text-ink-300">
                {[...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0]?.goalsFor || 0} هدف
              </p>
            </div>
          </GlassCard>
          <GlassCard variant="panel" className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-glow/25 bg-sky-glow/12">
              <ShieldCheck className="h-6 w-6 text-sky-glow" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-sky-glow">أقوى دفاع</p>
              <p className="font-heading text-base font-bold text-white">
                {[...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]?.name || '—'}
              </p>
              <p className="text-xs text-ink-300">
                {[...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]?.goalsAgainst || 0} هدف في الشباك
              </p>
            </div>
          </GlassCard>
        </section>
      )}

      <section className="glass-soft flex flex-col items-center gap-4 rounded-4xl px-6 py-10 text-center">
        <Users className="h-8 w-8 text-gold-300" />
        <h3 className="font-heading text-xl font-bold text-white">هل تدير فريقاً مشاركاً؟</h3>
        <p className="max-w-xl text-sm leading-relaxed text-ink-300">
          سجّل الدخول بحساب فريقك لإدارة كشوفات اللاعبين، رفع الشعارات وصور اللاعبين، ترتيب التشكيلة، ومتابعة العقوبات
          والاعتراضات.
        </p>
        <Link to="/login">
          <Button size="lg" icon={<ShieldCheck className="h-5 w-5" />}>
            دخول حسابات الفرق
          </Button>
        </Link>
      </section>
    </div>
  );
};

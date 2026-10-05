import { useMemo, useState } from 'react';
import { Activity, Flame, Medal, Target, Trophy } from 'lucide-react';
import { useTournamentData } from '../../hooks/useTournamentData';
import { buildStandings, rankPlayersBy } from '../../lib/stats';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StandingsTable } from '../../components/football/StandingsTable';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Tabs } from '../../components/ui/Tabs';
import { Link } from 'react-router-dom';

export const Standings = () => {
  const { teams, players, matches, loading } = useTournamentData();
  const [board, setBoard] = useState<'table' | 'scorers' | 'discipline'>('table');

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const scorers = useMemo(() => rankPlayersBy(players, teams, 'goals', 15), [players, teams]);
  const discipline = useMemo(
    () =>
      players
        .map((player) => ({
          player,
          team: teams.find((t) => t.id === player.teamId),
          score: (player.yellowCards ?? 0) + (player.redCards ?? 0) * 2,
        }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15),
    [players, teams],
  );

  const leader = standings[0];

  return (
    <div className="space-y-8 pb-6">
      <section className="glass-strong noise relative overflow-hidden rounded-4xl p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-20%,rgba(232,193,88,0.26),transparent_55%),radial-gradient(circle_at_90%_120%,rgba(25,195,125,0.16),transparent_55%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300/85">
              <span className="h-px w-6 bg-gold-300/50" />
              لوحة الشرف
            </span>
            <h1 className="font-heading text-3xl font-black text-white sm:text-5xl">
              جدول <span className="text-gradient-gold">الترتيب</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-200 sm:text-base">
              يُحتسب الترتيب آلياً من نتائج المباريات المعتمدة: النقاط ثم فارق الأهداف ثم الأهداف المسجلة، مع سجل آخر خمس
              مباريات لكل فريق.
            </p>
          </div>
          {leader && (
            <GlassCard variant="gold" glow="gold">
              <div className="flex items-center gap-4">
                <TeamBadge name={leader.name} logo={leader.logo} size="lg" />
                <div className="space-y-1">
                  <Badge tone="gold" size="sm" icon={<Trophy className="h-3 w-3" />}>
                    المتصدر الحالي
                  </Badge>
                  <p className="font-heading text-xl font-black text-white">{leader.name}</p>
                  <p className="text-xs text-ink-200">
                    {leader.points} نقطة · {leader.won} فوز · فرق {leader.goalDiff > 0 ? '+' : ''}
                    {leader.goalDiff}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </section>

      <Tabs<'table' | 'scorers' | 'discipline'>
        value={board}
        onChange={setBoard}
        items={[
          { value: 'table', label: 'جدول الترتيب', icon: <Trophy className="h-4 w-4" /> },
          { value: 'scorers', label: 'الهدافون', icon: <Medal className="h-4 w-4" /> },
          { value: 'discipline', label: 'الانضباط', icon: <Flame className="h-4 w-4" /> },
        ]}
      />

      {loading ? (
        <LoadingBlock rows={6} label="جاري احتساب الترتيب..." />
      ) : board === 'table' ? (
        standings.length ? (
          <GlassCard padding="md">
            <StandingsTable rows={standings} />
          </GlassCard>
        ) : (
          <EmptyState title="لا توجد بيانات كافية" icon={<Activity className="h-6 w-6" />} />
        )
      ) : board === 'scorers' ? (
        <GlassCard padding="none">
          {scorers.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-300">لم تُسجَّل أهداف حتى الآن.</div>
          ) : (
            <ul className="divide-y divide-white/6">
              {scorers.map((row, index) => (
                <li key={row.player.id}>
                  <Link
                    to={`/players/${row.player.id}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/5 sm:px-6"
                  >
                    <span className="w-6 text-center font-heading text-sm font-black text-ink-400">{index + 1}</span>
                    <PlayerAvatar
                      name={row.player.name}
                      photo={row.player.photo}
                      number={row.player.number}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{row.player.name}</p>
                      <p className="truncate text-[11px] text-ink-300">
                        {row.team?.name} · {row.player.position || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(row.player.motm ?? 0) > 0 && (
                        <Badge tone="neutral" size="sm">
                          نجم المباراة ×{row.player.motm}
                        </Badge>
                      )}
                      <Badge tone="gold">{row.value} هدف</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          {discipline.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-300">لا توجد بطاقات مسجّلة حتى الآن.</div>
          ) : (
            <ul className="divide-y divide-white/6">
              {discipline.map((row, index) => (
                <li key={row.player.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
                  <span className="w-6 text-center font-heading text-sm font-black text-ink-400">{index + 1}</span>
                  <PlayerAvatar name={row.player.name} photo={row.player.photo} number={row.player.number} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{row.player.name}</p>
                    <p className="truncate text-[11px] text-ink-300">
                      {row.team?.name} · {row.player.position || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-glow/30 bg-amber-glow/12 px-2 py-1 text-[11px] font-bold text-amber-glow">
                      <span className="h-3.5 w-2.5 rounded-sm bg-amber-glow" />
                      {row.player.yellowCards ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-glow/30 bg-rose-glow/12 px-2 py-1 text-[11px] font-bold text-rose-glow">
                      <span className="h-3.5 w-2.5 rounded-sm bg-rose-glow" />
                      {row.player.redCards ?? 0}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      <SectionTitle
        title="الأرقام الجماعية"
        icon={<Target className="h-5 w-5" />}
        subtitle="ملخص سريع لأداء الفرق هجوماً ودفاعاً."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...standings]
          .sort((a, b) => b.goalsFor - a.goalsFor)
          .slice(0, 4)
          .map((row) => (
            <GlassCard key={row.teamId} variant="panel" hover className="space-y-3">
              <div className="flex items-center gap-3">
                <TeamBadge name={row.name} logo={row.logo} size="sm" />
                <span className="truncate text-sm font-bold text-white">{row.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                  <p className="font-heading text-lg font-black text-white">{row.goalsFor}</p>
                  <p className="text-ink-400">له</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                  <p className="font-heading text-lg font-black text-white">{row.goalsAgainst}</p>
                  <p className="text-ink-400">عليه</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                  <p className="font-heading text-lg font-black text-white">{row.played}</p>
                  <p className="text-ink-400">لعب</p>
                </div>
              </div>
            </GlassCard>
          ))}
      </div>
    </div>
  );
};

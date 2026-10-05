import { useMemo } from 'react';
import { Gavel, ShieldAlert, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData } from '../../hooks/useTournamentData';
import { cn, formatDate, formatNumber } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { PlayerAvatar } from '../../components/football/Avatars';

export const TeamDisciplinary = () => {
  const { profile } = useAuth();
  const { decisions, players, loading } = useTournamentData();

  const teamId = profile?.teamId || '';
  const squad = useMemo(() => players.filter((player) => player.teamId === teamId), [players, teamId]);
  const squadIds = useMemo(() => new Set(squad.map((player) => player.id)), [squad]);

  const teamDecisions = useMemo(
    () =>
      decisions
        .filter(
          (decision) =>
            (decision.targetType === 'team' && decision.targetId === teamId) ||
            (decision.targetId ? squadIds.has(decision.targetId) : false),
        )
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [decisions, teamId, squadIds],
  );

  const finesTotal = teamDecisions.reduce((sum, decision) => sum + (decision.amount ?? 0), 0);
  const carded = squad.filter((player) => (player.yellowCards ?? 0) + (player.redCards ?? 0) > 0);

  if (loading) return <LoadingBlock rows={5} label="جاري تحميل السجل الانضباطي..." />;

  if (!teamId) return <EmptyState title="حسابك غير مرتبط بفريق" icon={<ShieldAlert className="h-6 w-6" />} />;

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-black text-white">السجل الانضباطي</h1>
        <p className="text-sm text-ink-300">
          كل القرارات الصادرة بحق فريقك أو لاعبيها، مع سجل البطاقات وحالة الغرامات المالية.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="عدد القرارات" value={teamDecisions.length} icon={<Gavel className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile
          label="إجمالي الغرامات"
          value={formatNumber(finesTotal)}
          suffix="د.ع"
          icon={<Wallet className="h-[18px] w-[18px]" />}
          tone="rose"
          compact
        />
        <StatTile
          label="لاعبون لديهم بطاقات"
          value={carded.length}
          icon={<ShieldAlert className="h-[18px] w-[18px]" />}
          tone="amber"
          compact
        />
        <StatTile
          label="لاعبون موقوفون"
          value={squad.filter((player) => player.status === 'suspended').length}
          icon={<ShieldAlert className="h-[18px] w-[18px]" />}
          tone="violet"
          compact
        />
      </div>

      <SectionTitle title="قرارات لجنة الانضباط" icon={<Gavel className="h-5 w-5" />} />
      {teamDecisions.length === 0 ? (
        <EmptyState
          title="لا توجد قرارات بحق فريقك"
          description="سجل نظيف حتى الآن — نتمنى لك موسماً موفقاً."
          icon={<Gavel className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {teamDecisions.map((decision) => (
            <GlassCard key={decision.id} padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold" size="sm">
                    قرار رقم {decision.number || '—'}
                  </Badge>
                  <span className="text-[11px] text-ink-400">{formatDate(decision.date)}</span>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-bold',
                    decision.status === 'draft'
                      ? 'border-amber-glow/25 bg-amber-glow/12 text-amber-glow'
                      : 'border-emerald-glow/25 bg-emerald-glow/12 text-emerald-glow',
                  )}
                >
                  {decision.status === 'draft' ? 'قيد الاعتماد' : 'منشور'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-100">{decision.reason}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral" size="sm">
                  {decision.penaltyType || 'عقوبة'}
                </Badge>
                {!!decision.amount && (
                  <Badge tone="rose" size="sm">
                    {formatNumber(decision.amount)} د.ع
                  </Badge>
                )}
                <Badge tone="neutral" size="sm">
                  {decision.targetName || 'الفريق'}
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <SectionTitle title="سجل البطاقات في الفريق" icon={<ShieldAlert className="h-5 w-5" />} />
      {carded.length === 0 ? (
        <EmptyState title="لا توجد بطاقات مسجّلة" icon={<ShieldAlert className="h-6 w-6" />} />
      ) : (
        <GlassCard padding="none" className="divide-y divide-white/6">
          {carded.map((player) => (
            <div key={player.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
              <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{player.name}</p>
                <p className="text-[11px] text-ink-300">{player.position || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-glow/30 bg-amber-glow/12 px-2 py-1 text-[11px] font-bold text-amber-glow">
                  <span className="h-3.5 w-2.5 rounded-sm bg-amber-glow" />
                  {player.yellowCards ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-rose-glow/30 bg-rose-glow/12 px-2 py-1 text-[11px] font-bold text-rose-glow">
                  <span className="h-3.5 w-2.5 rounded-sm bg-rose-glow" />
                  {player.redCards ?? 0}
                </span>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
};

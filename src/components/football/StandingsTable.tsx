import { Link } from 'react-router-dom';
import { cn, withSign } from '../../lib/utils';
import type { StandingRow } from '../../lib/stats';
import { RankChip } from '../ui/Badge';
import { TeamBadge } from './Avatars';
import { FormPills } from './FormPills';
import { Skeleton } from '../ui/Feedback';

export interface StandingsTableProps {
  rows: StandingRow[];
  loading?: boolean;
  highlightTeamId?: string;
  showForm?: boolean;
  compact?: boolean;
  limit?: number;
  linkTeams?: boolean;
  className?: string;
}

export const StandingsTable = ({
  rows,
  loading,
  highlightTeamId,
  showForm = true,
  compact = false,
  limit,
  linkTeams = true,
  className,
}: StandingsTableProps) => {
  const visible = limit ? rows.slice(0, limit) : rows;

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-hidden rounded-3xl', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-300">
              <th className="w-12 px-2 py-2 text-center">#</th>
              <th className="px-3 py-2 text-right">الفريق</th>
              <th className="w-14 px-2 py-2 text-center">لعب</th>
              <th className="w-14 px-2 py-2 text-center">فاز</th>
              <th className="w-14 px-2 py-2 text-center">تعادل</th>
              <th className="w-14 px-2 py-2 text-center">خسر</th>
              {!compact && <th className="w-14 px-2 py-2 text-center">له</th>}
              {!compact && <th className="w-14 px-2 py-2 text-center">عليه</th>}
              <th className="w-16 px-2 py-2 text-center">الفرق</th>
              {showForm && !compact && <th className="w-32 px-2 py-2 text-center">آخر 5</th>}
              <th className="w-20 px-2 py-2 text-center">النقاط</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const isHighlighted = highlightTeamId === row.teamId;
              const zoneAccent =
                row.rank === 1
                  ? 'before:bg-[linear-gradient(180deg,#f4e0a1,#d4af37)]'
                  : row.rank <= 3
                    ? 'before:bg-emerald-glow'
                    : 'before:bg-transparent';
              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    'glass-soft group relative transition-all duration-300 hover:border-gold-400/35',
                    'before:absolute before:right-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-l-full before:content-[""]',
                    zoneAccent,
                    isHighlighted && 'border-gold-400/50 bg-gold-400/8',
                  )}
                >
                  <td className="rounded-r-2xl px-2 py-3 text-center">
                    <RankChip rank={row.rank} />
                  </td>
                  <td className="px-3 py-3">
                    {linkTeams ? (
                      <Link
                        to={`/teams/${row.teamId}`}
                        className="flex items-center gap-3 transition-colors hover:text-gold-200"
                      >
                        <TeamBadge name={row.name} logo={row.logo} size="sm" />
                        <span className="font-bold text-white group-hover:text-gold-100">{row.name}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <TeamBadge name={row.name} logo={row.logo} size="sm" />
                        <span className="font-bold text-white">{row.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-ink-200">{row.played}</td>
                  <td className="px-2 py-3 text-center tabular-nums font-bold text-emerald-glow">{row.won}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-ink-200">{row.drew}</td>
                  <td className="px-2 py-3 text-center tabular-nums font-bold text-rose-glow">{row.lost}</td>
                  {!compact && <td className="px-2 py-3 text-center tabular-nums text-ink-200">{row.goalsFor}</td>}
                  {!compact && (
                    <td className="px-2 py-3 text-center tabular-nums text-ink-200">{row.goalsAgainst}</td>
                  )}
                  <td
                    className={cn(
                      'px-2 py-3 text-center tabular-nums font-bold',
                      row.goalDiff > 0 ? 'text-emerald-glow' : row.goalDiff < 0 ? 'text-rose-glow' : 'text-ink-300',
                    )}
                  >
                    {withSign(row.goalDiff)}
                  </td>
                  {showForm && !compact && (
                    <td className="px-2 py-3">
                      <div className="flex justify-center">
                        <FormPills form={row.form} size="sm" />
                      </div>
                    </td>
                  )}
                  <td className="rounded-l-2xl px-2 py-3 text-center">
                    <span className="inline-flex min-w-9 items-center justify-center rounded-xl border border-gold-300/25 bg-gold-400/12 px-2 py-1 font-heading text-base font-black tabular-nums text-gold-100">
                      {row.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-[11px] text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#f4e0a1,#d4af37)]" />
          بطل الدوري
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-glow" />
          المراكز الأولى
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/25" />
          بقية الفرق
        </span>
        {visible.some((row) => row.played > 0) && (
          <span className="ms-auto">
            {visible[0]?.computed ? 'الترتيب محتسب آلياً من نتائج المباريات' : 'الترتيب حسب الإحصائيات المسجلة'}
          </span>
        )}
      </div>
    </div>
  );
};

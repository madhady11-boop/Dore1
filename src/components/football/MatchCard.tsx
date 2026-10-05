import type { ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Trophy } from 'lucide-react';
import { cn, formatLongDate, formatTime } from '../../lib/utils';
import { MATCH_STATUS } from '../../lib/constants';
import type { MatchLike, TeamLike } from '../../lib/stats';
import { TeamBadge } from './Avatars';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

export interface MatchCardProps {
  match: MatchLike;
  homeTeam?: TeamLike;
  awayTeam?: TeamLike;
  variant?: 'default' | 'compact' | 'featured';
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
  highlightTeamId?: string;
}

const statusBadge = (status: MatchLike['status']) => {
  const meta = MATCH_STATUS[status] || MATCH_STATUS.upcoming;
  return (
    <Badge tone="neutral" className={meta.className} size="sm">
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot, status === 'upcoming' && 'animate-pulse')} />
      {meta.label}
    </Badge>
  );
};

export const MatchCard = ({
  match,
  homeTeam,
  awayTeam,
  variant = 'default',
  actions,
  onClick,
  className,
  highlightTeamId,
}: MatchCardProps) => {
  const finished = match.status === 'finished' && typeof match.homeScore === 'number';
  const homeWon = finished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWon = finished && (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const featured = variant === 'featured';
  const compact = variant === 'compact';

  const homeHighlight = highlightTeamId && match.homeTeamId === highlightTeamId;
  const awayHighlight = highlightTeamId && match.awayTeamId === highlightTeamId;

  return (
    <GlassCard
      variant={featured ? 'strong' : 'glass'}
      padding={compact ? 'sm' : 'md'}
      hover={!!onClick}
      glow={featured ? 'gold' : 'none'}
      onClick={onClick}
      className={cn('flex flex-col gap-4', onClick && 'cursor-pointer', className)}
    >
      {/* Meta row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-300">
        <div className="flex flex-wrap items-center gap-2">
          {match.round && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold">
              <Trophy className="h-3 w-3 text-gold-400" />
              {match.round}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatLongDate(match.date)}
          </span>
          {match.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(match.time)}
            </span>
          )}
        </div>
        {statusBadge(match.status)}
      </div>

      {/* Teams & score */}
      <div className="flex items-center justify-between gap-3">
        <TeamSide
          team={homeTeam}
          fallbackName="الفريق المضيف"
          highlight={!!homeHighlight}
          align="center"
          size={compact ? 'sm' : 'md'}
          faded={finished && awayWon}
        />

        <div className="flex shrink-0 flex-col items-center gap-1 px-1">
          {finished ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-2 font-heading text-3xl font-black tabular-nums text-white shadow-inner sm:text-4xl">
              <span>{match.homeScore}</span>
              <span className="text-ink-400">-</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-2 font-heading text-xl font-black text-gold-300/80">
              VS
            </div>
          )}
          {match.stadiumId && !compact && (
            <span className="inline-flex items-center gap-1 text-[10px] text-ink-400">
              <MapPin className="h-3 w-3" />
              {match.stadiumId}
            </span>
          )}
        </div>

        <TeamSide
          team={awayTeam}
          fallbackName="الفريق الضيف"
          highlight={!!awayHighlight}
          align="center"
          size={compact ? 'sm' : 'md'}
          faded={finished && homeWon}
        />
      </div>

      {actions && <div className="flex flex-wrap gap-2 border-t border-white/8 pt-3">{actions}</div>}
    </GlassCard>
  );
};

const TeamSide = ({
  team,
  fallbackName,
  align,
  size,
  highlight,
  faded,
}: {
  team?: TeamLike;
  fallbackName: string;
  align: 'center';
  size: 'sm' | 'md';
  highlight?: boolean;
  faded?: boolean;
}) => (
  <div className={cn('flex flex-1 flex-col items-center gap-2 text-center', align === 'center' && 'items-center')}>
    <TeamBadge
      name={team?.name || fallbackName}
      logo={team?.logo}
      size={size === 'sm' ? 'sm' : 'md'}
      className={cn(
        'transition-all duration-500',
        highlight && 'ring-2 ring-gold-400/60 shadow-[0_0_24px_-6px_rgba(232,193,88,0.6)]',
        faded && 'opacity-60 saturate-50',
      )}
    />
    <span
      className={cn(
        'line-clamp-2 max-w-[8.5rem] text-xs font-bold leading-snug sm:text-sm',
        faded ? 'text-ink-300' : 'text-white',
        highlight && 'text-gold-200',
      )}
    >
      {team?.name || fallbackName}
    </span>
  </div>
);

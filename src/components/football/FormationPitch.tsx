import { Link } from 'react-router-dom';
import { Info, Shirt } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getFormation, LINE_COLORS, LINE_LABELS, type Line } from '../../lib/constants';
import type { PlayerLike, SquadLines } from '../../lib/stats';
import { PlayerAvatar } from './Avatars';
import { Badge } from '../ui/Badge';

export interface FormationPitchProps {
  lines: SquadLines;
  formation?: string;
  className?: string;
  linkPlayers?: boolean;
  onSelectPlayer?: (player: PlayerLike) => void;
  selectedPlayerId?: string;
}

const rowOrder: Line[] = ['FWD', 'MID', 'DEF', 'GK'];

export const FormationPitch = ({
  lines,
  formation,
  className,
  linkPlayers = true,
  onSelectPlayer,
  selectedPlayerId,
}: FormationPitchProps) => {
  const preset = getFormation(formation);
  const [defCount, midCount, fwdCount] = preset.shape;

  const starters: Record<Line, PlayerLike[]> = {
    GK: lines.GK.slice(0, 1),
    DEF: lines.DEF.slice(0, defCount),
    MID: lines.MID.slice(0, midCount),
    FWD: lines.FWD.slice(0, fwdCount),
  };

  const benched: Record<Line, PlayerLike[]> = {
    GK: lines.GK.slice(1),
    DEF: lines.DEF.slice(defCount),
    MID: lines.MID.slice(midCount),
    FWD: lines.FWD.slice(fwdCount),
  };

  const bench = [...benched.GK, ...benched.DEF, ...benched.MID, ...benched.FWD];
  const startersCount = Object.values(starters).reduce((sum, list) => sum + list.length, 0);

  return (
    <div className={cn('space-y-5', className)}>
      <div className="relative overflow-hidden rounded-4xl border border-white/10">
        <div className="pitch noise relative flex min-h-[30rem] flex-col justify-between gap-4 p-4 sm:min-h-[34rem] sm:p-6">
          {/* Pitch markings */}
          <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/12 sm:inset-6" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 sm:h-36 sm:w-36" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />
          <div className="pointer-events-none absolute bottom-4 left-1/2 h-16 w-[55%] -translate-x-1/2 rounded-b-2xl border border-white/12 sm:bottom-6" />
          <div className="pointer-events-none absolute top-4 left-1/2 h-16 w-[55%] -translate-x-1/2 rounded-t-2xl border border-white/12 sm:top-6" />

          <div className="relative z-10 flex items-center justify-between px-1">
            <Badge tone="gold" size="sm" icon={<Shirt className="h-3 w-3" />}>
              التشكيلة {preset.name}
            </Badge>
            <Badge tone="neutral" size="sm">
              {startersCount} لاعب أساسي
            </Badge>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-between gap-3 py-2">
            {rowOrder.map((line) => {
              const players = starters[line];
              if (line === 'GK' && players.length === 0) return null;
              return (
                <div key={line} className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={cn(
                        'h-px w-8 bg-current opacity-30',
                        LINE_COLORS[line].text,
                      )}
                    />
                    <span className={cn('text-[10px] font-bold tracking-wider', LINE_COLORS[line].text)}>
                      {LINE_LABELS[line]}
                    </span>
                    <span className={cn('h-px w-8 bg-current opacity-30', LINE_COLORS[line].text)} />
                  </div>
                  <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3 sm:gap-x-5">
                    {players.length === 0 ? (
                      <span className="rounded-xl border border-dashed border-white/15 px-3 py-2 text-[11px] text-ink-400">
                        لا يوجد لاعبون في هذا الخط
                      </span>
                    ) : (
                      players.map((player) => (
                        <PitchPlayer
                          key={player.id}
                          player={player}
                          line={line}
                          linkPlayers={linkPlayers}
                          onSelect={onSelectPlayer}
                          selected={selectedPlayerId === player.id}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex items-center justify-center gap-2 text-[10px] text-white/45">
            <Info className="h-3 w-3" />
            يتم ترتيب اللاعبين تلقائياً حسب الخط والرقم — يمكن تعديلهم من لوحة الفريق
          </div>
        </div>
      </div>

      {bench.length > 0 && (
        <div className="glass-soft rounded-3xl p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-white">
              <Shirt className="h-4 w-4 text-gold-400" />
              لاعبو الاحتياط والمقاعد
            </h3>
            <span className="text-[11px] font-bold text-ink-300">{bench.length} لاعب</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bench.map((player) => {
              const line = (player.line || 'MID') as Line;
              return (
                <span
                  key={player.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/60 px-3 py-1.5 text-xs text-ink-100"
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border font-heading text-[10px] font-black',
                      LINE_COLORS[line].bg,
                      LINE_COLORS[line].text,
                      'border-white/10',
                    )}
                  >
                    {player.number ?? '—'}
                  </span>
                  {player.name}
                  <span className="text-[10px] text-ink-400">{LINE_LABELS[line]}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const PitchPlayer = ({
  player,
  line,
  linkPlayers,
  onSelect,
  selected,
}: {
  player: PlayerLike;
  line: Line;
  linkPlayers: boolean;
  onSelect?: (player: PlayerLike) => void;
  selected?: boolean;
}) => {
  const content = (
    <div
      className={cn(
        'group flex w-[4.6rem] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-ink-950/55 p-2 backdrop-blur-md transition-all duration-300 sm:w-[5.4rem]',
        'hover:-translate-y-1 hover:border-gold-400/45 hover:bg-ink-950/75',
        selected && 'border-gold-400/70 shadow-[0_0_26px_-8px_rgba(232,193,88,0.75)]',
      )}
    >
      <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="sm" />
      <span className="line-clamp-1 text-center text-[10px] font-bold text-white sm:text-[11px]">
        {player.name.split(' ')[0]} {player.name.split(' ')[1] || ''}
      </span>
      <span className={cn('text-[9px] font-bold', LINE_COLORS[line].text)}>{player.position || LINE_LABELS[line]}</span>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(player)} className="focus:outline-none">
        {content}
      </button>
    );
  }

  if (linkPlayers) {
    return (
      <Link to={`/players/${player.id}`} className="focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

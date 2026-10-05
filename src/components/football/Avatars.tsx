import { useState } from 'react';
import { Shield, User } from 'lucide-react';
import { cn, initials } from '../../lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const TEAM_SIZES: Record<Size, { box: string; icon: string; text: string }> = {
  xs: { box: 'h-7 w-7 rounded-lg', icon: 'h-3.5 w-3.5', text: 'text-[10px]' },
  sm: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5', text: 'text-xs' },
  md: { box: 'h-14 w-14 rounded-2xl', icon: 'h-6 w-6', text: 'text-base' },
  lg: { box: 'h-20 w-20 rounded-3xl', icon: 'h-9 w-9', text: 'text-2xl' },
  xl: { box: 'h-28 w-28 rounded-3xl', icon: 'h-12 w-12', text: 'text-3xl' },
  hero: { box: 'h-32 w-32 rounded-3xl sm:h-40 sm:w-40', icon: 'h-14 w-14', text: 'text-5xl' },
};

export interface TeamBadgeProps {
  name: string;
  logo?: string;
  size?: Size;
  className?: string;
  ring?: boolean;
}

export const TeamBadge = ({ name, logo, size = 'md', className, ring = true }: TeamBadgeProps) => {
  const [broken, setBroken] = useState(false);
  const palette = TEAM_SIZES[size];
  const showImage = logo && !broken;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-white/12 bg-ink-950/70',
        ring && 'ring-1 ring-gold-400/15',
        palette.box,
        className,
      )}
    >
      {showImage ? (
        <img
          src={logo}
          alt={name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
          {size === 'xs' || size === 'sm' ? (
            <span className={cn('font-heading font-black text-gold-300/90', palette.text)}>
              {initials(name).charAt(0)}
            </span>
          ) : (
            <>
              <Shield className={cn('text-gold-400/70', palette.icon)} />
              <span className={cn('font-heading font-black text-gold-200/90', palette.text)}>
                {initials(name).charAt(0)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export interface PlayerAvatarProps {
  name: string;
  photo?: string;
  number?: number;
  size?: Size;
  className?: string;
  showNumber?: boolean;
}

const PLAYER_SIZES: Record<Size, string> = {
  xs: 'h-8 w-8 rounded-lg',
  sm: 'h-11 w-11 rounded-xl',
  md: 'h-16 w-16 rounded-2xl',
  lg: 'h-24 w-24 rounded-3xl',
  xl: 'h-32 w-32 rounded-3xl',
  hero: 'h-32 w-32 rounded-3xl sm:h-40 sm:w-40',
};

export const PlayerAvatar = ({
  name,
  photo,
  number,
  size = 'md',
  className,
  showNumber = true,
}: PlayerAvatarProps) => {
  const [broken, setBroken] = useState(false);
  const showImage = photo && !broken;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-white/12 bg-[linear-gradient(150deg,rgba(232,193,88,0.16),rgba(13,18,30,0.9))]',
        PLAYER_SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={photo}
          alt={name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gold-200/85">
          {size === 'xs' || size === 'sm' ? (
            <span className="text-xs font-black">{initials(name)}</span>
          ) : (
            <>
              <User className="mb-0.5 h-5 w-5 opacity-70" />
              <span className="text-sm font-black">{initials(name)}</span>
            </>
          )}
        </div>
      )}
      {showNumber && typeof number === 'number' && number > 0 && (
        <span className="absolute bottom-0 right-0 rounded-tl-lg bg-[linear-gradient(135deg,#f4e0a1,#d4af37)] px-1.5 py-0.5 font-heading text-[10px] font-black text-ink-950">
          {number}
        </span>
      )}
    </div>
  );
};

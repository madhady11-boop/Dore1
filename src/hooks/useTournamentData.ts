import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { demoData } from '../lib/demoData';
import { firebaseErrorMessage } from '../lib/utils';
import type { MatchLike, PlayerLike, TeamLike } from '../lib/stats';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date?: string;
  issuer?: string;
  image?: string;
  status?: 'published' | 'draft';
  createdAt?: unknown;
}

export interface Referee {
  id: string;
  name: string;
  phone?: string;
  level?: string;
  matchesCount?: number;
  image?: string;
}

export interface DisciplinaryDecision {
  id: string;
  number?: string;
  date?: string;
  targetType?: 'player' | 'coach' | 'team' | 'fans';
  targetId?: string;
  targetName?: string;
  reason?: string;
  penaltyType?: string;
  amount?: number;
  matchId?: string;
  status?: 'published' | 'draft';
  createdAt?: unknown;
}

export interface Objection {
  id: string;
  teamId: string;
  matchId: string;
  type?: string;
  details?: string;
  decision?: string;
  status: 'pending' | 'investigating' | 'accepted' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TournamentData {
  teams: TeamLike[];
  players: PlayerLike[];
  matches: MatchLike[];
  announcements: Announcement[];
  referees: Referee[];
  decisions: DisciplinaryDecision[];
  objections: Objection[];
  loading: boolean;
  error: string | null;
  /** true while the database is still empty and sample data is displayed */
  isDemo: boolean;
  refresh: () => void;
}

type Snapshot = Omit<TournamentData, 'refresh'>;

const EMPTY: Snapshot = {
  teams: [],
  players: [],
  matches: [],
  announcements: [],
  referees: [],
  decisions: [],
  objections: [],
  loading: true,
  error: null,
  isDemo: false,
};

/* -------------------------------------------------------------------------
   Shared, cached store — every component that reads tournament data shares a
   single Firestore fetch (the page + its layout never double-read).
   ------------------------------------------------------------------------- */

let snapshot: Snapshot = EMPTY;
let lastLoadedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const patch = (next: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...next };
  emit();
};

const mapCollection = async <T,>(name: string): Promise<T[]> => {
  try {
    const result = await getDocs(collection(db, name));
    return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  } catch (error) {
    // Optional collections may be unreadable for some accounts — never let a
    // single failure break the whole page.
    console.warn(`تعذّر تحميل المجموعة ${name}:`, firebaseErrorMessage(error));
    return [];
  }
};

const load = async (force = false): Promise<void> => {
  if (inflight && !force) return inflight;
  const stale = Date.now() - lastLoadedAt > 45_000;
  if (!force && !stale && lastLoadedAt > 0) return;

  inflight = (async () => {
    if (lastLoadedAt === 0) patch({ loading: true, error: null });
    try {
      const [teams, players, matches, announcements, referees, decisions, objections] = await Promise.all([
        mapCollection<TeamLike>('teams'),
        mapCollection<PlayerLike>('players'),
        mapCollection<MatchLike>('matches'),
        mapCollection<Announcement>('announcements'),
        mapCollection<Referee>('referees'),
        mapCollection<DisciplinaryDecision>('disciplinaryDecisions'),
        mapCollection<Objection>('objections'),
      ]);

      const isEmpty = teams.length === 0 && players.length === 0 && matches.length === 0;
      lastLoadedAt = Date.now();

      patch(
        isEmpty
          ? {
              ...demoData,
              loading: false,
              error: null,
              isDemo: true,
            }
          : {
              teams,
              players,
              matches,
              announcements,
              referees,
              decisions,
              objections,
              loading: false,
              error: null,
              isDemo: false,
            },
      );
    } catch (error) {
      lastLoadedAt = Date.now();
      patch({ loading: false, error: firebaseErrorMessage(error) });
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

/**
 * Loads every collection the site needs and exposes a refresh callback so the
 * control panels can re-pull after a write.
 */
export const useTournamentData = (): TournamentData => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((value) => value + 1);
    listeners.add(listener);
    void load();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(() => {
    void load(true);
  }, []);

  return { ...snapshot, refresh };
};

/** Convenience: index teams by id for O(1) lookups in cards. */
export const indexTeams = (teams: TeamLike[]): Record<string, TeamLike> =>
  teams.reduce<Record<string, TeamLike>>((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {});

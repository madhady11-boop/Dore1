import { POINTS_DRAW, POINTS_WIN, positionToLine, type Line } from './constants';
import { toDate } from './utils';

/* -------------------------------------------------------------------------
   Lightweight shapes (structural — pages pass Firestore docs straight in)
   ------------------------------------------------------------------------- */

export interface TeamLike {
  id: string;
  name: string;
  logo?: string;
  coach?: string;
  captain?: string;
  establishedYear?: number;
  played?: number;
  won?: number;
  drew?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
  formation?: string;
}

export interface PlayerLike {
  id: string;
  teamId: string;
  name: string;
  number?: number;
  position?: string;
  line?: Line;
  order?: number;
  photo?: string;
  birthYear?: number;
  status?: string;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  matchesPlayed?: number;
  motm?: number;
}

export interface MatchLike {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date?: string;
  time?: string;
  round?: string;
  stadiumId?: string;
  status: 'upcoming' | 'finished' | 'postponed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  refereeId?: string;
}

export type FormResult = 'W' | 'D' | 'L';

export interface StandingRow {
  rank: number;
  teamId: string;
  name: string;
  logo?: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: FormResult[];
  /** null when the table is built purely from stored team aggregates. */
  computed: boolean;
}

/* -------------------------------------------------------------------------
   Standings
   ------------------------------------------------------------------------- */

/** Sort played/finished matches chronologically (oldest first). */
export const sortMatchesAsc = (matches: MatchLike[]): MatchLike[] =>
  [...matches].sort((a, b) => {
    const da = toDate(a.date)?.getTime() ?? 0;
    const db = toDate(b.date)?.getTime() ?? 0;
    if (da !== db) return da - db;
    return (a.time || '').localeCompare(b.time || '');
  });

export const sortMatchesDesc = (matches: MatchLike[]): MatchLike[] => sortMatchesAsc(matches).reverse();

export const isPlayed = (match: MatchLike) =>
  match.status === 'finished' && typeof match.homeScore === 'number' && typeof match.awayScore === 'number';

/** Last N results for a club, newest last. */
export const teamForm = (teamId: string, matches: MatchLike[], limit = 5): FormResult[] => {
  const played = sortMatchesAsc(matches).filter(
    (m) => isPlayed(m) && (m.homeTeamId === teamId || m.awayTeamId === teamId),
  );
  const results = played.map<FormResult>((match) => {
    const isHome = match.homeTeamId === teamId;
    const scored = (isHome ? match.homeScore : match.awayScore) ?? 0;
    const conceded = (isHome ? match.awayScore : match.homeScore) ?? 0;
    if (scored > conceded) return 'W';
    if (scored < conceded) return 'L';
    return 'D';
  });
  return results.slice(-limit);
};

/**
 * Build the league table. When the tournament has finished matches we always
 * compute the table from results (single source of truth), otherwise we fall
 * back to the aggregates stored on each team document.
 */
export const buildStandings = (teams: TeamLike[], matches: MatchLike[]): StandingRow[] => {
  const playedMatches = matches.filter(isPlayed);
  const useComputed = playedMatches.length > 0;

  const rows: StandingRow[] = teams.map((team) => {
    const played = playedMatches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);

    if (useComputed && played.length > 0) {
      let won = 0;
      let drew = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const match of played) {
        const isHome = match.homeTeamId === team.id;
        const scored = (isHome ? match.homeScore : match.awayScore) ?? 0;
        const conceded = (isHome ? match.awayScore : match.homeScore) ?? 0;
        goalsFor += scored;
        goalsAgainst += conceded;
        if (scored > conceded) won += 1;
        else if (scored === conceded) drew += 1;
        else lost += 1;
      }

      return {
        rank: 0,
        teamId: team.id,
        name: team.name,
        logo: team.logo,
        played: played.length,
        won,
        drew,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points: won * POINTS_WIN + drew * POINTS_DRAW,
        form: teamForm(team.id, matches),
        computed: true,
      };
    }

    const goalsFor = team.goalsFor ?? 0;
    const goalsAgainst = team.goalsAgainst ?? 0;
    return {
      rank: 0,
      teamId: team.id,
      name: team.name,
      logo: team.logo,
      played: team.played ?? 0,
      won: team.won ?? 0,
      drew: team.drew ?? 0,
      lost: team.lost ?? 0,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points: team.points ?? (team.won ?? 0) * POINTS_WIN + (team.drew ?? 0) * POINTS_DRAW,
      form: teamForm(team.id, matches),
      computed: false,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.name.localeCompare(b.name, 'ar');
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

/* -------------------------------------------------------------------------
   Recompute team aggregates from finished matches (admin tool)
   ------------------------------------------------------------------------- */

export interface TeamAggregatePatch {
  teamId: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export const computeTeamAggregates = (teams: TeamLike[], matches: MatchLike[]): TeamAggregatePatch[] => {
  const playedMatches = matches.filter(isPlayed);
  return teams.map((team) => {
    const played = playedMatches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let won = 0;
    let drew = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    for (const match of played) {
      const isHome = match.homeTeamId === team.id;
      const scored = (isHome ? match.homeScore : match.awayScore) ?? 0;
      const conceded = (isHome ? match.awayScore : match.homeScore) ?? 0;
      goalsFor += scored;
      goalsAgainst += conceded;
      if (scored > conceded) won += 1;
      else if (scored === conceded) drew += 1;
      else lost += 1;
    }
    return {
      teamId: team.id,
      played: played.length,
      won,
      drew,
      lost,
      goalsFor,
      goalsAgainst,
      points: won * POINTS_WIN + drew * POINTS_DRAW,
    };
  });
};

/* -------------------------------------------------------------------------
   Scorers, assists, discipline
   ------------------------------------------------------------------------- */

export interface ScorerRow {
  player: PlayerLike;
  team?: TeamLike;
  value: number;
}

export const rankPlayersBy = (
  players: PlayerLike[],
  teams: TeamLike[],
  key: 'goals' | 'assists' | 'motm' | 'yellowCards' | 'redCards' | 'matchesPlayed',
  limit = 10,
  filter?: (player: PlayerLike) => boolean,
): ScorerRow[] =>
  players
    .filter((player) => (filter ? filter(player) : true))
    .filter((player) => (player[key] ?? 0) > 0)
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0) || (a.name || '').localeCompare(b.name || '', 'ar'))
    .slice(0, limit)
    .map((player) => ({ player, team: teams.find((t) => t.id === player.teamId), value: player[key] ?? 0 }));

export interface TournamentSummary {
  teams: number;
  players: number;
  matches: number;
  playedMatches: number;
  upcomingMatches: number;
  goals: number;
  yellowCards: number;
  redCards: number;
  avgGoals: string;
}

export const buildSummary = (teams: TeamLike[], players: PlayerLike[], matches: MatchLike[]): TournamentSummary => {
  const played = matches.filter(isPlayed);
  const goals = played.reduce((sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  return {
    teams: teams.length,
    players: players.length,
    matches: matches.length,
    playedMatches: played.length,
    upcomingMatches: matches.filter((m) => m.status === 'upcoming').length,
    goals,
    yellowCards: players.reduce((sum, p) => sum + (p.yellowCards ?? 0), 0),
    redCards: players.reduce((sum, p) => sum + (p.redCards ?? 0), 0),
    avgGoals: played.length ? (goals / played.length).toFixed(2) : '0.00',
  };
};

/* -------------------------------------------------------------------------
   Squad helpers — order a roster into tactical lines for the pitch view
   ------------------------------------------------------------------------- */

export interface SquadLines {
  GK: PlayerLike[];
  DEF: PlayerLike[];
  MID: PlayerLike[];
  FWD: PlayerLike[];
}

const orderOf = (player: PlayerLike) => (typeof player.order === 'number' ? player.order : Number.MAX_SAFE_INTEGER);

export const groupSquadByLine = (players: PlayerLike[]): SquadLines => {
  const lines: SquadLines = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const player of players) {
    const line = (player.line || positionToLine(player.position)) as Line;
    lines[line]?.push(player);
  }
  (Object.keys(lines) as Line[]).forEach((line) => {
    lines[line].sort((a, b) => orderOf(a) - orderOf(b) || (a.number ?? 99) - (b.number ?? 99));
  });
  return lines;
};

export const currentSeasonYear = () => new Date().getFullYear();

export const matchesForTeam = (teamId: string, matches: MatchLike[]): MatchLike[] =>
  matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);

export const nextMatchForTeam = (teamId: string, matches: MatchLike[]): MatchLike | undefined =>
  sortMatchesAsc(matches).find(
    (m) => m.status === 'upcoming' && (m.homeTeamId === teamId || m.awayTeamId === teamId),
  );

export const lastResultsForTeam = (teamId: string, matches: MatchLike[], limit = 5): MatchLike[] =>
  sortMatchesDesc(matches)
    .filter((m) => isPlayed(m) && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .slice(0, limit);

/* -------------------------------------------------------------------------
   Domain constants — positions, lines, formations, roles, statuses
   ------------------------------------------------------------------------- */

export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';

export const LINES: Line[] = ['GK', 'DEF', 'MID', 'FWD'];

export const LINE_LABELS: Record<Line, string> = {
  GK: 'حراسة المرمى',
  DEF: 'خط الدفاع',
  MID: 'خط الوسط',
  FWD: 'خط الهجوم',
};

export const LINE_SHORT: Record<Line, string> = {
  GK: 'حراسة',
  DEF: 'دفاع',
  MID: 'وسط',
  FWD: 'هجوم',
};

export const LINE_COLORS: Record<Line, { text: string; bg: string; ring: string; hex: string }> = {
  GK: { text: 'text-amber-glow', bg: 'bg-amber-glow/12', ring: 'ring-amber-glow/35', hex: '#fbbf24' },
  DEF: { text: 'text-sky-glow', bg: 'bg-sky-glow/12', ring: 'ring-sky-glow/35', hex: '#38bdf8' },
  MID: { text: 'text-emerald-glow', bg: 'bg-emerald-glow/12', ring: 'ring-emerald-glow/35', hex: '#19c37d' },
  FWD: { text: 'text-rose-glow', bg: 'bg-rose-glow/12', ring: 'ring-rose-glow/35', hex: '#fb7185' },
};

/** Every position the club can register, mapped to its tactical line. */
export const POSITIONS: { value: string; line: Line }[] = [
  { value: 'حارس مرمى', line: 'GK' },
  { value: 'قلب دفاع', line: 'DEF' },
  { value: 'ظهير أيمن', line: 'DEF' },
  { value: 'ظهير أيسر', line: 'DEF' },
  { value: 'ليبرو', line: 'DEF' },
  { value: 'مدافع', line: 'DEF' },
  { value: 'وسط مدافع', line: 'MID' },
  { value: 'وسط', line: 'MID' },
  { value: 'صانع ألعاب', line: 'MID' },
  { value: 'جناح أيمن', line: 'MID' },
  { value: 'جناح أيسر', line: 'MID' },
  { value: 'وسط هجومي', line: 'MID' },
  { value: 'مهاجم', line: 'FWD' },
  { value: 'رأس حربة', line: 'FWD' },
];

export const POSITION_NAMES = POSITIONS.map((p) => p.value);

/** Best-effort mapping from a free-text position to a tactical line. */
export const positionToLine = (position?: string): Line => {
  if (!position) return 'MID';
  const found = POSITIONS.find((p) => p.value === position);
  if (found) return found.line;
  if (position.includes('حارس')) return 'GK';
  if (position.includes('دفاع') || position.includes('ظهير') || position.includes('ليبرو') || position.includes('مدافع'))
    return 'DEF';
  if (position.includes('هجوم') || position.includes('مهاجم') || position.includes('رأس')) return 'FWD';
  return 'MID';
};

export const isValidLine = (value: unknown): value is Line =>
  typeof value === 'string' && (LINES as string[]).includes(value);

/* ---- Formations ---------------------------------------------------------- */

export interface FormationPreset {
  name: string;
  /** How many players are placed in each outfield line (DEF, MID, FWD). */
  shape: [number, number, number];
}

export const FORMATIONS: FormationPreset[] = [
  { name: '4-3-3', shape: [4, 3, 3] },
  { name: '4-4-2', shape: [4, 4, 2] },
  { name: '4-2-3-1', shape: [4, 5, 1] },
  { name: '3-5-2', shape: [3, 5, 2] },
  { name: '5-3-2', shape: [5, 3, 2] },
  { name: '4-1-4-1', shape: [4, 5, 1] },
];

export const DEFAULT_FORMATION = '4-3-3';

export const getFormation = (name?: string): FormationPreset =>
  FORMATIONS.find((f) => f.name === name) || FORMATIONS[0];

/* ---- Roles & statuses ---------------------------------------------------- */

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير عام',
  tournament_manager: 'مدير البطولة',
  disciplinary_committee: 'لجنة الانضباط',
  media_manager: 'مدير الإعلام',
  stats_manager: 'مدير الإحصاء',
  team: 'حساب فريق',
};

export const ADMIN_ROLES = [
  'super_admin',
  'tournament_manager',
  'disciplinary_committee',
  'media_manager',
  'stats_manager',
] as const;

export const PLAYER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'فعال', className: 'text-emerald-glow bg-emerald-glow/12 border-emerald-glow/25' },
  suspended: { label: 'موقوف', className: 'text-amber-glow bg-amber-glow/12 border-amber-glow/25' },
  excluded: { label: 'مستبعد', className: 'text-rose-glow bg-rose-glow/12 border-rose-glow/25' },
  unregistered: { label: 'غير مسجل', className: 'text-ink-300 bg-white/5 border-white/10' },
};

export const MATCH_STATUS: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  upcoming: { label: 'قادمة', className: 'text-sky-glow bg-sky-glow/12 border-sky-glow/25', dot: 'bg-sky-glow' },
  finished: {
    label: 'منتهية',
    className: 'text-emerald-glow bg-emerald-glow/12 border-emerald-glow/25',
    dot: 'bg-emerald-glow',
  },
  postponed: {
    label: 'مؤجلة',
    className: 'text-amber-glow bg-amber-glow/12 border-amber-glow/25',
    dot: 'bg-amber-glow',
  },
  cancelled: {
    label: 'ملغاة',
    className: 'text-rose-glow bg-rose-glow/12 border-rose-glow/25',
    dot: 'bg-rose-glow',
  },
};

export const OBJECTION_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'قيد المراجعة', className: 'text-sky-glow bg-sky-glow/12 border-sky-glow/25' },
  investigating: { label: 'قيد التحقيق', className: 'text-amber-glow bg-amber-glow/12 border-amber-glow/25' },
  accepted: { label: 'مقبول', className: 'text-emerald-glow bg-emerald-glow/12 border-emerald-glow/25' },
  rejected: { label: 'مرفوض', className: 'text-rose-glow bg-rose-glow/12 border-rose-glow/25' },
};

/* ---- Points & ranking ---------------------------------------------------- */

export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;

export const POINTS_FORFEIT = 3;

export const ZONE_STYLES = {
  champion: 'text-gold-300',
  podium: 'text-emerald-glow',
  relegation: 'text-rose-glow',
} as const;

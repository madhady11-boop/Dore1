import type { DisciplinaryDecision, Objection, Referee, Announcement } from '../hooks/useTournamentData';
import type { MatchLike, PlayerLike, TeamLike } from './stats';
import { POSITIONS } from './constants';

/**
 * Deterministic sample dataset.
 * Used only while the Firestore database has no teams yet, so the design and
 * the formation builder can be previewed. It disappears automatically as soon
 * as real data is added from the control panel.
 */

const TEAM_SEEDS: { name: string; coach: string; captain: string; year: number; formation: string }[] = [
  { name: 'تحدي المنصورية', coach: 'حسين الجابري', captain: 'علي الموسوي', year: 2014, formation: '4-3-3' },
  { name: 'شباب الشامية', coach: 'أحمد الفتلاوي', captain: 'كرار الشمري', year: 2011, formation: '4-4-2' },
  { name: 'نسور الفرات', coach: 'سعد الحسناوي', captain: 'مصطفى الربيعي', year: 2016, formation: '4-2-3-1' },
  { name: 'أبطال المدينة', coach: 'عمار الزبيدي', captain: 'حيدر الأسدي', year: 2009, formation: '3-5-2' },
  { name: 'صقور الحيدرية', coach: 'ناصر العبيدي', captain: 'جاسم الخالدي', year: 2015, formation: '4-3-3' },
  { name: 'فرسان العروبة', coach: 'سلام المياحي', captain: 'مهدي الحلفي', year: 2013, formation: '4-4-2' },
  { name: 'أسود الطليعة', coach: 'رعد الساعدي', captain: 'باقر الياسري', year: 2012, formation: '5-3-2' },
  { name: 'نجوم الغدير', coach: 'وليد اللامي', captain: 'حمزة الدليمي', year: 2017, formation: '4-1-4-1' },
  { name: 'اتحاد المشخاب', coach: 'عباس الكعبي', captain: 'زيد الحميداوي', year: 2010, formation: '4-4-2' },
  { name: 'هلال العباسية', coach: 'كريم الجنابي', captain: 'أنور الطائي', year: 2018, formation: '4-3-3' },
  { name: 'رعد الشنافية', coach: 'مازن البديري', captain: 'عمار الحجيمي', year: 2015, formation: '3-5-2' },
  { name: 'وحدة الحمزة', coach: 'فاضل الشمري', captain: 'سجاد العقابي', year: 2019, formation: '4-2-3-1' },
];

const FIRST_NAMES = [
  'محمد', 'علي', 'حسين', 'أحمد', 'مصطفى', 'كرار', 'حيدر', 'جاسم', 'مهدي', 'باقر',
  'زيد', 'سجاد', 'عمار', 'أنور', 'مرتضى', 'يوسف', 'إبراهيم', 'عبد الله', 'حسن', 'رضا',
];
const LAST_NAMES = [
  'الموسوي', 'الشمري', 'الجابري', 'الفتلاوي', 'الحسناوي', 'الزبيدي', 'العبيدي', 'الخالدي',
  'الساعدي', 'الياسري', 'الدليمي', 'الحميداوي', 'الطائي', 'البديري', 'العقابي', 'الربيعي',
  'الكعبي', 'اللامي', 'الجنابي', 'الحلفي',
];

/** Deterministic pseudo-random generator (stable across renders). */
const makeRandom = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const buildPlayers = (): PlayerLike[] => {
  const players: PlayerLike[] = [];
  TEAM_SEEDS.forEach((team, teamIndex) => {
    const teamId = `demo-team-${teamIndex + 1}`;
    const random = makeRandom(teamIndex * 977 + 13);
    const linePlan: { line: 'GK' | 'DEF' | 'MID' | 'FWD'; count: number }[] = [
      { line: 'GK', count: 2 },
      { line: 'DEF', count: 6 },
      { line: 'MID', count: 6 },
      { line: 'FWD', count: 4 },
    ];
    let number = 1;
    linePlan.forEach(({ line, count }) => {
      for (let i = 0; i < count; i += 1) {
        const positionOptions = POSITIONS.filter((position) => position.line === line);
        const position = positionOptions[Math.floor(random() * positionOptions.length)] || positionOptions[0];
        const goals = line === 'GK' ? 0 : Math.floor(random() * (line === 'FWD' ? 9 : line === 'MID' ? 5 : 2));
        const status = random() > 0.94 ? 'suspended' : 'active';
        players.push({
          id: `${teamId}-player-${number}`,
          teamId,
          name: `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${
            LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
          }`,
          number,
          position: position.value,
          line,
          order: i,
          birthYear: 1994 + Math.floor(random() * 12),
          status,
          goals,
          assists: line === 'GK' ? 0 : Math.floor(random() * 4),
          matchesPlayed: 8 + Math.floor(random() * 6),
          motm: line === 'FWD' ? Math.floor(random() * 4) : Math.floor(random() * 2),
          yellowCards: Math.floor(random() * 4),
          redCards: random() > 0.9 ? 1 : 0,
        });
        number += 1;
      }
    });
  });
  return players;
};

const buildMatches = (): MatchLike[] => {
  const matches: MatchLike[] = [];
  const rounds = [
    { label: 'الجولة الأولى', results: true },
    { label: 'الجولة الثانية', results: true },
    { label: 'الجولة الثالثة', results: true },
    { label: 'الجولة الرابعة', results: false },
  ];
  const baseDate = new Date();
  let index = 0;

  rounds.forEach((round, roundIndex) => {
    for (let pair = 0; pair < 6; pair += 1) {
      const homeIndex = (pair + roundIndex) % TEAM_SEEDS.length;
      let awayIndex = (pair + 6 + roundIndex) % TEAM_SEEDS.length;
      if (awayIndex === homeIndex) awayIndex = (awayIndex + 1) % TEAM_SEEDS.length;
      const date = new Date(baseDate);
      date.setDate(date.getDate() + (round.results ? -21 + roundIndex * 7 : 3 + roundIndex * 7));
      matches.push({
        id: `demo-match-${index + 1}`,
        homeTeamId: `demo-team-${homeIndex + 1}`,
        awayTeamId: `demo-team-${awayIndex + 1}`,
        date: date.toISOString().slice(0, 10),
        time: pair % 2 === 0 ? '18:00' : '20:30',
        round: round.label,
        stadiumId: pair % 3 === 0 ? 'ملعب صوب الشامية' : 'الملعب الفرعي',
        status: round.results ? 'finished' : 'upcoming',
        homeScore: round.results ? (pair * 2 + roundIndex) % 4 : undefined,
        awayScore: round.results ? (pair + roundIndex * 3) % 3 : undefined,
      });
      index += 1;
    }
  });

  return matches;
};

const buildTeams = (): TeamLike[] => TEAM_SEEDS.map((team, index) => ({ id: `demo-team-${index + 1}`, ...team }));

const buildAnnouncements = (): Announcement[] => [
  {
    id: 'demo-ann-1',
    title: 'اعتماد جدول الجولة القادمة وتحديد الملاعب',
    issuer: 'اللجنة المنظمة',
    date: new Date().toISOString().slice(0, 10),
    content:
      'تعتمد اللجنة المنظمة جدول مباريات الجولة القادمة من دوري صوب الشامية، على أن تُقام المباريات على ملعب صوب الشامية الرئيسي والملعب الفرعي.\n\nعلى جميع الفرق الحضور قبل موعد الانطلاق بساعة كاملة، مع الالتزام بالزي الرسمي وكشف اللاعبين المصدّق.',
  },
  {
    id: 'demo-ann-2',
    title: 'تذكير بضوابط تسجيل اللاعبين للمرحلة الثانية',
    issuer: 'لجنة المسابقات',
    date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
    content:
      'آخر موعد لتسجيل وقيد اللاعبين الجدد هو نهاية الجولة القادمة، ولا تُقبل أي كشوفات بعد هذا التاريخ إلا بموافقة اللجنة المنظمة.',
    status: 'published',
  },
  {
    id: 'demo-ann-3',
    title: 'مسودة: اجتماع الأندية الدوري',
    issuer: 'مؤسسة الحكيم للشباب والرياضة',
    date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10),
    content: 'سيتم تحديد موعد الاجتماع الدوري لممثلي الفرق لمناقشة المرحلة المقبلة من البطولة.',
    status: 'draft',
  },
];

const buildReferees = (): Referee[] => [
  { id: 'demo-ref-1', name: 'أمير الصافي', level: 'درجة أولى', phone: '07700000001', matchesCount: 14 },
  { id: 'demo-ref-2', name: 'زيد الحسني', level: 'دولي', phone: '07700000002', matchesCount: 21 },
  { id: 'demo-ref-3', name: 'موسى العامري', level: 'درجة ثانية', phone: '07700000003', matchesCount: 9 },
  { id: 'demo-ref-4', name: 'طه المالكي', level: 'حكم معتمد', phone: '07700000004', matchesCount: 11 },
];

const buildDecisions = (): DisciplinaryDecision[] => [
  {
    id: 'demo-dec-1',
    number: '001',
    date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
    targetType: 'team',
    targetId: 'demo-team-3',
    targetName: 'نسور الفرات',
    reason: 'تأخير تسديد أجور التحكيم الخاص بمباراتي الجولة الثانية والثالثة على الرغم من التنبيه المسبق.',
    penaltyType: 'غرامة مالية',
    amount: 75000,
    status: 'published',
  },
  {
    id: 'demo-dec-2',
    number: '002',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    targetType: 'player',
    targetId: 'demo-team-1-player-14',
    targetName: 'مهاجم تحدي المنصورية',
    reason: 'الاعتداء على لاعب الخصم خارج الكرة خلال مباراة الجولة الثالثة، ويوقف لاعباً واحداً لمدة مباراتين.',
    penaltyType: 'إيقاف مباراتين',
    amount: 50000,
    status: 'published',
  },
  {
    id: 'demo-dec-3',
    number: '003',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    targetType: 'fans',
    targetName: 'جماهير فريق أبطال المدينة',
    reason: 'مسودة قرار بشأن الألعاب النارية في المدرجات — قيد التحقيق.',
    penaltyType: 'تنبيه رسمي',
    amount: 0,
    status: 'draft',
  },
];

const buildObjections = (): Objection[] => [
  {
    id: 'demo-obj-1',
    teamId: 'demo-team-2',
    matchId: 'demo-match-3',
    type: 'خطأ تحكيمي مؤثر',
    details: 'احتُسب هدف في الدقيقة 88 من موقف تسلل واضح أثّر على نتيجة المباراة النهائية.',
    status: 'pending',
  },
  {
    id: 'demo-obj-2',
    teamId: 'demo-team-5',
    matchId: 'demo-match-8',
    type: 'مشاركة لاعب غير مؤهل',
    details: 'شارك لاعب موقوف في مباراة الجولة الثانية دون إكمال عقوبة الإيقاف.',
    status: 'accepted',
    decision: 'قبول الاعتراض واحتساب نتيجة المباراة لصالح النادي 3-0 مع خصم نقطتين من الفريق المخالف.',
  },
];

export interface DemoDataset {
  teams: TeamLike[];
  players: PlayerLike[];
  matches: MatchLike[];
  announcements: Announcement[];
  referees: Referee[];
  decisions: DisciplinaryDecision[];
  objections: Objection[];
}

export const demoData: DemoDataset = {
  teams: buildTeams(),
  players: buildPlayers(),
  matches: buildMatches(),
  announcements: buildAnnouncements(),
  referees: buildReferees(),
  decisions: buildDecisions(),
  objections: buildObjections(),
};

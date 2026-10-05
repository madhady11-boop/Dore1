import { useMemo, useState } from 'react';
import { CalendarDays, Filter, Search, Trophy } from 'lucide-react';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { sortMatchesAsc } from '../../lib/stats';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { MatchCard } from '../../components/football/MatchCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput, Select } from '../../components/ui/Form';

type FilterValue = 'all' | 'upcoming' | 'finished' | 'postponed';

export const Matches = () => {
  const { teams, matches, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [round, setRound] = useState('all');
  const [search, setSearch] = useState('');

  const rounds = useMemo(
    () => Array.from(new Set(matches.map((m) => m.round).filter(Boolean) as string[])),
    [matches],
  );

  const filtered = useMemo(() => {
    const term = search.trim();
    return sortMatchesAsc(matches).filter((match) => {
      if (filter !== 'all' && match.status !== filter) return false;
      if (round !== 'all' && match.round !== round) return false;
      if (term) {
        const home = teamsById[match.homeTeamId]?.name || '';
        const away = teamsById[match.awayTeamId]?.name || '';
        const haystack = `${home} ${away} ${match.round || ''} ${match.stadiumId || ''}`;
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [matches, filter, round, search, teamsById]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((match) => {
      const key = match.round || 'مباريات أخرى';
      map.set(key, [...(map.get(key) || []), match]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const counts = useMemo(
    () => ({
      all: matches.length,
      upcoming: matches.filter((m) => m.status === 'upcoming').length,
      finished: matches.filter((m) => m.status === 'finished').length,
      postponed: matches.filter((m) => m.status === 'postponed').length,
    }),
    [matches],
  );

  return (
    <div className="space-y-8 pb-6">
      {/* Hero */}
      <section className="glass-strong noise relative overflow-hidden rounded-4xl p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_-20%,rgba(232,193,88,0.24),transparent_55%)]" />
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300/85">
            <span className="h-px w-6 bg-gold-300/50" />
            جدول المسابقة
          </span>
          <h1 className="font-heading text-3xl font-black text-white sm:text-5xl">
            المباريات <span className="text-gradient-gold">والنتائج</span>
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-200 sm:text-base">
            كل مباريات دوري صوب الشامية في مكان واحد — النتائج المعتمدة، المواعيد القادمة، الملاعب، والجولات، مع إمكانية
            التصفية حسب الحالة أو الجولة.
          </p>
        </div>
      </section>

      {/* Filters */}
      <GlassCard variant="soft" padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs<FilterValue>
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: 'الكل', count: counts.all },
              { value: 'upcoming', label: 'قادمة', count: counts.upcoming },
              { value: 'finished', label: 'منتهية', count: counts.finished },
              { value: 'postponed', label: 'مؤجلة', count: counts.postponed },
            ]}
          />
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <SearchInput
              placeholder="ابحث عن فريق أو ملعب..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-64"
            />
            <Select value={round} onChange={(event) => setRound(event.target.value)} className="w-full py-2.5 sm:w-48">
              <option value="all">كل الجولات</option>
              {rounds.map((roundName) => (
                <option key={roundName} value={roundName}>
                  {roundName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-400">
          <Filter className="h-3.5 w-3.5" />
          النتائج: {filtered.length} مباراة
          {round !== 'all' && ` · ${round}`}
        </div>
      </GlassCard>

      {/* List */}
      {loading ? (
        <LoadingBlock rows={6} label="جاري تحميل المباريات..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد مباريات مطابقة"
          description="جرّب تغيير التصفية أو البحث بكلمة أخرى."
          icon={<CalendarDays className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-10">
          {grouped.map(([roundName, list]) => (
            <section key={roundName} className="space-y-5">
              <SectionTitle
                title={roundName}
                icon={<Trophy className="h-5 w-5" />}
                subtitle={`${list.length} مباراة`}
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    homeTeam={teamsById[match.homeTeamId]}
                    awayTeam={teamsById[match.awayTeamId]}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="glass-soft flex flex-wrap items-center justify-center gap-3 rounded-3xl px-5 py-4 text-xs text-ink-300">
        <Search className="h-4 w-4 text-gold-300" />
        يمكن للفرق تقديم اعتراضاتها على أي مباراة من لوحة الفريق خلال المدة النظامية.
      </div>
    </div>
  );
};

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, ShieldCheck, Trophy, User, Users } from 'lucide-react';
import { useTournamentData } from '../../hooks/useTournamentData';
import { buildStandings } from '../../lib/stats';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { TeamBadge } from '../../components/football/Avatars';
import { Badge, RankChip } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Form';
import { FormPills } from '../../components/football/FormPills';

export const Teams = () => {
  const { teams, players, matches, loading } = useTournamentData();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'rank' | 'name' | 'attack' | 'defense'>('rank');

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);

  const rows = useMemo(() => {
    const term = search.trim();
    let list = standings.filter((row) =>
      term ? row.name.includes(term) || (teams.find((t) => t.id === row.teamId)?.coach || '').includes(term) : true,
    );
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (sort === 'attack') list = [...list].sort((a, b) => b.goalsFor - a.goalsFor);
    if (sort === 'defense') list = [...list].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
    return list;
  }, [standings, search, sort, teams]);

  const squadCount = (teamId: string) => players.filter((player) => player.teamId === teamId).length;

  return (
    <div className="space-y-8 pb-6">
      <section className="glass-strong noise relative overflow-hidden rounded-4xl p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(232,193,88,0.24),transparent_55%),radial-gradient(circle_at_5%_120%,rgba(56,189,248,0.16),transparent_55%)]" />
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-300/85">
            <span className="h-px w-6 bg-gold-300/50" />
            كشوفات الفرق
          </span>
          <h1 className="font-heading text-3xl font-black text-white sm:text-5xl">
            الفرق <span className="text-gradient-gold">المشاركة</span>
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-200 sm:text-base">
            تعرّف على الفرق المتنافسة، مدربيها، أطقمها الفنية، وتشكيلاتها الكاملة — مع إحصائيات فورية مستخرجة من نتائج
            المباريات.
          </p>
        </div>
      </section>

      <GlassCard variant="soft" padding="md" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          placeholder="ابحث باسم الفريق أو المدرب..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:w-80"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="py-2.5 md:w-52">
            <option value="rank">الترتيب في الدوري</option>
            <option value="name">الاسم أبجدياً</option>
            <option value="attack">الأقوى هجوماً</option>
            <option value="defense">الأقوى دفاعاً</option>
          </Select>
          <Badge tone="gold" size="sm">
            {rows.length} فريق
          </Badge>
        </div>
      </GlassCard>

      {loading ? (
        <LoadingBlock rows={6} label="جاري تحميل الفرق..." />
      ) : rows.length === 0 ? (
        <EmptyState
          title="لا توجد فرق مطابقة"
          description="لم يتم العثور على فريق بهذا الاسم. جرّب كلمة بحث أخرى."
          icon={<Shield className="h-6 w-6" />}
        />
      ) : (
        <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const team = teams.find((t) => t.id === row.teamId);
            return (
              <GlassCard key={row.teamId} hover padding="md" glow={row.rank === 1 ? 'gold' : 'none'} className="group space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <TeamBadge name={row.name} logo={row.logo} size="lg" />
                    <div className="space-y-1.5">
                      <h3 className="font-heading text-lg font-bold text-white">{row.name}</h3>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-ink-300">
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                          <User className="h-3 w-3" />
                          {team?.coach || 'بدون مدرب'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                          <Trophy className="h-3 w-3" />
                          {team?.establishedYear || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <RankChip rank={row.rank} />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-base font-black text-white">{row.played}</p>
                    <p className="text-[10px] text-ink-400">لعب</p>
                  </div>
                  <div className="rounded-xl border border-emerald-glow/15 bg-emerald-glow/8 py-2">
                    <p className="font-heading text-base font-black text-emerald-glow">{row.won}</p>
                    <p className="text-[10px] text-ink-400">فاز</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-base font-black text-white">{row.drew}</p>
                    <p className="text-[10px] text-ink-400">تعادل</p>
                  </div>
                  <div className="rounded-xl border border-rose-glow/15 bg-rose-glow/8 py-2">
                    <p className="font-heading text-base font-black text-rose-glow">{row.lost}</p>
                    <p className="text-[10px] text-ink-400">خسر</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-ink-300">
                    <Users className="h-3.5 w-3.5" />
                    {squadCount(row.teamId)} لاعب
                    <FormPills form={row.form} size="sm" className="ms-2" />
                  </div>
                  <Link
                    to={`/teams/${row.teamId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300/25 bg-gold-400/12 px-3 py-2 text-xs font-bold text-gold-100 transition-colors hover:bg-gold-400/22"
                  >
                    الملف الكامل
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <div className="glass-soft flex flex-wrap items-center justify-center gap-3 rounded-3xl px-5 py-4 text-xs text-ink-300">
        <ShieldCheck className="h-4 w-4 text-gold-300" />
        تستطيع إدارة كل فريق تحديث شعار الفريق وصور اللاعبين وترتيب التشكيلة من لوحة الفريق.
      </div>
    </div>
  );
};

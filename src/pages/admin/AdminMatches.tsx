import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { CalendarDays, Calculator, Edit3, Filter, Plus, Trash2, Trophy } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { computeTeamAggregates, sortMatchesDesc, type MatchLike } from '../../lib/stats';
import { MATCH_STATUS } from '../../lib/constants';
import { firebaseErrorMessage, formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, NumberStepper, SearchInput, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { MatchCard } from '../../components/football/MatchCard';
import { TeamBadge } from '../../components/football/Avatars';

interface MatchFormState {
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  round: string;
  stadiumId: string;
  refereeId: string;
}

const emptyForm = (): MatchFormState => ({
  homeTeamId: '',
  awayTeamId: '',
  date: new Date().toISOString().slice(0, 10),
  time: '20:30',
  round: '',
  stadiumId: 'ملعب صوب الشامية',
  refereeId: '',
});

export const AdminMatches = () => {
  const { teams, matches, referees, loading, refresh } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | MatchLike['status']>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<MatchFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [resultTarget, setResultTarget] = useState<MatchLike | null>(null);
  const [resultForm, setResultForm] = useState({ homeScore: 0, awayScore: 0, status: 'finished' as MatchLike['status'] });
  const [savingResult, setSavingResult] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MatchLike | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim();
    return sortMatchesDesc(matches).filter((match) => {
      if (statusFilter !== 'all' && match.status !== statusFilter) return false;
      if (!term) return true;
      const home = teamsById[match.homeTeamId]?.name || '';
      const away = teamsById[match.awayTeamId]?.name || '';
      return `${home} ${away} ${match.round || ''}`.includes(term);
    });
  }, [matches, statusFilter, search, teamsById]);

  const handleCreate = async () => {
    if (!form.homeTeamId || !form.awayTeamId) {
      toast.error('اختر الفريقين المتواجهين.');
      return;
    }
    if (form.homeTeamId === form.awayTeamId) {
      toast.error('لا يمكن اختيار نفس الفريق في المباراة.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'matches'), {
        homeTeamId: form.homeTeamId,
        awayTeamId: form.awayTeamId,
        date: form.date,
        time: form.time,
        round: form.round.trim() || 'جولة غير محددة',
        stadiumId: form.stadiumId.trim() || 'ملعب صوب الشامية',
        refereeId: form.refereeId,
        status: 'upcoming',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('تمت جدولة المباراة.');
      setCreateOpen(false);
      setForm(emptyForm());
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openResult = (match: MatchLike) => {
    setResultTarget(match);
    setResultForm({
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      status: match.status === 'upcoming' ? 'finished' : match.status,
    });
  };

  const handleSaveResult = async () => {
    if (!resultTarget) return;
    setSavingResult(true);
    try {
      await updateDoc(doc(db, 'matches', resultTarget.id), {
        homeScore: Number(resultForm.homeScore) || 0,
        awayScore: Number(resultForm.awayScore) || 0,
        status: resultForm.status,
        updatedAt: serverTimestamp(),
      });
      toast.success('تم حفظ النتيجة وتحديث المباراة.');
      setResultTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSavingResult(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'matches', deleteTarget.id));
      toast.success('تم حذف المباراة.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleRecompute = async () => {
    const patches = computeTeamAggregates(teams, matches);
    if (patches.length === 0) {
      toast.error('لا توجد فرق لاحتساب ترتيبها.');
      return;
    }
    setRecomputing(true);
    try {
      const batch = writeBatch(db);
      patches.forEach((patch) => {
        batch.update(doc(db, 'teams', patch.teamId), {
          played: patch.played,
          won: patch.won,
          drew: patch.drew,
          lost: patch.lost,
          goalsFor: patch.goalsFor,
          goalsAgainst: patch.goalsAgainst,
          points: patch.points,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      toast.success('تم إعادة احتساب جدول الترتيب من نتائج المباريات.');
      refresh();
    } catch (error) {
      toast.error(
        `${firebaseErrorMessage(error)} — قد تحتاج صلاحية «مدير البطولة» لتحديث إحصائيات الفرق.`,
      );
    } finally {
      setRecomputing(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: matches.length,
      upcoming: matches.filter((m) => m.status === 'upcoming').length,
      finished: matches.filter((m) => m.status === 'finished').length,
      postponed: matches.filter((m) => m.status === 'postponed').length,
      cancelled: matches.filter((m) => m.status === 'cancelled').length,
    }),
    [matches],
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">المباريات والنتائج</h1>
          <p className="text-sm text-ink-300">
            جدولة الجولات، إدخال النتائج، وإعادة احتساب جدول الترتيب مباشرة من النتائج المعتمدة.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="glass"
            icon={<Calculator className="h-4 w-4" />}
            loading={recomputing}
            onClick={() => void handleRecompute()}
          >
            إعادة احتساب الترتيب
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            مباراة جديدة
          </Button>
        </div>
      </div>

      <GlassCard variant="soft" padding="md" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs<'all' | MatchLike['status']>
            value={statusFilter}
            onChange={setStatusFilter}
            items={[
              { value: 'all', label: 'الكل', count: counts.all },
              { value: 'upcoming', label: 'قادمة', count: counts.upcoming },
              { value: 'finished', label: 'منتهية', count: counts.finished },
              { value: 'postponed', label: 'مؤجلة', count: counts.postponed },
              { value: 'cancelled', label: 'ملغاة', count: counts.cancelled },
            ]}
          />
          <SearchInput
            placeholder="ابحث عن فريق أو جولة..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full lg:w-72"
          />
        </div>
        <p className="flex items-center gap-2 text-[11px] text-ink-400">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} مباراة معروضة
        </p>
      </GlassCard>

      {loading ? (
        <LoadingBlock rows={6} label="جاري تحميل المباريات..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد مباريات"
          description="ابدأ بجدولة مباراة جديدة بين فريقين من الفرق المسجلة."
          icon={<CalendarDays className="h-6 w-6" />}
          action={
            <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              جدولة مباراة
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((match) => {
            const meta = MATCH_STATUS[match.status] || MATCH_STATUS.upcoming;
            return (
              <MatchCard
                key={match.id}
                match={match}
                homeTeam={teamsById[match.homeTeamId]}
                awayTeam={teamsById[match.awayTeamId]}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Edit3 className="h-3.5 w-3.5" />}
                      onClick={() => openResult(match)}
                    >
                      {match.status === 'finished' ? 'تعديل النتيجة' : 'إدخال النتيجة'}
                    </Button>
                    <Badge tone="neutral" size="sm" className={meta.className}>
                      {meta.label}
                    </Badge>
                    <Button
                      size="icon-sm"
                      variant="danger"
                      className="ms-auto"
                      onClick={() => setDeleteTarget(match)}
                      aria-label="حذف المباراة"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Create match modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="جدولة مباراة جديدة"
        subtitle="ستظهر المباراة في صفحة المباريات وفي الصفحة الرئيسية مباشرة."
        icon={<Plus className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleCreate()}>
              جدولة المباراة
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid items-center gap-4 rounded-3xl border border-white/8 bg-white/4 p-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <TeamBadge name={teamsById[form.homeTeamId]?.name || 'المضيف'} logo={teamsById[form.homeTeamId]?.logo} size="md" />
              <span className="text-xs font-bold text-white">
                {teamsById[form.homeTeamId]?.name || 'الفريق المضيف'}
              </span>
            </div>
            <span className="text-center font-heading text-lg font-black text-gold-300">VS</span>
            <div className="flex flex-col items-center gap-2">
              <TeamBadge name={teamsById[form.awayTeamId]?.name || 'الضيف'} logo={teamsById[form.awayTeamId]?.logo} size="md" />
              <span className="text-xs font-bold text-white">
                {teamsById[form.awayTeamId]?.name || 'الفريق الضيف'}
              </span>
            </div>
          </div>

          <FormGrid>
            <Field label="الفريق المضيف" required>
              <Select
                value={form.homeTeamId}
                onChange={(event) => setForm({ ...form, homeTeamId: event.target.value })}
              >
                <option value="">اختر الفريق...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الفريق الضيف" required>
              <Select
                value={form.awayTeamId}
                onChange={(event) => setForm({ ...form, awayTeamId: event.target.value })}
              >
                <option value="">اختر الفريق...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="التاريخ">
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </Field>
            <Field label="الوقت">
              <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
            </Field>
            <Field label="الجولة" hint="مثال: الجولة السابعة، ربع النهائي...">
              <Input value={form.round} onChange={(event) => setForm({ ...form, round: event.target.value })} />
            </Field>
            <Field label="الملعب">
              <Input value={form.stadiumId} onChange={(event) => setForm({ ...form, stadiumId: event.target.value })} />
            </Field>
            <Field label="الحكم (اختياري)">
              <Select value={form.refereeId} onChange={(event) => setForm({ ...form, refereeId: event.target.value })}>
                <option value="">بدون تعيين</option>
                {referees.map((referee) => (
                  <option key={referee.id} value={referee.id}>
                    {referee.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </div>
      </Modal>

      {/* Result modal */}
      <Modal
        open={!!resultTarget}
        onClose={() => setResultTarget(null)}
        title="إدخال / تعديل النتيجة"
        subtitle={resultTarget ? `${formatDate(resultTarget.date)} · ${resultTarget.round || ''}` : ''}
        icon={<Trophy className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResultTarget(null)} disabled={savingResult}>
              إلغاء
            </Button>
            <Button loading={savingResult} onClick={() => void handleSaveResult()}>
              حفظ النتيجة
            </Button>
          </div>
        }
      >
        {resultTarget && (
          <div className="space-y-7">
            <div className="grid items-center gap-4 rounded-3xl border border-white/8 bg-white/4 p-5 sm:grid-cols-[1fr_auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <TeamBadge
                  name={teamsById[resultTarget.homeTeamId]?.name || 'المضيف'}
                  logo={teamsById[resultTarget.homeTeamId]?.logo}
                  size="md"
                />
                <span className="text-center text-xs font-bold text-white">
                  {teamsById[resultTarget.homeTeamId]?.name}
                </span>
                <NumberStepper
                  value={resultForm.homeScore}
                  onChange={(homeScore) => setResultForm({ ...resultForm, homeScore })}
                  label="أهداف المضيف"
                />
              </div>
              <span className="text-center font-heading text-xl font-black text-ink-400">—</span>
              <div className="flex flex-col items-center gap-3">
                <TeamBadge
                  name={teamsById[resultTarget.awayTeamId]?.name || 'الضيف'}
                  logo={teamsById[resultTarget.awayTeamId]?.logo}
                  size="md"
                />
                <span className="text-center text-xs font-bold text-white">
                  {teamsById[resultTarget.awayTeamId]?.name}
                </span>
                <NumberStepper
                  value={resultForm.awayScore}
                  onChange={(awayScore) => setResultForm({ ...resultForm, awayScore })}
                  label="أهداف الضيف"
                />
              </div>
            </div>

            <Field label="حالة المباراة">
              <Select
                value={resultForm.status}
                onChange={(event) => setResultForm({ ...resultForm, status: event.target.value as MatchLike['status'] })}
              >
                <option value="finished">منتهية (تُحتسب في الترتيب)</option>
                <option value="upcoming">قادمة</option>
                <option value="postponed">مؤجلة</option>
                <option value="cancelled">ملغاة</option>
              </Select>
            </Field>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-[11px] leading-relaxed text-ink-300">
              النتائج المعتمدة تُستخدم تلقائياً في الصفحة العامة لجدول الترتيب. يمكنك أيضاً الضغط على «إعادة احتساب
              الترتيب» لتحديث إحصائيات الفرق المخزنة.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف المباراة"
        message="سيتم حذف المباراة نهائياً من جدول البطولة."
        confirmLabel="حذف المباراة"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

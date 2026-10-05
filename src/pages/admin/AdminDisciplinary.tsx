import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle2, FileText, Gavel, Plus, ShieldAlert, Trash2, Wallet } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData, type DisciplinaryDecision, type Objection } from '../../hooks/useTournamentData';
import { OBJECTION_STATUS } from '../../lib/constants';
import { cn, firebaseErrorMessage, formatDate, formatNumber } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, Select, Textarea } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';

interface DecisionForm {
  number: string;
  date: string;
  targetType: 'player' | 'coach' | 'team' | 'fans';
  targetId: string;
  targetName: string;
  reason: string;
  penaltyType: string;
  amount: number;
  matchId: string;
  status: 'published' | 'draft';
}

const emptyDecision = (): DecisionForm => ({
  number: '',
  date: new Date().toISOString().slice(0, 10),
  targetType: 'team',
  targetId: '',
  targetName: '',
  reason: '',
  penaltyType: 'غرامة مالية',
  amount: 0,
  matchId: '',
  status: 'published',
});

export const AdminDisciplinary = () => {
  const { decisions, objections, teams, players, matches, loading, refresh } = useTournamentData();
  const toast = useToast();

  const [tab, setTab] = useState<'decisions' | 'objections'>('decisions');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DisciplinaryDecision | null>(null);
  const [form, setForm] = useState<DecisionForm>(emptyDecision());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DisciplinaryDecision | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [objectionTarget, setObjectionTarget] = useState<Objection | null>(null);
  const [objectionForm, setObjectionForm] = useState({ status: 'pending', decision: '' });
  const [savingObjection, setSavingObjection] = useState(false);

  const stats = useMemo(() => {
    const published = decisions.filter((item) => item.status !== 'draft');
    const totalFines = decisions.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    return { published: published.length, totalFines, pending: objections.filter((o) => o.status === 'pending').length };
  }, [decisions, objections]);

  const openCreate = () => {
    setEditing(null);
    const nextNumber = String(decisions.length + 1).padStart(3, '0');
    setForm({ ...emptyDecision(), number: nextNumber });
    setModalOpen(true);
  };

  const openEdit = (decision: DisciplinaryDecision) => {
    setEditing(decision);
    setForm({
      number: decision.number || '',
      date: decision.date || new Date().toISOString().slice(0, 10),
      targetType: (decision.targetType || 'team') as DecisionForm['targetType'],
      targetId: decision.targetId || '',
      targetName: decision.targetName || '',
      reason: decision.reason || '',
      penaltyType: decision.penaltyType || 'غرامة مالية',
      amount: decision.amount ?? 0,
      matchId: decision.matchId || '',
      status: decision.status === 'draft' ? 'draft' : 'published',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      toast.error('سبب القرار مطلوب.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        number: form.number.trim(),
        date: form.date,
        targetType: form.targetType,
        targetId: form.targetId,
        targetName: form.targetName,
        reason: form.reason.trim(),
        penaltyType: form.penaltyType.trim(),
        amount: Number(form.amount) || 0,
        matchId: form.matchId,
        status: form.status,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, 'disciplinaryDecisions', editing.id), payload);
        toast.success('تم تحديث القرار الانضباطي.');
      } else {
        await addDoc(collection(db, 'disciplinaryDecisions'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success('تم إصدار القرار الانضباطي.');
      }
      setModalOpen(false);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'disciplinaryDecisions', deleteTarget.id));
      toast.success('تم حذف القرار.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const openObjection = (objection: Objection) => {
    setObjectionTarget(objection);
    setObjectionForm({ status: objection.status, decision: objection.decision || '' });
  };

  const handleObjectionSave = async () => {
    if (!objectionTarget) return;
    setSavingObjection(true);
    try {
      await updateDoc(doc(db, 'objections', objectionTarget.id), {
        status: objectionForm.status,
        decision: objectionForm.decision,
        updatedAt: serverTimestamp(),
      });
      toast.success('تم تحديث الاعتراض.');
      setObjectionTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSavingObjection(false);
    }
  };

  const resolutionOptions =
    form.targetType === 'team'
      ? teams.map((team) => ({ id: team.id, name: team.name }))
      : players.map((player) => ({ id: player.id, name: `${player.name} — ${teams.find((t) => t.id === player.teamId)?.name || ''}` }));

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">العقوبات والاعتراضات</h1>
          <p className="text-sm text-ink-300">
            إصدار القرارات الانضباطية، ربطها باللاعب أو الفريق أو المباراة، ومتابعة اعتراضات الفرق.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          قرار انضباطي جديد
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="إجمالي القرارات" value={decisions.length} icon={<Gavel className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile
          label="قرارات منشورة"
          value={stats.published}
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
        />
        <StatTile
          label="إجمالي الغرامات"
          value={formatNumber(stats.totalFines)}
          suffix="د.ع"
          icon={<Wallet className="h-[18px] w-[18px]" />}
          tone="sky"
          compact
        />
        <StatTile
          label="اعتراضات قيد المراجعة"
          value={stats.pending}
          icon={<FileText className="h-[18px] w-[18px]" />}
          tone="amber"
          compact
        />
      </div>

      <Tabs<'decisions' | 'objections'>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'decisions', label: 'القرارات الانضباطية', icon: <ShieldAlert className="h-4 w-4" />, count: decisions.length },
          { value: 'objections', label: 'اعتراضات الفرق', icon: <FileText className="h-4 w-4" />, count: objections.length },
        ]}
      />

      {loading ? (
        <LoadingBlock rows={5} label="جاري تحميل البيانات..." />
      ) : tab === 'decisions' ? (
        decisions.length === 0 ? (
          <EmptyState
            title="لا توجد قرارات"
            description="ابدأ بإصدار أول قرار انضباطي للبطولة."
            icon={<Gavel className="h-6 w-6" />}
            action={
              <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                قرار جديد
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {[...decisions]
              .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
              .map((decision) => (
                <GlassCard key={decision.id} padding="md" hover className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="gold" size="sm">
                          قرار رقم {decision.number || '—'}
                        </Badge>
                        <Badge tone={decision.status === 'draft' ? 'amber' : 'emerald'} size="sm">
                          {decision.status === 'draft' ? 'مسودة' : 'منشور'}
                        </Badge>
                        <span className="text-[11px] text-ink-400">{formatDate(decision.date)}</span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-white">
                        {decision.targetName || 'جهة غير محددة'}
                      </h3>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="icon-sm" variant="glass" onClick={() => openEdit(decision)} aria-label="تعديل">
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="danger" onClick={() => setDeleteTarget(decision)} aria-label="حذف">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-ink-200">{decision.reason}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <Badge tone="neutral" size="sm">
                      {decision.penaltyType || 'عقوبة'}
                    </Badge>
                    {!!decision.amount && (
                      <Badge tone="rose" size="sm">
                        {formatNumber(decision.amount)} د.ع
                      </Badge>
                    )}
                    <Badge tone="neutral" size="sm">
                      {decision.targetType === 'team'
                        ? 'فريق'
                        : decision.targetType === 'player'
                          ? 'لاعب'
                          : decision.targetType === 'coach'
                            ? 'مدرب'
                            : 'جماهير'}
                    </Badge>
                  </div>
                </GlassCard>
              ))}
          </div>
        )
      ) : objections.length === 0 ? (
        <EmptyState
          title="لا توجد اعتراضات"
          description="لم تقدّم الفرق أي اعتراضات حتى الآن. تُقدَّم الاعتراضات من لوحة الفريق."
          icon={<FileText className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-4">
          {objections.map((objection) => {
            const meta = OBJECTION_STATUS[objection.status] || OBJECTION_STATUS.pending;
            const match = matches.find((item) => item.id === objection.matchId);
            return (
              <GlassCard key={objection.id} padding="md" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-heading text-base font-bold text-white">
                      {teams.find((team) => team.id === objection.teamId)?.name || 'فريق'}
                    </h3>
                    <p className="text-[11px] text-ink-400">
                      {match
                        ? `${teams.find((t) => t.id === match.homeTeamId)?.name || ''} × ${
                            teams.find((t) => t.id === match.awayTeamId)?.name || ''
                          } — ${formatDate(match.date)}`
                        : 'مباراة غير محددة'}
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-3 py-1 text-[11px] font-bold', meta.className)}>
                    {meta.label}
                  </span>
                </div>
                <div className="space-y-2 text-xs leading-relaxed text-ink-200">
                  <p>
                    <span className="font-bold text-white">نوع الاعتراض: </span>
                    {objection.type || '—'}
                  </p>
                  <p className="rounded-2xl border border-white/8 bg-white/4 p-3">{objection.details || '—'}</p>
                  {objection.decision && (
                    <p className="rounded-2xl border border-emerald-glow/20 bg-emerald-glow/8 p-3 text-emerald-100">
                      <span className="font-bold">القرار: </span>
                      {objection.decision}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="glass" onClick={() => openObjection(objection)}>
                  مراجعة وتحديث الحالة
                </Button>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Decision modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل القرار ${editing.number || ''}` : 'قرار انضباطي جديد'}
        subtitle="القرارات المنشورة تظهر فوراً في سجل الانضباط للمتابعين."
        icon={<Gavel className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              {editing ? 'حفظ التعديلات' : 'إصدار القرار'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormGrid>
            <Field label="رقم القرار">
              <Input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
            </Field>
            <Field label="التاريخ">
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </Field>
            <Field label="نوع المخالفة">
              <Select
                value={form.targetType}
                onChange={(event) =>
                  setForm({ ...form, targetType: event.target.value as DecisionForm['targetType'], targetId: '', targetName: '' })
                }
              >
                <option value="team">مخالفة فريق</option>
                <option value="player">مخالفة لاعب</option>
                <option value="coach">مخالفة مدرب</option>
                <option value="fans">جماهير</option>
              </Select>
            </Field>
            <Field label={form.targetType === 'team' ? 'الفريق' : form.targetType === 'player' ? 'اللاعب' : 'الجهة'}>
              <Select
                value={form.targetId}
                onChange={(event) => {
                  const selected = resolutionOptions.find((option) => option.id === event.target.value);
                  setForm({ ...form, targetId: event.target.value, targetName: selected?.name || '' });
                }}
                disabled={form.targetType === 'fans'}
              >
                <option value="">اختر...</option>
                {resolutionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="نوع العقوبة">
              <Input
                value={form.penaltyType}
                onChange={(event) => setForm({ ...form, penaltyType: event.target.value })}
                placeholder="غرامة مالية، إيقاف مباراتين..."
              />
            </Field>
            <Field label="قيمة الغرامة (د.ع)">
              <Input
                type="number"
                min={0}
                step={5000}
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
              />
            </Field>
            <Field label="المباراة المرتبطة (اختياري)">
              <Select value={form.matchId} onChange={(event) => setForm({ ...form, matchId: event.target.value })}>
                <option value="">غير مرتبطة</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {teams.find((t) => t.id === match.homeTeamId)?.name} ×{' '}
                    {teams.find((t) => t.id === match.awayTeamId)?.name} — {formatDate(match.date)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="حالة القرار">
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as 'published' | 'draft' })}
              >
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
              </Select>
            </Field>
          </FormGrid>
          <Field label="سبب القرار وأسانيده" required>
            <Textarea
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              rows={5}
              placeholder="اكتب نص القرار الانضباطي بالتفصيل..."
            />
          </Field>
        </div>
      </Modal>

      {/* Objection modal */}
      <Modal
        open={!!objectionTarget}
        onClose={() => setObjectionTarget(null)}
        title="مراجعة الاعتراض"
        subtitle={objectionTarget ? objectionTarget.type || '' : ''}
        icon={<FileText className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setObjectionTarget(null)} disabled={savingObjection}>
              إغلاق
            </Button>
            <Button loading={savingObjection} onClick={() => void handleObjectionSave()}>
              حفظ الحالة
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-xs leading-relaxed text-ink-200">
            {objectionTarget?.details || 'لا توجد تفاصيل.'}
          </div>
          <Field label="حالة الاعتراض">
            <Select
              value={objectionForm.status}
              onChange={(event) => setObjectionForm({ ...objectionForm, status: event.target.value })}
            >
              {Object.entries(OBJECTION_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="قرار اللجنة">
            <Textarea
              value={objectionForm.decision}
              onChange={(event) => setObjectionForm({ ...objectionForm, decision: event.target.value })}
              rows={4}
              placeholder="نص قرار اللجنة بشأن الاعتراض..."
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف القرار"
        message="سيتم حذف هذا القرار الانضباطي نهائياً."
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <SectionTitle
        title="ملاحظة تنظيمية"
        subtitle="تستطيع الفرق تقديم الاعتراضات من لوحة الفريق، وتظهر هنا فوراً لمراجعتها من لجنة الانضباط."
        icon={<ShieldAlert className="h-4 w-4" />}
      />
    </div>
  );
};

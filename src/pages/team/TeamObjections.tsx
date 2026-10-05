import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { FileText, Plus, Send, Trash2 } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData, type Objection } from '../../hooks/useTournamentData';
import { OBJECTION_STATUS } from '../../lib/constants';
import { cn, firebaseErrorMessage, formatDate, timeAgo } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, Select, Textarea } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { useToast } from '../../components/ui/Toast';

const OBJECTION_TYPES = [
  'خطأ في احتساب النتيجة',
  'مشاركة لاعب غير مؤهل',
  'خطأ تحكيمي مؤثر',
  'سلوك غير رياضي',
  'خطأ في الموعد أو الملعب',
  'أخرى',
];

export const TeamObjections = () => {
  const { profile } = useAuth();
  const { objections, matches, teams, loading, refresh } = useTournamentData();
  const toast = useToast();

  const teamId = profile?.teamId || '';
  const teamMatches = useMemo(
    () => matches.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId),
    [matches, teamId],
  );
  const myObjections = useMemo(
    () =>
      objections
        .filter((objection) => objection.teamId === teamId)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    [objections, teamId],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ matchId: '', type: OBJECTION_TYPES[0], details: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Objection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const opposingName = (objection: Objection) => {
    const match = matches.find((item) => item.id === objection.matchId);
    if (!match) return 'مباراة غير محددة';
    const opponentId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
    return teams.find((team) => team.id === opponentId)?.name || 'منافس';
  };

  const handleSubmit = async () => {
    if (!teamId) {
      toast.error('حسابك غير مرتبط بفريق.');
      return;
    }
    if (!form.matchId) {
      toast.error('اختر المباراة المعنية بالاعتراض.');
      return;
    }
    if (form.details.trim().length < 15) {
      toast.error('يرجى كتابة تفاصيل واضحة للاعتراض (15 حرفاً على الأقل).');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'objections'), {
        teamId,
        matchId: form.matchId,
        type: form.type,
        details: form.details.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('تم إرسال الاعتراض إلى لجنة الانضباط.');
      setModalOpen(false);
      setForm({ matchId: '', type: OBJECTION_TYPES[0], details: '' });
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
      await deleteDoc(doc(db, 'objections', deleteTarget.id));
      toast.success('تم سحب الاعتراض.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock rows={4} label="جاري تحميل الاعتراضات..." />;

  if (!teamId) return <EmptyState title="حسابك غير مرتبط بفريق" icon={<FileText className="h-6 w-6" />} />;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">الاعتراضات الرسمية</h1>
          <p className="text-sm text-ink-300">
            قدّم اعتراضاً رسمياً على أي مباراة، وتابع حالته وقرار لجنة الانضباط بشأنه.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          اعتراض جديد
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(['pending', 'investigating', 'accepted'] as const).map((status) => (
          <GlassCard key={status} padding="md" className="space-y-2">
            <span className="text-xs font-bold text-ink-300">{OBJECTION_STATUS[status].label}</span>
            <p className="font-heading text-3xl font-black text-white">
              {myObjections.filter((item) => item.status === status).length}
            </p>
          </GlassCard>
        ))}
      </div>

      {myObjections.length === 0 ? (
        <EmptyState
          title="لا توجد اعتراضات مقدّمة"
          description="عند وجود أي خطأ في مباراة لفريقك، يمكنك تقديم اعتراض رسمي وستقوم اللجنة بمراجعته."
          icon={<FileText className="h-6 w-6" />}
          action={
            <Button variant="glass" icon={<Send className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              تقديم اعتراض
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {myObjections.map((objection) => {
            const meta = OBJECTION_STATUS[objection.status] || OBJECTION_STATUS.pending;
            const match = matches.find((item) => item.id === objection.matchId);
            return (
              <GlassCard key={objection.id} padding="md" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-heading text-base font-bold text-white">
                      ضد {opposingName(objection)}
                    </h3>
                    <p className="text-[11px] text-ink-400">
                      {match ? formatDate(match.date) : timeAgo(objection.createdAt)} · {objection.type || 'اعتراض'}
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-3 py-1 text-[11px] font-bold', meta.className)}>
                    {meta.label}
                  </span>
                </div>

                <p className="rounded-2xl border border-white/8 bg-white/4 p-3 text-xs leading-relaxed text-ink-100">
                  {objection.details}
                </p>

                {objection.decision ? (
                  <p className="rounded-2xl border border-emerald-glow/20 bg-emerald-glow/8 p-3 text-xs leading-relaxed text-emerald-100">
                    <span className="font-bold">قرار اللجنة: </span>
                    {objection.decision}
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-400">لم يصدر قرار بعد — الاعتراض قيد المراجعة.</p>
                )}

                {objection.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => setDeleteTarget(objection)}
                  >
                    سحب الاعتراض
                  </Button>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تقديم اعتراض رسمي"
        subtitle="يُرسل الاعتراض مباشرة إلى لجنة الانضباط ويظهر في لوحة الإدارة."
        icon={<Send className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} icon={<Send className="h-4 w-4" />} onClick={() => void handleSubmit()}>
              إرسال الاعتراض
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormGrid className="sm:grid-cols-1">
            <Field label="المباراة" required>
              <Select value={form.matchId} onChange={(event) => setForm({ ...form, matchId: event.target.value })}>
                <option value="">اختر المباراة...</option>
                {teamMatches.map((match) => {
                  const opponentId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
                  return (
                    <option key={match.id} value={match.id}>
                      ضد {teams.find((team) => team.id === opponentId)?.name || 'منافس'} — {formatDate(match.date)}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field label="نوع الاعتراض">
              <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                {OBJECTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label="تفاصيل الاعتراض" required hint="اذكر الدقيقة، أسماء اللاعبين، ووصفاً دقيقاً للحادثة.">
            <Textarea
              rows={5}
              value={form.details}
              onChange={(event) => setForm({ ...form, details: event.target.value })}
              placeholder="نص الاعتراض بالتفصيل..."
            />
          </Field>
          <Input type="hidden" value={profile?.email || ''} readOnly />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="سحب الاعتراض"
        message="سيتم حذف الاعتراض نهائياً ولا يمكن التراجع عن ذلك."
        confirmLabel="سحب"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <SectionTitle
        title="ضوابط الاعتراض"
        subtitle="يجب تقديم الاعتراض خلال 48 ساعة من نهاية المباراة، وأن يكون مدعوماً بوصف واضح للحادثة. القرار النهائي للجنة الانضباط."
        icon={<FileText className="h-4 w-4" />}
      />
    </div>
  );
};

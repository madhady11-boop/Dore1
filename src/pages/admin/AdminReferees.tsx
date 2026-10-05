import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Edit3, Phone, Plus, ShieldCheck, Trash2, UserSquare2 } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData, type Referee } from '../../hooks/useTournamentData';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { ImageUploader } from '../../components/media/ImageUploader';

interface RefereeForm {
  name: string;
  phone: string;
  level: string;
  matchesCount: number;
  image: string;
}

const emptyForm = (): RefereeForm => ({ name: '', phone: '', level: 'درجة أولى', matchesCount: 0, image: '' });

export const AdminReferees = () => {
  const { referees, loading, refresh } = useTournamentData();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Referee | null>(null);
  const [form, setForm] = useState<RefereeForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Referee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (referee: Referee) => {
    setEditing(referee);
    setForm({
      name: referee.name || '',
      phone: referee.phone || '',
      level: referee.level || 'درجة أولى',
      matchesCount: referee.matchesCount ?? 0,
      image: referee.image || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('اسم الحكم مطلوب.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'referees', editing.id), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          level: form.level,
          matchesCount: Number(form.matchesCount) || 0,
          image: form.image,
        });
        toast.success('تم تحديث بيانات الحكم.');
      } else {
        await addDoc(collection(db, 'referees'), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          level: form.level,
          matchesCount: Number(form.matchesCount) || 0,
          image: form.image,
          createdAt: serverTimestamp(),
        });
        toast.success('تمت إضافة الحكم.');
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
      await deleteDoc(doc(db, 'referees', deleteTarget.id));
      toast.success('تم حذف الحكم.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">طاقم التحكيم</h1>
          <p className="text-sm text-ink-300">
            سجل الحكام المعتمدين للبطولة مع صورهم وبيانات التواصل ليتم تعيينهم على المباريات.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          إضافة حكم
        </Button>
      </div>

      {loading ? (
        <LoadingBlock rows={4} label="جاري تحميل الحكام..." />
      ) : referees.length === 0 ? (
        <EmptyState
          title="لا يوجد حكام مسجلون"
          description="أضف أول حكم لبدء تعيين الطواقم على المباريات."
          icon={<UserSquare2 className="h-6 w-6" />}
          action={
            <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              إضافة حكم
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {referees.map((referee) => (
            <GlassCard key={referee.id} hover padding="md" className="space-y-4">
              <div className="flex items-start gap-4">
                {referee.image ? (
                  <img
                    src={referee.image}
                    alt={referee.name}
                    className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <ShieldCheck className="h-7 w-7 text-gold-300" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="truncate font-bold text-white">{referee.name}</h3>
                  <Badge tone="gold" size="sm">
                    {referee.level || 'حكم'}
                  </Badge>
                  {referee.phone && (
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-300" dir="ltr">
                      <Phone className="h-3 w-3" />
                      {referee.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-[11px] text-ink-300">
                  أدار <strong className="text-white">{referee.matchesCount ?? 0}</strong> مباراة
                </span>
                <div className="flex gap-1.5">
                  <Button size="icon-sm" variant="glass" onClick={() => openEdit(referee)} aria-label="تعديل">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="danger" onClick={() => setDeleteTarget(referee)} aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل ${editing.name}` : 'إضافة حكم جديد'}
        icon={<UserSquare2 className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              {editing ? 'حفظ التعديلات' : 'إضافة الحكم'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUploader
            folder="referees"
            shape="circle"
            label="صورة الحكم (اختياري)"
            value={form.image}
            onChange={(image) => setForm((current) => ({ ...current, image }))}
          />
          <FormGrid>
            <Field label="الاسم" required>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="رقم الهاتف">
              <Input
                dir="ltr"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="07xxxxxxxxx"
              />
            </Field>
            <Field label="الدرجة">
              <Select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                <option value="دولي">دولي</option>
                <option value="درجة أولى">درجة أولى</option>
                <option value="درجة ثانية">درجة ثانية</option>
                <option value="حكم معتمد">حكم معتمد</option>
              </Select>
            </Field>
            <Field label="عدد المباريات المُدارة">
              <Input
                type="number"
                min={0}
                value={form.matchesCount}
                onChange={(event) => setForm({ ...form, matchesCount: Number(event.target.value) })}
              />
            </Field>
          </FormGrid>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الحكم"
        message={`سيتم حذف "${deleteTarget?.name}" من قائمة الحكام.`}
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

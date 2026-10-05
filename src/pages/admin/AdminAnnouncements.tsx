import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CalendarDays, Edit3, Megaphone, Plus, Search, Trash2 } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData, type Announcement } from '../../hooks/useTournamentData';
import { firebaseErrorMessage, timeAgo } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, SearchInput, Select, Textarea } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { ImageUploader } from '../../components/media/ImageUploader';

interface AnnouncementForm {
  title: string;
  date: string;
  issuer: string;
  content: string;
  image: string;
  status: 'published' | 'draft';
}

const emptyForm = (): AnnouncementForm => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  issuer: 'اللجنة المنظمة',
  content: '',
  image: '',
  status: 'published',
});

export const AdminAnnouncements = () => {
  const { announcements, loading, refresh } = useTournamentData();
  const toast = useToast();

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(
    () => ({
      all: announcements.length,
      published: announcements.filter((item) => item.status !== 'draft').length,
      draft: announcements.filter((item) => item.status === 'draft').length,
    }),
    [announcements],
  );

  const filtered = useMemo(() => {
    const term = search.trim();
    return [...announcements]
      .filter((item) => {
        if (filter === 'published' && item.status === 'draft') return false;
        if (filter === 'draft' && item.status !== 'draft') return false;
        if (!term) return true;
        return item.title?.includes(term) || item.content?.includes(term) || item.issuer?.includes(term);
      })
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [announcements, filter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      date: item.date || new Date().toISOString().slice(0, 10),
      issuer: item.issuer || 'اللجنة المنظمة',
      content: item.content || '',
      image: item.image || '',
      status: item.status === 'draft' ? 'draft' : 'published',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('العنوان ونص التبليغ مطلوبان.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date,
        issuer: form.issuer.trim() || 'اللجنة المنظمة',
        content: form.content.trim(),
        image: form.image,
        status: form.status,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, 'announcements', editing.id), payload);
        toast.success('تم تحديث التبليغ.');
      } else {
        await addDoc(collection(db, 'announcements'), { ...payload, createdAt: serverTimestamp() });
        toast.success(form.status === 'draft' ? 'تم حفظ التبليغ كمسودة.' : 'تم نشر التبليغ رسمياً.');
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
      await deleteDoc(doc(db, 'announcements', deleteTarget.id));
      toast.success('تم حذف التبليغ.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (item: Announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', item.id), {
        status: item.status === 'draft' ? 'published' : 'draft',
        updatedAt: serverTimestamp(),
      });
      toast.success(item.status === 'draft' ? 'تم نشر التبليغ.' : 'تم تحويل التبليغ إلى مسودة.');
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">التبليغات والأخبار</h1>
          <p className="text-sm text-ink-300">
            انشر التبليغات الرسمية والقرارات الإعلامية مع صورة غلاف اختيارية، وتحكم بظهورها للمتابعين.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          تبليغ جديد
        </Button>
      </div>

      <GlassCard variant="soft" padding="md" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs<'all' | 'published' | 'draft'>
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'الكل', count: counts.all },
            { value: 'published', label: 'منشورة', count: counts.published },
            { value: 'draft', label: 'مسودات', count: counts.draft },
          ]}
        />
        <SearchInput
          placeholder="ابحث في التبليغات..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full lg:w-72"
        />
      </GlassCard>

      {loading ? (
        <LoadingBlock rows={4} label="جاري تحميل التبليغات..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد تبليغات"
          description="ابدأ بنشر أول تبليغ رسمي للبطولة."
          icon={<Megaphone className="h-6 w-6" />}
          action={
            <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              تبليغ جديد
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((item) => (
            <GlassCard key={item.id} hover padding="md" className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.status === 'draft' ? 'amber' : 'emerald'} size="sm">
                      {item.status === 'draft' ? 'مسودة' : 'منشور'}
                    </Badge>
                    <Badge tone="gold" size="sm">
                      {item.issuer || 'اللجنة المنظمة'}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                      <CalendarDays className="h-3 w-3" />
                      {item.date || timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{item.title}</h3>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="icon-sm" variant="glass" onClick={() => openEdit(item)} aria-label="تعديل">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="danger" onClick={() => setDeleteTarget(item)} aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-40 w-full rounded-2xl border border-white/10 object-cover"
                  loading="lazy"
                />
              )}

              <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-ink-200">{item.content}</p>

              <Button size="sm" variant="ghost" onClick={() => void togglePublish(item)}>
                {item.status === 'draft' ? 'نشر التبليغ الآن' : 'تحويل إلى مسودة'}
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل التبليغ' : 'تبليغ رسمي جديد'}
        subtitle="يظهر التبليغ في صفحة التبليغات وفي الصفحة الرئيسية عند النشر."
        icon={<Megaphone className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              {form.status === 'draft' ? 'حفظ كمسودة' : editing ? 'حفظ ونشر' : 'نشر التبليغ'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUploader
            folder="news"
            shape="wide"
            label="صورة الغلاف (اختياري)"
            value={form.image}
            onChange={(image) => setForm((current) => ({ ...current, image }))}
            recommended="يفضّل صورة أفقية بنسبة 16:9 لتظهر بشكل مثالي في الصفحة الرئيسية."
          />

          <FormGrid>
            <Field label="عنوان التبليغ" required>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="مثال: تعديل موعد مباراة الجولة القادمة"
              />
            </Field>
            <Field label="الجهة المُصدِرة">
              <Input
                value={form.issuer}
                onChange={(event) => setForm({ ...form, issuer: event.target.value })}
                placeholder="اللجنة المنظمة"
              />
            </Field>
            <Field label="التاريخ">
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </Field>
            <Field label="الحالة">
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as 'published' | 'draft' })}
              >
                <option value="published">منشور للجمهور</option>
                <option value="draft">مسودة (غير مرئي)</option>
              </Select>
            </Field>
          </FormGrid>

          <Field label="نص التبليغ" required hint="يمكنك استخدام الأسطر المتعددة لتنظيم نص القرار.">
            <Textarea
              rows={8}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="نص التبليغ الرسمي..."
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف التبليغ"
        message={`سيتم حذف "${deleteTarget?.title}" نهائياً.`}
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <GlassCard variant="soft" padding="md" className="flex flex-wrap items-center gap-3 text-xs text-ink-300">
        <Search className="h-4 w-4 text-gold-300" />
        يمكن لمدير الإعلام نشر التبليغات؛ أما بقية الأدوار فتظهر لهم حسب الصلاحيات.
      </GlassCard>
    </div>
  );
};

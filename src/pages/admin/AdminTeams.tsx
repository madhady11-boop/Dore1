import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc, collection } from 'firebase/firestore';
import { Edit3, Plus, Search, ShieldAlert, ShieldPlus, Trash2, User, Users } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData } from '../../hooks/useTournamentData';
import { buildStandings } from '../../lib/stats';
import { DEFAULT_FORMATION, FORMATIONS } from '../../lib/constants';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormActions, FormGrid, Input, SearchInput, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { useToast } from '../../components/ui/Toast';
import { TeamBadge } from '../../components/football/Avatars';
import { ImageUploader } from '../../components/media/ImageUploader';
import type { TeamLike } from '../../lib/stats';

interface TeamFormState {
  name: string;
  coach: string;
  captain: string;
  establishedYear: number;
  logo: string;
  formation: string;
}

const emptyForm = (): TeamFormState => ({
  name: '',
  coach: '',
  captain: '',
  establishedYear: new Date().getFullYear(),
  logo: '',
  formation: DEFAULT_FORMATION,
});

export const AdminTeams = () => {
  const { teams, players, matches, loading, refresh } = useTournamentData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamLike | null>(null);
  const [form, setForm] = useState<TeamFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamLike | null>(null);
  const [deleting, setDeleting] = useState(false);

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);

  const filtered = useMemo(() => {
    const term = search.trim();
    return standings.filter((row) => {
      const team = teams.find((item) => item.id === row.teamId);
      if (!term) return true;
      return (
        row.name.includes(term) || (team?.coach || '').includes(term) || (team?.captain || '').includes(term)
      );
    });
  }, [standings, teams, search]);

  const openCreate = () => {
    setEditingTeam(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (team: TeamLike) => {
    setEditingTeam(team);
    setForm({
      name: team.name || '',
      coach: team.coach || '',
      captain: team.captain || '',
      establishedYear: team.establishedYear || new Date().getFullYear(),
      logo: team.logo || '',
      formation: team.formation || DEFAULT_FORMATION,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('اسم الفريق مطلوب.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        coach: form.coach.trim(),
        captain: form.captain.trim(),
        establishedYear: Number(form.establishedYear) || new Date().getFullYear(),
        logo: form.logo,
        formation: form.formation,
        updatedAt: serverTimestamp(),
      };

      if (editingTeam) {
        await updateDoc(doc(db, 'teams', editingTeam.id), payload);
        toast.success('تم تحديث بيانات الفريق والشعار.');
      } else {
        await addDoc(collection(db, 'teams'), {
          ...payload,
          played: 0,
          won: 0,
          drew: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          createdAt: serverTimestamp(),
        });
        toast.success('تمت إضافة الفريق بنجاح.');
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
      await deleteDoc(doc(db, 'teams', deleteTarget.id));
      toast.success('تم حذف الفريق.');
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
          <h1 className="font-heading text-2xl font-black text-white">إدارة الفرق والشعارات</h1>
          <p className="text-sm text-ink-300">
            أضف الفرق، ارفع شعاراتها بجودة عالية، وحدّث بيانات المدرب والكابتن والتشكيلة الافتراضية.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          فريق جديد
        </Button>
      </div>

      <GlassCard variant="soft" padding="md" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          placeholder="ابحث باسم الفريق أو المدرب..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:w-80"
        />
        <div className="flex items-center gap-3 text-xs text-ink-300">
          <Badge tone="gold" size="sm">
            {filtered.length} فريق
          </Badge>
          <span>إجمالي اللاعبين: {players.length}</span>
        </div>
      </GlassCard>

      {loading ? (
        <LoadingBlock rows={6} label="جاري تحميل الفرق..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد فرق"
          description="ابدأ بإضافة أول فريق مشارك في البطولة."
          icon={<ShieldPlus className="h-6 w-6" />}
          action={
            <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              إضافة فريق
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => {
            const team = teams.find((item) => item.id === row.teamId);
            if (!team) return null;
            const squad = players.filter((player) => player.teamId === team.id);
            return (
              <GlassCard key={team.id} hover padding="md" className="space-y-5">
                <div className="flex items-start gap-4">
                  <TeamBadge name={team.name} logo={team.logo} size="lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="truncate font-heading text-lg font-bold text-white">{team.name}</h3>
                    <div className="space-y-1 text-[11px] text-ink-300">
                      <p className="inline-flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        {team.coach || 'بدون مدرب'}
                      </p>
                      <p className="inline-flex items-center gap-1.5">
                        <ShieldAlert className="h-3 w-3" />
                        {team.captain || 'بدون كابتن'} · {team.establishedYear || '—'}
                      </p>
                    </div>
                  </div>
                  <Badge tone="gold" size="sm">
                    {row.points} نقطة
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-sm font-black text-white">{row.played}</p>
                    <p className="text-ink-400">لعب</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-sm font-black text-emerald-glow">{row.won}</p>
                    <p className="text-ink-400">فاز</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-sm font-black text-ink-100">{row.drew}</p>
                    <p className="text-ink-400">تعادل</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 py-2">
                    <p className="font-heading text-sm font-black text-rose-glow">{row.lost}</p>
                    <p className="text-ink-400">خسر</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="glass" icon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => openEdit(team)}>
                    تعديل وشعار
                  </Button>
                  <Link to={`/admin/players?team=${team.id}`} className="flex-1">
                    <Button size="sm" variant="dark" block icon={<Users className="h-3.5 w-3.5" />}>
                      اللاعبون ({squad.length})
                    </Button>
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="danger"
                    onClick={() => setDeleteTarget(team)}
                    aria-label="حذف الفريق"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeam ? `تعديل ${editingTeam.name}` : 'إضافة فريق جديد'}
        subtitle="يظهر الشعار والبيانات مباشرة على الموقع العام بعد الحفظ."
        icon={<ShieldPlus className="h-5 w-5" />}
        size="lg"
        footer={
          <FormActions>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              {editingTeam ? 'حفظ التعديلات' : 'إضافة الفريق'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-6">
          <ImageUploader
            folder="team-logos"
            label="شعار الفريق"
            value={form.logo}
            onChange={(logo) => setForm((current) => ({ ...current, logo }))}
            recommended="مربع أو دائري، خلفية شفافة (PNG) تُفضّل — يتم ضغط الصورة تلقائياً حتى 640 بكسل."
          />

          <FormGrid>
            <Field label="اسم الفريق" required>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="مثال: تحدي المنصورية"
              />
            </Field>
            <Field label="سنة التأسيس">
              <Input
                type="number"
                value={form.establishedYear}
                onChange={(event) => setForm({ ...form, establishedYear: Number(event.target.value) })}
              />
            </Field>
            <Field label="المدرب">
              <Input
                value={form.coach}
                onChange={(event) => setForm({ ...form, coach: event.target.value })}
                placeholder="اسم المدرب"
              />
            </Field>
            <Field label="كابتن الفريق">
              <Input
                value={form.captain}
                onChange={(event) => setForm({ ...form, captain: event.target.value })}
                placeholder="اسم الكابتن"
              />
            </Field>
            <Field label="التشكيلة الافتراضية" hint="تُستخدم لعرض ترتيب اللاعبين في مخطط الملعب.">
              <Select value={form.formation} onChange={(event) => setForm({ ...form, formation: event.target.value })}>
                {FORMATIONS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>

          {form.logo && (
            <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4">
              <TeamBadge name={form.name || 'فريق'} logo={form.logo} size="md" />
              <div className="text-xs text-ink-300">
                <p className="font-bold text-white">معاينة الشعار</p>
                <p>هكذا سيظهر في جدول الترتيب والمباريات وبطاقة الفريق.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الفريق"
        message={`سيتم حذف "${deleteTarget?.name}" نهائياً. لاعبيه ومبارياته ستبقى في قاعدة البيانات لكن بدون فريق مرتبط.`}
        confirmLabel="حذف نهائي"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <SectionTitle
        title="نصيحة سريعة"
        subtitle="يمكنك رفع شعار الفريق أيضاً من لوحة الفريق نفسها، بينما تبقى صلاحية إنشاء الفرق محصورة بإدارة البطولة."
        icon={<Search className="h-4 w-4" />}
      />
    </div>
  );
};

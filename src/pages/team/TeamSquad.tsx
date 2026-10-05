import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  LayoutGrid,
  ListOrdered,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData } from '../../hooks/useTournamentData';
import {
  LINE_LABELS,
  POSITION_NAMES,
  PLAYER_STATUS_LABELS,
  positionToLine,
  type Line,
} from '../../lib/constants';
import { groupSquadByLine, type PlayerLike } from '../../lib/stats';
import { ageFromBirthYear, cn, firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input, SearchInput, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PlayerAvatar } from '../../components/football/Avatars';
import { FormationPitch } from '../../components/football/FormationPitch';
import { ImageUploader } from '../../components/media/ImageUploader';

interface PlayerFormState {
  name: string;
  number: number;
  position: string;
  line: Line;
  birthYear: number;
  status: string;
  photo: string;
  goals: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  motm: number;
}

const emptyForm = (): PlayerFormState => ({
  name: '',
  number: 0,
  position: 'وسط',
  line: 'MID',
  birthYear: 2003,
  status: 'active',
  photo: '',
  goals: 0,
  matchesPlayed: 0,
  yellowCards: 0,
  redCards: 0,
  motm: 0,
});

export const TeamSquad = () => {
  const { profile } = useAuth();
  const { teams, players, loading, refresh } = useTournamentData();
  const toast = useToast();

  const teamId = profile?.teamId || '';
  const team = teams.find((item) => item.id === teamId);

  const [view, setView] = useState<'cards' | 'lineup'>('cards');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerLike | null>(null);
  const [form, setForm] = useState<PlayerFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlayerLike | null>(null);
  const [deleting, setDeleting] = useState(false);

  const squad = useMemo(
    () =>
      players
        .filter((player) => player.teamId === teamId)
        .filter((player) => (search.trim() ? player.name.includes(search.trim()) : true))
        .sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
    [players, teamId, search],
  );

  const allSquad = useMemo(() => players.filter((player) => player.teamId === teamId), [players, teamId]);
  const lines = useMemo(() => groupSquadByLine(allSquad), [allSquad]);

  const openCreate = () => {
    setEditing(null);
    const nextNumber = Math.max(0, ...allSquad.map((player) => player.number ?? 0)) + 1;
    setForm({ ...emptyForm(), number: nextNumber });
    setModalOpen(true);
  };

  const openEdit = (player: PlayerLike) => {
    setEditing(player);
    setForm({
      name: player.name || '',
      number: player.number ?? 0,
      position: player.position || 'وسط',
      line: (player.line || positionToLine(player.position)) as Line,
      birthYear: player.birthYear ?? 2003,
      status: player.status || 'active',
      photo: player.photo || '',
      goals: player.goals ?? 0,
      matchesPlayed: player.matchesPlayed ?? 0,
      yellowCards: player.yellowCards ?? 0,
      redCards: player.redCards ?? 0,
      motm: player.motm ?? 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!teamId) {
      toast.error('حسابك غير مرتبط بفريق.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('اسم اللاعب مطلوب.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        number: Number(form.number) || 0,
        position: form.position,
        line: form.line,
        birthYear: Number(form.birthYear) || 2003,
        status: form.status,
        photo: form.photo,
        goals: Number(form.goals) || 0,
        matchesPlayed: Number(form.matchesPlayed) || 0,
        yellowCards: Number(form.yellowCards) || 0,
        redCards: Number(form.redCards) || 0,
        motm: Number(form.motm) || 0,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, 'players', editing.id), payload);
        toast.success('تم تحديث بيانات اللاعب.');
      } else {
        await addDoc(collection(db, 'players'), {
          ...payload,
          teamId,
          order: allSquad.length,
          createdAt: serverTimestamp(),
        });
        toast.success('تمت إضافة اللاعب إلى كشف فريقك.');
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
      await deleteDoc(doc(db, 'players', deleteTarget.id));
      toast.success('تم حذف اللاعب.');
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const persistOrder = async (line: Line, ordered: PlayerLike[]) => {
    try {
      await Promise.all(
        ordered.map((player, index) =>
          updateDoc(doc(db, 'players', player.id), { order: index, line, updatedAt: serverTimestamp() }),
        ),
      );
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    }
  };

  const movePlayer = (player: PlayerLike, direction: -1 | 1) => {
    const line = (player.line || positionToLine(player.position)) as Line;
    const list = [...lines[line]];
    const index = list.findIndex((item) => item.id === player.id);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    void persistOrder(line, list).then(() => toast.success('تم تحديث ترتيب التشكيلة.'));
  };

  const changeLine = (player: PlayerLike, line: Line) => {
    void updateDoc(doc(db, 'players', player.id), {
      line,
      order: lines[line].length,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        toast.success(`تم نقل اللاعب إلى ${LINE_LABELS[line]}.`);
        refresh();
      })
      .catch((error) => toast.error(firebaseErrorMessage(error)));
  };

  const autoArrange = async () => {
    try {
      const batchUpdates: Promise<unknown>[] = [];
      (Object.keys(lines) as Line[]).forEach((line) => {
        const ordered = [...lines[line]].sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
        ordered.forEach((player, index) => {
          batchUpdates.push(
            updateDoc(doc(db, 'players', player.id), { order: index, line, updatedAt: serverTimestamp() }),
          );
        });
      });
      await Promise.all(batchUpdates);
      toast.success('تم ترتيب التشكيلة تلقائياً حسب أرقام القمصان.');
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    }
  };

  if (loading) return <LoadingBlock rows={6} label="جاري تحميل كشف الفريق..." />;

  if (!teamId) {
    return <EmptyState title="حسابك غير مرتبط بفريق" description="تواصل مع إدارة الدوري لربط حسابك." icon={<Shirt className="h-6 w-6" />} />;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">التشكيلة واللاعبون</h1>
          <p className="text-sm text-ink-300">
            أضف لاعبي فريقك، ارفع صورهم، وحدّد الخط التكتيكي وترتيب اللاعبين ليظهر مخطط التشكيلة مرتّباً للجمهور.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" icon={<Sparkles className="h-4 w-4" />} onClick={() => void autoArrange()}>
            ترتيب تلقائي
          </Button>
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={openCreate}>
            لاعب جديد
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs<'cards' | 'lineup'>
          value={view}
          onChange={setView}
          items={[
            { value: 'cards', label: 'بطاقات اللاعبين', icon: <LayoutGrid className="h-4 w-4" />, count: squad.length },
            { value: 'lineup', label: 'ترتيب التشكيلة', icon: <ListOrdered className="h-4 w-4" /> },
          ]}
        />
        <SearchInput
          placeholder="ابحث باسم اللاعب..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:w-72"
        />
      </div>

      {view === 'cards' ? (
        squad.length === 0 ? (
          <EmptyState
            title="لا يوجد لاعبون في كشف فريقك"
            description="ابدأ بإضافة اللاعبين مع صورهم ومراكزهم."
            icon={<Users className="h-6 w-6" />}
            action={
              <Button variant="glass" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                إضافة أول لاعب
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {squad.map((player) => {
              const line = (player.line || positionToLine(player.position)) as Line;
              const status = PLAYER_STATUS_LABELS[player.status || 'unregistered'] || PLAYER_STATUS_LABELS.unregistered;
              return (
                <GlassCard key={player.id} hover padding="md" className="space-y-4">
                  <div className="flex items-start gap-4">
                    <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="md" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="truncate text-sm font-bold text-white">{player.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone="neutral" size="sm">
                          {player.position || '—'}
                        </Badge>
                        <Badge tone="violet" size="sm">
                          {LINE_LABELS[line]}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-ink-400">
                        {player.birthYear} · {ageFromBirthYear(player.birthYear)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div className="rounded-xl border border-white/8 bg-white/4 py-1.5">
                      <p className="font-heading text-sm font-black text-gold-200">{player.goals ?? 0}</p>
                      <p className="text-ink-400">أهداف</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/4 py-1.5">
                      <p className="font-heading text-sm font-black text-white">{player.matchesPlayed ?? 0}</p>
                      <p className="text-ink-400">مباريات</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/4 py-1.5">
                      <p className="font-heading text-sm font-black text-amber-glow">{player.yellowCards ?? 0}</p>
                      <p className="text-ink-400">صفراء</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/4 py-1.5">
                      <p className="font-heading text-sm font-black text-rose-glow">{player.redCards ?? 0}</p>
                      <p className="text-ink-400">حمراء</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold', status.className)}>
                      {status.label}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="icon-sm" variant="glass" onClick={() => openEdit(player)} aria-label="تعديل">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="danger" onClick={() => setDeleteTarget(player)} aria-label="حذف">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          {squad.length ? (
            <FormationPitch lines={lines} formation={team?.formation} linkPlayers={false} />
          ) : (
            <EmptyState title="لا يوجد لاعبون لترتيبهم" icon={<Users className="h-6 w-6" />} />
          )}

          <GlassCard padding="lg" className="space-y-5">
            <SectionTitle
              title="الترتيب داخل الخطوط"
              subtitle="استخدم الأسهم لترتيب اللاعبين، أو انقلهم بين الخطوط — يظهر الترتيب مباشرة على الموقع."
              icon={<ListOrdered className="h-5 w-5" />}
            />
            {(Object.keys(lines) as Line[]).map((line) => (
              <div key={line} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gold-200">{LINE_LABELS[line]}</span>
                  <span className="text-[10px] text-ink-400">{lines[line].length} لاعب</span>
                </div>
                <div className="space-y-2">
                  {lines[line].length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/12 px-3 py-2 text-[11px] text-ink-400">
                      لا يوجد لاعبون في هذا الخط.
                    </p>
                  )}
                  {lines[line].map((player, index) => (
                    <div key={player.id} className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 p-2">
                      <span className="w-4 text-center text-[10px] font-black text-ink-400">{index + 1}</span>
                      <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{player.name}</span>
                      <Select
                        value={line}
                        onChange={(event) => changeLine(player, event.target.value as Line)}
                        className="w-24 px-2 py-1 text-[10px]"
                      >
                        {(Object.keys(LINE_LABELS) as Line[]).map((key) => (
                          <option key={key} value={key}>
                            {LINE_LABELS[key]}
                          </option>
                        ))}
                      </Select>
                      <div className="flex gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === 0}
                          onClick={() => movePlayer(player, -1)}
                          aria-label="أعلى"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === lines[line].length - 1}
                          onClick={() => movePlayer(player, 1)}
                          aria-label="أسفل"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل ${editing.name}` : 'إضافة لاعب جديد'}
        subtitle="ارفع صورة اللاعب وحدّد مركزه وخطه التكتيكي."
        icon={<Plus className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              {editing ? 'حفظ التعديلات' : 'إضافة اللاعب'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUploader
            folder="player-photos"
            label="صورة اللاعب"
            value={form.photo}
            onChange={(photo) => setForm((current) => ({ ...current, photo }))}
            recommended="صورة شخصية مربعة قدر الإمكان — تُضغط تلقائياً قبل الرفع."
          />
          <FormGrid>
            <Field label="اسم اللاعب" required>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="رقم القميص">
              <Input
                type="number"
                min={1}
                max={99}
                value={form.number}
                onChange={(event) => setForm({ ...form, number: Number(event.target.value) })}
              />
            </Field>
            <Field label="المركز">
              <Select
                value={form.position}
                onChange={(event) =>
                  setForm({ ...form, position: event.target.value, line: positionToLine(event.target.value) })
                }
              >
                {POSITION_NAMES.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الخط التكتيكي">
              <Select value={form.line} onChange={(event) => setForm({ ...form, line: event.target.value as Line })}>
                {(Object.keys(LINE_LABELS) as Line[]).map((key) => (
                  <option key={key} value={key}>
                    {LINE_LABELS[key]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="سنة التولد">
              <Input
                type="number"
                value={form.birthYear}
                onChange={(event) => setForm({ ...form, birthYear: Number(event.target.value) })}
              />
            </Field>
            <Field label="حالة اللاعب">
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="active">فعال</option>
                <option value="suspended">موقوف</option>
                <option value="excluded">مستبعد</option>
                <option value="unregistered">غير مسجل</option>
              </Select>
            </Field>
          </FormGrid>
          <FormGrid className="sm:grid-cols-3">
            <Field label="الأهداف">
              <Input
                type="number"
                min={0}
                value={form.goals}
                onChange={(event) => setForm({ ...form, goals: Number(event.target.value) })}
              />
            </Field>
            <Field label="المباريات">
              <Input
                type="number"
                min={0}
                value={form.matchesPlayed}
                onChange={(event) => setForm({ ...form, matchesPlayed: Number(event.target.value) })}
              />
            </Field>
            <Field label="نجم المباراة">
              <Input
                type="number"
                min={0}
                value={form.motm}
                onChange={(event) => setForm({ ...form, motm: Number(event.target.value) })}
              />
            </Field>
          </FormGrid>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف اللاعب"
        message={`سيتم حذف "${deleteTarget?.name}" من كشف فريقك.`}
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

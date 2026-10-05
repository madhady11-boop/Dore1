import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  LayoutGrid,
  ListOrdered,
  Plus,
  Shirt,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { db } from '../../firebase';
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
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
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
  assists: number;
  matchesPlayed: number;
  motm: number;
  yellowCards: number;
  redCards: number;
}

const emptyForm = (): PlayerFormState => ({
  name: '',
  number: 0,
  position: 'وسط',
  line: 'MID',
  birthYear: 2000,
  status: 'active',
  photo: '',
  goals: 0,
  assists: 0,
  matchesPlayed: 0,
  motm: 0,
  yellowCards: 0,
  redCards: 0,
});

export const AdminPlayers = () => {
  const { teams, players, loading, refresh } = useTournamentData();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [teamId, setTeamId] = useState('');
  const [view, setView] = useState<'cards' | 'lineup'>('cards');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerLike | null>(null);
  const [form, setForm] = useState<PlayerFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlayerLike | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ar')), [teams]);

  useEffect(() => {
    const fromQuery = searchParams.get('team');
    if (fromQuery && teams.some((team) => team.id === fromQuery)) {
      setTeamId(fromQuery);
      return;
    }
    if (!teamId && sortedTeams[0]) setTeamId(sortedTeams[0].id);
  }, [searchParams, sortedTeams, teams, teamId]);

  const selectTeam = (id: string) => {
    setTeamId(id);
    setSearchParams({ team: id }, { replace: true });
  };

  const squad = useMemo(
    () =>
      players
        .filter((player) => player.teamId === teamId)
        .filter((player) => (search.trim() ? player.name.includes(search.trim()) : true))
        .sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
    [players, teamId, search],
  );

  const lines = useMemo(() => groupSquadByLine(players.filter((player) => player.teamId === teamId)), [players, teamId]);
  const team = teams.find((item) => item.id === teamId);

  const openCreate = () => {
    setEditing(null);
    const nextNumber = Math.max(0, ...players.filter((p) => p.teamId === teamId).map((p) => p.number ?? 0)) + 1;
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
      birthYear: player.birthYear ?? 2000,
      status: player.status || 'active',
      photo: player.photo || '',
      goals: player.goals ?? 0,
      assists: player.assists ?? 0,
      matchesPlayed: player.matchesPlayed ?? 0,
      motm: player.motm ?? 0,
      yellowCards: player.yellowCards ?? 0,
      redCards: player.redCards ?? 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('اسم اللاعب مطلوب.');
      return;
    }
    if (!editing && !teamId) {
      toast.error('اختر الفريق أولاً.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        number: Number(form.number) || 0,
        position: form.position,
        line: form.line,
        birthYear: Number(form.birthYear) || 2000,
        status: form.status,
        photo: form.photo,
        goals: Number(form.goals) || 0,
        assists: Number(form.assists) || 0,
        matchesPlayed: Number(form.matchesPlayed) || 0,
        motm: Number(form.motm) || 0,
        yellowCards: Number(form.yellowCards) || 0,
        redCards: Number(form.redCards) || 0,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, 'players', editing.id), payload);
        toast.success('تم تحديث بيانات اللاعب.');
      } else {
        await addDoc(collection(db, 'players'), {
          ...payload,
          teamId,
          order: squad.length,
          createdAt: serverTimestamp(),
        });
        toast.success('تمت إضافة اللاعب إلى كشف الفريق.');
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

  const movePlayer = async (player: PlayerLike, direction: -1 | 1) => {
    const line = (player.line || positionToLine(player.position)) as Line;
    const list = [...lines[line]];
    const index = list.findIndex((item) => item.id === player.id);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await Promise.all(
        reordered.map((item, position) =>
          updateDoc(doc(db, 'players', item.id), {
            order: position,
            line,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      toast.success('تم تحديث ترتيب التشكيلة.');
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    }
  };

  const changeLine = async (player: PlayerLike, line: Line) => {
    try {
      await updateDoc(doc(db, 'players', player.id), {
        line,
        order: lines[line].length,
        updatedAt: serverTimestamp(),
      });
      toast.success(`تم نقل اللاعب إلى ${LINE_LABELS[line]}.`);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">اللاعبون والتشكيلات</h1>
          <p className="text-sm text-ink-300">
            أضف اللاعبين، ارفع صورهم، وحدّد الخط التكتيكي وترتيبهم داخل التشكيلة لظهور مخطط مرتّب للجمهور.
          </p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={openCreate} disabled={!teamId}>
          لاعب جديد
        </Button>
      </div>

      {/* Team selector */}
      <GlassCard variant="soft" padding="md" className="space-y-4">
        <div className="flex items-center gap-3">
          <Shirt className="h-5 w-5 text-gold-300" />
          <span className="text-sm font-bold text-white">اختر الفريق</span>
          {team && <Badge tone="gold" size="sm">{team.name}</Badge>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {sortedTeams.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTeam(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition-all duration-300',
                item.id === teamId
                  ? 'border-gold-300/45 bg-gold-400/15 text-gold-100'
                  : 'border-white/10 bg-white/4 text-ink-300 hover:border-white/25 hover:text-white',
              )}
            >
              <TeamBadge name={item.name} logo={item.logo} size="xs" />
              {item.name}
            </button>
          ))}
          {sortedTeams.length === 0 && <span className="text-xs text-ink-400">لا توجد فرق — أضف فريقاً أولاً.</span>}
        </div>
      </GlassCard>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs<'cards' | 'lineup'>
          value={view}
          onChange={setView}
          items={[
            { value: 'cards', label: 'بطاقات اللاعبين', icon: <LayoutGrid className="h-4 w-4" />, count: squad.length },
            { value: 'lineup', label: 'تنظيم التشكيلة', icon: <ListOrdered className="h-4 w-4" /> },
          ]}
        />
        <SearchInput
          placeholder="ابحث باسم اللاعب..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:w-72"
        />
      </div>

      {loading ? (
        <LoadingBlock rows={6} label="جاري تحميل اللاعبين..." />
      ) : view === 'cards' ? (
        squad.length === 0 ? (
          <EmptyState
            title="لا يوجد لاعبون"
            description={teamId ? 'ابدأ بإضافة لاعبي هذا الفريق.' : 'اختر فريقاً لعرض لاعبيه.'}
            icon={<Users className="h-6 w-6" />}
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
                    <MiniStat label="أهداف" value={player.goals ?? 0} tone="text-gold-200" />
                    <MiniStat label="مباريات" value={player.matchesPlayed ?? 0} tone="text-white" />
                    <MiniStat label="صفراء" value={player.yellowCards ?? 0} tone="text-amber-glow" />
                    <MiniStat label="حمراء" value={player.redCards ?? 0} tone="text-rose-glow" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold', status.className)}>
                      {status.label}
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="icon-sm" variant="glass" onClick={() => openEdit(player)} aria-label="تعديل">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="danger"
                        onClick={() => setDeleteTarget(player)}
                        aria-label="حذف"
                      >
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
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-bold text-white">تنظيم الخطوط والترتيب</h2>
              <p className="text-xs text-ink-300">
                انقل اللاعبين بين الخطوط، ورتّبهم داخل كل خط — يظهر الترتيب فوراً في مخطط التشكيلة على الموقع.
              </p>
            </div>

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
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 p-2"
                    >
                      <PlayerAvatar name={player.name} photo={player.photo} number={player.number} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{player.name}</span>
                      <Select
                        value={line}
                        onChange={(event) => void changeLine(player, event.target.value as Line)}
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
                          onClick={() => void movePlayer(player, -1)}
                          aria-label="تحريك للأعلى"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === lines[line].length - 1}
                          onClick={() => void movePlayer(player, 1)}
                          aria-label="تحريك للأسفل"
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

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل ${editing.name}` : `إضافة لاعب${team ? ` إلى ${team.name}` : ''}`}
        subtitle="تُضغط الصور تلقائياً وترفع بأمان إلى التخزين."
        icon={<Plus className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
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
            recommended="صورة شخصية مربعة قدر الإمكان (رأس وكتفين) للحصول على أفضل عرض في البطاقة."
          />

          <FormGrid>
            <Field label="اسم اللاعب" required>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="الاسم الثلاثي"
              />
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

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">الإحصائيات الأولية</h3>
            <FormGrid className="sm:grid-cols-3">
              <Field label="الأهداف">
                <Input
                  type="number"
                  min={0}
                  value={form.goals}
                  onChange={(event) => setForm({ ...form, goals: Number(event.target.value) })}
                />
              </Field>
              <Field label="صناعة">
                <Input
                  type="number"
                  min={0}
                  value={form.assists}
                  onChange={(event) => setForm({ ...form, assists: Number(event.target.value) })}
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
              <Field label="بطاقات صفراء">
                <Input
                  type="number"
                  min={0}
                  value={form.yellowCards}
                  onChange={(event) => setForm({ ...form, yellowCards: Number(event.target.value) })}
                />
              </Field>
              <Field label="بطاقات حمراء">
                <Input
                  type="number"
                  min={0}
                  value={form.redCards}
                  onChange={(event) => setForm({ ...form, redCards: Number(event.target.value) })}
                />
              </Field>
            </FormGrid>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف اللاعب"
        message={`سيتم حذف "${deleteTarget?.name}" من كشوفات الفريق نهائياً.`}
        confirmLabel="حذف نهائي"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const MiniStat = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-xl border border-white/8 bg-white/4 py-1.5">
    <p className={cn('font-heading text-sm font-black', tone)}>{value}</p>
    <p className="text-ink-400">{label}</p>
  </div>
);

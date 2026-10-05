import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  Activity,
  ArrowRight,
  Calendar,
  Flame,
  Medal,
  Save,
  Shirt,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData, indexTeams } from '../../hooks/useTournamentData';
import { useAuth } from '../../contexts/AuthContext';
import { LINE_LABELS, POSITION_NAMES, PLAYER_STATUS_LABELS, positionToLine, type Line } from '../../lib/constants';
import { ageFromBirthYear, cn, firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormActions, FormGrid, Input, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { useToast } from '../../components/ui/Toast';
import { PlayerAvatar, TeamBadge } from '../../components/football/Avatars';
import { ImageUploader } from '../../components/media/ImageUploader';

export const PlayerProfile = () => {
  const { playerId = '' } = useParams<{ playerId: string }>();
  const { players, teams, matches, loading } = useTournamentData();
  const teamsById = useMemo(() => indexTeams(teams), [teams]);
  const { profile } = useAuth();
  const toast = useToast();

  const player = players.find((item) => item.id === playerId);
  const team = player ? teamsById[player.teamId] : undefined;

  const canEdit =
    !!profile &&
    (['super_admin', 'tournament_manager', 'stats_manager'].includes(profile.role) ||
      (profile.role === 'team' && profile.teamId === player?.teamId));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    number: 0,
    position: 'وسط',
    line: 'MID' as Line,
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

  useEffect(() => {
    if (!player) return;
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
  }, [player]);

  const playerMatches = useMemo(
    () => matches.filter((match) => team && (match.homeTeamId === team.id || match.awayTeamId === team.id)),
    [matches, team],
  );

  if (loading) return <LoadingBlock rows={4} label="جاري تحميل بطاقة اللاعب..." />;

  if (!player) {
    return (
      <EmptyState
        title="اللاعب غير موجود"
        description="لم نتمكن من العثور على بطاقة هذا اللاعب. تأكد من صحة الرابط."
        icon={<ShieldAlert className="h-6 w-6" />}
        action={
          <Link to="/teams">
            <Button variant="glass" icon={<ArrowRight className="h-4 w-4" />}>
              العودة للفرق
            </Button>
          </Link>
        }
      />
    );
  }

  const status = PLAYER_STATUS_LABELS[player.status || 'unregistered'] || PLAYER_STATUS_LABELS.unregistered;
  const line = (player.line || positionToLine(player.position)) as Line;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'players', player.id), {
        name: form.name,
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
      });
      toast.success('تم تحديث بطاقة اللاعب بنجاح.');
      setEditing(false);
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-6">
      {/* ============ HERO ============ */}
      <section className="glass-strong noise relative overflow-hidden rounded-4xl">
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(232,193,88,0.22),transparent)]" />
        <div className="relative z-10 flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:p-10">
          <PlayerAvatar
            name={player.name}
            photo={player.photo}
            number={player.number}
            size="hero"
            className="mx-auto shadow-glass lg:mx-0"
          />

          <div className="flex-1 space-y-4 text-center lg:text-right">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <h1 className="font-heading text-3xl font-black text-white sm:text-4xl">{player.name}</h1>
              <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', status.className)}>
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {team && (
                <Link to={`/teams/${team.id}`}>
                  <Badge tone="gold" icon={<ShieldAlert className="h-3 w-3" />}>
                    {team.name}
                  </Badge>
                </Link>
              )}
              <Badge tone="neutral" icon={<Shirt className="h-3 w-3" />}>
                {player.position || LINE_LABELS[line]} · {LINE_LABELS[line]}
              </Badge>
              {player.birthYear && (
                <Badge tone="neutral" icon={<Calendar className="h-3 w-3" />}>
                  مواليد {player.birthYear} ({ageFromBirthYear(player.birthYear)})
                </Badge>
              )}
              {!!player.number && (
                <Badge tone="neutral" icon={<Trophy className="h-3 w-3" />}>
                  القميص رقم {player.number}
                </Badge>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-center lg:justify-end">
              <Button
                variant={editing ? 'ghost' : 'glass'}
                icon={editing ? <ArrowRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                onClick={() => setEditing((value) => !value)}
              >
                {editing ? 'إلغاء التعديل' : 'تعديل بيانات اللاعب'}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ============ EDIT PANEL ============ */}
      {editing && canEdit && (
        <GlassCard padding="lg" glow="gold" className="space-y-6">
          <SectionTitle title="بطاقة اللاعب — وضع التعديل" icon={<Sparkles className="h-5 w-5" />} />
          <ImageUploader
            folder="player-photos"
            shape="square"
            label="صورة اللاعب"
            value={form.photo}
            onChange={(photo) => setForm((current) => ({ ...current, photo }))}
            recommended="يفضّل صورة مربعة بخلفية واضحة (حد أقصى 640 بكسل تُضغط تلقائياً)."
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
            <Field label="الخط التكتيكي" hint="يحدد مكان اللاعب في مخطط التشكيلة.">
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
                min={1970}
                max={new Date().getFullYear()}
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
            <Field label="المباريات الملعوبة">
              <Input
                type="number"
                min={0}
                value={form.matchesPlayed}
                onChange={(event) => setForm({ ...form, matchesPlayed: Number(event.target.value) })}
              />
            </Field>
            <Field label="الأهداف">
              <Input
                type="number"
                min={0}
                value={form.goals}
                onChange={(event) => setForm({ ...form, goals: Number(event.target.value) })}
              />
            </Field>
            <Field label="صناعة الأهداف">
              <Input
                type="number"
                min={0}
                value={form.assists}
                onChange={(event) => setForm({ ...form, assists: Number(event.target.value) })}
              />
            </Field>
            <Field label="نجم المباراة (MOTM)">
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
          <FormActions>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => void handleSave()}>
              حفظ التعديلات
            </Button>
          </FormActions>
        </GlassCard>
      )}

      {/* ============ STATS ============ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="الأهداف" value={player.goals ?? 0} icon={<Target className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile label="صناعة" value={player.assists ?? 0} icon={<Sparkles className="h-[18px] w-[18px]" />} tone="sky" compact />
        <StatTile
          label="المباريات"
          value={player.matchesPlayed ?? 0}
          icon={<Activity className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
        />
        <StatTile label="نجم المباراة" value={player.motm ?? 0} icon={<Star className="h-[18px] w-[18px]" />} tone="violet" compact />
        <StatTile
          label="بطاقات صفراء"
          value={player.yellowCards ?? 0}
          icon={<Flame className="h-[18px] w-[18px]" />}
          tone="amber"
          compact
        />
        <StatTile
          label="بطاقات حمراء"
          value={player.redCards ?? 0}
          icon={<Flame className="h-[18px] w-[18px]" />}
          tone="rose"
          compact
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Contributions */}
        <GlassCard padding="lg" className="space-y-6">
          <SectionTitle title="مؤشرات الأداء" icon={<Medal className="h-5 w-5" />} />
          <div className="space-y-4">
            <MetricRow
              label="معدل التسجيل"
              value={((player.goals ?? 0) / Math.max(1, player.matchesPlayed ?? 1)).toFixed(2)}
              percentage={Math.min(100, ((player.goals ?? 0) / Math.max(1, player.matchesPlayed ?? 1)) * 100)}
              color="bg-gold-400"
            />
            <MetricRow
              label="المساهمة الهجومية (أهداف + صناعة)"
              value={`${(player.goals ?? 0) + (player.assists ?? 0)}`}
              percentage={Math.min(
                100,
                (((player.goals ?? 0) + (player.assists ?? 0)) / Math.max(1, player.matchesPlayed ?? 1)) * 100,
              )}
              color="bg-emerald-glow"
            />
            <MetricRow
              label="الانضباط (كلما قل كان أفضل)"
              value={`${player.yellowCards ?? 0} صفراء`}
              percentage={Math.min(
                100,
                ((player.yellowCards ?? 0) * 25 + (player.redCards ?? 0) * 60) /
                  Math.max(1, player.matchesPlayed ?? 1),
              )}
              color="bg-rose-glow"
            />
          </div>

          {team && (
            <div className="rounded-3xl border border-white/8 bg-white/4 p-4">
              <div className="flex items-center gap-3">
                <TeamBadge name={team.name} logo={team.logo} size="sm" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-ink-300">الفريق الحالي</p>
                  <p className="text-sm font-bold text-white">{team.name}</p>
                </div>
                <Link to={`/teams/${team.id}`}>
                  <Button size="sm" variant="glass" iconEnd={<ArrowRight className="h-3.5 w-3.5" />}>
                    ملف الفريق
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Info */}
        <GlassCard padding="lg" className="space-y-5">
          <SectionTitle title="معلومات اللاعب" icon={<User className="h-5 w-5" />} />
          <dl className="space-y-3 text-sm">
            <InfoRow label="الاسم" value={player.name} />
            <InfoRow label="الفريق" value={team?.name || '—'} />
            <InfoRow label="المركز" value={player.position || '—'} />
            <InfoRow label="الخط" value={LINE_LABELS[line]} />
            <InfoRow label="رقم القميص" value={player.number ? `#${player.number}` : '—'} />
            <InfoRow label="سنة التولد" value={player.birthYear ? `${player.birthYear}` : '—'} />
            <InfoRow label="العمر" value={ageFromBirthYear(player.birthYear)} />
            <InfoRow label="عدد مباريات الفريق" value={`${playerMatches.length}`} />
          </dl>
          {player.motm && player.motm > 0 ? (
            <div className="flex items-center gap-3 rounded-3xl border border-gold-300/25 bg-gold-400/10 p-4">
              <Star className="h-6 w-6 shrink-0 text-gold-300" fill="currentColor" />
              <p className="text-xs leading-relaxed text-gold-100">
                حصل هذا اللاعب على جائزة <strong>نجم المباراة</strong> {player.motm} مرة هذا الموسم.
              </p>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0">
    <dt className="text-xs font-bold text-ink-400">{label}</dt>
    <dd className="text-sm font-bold text-white">{value}</dd>
  </div>
);

const MetricRow = ({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs font-bold text-ink-200">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={cn('h-full rounded-full transition-all duration-700', color)}
        style={{ width: `${Math.max(2, Math.min(100, percentage))}%` }}
      />
    </div>
  </div>
);

import { useMemo, useState } from 'react';
import { Calculator, Edit3, RefreshCw, Save, Trophy } from 'lucide-react';
import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTournamentData } from '../../hooks/useTournamentData';
import { buildStandings, computeTeamAggregates } from '../../lib/stats';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { Field, FormGrid, Input } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { Modal } from '../../components/ui/Modal';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StandingsTable } from '../../components/football/StandingsTable';
import { TeamBadge } from '../../components/football/Avatars';
import { useToast } from '../../components/ui/Toast';

interface EditState {
  teamId: string;
  name: string;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export const AdminStandings = () => {
  const { teams, matches, refresh } = useTournamentData();
  const toast = useToast();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const computed = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const finishedMatches = matches.filter((m) => m.status === 'finished').length;

  const handleRecompute = async () => {
    const patches = computeTeamAggregates(teams, matches);
    if (!patches.length) return;
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
      toast.success('تم تحديث إحصائيات الفرق من نتائج المباريات.');
      refresh();
    } catch (error) {
      toast.error(`${firebaseErrorMessage(error)} — قد تحتاج صلاحية «مدير البطولة».`);
    } finally {
      setRecomputing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const played = editing.won + editing.drew + editing.lost;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'teams', editing.teamId), {
        played,
        won: editing.won,
        drew: editing.drew,
        lost: editing.lost,
        goalsFor: editing.goalsFor,
        goalsAgainst: editing.goalsAgainst,
        points: editing.points,
        updatedAt: serverTimestamp(),
      });
      toast.success('تم تحديث إحصائيات الفريق.');
      setEditing(null);
      refresh();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">جدول الترتيب</h1>
          <p className="text-sm text-ink-300">
            الجدول يُحتسب آلياً من نتائج المباريات المعتمدة ({finishedMatches} مباراة منتهية). يمكنك أيضاً تعديل الإحصائيات
            المخزنة يدوياً.
          </p>
        </div>
        <Button
          icon={<Calculator className="h-4 w-4" />}
          loading={recomputing}
          onClick={() => void handleRecompute()}
        >
          إعادة الاحتساب من النتائج
        </Button>
      </div>

      <GlassCard padding="lg" className="space-y-5">
        <SectionTitle
          title="الترتيب الحالي"
          icon={<Trophy className="h-5 w-5" />}
          subtitle="النقاط ثم فارق الأهداف ثم الأهداف المسجلة."
          action={
            <Badge tone={computed[0]?.computed ? 'emerald' : 'amber'} size="sm">
              {computed[0]?.computed ? 'محسوب من النتائج' : 'من الإحصائيات المخزنة'}
            </Badge>
          }
        />
        {computed.length ? (
          <StandingsTable rows={computed} linkTeams={false} />
        ) : (
          <EmptyState title="لا توجد فرق" icon={<Trophy className="h-6 w-6" />} />
        )}
      </GlassCard>

      <div className="space-y-4">
        <SectionTitle
          title="تعديل الإحصائيات المخزنة"
          icon={<Edit3 className="h-5 w-5" />}
          subtitle="مفيد عند احتساب نتائج الاحتكام أو العقوبات الإدارية."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {computed.map((row) => (
            <GlassCard key={row.teamId} padding="md" hover className="space-y-4">
              <div className="flex items-center gap-3">
                <TeamBadge name={row.name} logo={row.logo} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{row.name}</p>
                  <p className="text-[11px] text-ink-300">
                    {row.played} مباراة · {row.points} نقطة
                  </p>
                </div>
                <Badge tone="gold" size="sm">
                  #{row.rank}
                </Badge>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                {[
                  { label: 'فاز', value: row.won },
                  { label: 'تعادل', value: row.drew },
                  { label: 'خسر', value: row.lost },
                  { label: 'له', value: row.goalsFor },
                  { label: 'عليه', value: row.goalsAgainst },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/8 bg-white/4 py-1.5">
                    <p className="font-heading text-sm font-black text-white">{item.value}</p>
                    <p className="text-ink-400">{item.label}</p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="glass"
                block
                icon={<Edit3 className="h-3.5 w-3.5" />}
                onClick={() =>
                  setEditing({
                    teamId: row.teamId,
                    name: row.name,
                    played: row.played,
                    won: row.won,
                    drew: row.drew,
                    lost: row.lost,
                    goalsFor: row.goalsFor,
                    goalsAgainst: row.goalsAgainst,
                    points: row.points,
                  })
                }
              >
                تعديل الإحصائيات
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard variant="soft" padding="md" className="flex flex-wrap items-center gap-3 text-xs text-ink-300">
        <RefreshCw className="h-4 w-4 text-gold-300" />
        ملاحظة: زر «إعادة الاحتساب» يستبدل الإحصائيات المخزنة بنتيجة احتساب نتائج المباريات المنتهية.
      </GlassCard>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `إحصائيات ${editing.name}` : ''}
        subtitle="أدخل الأرقام يدوياً — يتم احتساب عدد المباريات تلقائياً (فاز + تعادل + خسر)."
        icon={<Edit3 className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              إلغاء
            </Button>
            <Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => void handleSaveEdit()}>
              حفظ
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-5">
            <FormGrid>
              <Field label="عدد الفوز">
                <Input
                  type="number"
                  min={0}
                  value={editing.won}
                  onChange={(event) => {
                    const won = Number(event.target.value) || 0;
                    setEditing({ ...editing, won, points: won * 3 + editing.drew });
                  }}
                />
              </Field>
              <Field label="عدد التعادل">
                <Input
                  type="number"
                  min={0}
                  value={editing.drew}
                  onChange={(event) => {
                    const drew = Number(event.target.value) || 0;
                    setEditing({ ...editing, drew, points: editing.won * 3 + drew });
                  }}
                />
              </Field>
              <Field label="عدد الخسارة">
                <Input
                  type="number"
                  min={0}
                  value={editing.lost}
                  onChange={(event) => setEditing({ ...editing, lost: Number(event.target.value) || 0 })}
                />
              </Field>
              <Field label="الأهداف المسجّلة">
                <Input
                  type="number"
                  min={0}
                  value={editing.goalsFor}
                  onChange={(event) => setEditing({ ...editing, goalsFor: Number(event.target.value) || 0 })}
                />
              </Field>
              <Field label="الأهداف المستقبلة">
                <Input
                  type="number"
                  min={0}
                  value={editing.goalsAgainst}
                  onChange={(event) => setEditing({ ...editing, goalsAgainst: Number(event.target.value) || 0 })}
                />
              </Field>
              <Field label="النقاط" hint="تُحتسب تلقائياً (3 لكل فوز + 1 لكل تعادل) ويمكن تعديلها يدوياً.">
                <Input
                  type="number"
                  min={0}
                  value={editing.points}
                  onChange={(event) => setEditing({ ...editing, points: Number(event.target.value) || 0 })}
                />
              </Field>
            </FormGrid>
          </div>
        )}
      </Modal>
    </div>
  );
};

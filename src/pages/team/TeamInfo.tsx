import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Info, Save, Shield, Shirt, Sparkles } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTournamentData } from '../../hooks/useTournamentData';
import { buildStandings } from '../../lib/stats';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { Field, FormGrid, Input } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { useToast } from '../../components/ui/Toast';
import { TeamBadge } from '../../components/football/Avatars';
import { ImageUploader } from '../../components/media/ImageUploader';

export const TeamInfo = () => {
  const { profile } = useAuth();
  const { teams, matches, loading, refresh } = useTournamentData();
  const toast = useToast();

  const teamId = profile?.teamId || '';
  const team = teams.find((item) => item.id === teamId);

  const [form, setForm] = useState({ logo: '', coach: '', captain: '', establishedYear: new Date().getFullYear() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!team) return;
    setForm({
      logo: team.logo || '',
      coach: team.coach || '',
      captain: team.captain || '',
      establishedYear: team.establishedYear || new Date().getFullYear(),
    });
  }, [team]);

  const row = useMemo(() => buildStandings(teams, matches).find((item) => item.teamId === teamId), [teams, matches, teamId]);

  if (loading) return <LoadingBlock rows={4} label="جاري تحميل بيانات الفريق..." />;

  if (!teamId || !team) {
    return (
      <EmptyState
        title="حسابك غير مرتبط بفريق"
        description="بعد ربط حسابك سيتمكن فريقك من تحديث الشعار وبيانات المدرب والكابتن هنا."
        icon={<Shield className="h-6 w-6" />}
      />
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        logo: form.logo,
        coach: form.coach.trim(),
        captain: form.captain.trim(),
        establishedYear: Number(form.establishedYear) || new Date().getFullYear(),
        updatedAt: serverTimestamp(),
      });
      toast.success('تم تحديث بيانات الفريق وشعاره.');
      refresh();
    } catch (error) {
      toast.error(`${firebaseErrorMessage(error)} — تأكد من رفع شعار بحجم مناسب.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-black text-white">شعار ومعلومات الفريق</h1>
        <p className="text-sm text-ink-300">
          ارفع شعار فريقك بجودة عالية، وحدّث اسم المدرب والكابتن وسنة التأسيس. تظهر التعديلات فوراً في كل صفحات الموقع.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard padding="lg" className="space-y-7">
          <SectionTitle
            title="الهوية البصرية"
            icon={<Shirt className="h-5 w-5" />}
            subtitle="الشعار يُستخدم في جدول الترتيب، بطاقات المباريات، وصفحة الفريق العامة."
          />

          <ImageUploader
            folder="team-logos"
            shape="wide"
            label="شعار الفريق"
            value={form.logo}
            onChange={(logo) => setForm((current) => ({ ...current, logo }))}
            maxSize={720}
            recommended="يفضّل PNG بخلفية شفافة وبمقاس مربّع، وسيتم ضغط الصورة تلقائياً."
          />

          <div className="hairline" />

          <FormGrid>
            <Field label="اسم الفريق" hint="لتغيير اسم الفريق تواصل مع إدارة البطولة.">
              <Input value={team.name} disabled />
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
          </FormGrid>

          <div className="flex justify-end">
            <Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={() => void handleSave()}>
              حفظ بيانات الفريق
            </Button>
          </div>
        </GlassCard>

        <div className="space-y-5">
          <SectionTitle title="معاينة مباشرة" icon={<Sparkles className="h-5 w-5" />} />
          <GlassCard variant="gold" glow="gold" padding="lg" className="space-y-5 text-center">
            <TeamBadge name={team.name} logo={form.logo} size="hero" className="mx-auto" />
            <div className="space-y-2">
              <h3 className="font-heading text-xl font-black text-white">{team.name}</h3>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge tone="neutral" size="sm">
                  المدرب: {form.coach || 'غير محدد'}
                </Badge>
                <Badge tone="neutral" size="sm">
                  الكابتن: {form.captain || 'غير محدد'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge tone="gold" size="sm">
                  {row?.points ?? 0} نقطة
                </Badge>
                <Badge tone="emerald" size="sm">
                  المركز {row?.rank ?? '—'}
                </Badge>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="soft" padding="md" className="flex items-start gap-3 text-[11px] leading-relaxed text-ink-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
            <div className="space-y-1">
              <p className="font-bold text-white">لماذا لا نستطيع تغيير اسم الفريق؟</p>
              <p>
                اسم الفريق وحذفه من صلاحيات مدير البطولة فقط للحفاظ على سلامة السجلات والنتائج. كل ما عدا ذلك متاح لك
                مباشرة.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

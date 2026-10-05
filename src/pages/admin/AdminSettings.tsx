import { useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { CheckCircle2, Copy, Database, Download, HardDrive, Info, RefreshCw, Server, Settings } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { db } from '../../firebase';
import { useTournamentData } from '../../hooks/useTournamentData';
import { computeTeamAggregates } from '../../lib/stats';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { useToast } from '../../components/ui/Toast';

const STORAGE_RULES_SNIPPET = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{folder}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}`;

export const AdminSettings = () => {
  const { profile } = useAuth();
  const { teams, players, matches, announcements, referees, decisions, objections, refresh } = useTournamentData();
  const toast = useToast();
  const [recomputing, setRecomputing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const patches = computeTeamAggregates(teams, matches);
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
      toast.error(`${firebaseErrorMessage(error)} — تتطلب هذه العملية صلاحية «مدير البطولة».`);
    } finally {
      setRecomputing(false);
    }
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      counts: {
        teams: teams.length,
        players: players.length,
        matches: matches.length,
        announcements: announcements.length,
        referees: referees.length,
        decisions: decisions.length,
        objections: objections.length,
      },
      teams,
      players,
      matches,
      announcements,
      referees,
      decisions,
      objections,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dore1-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير نسخة احتياطية من بيانات البطولة.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(STORAGE_RULES_SNIPPET);
      setCopied(true);
      toast.success('تم نسخ قواعد التخزين.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('تعذّر النسخ تلقائياً، يمكنك تحديد النص يدوياً.');
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-black text-white">إعدادات النظام</h1>
        <p className="text-sm text-ink-300">
          حالة الاتصال بقاعدة البيانات والتخزين، إجراءات الصيانة، وتصدير نسخة احتياطية من كل بيانات البطولة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="الفرق" value={teams.length} icon={<Database className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile label="اللاعبون" value={players.length} icon={<Database className="h-[18px] w-[18px]" />} tone="sky" compact />
        <StatTile label="المباريات" value={matches.length} icon={<Database className="h-[18px] w-[18px]" />} tone="emerald" compact />
        <StatTile
          label="سجلات أخرى"
          value={announcements.length + referees.length + decisions.length + objections.length}
          icon={<Database className="h-[18px] w-[18px]" />}
          tone="violet"
          compact
          hint="تبليغات + حكام + قرارات + اعتراضات"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard padding="lg" className="space-y-5">
          <SectionTitle title="حالة الاتصال" icon={<Server className="h-5 w-5" />} />
          <div className="space-y-3 text-sm">
            <StatusRow label="مشروع Firebase" value={firebaseConfig.projectId} ok />
            <StatusRow label="قاعدة بيانات Firestore" value={firebaseConfig.firestoreDatabaseId} ok />
            <StatusRow label="مساحة تخزين الصور" value={firebaseConfig.storageBucket} ok />
            <StatusRow label="الحساب الحالي" value={profile?.email || '—'} ok />
            <StatusRow label="الدور الحالي" value={ROLE_LABELS[profile?.role || ''] || '—'} ok />
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-[11px] leading-relaxed text-ink-300">
            يتم رفع صور اللاعبين والشعارات عبر Firebase Storage داخل المجلد <code className="text-gold-200">uploads/</code>{' '}
            بعد ضغط الصورة في المتصفح. إذا ظهر خطأ صلاحيات، انسخ قواعد التخزين الجاهزة في الأسفل والصقها في Firebase Storage
            Rules.
          </div>
        </GlassCard>

        <GlassCard padding="lg" className="space-y-5">
          <SectionTitle title="إجراءات الصيانة" icon={<Settings className="h-5 w-5" />} />
          <div className="space-y-3">
            <Button
              variant="glass"
              block
              icon={<RefreshCw className="h-4 w-4" />}
              loading={recomputing}
              onClick={() => void handleRecompute()}
            >
              إعادة احتساب جدول الترتيب من النتائج
            </Button>
            <Button variant="glass" block icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              تصدير نسخة احتياطية (JSON)
            </Button>
          </div>
          <div className="rounded-2xl border border-amber-glow/20 bg-amber-glow/8 p-4 text-[11px] leading-relaxed text-amber-glow">
            <Info className="mb-1 h-3.5 w-3.5" />
            إعادة الاحتساب تستبدل الإحصائيات المخزنة للفرق بنتيجة احتساب المباريات المنتهية، وتتطلب صلاحية «مدير البطولة».
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="lg" className="space-y-5">
        <SectionTitle
          title="قواعد تخزين الصور (Storage Rules)"
          icon={<HardDrive className="h-5 w-5" />}
          subtitle="الصق هذه القواعد في Firebase Console ← Storage ← Rules لتمكين رفع الشعارات وصور اللاعبين من لوحة التحكم ولوحة الفريق."
          action={
            <Button
              size="sm"
              variant={copied ? 'success' : 'glass'}
              icon={copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              onClick={() => void handleCopy()}
            >
              {copied ? 'تم النسخ' : 'نسخ القواعد'}
            </Button>
          }
        />
        <pre
          dir="ltr"
          className="overflow-x-auto rounded-2xl border border-white/8 bg-ink-950/70 p-4 text-left text-[11px] leading-relaxed text-ink-100"
        >
          {STORAGE_RULES_SNIPPET}
        </pre>
        <div className="flex flex-wrap gap-2">
          <Badge tone="sky" size="sm">
            الحد الأقصى 5 ميغابايت للصورة
          </Badge>
          <Badge tone="emerald" size="sm">
            القراءة عامة للجميع
          </Badge>
          <Badge tone="gold" size="sm">
            الكتابة للحسابات المسجلة فقط
          </Badge>
        </div>
      </GlassCard>

      <GlassCard variant="soft" padding="lg" className="space-y-3">
        <SectionTitle title="ملاحظات مهمة على الصلاحيات" icon={<Info className="h-5 w-5" />} />
        <ul className="list-inside list-disc space-y-2 text-xs leading-relaxed text-ink-200">
          <li>«مدير عام»: كل الصلاحيات بما فيها إدارة المستخدمين والأدوار.</li>
          <li>«مدير البطولة»: الفرق، اللاعبون، المباريات، الترتيب، الحكام، والتبليغات.</li>
          <li>«مدير الإحصاء»: إدخال النتائج وتحديث إحصائيات اللاعبين.</li>
          <li>«لجنة الانضباط»: القرارات الانضباطية والاعتراضات والغرامات.</li>
          <li>«مدير الإعلام»: التبليغات والأخبار.</li>
          <li>«حساب فريق»: كشوف لاعبيه، صورهم، شعار الفريق، والاعتراضات — دون الوصول لباقي اللوحة.</li>
        </ul>
      </GlassCard>
    </div>
  );
};

const StatusRow = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0">
    <span className="text-xs font-bold text-ink-400">{label}</span>
    <span className="flex items-center gap-2 text-xs font-bold text-white">
      {ok && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-glow" />}
      <span className="max-w-[16rem] truncate" dir="ltr">
        {value}
      </span>
    </span>
  </div>
);

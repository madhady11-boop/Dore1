import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { Mail, Save, Search, Shield, UserCog, Users } from 'lucide-react';
import { db } from '../../firebase';
import { useTournamentData } from '../../hooks/useTournamentData';
import { ADMIN_ROLES, ROLE_LABELS } from '../../lib/constants';
import { firebaseErrorMessage } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { SearchInput, Select } from '../../components/ui/Form';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { useToast } from '../../components/ui/Toast';

interface UserRecord {
  id: string;
  email?: string;
  role?: string;
  teamId?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

export const AdminUsers = () => {
  const { teams } = useTournamentData();
  const toast = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { role: string; teamId: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UserRecord));
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim();
    return users.filter((user) =>
      term ? (user.email || '').includes(term) || (user.displayName || '').includes(term) : true,
    );
  }, [users, search]);

  const counts = useMemo(() => {
    const admins = users.filter((user) => ADMIN_ROLES.includes((user.role || '') as never)).length;
    const teamAccounts = users.filter((user) => user.role === 'team').length;
    const linked = users.filter((user) => user.role === 'team' && user.teamId).length;
    return { admins, teamAccounts, linked, total: users.length };
  }, [users]);

  const handleSave = async (user: UserRecord) => {
    const draft = drafts[user.id];
    if (!draft) return;
    setSavingId(user.id);
    try {
      // Preserve createdAt (rules require it to stay untouched) and bump updatedAt.
      await updateDoc(doc(db, 'users', user.id), {
        role: draft.role,
        teamId: draft.role === 'team' ? draft.teamId : '',
        updatedAt: serverTimestamp(),
      });
      toast.success('تم تحديث صلاحيات المستخدم.');
      setDrafts((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      void load();
    } catch (error) {
      toast.error(`${firebaseErrorMessage(error)} — تأكد من تسجيل الدخول بحساب المدير العام.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-black text-white">المستخدمون والصلاحيات</h1>
        <p className="text-sm text-ink-300">
          اربط حسابات الفرق بفِرَقها وعيّن أدوار اللجان. كل حساب يرى فقط الأدوات المسموح له بها.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="إجمالي الحسابات" value={counts.total} icon={<Users className="h-[18px] w-[18px]" />} tone="gold" compact />
        <StatTile label="حسابات إدارية" value={counts.admins} icon={<Shield className="h-[18px] w-[18px]" />} tone="violet" compact />
        <StatTile label="حسابات فرق" value={counts.teamAccounts} icon={<UserCog className="h-[18px] w-[18px]" />} tone="sky" compact />
        <StatTile
          label="فرق مرتبطة"
          value={counts.linked}
          icon={<Mail className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
          hint="حسابات فريق مرتبطة بفريق فعلي"
        />
      </div>

      <GlassCard variant="soft" padding="md" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchInput
          placeholder="ابحث بالبريد أو الاسم..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:w-80"
        />
        <Badge tone="gold" size="sm">
          {filtered.length} حساب
        </Badge>
      </GlassCard>

      {loading ? (
        <LoadingBlock rows={4} label="جاري تحميل الحسابات..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد حسابات" icon={<Users className="h-6 w-6" />} />
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const draft = drafts[user.id] || { role: user.role || 'team', teamId: user.teamId || '' };
            const dirty = draft.role !== (user.role || 'team') || draft.teamId !== (user.teamId || '');
            return (
              <GlassCard key={user.id} padding="md" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-300/25 bg-gold-400/12 text-sm font-black text-gold-100">
                      {(user.displayName || user.email || '؟').slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{user.displayName || 'بدون اسم'}</p>
                      <p className="truncate text-[11px] text-ink-400" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Badge tone={user.teamId ? 'emerald' : 'neutral'} size="sm">
                    {user.teamId ? teams.find((team) => team.id === user.teamId)?.name || 'فريق مرتبط' : 'غير مرتبط بفريق'}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-ink-300">الدور</span>
                    <Select
                      value={draft.role}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: { role: event.target.value, teamId: draft.teamId },
                        }))
                      }
                      className="py-2 text-xs"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-ink-300">الفريق (لحسابات الفرق)</span>
                    <Select
                      value={draft.teamId}
                      disabled={draft.role !== 'team'}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: { role: draft.role, teamId: event.target.value },
                        }))
                      }
                      className="py-2 text-xs"
                    >
                      <option value="">بدون فريق</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <Button
                    size="sm"
                    icon={<Save className="h-3.5 w-3.5" />}
                    disabled={!dirty}
                    loading={savingId === user.id}
                    onClick={() => void handleSave(user)}
                  >
                    حفظ
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <SectionTitle
        title="كيف يعمل ربط الحسابات؟"
        subtitle="أي مستخدم يسجّل الدخول لأول مرة يُنشأ له حساب بدور «فريق» بدون فريق مرتبط. عند ربطه بفريق يستطيع إدارة اللاعبين ورفع الشعارات والصور وترتيب التشكيلة."
        icon={<Search className="h-4 w-4" />}
      />
    </div>
  );
};

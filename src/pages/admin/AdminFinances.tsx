import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Gavel, ReceiptText, TrendingUp, Wallet } from 'lucide-react';
import { useTournamentData } from '../../hooks/useTournamentData';
import { formatDate, formatNumber } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatTile } from '../../components/ui/StatTile';
import { TeamBadge } from '../../components/football/Avatars';

export const AdminFinances = () => {
  const { decisions, teams } = useTournamentData();

  const fines = useMemo(() => decisions.filter((decision) => (decision.amount ?? 0) > 0), [decisions]);

  const total = useMemo(() => fines.reduce((sum, decision) => sum + (decision.amount ?? 0), 0), [fines]);
  const published = useMemo(() => fines.filter((item) => item.status !== 'draft'), [fines]);
  const publishedTotal = useMemo(
    () => published.reduce((sum, decision) => sum + (decision.amount ?? 0), 0),
    [published],
  );

  const byTeam = useMemo(() => {
    const map = new Map<string, number>();
    fines.forEach((decision) => {
      const key =
        decision.targetType === 'team'
          ? decision.targetId || decision.targetName || 'غير محدد'
          : decision.targetName || 'أخرى';
      map.set(key, (map.get(key) || 0) + (decision.amount ?? 0));
    });
    return Array.from(map.entries())
      .map(([key, amount]) => ({
        key,
        amount,
        team: teams.find((team) => team.id === key) || teams.find((team) => team.name === key),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [fines, teams]);

  const maxAmount = Math.max(1, ...byTeam.map((row) => row.amount));

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-white">المالية والغرامات</h1>
          <p className="text-sm text-ink-300">
            سجل مالي مبني على القرارات الانضباطية الصادرة من اللجنة — يُحدَّث تلقائياً عند إضافة أي غرامة.
          </p>
        </div>
        <Link to="/admin/disciplinary">
          <Button variant="glass" icon={<Gavel className="h-4 w-4" />} iconEnd={<ArrowUpRight className="h-3.5 w-3.5" />}>
            إدارة القرارات
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="إجمالي الغرامات"
          value={formatNumber(total)}
          suffix="د.ع"
          icon={<Wallet className="h-[18px] w-[18px]" />}
          tone="gold"
          compact
        />
        <StatTile
          label="غرامات منشورة"
          value={formatNumber(publishedTotal)}
          suffix="د.ع"
          icon={<ReceiptText className="h-[18px] w-[18px]" />}
          tone="emerald"
          compact
          hint={`${published.length} قرار منشور`}
        />
        <StatTile
          label="عدد الغرامات"
          value={fines.length}
          icon={<Gavel className="h-[18px] w-[18px]" />}
          tone="sky"
          compact
        />
        <StatTile
          label="متوسط الغرامة"
          value={formatNumber(fines.length ? Math.round(total / fines.length) : 0)}
          suffix="د.ع"
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tone="violet"
          compact
        />
      </div>

      <GlassCard padding="lg" className="space-y-5">
        <SectionTitle title="الغرامات حسب الفريق / الجهة" icon={<TrendingUp className="h-5 w-5" />} />
        {byTeam.length === 0 ? (
          <EmptyState title="لا توجد غرامات مسجّلة" icon={<Wallet className="h-6 w-6" />} />
        ) : (
          <div className="space-y-4">
            {byTeam.map((row) => (
              <div key={row.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3 text-sm font-bold text-white">
                    {row.team ? <TeamBadge name={row.team.name} logo={row.team.logo} size="xs" /> : null}
                    {row.team?.name || row.key}
                  </span>
                  <span className="font-heading text-sm font-black text-gold-200 tabular-nums">
                    {formatNumber(row.amount)} د.ع
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#b8912b,#e8c158)]"
                    style={{ width: `${(row.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="lg" className="space-y-5">
        <SectionTitle title="سجل الغرامات التفصيلي" icon={<ReceiptText className="h-5 w-5" />} />
        {fines.length === 0 ? (
          <EmptyState title="لا توجد بيانات" icon={<ReceiptText className="h-6 w-6" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-300">
                  <th className="px-3 py-2 text-right">القرار</th>
                  <th className="px-3 py-2 text-right">الجهة</th>
                  <th className="px-3 py-2 text-right">نوع العقوبة</th>
                  <th className="px-3 py-2 text-center">التاريخ</th>
                  <th className="px-3 py-2 text-center">الحالة</th>
                  <th className="px-3 py-2 text-center">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {[...fines]
                  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
                  .map((decision) => (
                    <tr key={decision.id} className="glass-soft">
                      <td className="rounded-r-2xl px-3 py-3 font-bold text-white">#{decision.number || '—'}</td>
                      <td className="px-3 py-3 text-ink-100">{decision.targetName || '—'}</td>
                      <td className="px-3 py-3 text-ink-200">{decision.penaltyType || 'غرامة'}</td>
                      <td className="px-3 py-3 text-center text-ink-300">{formatDate(decision.date)}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge tone={decision.status === 'draft' ? 'amber' : 'emerald'} size="sm">
                          {decision.status === 'draft' ? 'مسودة' : 'منشور'}
                        </Badge>
                      </td>
                      <td className="rounded-l-2xl px-3 py-3 text-center font-heading font-black text-gold-100 tabular-nums">
                        {formatNumber(decision.amount)} د.ع
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard variant="soft" padding="md" className="text-xs leading-relaxed text-ink-300">
        ملاحظة: هذا السجل للعرض والمتابعة الإدارية، ويُحدَّث من صفحة «العقوبات والاعتراضات». لتغيير قيمة أي غرامة، افتح
        القرار وعدّل حقل «قيمة الغرامة».
      </GlassCard>
    </div>
  );
};

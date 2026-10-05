import { useMemo, useState } from 'react';
import { Bell, CalendarDays, FileText, Megaphone, Search, UserCheck } from 'lucide-react';
import { useTournamentData } from '../../hooks/useTournamentData';
import { formatDate, timeAgo } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { GlassCard } from '../../components/ui/GlassCard';
import { SearchInput } from '../../components/ui/Form';

export const Announcements = () => {
  const { announcements, loading } = useTournamentData();
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    const term = search.trim();
    return [...announcements]
      .filter((item) => (term ? item.title?.includes(term) || item.content?.includes(term) || item.issuer?.includes(term) : true))
      .sort((a, b) => {
        const dateA = String(a.date || '') + String(a.id);
        const dateB = String(b.date || '') + String(b.id);
        return dateB.localeCompare(dateA);
      });
  }, [announcements, search]);

  return (
    <div className="space-y-8 pb-6">
      <section className="glass-strong noise relative overflow-hidden rounded-4xl p-6 text-center sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,rgba(232,193,88,0.28),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-gold-300/30 bg-gold-400/12">
            <Megaphone className="h-8 w-8 text-gold-200" />
          </span>
          <h1 className="font-heading text-3xl font-black text-white sm:text-5xl">
            التبليغات <span className="text-gradient-gold">الرسمية</span>
          </h1>
          <p className="text-sm leading-relaxed text-ink-200 sm:text-base">
            كل القرارات والتبليغات الصادرة عن اللجنة المنظمة ولجنة الانضباط واللجان الفرعية في دوري صوب الشامية — منشورة
            رسمياً وبترتيب زمني.
          </p>
          <SearchInput
            placeholder="ابحث في التبليغات..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mx-auto w-full max-w-lg"
          />
        </div>
      </section>

      {loading ? (
        <LoadingBlock rows={5} label="جاري تحميل التبليغات..." />
      ) : list.length === 0 ? (
        <EmptyState
          title="لا توجد تبليغات"
          description={search ? 'لم يتم العثور على تبليغ مطابق لبحثك.' : 'لم يتم نشر أي تبليغات رسمية حتى الآن.'}
          icon={<Megaphone className="h-6 w-6" />}
        />
      ) : (
        <div className="mx-auto max-w-4xl space-y-5">
          {list.map((item) => (
            <GlassCard key={item.id} hover padding="lg" className="relative">
              <span className="absolute inset-y-6 right-0 w-1 rounded-full bg-[linear-gradient(180deg,#f4e0a1,#d4af37)]" />
              <div className="space-y-4 ps-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">{item.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <Badge tone="gold" size="sm" icon={<UserCheck className="h-3 w-3" />}>
                        {item.issuer || 'اللجنة المنظمة'}
                      </Badge>
                      <Badge tone="neutral" size="sm" icon={<CalendarDays className="h-3 w-3" />}>
                        {formatDate(item.date) !== '—' ? formatDate(item.date) : timeAgo(item.createdAt)}
                      </Badge>
                      {item.status === 'draft' && (
                        <Badge tone="amber" size="sm" icon={<FileText className="h-3 w-3" />}>
                          مسودة
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Bell className="h-5 w-5 shrink-0 text-gold-300/70" />
                </div>

                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full rounded-2xl border border-white/10 object-cover"
                    loading="lazy"
                  />
                )}

                <p className="whitespace-pre-line text-sm leading-loose text-ink-100">{item.content}</p>
              </div>
            </GlassCard>
          ))}

          <div className="glass-soft flex flex-wrap items-center justify-center gap-3 rounded-3xl px-5 py-4 text-xs text-ink-300">
            <Search className="h-4 w-4 text-gold-300" />
            عدد التبليغات المنشورة: {list.length}
          </div>
        </div>
      )}
    </div>
  );
};

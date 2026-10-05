import { Link } from 'react-router-dom';
import { Compass, Home as HomeIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export const NotFound = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <GlassCard variant="strong" padding="lg" glow="gold" className="max-w-xl text-center">
      <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-gold-300/30 bg-gold-400/12">
        <Compass className="h-10 w-10 text-gold-200" />
      </span>
      <p className="font-heading text-5xl font-black text-gradient-gold">404</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-white">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">
        يبدو أن الرابط الذي تبحث عنه غير صحيح أو تم نقل الصفحة. يمكنك العودة إلى الصفحة الرئيسية ومتابعة آخر أخبار الدوري.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button icon={<HomeIcon className="h-4 w-4" />}>الصفحة الرئيسية</Button>
        </Link>
        <Link to="/matches">
          <Button variant="glass">جدول المباريات</Button>
        </Link>
      </div>
    </GlassCard>
  </div>
);

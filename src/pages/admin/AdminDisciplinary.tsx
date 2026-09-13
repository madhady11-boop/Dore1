import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldAlert, Plus, Search, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';

interface Decision {
  id: string;
  number: string;
  date: string;
  targetType: 'player' | 'coach' | 'team' | 'fans';
  targetId: string;
  reason: string;
  penaltyType: string;
  amount?: number;
  matchId?: string;
  status: 'published' | 'draft';
  createdAt: number;
}

export const AdminDisciplinary = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDecision, setNewDecision] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    targetType: 'team' as 'player' | 'coach' | 'team' | 'fans',
    targetId: 'temp_team_id', // Would be selected from a list in a real app
    reason: '',
    penaltyType: '',
    amount: 0,
    status: 'draft' as 'published' | 'draft'
  });

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'disciplinaryDecisions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetched: Decision[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Decision);
      });
      setDecisions(fetched);
    } catch (error) {
      console.error("Error fetching decisions: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'disciplinaryDecisions'), {
        ...newDecision,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewDecision({
        number: '',
        date: new Date().toISOString().split('T')[0],
        targetType: 'team',
        targetId: 'temp_team_id',
        reason: '',
        penaltyType: '',
        amount: 0,
        status: 'draft'
      });
      fetchDecisions();
    } catch (error) {
      console.error("Error adding decision: ", error);
    }
  };

  const targetTypeLabels = {
    player: 'لاعب',
    coach: 'مدرب',
    team: 'فريق',
    fans: 'جمهور'
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">العقوبات والانضباط</h1>
          <p className="text-zinc-400">إدارة قرارات اللجنة المنظمة واللجنة الانضباطية.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-accent-red text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-accent-red/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إصدار قرار جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 border-t-4 border-t-accent-red">
          <h2 className="text-xl font-bold text-white mb-6">تفاصيل القرار الانضباطي</h2>
          <form onSubmit={handleAddDecision} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رقم القرار</label>
              <input 
                required
                type="text" 
                value={newDecision.number}
                onChange={(e) => setNewDecision({...newDecision, number: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors"
                placeholder="مثال: 014"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">تاريخ القرار</label>
              <input 
                required
                type="date" 
                value={newDecision.date}
                onChange={(e) => setNewDecision({...newDecision, date: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الجهة المعاقبة</label>
              <select 
                value={newDecision.targetType}
                onChange={(e) => setNewDecision({...newDecision, targetType: e.target.value as any})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors"
              >
                <option value="team">فريق</option>
                <option value="player">لاعب</option>
                <option value="coach">مدرب</option>
                <option value="fans">جمهور</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">نوع العقوبة</label>
              <select 
                value={newDecision.penaltyType}
                onChange={(e) => setNewDecision({...newDecision, penaltyType: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors"
                required
              >
                <option value="">اختر نوع العقوبة...</option>
                <option value="غرامة مالية">غرامة مالية</option>
                <option value="إيقاف إداري">إيقاف إداري</option>
                <option value="حرمان من اللعب">حرمان من اللعب</option>
                <option value="لعب بدون جمهور">لعب بدون جمهور</option>
                <option value="خسارة اعتبارية">خسارة اعتبارية (3-0)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400">سبب العقوبة</label>
              <textarea 
                required
                rows={3}
                value={newDecision.reason}
                onChange={(e) => setNewDecision({...newDecision, reason: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors resize-none"
                placeholder="تفاصيل واسباب اتخاذ القرار..."
              />
            </div>

            {newDecision.penaltyType === 'غرامة مالية' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">مبلغ الغرامة (د.ع)</label>
                <input 
                  type="number"
                  min="0"
                  value={newDecision.amount}
                  onChange={(e) => setNewDecision({...newDecision, amount: parseInt(e.target.value)})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-red-600 transition-colors font-bold"
              >
                حفظ كمسودة
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div key={decision.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0 border border-accent-red/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      قرار انضباطي رقم ({decision.number})
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-md font-medium",
                        decision.status === 'published' ? "bg-accent-green/20 text-accent-green" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {decision.status === 'published' ? 'منشور' : 'مسودة'}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                      <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {decision.date}</span>
                      <span>الجهة: {targetTypeLabels[decision.targetType]}</span>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-sm font-bold text-white">
                    {decision.penaltyType}
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-950/50 rounded-xl text-zinc-300 text-sm leading-relaxed border border-zinc-800/50">
                  <span className="text-zinc-500 font-bold ml-1">السبب:</span>
                  {decision.reason}
                </div>
                
                {decision.amount && decision.amount > 0 && (
                  <div className="text-sm font-bold text-emerald-500">
                    قيمة الغرامة: {decision.amount.toLocaleString()} د.ع
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {decisions.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              لا توجد قرارات انضباطية.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

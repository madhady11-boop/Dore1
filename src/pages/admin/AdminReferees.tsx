import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Shield, UserSquare2 } from 'lucide-react';

interface Referee {
  id: string;
  name: string;
  phone: string;
  level: string;
  matchesCount: number;
}

export const AdminReferees = () => {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReferee, setNewReferee] = useState({
    name: '',
    phone: '',
    level: 'درجة أولى',
  });

  useEffect(() => {
    fetchReferees();
  }, []);

  const fetchReferees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'referees'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetched: Referee[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Referee);
      });
      setReferees(fetched);
    } catch (error) {
      console.error("Error fetching referees: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReferee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'referees'), {
        ...newReferee,
        matchesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewReferee({ name: '', phone: '', level: 'درجة أولى' });
      fetchReferees();
    } catch (error) {
      console.error("Error adding referee: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحكم؟')) return;
    try {
      await deleteDoc(doc(db, 'referees', id));
      fetchReferees();
    } catch (error) {
      console.error("Error deleting referee: ", error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">إدارة الحكام</h1>
          <p className="text-zinc-400">إضافة وتعديل بيانات حكام البطولة ومتابعة سجلاتهم.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة حكم جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 border-t-4 border-t-primary">
          <h2 className="text-xl font-bold text-white mb-6">تفاصيل الحكم الجديد</h2>
          <form onSubmit={handleAddReferee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">اسم الحكم الرباعي</label>
              <input 
                required
                type="text" 
                value={newReferee.name}
                onChange={(e) => setNewReferee({...newReferee, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="الاسم الكامل"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">رقم الهاتف</label>
              <input 
                type="tel" 
                value={newReferee.phone}
                onChange={(e) => setNewReferee({...newReferee, phone: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="07..."
                dir="ltr"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400">درجة التحكيم</label>
              <select 
                value={newReferee.level}
                onChange={(e) => setNewReferee({...newReferee, level: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="درجة أولى">درجة أولى</option>
                <option value="درجة ثانية">درجة ثانية</option>
                <option value="درجة ثالثة">درجة ثالثة</option>
                <option value="دولي">دولي</option>
                <option value="ساحات مكشوفة">ساحات مكشوفة</option>
              </select>
            </div>
            
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
                className="px-6 py-3 rounded-xl bg-primary text-black hover:bg-primary-dark transition-colors font-bold"
              >
                حفظ الحكم
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referees.map((referee) => (
            <div key={referee.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <UserSquare2 className="w-7 h-7" />
                </div>
                <button 
                  onClick={() => handleDelete(referee.id)}
                  className="p-2 text-zinc-500 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                  title="حذف الحكم"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{referee.name}</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold">
                  {referee.level}
                </span>
                <span className="text-xs text-zinc-500 font-medium" dir="ltr">
                  {referee.phone}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Shield className="w-4 h-4 text-zinc-500" />
                  المباريات المُدارة
                </div>
                <div className="font-heading font-black text-xl text-white">
                  {referee.matchesCount || 0}
                </div>
              </div>
            </div>
          ))}

          {referees.length === 0 && (
             <div className="col-span-full py-16 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
               <UserSquare2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-white mb-2">لا يوجد حكام</h3>
               <p className="text-zinc-500">قم بإضافة الحكم الأول للبطولة عبر الزر أعلاه.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

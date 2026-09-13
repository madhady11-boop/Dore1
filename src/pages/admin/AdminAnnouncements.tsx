import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Megaphone, Plus, CalendarDays, Edit, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  issuer: string;
  createdAt: number;
}

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    issuer: 'اللجنة المنظمة',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetched: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(fetched);
    } catch (error) {
      console.error("Error fetching announcements: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewAnnouncement({
        title: '',
        date: new Date().toISOString().split('T')[0],
        content: '',
        issuer: 'اللجنة المنظمة',
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error adding announcement: ", error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">التبليغات الرسمية</h1>
          <p className="text-zinc-400">إدارة ونشر التبليغات والقرارات للجمهور والفرق.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة تبليغ جديد
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 border-t-4 border-t-primary">
          <h2 className="text-xl font-bold text-white mb-6">تفاصيل التبليغ الجديد</h2>
          <form onSubmit={handleAddAnnouncement} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400">عنوان التبليغ</label>
              <input 
                required
                type="text" 
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: تأجيل مباراة الجولة السادسة..."
                maxLength={200}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">التاريخ</label>
              <input 
                required
                type="date" 
                value={newAnnouncement.date}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">الجهة المصدرة</label>
              <input 
                required
                type="text" 
                value={newAnnouncement.issuer}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, issuer: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="مثال: اللجنة المنظمة، لجنة الانضباط..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-400">نص التبليغ</label>
              <textarea 
                required
                rows={5}
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                placeholder="اكتب التفاصيل هنا..."
                maxLength={5000}
              />
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
                نشر التبليغ
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
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                      <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {announcement.date}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span>{announcement.issuer}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button className="p-2 text-zinc-400 hover:text-primary bg-zinc-950 rounded-lg border border-zinc-800 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-accent-red bg-zinc-950 rounded-lg border border-zinc-800 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            </div>
          ))}
          
          {announcements.length === 0 && (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-3xl">
              <Megaphone className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">لا توجد تبليغات</h3>
              <p className="text-zinc-500">قم بإضافة التبليغ الأول من الزر أعلاه.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

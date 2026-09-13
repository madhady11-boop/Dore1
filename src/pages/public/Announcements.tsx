import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Megaphone, CalendarDays } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  issuer: string;
  createdAt: number;
}

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
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

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl border border-primary/50 flex items-center justify-center mb-6">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-4 tracking-tight">
            التبليغات <span className="text-primary">الرسمية</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            تابع آخر القرارات والتبليغات الرسمية الصادرة من اللجنة المنظمة ولجنة الانضباط في دوري صوب الشامية.
          </p>
        </div>
      </section>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="group bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 hover:border-primary/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{announcement.title}</h2>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
                      <CalendarDays className="w-4 h-4 text-primary" /> 
                      {announcement.date}
                    </span>
                    <span className="text-zinc-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      {announcement.issuer}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 leading-loose whitespace-pre-wrap text-lg">
                  {announcement.content}
                </p>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-3xl">
              <Megaphone className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">لا توجد تبليغات حالياً</h3>
              <p className="text-zinc-500 text-lg">لم يتم نشر أي تبليغات رسمية حتى الآن.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

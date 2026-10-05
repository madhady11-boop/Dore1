import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ADMIN_ROLES } from '../lib/constants';

export type UserRole =
  | 'super_admin'
  | 'tournament_manager'
  | 'disciplinary_committee'
  | 'media_manager'
  | 'stats_manager'
  | 'team';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  teamId?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  /** true for accounts with any control-panel role */
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** The founding account always keeps full control of the platform. */
const SUPER_ADMIN_EMAIL = 'bkwrya552@gmail.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const isFounder = currentUser.email === SUPER_ADMIN_EMAIL;

      try {
        const snapshot = await getDoc(userRef);
        const data = snapshot.exists() ? snapshot.data() : null;

        if (!data) {
          // First sign-in → create the profile. Firestore rules require
          // `createdAt`/`updatedAt` to equal request.time, hence serverTimestamp().
          const role: UserRole = isFounder ? 'super_admin' : 'team';
          await setDoc(userRef, {
            email: currentUser.email,
            role,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            role,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
          });
        } else {
          const role = (isFounder ? 'super_admin' : (data.role as UserRole) || 'team') as UserRole;
          setProfile({
            uid: currentUser.uid,
            email: (data.email as string) || currentUser.email || '',
            role,
            teamId: (data.teamId as string) || undefined,
            displayName: (data.displayName as string) || currentUser.displayName || '',
            photoURL: (data.photoURL as string) || currentUser.photoURL || '',
          });
        }
      } catch (error) {
        console.error('تعذّر تحميل ملف المستخدم:', error);
        // Never leave the interface stuck: fall back to a read-only profile.
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || '',
          role: isFounder ? 'super_admin' : 'team',
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const role = profile?.role;
  const isAdmin = role === 'super_admin';
  const isStaff = !!role && (ADMIN_ROLES as readonly string[]).includes(role);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

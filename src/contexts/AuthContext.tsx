import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'super_admin' | 'tournament_manager' | 'disciplinary_committee' | 'media_manager' | 'stats_manager' | 'team';
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Special case for creator super admin
        let currentProfile: UserProfile | null = null;
        if (currentUser.email === 'bkwrya552@gmail.com') {
          currentProfile = {
            uid: currentUser.uid,
            email: currentUser.email!,
            role: 'super_admin',
            displayName: currentUser.displayName || 'Super Admin',
            photoURL: currentUser.photoURL || '',
          };
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              await setDoc(docRef, {
                email: currentUser.email,
                role: 'super_admin',
                displayName: currentUser.displayName || 'Super Admin',
                photoURL: currentUser.photoURL || '',
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
              });
            } else {
              const data = docSnap.data();
              currentProfile = {
                uid: currentUser.uid,
                email: data.email,
                role: 'super_admin',
                teamId: data.teamId,
                displayName: data.displayName || currentUser.displayName,
                photoURL: data.photoURL || currentUser.photoURL,
              };
            }
          } catch (e) {
            console.error('Failed to upsert super admin:', e);
          }
        } else {
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              currentProfile = {
                uid: currentUser.uid,
                email: data.email,
                role: data.role,
                teamId: data.teamId,
                displayName: data.displayName,
                photoURL: data.photoURL,
              };
            } else {
              // Create default team account (pending approval or just view only)
              // Actually we probably shouldn't auto-create for anyone except admin. Let's make them 'team' by default without teamId
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email!,
                role: 'team',
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
              };
              await setDoc(docRef, {
                email: currentUser.email,
                role: 'team',
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                updatedAt: Date.now(),
                createdAt: Date.now(),
              });
              currentProfile = newProfile;
            }
          } catch (error) {
            console.error('Error fetching user profile', error);
          }
        }
        setProfile(currentProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  const isAdmin = profile?.role === 'super_admin'; // Or other management roles depending on needs

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { OwnedCharacter } from '@/lib/characters';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveUserData: (coins: number, inventory: OwnedCharacter[]) => Promise<void>;
  loadUserData: () => Promise<{ coins: number; inventory: OwnedCharacter[] } | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    // Initialiser les données utilisateur
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        coins: 5000,
        inventory: [],
        createdAt: new Date().toISOString(),
      });
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const saveUserData = async (coins: number, inventory: OwnedCharacter[]) => {
    if (!user) return;
    
    await setDoc(doc(db, 'users', user.uid), {
      coins,
      inventory,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  };

  const loadUserData = async () => {
    if (!user) return null;

    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        coins: data.coins || 5000,
        inventory: data.inventory || [],
      };
    }

    return null;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    saveUserData,
    loadUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

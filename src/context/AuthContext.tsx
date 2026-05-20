import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  User,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  profile: any;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (data: any) => Promise<void>;
  updateUser: (newData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          const userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            displayName: firebaseUser.displayName || 'Guest',
            photoURL: firebaseUser.photoURL || null,
            rank: 'Operative',
            contributionCount: 0,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const signInWithGoogle = async () => {
    Alert.alert("Notice", "Google Sign-In requires Expo AuthSession setup on React Native. Stubbed for now.");
  };

  const signUp = async (data: any) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    await updateProfile(firebaseUser, {
      displayName: data.name
    });

    const userProfile = {
      uid: firebaseUser.uid,
      email: data.email,
      displayName: data.name,
      photoURL: null,
      rank: 'Operative',
      contributionCount: 0,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
    setProfile(userProfile);
  };

  const updateUser = async (newData: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), newData);
      setProfile((prev: any) => ({ ...prev, ...newData }));
    } catch (err) {
      console.error(err);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, loginAsGuest, logout, signUp, updateUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

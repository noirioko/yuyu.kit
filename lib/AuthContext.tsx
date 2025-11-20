'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Only run on client-side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Check for redirect result when user returns from Google login
    const handleRedirect = async () => {
      try {
        console.log('🔍 Checking for redirect result...');
        console.log('Current URL:', window.location.href);
        const result = await getRedirectResult(auth);

        if (result?.user) {
          console.log('✅ Redirect sign-in successful:', result.user.email);
          console.log('User UID:', result.user.uid);
          if (mounted) {
            setUser(result.user);
          }
        } else {
          console.log('ℹ️ No redirect result (normal page load)');
        }
      } catch (error: any) {
        console.error('❌ Error handling redirect result:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
      }
    };

    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Auth state changed:', user?.email || 'signed out');
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error('Firebase not initialized. Please check your .env.local file.');
      return;
    }
    const provider = new GoogleAuthProvider();

    // Use popup for localhost, redirect for production
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    try {
      if (isLocalhost) {
        console.log('🚀 Starting Google sign-in with popup (localhost)...');
        await signInWithPopup(auth, provider);
        console.log('✅ Popup sign-in successful');
      } else {
        console.log('🚀 Starting Google sign-in with redirect (production)...');
        console.log('Auth domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
        await signInWithRedirect(auth, provider);
        console.log('✅ Redirect initiated');
      }
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  const unlock = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      console.error("Error signing in with Google", error);
      return false;
    }
  };

  const lock = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const isUnlocked = !!user;

  if (!isReady) return null; // Or a splash screen

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

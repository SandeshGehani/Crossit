import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const PIN_CODE = '2709'; // Configured per user request
const AUTH_KEY = 'crossledger_auth_unlocked';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity locks the app

export function AuthProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isReady, setIsReady] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved === 'true') {
      setIsUnlocked(true);
    }
    setIsReady(true);
  }, []);

  // Activity tracker for auto-lock
  useEffect(() => {
    if (!isUnlocked) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('click', updateActivity);
    
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > LOCK_TIMEOUT_MS) {
        lock();
      }
    }, 10000);

    return () => {
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [isUnlocked, lastActivity]);

  const unlock = (pin) => {
    if (pin === PIN_CODE) {
      setIsUnlocked(true);
      setLastActivity(Date.now());
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    localStorage.removeItem(AUTH_KEY);
  };

  if (!isReady) return null; // Or a splash screen

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock }}>
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

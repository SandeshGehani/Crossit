import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PinLockScreen() {
  const { unlock } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await unlock();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-gutter">
      <div className="w-full max-w-sm flex flex-col items-center slide-up">
        {/* Logo / App Icon */}
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-8 text-on-primary font-headline-lg">
          XL
        </div>
        
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Crossit</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-12">Sign in to sync your ledger</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const UndoContext = createContext(null);

const UNDO_TIMEOUT = 5000; // 5 seconds

export function UndoProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showUndo = useCallback((message, onUndo) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, onUndo, exiting: false });

    timerRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, exiting: true } : null);
      setTimeout(() => setToast(null), 300);
    }, UNDO_TIMEOUT);
  }, []);

  const handleUndo = useCallback(() => {
    if (toast?.onUndo) {
      toast.onUndo();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(prev => prev ? { ...prev, exiting: true } : null);
    setTimeout(() => setToast(null), 300);
  }, [toast]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(prev => prev ? { ...prev, exiting: true } : null);
    setTimeout(() => setToast(null), 300);
  }, []);

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      {toast && (
        <div className={`fixed bottom-20 left-4 right-4 z-[200] ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}>
          <div className="bg-inverse-surface text-inverse-on-surface rounded-xl px-4 py-3 shadow-elevated flex items-center justify-between gap-3">
            <span className="font-inter text-body-sm flex-1">{toast.message}</span>
            <button
              onClick={handleUndo}
              className="font-geist font-bold text-inverse-primary text-label-caps uppercase tracking-wider shrink-0 px-2 py-1 rounded-lg active:bg-white/10 transition-colors"
            >
              UNDO
            </button>
            <button
              onClick={dismiss}
              className="text-inverse-on-surface/60 shrink-0"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
}

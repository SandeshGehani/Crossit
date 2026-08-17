import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { exportToCSV, exportJSONBackup } from '../utils/exportUtils';
import * as store from '../store/localStore';

export default function SettingsPage() {
  const { lock } = useAuth();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark') || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear ALL data? This cannot be undone.")) {
      store.clearAllData();
      alert("All data cleared. The app will now reload.");
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background page-enter pb-32">
      <div className="flex flex-col w-full h-full px-gutter pt-8">
        
        {/* Header / App Info */}
        <div className="flex flex-col items-center justify-center py-stack-lg mb-stack-md">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-soft mb-stack-sm text-on-primary font-headline-lg">
            XL
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Crossit</h2>
          <p className="font-body-sm text-body-sm text-outline">Version 1.0.0 (Local Build)</p>
        </div>

        {/* Data Management */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl shadow-soft mb-stack-lg overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/50">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">Data Management</span>
          </div>
          
          <button onClick={exportToCSV} className="flex items-center justify-between w-full p-4 bg-transparent hover:bg-surface-container-highest transition-colors text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">download</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg text-body-lg text-on-surface font-medium">Export to CSV</span>
                <span className="font-body-sm text-body-sm text-outline">Download spreadsheets for Excel/Numbers</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>
          
          <div className="h-[1px] w-full bg-outline-variant/20 ml-16"></div>
          
          <button onClick={exportJSONBackup} className="flex items-center justify-between w-full p-4 bg-transparent hover:bg-surface-container-highest transition-colors text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">sync_saved_locally</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg text-body-lg text-on-surface font-medium">Backup JSON</span>
                <span className="font-body-sm text-body-sm text-outline">Download local JSON backup</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
          </button>
          
          <div className="h-[1px] w-full bg-outline-variant/20 ml-16"></div>

          <button onClick={handleClearData} className="flex items-center justify-between w-full p-4 bg-transparent hover:bg-error-container/50 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg text-body-lg text-error font-medium">Clear All Data</span>
                <span className="font-body-sm text-body-sm text-error/70">Wipe the local database entirely</span>
              </div>
            </div>
          </button>
        </div>

        {/* Preferences & Info */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl shadow-soft mb-stack-lg overflow-hidden">
          <div className="px-4 py-3 bg-surface-container/50">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">Preferences & About</span>
          </div>
          
          <div className="flex items-center justify-between w-full p-4 bg-transparent" onClick={toggleDarkMode}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">{darkMode ? 'dark_mode' : 'light_mode'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg text-body-lg text-on-surface font-medium">Appearance</span>
                <span className="font-body-sm text-body-sm text-outline">Toggle dark mode</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={darkMode} readOnly />
              <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </label>
          </div>
          
          <div className="h-[1px] w-full bg-outline-variant/20 ml-16"></div>
          
          <button className="flex items-center justify-between w-full p-4 bg-transparent hover:bg-surface-container-highest transition-colors text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">info</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg text-body-lg text-on-surface font-medium">App Information</span>
                <span className="font-body-sm text-body-sm text-outline">Offline-first PWA</span>
              </div>
            </div>
          </button>
        </div>

        {/* Lock App */}
        <div className="mt-auto pt-stack-lg flex flex-col gap-4">
          <button 
            onClick={lock}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-error/10 text-error font-headline-md text-headline-md active:bg-error/20 transition-colors"
          >
            <span className="material-symbols-outlined">lock</span>
            Lock App
          </button>
          <p className="text-center font-body-sm text-body-sm text-outline pb-4">
            Secured by PIN (2709)
          </p>
        </div>
      </div>
    </div>
  );
}

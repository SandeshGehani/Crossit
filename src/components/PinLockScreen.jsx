import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PinLockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { unlock } = useAuth();

  const handleKeyPress = (num) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Automatically try to unlock when 4 digits are entered
        const success = unlock(newPin);
        if (!success) {
          setError(true);
          setTimeout(() => setPin(''), 500); // Clear after delay to show the red error state briefly
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-primary text-on-primary rounded-2xl flex items-center justify-center mb-8 shadow-elevated">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome Back</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-12">Enter PIN to access Crossit</p>

        {/* PIN Indicators */}
        <div className={`flex gap-4 mb-16 ${error ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > i 
                  ? error ? 'bg-error scale-110' : 'bg-primary scale-110' 
                  : 'bg-surface-dim'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-full bg-surface-container-lowest shadow-soft font-numeric-display text-2xl text-on-surface hover:bg-surface-container transition-colors active:scale-95"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty cell for alignment */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-full bg-surface-container-lowest shadow-soft font-numeric-display text-2xl text-on-surface hover:bg-surface-container transition-colors active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-3xl">backspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}

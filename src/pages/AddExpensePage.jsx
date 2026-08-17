import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useData';
import { toPaisa, CURRENCY_SYMBOL } from '../utils/formatCurrency';

const CATEGORIES = [
  { id: 'food', icon: 'restaurant', label: 'Food', bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  { id: 'transport', icon: 'directions_car', label: 'Transport', bg: 'bg-[#E8F0FE]', text: 'text-[#1967D2]' },
  { id: 'subscriptions', icon: 'subscriptions', label: 'Subs', bg: 'bg-[#FCE8E6]', text: 'text-[#C5221F]' },
  { id: 'shopping', icon: 'shopping_bag', label: 'Shopping', bg: 'bg-[#FEF7E0]', text: 'text-[#E37400]' },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'easypaisa', label: 'EasyPaisa' },
  { id: 'bank', label: 'Bank' },
];

export default function AddExpensePage() {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // TODO: Create recurring rule if isRecurring is true once that service is built

    addExpense({
      amount: toPaisa(amount),
      category,
      paymentMethod,
      date: new Date(date).toISOString(),
      note,
      recurringRuleId: null, // Placeholder for v2 or recurring feature
    });

    navigate(-1); // Go back
  };

  return (
    <div className="flex flex-col w-full h-full pb-24 page-enter">
      {/* Header handled by Layout, but Add views often have a custom header with a back button. 
          The Layout component is globally applied. To match the reference HTML's header with a back button, 
          we can hide the Layout header for this route or just build the form below it. 
          Given our App.js setup, Layout is standard. We will just use the standard layout for now and add an explicit back button in the form if needed, or rely on bottom nav. Let's add a back button at the top of the form area just in case. */}
      
      <div className="px-gutter pt-6 pb-4">
        <label className="font-label-caps text-label-caps text-on-background/70 mb-2 block">Amount</label>
        <div className="flex items-center">
          <span className="font-numeric-display text-numeric-display text-on-background mr-2">{CURRENCY_SYMBOL.replace('.', '')}</span>
          <input 
            autoFocus
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent border-b-2 border-outline/30 focus:border-primary text-[48px] leading-[56px] font-bold text-on-background pb-2 outline-none appearance-none placeholder-outline-variant/50 transition-colors"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="px-gutter mt-6">
        <label className="font-label-caps text-label-caps text-on-background/70 mb-4 block">Category</label>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95 ${
                category === cat.id 
                  ? 'bg-primary/5 ring-2 ring-primary' 
                  : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${cat.bg} ${cat.text}`}>
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <span className="font-body-sm text-[11px] text-on-surface-variant text-center w-full truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-gutter mt-8">
        <label className="font-label-caps text-label-caps text-on-background/70 mb-3 block">Payment Method</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`px-4 py-2 rounded-full font-body-sm text-body-sm transition-colors active:scale-95 ${
                paymentMethod === method.id
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-gutter mt-8 space-y-6">
        <div className="flex items-center gap-4 bg-surface-container p-4 rounded-xl">
          <span className="material-symbols-outlined text-outline">calendar_today</span>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent w-full font-body-lg text-body-lg text-on-surface outline-none"
          />
        </div>
        
        <div className="bg-surface-container p-4 rounded-xl">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-transparent w-full font-body-lg text-body-lg text-on-surface outline-none resize-none placeholder-outline-variant"
            placeholder="Add a note..."
            rows="2"
          />
        </div>

        <div className="bg-surface-container p-4 rounded-xl">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
            <div>
              <span className="block font-body-lg text-body-lg text-on-surface font-medium">Make this recurring</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant mt-1">Automatically log this expense</span>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isRecurring ? 'bg-primary' : 'bg-outline-variant/30'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${isRecurring ? 'bg-on-primary translate-x-7' : 'bg-on-surface translate-x-1'}`} />
            </div>
          </div>
          
          {isRecurring && (
            <div className="mt-4 pt-4 border-t border-outline-variant/20 slide-up">
              <select 
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value)}
                className="w-full bg-transparent font-body-lg text-body-lg text-on-surface outline-none appearance-none"
              >
                <option value="weekly">Every Week</option>
                <option value="monthly">Every Month</option>
                <option value="yearly">Every Year</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-[80px] left-0 w-full p-gutter bg-background/90 backdrop-blur-md pb-safe">
        <button 
          onClick={handleSave}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full h-touch-target-min bg-primary text-on-primary font-headline-md text-headline-md rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          Save Expense
        </button>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonBalances, useSettlements, useLedgerEntries } from '../hooks/useData';
import { formatCurrency, toPaisa } from '../utils/formatCurrency';

export default function SettleUpPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const balances = usePersonBalances();
  const { addSettlement } = useSettlements();
  const { entries: personEntries } = useLedgerEntries(id);

  const person = useMemo(() => balances.find(p => p.id === id), [balances, id]);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('Settled up');

  if (!person) {
    return <div className="p-gutter mt-16 text-on-surface">Person not found</div>;
  }

  // Pre-fill amount with full balance
  const fullAmount = Math.abs(person.balance);
  const fullAmountFormatted = (fullAmount / 100).toFixed(2);
  
  // If no initial amount set, default to full
  if (amount === '' && fullAmount > 0) {
    setAmount(fullAmountFormatted);
  }

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    // In a full implementation, settlements might map to specific ledger entries if partial.
    // For now, it just reduces the running balance.
    
    // Determine direction of settlement based on who owes who.
    // Actually, `usePersonBalances` computes balance by: balance = IOUs(they owe) - IOUs(you owe) - Settlements
    // If balance > 0 (they owe you), settlement reduces balance (amount should be positive).
    // If balance < 0 (you owe them), settlement increases balance towards 0 (amount should be negative in the context of `computeBalance`, but `addSettlement` might just take an amount and apply it based on logic. Let's look at `usePersonBalances` in `hooks/useData.js`:
    // `balance -= settlement.amount`.
    // So if balance > 0 (they owe you 1000), a settlement of 1000 means `balance -= 1000` => 0. Correct.
    // If balance < 0 (you owe them 1000), a settlement of 1000 means `balance -= ?`. Wait. If I owe them 1000 (balance = -1000). If I pay them, balance should go to 0. So settlement amount must be -1000.
    // So settlement amount sign should match the balance sign.

    const sign = person.balance > 0 ? 1 : -1;
    const finalAmountPaisa = toPaisa(amount) * sign;

    addSettlement({
      personId: id,
      amount: finalAmountPaisa,
      date: new Date(date).toISOString(),
      note,
    });

    navigate(-1); // Back to person detail
  };

  return (
    <div className="flex flex-col w-full h-full pb-32 page-enter bg-background">
      <header className="w-full z-50 bg-surface/80 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-touch-target-min h-touch-target-min flex items-center justify-center -ml-2 text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-grow flex items-center justify-between">
            <span className="font-headline-md text-headline-md text-on-surface truncate">Settle Up</span>
          </div>
        </div>
      </header>

      <section className="p-gutter flex flex-col gap-stack-lg relative z-10">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline-lg text-2xl uppercase mb-4 shadow-sm">
            {person.name.substring(0, 2)}
          </div>
          <span className="font-label-caps text-outline mb-2">AMOUNT TO SETTLE</span>
          <div className="flex items-center justify-center w-full">
            <span className="font-numeric-display text-numeric-display text-outline-variant mr-1 select-none">Rs</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent border-none outline-none font-numeric-display text-[48px] leading-[56px] text-on-surface text-center w-full max-w-[200px] placeholder:text-outline-variant p-0 m-0"
              placeholder="0.00"
            />
          </div>
          <div className="text-body-sm text-outline mt-2">
            Outstanding: {formatCurrency(Math.abs(person.balance))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4 mb-4">
            <span className="material-symbols-outlined text-outline">calendar_today</span>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent w-full font-body-lg text-body-lg text-on-surface outline-none"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-outline">notes</span>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-transparent w-full font-body-lg text-body-lg text-on-surface outline-none"
              placeholder="Note (optional)"
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-gutter bg-gradient-to-t from-background via-background to-transparent pt-8 pb-safe z-50">
        <button
          onClick={handleSave}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (fullAmount/100)}
          className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>Mark as Settled</span>
        </button>
      </div>
    </div>
  );
}

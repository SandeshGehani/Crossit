import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePeople, useLedgerEntries } from '../hooks/useData';
import { toPaisa, CURRENCY_SYMBOL } from '../utils/formatCurrency';

const PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: 'account_balance' },
  { id: 'cash', label: 'Cash', icon: 'payments' },
  { id: 'credit', label: 'Credit Card', icon: 'credit_card' },
  { id: 'crypto', label: 'Crypto', icon: 'account_balance_wallet' },
];

export default function AddIOUPage() {
  const navigate = useNavigate();
  const { people } = usePeople();
  const { addEntry } = useLedgerEntries();

  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('they_owe_you'); // 'they_owe_you' | 'you_owe_them'
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [isGroupSplit, setIsGroupSplit] = useState(false);
  
  // For group split (simplified for v1 - just divide evenly)
  // Real implementation would allow individual share edits
  const [groupParticipants, setGroupParticipants] = useState([]);

  const filteredPeople = useMemo(() => {
    if (!search) return people.slice(0, 3); // Show top 3 recent if no search
    return people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [people, search]);

  const selectedPerson = useMemo(() => {
    return people.find(p => p.id === selectedPersonId);
  }, [people, selectedPersonId]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!isGroupSplit && !selectedPersonId) return;

    if (isGroupSplit) {
      // Group split logic (placeholder for v2 or if we add full splitService)
      // For now, if we don't have the split service fully wired, we just fallback or show error.
      // The spec says split events create individual ledger entries.
      alert('Group split is a v2 feature (or requires splitService integration).');
      return;
    }

    // Single IOU
    addEntry({
      personId: selectedPersonId,
      amount: toPaisa(amount),
      direction,
      note,
      paymentMethod,
    });

    navigate(-1);
  };

  return (
    <div className="flex flex-col w-full h-full pb-32 page-enter bg-background">
      {/* Header handled by Layout */}

      <section className="p-gutter flex flex-col gap-stack-lg bg-surface relative z-10">
        {/* Person Picker */}
        {!isGroupSplit && (
          <div className="relative">
            {!selectedPersonId ? (
              <div className="relative">
                <div className="flex items-center bg-surface-container rounded-full px-4 h-14 relative z-10 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="material-symbols-outlined text-outline mr-3">search</span>
                  <input
                    type="text"
                    placeholder="Who are you splitting with?"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none flex-grow font-body-lg text-on-surface placeholder:text-outline"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant ml-2">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-highest rounded-xl p-2 shadow-lg z-20 max-h-48 overflow-y-auto slide-up">
                  {filteredPeople.length > 0 ? (
                    filteredPeople.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersonId(p.id)}
                        className="flex items-center gap-3 p-3 rounded-lg active:bg-surface-variant transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-base uppercase shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-lg font-medium text-on-surface">{p.name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-on-surface-variant text-body-sm text-center">
                      No matching person found. <br />
                      Go to People tab to add them first.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-surface-container rounded-2xl p-4 shadow-sm fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-lg uppercase shrink-0">
                    {selectedPerson?.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-on-surface">{selectedPerson?.name}</span>
                    <span className="font-body-sm text-outline">Selected</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="text-primary font-medium text-body-sm px-3 py-2 rounded-full bg-primary/10 active:bg-primary/20 transition-colors"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div className="flex flex-col items-center justify-center py-6">
          <span className="font-label-caps text-outline mb-2">AMOUNT</span>
          <div className="flex items-center justify-center w-full">
            <span className="font-numeric-display text-numeric-display text-outline-variant mr-1 select-none">{CURRENCY_SYMBOL.replace('.', '')}</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent border-none outline-none font-numeric-display text-[48px] leading-[56px] text-on-surface text-center w-full max-w-[200px] placeholder:text-outline-variant p-0 m-0"
              placeholder="0.00"
            />
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent mt-2 rounded-full" />
        </div>

        {/* Direction Toggle */}
        <div className="bg-surface-container p-1 rounded-full flex relative shadow-inner">
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out"
            style={{ transform: direction === 'they_owe_you' ? 'translateX(0)' : 'translateX(calc(100% + 0px))', left: '4px' }}
          />
          <button
            onClick={() => setDirection('they_owe_you')}
            className={`flex-1 relative z-10 py-3 text-center rounded-full font-body-lg font-medium transition-colors duration-200 ${direction === 'they_owe_you' ? 'text-on-surface' : 'text-on-surface-variant'}`}
          >
            They owe me
          </button>
          <button
            onClick={() => setDirection('you_owe_them')}
            className={`flex-1 relative z-10 py-3 text-center rounded-full font-body-lg font-medium transition-colors duration-200 ${direction === 'you_owe_them' ? 'text-on-surface' : 'text-on-surface-variant'}`}
          >
            I owe them
          </button>
        </div>
      </section>

      <section className="p-gutter flex flex-col gap-stack-lg bg-surface-container-lowest flex-grow rounded-t-[32px] shadow-[0_-8px_24px_rgba(0,0,0,0.03)] -mt-6 relative z-0 pt-10">
        {/* Note */}
        <div>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-surface-container h-14 px-4 rounded-xl font-body-lg text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            placeholder="What's this for? (e.g. Dinner, Rent)"
          />
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-outline px-1">PAYMENT METHOD</span>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-gutter px-gutter">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap shadow-sm transition-all shrink-0 ${
                  paymentMethod === method.id 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Group Split Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl shadow-sm mt-2 cursor-pointer" onClick={() => setIsGroupSplit(!isGroupSplit)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className="flex flex-col">
              <span className="font-body-lg font-medium text-on-surface">Group Split</span>
              <span className="font-body-sm text-outline">Divide among multiple people</span>
            </div>
          </div>
          <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isGroupSplit ? 'bg-primary' : 'bg-outline-variant/30'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${isGroupSplit ? 'bg-on-primary translate-x-7' : 'bg-on-surface translate-x-1'}`} />
          </div>
        </div>

        {/* Group Split UI Placeholder */}
        {isGroupSplit && (
          <div className="flex flex-col gap-4 slide-up">
            <div className="p-4 bg-surface-container-high rounded-xl text-center text-on-surface-variant font-body-sm">
              Group split functionality requires multiple participants selection and will divide the amount evenly or by custom shares.
            </div>
          </div>
        )}
      </section>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-gutter bg-gradient-to-t from-background via-background to-transparent pt-8 pb-[88px] z-50">
        <button
          onClick={handleSave}
          disabled={!amount || parseFloat(amount) <= 0 || (!isGroupSplit && !selectedPersonId)}
          className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>Create IOU</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

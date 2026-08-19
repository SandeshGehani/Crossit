import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePeople, useLedgerEntries, useExpenses } from '../hooks/useData';
import { toPaisa, CURRENCY_SYMBOL } from '../utils/formatCurrency';

const PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: 'account_balance' },
  { id: 'cash', label: 'Cash', icon: 'payments' },
  { id: 'credit', label: 'Credit Card', icon: 'credit_card' },
  { id: 'crypto', label: 'Crypto', icon: 'account_balance_wallet' },
];

export default function AddIOUPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { people } = usePeople();
  const { entries, addEntry, updateEntry } = useLedgerEntries();

  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('they_owe_you'); // 'they_owe_you' | 'you_owe_them'
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [isGroupSplit, setIsGroupSplit] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [alsoLogExpense, setAlsoLogExpense] = useState(true); // Log as expense when they owe you

  const { addExpense } = useExpenses();

  // Group Split State
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'custom'
  const [customAmounts, setCustomAmounts] = useState({}); // { [personId]: stringAmount }
  const [includeSelf, setIncludeSelf] = useState(true); // Include yourself in the split

  useEffect(() => {
    if (id && entries.length > 0) {
      const existing = entries.find(e => e.id === id);
      if (existing) {
        setAmount((existing.amount / 100).toString());
        setSelectedPersonId(existing.personId);
        setDirection(existing.direction);
        setNote(existing.note || '');
        setPaymentMethod(existing.paymentMethod || PAYMENT_METHODS[0].id);
        setIsEditMode(true);
      }
    }
  }, [id, entries]);

  const filteredPeople = useMemo(() => {
    if (!search) return people.slice(0, 3);
    return people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [people, search]);

  const selectedPerson = useMemo(() => {
    return people.find(p => p.id === selectedPersonId);
  }, [people, selectedPersonId]);

  const handlePersonSelect = (id) => {
    if (isGroupSplit) {
      if (selectedPersonIds.includes(id)) {
        setSelectedPersonIds(prev => prev.filter(pid => pid !== id));
      } else {
        setSelectedPersonIds(prev => [...prev, id]);
      }
    } else {
      setSelectedPersonId(id);
      setSearch('');
    }
  };

  const handleCustomAmountChange = (id, val) => {
    setCustomAmounts(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    if (isEditMode) {
      updateEntry(id, {
        personId: selectedPersonId,
        amount: toPaisa(amount),
        direction,
        note,
        paymentMethod,
      });
      navigate(-1);
      return;
    }

    if (!isGroupSplit) {
      if (!selectedPersonId) return;
      // Single IOU
      addEntry({
        personId: selectedPersonId,
        amount: toPaisa(amount),
        direction,
        note,
        paymentMethod,
      });
    } else {
      if (selectedPersonIds.length === 0) return;
      
      // Total heads = selected people + yourself (if included)
      const totalHeads = selectedPersonIds.length + (includeSelf ? 1 : 0);

      if (splitMode === 'equal') {
        const splitAmount = (val / totalHeads).toFixed(2);
        // Only create IOUs for the OTHER people, not yourself
        selectedPersonIds.forEach(id => {
          addEntry({
            personId: id,
            amount: toPaisa(splitAmount),
            direction,
            note: note ? `${note} (Split)` : 'Group Split',
            paymentMethod,
          });
        });
      } else if (splitMode === 'custom') {
        // Validate: custom amounts for others + your share must equal the total
        const othersTotal = selectedPersonIds.reduce((sum, id) => sum + (parseFloat(customAmounts[id]) || 0), 0);
        const myShare = parseFloat(customAmounts['_self'] || 0);
        const totalCustom = othersTotal + (includeSelf ? myShare : 0);
        if (Math.abs(totalCustom - val) > 0.01) {
          alert(`Custom amounts must sum to ${val}. Current sum: ${totalCustom.toFixed(2)}`);
          return;
        }

        // Only create IOUs for other people
        selectedPersonIds.forEach(id => {
          const personAmount = parseFloat(customAmounts[id]) || 0;
          if (personAmount > 0) {
            addEntry({
              personId: id,
              amount: toPaisa(personAmount.toString()),
              direction,
              note: note ? `${note} (Custom Split)` : 'Group Split',
              paymentMethod,
            });
          }
        });
      }
    }

    // If direction is 'they_owe_you' and user opted in, also log as an expense
    if (direction === 'they_owe_you' && alsoLogExpense) {
      addExpense({
        amount: toPaisa(amount),
        category: 'other',
        paymentMethod,
        date: new Date().toISOString(),
        note: note ? `${note} (paid for others)` : 'Paid for others',
      });
    }

    navigate(-1);
  };

  return (
    <div className="flex flex-col w-full h-full pb-32 page-enter bg-background">
      <section className="p-gutter flex flex-col gap-stack-lg bg-surface relative z-10">
        
        {/* Person Picker */}
        <div className="relative">
          {(!selectedPersonId && !isGroupSplit) || isGroupSplit ? (
            <div className="relative">
              <div className="flex items-center bg-surface-container rounded-full px-4 h-14 relative z-10 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined text-outline mr-3">search</span>
                <input
                  type="text"
                  placeholder={isGroupSplit ? "Search people to split with..." : "Who are you splitting with?"}
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
                  filteredPeople.map(p => {
                    const isSelected = isGroupSplit && selectedPersonIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePersonSelect(p.id)}
                        className={`flex items-center justify-between p-3 rounded-lg active:bg-surface-variant transition-colors cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-base uppercase shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-body-lg font-medium text-on-surface">{p.name}</span>
                        </div>
                        {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                      </div>
                    );
                  })
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

        {/* Selected People for Group Split */}
        {isGroupSplit && selectedPersonIds.length > 0 && (
          <div className="flex flex-wrap gap-2 slide-up">
            {selectedPersonIds.map(id => {
              const p = people.find(person => person.id === id);
              return (
                <div key={id} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                  {p?.name}
                  <button onClick={() => handlePersonSelect(id)} className="flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              );
            })}
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

        {/* Also log as expense toggle - only when they owe you */}
        {direction === 'they_owe_you' && !isEditMode && (
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl shadow-sm cursor-pointer" onClick={() => setAlsoLogExpense(!alsoLogExpense)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg font-medium text-on-surface">Also log as expense</span>
                <span className="font-body-sm text-outline">Track full amount in your spending</span>
              </div>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${alsoLogExpense ? 'bg-primary' : 'bg-outline-variant/30'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${alsoLogExpense ? 'bg-on-primary translate-x-7' : 'bg-on-surface translate-x-1'}`} />
            </div>
          </div>
        )}

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

        {/* Group Split Toggle - hidden in edit mode */}
        {!isEditMode && (
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
        )}

        {/* Group Split UI */}
        {isGroupSplit && (
          <div className="flex flex-col gap-4 slide-up">
            {/* Include Myself Toggle */}
            <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl" onClick={() => setIncludeSelf(!includeSelf)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <span className="font-body-md text-on-surface font-medium">Include myself in split</span>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${includeSelf ? 'bg-primary' : 'bg-outline-variant/30'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${includeSelf ? 'bg-on-primary translate-x-5' : 'bg-on-surface translate-x-0.5'}`} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 bg-surface-container-high p-1 rounded-lg">
              <button 
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${splitMode === 'equal' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
              >
                Equal Split
              </button>
              <button 
                onClick={() => setSplitMode('custom')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${splitMode === 'custom' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
              >
                Custom Amounts
              </button>
            </div>

            {selectedPersonIds.length > 0 ? (
              <div className="flex flex-col gap-2">
                {/* Your share (if included) */}
                {includeSelf && (() => {
                  const totalHeads = selectedPersonIds.length + 1;
                  const equalAmt = (parseFloat(amount || 0) / totalHeads).toFixed(2);
                  return (
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2">
                        <span className="font-body-md text-primary font-medium">You</span>
                        <span className="text-xs text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">Your share</span>
                      </div>
                      {splitMode === 'equal' ? (
                        <span className="font-numeric text-primary">{CURRENCY_SYMBOL}{equalAmt}</span>
                      ) : (
                        <div className="flex items-center bg-surface w-24 px-2 py-1 rounded-md border border-primary/30">
                          <span className="text-primary mr-1">{CURRENCY_SYMBOL}</span>
                          <input 
                            type="number"
                            value={customAmounts['_self'] || ''}
                            onChange={(e) => handleCustomAmountChange('_self', e.target.value)}
                            className="w-full bg-transparent outline-none text-right font-numeric text-primary"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Other people's shares */}
                {selectedPersonIds.map(id => {
                  const p = people.find(person => person.id === id);
                  const totalHeads = selectedPersonIds.length + (includeSelf ? 1 : 0);
                  const equalAmt = (parseFloat(amount || 0) / totalHeads).toFixed(2);
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                      <span className="font-body-md text-on-surface font-medium">{p?.name}</span>
                      {splitMode === 'equal' ? (
                        <span className="font-numeric text-on-surface-variant">{CURRENCY_SYMBOL}{equalAmt}</span>
                      ) : (
                        <div className="flex items-center bg-surface w-24 px-2 py-1 rounded-md border border-outline-variant/30">
                          <span className="text-on-surface-variant mr-1">{CURRENCY_SYMBOL}</span>
                          <input 
                            type="number"
                            value={customAmounts[id] || ''}
                            onChange={(e) => handleCustomAmountChange(id, e.target.value)}
                            className="w-full bg-transparent outline-none text-right font-numeric"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-on-surface-variant text-sm">
                Select people from the search bar above to split the amount.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-gutter bg-gradient-to-t from-background via-background to-transparent pt-8 pb-[88px] z-50">
        <button
          onClick={handleSave}
          disabled={!amount || parseFloat(amount) <= 0 || (!isGroupSplit && !selectedPersonId) || (isGroupSplit && selectedPersonIds.length === 0)}
          className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isEditMode ? 'Update IOU' : 'Create IOU'}</span>
          <span className="material-symbols-outlined">{isEditMode ? 'check' : 'arrow_forward'}</span>
        </button>
      </div>
    </div>
  );
}

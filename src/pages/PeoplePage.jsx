import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonBalances, usePeople } from '../hooks/useData';
import { formatCurrency } from '../utils/formatCurrency';

export default function PeoplePage() {
  const navigate = useNavigate();
  const balances = usePersonBalances();
  const { addPerson } = usePeople();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // 'All' | 'Owe Me' | 'I Owe' | 'Settled'

  // Calculate Total Outstanding
  const totalOutstanding = useMemo(() => {
    return balances.reduce((sum, p) => p.balance > 0 ? sum + p.balance : sum, 0);
  }, [balances]);

  // Filter and sort people
  const filteredPeople = useMemo(() => {
    let result = balances;

    // Search filter
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Status filter
    if (filter === 'Owe Me') {
      result = result.filter(p => p.balance > 0);
    } else if (filter === 'I Owe') {
      result = result.filter(p => p.balance < 0);
    } else if (filter === 'Settled') {
      result = result.filter(p => p.isSettled);
    }

    return result;
  }, [balances, search, filter]);

  return (
    <div className="flex flex-col w-full h-full relative page-enter">
      {/* Header Area */}
      <div className="px-gutter pt-stack-sm pb-stack-md bg-surface-bright sticky top-0 z-10 shadow-soft">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-surface-container-low text-body-lg font-body-lg text-on-surface rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
            >
              close
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-stack-md px-1">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar w-full">
            {['All', 'Owe Me', 'I Owe', 'Settled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-label-caps text-label-caps transition-all ${
                  filter === f
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List Content */}
      <div className="flex-grow px-gutter py-stack-sm pb-24 overflow-y-auto">
        {/* Summary Card */}
        <div className="w-full bg-primary-container text-on-primary-container rounded-2xl p-6 mb-stack-lg shadow-soft relative overflow-hidden transition-transform active:scale-[0.98] duration-200">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-tertiary-container/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-1">
            <span className="font-label-caps text-label-caps opacity-80">Total Outstanding</span>
            <div className="flex items-baseline gap-2">
              <span className="font-numeric-display text-numeric-display text-on-primary-container tracking-tight">
                {formatCurrency(totalOutstanding)}
              </span>
              <span className="font-body-sm text-body-sm text-secondary-container bg-secondary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> You are owed
              </span>
            </div>
          </div>
        </div>

        {/* List of People */}
        {filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center fade-in">
            <div className="w-24 h-24 mb-6 rounded-full bg-surface-container-highest flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
              <span className="material-symbols-outlined text-5xl text-outline-variant relative z-10">group_off</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No connections found</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[250px] mb-8">
              Try adjusting your search or add a new person to your ledger.
            </p>
            {/* The FAB acts as the "add new person" action */}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredPeople.map((person, index) => {
              const owesMe = person.balance > 0;
              const iOwe = person.balance < 0;
              const settled = person.isSettled;

              let statusColorClass = 'text-outline';
              let statusText = 'CLEAR';
              let amountText = '$0.00';
              let bgClass = 'bg-surface-variant text-on-surface-variant'; // for avatar

              if (owesMe) {
                statusColorClass = 'text-secondary';
                statusText = 'OWES YOU';
                amountText = formatCurrency(person.balance, true);
                bgClass = 'bg-primary-fixed text-on-primary-fixed';
              } else if (iOwe) {
                statusColorClass = 'text-error';
                statusText = 'YOU OWE';
                amountText = formatCurrency(person.balance, true);
                bgClass = 'bg-tertiary-fixed text-on-tertiary-fixed';
              }

              return (
                <button
                  key={person.id}
                  onClick={() => navigate(`/person/${person.id}`)}
                  className={`w-full bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-soft hover:shadow-md transition-all active:scale-[0.98] text-left group slide-up ${settled ? 'opacity-70' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-md text-headline-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] relative overflow-hidden ${bgClass}`}>
                      <span className="relative z-10 uppercase">{person.name.substring(0, 2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-md text-[16px] text-on-surface leading-tight mb-0.5 group-hover:text-primary transition-colors truncate max-w-[150px]">
                        {person.name}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline flex items-center gap-1 truncate max-w-[150px]">
                        {settled ? (
                          <><span className="material-symbols-outlined text-[14px]">check_circle</span> Settled</>
                        ) : (
                          <><span className="material-symbols-outlined text-[14px]">history</span> {person.lastNote || 'Recent'}</>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`font-numeric-display text-[18px] font-semibold ${statusColorClass}`}>
                      {amountText}
                    </span>
                    <span className={`font-label-caps text-[10px] mt-1 uppercase tracking-wider ${statusColorClass} opacity-80`}>
                      {statusText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button - To add a new person */}
      <button
        onClick={() => {
          const name = prompt("Enter person's name:");
          if (name && name.trim()) {
            addPerson({ name: name.trim() });
          }
        }}
        className="fixed bottom-[88px] right-6 w-14 h-14 bg-tertiary text-on-tertiary rounded-full shadow-elevated flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonBalances, useLedgerEntries, useSettlements, useExpenses } from '../hooks/useData';
import { formatCurrency, formatCompact } from '../utils/formatCurrency';
import { generateWhatsAppLink, getReminderMessage } from '../utils/whatsapp';

export default function PersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const balances = usePersonBalances();
  const { entries: allEntries } = useLedgerEntries(id);
  const { settlements: allSettlements } = useSettlements(id);
  const { expenses } = useExpenses(); // To lookup expense details if linked to an IOU via splitId

  const person = useMemo(() => balances.find(p => p.id === id), [balances, id]);

  const history = useMemo(() => {
    // We combine ledger entries and settlements for the history view
    const combined = [
      ...allEntries.map(e => ({ ...e, type: 'iou', sortDate: e.createdAt })),
      ...allSettlements.map(s => ({ ...s, type: 'settlement', sortDate: s.createdAt }))
    ];
    
    return combined.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
  }, [allEntries, allSettlements]);

  if (!person) {
    return <div className="p-gutter mt-16 text-on-surface">Person not found</div>;
  }

  const isOwedToYou = person.balance > 0;
  const isYouOwe = person.balance < 0;
  const balanceAmount = Math.abs(person.balance);
  const isSettled = person.balance === 0;

  const handleRemind = () => {
    if (!isOwedToYou) {
      alert("They don't owe you anything.");
      return;
    }
    
    if (person.phone) {
      const link = generateWhatsAppLink(person.phone, person.name, person.balance, 'pending IOUs');
      if (link) {
        window.open(link, '_blank');
        return;
      }
    }
    
    // Fallback: Copy to clipboard
    const msg = getReminderMessage(person.name, person.balance, 'pending IOUs');
    navigator.clipboard.writeText(msg).then(() => {
      alert("Reminder message copied to clipboard!");
    });
  };

  const handleSettleUp = () => {
    if (isSettled) {
      alert("Balance is already settled.");
      return;
    }
    // Navigate to a settle modal/page (or just open it here). For now, we'll navigate to a stub route
    navigate(`/settle/${person.id}`);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background page-enter pb-safe">
      {/* Header Overrides Standard Layout - the back button is needed */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-touch-target-min h-touch-target-min flex items-center justify-center -ml-2 text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-grow flex items-center justify-between">
            <span className="font-headline-md text-headline-md text-on-surface truncate">Person Detail</span>
          </div>
        </div>
      </header>

      <main className="pt-[calc(64px+env(safe-area-inset-top))] px-gutter pb-32">
        <div className="flex flex-col gap-stack-lg">
          
          {/* Summary Card */}
          <section className="bg-surface-container rounded-xl shadow-md p-6 relative overflow-hidden flex flex-col items-center justify-center gap-4 text-center mt-4">
            {/* Glows */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none ${isOwedToYou ? 'bg-secondary-container' : 'bg-error-container'}`}></div>
            <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none ${isOwedToYou ? 'bg-primary-container' : 'bg-tertiary-container'}`}></div>
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-headline-lg text-2xl z-10 uppercase ${isOwedToYou ? 'bg-primary-fixed text-on-primary-fixed' : (isYouOwe ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-variant text-on-surface-variant')}`}>
              {person.name.substring(0, 2)}
            </div>
            
            <div className="flex flex-col gap-1 z-10">
              <h2 className="font-headline-md text-headline-md text-on-surface">{person.name}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isOwedToYou ? 'Owes you' : (isYouOwe ? 'You owe' : 'Settled')}
              </p>
            </div>
            
            <div className={`font-numeric-display text-numeric-display z-10 ${isOwedToYou ? 'text-secondary' : (isYouOwe ? 'text-error' : 'text-outline')}`}>
              {formatCurrency(balanceAmount)}
            </div>
            
            <div className="flex gap-4 w-full mt-2 z-10">
              <button 
                onClick={handleRemind}
                disabled={!isOwedToYou}
                className="flex-1 bg-surface py-3 rounded-lg shadow-sm font-label-caps text-label-caps text-on-surface flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                REMIND
              </button>
              <button 
                onClick={handleSettleUp}
                disabled={isSettled}
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg shadow-sm font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                SETTLE UP
              </button>
            </div>
          </section>

          {/* History List */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-headline-md text-headline-md text-on-background">History</h3>
              <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="text-center text-on-surface-variant mt-4 font-body-sm">No transaction history found.</div>
              ) : (
                history.map((item, i) => {
                  if (item.type === 'iou') {
                    const isPositive = item.direction === 'they_owe_you';
                    return (
                      <div key={item.id} className="bg-surface-container rounded-lg p-4 flex items-center gap-4 hover:bg-surface-variant transition-colors cursor-pointer shadow-sm slide-up" style={{animationDelay: `${i*0.05}s`}}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                          <span className="material-symbols-outlined">{isPositive ? 'arrow_downward' : 'arrow_upward'}</span>
                        </div>
                        <div className="flex-grow flex flex-col gap-1 min-w-0">
                          <span className="font-body-lg text-body-lg text-on-surface truncate">{item.note || 'IOU Added'}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={`font-body-lg text-body-lg whitespace-nowrap ${isPositive ? 'text-secondary' : 'text-error'}`}>
                          {formatCurrency(isPositive ? item.amount : -item.amount, true)}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id} className="bg-surface-container-high rounded-lg p-4 flex items-center gap-4 shadow-sm opacity-80 slide-up" style={{animationDelay: `${i*0.05}s`}}>
                        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div className="flex-grow flex flex-col gap-1 min-w-0">
                          <span className="font-body-lg text-body-lg text-on-surface truncate">Settlement</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-body-lg text-body-lg text-on-surface whitespace-nowrap">
                          {formatCurrency(-item.amount)}
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

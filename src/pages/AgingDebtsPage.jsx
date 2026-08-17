import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedgerEntries, usePersonBalances } from '../hooks/useData';
import { formatCurrency } from '../utils/formatCurrency';

const LATE_THRESHOLD_DAYS = 14;

export default function AgingDebtsPage() {
  const navigate = useNavigate();
  const { entries } = useLedgerEntries();
  const balances = usePersonBalances();

  const debts = useMemo(() => {
    const now = new Date();
    
    // Group open positive IOUs by person or just list them
    // The design shows specific debts with descriptions, so we list individual entries
    const openDebts = entries.filter(e => e.direction === 'they_owe_you' && !e.isDeleted);
    
    return openDebts.map(debt => {
      const person = balances.find(p => p.id === debt.personId) || { name: 'Unknown', id: debt.personId };
      const createdAt = new Date(debt.createdAt);
      const diffTime = Math.abs(now - createdAt);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const isLate = diffDays >= LATE_THRESHOLD_DAYS;
      
      return {
        ...debt,
        personName: person.name,
        personId: person.id,
        daysOld: diffDays,
        isLate,
        dateFormatted: createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    }).sort((a, b) => b.daysOld - a.daysOld); // Oldest first (most days old)
  }, [entries, balances]);

  const handleRemindAll = () => {
    alert("Remind all functionality would trigger WhatsApp links or notifications for all late debts.");
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background page-enter pb-32">
      <div className="px-gutter pt-4 pb-6 flex items-center justify-between sticky top-16 bg-background z-10">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Aging Debts</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Unsettled balances</p>
        </div>
        <button 
          onClick={handleRemindAll}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-4 py-3 rounded-full flex items-center justify-center gap-2 shadow-soft active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          Remind All
        </button>
      </div>

      <div className="px-gutter space-y-4">
        {debts.length === 0 ? (
          <div className="text-center text-on-surface-variant mt-12 font-body-lg">
            No outstanding debts found.
          </div>
        ) : (
          debts.map(debt => (
            <div 
              key={debt.id} 
              onClick={() => navigate(`/person/${debt.personId}`)}
              className="bg-surface-container-lowest rounded-xl shadow-soft p-4 relative overflow-hidden flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              {debt.isLate && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error"></div>}
              
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-surface-variant flex items-center justify-center">
                <span className="font-headline-md text-headline-md text-on-surface-variant uppercase">
                  {debt.personName.charAt(0)}
                </span>
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-headline-md text-[18px] text-on-surface truncate">{debt.personName}</h3>
                  <span className="font-numeric-display text-[20px] text-secondary">{formatCurrency(debt.amount, true)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[120px]">{debt.note || 'IOU'}</p>
                  <div className="flex items-center gap-2">
                    {debt.isLate && (
                      <span className="font-label-caps text-[10px] text-error bg-error-container px-2 py-0.5 rounded-full">
                        {debt.daysOld} DAYS LATE
                      </span>
                    )}
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{debt.dateFormatted}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

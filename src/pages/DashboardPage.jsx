import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, usePersonBalances, useLedgerEntries, useSettlements } from '../hooks/useData';
import { formatCurrency, formatCompact } from '../utils/formatCurrency';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { expenses } = useExpenses();
  const balances = usePersonBalances();
  const { entries: ledgerEntries } = useLedgerEntries();
  const { settlements } = useSettlements();

  const [fabOpen, setFabOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const { deleteExpense } = useExpenses();
  const { deleteEntry } = useLedgerEntries();
  const { deleteSettlement } = useSettlements();

  const handleTransactionClick = (item) => {
    setSelectedTransaction(item);
    setIsActionSheetOpen(true);
  };

  const handleEdit = () => {
    if (!selectedTransaction) return;
    setIsActionSheetOpen(false);
    if (selectedTransaction.type === 'expense') {
      navigate(`/edit-expense/${selectedTransaction.id}`);
    } else if (selectedTransaction.type === 'iou') {
      navigate(`/edit-iou/${selectedTransaction.id}`);
    }
    // settlements usually aren't edited in v1, but we can add later
  };

  const handleDelete = () => {
    if (!selectedTransaction) return;
    if (window.confirm("Are you sure you want to delete this?")) {
      if (selectedTransaction.type === 'expense') {
        deleteExpense(selectedTransaction.id);
      } else if (selectedTransaction.type === 'iou') {
        deleteEntry(selectedTransaction.id);
      } else if (selectedTransaction.type === 'settlement') {
        deleteSettlement(selectedTransaction.id);
      }
      setIsActionSheetOpen(false);
      setSelectedTransaction(null);
    }
  };

  // Calculate Totals
  const totals = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;
    let owedToYouCount = 0;
    let youOweCount = 0;

    balances.forEach(person => {
      if (person.balance > 0) {
        owedToYou += person.balance;
        owedToYouCount++;
      } else if (person.balance < 0) {
        youOwe += Math.abs(person.balance);
        youOweCount++;
      }
    });

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let monthSpend = 0;
    const dailySpend = {};

    expenses.forEach(exp => {
      if (exp.date.startsWith(currentMonthStr) && !exp.isDeleted) {
        monthSpend += exp.amount;
        const day = parseInt(exp.date.substring(8, 10), 10);
        dailySpend[day] = (dailySpend[day] || 0) + exp.amount;
      }
    });

    const chartData = [];
    let cumulative = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      cumulative += (dailySpend[i] || 0);
      chartData.push({ day: i, amount: cumulative / 100 });
    }

    return { owedToYou, youOwe, owedToYouCount, youOweCount, monthSpend, chartData };
  }, [balances, expenses]);

  // Combine and sort recent activity (Expenses + Ledger Entries + Settlements)
  const recentActivity = useMemo(() => {
    const combined = [
      ...expenses.map(e => ({ ...e, type: 'expense', sortDate: e.date })),
      ...ledgerEntries.map(e => ({ ...e, type: 'iou', sortDate: e.createdAt })),
      ...settlements.map(s => ({ ...s, type: 'settlement', sortDate: s.createdAt }))
    ];
    
    return combined
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
      .slice(0, 10); // Show only top 10
  }, [expenses, ledgerEntries, settlements]);


  return (
    <div className="flex flex-col w-full gap-stack-lg px-gutter py-stack-md page-enter">
      {/* Summary Cards Section */}
      <section className="flex gap-stack-sm overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar -mx-gutter px-gutter">
        {/* Total Owed to You */}
        <div className="snap-center shrink-0 w-64 bg-secondary-container text-on-secondary-container rounded-2xl p-stack-md shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-stack-sm">
            <span className="text-label-caps font-label-caps uppercase opacity-80">Owed to you</span>
            <span className="material-symbols-outlined text-xl opacity-80">arrow_downward</span>
          </div>
          <div className="font-numeric-display text-numeric-display truncate">
            {formatCurrency(totals.owedToYou)}
          </div>
          <div className="text-body-sm font-body-sm opacity-80 mt-1">From {totals.owedToYouCount} people</div>
        </div>

        {/* Total You Owe */}
        <div className="snap-center shrink-0 w-64 bg-error-container text-on-error-container rounded-2xl p-stack-md shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-stack-sm">
            <span class="text-label-caps font-label-caps uppercase opacity-80">You owe</span>
            <span className="material-symbols-outlined text-xl opacity-80">arrow_upward</span>
          </div>
          <div className="font-numeric-display text-numeric-display truncate">
            {formatCurrency(totals.youOwe)}
          </div>
          <div className="text-body-sm font-body-sm opacity-80 mt-1">To {totals.youOweCount} people</div>
        </div>

        {/* This Month's Spend */}
        <div className="snap-center shrink-0 w-64 bg-primary-container text-on-primary-container rounded-2xl p-stack-md shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-stack-sm">
            <span className="text-label-caps font-label-caps uppercase opacity-80">Month spend</span>
            <span className="material-symbols-outlined text-xl opacity-80">account_balance_wallet</span>
          </div>
          <div className="font-numeric-display text-numeric-display truncate">
            {formatCurrency(totals.monthSpend)}
          </div>
          <div className="text-body-sm font-body-sm opacity-80 mt-1">Current month</div>
        </div>
      </section>

      {/* Spending Trend Chart - Real Data */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-soft p-stack-md">
        <div className="flex justify-between items-center mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Spending Trend</h2>
          <select className="bg-surface-container text-on-surface-variant text-body-sm font-body-sm rounded-lg px-2 py-1 outline-none border-none">
            <option>This Month</option>
          </select>
        </div>
        <div className="w-full h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={totals.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#142175" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#142175" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                formatter={(value) => [`${formatCurrency(value * 100)}`, 'Total Spent']}
                labelFormatter={(label) => `Day ${label}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#142175" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="mt-stack-sm flex flex-col gap-stack-sm">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-headline-md text-headline-md text-on-surface">Recent Activity</h2>
          <button className="text-primary font-label-caps text-label-caps uppercase tracking-wider">View All</button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-stack-lg flex flex-col items-center justify-center text-center shadow-soft">
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-stack-md text-outline">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-2">No activity yet</p>
            <p className="font-body-sm text-body-sm text-outline">Tap + to start tracking your expenses and IOUs.</p>
          </div>
        ) : (
          recentActivity.map(item => {
            if (item.type === 'expense') {
              return (
                <div key={item.id} onClick={() => handleTransactionClick(item)} className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-soft flex items-center justify-between transition-transform active:scale-[0.98] cursor-pointer hover:bg-surface-container-lowest/80">
                  <div className="flex items-center gap-stack-md">
                    <div className="w-12 h-12 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">receipt</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-lg text-body-lg text-on-surface font-medium truncate max-w-[140px]">{item.note || item.category}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(item.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                  </div>
                  <div className="font-numeric-display text-headline-md text-error flex flex-col items-end shrink-0">
                    {formatCurrency(-item.amount)}
                    <span className="font-label-caps text-label-caps text-outline uppercase mt-1">{item.category}</span>
                  </div>
                </div>
              );
            } else if (item.type === 'iou') {
              const isPositive = item.direction === 'they_owe_you';
              const person = balances.find(p => p.id === item.personId);
              return (
                <div key={item.id} onClick={() => handleTransactionClick(item)} className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-soft flex items-center justify-between transition-transform active:scale-[0.98] cursor-pointer hover:bg-surface-container-lowest/80">
                  <div className="flex items-center gap-stack-md">
                    <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-lg text-body-lg text-on-surface font-medium truncate max-w-[140px]">{item.note || 'IOU'}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                  </div>
                  <div className={`font-numeric-display text-headline-md flex flex-col items-end shrink-0 ${isPositive ? 'text-secondary' : 'text-error'}`}>
                    {formatCurrency(isPositive ? item.amount : -item.amount, true)}
                    <span className="font-label-caps text-label-caps text-outline uppercase mt-1">IOU - {person?.name || 'Unknown'}</span>
                  </div>
                </div>
              );
            } else {
              // settlement
              const person = balances.find(p => p.id === item.personId);
              return (
                <div key={item.id} onClick={() => handleTransactionClick(item)} className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-soft flex items-center justify-between transition-transform active:scale-[0.98] cursor-pointer hover:bg-surface-container-lowest/80">
                  <div className="flex items-center gap-stack-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-lg text-body-lg text-on-surface font-medium truncate max-w-[140px]">Settlement</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(item.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                  </div>
                  <div className="font-numeric-display text-headline-md text-primary flex flex-col items-end shrink-0">
                    {formatCurrency(item.amount)}
                    <span className="font-label-caps text-label-caps text-outline uppercase mt-1">{person?.name || 'Unknown'}</span>
                  </div>
                </div>
              );
            }
          })
        )}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-[88px] right-4 z-50 flex flex-col items-end">
        {/* Expandable Options */}
        <div className={`flex flex-col gap-3 mb-4 items-end transition-all duration-300 ${fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={() => { setFabOpen(false); navigate('/add-iou'); }}
            className="flex items-center gap-3 bg-surface text-on-surface rounded-full py-2 px-4 shadow-elevated transform transition-transform hover:scale-105 active:scale-95"
          >
            <span className="font-label-caps text-label-caps uppercase">Add IOU</span>
            <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">handshake</span>
            </div>
          </button>
          <button 
            onClick={() => { setFabOpen(false); navigate('/add-expense'); }}
            className="flex items-center gap-3 bg-surface text-on-surface rounded-full py-2 px-4 shadow-elevated transform transition-transform hover:scale-105 active:scale-95"
          >
            <span className="font-label-caps text-label-caps uppercase">Add Expense</span>
            <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </button>
        </div>

        {/* Main FAB */}
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full shadow-elevated flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 ${fabOpen ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary text-on-primary'}`}
        >
          <span className="material-symbols-outlined text-3xl transition-transform duration-300" style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>add</span>
        </button>
      </div>

      {/* Action Sheet Modal */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center slide-up" onClick={() => setIsActionSheetOpen(false)}>
          <div className="bg-surface-container-lowest rounded-t-3xl w-full max-w-lg p-6 shadow-elevated" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-6"></div>
            
            <div className="flex flex-col gap-4">
              <h3 className="font-headline-md text-on-surface mb-2 text-center">
                {selectedTransaction?.type === 'expense' ? 'Manage Expense' : 
                 selectedTransaction?.type === 'iou' ? 'Manage IOU' : 'Manage Settlement'}
              </h3>
              
              {selectedTransaction?.type !== 'settlement' && (
                <button 
                  onClick={handleEdit}
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-primary/10 text-primary font-headline-md active:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit Transaction
                </button>
              )}

              <button 
                onClick={handleDelete}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-error/10 text-error font-headline-md active:bg-error/20 transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
                Delete Transaction
              </button>

              <button 
                onClick={() => setIsActionSheetOpen(false)}
                className="flex items-center justify-center w-full py-4 mt-2 font-headline-md text-on-surface-variant active:bg-surface-variant rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

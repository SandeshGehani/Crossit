import { useMemo, useState } from 'react';
import { useExpenses, usePersonBalances } from '../hooks/useData';
import { formatCurrency } from '../utils/formatCurrency';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CATEGORY_COLORS = {
  food: 'var(--secondary)', // #006c49
  transport: '#1967D2',
  subscriptions: '#C5221F',
  shopping: '#E37400',
  other: 'var(--tertiary)'
};

export default function ReportsPage() {
  const { expenses } = useExpenses();
  const balances = usePersonBalances();
  
  const [timeframe, setTimeframe] = useState('MONTH'); // WEEK | MONTH | YEAR

  const stats = useMemo(() => {
    // Current date logic based on timeframe
    // For simplicity, we just filter by current month in this v1
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let totalSpent = 0;
    const categoryTotals = {};
    const dailySpend = {};

    expenses.forEach(exp => {
      if (exp.date.startsWith(currentMonthStr) && !exp.isDeleted) {
        totalSpent += exp.amount;
        
        // Category breakdown
        const cat = exp.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;

        // Daily spend for line chart
        const day = parseInt(exp.date.substring(8, 10), 10);
        dailySpend[day] = (dailySpend[day] || 0) + exp.amount;
      }
    });

    // Format chart data
    const lineData = [];
    let cumulative = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      cumulative += (dailySpend[i] || 0);
      lineData.push({ day: i, amount: cumulative / 100 }); // value in rupees for charting
    }

    const pieData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value);

    // Balances
    let owedToYou = 0;
    let youOwe = 0;
    const topDebtors = [];
    const topCreditors = [];

    balances.forEach(p => {
      if (p.balance > 0) {
        owedToYou += p.balance;
        topDebtors.push(p);
      } else if (p.balance < 0) {
        youOwe += Math.abs(p.balance);
        topCreditors.push(p);
      }
    });

    topDebtors.sort((a, b) => b.balance - a.balance).slice(0, 3);
    topCreditors.sort((a, b) => a.balance - b.balance).slice(0, 3); // most negative first

    return { 
      totalSpent, 
      lineData, 
      pieData, 
      owedToYou, 
      youOwe,
      topDebtors,
      topCreditors
    };
  }, [expenses, balances, timeframe]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-background page-enter pb-32">
      <div className="px-gutter pt-4 pb-6">
        <div className="flex items-center justify-between bg-surface-container-low p-1 rounded-full w-full max-w-sm mx-auto shadow-sm">
          {['WEEK', 'MONTH', 'YEAR'].map(tf => (
            <button 
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 text-center py-2 rounded-full font-label-caps transition-colors ${timeframe === tf ? 'bg-primary shadow-soft text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="px-gutter flex flex-col gap-stack-lg">
        {/* Monthly Spend Chart */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-headline-md text-on-surface">Monthly Spend</h2>
              <p className="font-body-sm text-on-surface-variant mt-1">Current Month</p>
            </div>
            <div className="text-right">
              <p className="font-numeric-display text-primary">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
          
          <div className="h-48 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.lineData}>
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#142175" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#142175' }} 
                />
                <Tooltip 
                  formatter={(value) => [`Rs.${value}`, 'Spent']}
                  labelFormatter={(label) => `Day ${label}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
          {/* Category Breakdown */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-soft p-5 flex flex-col">
            <h2 className="font-headline-md text-on-surface mb-6">Category Breakdown</h2>
            <div className="flex items-center justify-center relative flex-grow mb-6">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.other} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Rs.${value}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-label-caps text-on-surface-variant">TOTAL</span>
                  <span className="font-headline-md text-on-surface">{stats.pieData.length}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {stats.pieData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.other }}></div>
                    <span className="font-body-sm text-on-surface-variant capitalize">{cat.name}</span>
                  </div>
                  <span className="font-body-sm text-on-surface font-medium">
                    {((cat.value / (stats.totalSpent / 100)) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {stats.pieData.length === 0 && (
                <div className="text-center text-on-surface-variant font-body-sm">No spend data</div>
              )}
            </div>
          </section>

          {/* Who Owes What */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-soft p-5">
            <h2 className="font-headline-md text-on-surface mb-6">Top Balances</h2>
            <div className="flex flex-col gap-5">
              {[...stats.topDebtors, ...stats.topCreditors].slice(0, 5).map(person => {
                const isPositive = person.balance > 0;
                // Progress bar width (max out at some reasonable max, or relative to largest balance)
                const maxBalance = Math.max(...balances.map(p => Math.abs(p.balance)));
                const width = maxBalance > 0 ? (Math.abs(person.balance) / maxBalance) * 100 : 0;
                
                return (
                  <div key={person.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface">{person.name}</span>
                      <span className={`font-body-sm font-medium ${isPositive ? 'text-secondary' : 'text-error'}`}>
                        {formatCurrency(isPositive ? person.balance : -person.balance, true)}
                      </span>
                    </div>
                    <div className={`w-full bg-surface-container rounded-full h-2 overflow-hidden flex ${isPositive ? 'justify-end' : 'justify-start'}`}>
                      <div className={`h-full rounded-full ${isPositive ? 'bg-secondary' : 'bg-error'}`} style={{ width: `${width}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {stats.topDebtors.length === 0 && stats.topCreditors.length === 0 && (
                <div className="text-center text-on-surface-variant font-body-sm">No balances</div>
              )}
            </div>
          </section>
        </div>

        {/* Recap */}
        <section className="bg-primary rounded-2xl shadow-soft p-6 text-on-primary">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-[28px]">insights</span>
            <h2 className="font-headline-md text-on-primary">Current Recap</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-on-primary/20">
              <span className="font-body-lg text-primary-fixed-dim">Month Spent</span>
              <span className="font-headline-md text-on-primary">{formatCurrency(stats.totalSpent)}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-on-primary/20">
              <span className="font-body-lg text-primary-fixed-dim">Owed to You</span>
              <span className="font-headline-md text-secondary-fixed-dim">{formatCurrency(stats.owedToYou, true)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-lg text-primary-fixed-dim">You Owe</span>
              <span className="font-headline-md text-tertiary-fixed-dim">{formatCurrency(stats.youOwe, true)}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

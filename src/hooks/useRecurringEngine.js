import { useEffect, useRef } from 'react';
import { useRecurringRules, useExpenses } from './useData';

export function useRecurringEngine() {
  const { rules, updateRule } = useRecurringRules();
  const { addExpense } = useExpenses();
  const processedRules = useRef(new Set());

  useEffect(() => {
    if (!rules || rules.length === 0) return;

    const processRules = async () => {
      const now = new Date();
      
      for (const rule of rules) {
        if (rule.isDeleted || processedRules.current.has(rule.id)) continue;
        processedRules.current.add(rule.id);

        const lastRun = new Date(rule.lastRunDate || rule.startDate);
        let nextRun = new Date(lastRun);

        if (rule.interval === 'weekly') {
          nextRun.setDate(nextRun.getDate() + 7);
        } else if (rule.interval === 'monthly') {
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else if (rule.interval === 'yearly') {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }

        // Keep generating expenses if the nextRun date is in the past
        let expensesCreated = 0;
        let currentRun = new Date(nextRun);

        while (currentRun <= now) {
          // Generate expense
          await addExpense({
            amount: rule.amount,
            category: rule.category,
            paymentMethod: rule.paymentMethod,
            date: currentRun.toISOString(),
            note: `${rule.note} (Auto-generated)`,
            recurringRuleId: rule.id,
          });

          expensesCreated++;
          
          // Increment for next potential run
          if (rule.interval === 'weekly') {
            currentRun.setDate(currentRun.getDate() + 7);
          } else if (rule.interval === 'monthly') {
            currentRun.setMonth(currentRun.getMonth() + 1);
          } else if (rule.interval === 'yearly') {
            currentRun.setFullYear(currentRun.getFullYear() + 1);
          }
        }

        if (expensesCreated > 0) {
          // Update the rule's lastRunDate to the most recent run date we generated
          let newLastRun = new Date(lastRun);
          if (rule.interval === 'weekly') {
            newLastRun.setDate(newLastRun.getDate() + (7 * expensesCreated));
          } else if (rule.interval === 'monthly') {
            newLastRun.setMonth(newLastRun.getMonth() + expensesCreated);
          } else if (rule.interval === 'yearly') {
            newLastRun.setFullYear(newLastRun.getFullYear() + expensesCreated);
          }
          
          updateRule(rule.id, { lastRunDate: newLastRun.toISOString() });
        }
      }
    };

    processRules();
  }, [rules, addExpense, updateRule]);
}

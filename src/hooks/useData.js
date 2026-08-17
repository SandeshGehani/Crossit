import { useState, useEffect, useCallback } from 'react';
import * as store from '../store/firestoreStore';

/**
 * Hook for managing expenses
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onSnapshot('expenses', (docs) => {
      const active = docs
        .filter(d => !d.isDeleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setExpenses(active);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addExpense = useCallback((expense) => {
    return store.addDoc('expenses', {
      amount: expense.amount, // in paisa
      category: expense.category || 'other',
      date: expense.date || new Date().toISOString(),
      note: expense.note || '',
      paymentMethod: expense.paymentMethod || 'cash',
      recurringRuleId: expense.recurringRuleId || null,
      splitId: expense.splitId || null,
      isDeleted: false,
    });
  }, []);

  const updateExpense = useCallback((id, updates) => {
    store.updateDoc('expenses', id, updates);
  }, []);

  const deleteExpense = useCallback((id) => {
    store.softDelete('expenses', id);
    return id;
  }, []);

  const restoreExpense = useCallback((id) => {
    store.restoreDoc('expenses', id);
  }, []);

  return { expenses, loading, addExpense, updateExpense, deleteExpense, restoreExpense };
}

/**
 * Hook for managing people
 */
export function usePeople() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onSnapshot('people', (docs) => {
      const active = docs
        .filter(d => !d.isDeleted)
        .sort((a, b) => a.name?.localeCompare(b.name));
      setPeople(active);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addPerson = useCallback((person) => {
    return store.addDoc('people', {
      name: person.name,
      phone: person.phone || '',
      isDeleted: false,
    });
  }, []);

  const updatePerson = useCallback((id, updates) => {
    store.updateDoc('people', id, updates);
  }, []);

  const deletePerson = useCallback((id) => {
    store.softDelete('people', id);
    return id;
  }, []);

  return { people, loading, addPerson, updatePerson, deletePerson };
}

/**
 * Hook for managing ledger entries (IOUs)
 */
export function useLedgerEntries(personId = null) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onSnapshot('ledgerEntries', (docs) => {
      let active = docs
        .filter(d => !d.isDeleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (personId) {
        active = active.filter(d => d.personId === personId);
      }
      
      setEntries(active);
      setLoading(false);
    });
    return unsubscribe;
  }, [personId]);

  const addEntry = useCallback((entry) => {
    return store.addDoc('ledgerEntries', {
      personId: entry.personId,
      amount: entry.amount, // in paisa
      direction: entry.direction, // 'they_owe_you' or 'you_owe_them'
      note: entry.note || '',
      paymentMethod: entry.paymentMethod || 'cash',
      groupDebtId: entry.groupDebtId || null,
      splitId: entry.splitId || null,
      status: 'open',
      isDeleted: false,
    });
  }, []);

  const updateEntry = useCallback((id, updates) => {
    store.updateDoc('ledgerEntries', id, updates);
  }, []);

  const deleteEntry = useCallback((id) => {
    store.softDelete('ledgerEntries', id);
    return id;
  }, []);

  const restoreEntry = useCallback((id) => {
    store.restoreDoc('ledgerEntries', id);
  }, []);

  return { entries, loading, addEntry, updateEntry, deleteEntry, restoreEntry };
}

/**
 * Hook for managing settlements
 */
export function useSettlements(personId = null) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onSnapshot('settlements', (docs) => {
      let active = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (personId) {
        active = active.filter(d => d.personId === personId);
      }
      
      setSettlements(active);
      setLoading(false);
    });
    return unsubscribe;
  }, [personId]);

  const addSettlement = useCallback((settlement) => {
    const id = store.addDoc('settlements', {
      ledgerEntryId: settlement.ledgerEntryId || null,
      personId: settlement.personId,
      amount: settlement.amount, // in paisa
      date: settlement.date || new Date().toISOString(),
      note: settlement.note || '',
    });
    return id;
  }, []);

  return { settlements, loading, addSettlement };
}

/**
 * Compute the running balance for a person
 * Positive = they owe you, Negative = you owe them
 */
export function computeBalance(ledgerEntries, settlements) {
  let balance = 0;

  ledgerEntries.forEach(entry => {
    if (entry.isDeleted) return;
    const amount = entry.amount || 0;
    if (entry.direction === 'they_owe_you') {
      balance += amount;
    } else if (entry.direction === 'you_owe_them') {
      balance -= amount;
    }
  });

  settlements.forEach(settlement => {
    balance -= settlement.amount || 0;
  });

  return balance;
}

/**
 * Hook for combined balance data per person
 */
export function usePersonBalances() {
  const { people } = usePeople();
  const { entries: allEntries } = useLedgerEntries();
  const { settlements: allSettlements } = useSettlements();

  const balances = people.map(person => {
    const personEntries = allEntries.filter(e => e.personId === person.id);
    const personSettlements = allSettlements.filter(s => s.personId === person.id);
    const balance = computeBalance(personEntries, personSettlements);
    
    // Find most recent activity
    const allDates = [
      ...personEntries.map(e => e.createdAt),
      ...personSettlements.map(s => s.createdAt),
    ].sort().reverse();

    const lastActivity = allDates[0] || person.createdAt;
    const lastNote = personEntries[0]?.note || '';

    return {
      ...person,
      balance,
      lastActivity,
      lastNote,
      entryCount: personEntries.length,
      isSettled: balance === 0 && personEntries.length > 0,
    };
  });
  return balances;
}

/**
 * Hook for managing recurring rules
 */
export function useRecurringRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onSnapshot('recurringRules', (docs) => {
      const active = docs.filter(d => !d.isDeleted);
      setRules(active);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addRule = useCallback((rule) => {
    return store.addDoc('recurringRules', {
      ...rule,
      isDeleted: false,
    });
  }, []);

  const updateRule = useCallback((id, updates) => {
    store.updateDoc('recurringRules', id, updates);
  }, []);

  const deleteRule = useCallback((id) => {
    store.softDelete('recurringRules', id);
  }, []);

  return { rules, loading, addRule, updateRule, deleteRule };
}

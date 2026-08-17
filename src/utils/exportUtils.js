import { unparse } from 'papaparse';
import * as store from '../store/firestoreStore';
import { formatCurrency } from './formatCurrency';

/**
 * Triggers a file download in the browser
 */
function downloadFile(content, fileName, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Export all expenses and ledger entries to CSV
 */
export function exportToCSV() {
  const expenses = store.getDocs('expenses').map(e => ({
    Type: 'Expense',
    Date: new Date(e.date || e.createdAt).toLocaleDateString(),
    Category: e.category,
    Amount: (e.amount / 100).toFixed(2),
    Note: e.note,
    'Payment Method': e.paymentMethod,
    'Person': ''
  }));

  const people = store.getDocs('people');
  const peopleMap = {};
  people.forEach(p => peopleMap[p.id] = p.name);

  const entries = store.getDocs('ledgerEntries').map(e => {
    const isPositive = e.direction === 'they_owe_you';
    return {
      Type: 'IOU',
      Date: new Date(e.createdAt).toLocaleDateString(),
      Category: 'N/A',
      Amount: ((isPositive ? e.amount : -e.amount) / 100).toFixed(2),
      Note: e.note || (isPositive ? 'They owe you' : 'You owe them'),
      'Payment Method': e.paymentMethod || 'N/A',
      'Person': peopleMap[e.personId] || 'Unknown'
    };
  });

  const settlements = store.getDocs('settlements').map(s => {
    return {
      Type: 'Settlement',
      Date: new Date(s.date || s.createdAt).toLocaleDateString(),
      Category: 'N/A',
      Amount: (s.amount / 100).toFixed(2),
      Note: s.note || 'Settled up',
      'Payment Method': 'N/A',
      'Person': peopleMap[s.personId] || 'Unknown'
    };
  });

  const combined = [...expenses, ...entries, ...settlements].sort((a, b) => new Date(b.Date) - new Date(a.Date));
  
  const csv = unparse(combined);
  downloadFile(csv, `Crossit_Export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export raw JSON backup
 */
export function exportJSONBackup() {
  const data = store.exportAllData();
  downloadFile(data, `Crossit_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

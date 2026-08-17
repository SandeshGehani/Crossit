/**
 * Local data store using localStorage
 * Provides a Firestore-like API so we can swap to Firestore later.
 * All data persists across browser sessions.
 */

const STORAGE_PREFIX = 'crossledger_';

function getCollection(name) {
  const data = localStorage.getItem(STORAGE_PREFIX + name);
  return data ? JSON.parse(data) : {};
}

function saveCollection(name, data) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Event system for real-time updates (simulates Firestore onSnapshot)
const listeners = {};

function notifyListeners(collection) {
  if (listeners[collection]) {
    const data = getCollection(collection);
    const docs = Object.entries(data).map(([id, doc]) => ({ id, ...doc }));
    listeners[collection].forEach(callback => callback(docs));
  }
}

/**
 * Subscribe to collection changes
 * @param {string} collection - Collection name
 * @param {Function} callback - Called with array of docs on every change
 * @returns {Function} Unsubscribe function
 */
export function onSnapshot(collection, callback) {
  if (!listeners[collection]) {
    listeners[collection] = [];
  }
  listeners[collection].push(callback);
  
  // Immediately fire with current data
  const data = getCollection(collection);
  const docs = Object.entries(data).map(([id, doc]) => ({ id, ...doc }));
  callback(docs);
  
  // Return unsubscribe function
  return () => {
    listeners[collection] = listeners[collection].filter(cb => cb !== callback);
  };
}

/**
 * Add a document to a collection
 * @param {string} collection - Collection name
 * @param {Object} doc - Document data
 * @returns {string} Generated document ID
 */
export function addDoc(collection, doc) {
  const id = generateId();
  const data = getCollection(collection);
  data[id] = {
    ...doc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCollection(collection, data);
  notifyListeners(collection);
  return id;
}

/**
 * Update a document
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update
 */
export function updateDoc(collection, id, updates) {
  const data = getCollection(collection);
  if (data[id]) {
    data[id] = {
      ...data[id],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveCollection(collection, data);
    notifyListeners(collection);
  }
}

/**
 * Get a single document
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @returns {Object|null} Document data with id
 */
export function getDoc(collection, id) {
  const data = getCollection(collection);
  return data[id] ? { id, ...data[id] } : null;
}

/**
 * Get all documents in a collection (non-deleted only)
 * @param {string} collection - Collection name
 * @returns {Array} Array of documents with ids
 */
export function getDocs(collection) {
  const data = getCollection(collection);
  return Object.entries(data)
    .map(([id, doc]) => ({ id, ...doc }))
    .filter(doc => !doc.isDeleted);
}

/**
 * Get ALL documents including soft-deleted
 */
export function getAllDocs(collection) {
  const data = getCollection(collection);
  return Object.entries(data).map(([id, doc]) => ({ id, ...doc }));
}

/**
 * Soft-delete a document
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 */
export function softDelete(collection, id) {
  updateDoc(collection, id, { isDeleted: true });
}

/**
 * Restore a soft-deleted document
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 */
export function restoreDoc(collection, id) {
  updateDoc(collection, id, { isDeleted: false });
}

/**
 * Hard-delete a document (permanent)
 */
export function hardDelete(collection, id) {
  const data = getCollection(collection);
  delete data[id];
  saveCollection(collection, data);
  notifyListeners(collection);
}

/**
 * Export all data as JSON
 */
export function exportAllData() {
  const collections = ['expenses', 'people', 'ledgerEntries', 'settlements', 'recurringRules', 'splitEvents', 'groupDebts', 'monthlySummaries'];
  const backup = {};
  
  collections.forEach(name => {
    backup[name] = getCollection(name);
  });
  
  return JSON.stringify(backup, null, 2);
}

/**
 * Import data from JSON backup
 * @param {string} jsonString - JSON string of backup data
 */
export function importAllData(jsonString) {
  const backup = JSON.parse(jsonString);
  Object.entries(backup).forEach(([collection, data]) => {
    saveCollection(collection, data);
    notifyListeners(collection);
  });
}

/**
 * Clear all data
 */
export function clearAllData() {
  const collections = ['expenses', 'people', 'ledgerEntries', 'settlements', 'recurringRules', 'splitEvents', 'groupDebts', 'monthlySummaries'];
  collections.forEach(name => {
    localStorage.removeItem(STORAGE_PREFIX + name);
    notifyListeners(name);
  });
}

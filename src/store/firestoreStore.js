import { db } from '../firebase';
import { 
  collection, doc, addDoc as fsAddDoc, updateDoc as fsUpdateDoc, 
  deleteDoc as fsDeleteDoc, getDoc as fsGetDoc, getDocs as fsGetDocs, 
  onSnapshot as fsOnSnapshot 
} from "firebase/firestore";

export function onSnapshot(collectionName, callback) {
  const colRef = collection(db, collectionName);
  return fsOnSnapshot(colRef, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
}

export async function addDoc(collectionName, docData) {
  const colRef = collection(db, collectionName);
  const data = {
    ...docData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const docRef = await fsAddDoc(colRef, data);
  return docRef.id;
}

export async function updateDoc(collectionName, id, updates) {
  const docRef = doc(db, collectionName, id);
  await fsUpdateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function getDoc(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const snap = await fsGetDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getDocs(collectionName) {
  const colRef = collection(db, collectionName);
  const snap = await fsGetDocs(colRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(d => !d.isDeleted);
}

export async function getAllDocs(collectionName) {
  const colRef = collection(db, collectionName);
  const snap = await fsGetDocs(colRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function softDelete(collectionName, id) {
  return updateDoc(collectionName, id, { isDeleted: true });
}

export async function restoreDoc(collectionName, id) {
  return updateDoc(collectionName, id, { isDeleted: false });
}

export async function hardDelete(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await fsDeleteDoc(docRef);
}

// Export and Import might be harder for firestore sync, just returning empty/dummy for now
export async function exportAllData() {
  return JSON.stringify({});
}

export async function importAllData(jsonString) {
  console.log("Importing data is disabled in cloud mode.");
}

export async function clearAllData() {
  console.log("Clearing all data is disabled in cloud mode.");
}

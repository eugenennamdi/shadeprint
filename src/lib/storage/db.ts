import { FieldSession } from '@/types';

const DB_NAME = 'shadeprint_db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_OBSERVATIONS = 'observations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OBSERVATIONS)) {
        const obsStore = db.createObjectStore(STORE_OBSERVATIONS, { keyPath: 'id' });
        obsStore.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ponytail: native IndexedDB handles all offline storage without third-party wrapper dependencies
export async function saveSession(session: FieldSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readwrite');
    const store = tx.objectStore(STORE_SESSIONS);
    const req = store.put(session);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSession(id: string): Promise<FieldSession | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readonly');
    const store = tx.objectStore(STORE_SESSIONS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSessions(): Promise<FieldSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readonly');
    const store = tx.objectStore(STORE_SESSIONS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getLatestSession(): Promise<FieldSession | null> {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return null;
  // Sort descending by startedAt
  sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return sessions[0];
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readwrite');
    const store = tx.objectStore(STORE_SESSIONS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_OBSERVATIONS], 'readwrite');
    tx.objectStore(STORE_SESSIONS).clear();
    tx.objectStore(STORE_OBSERVATIONS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

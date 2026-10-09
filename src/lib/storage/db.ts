import { FieldSession, Observation } from '@/types';

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

// ponytail: native IndexedDB stores sessions and individual observation records atomically
export async function saveSession(session: FieldSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_OBSERVATIONS], 'readwrite');
    const sessionStore = tx.objectStore(STORE_SESSIONS);
    const obsStore = tx.objectStore(STORE_OBSERVATIONS);

    // Save session root
    sessionStore.put(session);

    // Save individual observations to allow direct querying and avoid orphans
    if (session.observations && session.observations.length > 0) {
      for (const obs of session.observations) {
        obsStore.put(obs);
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveObservation(observation: Observation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OBSERVATIONS], 'readwrite');
    const store = tx.objectStore(STORE_OBSERVATIONS);
    const req = store.put(observation);
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

export async function getObservationsBySession(sessionId: string): Promise<Observation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_OBSERVATIONS], 'readonly');
    const store = tx.objectStore(STORE_OBSERVATIONS);
    const index = store.index('sessionId');
    const req = index.getAll(sessionId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getLatestSession(): Promise<FieldSession | null> {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return null;
  sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return sessions[0];
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_OBSERVATIONS], 'readwrite');
    const sessionStore = tx.objectStore(STORE_SESSIONS);
    const obsStore = tx.objectStore(STORE_OBSERVATIONS);

    // Delete session
    sessionStore.delete(id);

    // Delete related observations via index cursor if IDBKeyRange is available
    if (typeof IDBKeyRange !== 'undefined') {
      try {
        const index = obsStore.index('sessionId');
        const req = index.openKeyCursor(IDBKeyRange.only(id));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            obsStore.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
      } catch (e) {
        console.warn('Could not clean related observations:', e);
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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

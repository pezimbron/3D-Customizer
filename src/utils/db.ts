import { openDB, DBSchema } from 'idb';

interface ModelDB extends DBSchema {
  models: {
    key: string;
    value: {
      id: string;
      data: ArrayBuffer;
    };
  };
}

const DB_NAME = '3d-customizer';
const STORE_NAME = 'models';
const DB_VERSION = 1;

export async function initDB() {
  return openDB<ModelDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveModelData(id: string, data: ArrayBuffer) {
  const db = await initDB();
  await db.put(STORE_NAME, { id, data });
}

export async function getModelData(id: string): Promise<ArrayBuffer | null> {
  const db = await initDB();
  const result = await db.get(STORE_NAME, id);
  return result?.data || null;
}

export async function deleteModelData(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

// New function to list all model IDs in the database
export async function listAllModelIds(): Promise<string[]> {
  const db = await initDB();
  const keys = await db.getAllKeys(STORE_NAME);
  return keys as string[];
}

// New function to get all model data from the database for debugging
export async function getAllModelData(): Promise<{id: string, size: number}[]> {
  const db = await initDB();
  const allData = await db.getAll(STORE_NAME);
  
  // Return a simplified version with just ID and data size (to avoid huge data transfer)
  return allData.map(item => ({
    id: item.id,
    size: item.data.byteLength
  }));
}

// Function to clear the entire database (for debugging/testing)
export async function clearDatabase(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}

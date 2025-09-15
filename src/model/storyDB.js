import { openDB } from "idb";

const DB_NAME = "cerita-db";
const STORE_NAME = "stories";
const PENDING_STORE = "pending-stories";

export async function initDB() {
  return openDB(DB_NAME, 2, { // ⬅️ version 2
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          db.createObjectStore(PENDING_STORE, { keyPath: "id" });
        }
      }
      // kalau butuh migrasi di masa depan (misalnya index baru) bisa ditambah di sini
    },
  });
}

// ====== stories (cache online & guest) ======
export async function saveStory(story) {
  const db = await initDB();
  // story bisa punya photoBuffer (ArrayBuffer) + photoType
  await db.put(STORE_NAME, story);
}

export async function getAllStories() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function deleteStory(id) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

// ====== pending-stories (offline → sync) ======
export async function savePendingStory(story) {
  const db = await initDB();
  await db.put(PENDING_STORE, story);
}

export async function getAllPendingStories() {
  const db = await initDB();
  return db.getAll(PENDING_STORE);
}

export async function deletePendingStory(id) {
  const db = await initDB();
  return db.delete(PENDING_STORE, id);
}

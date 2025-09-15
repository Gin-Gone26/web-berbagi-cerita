// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'cerita-db';
const STORE_NAME = 'stories';
const PENDING_STORE = 'pending-stories';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(PENDING_STORE)) {
      db.createObjectStore(PENDING_STORE, { keyPath: 'id', autoIncrement: true });
    }
  },
});

export const DB = {
  /* ===== Stories dari API (cache read) ===== */
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async saveStories(stories) {
    const tx = (await dbPromise).transaction(STORE_NAME, 'readwrite');
    stories.forEach(story => tx.store.put(story));
    await tx.done;
  },
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },

  /* ===== Pending stories (offline create) ===== */
  async addPending(story) {
    return (await dbPromise).add(PENDING_STORE, story);
  },
  async getPending() {
    return (await dbPromise).getAll(PENDING_STORE);
  },
  async deletePending(id) {
    return (await dbPromise).delete(PENDING_STORE, id);
  },
};

// src/model/ProductModel.js
import storyApi from '../api/storyApi.js';
import { 
  saveStory, 
  getAllStories, 
  deleteStory,
  savePendingStory,
  getAllPendingStories,
  deletePendingStory
} from './storyDB.js';
import { showToast } from '../utils/toast.js';

// helper: konversi File → ArrayBuffer
async function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const LS_KEY = 'jual_token';

export default class ProductModel {
  static setToken(token) {
    localStorage.setItem(LS_KEY, token);
  }
  static getToken() {
    return localStorage.getItem(LS_KEY);
  }
  static clearToken() {
    localStorage.removeItem(LS_KEY);
  }

  // ambil cerita: dari API, kalau gagal → fallback offline
  static async fetchProducts({ useAPI = true } = {}) {
    const token = this.getToken();

    if (useAPI && token) {
      try {
        const data = await storyApi.getStories(token, 1, 50, 1);
        const stories = data.listStory || [];

        for (const s of stories) {
          await saveStory(s);
        }
        return stories;
      } catch (err) {
        console.warn("API gagal, fallback offline:", err);
        return getAllStories();
      }
    }

    return getAllStories();
  }

  // tambah cerita
  static async addProduct({ description, photoFile, lat, lon, guest = false }) {
    const token = this.getToken();

    // simpan foto sebagai buffer supaya aman di IndexedDB
    let photoBuffer = null;
    let photoType = null;
    if (photoFile) {
      photoBuffer = await fileToArrayBuffer(photoFile);
      photoType = photoFile.type || "image/jpeg";
    }

    const storyObj = {
      id: `local-${Date.now()}`,
      name: guest || !token ? "Guest" : "Me",
      description,
      photoBuffer,
      photoType,
      photoUrl: photoFile ? URL.createObjectURL(photoFile) : "",
      createdAt: new Date().toISOString(),
      lat,
      lon,
      token, // simpan juga token biar SW bisa pakai
    };

    if (guest || !token) {
      await saveStory(storyObj);
      showToast("✅ Cerita tersimpan offline (Guest)");
      return { offline: true };
    }

    try {
      const res = await storyApi.addStory({ token, description, photoFile, lat, lon });
      showToast("✅ Cerita berhasil dikirim ke server");
      return res;
    } catch (err) {
      // simpan pending
      await savePendingStory(storyObj);

      // daftar background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.sync.register("sync-new-story");
          console.log("📡 Background sync didaftarkan");
        } catch (syncErr) {
          console.warn("⚠️ Browser tidak support Background Sync", syncErr);
        }
      }

      showToast("⚠️ Cerita tersimpan offline, akan disinkronkan nanti");
      return { offline: true, error: err.message };
    }
  }

  // sinkronisasi manual saat online
  static async syncPendingStories() {
    const token = this.getToken();
    if (!token) return;

    const pendingStories = await getAllPendingStories();
    if (pendingStories.length === 0) {
      showToast("✨ Tidak ada cerita pending untuk disinkronkan");
      return;
    }

    for (const story of pendingStories) {
      try {
        let photoBlob = null;
        if (story.photoBuffer) {
          photoBlob = new Blob([story.photoBuffer], { type: story.photoType });
        }

        await storyApi.addStory({
          token,
          description: story.description,
          photoFile: photoBlob,
          lat: story.lat,
          lon: story.lon,
        });

        await deletePendingStory(story.id);
        showToast(`✅ Sinkronisasi sukses: ${story.description.slice(0, 20)}...`);
      } catch (err) {
        console.warn("⚠️ Sync gagal untuk story:", story.id, err.message);
        showToast(`❌ Gagal sync cerita: ${story.description.slice(0, 20)}...`);
      }
    }
  }
}

// src/presenter/AddPresenter.js
import ProductModel from '../model/ProductModel.js';
import { showToast } from '../utils/toast.js';
import { DB } from '../utils/db.js'; // tambahkan

export default class AddPresenter {
  constructor(view) {
    this.view = view;
  }

  async submit({ description, photoFile, lat, lon, guest = false }) {
    this.view.showSaving();
    try {
      await ProductModel.addProduct({ description, photoFile, lat, lon, guest });
      
      // sukses upload
      showToast('Cerita berhasil diunggah ke server 🎉', 3000, "success");
      this.view.showSaved();

    } catch (err) {
      console.error("AddPresenter submit error:", err);

      // fallback simpan lokal ke IndexedDB
      const story = {
        description,
        lat,
        lon,
        guest,
        photoFile, // bisa Anda konversi ke Blob/Base64 dulu kalau perlu
        createdAt: new Date().toISOString(),
      };
      await DB.addPending(story);

      // daftar background sync agar dikirim saat online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-new-story');
      }

      this.view.showSavedWithWarning(err.message || 'Offline - disimpan lokal');
      showToast(
        'Gagal unggah ke server. Cerita disimpan lokal untuk sinkronisasi.',
        4000,
        "error"
      );
    }
  }
}

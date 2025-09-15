// src/presenter/HomePresenter.js
import ProductModel from '../model/ProductModel.js';

export default class HomePresenter {
  constructor(view) {
    this.view = view;
  }

  async load() {
    try {
      this.view.showLoading();
      // coba fetch online
      const products = await ProductModel.fetchProducts({ useAPI: true });
      this.view.showStories(products);
    } catch (err) {
      try {
        // fallback offline (IndexedDB)
        const products = await ProductModel.fetchProducts({ useAPI: false });
        this.view.showStories(products, { offline: true });
      } catch (offlineErr) {
        // kalau offline store juga kosong → error total
        this.view.showError("Gagal memuat cerita. Silakan coba lagi.");
        console.error("HomePresenter.load error:", err, offlineErr);
      }
    }
  }
}

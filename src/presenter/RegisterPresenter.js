// src/Presenter/RegisterPresenter.js
import storyApi from '../api/storyApi.js';

export default class RegisterPresenter {
  constructor(view) {
    this.view = view;
  }

  async handleRegister({ name, email, password }) {
    try {
      const result = await storyApi.register(name, email, password);

      if (result?.error === false) {
        this.view.showSuccess('Registrasi berhasil! Silakan login.');
        this.view.navigateTo('/login');
      } else {
        this.view.showError(result?.message || 'Registrasi gagal.');
      }
    } catch (err) {
      this.view.showError(err.message || 'Terjadi kesalahan saat registrasi.');
    }
  }
}

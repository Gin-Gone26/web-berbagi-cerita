import storyApi from '../api/storyApi.js';
import ProductModel from '../model/ProductModel.js';

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
  }

  async handleLogin({ email, password }) {
    try {
      const result = await storyApi.login(email, password);

      if (result?.loginResult?.token) {
        ProductModel.setToken(result.loginResult.token);
        this.view.showSuccess('Login berhasil!');
        this.view.navigateTo('/');
      } else {
        this.view.showError('Login gagal, periksa kembali email/password.');
      }
    } catch (err) {
      this.view.showError(err.message || 'Login gagal.');
    }
  }
}

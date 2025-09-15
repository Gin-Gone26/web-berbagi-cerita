// src/views/LoginView.js
import { showToast } from '../utils/toast.js';
import LoginPresenter from '../presenter/LoginPresenter.js';

export default class LoginView {
  constructor(container) {
    this.container = container;
    this.presenter = new LoginPresenter(this); // langsung inject
  }

  render() {
    this.container.innerHTML = `
      <section aria-labelledby="login-title">
        <h2 id="login-title">Login</h2>
        <form id="login-form">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
          
          <label for="password">Password</label>
          <input id="password" name="password" type="password" required minlength="8" />
          
          <div class="form-actions">
            <button type="submit">Masuk</button>
          </div>
        </form>

        <p>
          Belum punya akun? 
          <a href="#/register" id="go-register">Daftar di sini</a>
        </p>
      </section>
    `;

    // setelah render, bind form ke presenter
    const form = this.container.querySelector('#login-form');
    if (form) {
      this.bindOnSubmit((data) => this.presenter.handleLogin(data));
    }
  }

  bindOnSubmit(handler) {
    const form = this.container.querySelector('#login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value.trim();
      handler({ email, password });
    });
  }

  showError(message) {
    showToast(message || 'Terjadi kesalahan', 4000, 'error');
  }

  showSuccess(message) {
    showToast(message || 'Berhasil', 3000, 'success');
  }

  navigateTo(route) {
    window.location.hash = route;
  }
}

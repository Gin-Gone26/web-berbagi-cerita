// src/views/RegisterView.js
import { showToast } from '../utils/toast.js';
import RegisterPresenter from '../presenter/RegisterPresenter.js';

export default class RegisterView {
  constructor(container) {
    this.container = container;
 
    this.presenter = new RegisterPresenter(this);
  }

  setPresenter(presenter) {
    this.presenter = presenter;
  }

  render() {
    this.container.innerHTML = `
      <section aria-labelledby="register-title">
        <h2 id="register-title">Daftar</h2>
        <form id="register-form">
          <label for="name">Nama</label>
          <input id="name" name="name" type="text" required />

          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />

          <label for="password">Password</label>
          <input id="password" name="password" type="password" required minlength="8" />

          <div class="form-actions">
            <button type="submit">Daftar</button>
          </div>
        </form>

        <p>
          Sudah punya akun? 
          <a href="#/login" id="go-login">Login di sini</a>
        </p>
      </section>
    `;

    const form = this.container.querySelector('#register-form');
    if (form && this.presenter) {
      this.bindOnSubmit((data) => this.presenter.handleRegister(data));
    }
  }

  bindOnSubmit(handler) {
    const form = this.container.querySelector('#register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value.trim();
      handler({ name, email, password });
    });
  }

  showError(message) {
    showToast(message || 'Registrasi gagal', 4000, 'error');
  }

  showSuccess(message) {
    showToast(message || 'Registrasi berhasil!', 3000, 'success');
  }

  navigateTo(route) {
    window.location.hash = route;
  }
}

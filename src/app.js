// src/app.js
import HomeView from './views/HomeView.js';
import HomePresenter from './presenter/HomePresenter.js';
import ProductModel from './model/ProductModel.js';
import OfflineView from './views/OfflineView.js';
import { showToast } from './utils/toast.js';

const routes = {
  '/': 'home',
  '/add': 'add',
  '/login': 'login',
  '/register': 'register',
  '/offline': 'offline',
};

function startViewTransition(updateFn) {
  if (document.startViewTransition) {
    return document.startViewTransition(updateFn);
  } else {
    const app = document.querySelector('#app');
    app.classList.add('fade');
    const p = updateFn();
    setTimeout(() => app.classList.remove('fade'), 300);
    return p;
  }
}

export default function router() {
  const path = location.hash.replace('#', '') || '/';
  const viewKey = routes[path] || 'notfound';
  const app = document.querySelector('#app');

  startViewTransition(() => {
    app.innerHTML = ''; // clear previous content
    const container = document.createElement('div');
    app.appendChild(container);

    if (viewKey === 'home') {
      const view = new HomeView(container);
      const presenter = new HomePresenter(view);
      view.setPresenter?.(presenter);
      view.render?.();
      presenter.load();

    } else if (viewKey === 'add') {
      if (!ProductModel.getToken()) {
        alert('Silakan login terlebih dahulu untuk menambah cerita.');
        window.location.hash = '/login';
        return;
      }

      Promise.all([
        import('./views/AddView.js'),
        import('./presenter/AddPresenter.js'),
      ]).then(([viewModule, presenterModule]) => {
        const AddView = viewModule.default;
        const AddPresenter = presenterModule.default;

        const view = new AddView(container);
        const presenter = new AddPresenter(view);
        view.setPresenter(presenter);
        view.render();

        const stopHandler = () => {
          if (typeof view.stopCamera === 'function') {
            view.stopCamera();
          }
          window.removeEventListener('hashchange', stopHandler);
        };
        window.addEventListener('hashchange', stopHandler);
      });

    } else if (viewKey === 'login') {
      if (ProductModel.getToken()) {
        alert('Anda sudah login.');
        window.location.hash = '/';
        return;
      }
      import('./views/LoginView.js').then((viewModule) => {
        const LoginView = viewModule.default;
        const view = new LoginView(container);
        view.render(); 
      });

    } else if (viewKey === 'register') {
      import('./views/RegisterView.js').then((viewModule) => {
        const RegisterView = viewModule.default;
        const view = new RegisterView(container);
        view.render();
      });

    } else if (viewKey === 'offline') {
      const view = new OfflineView(container);
      view.render();

    } else {
      container.innerHTML = `<h2>Halaman tidak ditemukan</h2>`;
    }
  });
}



document.addEventListener('click', (e) => {
  if (e.target.id === 'logout-btn') {
    ProductModel.clearToken();

    if (!navigator.onLine) {
      showToast('📴 Anda logout dalam mode offline.', 4000, "warning");
      window.location.hash = '/offline';
    } else {
      showToast('✅ Anda sudah logout.', 3000, "info");
      window.location.hash = '/login';
    }
  }
});



// 🔄 Listener: saat kembali online, sinkronisasi cerita pending
window.addEventListener('online', () => {
  console.log("🌐 Koneksi kembali online, mencoba sinkronisasi...");
  ProductModel.syncPendingStories();
});

// 📴 Listener: saat kehilangan koneksi, buka halaman offline
window.addEventListener('offline', () => {
  console.log("📴 Kamu sedang offline, buka halaman offline.");
  window.location.hash = '/offline';
});


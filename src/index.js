// src/index.js
import './style.css';
import router from './app';
import 'leaflet/dist/leaflet.css';
import ProductModel from './model/ProductModel.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { showToast } from './utils/toast.js';
import { subscribeForPush, unsubscribeFromPush } from './utils/pushManager.js';

function updateAuthUI() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  nav.innerHTML = `
    <a href="#/">Home</a>
    <a href="#/add">Tambah Cerita</a>
    ${
      ProductModel.getToken()
        ? `<button id="logout-btn">Logout</button>`
        : `<a href="#/login">Login</a>`
    }
  `;

  const modal = document.getElementById('navModal');
  if (modal) {
    const modalContent = modal.querySelector('.nav-modal-content');
    modalContent.innerHTML = `
      <button class="close-modal" aria-label="Tutup Menu">&times;</button>
      <a href="#/">Home</a>
      <a href="#/add">Tambah Cerita</a>
      ${
        ProductModel.getToken()
          ? `<button id="logout-btn">Logout</button>`
          : `<a href="#/login">Login</a>`
      }
    `;
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ProductModel.clearToken();
      showToast('Anda sudah logout.', 3000, "info");
      window.location.hash = '/login';
      updateAuthUI();
    });
  }

  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      e.preventDefault();
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          window.location.href = href;
        });
      } else {
        document.body.classList.add("fade");
        setTimeout(() => {
          window.location.href = href;
        }, 250);
      }
    });
  });
}

// 🔥 Mobile menu
function bindMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navModal = document.getElementById('navModal');
  if (!menuToggle || !navModal) {
    console.warn('⚠️ menuToggle atau navModal tidak ditemukan');
    return;
  }

  console.log('✅ Mobile menu binding aktif');

  menuToggle.addEventListener('click', () => {
    console.log('👉 Tombol hamburger diklik');
    navModal.classList.add('active');
  });

  navModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || e.target.id === 'navModal') {
      console.log('❌ Modal ditutup via backdrop / tombol X');
      navModal.classList.remove('active');
    }
    if (e.target.tagName === 'A') {
      console.log('🔗 Klik link dalam modal → tutup modal');
      navModal.classList.remove('active');
    }
  });
}

// ✅ Tunggu tombol notif sampai muncul
function waitForNotifButton() {
  return new Promise((resolve) => {
    const check = () => {
      const btn = document.getElementById("btn-toggle-notif");
      if (btn) {
        resolve(btn);
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

// ✅ Fix subscribe/unsubscribe pakai fungsi yg benar + toast feedback
async function updateNotifButton() {
  const btn = await waitForNotifButton();
  const token = ProductModel.getToken();

  // 👉 Kalau belum login, sembunyikan tombol
  if (!token) {
    btn.style.display = "none";
    return;
  } else {
    btn.style.display = "inline-block";
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub) {
    btn.textContent = "🔕 Matikan Notifikasi";
    btn.onclick = async () => {
      try {
        await unsubscribeFromPush(token);
        showToast("🔕 Notifikasi dimatikan", 3000, "info");
        await updateNotifButton();
      } catch (err) {
        console.error("❌ Gagal unsubscribe:", err);
        showToast("❌ Gagal menonaktifkan notifikasi", 3000, "error");
      }
    };
  } else {
    btn.textContent = "🔔 Aktifkan Notifikasi";
    btn.onclick = async () => {
      try {
        await subscribeForPush(token);
        showToast("🔔 Notifikasi diaktifkan", 3000, "success");
        await updateNotifButton();
      } catch (err) {
        console.error("❌ Gagal subscribe:", err);
        showToast("❌ Gagal mengaktifkan notifikasi", 3000, "error");
      }
    };
  }
}


// initial render
window.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  bindMobileMenu();
  await router();
  await updateNotifButton();

  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = skipLink.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus();
      }
    });
  }
});

// route changes
window.addEventListener('hashchange', async () => {
  updateAuthUI();
  await router();
  await updateNotifButton();
});

// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ SW registered', reg);

      if ('SyncManager' in window) {
        try {
          const regReady = await navigator.serviceWorker.ready;
          await regReady.sync.register('sync-new-story');
          console.log('✅ Background sync registered');
        } catch (err) {
          console.warn('⚠️ Gagal register sync:', err);
        }
      }
    } catch (err) {
      console.error('❌ SW gagal:', err);
    }
  });
}

window.addEventListener("online", () => {
  ProductModel.syncPendingStories();
});

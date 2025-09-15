// src/views/HomeView.js

import { subscribeForPush, unsubscribeFromPush } from "../utils/pushManager.js";

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HomePresenter from '../presenter/HomePresenter.js';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createProductCard = (p) => {
  const name = p.name || 'Seller';
  const desc = p.description
    ? p.description.length > 120
      ? p.description.slice(0, 117) + '...'
      : p.description
    : '';
  const date = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
  const img = p.photoUrl || '';
  return `
    <article class="card" data-id="${p.id}" tabindex="0" role="article" aria-label="${name}">
      <div class="card-media">
        ${
          img
            ? `<img src="${img}" alt="Foto ${name}" loading="lazy">`
            : `<div class="empty-image" aria-hidden="true"></div>`
        }
      </div>
      <div class="card-body">
        <h3>${name}</h3>
        <p class="desc">${desc}</p>
        <p class="meta">${date}</p>
        <button class="detail-btn" data-id="${p.id}">Lihat Detail</button>
      </div>
    </article>
  `;
};

export default class HomeView {
  constructor(container) {
    this.container = container;
    this.map = null;
    this.products = [];
    this.presenter = new HomePresenter(this);
  }

  showLoading() {
    this.container.innerHTML = `<div class="loading">Memuat cerita...</div>`;
  }

  render(products = [], opts = {}) {
    this.products = products;
    const offlineBadge = opts.offline ? `<div class="offline-badge">Offline mode</div>` : '';
    this.container.innerHTML = `
      <section aria-labelledby="home-title">
        <h2 id="home-title">Cerita</h2>
  
        ${offlineBadge}
            <div class="notif-section">
     <button id="btn-toggle-notif">🔔 Aktifkan Notifikasi</button>
     </div>
        <div id="grid" class="product-grid" aria-live="polite">
          ${products.map((p) => createProductCard(p)).join('')}
        </div>
        <h3>Lokasi Foto</h3>
        <div id="map" class="map" role="region" aria-label="Peta lokasi Foto"></div>
      </section>

      <!-- Modal Detail -->
      <div id="detailModal" class="modal hidden" role="dialog" aria-modal="true">
        <div class="modal-content">
          <button class="close-modal">&times;</button>
          <div id="detailBody"></div>
        </div>
      </div>
    `;
    this.initMap(products);
    this.bindDetailButtons();
    this.bindNotifToggle();

  }

  // 👇 tambahan supaya bisa dipanggil dari presenter
  showStories(stories, opts = {}) {
    this.render(stories, opts);
  }

  showError(message) {
    this.container.innerHTML = `<div class="error">${message}</div>`;
  }

  bindDetailButtons() {
    const grid = this.container.querySelector('#grid');
    const modal = this.container.querySelector('#detailModal');
    const detailBody = this.container.querySelector('#detailBody');
    const closeBtn = modal.querySelector('.close-modal');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.detail-btn');
      if (!btn) return;

      const id = btn.dataset.id;
      const p = this.products.find((x) => x.id == id);
      if (!p) return;

      detailBody.innerHTML = `
        <h3>${p.name || 'Seller'}</h3>
        <p><strong>Tanggal:</strong> ${p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</p>
        ${
          p.photoUrl
            ? `<img src="${p.photoUrl}" 
                alt="${p.name || 'Cerita'}" 
                style="max-width:100%;margin:8px 0;" 
                loading="lazy">`
            : ''
        }
        <p>${p.description || '-'}</p>
        ${
          p.lat && p.lon
            ? `<button type="button" id="open-map" data-lat="${p.lat}" data-lon="${p.lon}">Lihat di Google Maps</button>`
            : ''
        }
      `;
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target.id === 'open-map') {
        const lat = e.target.dataset.lat;
        const lon = e.target.dataset.lon;
        window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
      }
    });
  }

  bindNotifToggle() {
  const btn = document.getElementById("btn-toggle-notif");
  if (!btn) return;

  const isOn = localStorage.getItem("push-subscribed") === "true";
  btn.textContent = isOn ? "🔕 Nonaktifkan Notifikasi" : "🔔 Aktifkan Notifikasi";
  btn.setAttribute("aria-pressed", isOn ? "true" : "false");

  btn.addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return alert("Silakan login dahulu untuk aktifkan notifikasi.");

      const isSubscribed = localStorage.getItem("push-subscribed") === "true";
      if (!isSubscribed) {
        await subscribeForPush(token);
        btn.textContent = "🔕 Nonaktifkan Notifikasi";
        btn.setAttribute("aria-pressed", "true");
      } else {
        await unsubscribeFromPush(token);
        btn.textContent = "🔔 Aktifkan Notifikasi";
        btn.setAttribute("aria-pressed", "false");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status notifikasi: " + err.message);
    }
  });
}


  initMap(products) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.map = L.map('map', {
      center: [0, 0],
      zoom: 2,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
    }).addTo(this.map);

    const markers = [];
    products
      .filter((p) => p.lat && p.lon)
      .forEach((p) => {
        const m = L.marker([p.lat, p.lon]).addTo(this.map);
        const popupContent = `
          <strong>${p.name || 'Seller'}</strong><br>
          <small>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</small>
          <p>${(p.description || '').slice(0, 120)}...</p>
          ${
            p.photoUrl
              ? `<img src="${p.photoUrl}" 
                  alt="${p.name || 'Cerita'}" 
                  style="width:140px;height:auto;display:block;margin-top:6px;" 
                  loading="lazy">`
              : ''
          }
        `;
        m.bindPopup(popupContent);
        markers.push(m);
      });

    if (markers.length) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => this.map.invalidateSize(), 200);
  }
}

// src/views/AddView.js
import AddPresenter from '../presenter/AddPresenter.js';
import ProductModel from '../model/ProductModel.js';
import L from 'leaflet';
import { showToast } from '../utils/toast.js';

export default class AddView {
  constructor(container) {
    this.container = container;
    this.presenter = new AddPresenter(this);
    this.presenter = null;
    this.videoStream = null;
    this.photoFile = null;
    this.map = null;
    this.marker = null;
    
  }

    setPresenter(presenter) {
    this.presenter = presenter;
  }

  render() {
    this.container.innerHTML = `
      <section aria-labelledby="add-title">
        <h2 id="add-title">Tambah Cerita</h2>
        <form id="add-form">
          <fieldset>
            <legend>Foto</legend>

            <div class="camera-area">
              <video id="camera" autoplay playsinline width="320" height="200" aria-hidden="true"></video>
              <canvas id="capture" style="display:none"></canvas>
            </div>

            <div class="controls">
              <label for="camera-select">Pilih Kamera:</label>
              <select id="camera-select"></select>
            </div>

            <div class="controls">
              <button type="button" id="start-camera">
                <i class="fa-solid fa-video"></i>
                <span class="btn-label">Buka Kamera</span>
              </button>
              <button type="button" id="take-photo" disabled>
                <i class="fa-solid fa-camera"></i>
                <span class="btn-label">Ambil Foto</span>
              </button>
              <button type="button" id="stop-camera" disabled>
                <i class="fa-solid fa-power-off"></i>
                <span class="btn-label">Matikan Kamera</span>
              </button>
            </div>

            <p>Atau pilih dari file:</p>
            <label class="file-upload">
              <i class="fa-solid fa-upload"></i>
              <span class="btn-label">Pilih File</span>
              <input type="file" id="file-input" accept="image/*" hidden />
            </label>

            <div id="photo-preview" aria-live="polite"></div>
            <p class="hint">Ukuran foto max 1MB. Jika lebih besar, akan dikompres otomatis.</p>
          </fieldset>

          <label for="description">Cerita Foto</label>
          <textarea id="description" name="description" required aria-required="true" rows="3"></textarea>

          <fieldset>
            <legend>Pilih Lokasi (Klik pada peta)</legend>
            <div id="mini-map" class="map-small" role="application" aria-label="Pilih lokasi"></div>
            <p id="coords" class="coords">Belum dipilih</p>
          </fieldset>

          <div class="form-actions">
            <button type="submit">Kirim</button>
            <button type="button" id="save-guest">Kirim tanpa login (guest)</button>
          </div>
        </form>
      </section>
    `;
    this.bind();
    this.initMiniMap();
  }

    stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;

      const startBtn = this.container.querySelector('#start-camera');
      const takeBtn = this.container.querySelector('#take-photo');
      const stopBtn = this.container.querySelector('#stop-camera');

      if (startBtn && takeBtn && stopBtn) {
        startBtn.disabled = false;
        takeBtn.disabled = true;
        stopBtn.disabled = true;
      }
    }
  }

showSaving() {
    showToast('Menyimpan...', 2000, "info");
  }
  showSaved() {
    showToast('Berhasil tersimpan', 3000, "success");
    window.location.hash = '/';
  }
  showSavedWithWarning(msg) {
    showToast(`Disimpan lokal: ${msg}`, 4000, "error");
    window.location.hash = '/';
  }


_showToast(msg) {
  showToast(msg);
}


  bind() {
    const startBtn = this.container.querySelector('#start-camera');
    const takeBtn = this.container.querySelector('#take-photo');
    const stopBtn = this.container.querySelector('#stop-camera');
    const video = this.container.querySelector('#camera');
    const canvas = this.container.querySelector('#capture');
    const preview = this.container.querySelector('#photo-preview');
    const fileInput = this.container.querySelector('#file-input');
    const form = this.container.querySelector('#add-form');
    const coordsEl = this.container.querySelector('#coords');
    const cameraSelect = this.container.querySelector('#camera-select');
    let lat = null, lon = null;

    // isi dropdown kamera
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      cameraSelect.innerHTML = videoDevices.map(
        d => `<option value="${d.deviceId}">${d.label || 'Kamera'}</option>`
      ).join('');
    });

    // pilih file manual
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 1024 * 1024) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        const canvasTmp = document.createElement('canvas');
        const ctx = canvasTmp.getContext('2d');
        const maxWidth = 1024;
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        canvasTmp.width = img.width * ratio;
        canvasTmp.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvasTmp.width, canvasTmp.height);

        const blob = await new Promise((resolve) =>
          canvasTmp.toBlob(resolve, 'image/jpeg', 0.8)
        );
        this.photoFile = new File([blob], `upload_${Date.now()}.jpg`, { type: blob.type });
      } else {
        this.photoFile = file;
      }

preview.innerHTML = `<img src="${URL.createObjectURL(this.photoFile)}" 
  alt="Preview foto" 
  style="max-width:100%;" 
  loading="lazy">`;
      showToast('Foto berhasil dimuat', 2000, "success");
        });

    // buka kamera
    startBtn.addEventListener('click', async () => {
      try {
        const deviceId = cameraSelect.value;
        const constraints = deviceId
          ? { video: { deviceId: { exact: deviceId } } }
          : { video: true };

        this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);

        video.srcObject = this.videoStream;
        await video.play();

        takeBtn.disabled = false;
        stopBtn.disabled = false;
        startBtn.disabled = true;
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        showToast('Tidak bisa mengakses kamera: ' + (err.message || err), 4000, "error");
      }
    });

    // ambil foto
    takeBtn.addEventListener('click', async () => {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const blob = await this._compressCanvasToBlob(canvas, 0.8, 1024);
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type });
      this.photoFile = file;
preview.innerHTML = `<img src="${URL.createObjectURL(file)}" 
  alt="Preview foto" 
  style="max-width:100%;" 
  loading="lazy">`;

      showToast('Foto berhasil diambil', 2000, "success");    });

    // stop kamera
    stopBtn.addEventListener('click', () => {
      this.stopCamera();
      showToast('Kamera dimatikan', 2000, "info");
    });

     // submit form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = form.description.value.trim();
      if (!description) {
        showToast('Deskripsi wajib diisi', 3000, "error");
        return;
      }
      if (!this.photoFile) {
        showToast('Foto wajib diambil', 3000, "error");
        return;
      }
      await this.presenter.submit({ description, photoFile: this.photoFile, lat, lon, guest: false });
    });

    // submit guest
    this.container.querySelector('#save-guest').addEventListener('click', async () => {
      const description = form.description.value.trim();
      if (!description) {
        showToast('Deskripsi wajib diisi', 3000, "error");
        return;
      }
      if (!this.photoFile) {
        showToast('Foto wajib diambil', 3000, "error");
        return;
      }
      await this.presenter.submit({ description, photoFile: this.photoFile, lat, lon, guest: true });
    });

   // map coords setter
    this._setCoordsSetter((a, b) => {
      lat = a;
      lon = b;
      coordsEl.textContent = `Lat: ${a.toFixed(5)}, Lon: ${b.toFixed(5)}`;
      showToast('Lokasi dipilih', 2000, "info");
    });
  }

  async _compressCanvasToBlob(canvas, quality = 0.9, maxWidth = 1024) {
    const w = canvas.width, h = canvas.height;
    const ratio = w > maxWidth ? maxWidth / w : 1;
    if (ratio !== 1) {
      const c2 = document.createElement('canvas');
      c2.width = Math.round(w * ratio);
      c2.height = Math.round(h * ratio);
      c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
      return new Promise((resolve) => c2.toBlob(resolve, 'image/jpeg', quality));
    }
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  initMiniMap() {
  if (this.map) this.map.remove();

  this.map = L.map('mini-map', {
    center: [0, 0],
    zoom: 2,
    attributionControl: false
  });

  // base layers
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  });

  const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© Carto'
  });

  const satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google'
  });

  // tambahkan default layer
  osm.addTo(this.map);

  // control untuk ganti-ganti layer
  const baseMaps = {
    "OpenStreetMap": osm,
    "Dark Mode": dark,
    "Satellite": satellite
  };
  L.control.layers(baseMaps).addTo(this.map);

  // event klik untuk set marker
  this.map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (this.marker) this.marker.setLatLng([lat, lng]);
    else this.marker = L.marker([lat, lng]).addTo(this.map);
    if (this._setCoords) this._setCoords(lat, lng);
  });

  // auto fokus ke posisi user
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => this.map.setView([pos.coords.latitude, pos.coords.longitude], 12),
      () => {}
    );
  }
}


  _setCoordsSetter(fn) {
    this._setCoords = fn;
  }
}

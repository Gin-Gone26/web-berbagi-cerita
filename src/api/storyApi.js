// src/api/storyApi.js
const BASE = 'https://story-api.dicoding.dev/v1';

async function request(url, opts = {}) {
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.error) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.info = json;
    throw err;
  }

  return json;
}

const storyApi = {
  async login(email, password) {
    return request(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name, email, password) {
    return request(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
  },

  async getStories(token, page = 1, size = 50, location = 1) {
    return request(`${BASE}/stories?page=${page}&size=${size}&location=${location}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addStory({ token, description, photoFile, lat, lon }) {
    const form = new FormData();
    form.append('description', description);

    if (photoFile) {
      form.append('photo', photoFile, photoFile.name || 'photo.jpg');
    }

    if (typeof lat !== 'undefined') form.append('lat', lat);
    if (typeof lon !== 'undefined') form.append('lon', lon);

    return request(`${BASE}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  },
};

export default storyApi;

import { getAllStories } from "../model/storyDB.js";

export default class OfflineView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <section class="offline">
        <h2>📴 Mode Offline</h2>
        <p>Kamu sedang offline. Berikut cerita yang sudah tersimpan di perangkat:</p>
        <div id="offline-stories" class="story-list"></div>
      </section>
    `;

    const stories = await getAllStories();
    const listEl = this.container.querySelector("#offline-stories");

    if (!stories || stories.length === 0) {
      listEl.innerHTML = `<p>Belum ada cerita tersimpan offline.</p>`;
      return;
    }

    // tampilkan daftar cerita yang ada di IndexedDB
    stories.forEach((story) => {
      const item = document.createElement("div");
      item.className = "story-item";
      item.innerHTML = `
        <h3>${story.name || "Anonim"}</h3>
        <p>${story.description || "(Tanpa deskripsi)"}</p>
        ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Foto Cerita" />` : ""}
        <button class="delete-btn" data-id="${story.id}">Hapus</button>
      `;
      listEl.appendChild(item);
    });

    // Event hapus
    listEl.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
        if (confirm("Yakin hapus cerita ini dari offline?")) {
          const { deleteStory } = await import("../model/storyDB.js");
          await deleteStory(id);
          this.render(); // re-render
        }
      }
    });
  }
}

// src/utils/toast.js
export function showToast(message, duration = 3000, type = "info") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }

  toast.className = "toast " + type;
  toast.textContent = message;

  // tampilkan
  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("fade-out");

   
    setTimeout(() => {
      toast.classList.remove("fade-out");
    }, 400);
  }, duration);
}

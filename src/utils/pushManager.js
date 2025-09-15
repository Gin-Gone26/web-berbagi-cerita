// src/utils/pushManager.js
// Fungsi ini digunakan oleh UI (toggle button) untuk subscribe/unsubscribe
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
const SUBSCRIBE_ENDPOINT = 'https://story-api.dicoding.dev/v1/notifications/subscribe';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeForPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Browser tidak mendukung Push API / Service Worker');
  }
  const reg = await navigator.serviceWorker.ready;

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Kirim subscription ke Dicoding Story API (harus pakai Bearer token)
  const body = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.getKey ? arrayBufferToBase64(subscription.getKey('p256dh')) : '',
      auth: subscription.getKey ? arrayBufferToBase64(subscription.getKey('auth')) : ''
    }
  };

  const res = await fetch(SUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('Gagal subscribe ke server: ' + errText);
  }

  localStorage.setItem('push-subcribed', 'true');
  return subscription;
}

export async function unsubscribeFromPush(token) {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) {
    localStorage.removeItem('push-subcribed');
    return;
  }

  const endpoint = sub.endpoint;
  // Kirim request DELETE ke endpoint subscribe (payload minimal sesuai API)
  const res = await fetch(SUBSCRIBE_ENDPOINT, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('Gagal unsubscribe di server: ' + errText);
  }

  await sub.unsubscribe();
  localStorage.removeItem('push-subcribed');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

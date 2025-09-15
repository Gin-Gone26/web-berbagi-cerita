// server.js
const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cors = require("cors");

const app = express();

// ✅ Aktifkan CORS khusus untuk origin frontend
app.use(
  cors({
    origin: "http://localhost:8080", // alamat frontend kamu
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());

// 🔑 VAPID Key
const publicVapidKey =
  "BCgepa6dZ08RaD3blb1PzFmvHkKd_3Uu21zYXndR39SfrYljd2GADaJkLJNB2bqbhJr-6pzboqTejfZoAR9AYWo";
const privateVapidKey = "TRnX3HmrOm95koD_9UIcrRUWpPJE7QYbuaY91WuEmcI";

webpush.setVapidDetails(
  "mailto:youremail@example.com",
  publicVapidKey,
  privateVapidKey
);

// Simpan subscription sementara
let subscriptions = [];

// 📌 Endpoint untuk simpan subscription
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  console.log("✅ Subscription diterima:", subscription.endpoint);
  res.status(201).json({ message: "Subscription berhasil disimpan" });
});

// 📌 Endpoint untuk kirim notifikasi ke semua subscriber
app.post("/send-notification", async (req, res) => {
  const payload = JSON.stringify({
    title: "Halo dari server 🚀",
    body: "Ini notifikasi nyata dari Dicoding submission!",
  });

  try {
    await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload).catch((err) => {
          console.error("❌ Gagal kirim:", err);
        })
      )
    );
    res.json({ message: "Notifikasi terkirim!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal kirim notifikasi" });
  }
});

app.listen(4000, () => console.log("✅ Server jalan di http://localhost:4000"));

# Panduan Setup Integrasi Firebase / Firestore

Dokumentasi ini menjelaskan langkah-langkah untuk menghubungkan aplikasi web **Sistem Informasi Data Perkara** dengan database **Cloud Firestore (Firebase)** milik Anda secara real-time.

---

## Langkah 1: Buat Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik **Add project** (Tambah proyek).
3. Masukkan nama project Anda (misal: `Sistem Informasi Data Perkara`) dan ikuti instruksi hingga project selesai dibuat.
4. (Opsional) Google Analytics bisa diaktifkan atau dinonaktifkan sesuai preferensi Anda.

---

## Langkah 2: Buat Database Cloud Firestore
1. Pada menu navigasi kiri di Firebase Console, pilih **Build** > **Firestore Database**.
2. Klik **Create database** (Buat database).
3. Pilih lokasi server database terdekat (misal: `asia-southeast2` untuk Jakarta/Singapore).
4. Pilih mode aturan keamanan:
   - Pilih **Start in test mode** (Mulai dalam mode pengujian) agar aplikasi Anda bisa langsung membaca & menulis data selama proses pengembangan (berlaku 30 hari).
5. Klik **Create**.

---

## Langkah 3: Dapatkan Kredensial Konfigurasi Web App
1. Masuk ke halaman **Project Overview** (Ringkasan Proyek).
2. Klik ikon **Web (`</>`)** di bagian tengah halaman untuk menambahkan aplikasi web baru ke project Anda.
3. Masukkan nama aplikasi Anda (misal: `sistem-informasi-data-perkara`) lalu klik **Register app**.
4. Firebase akan menampilkan objek konfigurasi JavaScript seperti di bawah ini:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Simpan nilai-nilai tersebut untuk diisi pada file konfigurasi lokal di langkah berikutnya.

---

## Langkah 4: Konfigurasi Environment Variables di Lokal (.env)
Aplikasi ini sudah dikonfigurasi untuk membaca kredensial Firebase secara aman dari file `.env`.

1. Di komputer Anda, buat file baru bernama `.env` di **folder root** proyek (sejajar dengan `package.json`). Anda juga dapat menyalin file template `.env.example` yang sudah disediakan:
   ```bash
   cp .env.example .env
   ```
2. Buka file `.env` baru tersebut, lalu isi dengan data kredensial yang didapatkan dari **Langkah 3**:
   ```env
   VITE_FIREBASE_API_KEY=isi_dengan_apiKey_anda
   VITE_FIREBASE_AUTH_DOMAIN=isi_dengan_authDomain_anda
   VITE_FIREBASE_PROJECT_ID=isi_dengan_projectId_anda
   VITE_FIREBASE_STORAGE_BUCKET=isi_dengan_storageBucket_anda
   VITE_FIREBASE_MESSAGING_SENDER_ID=isi_dengan_messagingSenderId_anda
   VITE_FIREBASE_APP_ID=isi_dengan_appId_anda
   ```
3. Simpan file `.env` tersebut.

---

## Langkah 5: Atur Aturan Keamanan (Rules) Firestore
Agar aplikasi dapat membaca dan menyimpan berkas tanpa hambatan otentikasi di awal, pastikan aturan keamanan Firestore di Firebase Console Anda diatur seperti berikut:

1. Di halaman **Firestore Database** di Firebase Console, masuk ke tab **Rules** (Aturan).
2. Pastikan aturan tertulis seperti ini untuk mengizinkan baca dan tulis:
   ```firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Klik **Publish** untuk menyimpan perubahan aturan.

---

## Langkah 6: Jalankan Ulang Aplikasi
1. Hentikan server pengembangan lokal Anda jika sedang berjalan (`Ctrl + C` di terminal).
2. Jalankan kembali aplikasi untuk memuat variabel lingkungan yang baru:
   ```bash
   npm run dev
   ```
3. Sekarang, setiap data perkara baru yang Anda masukkan lewat halaman **Input Data** akan secara otomatis terkirim dan tersimpan di database Cloud Firestore Anda secara *real-time*!

# Panduan Setup Penyimpanan Berkas ke Cloudinary (Client-Side Unsigned Upload)

Aplikasi telah diperbarui untuk mengunggah berkas (berkas kronologis, foto personel, salinan putusan, petikan putusan, dan akte BHT) langsung menuju **Cloudinary** menggunakan metode **Unsigned Upload**. 

Metode ini sangat aman dan tidak membutuhkan backend server karena pengunggahan dilakukan langsung dari peramban (browser) ke Cloudinary menggunakan preset khusus yang telah diizinkan.

Berikut adalah langkah-langkah setup yang harus dilakukan oleh Anda atau Client Anda untuk mendapatkan kredensial Cloudinary:

---

## Langkah 1: Registrasi / Login Akun Cloudinary
1. Buka situs resmi [Cloudinary](https://cloudinary.com/) dan lakukan registrasi akun gratis atau masuk ke akun yang sudah ada.
2. Setelah masuk, buka halaman **Dashboard** utama Anda.

---

## Langkah 2: Dapatkan "Cloud Name"
1. Di halaman Dashboard utama, cari bagian **Product Environment Settings** atau informasi akun.
2. Anda akan menemukan **Cloud Name** milik akun Anda.
3. Salin nilai tersebut. Contoh formatnya: `dpxyz1234` atau semacamnya.

---

## Langkah 3: Setup "Unsigned Upload Preset"
Secara bawaan, Cloudinary membutuhkan tanda tangan (signature) untuk mengunggah berkas. Untuk mengunggah dari frontend React secara langsung, kita perlu membuat satu **Unsigned Upload Preset** di pengaturan Cloudinary.

1. Klik ikon **Settings** (ikon roda gigi ⚙️) di bagian kiri bawah halaman Cloudinary.
2. Buka tab **Upload** di menu pengaturan sebelah kiri.
3. Gulir ke bawah hingga Anda menemukan bagian **Upload presets**.
4. Klik tautan **Enable unsigned uploading** (jika belum diaktifkan).
5. Klik tombol **Add upload preset**.
6. Atur konfigurasi sebagai berikut:
   - **Upload preset name**: Biarkan otomatis (misal: `unsigned_preset_xxx`) atau ganti dengan nama yang Anda sukai (misal: `perkara_unsigned`).
   - **Signing Mode**: Pilih **Unsigned** (Sangat penting! Jika diatur ke *Signed*, upload dari React akan error/gagal).
   - **Folder**: Opsional, Anda bisa mengosongkannya karena aplikasi otomatis akan menaruh berkas di dalam subfolder `kumdam_perkara/...` secara dinamis.
7. Klik tombol **Save** di pojok kanan atas untuk menyimpan preset Anda.
8. Salin **Upload Preset Name** yang baru saja Anda buat.

---

## Langkah 4: Hubungkan ke Aplikasi (Setup `.env`)
Masukkan kredensial yang didapatkan di atas ke dalam file `.env` di direktori utama aplikasi Anda:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=isi_dengan_cloud_name_anda
VITE_CLOUDINARY_UPLOAD_PRESET=isi_dengan_upload_preset_unsigned_anda
```

### Catatan Penting untuk Format Berkas (PDF):
Agar client dapat mengunggah file dokumen selain gambar (seperti berkas `.pdf`), pastikan setelan akun Cloudinary tidak membatasi tipe berkas. Aplikasi ini secara otomatis mengirimkan parameter `resource_type: "auto"` sehingga Cloudinary akan mendeteksi dan mengkategorikan file PDF sebagai dokumen dengan benar.

---

## Mengapa Kemarin "Loading Menyimpan..." Terus?
Kemungkinan besar dikarenakan:
1. **Firebase Storage Belum Diaktifkan**: Fitur Firebase Storage di konsol Firebase proyek belum diaktifkan (belum di-klik *Get Started*).
2. **Aturan Hak Akses (Storage Rules) Firebase**: Aturan keamanan bawaan Firebase Storage melarang pengunggahan berkas oleh pengguna yang tidak login (anonim). Karena aplikasi ini tidak memiliki login autentikasi Firebase Auth di sisi client, maka Firebase Storage otomatis menolak koneksi pengunggahan tersebut, menyebabkan fungsi menunggu respon tanpa batas (hang).

Dengan berpindah ke **Cloudinary**, masalah ini teratasi sepenuhnya karena pengunggahan berkas langsung ditangani dengan kredensial upload preset unsigned yang mandiri.

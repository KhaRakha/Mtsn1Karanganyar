# Website MTsN 1 Karanganyar

## Struktur proyek

```text
fe/       Website publik React + Vite
admin/    Template dan stylesheet panel admin
be/       Aplikasi Flask, API, tes, dan database SQLite
```

Konten berita, prestasi, dan pengumuman yang berstatus **Terbit** di admin tersedia untuk website melalui API. Data draf hanya terlihat di panel admin. Jika belum ada konten terbit, website tetap menampilkan konten bawaan yang sudah ada.

Pada form berita, pilih **Berita Utama** atau **Sorotan di bawah berita utama**. Hanya satu berita terbit yang menjadi berita utama; saat berita lain dipilih, berita utama sebelumnya otomatis menjadi sorotan.

Kategori dan submenu untuk menu **Tentang**, **Akademik**, dan **Kegiatan** dikelola dari **Navigasi Website** pada sidebar admin. Urutan, nama kategori, menu induk, alamat, dan nama submenu dapat diubah; navigasi website membaca perubahan tersimpan dari database.

**Semua Halaman Website** menyediakan pengaturan metadata untuk halaman selain Beranda: judul, label kecil / badge, deskripsi singkat, dan status publikasi. Isi Beranda dikelola langsung melalui menu **Beranda Website** pada sidebar, bukan dari daftar tersebut. Editor Beranda mencakup banner dan slide gambar/video, sambutan kepala madrasah, statistik, program beserta gambar, ringkasan visi-misi, galeri, penerimaan siswa, dan kontak/peta. Gambar diunggah langsung dalam format JPG, PNG, atau WebP (maksimal 5 MB), dan video banner diunggah dalam format MP4 (maksimal 25 MB). Berita dan prestasi terbaru pada Beranda mengikuti item yang berstatus Terbit dan dikelola melalui menu Berita atau Prestasi. Khusus halaman Sejarah, tombol terpisah **Kelola isi sejarah** membuka editor pengantar, statistik pendirian, daftar tonggak sejarah, lambang dan maknanya, serta daftar kepala madrasah; gambar dapat diganti melalui unggahan JPG, PNG, atau WebP. Konten khusus halaman lain tetap dipertahankan ketika metadata diperbarui. Halaman Berita, Prestasi, dan Pengumuman punya pengelola tambah/edit/hapus sendiri. Direktori Guru dan Direktori Tendik masing-masing memiliki pengelola tambah/edit/hapus untuk nama, jabatan, foto, dan urutan tampilan. Perubahan disimpan ke SQLite dan dimuat oleh website melalui API. Halaman draf tidak ditampilkan ke publik sampai diterbitkan. Desain dan tata letak React yang sudah ada tetap dipertahankan. Jika konten bawaan frontend diubah, segarkan data awal dengan `node .\scripts\export-page-defaults.mjs`.

## Menjalankan website dan admin

Pastikan virtual environment dan dependensi Python tersedia. Dari folder proyek, jalankan sekali:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\be\requirements.txt
```

Kemudian jalankan website dan admin bersama-sama dari folder proyek:

```powershell
npm run dev
```

Perintah ini menyalakan backend di port `5001` terlebih dahulu, lalu frontend di port `5173`. Jika backend belum aktif, terminal akan meminta username dan password admin (minimal 12 karakter; username kosong berarti `admin`). Password dimasukkan secara tersembunyi. Buka website di `http://127.0.0.1:5173` dan panel admin di `http://127.0.0.1:5173/admin`. Saat server Vite dihentikan, backend yang dijalankan oleh perintah ini ikut dihentikan.

Jika backend sudah berjalan di port `5001`, perintah akan menggunakannya tanpa menyalakan backend kedua. Untuk menjalankan frontend saja, gunakan `npm run dev:frontend`; backend tetap harus aktif agar permintaan API tidak menghasilkan `ECONNREFUSED`.

## Tes

Tes backend:

```powershell
Set-Location .\be
..\.venv\Scripts\python.exe -m unittest discover -s tests
```

Build frontend:

```powershell
Set-Location .\fe
npm run lint
npm run build
```

Kredensial admin dan `FLASK_SECRET_KEY` harus diatur pada setiap terminal backend yang baru; aplikasi tidak menyediakan kredensial bawaan.

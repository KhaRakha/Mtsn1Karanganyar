import hmac
import json
import os
import re
import secrets
import sqlite3
from datetime import date
from functools import wraps
from pathlib import Path
from urllib.parse import urlsplit
from uuid import uuid4

from flask import (
    Flask,
    abort,
    current_app,
    flash,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.utils import secure_filename


CONTENT_TYPES = {
    "berita": "Berita",
    "artikel": "Artikel",
    "prestasi": "Prestasi",
    "pengumuman": "Pengumuman",
}

ACHIEVEMENT_LEVELS = (
    "Tingkat Madrasah",
    "Kecamatan",
    "Kabupaten/Kota",
    "Provinsi",
    "Nasional",
    "Internasional",
)

ACHIEVEMENT_CATEGORIES = (
    "Akademik",
    "Sains",
    "Seni",
    "Olahraga",
    "Keagamaan",
    "Teknologi",
    "Literasi",
    "Bahasa",
    "Sosial",
    "Lainnya",
)

HOME_GALLERY_CATEGORIES = (
    "Pembelajaran",
    "Upacara & Karakter",
    "Keagamaan",
    "Ekstrakurikuler",
)

NAVIGATION_MENUS = {
    "tentang": "Tentang",
    "akademik": "Akademik",
    "kegiatan": "Kegiatan",
}

PAGE_TYPES = {
    "beranda": "Beranda",
    "visi-misi": "Visi dan Misi",
    "sejarah": "Sejarah",
    "penghargaan-madrasah": "Penghargaan Madrasah",
    "sarana-prasarana": "Sarana dan Prasarana",
    "denah-sekolah": "Denah Sekolah",
    "struktur-organisasi": "Struktur Organisasi",
    "direktori-tendik": "Direktori Tendik",
    "komite-madrasah": "Komite Madrasah",
    "tata-tertib": "Tata Tertib",
    "kemitraan": "Kemitraan",
    "program-khusus": "Program Khusus",
    "minat-dan-bakat": "Minat dan Bakat",
    "kalender-akademik": "Kalender Akademik",
    "testimoni-alumni": "Testimoni Alumni",
    "galeri": "Galeri",
}

PAGE_DATA_FIELDS = {
    "beranda": {
        "hero": ("Judul dan deskripsi beranda", "object", '{"title":"Judul beranda","description":"Deskripsi beranda"}'),
        "heroSlides": ("Foto dan video hero", "array", '[{"type":"photo","label":"Lingkungan madrasah","image":"/static/uploads/hero.jpg"}]'),
        "welcome": ("Sambutan kepala madrasah", "object", '{"title":"Sambutan Kepala Madrasah","name":"Nama Kepala Madrasah","image":"/static/uploads/kepala.jpg","greeting":"Assalamu’alaikum","body":"Isi sambutan","closing":"Wassalamu’alaikum"}'),
        "statistics": ("Statistik madrasah", "array", '[{"value":1000,"label":"Murid Aktif"}]'),
        "programs": ("Program dan keunggulan", "array", '[{"number":"01","title":"Program unggulan","description":"Deskripsi","visuals":[{"src":"/static/uploads/program.jpg","alt":"Kegiatan"}]}]'),
        "values": ("Nilai visi dan misi", "array", '[["01","Akhlak dan Ketakwaan","Karakter"]]'),
        "fallbackNews": ("Berita utama bawaan", "object", '{"title":"Berita madrasah","summary":"Ringkasan berita","image":"/static/uploads/berita.jpg","dateTime":"2026-10-28"}'),
        "fallbackAchievements": ("Prestasi bawaan", "array", '[{"category":"Prestasi","title":"Capaian madrasah","image":"/static/uploads/prestasi.jpg","dateTime":"2026-10-24"}]'),
        "gallery": ("Galeri kegiatan", "array", '[{"title":"Kegiatan Belajar","category":"Pembelajaran","image":"/static/uploads/kegiatan.jpg"}]'),
        "admission": ("Informasi penerimaan siswa", "object", '{"title":"Penerimaan Peserta Didik Baru","description":"Informasi pendaftaran","url":"https://example.sch.id"}'),
        "contact": ("Kontak dan lokasi madrasah", "object", '{"address":"Alamat madrasah","phone":"Nomor telepon","email":"email@sekolah.sch.id","hours":"Jam pelayanan","mapUrl":"https://maps.google.com/"}'),
        "homeSections": ("Judul dan label bagian beranda", "object", '{"programs":{"eyebrow":"PILAR MUTU AKADEMIK","title":"Program & Keunggulan Pendidikan"}}'),
    },
    "visi-misi": {
        "vision": ("Pernyataan visi madrasah", "object", '{"eyebrow":"CITA-CITA KAMI","text":"Visi madrasah","description":"Penjelasan visi"}'),
        "missionHeading": ("Pengantar misi", "object", '{"title":"Delapan langkah menuju cita-cita.","description":"Penjelasan misi"}'),
        "missions": ("Daftar misi", "array", '[{"number":"01","title":"Akhlak dan Ketakwaan","category":"Karakter","description":"Uraian misi"}]'),
        "callout": ("Ajakan penutup", "object", '{"eyebrow":"BERSAMA MADRASAH","title":"Mari tumbuh bersama.","linkLabel":"Hubungi madrasah","link":"/#kontak"}'),
    },
    "sejarah": {
        "story": ("Kisah dan data pendirian", "object", '{"title":"Jejak Langkah & Sejarah Pendirian","description":"Kisah madrasah","founded":"14 Mei 1985","tenure":"38+ Tahun","accreditation":"Akreditasi A","logo":"/static/uploads/logo.png","milestonesTitle":"Tonggak Sejarah","emblemTitle":"Makna lambang","emblemLogoTitle":"Insignia lembaga","leadersTitle":"Kepala madrasah dari masa ke masa"}'),
        "milestones": ("Tonggak sejarah", "array", '[{"year":"1985","title":"Pondasi","text":"Uraian tonggak","noteTitle":"Catatan","note":"Keterangan"}]'),
        "emblemPoints": ("Makna lambang", "array", '[{"icon":"✦","title":"Obor Abadi","text":"Makna lambang"}]'),
        "leaders": ("Kepala madrasah dari masa ke masa", "array", '[{"period":"2018 – Sekarang","name":"Nama Kepala","image":"/static/uploads/kepala.jpg"}]'),
    },
    "penghargaan-madrasah": {
        "section": ("Pengantar penghargaan madrasah", "object", '{"title":"Apresiasi dan Penghargaan","description":"Daftar penghargaan resmi madrasah."}'),
        "awards": ("Dokumentasi penghargaan (judul, tahun, foto, dan keterangan)", "array", '[]'),
    },
    "sarana-prasarana": {
        "feature": ("Pengantar fasilitas unggulan", "object", '{"titlePrefix":"Sarana & Prasarana Unggulan untuk","titleEmphasis":"Masa Depan Gemilang","description":"Penjelasan fasilitas"}'),
        "highlights": ("Sorotan fasilitas", "array", '["Lingkungan nyaman","Pembelajaran digital"]'),
        "summary": ("Ringkasan fasilitas", "array", '[{"icon":"✦","value":"7","label":"Total fasilitas","description":"Fasilitas utama"}]'),
        "facilities": ("Daftar sarana dan prasarana", "array", '[{"category":"Laboratorium","title":"Laboratorium IPA","description":"Ringkasan","image":"/static/uploads/lab.jpg","detail":"Informasi detail","building":"Gedung Madrasah","floor":"1","area":"Ruang fasilitas","equipment":"Peralatan"}]'),
    },
    "denah-sekolah": {
        "map": ("Label pada denah sekolah", "object", '{"eyebrow":"DENAH LINGKUNGAN","title":"Area MTsN 1 Karanganyar","subtitle":"Ilustrasi tata letak fasilitas","road":"JALAN UTAMA","gate":"GERBANG\\nUTAMA","office":"KANTOR\\n& TU","classes":["KELAS\\n7A","KELAS\\n7B","KELAS\\n8A","KELAS\\n8B"],"laboratory":"LABORATORIUM\\nIPA & KOMPUTER","library":"PERPUSTAKAAN","uks":"RUANG UKS","field":"LAPANGAN KEGIATAN","hall":"RUANG\\nSERBAGUNA","legendTitle":"Keterangan:"}'),
        "legend": ("Keterangan denah", "array", '[{"label":"Gerbang utama","type":"orange"}]'),
    },
    "struktur-organisasi": {
        "chart": ("Nama dan jabatan pada bagan organisasi", "object", '{"sectionTitle":"Pilar Kepengurusan","headmaster":"Nama Kepala Madrasah","headmasterRole":"Kepala Madrasah","committee":"Komite Madrasah","administration":"Kepala Urusan Tata Usaha","vicePrincipals":[{"name":"Nama Wakamad","role":"Kurikulum"},{"name":"Nama Wakamad","role":"Kesiswaan"},{"name":"Nama Wakamad","role":"Sarana Prasarana"},{"name":"Nama Wakamad","role":"Humas"}],"teachers":"Guru","staff":"Tenaga Kependidikan (Tendik)","students":"Siswa"}'),
        "contact": ("Informasi layanan tata usaha", "object", '{"eyebrow":"LAYANAN INFORMASI MADRASAH","title":"Butuh informasi lebih lanjut?","description":"Hubungi tim tata usaha.","primaryLabel":"Hubungi Tata Usaha","primaryLink":"#kontak","secondaryLabel":"Lihat Informasi Madrasah","secondaryLink":"#informasi"}'),
    },
    "direktori-tendik": {
        "sectionTitle": ("Judul direktori", "string", "Jajaran Tenaga Kependidikan"),
    },
    "komite-madrasah": {
        "sections": ("Pengantar dan judul bagian", "object", '{"introTitle":"Bersama Membangun Madrasah","introDescription":"Penjelasan komite","rolesTitle":"Kolaborasi untuk Pendidikan","rolesDescription":"Peran komite"}'),
        "members": ("Peran anggota komite", "array", '[{"number":"01","title":"Ketua Komite","description":"Uraian tugas","icon":"✦"}]'),
        "roles": ("Peran utama komite", "array", '[{"number":"01","title":"Memberi pertimbangan","description":"Uraian peran"}]'),
    },
    "tata-tertib": {
        "section": ("Pengantar tata tertib", "object", '{"title":"Tumbuh dalam sikap yang baik.","description":"Kebiasaan positif warga madrasah."}'),
        "principles": ("Prinsip budaya dan kedisiplinan", "array", '[{"number":"01","title":"Sikap saling menghormati","description":"Uraian prinsip"}]'),
        "notice": ("Informasi dokumen tata tertib", "object", '{"title":"Dokumen tata tertib resmi","description":"Keterangan dokumen resmi."}'),
    },
    "kemitraan": {
        "section": ("Pengantar kemitraan", "object", '{"title":"Bertumbuh melalui kerja sama.","description":"Kolaborasi pendidikan."}'),
        "areas": ("Ruang kolaborasi", "array", '[{"number":"01","title":"Pembelajaran","description":"Uraian kerja sama"}]'),
        "notice": ("Informasi mitra madrasah", "object", '{"title":"Informasi mitra terverifikasi.","description":"Informasi daftar mitra."}'),
    },
    "program-khusus": {},
    "minat-dan-bakat": {
        "programsTitle": ("Judul program kegiatan", "string", "Beragam Kegiatan"),
        "programs": ("Program minat dan bakat", "array", '[{"name":"OSIS","slug":"osis","category":"Organisasi","description":"Uraian kegiatan","details":"Penjelasan kegiatan dan hal yang dipelajari siswa.","image":"/static/uploads/osis.jpg","imageAlt":"Siswa mengikuti kegiatan","required":false,"documentation":[{"title":"Latihan kegiatan","description":"Penjelasan dokumentasi kegiatan.","image":"/static/uploads/osis-1.jpg","alt":"Siswa mengikuti kegiatan"}]}]'),
        "faqLabel": ("Label FAQ minat dan bakat", "string", "INFORMASI MINAT DAN BAKAT"),
        "faqTitle": ("Judul FAQ minat dan bakat", "string", "FAQ & Panduan Minat dan Bakat"),
        "faqDescription": ("Pengantar FAQ minat dan bakat", "string", "Temukan jawaban seputar pilihan kegiatan, jadwal, dan cara mengembangkan potensi bersama teman-teman di madrasah."),
        "faqs": ("Pertanyaan minat dan bakat", "array", '[{"question":"Bagaimana cara memilih kegiatan yang sesuai minat dan bakat?","answer":"Mulailah dari kegiatan yang paling kamu sukai. Pelajari setiap program, lalu diskusikan pilihanmu dengan pembina atau wali kelas agar sesuai dengan minat, kemampuan, dan jadwalmu."},{"question":"Bagaimana cara mengetahui jadwal kegiatan?","answer":"Jadwal dan lokasi kegiatan dapat berubah. Tanyakan langsung kepada pembina kegiatan atau pantau pengumuman resmi madrasah."},{"question":"Bolehkah mengikuti lebih dari satu kegiatan?","answer":"Ketentuannya bergantung pada jadwal dan aturan tiap program. Pastikan kegiatan yang dipilih tidak berbenturan, lalu konfirmasikan kepada pembina."},{"question":"Apa manfaat mengikuti kegiatan minat dan bakat?","answer":"Kegiatan memberi kesempatan untuk berlatih, bekerja sama, membangun disiplin, dan mengembangkan potensi di luar pembelajaran kelas."},{"question":"Apa yang perlu dipersiapkan sebelum ikut kegiatan?","answer":"Cari tahu perlengkapan, persyaratan, jadwal, dan cara bergabung langsung dari pembina kegiatan yang kamu pilih."}]'),
    },
    "kalender-akademik": {
        "sectionTitle": ("Judul bagian kalender", "string", "Rencanakan Kegiatan"),
        "calendar": ("Agenda kalender akademik", "object", '{"year":2026,"events":[{"month":0,"day":5,"title":"Upacara Pancasila","tone":"mint","date":"05 Januari 2026"}],"agenda":[{"month":0,"date":"05 Januari 2026","title":"Upacara Pancasila","tone":"mint"}]}'),
        "download": ("Informasi unduhan kalender", "object", '{"label":"DOWNLOAD KALENDER","title":"Kalender Akademik 2026","period":"Semester Ganjil & Genap","description":"Jadwal pembelajaran, ujian, dan kegiatan sekolah","url":"/static/uploads/kalender.pdf","fileSize":"2.4 MB"}'),
    },
    "testimoni-alumni": {
        "section": ("Pengantar testimoni alumni", "object", '{"title":"Cerita dari Alumni","description":"Pengalaman alumni yang dibagikan dengan persetujuan untuk dipublikasikan."}'),
        "testimonials": ("Daftar testimoni alumni", "array", '[]'),
    },
    "galeri": {
        "galleryTitle": ("Judul galeri", "string", "Momen Berharga MTsN 1 Karanganyar"),
        "galleryDescription": ("Deskripsi galeri", "string", "Potret Kegiatan & Kebersamaan"),
        "categories": ("Kategori galeri", "array", '["Semua Kegiatan","Pembelajaran","Upacara & Karakter","Keagamaan","Ekstrakurikuler"]'),
        "items": ("Foto galeri", "array", '[{"title":"Upacara Bendera","category":"Upacara & Karakter","image":"/static/uploads/upacara.jpg","alt":"Siswa mengikuti upacara"}]'),
    },
}

PAGE_DEFAULTS = {
    "beranda": ("Membangun Generasi\nIslami, Cerdas, dan\nBerprestasi", "", "MTsN 1 Karanganyar hadir sebagai lembaga pendidikan Islam yang berkomitmen mencetak generasi berakhlak mulia, berilmu, dan siap menghadapi masa depan."),
    "visi-misi": ("Visi & Misi MTsN 1 Karanganyar", "PROFIL MADRASAH · ARAH PENDIDIKAN", "Cita-cita madrasah dan ikhtiar bersama untuk membentuk generasi Qur’ani yang unggul."),
    "sejarah": ("Sejarah MTsN 1 Karanganyar", "PERJALANAN MADRASAH", "Setiap madrasah memiliki perjalanan dan kisah yang membentuknya. Halaman ini disiapkan untuk mengenalkan perjalanan MTsN 1 Karanganyar."),
    "penghargaan-madrasah": ("Penghargaan Madrasah", "APRESIASI DAN PENCAPAIAN", "Dokumentasi apresiasi dan pencapaian MTsN 1 Karanganyar."),
    "sarana-prasarana": ("Sarana dan Prasarana", "FASILITAS MADRASAH", "Kenali fasilitas dan lingkungan pendukung kegiatan belajar di MTsN 1 Karanganyar."),
    "denah-sekolah": ("Denah Sekolah", "PETA LINGKUNGAN MADRASAH", "Panduan visual untuk mengenali tata letak area dan fasilitas MTsN 1 Karanganyar."),
    "struktur-organisasi": ("Struktur Organisasi", "TATA KELOLA MADRASAH", "Kenali susunan peran dan tanggung jawab dalam mendukung penyelenggaraan pendidikan."),
    "direktori-tendik": ("Direktori Tenaga Kependidikan", "LAYANAN MADRASAH", "Kenali tenaga kependidikan yang mendukung layanan dan kegiatan di MTsN 1 Karanganyar."),
    "komite-madrasah": ("Komite Madrasah", "WARGA SEKOLAH", "Komite Madrasah menjadi mitra strategis dalam mendukung peningkatan mutu layanan pendidikan dan membangun kolaborasi bersama seluruh warga madrasah."),
    "tata-tertib": ("Tata Tertib Madrasah", "BUDAYA DAN KEDISIPLINAN", "Panduan untuk membangun lingkungan belajar yang tertib, aman, dan saling menghargai."),
    "kemitraan": ("Kemitraan Madrasah", "KOLABORASI PENDIDIKAN", "Ruang kolaborasi untuk mendukung pendidikan dan memberi manfaat bagi warga madrasah."),
    "program-khusus": ("Program Khusus", "PROGRAM UNGGULAN", "Kenali pilihan program khusus yang mendukung pengembangan kemampuan dan potensi siswa."),
    "minat-dan-bakat": ("Minat dan Bakat", "RUANG UNTUK BERTUMBUH", "Pilih kegiatan yang kamu sukai, kembangkan kemampuan, dan raih pengalaman baru bersama teman-teman di madrasah."),
    "kalender-akademik": ("Kalender Akademik", "AGENDA PENDIDIKAN", "Informasi agenda akademik untuk membantu siswa dan keluarga merencanakan kegiatan belajar."),
    "testimoni-alumni": ("Testimoni Alumni", "CERITA DARI ALUMNI", "Kumpulan pengalaman dan kesan yang dibagikan alumni dengan persetujuan untuk dipublikasikan."),
    "galeri": ("Galeri Kegiatan", "DOKUMENTASI KEGIATAN", "Kumpulan dokumentasi kegiatan dan pengalaman siswa di madrasah."),
}

try:
    PAGE_DATA_DEFAULTS = json.loads(
        Path(__file__).with_name("page_defaults.json").read_text(encoding="utf-8")
    )
except (OSError, json.JSONDecodeError) as error:
    raise RuntimeError("Data bawaan halaman tidak dapat dimuat dari page_defaults.json.") from error

if set(PAGE_TYPES) != set(PAGE_DATA_FIELDS) or set(PAGE_TYPES) != set(PAGE_DATA_DEFAULTS):
    raise RuntimeError("Skema editor dan data bawaan halaman tidak cocok.")

DEFAULT_GURU_ENTRIES = (
    ("Dr. Siti Aminah, M.Si.", "Guru Kimia & Koordinator MIPA", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80"),
    ("Dewi Lestari, S.Pd.", "Guru Bahasa Indonesia", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"),
    ("Ahmad Fajar, M.Pd.", "Guru Matematika", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"),
    ("Rina Permata, S.Pd.", "Guru Fisika", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"),
    ("Budi Hartono, M.Pd.", "Guru IPA", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80"),
    ("Nadya Aulia, S.Pd.", "Guru Biologi", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"),
    ("Fadhila Rahman, S.Pd.", "Guru Sejarah", "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"),
    ("Yusuf Hidayat, M.Pd.", "Guru PAI", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"),
    ("Lina Pratiwi, S.Pd.", "Guru PKn", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"),
    ("Raka Wijaya, M.Pd.", "Guru Bahasa Inggris", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"),
    ("Mila Sari, S.Pd.", "Guru Seni Budaya", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"),
    ("Hendra Saputra, M.Pd.", "Guru Olahraga", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"),
    ("Nia Ramadhani, S.Pd.", "Guru Informatika", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"),
    ("Teguh Prasetyo, M.Pd.", "Guru Geografi", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80"),
    ("Ayu Lestari, S.Pd.", "Guru Ekonomi", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"),
    ("Joko Santoso, M.Pd.", "Guru Bahasa Jawa", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"),
    ("Sri Wulandari, S.Pd.", "Guru Bahasa Arab", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80"),
    ("Taufik Hidayat, M.Pd.", "Guru Akidah Akhlak", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"),
    ("Rahmawati, S.Pd.", "Guru Kesenian", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"),
    ("Eko Prabowo, M.Pd.", "Guru IPA Terpadu", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80"),
    ("Siska Dewi, S.Pd.", "Guru IPS", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"),
    ("Agus Setiawan, M.Pd.", "Guru Agama Kristen", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"),
    ("Putri Handayani, S.Pd.", "Guru Prakarya", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"),
    ("Wahyu Nugroho, M.Pd.", "Guru IPA", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"),
    ("Rizka Nuraini, S.Pd.", "Guru BK", "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"),
    ("Dian Permana, M.Pd.", "Guru Bahasa Sunda", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80"),
    ("Fina Melati, S.Pd.", "Guru Tata Boga", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"),
    ("Arif Rahman, M.Pd.", "Guru Bahasa Jepang", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"),
    ("Citra Maulida, S.Pd.", "Guru PKN", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"),
    ("Hamdan Yusuf, M.Pd.", "Guru Pendidikan Agama", "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80"),
    ("Galuh Wulandari, S.Pd.", "Guru Kimia", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"),
)

DEFAULT_NAVIGATION = (
    ("tentang", "Profil Sekolah", (("Visi dan Misi", "/visi-misi"), ("Sejarah", "/sejarah"), ("Penghargaan Madrasah", "/penghargaan-madrasah"))),
    ("tentang", "Fasilitas", (("Sarana dan Prasarana", "/sarana-prasarana"), ("Denah Sekolah", "/denah-sekolah"))),
    (
        "tentang",
        "Warga Sekolah",
        (
            ("Struktur Organisasi", "/struktur-organisasi"),
            ("Direktori Guru", "/direktori-guru"),
            ("Direktori Tendik", "/direktori-tendik"),
            ("Komite Madrasah", "/komite-madrasah"),
        ),
    ),
    ("tentang", "Lainnya", (("Tata Tertib", "/tata-tertib"), ("Kemitraan", "/kemitraan"), ("Testimoni Alumni", "/testimoni-alumni"))),
    (
        "akademik",
        "Unggulan",
        (
            ("Program Khusus", "/program-khusus"),
            ("Prestasi", "/prestasi"),
            ("Minat dan Bakat", "/minat-dan-bakat"),
        ),
    ),
    ("akademik", "Kegiatan Belajar", (("Kalender Akademik", "/kalender-akademik"),)),
    (
        "kegiatan",
        "Kegiatan Madrasah",
        (("Berita", "/berita"), ("Artikel", "/artikel"), ("Galeri", "/galeri")),
    ),
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('berita', 'artikel', 'prestasi', 'pengumuman')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    achievement_level TEXT NOT NULL DEFAULT 'Kabupaten/Kota',
    achievement_category TEXT NOT NULL DEFAULT 'Lainnya',
    student_names TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    image_position TEXT NOT NULL DEFAULT '50% 50%',
    published_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    placement TEXT NOT NULL DEFAULT 'sorotan' CHECK (placement IN ('utama', 'sorotan')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT,
    FOREIGN KEY (article_id) REFERENCES content (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS page_content (
    page_slug TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    badge TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    data_json TEXT NOT NULL DEFAULT '{}',
    content_version INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni_testimonial_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    institution TEXT NOT NULL,
    year TEXT NOT NULL,
    quote TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS guru_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tendik_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS navigation_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    menu_key TEXT NOT NULL DEFAULT 'tentang',
    sort_order INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS navigation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (group_id) REFERENCES navigation_groups (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def get_db():
    if "db" not in g:
        connection = sqlite3.connect(current_app.config["DATABASE"])
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.db = connection
    return g.db


def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def _validate_content_form(content_type):
    values = {
        "title": request.form.get("title", "").strip(),
        "summary": request.form.get("summary", "").strip(),
        "body": request.form.get("body", "").strip(),
        "achievement_level": request.form.get(
            "achievement_level", "Kabupaten/Kota"
        ).strip(),
        "achievement_category": request.form.get(
            "achievement_category", "Lainnya"
        ).strip(),
        "student_names": "\n".join(
            name.strip()
            for name in request.form.get("student_names", "").splitlines()
            if name.strip()
        ),
        "image_url": request.form.get("image_url", "").strip(),
        "image_position": request.form.get("image_position", "50% 50%").strip(),
        "published_at": request.form.get("published_at", "").strip(),
        "status": request.form.get("status", "").strip(),
        "placement": request.form.get("placement", "sorotan").strip(),
    }
    errors = []

    if not values["title"]:
        errors.append("Judul wajib diisi.")
    elif len(values["title"]) > 180:
        errors.append("Judul maksimal 180 karakter.")

    if len(values["summary"]) > 500:
        errors.append("Ringkasan maksimal 500 karakter.")

    if content_type == "prestasi":
        if values["achievement_level"] not in ACHIEVEMENT_LEVELS:
            errors.append("Tingkat prestasi tidak valid.")
        if values["achievement_category"] not in ACHIEVEMENT_CATEGORIES:
            errors.append("Bidang prestasi tidak valid.")
        if len(values["student_names"]) > 1000:
            errors.append("Nama siswa maksimal 1000 karakter.")

    if len(values["image_url"]) > 500:
        errors.append("Alamat gambar maksimal 500 karakter.")
    elif values["image_url"]:
        parsed_image_url = urlsplit(values["image_url"])
        if values["image_url"].startswith("/") and not values["image_url"].startswith("//"):
            pass
        elif parsed_image_url.scheme not in {"http", "https"} or not parsed_image_url.netloc:
            errors.append("Alamat gambar harus berupa path lokal atau URL http/https.")

    position_match = re.fullmatch(
        r"(\d{1,3})%\s+(\d{1,3})%",
        values["image_position"],
    )
    if position_match is None:
        errors.append("Posisi foto tidak valid.")
    else:
        horizontal, vertical = map(int, position_match.groups())
        if horizontal > 100 or vertical > 100:
            errors.append("Posisi foto harus berada antara 0% dan 100%.")
        else:
            values["image_position"] = f"{horizontal}% {vertical}%"

    if not values["body"]:
        errors.append("Isi konten wajib diisi.")

    try:
        date.fromisoformat(values["published_at"])
    except ValueError:
        errors.append("Tanggal publikasi tidak valid.")

    if values["status"] not in {"draft", "published"}:
        errors.append("Status publikasi tidak valid.")

    if values["placement"] not in {"utama", "sorotan"}:
        errors.append("Penempatan berita tidak valid.")

    return values, errors


def _validate_page_content_form(existing_data):
    values = {
        "title": request.form.get("title", "").strip(),
        "badge": request.form.get("badge", "").strip(),
        "description": request.form.get("description", "").strip(),
        "status": request.form.get("status", "").strip(),
    }
    data = dict(existing_data)
    errors = []
    if not values["title"]:
        errors.append("Judul wajib diisi.")
    if values["status"] not in {"draft", "published"}:
        errors.append("Status halaman tidak valid.")
    if len(values["title"]) > 180:
        errors.append("Judul maksimal 180 karakter.")
    if len(values["badge"]) > 100:
        errors.append("Label kecil / badge maksimal 100 karakter.")
    if len(values["description"]) > 2000:
        errors.append("Deskripsi singkat maksimal 2000 karakter.")
    return values, data, errors


def _minat_bakat_editor_data(data):
    defaults = PAGE_DATA_DEFAULTS["minat-dan-bakat"]
    result = {**defaults, **data}
    default_programs = defaults.get("programs", [])
    saved_programs = data.get("programs")
    if not isinstance(saved_programs, list) or not saved_programs:
        saved_programs = default_programs

    programs = []
    for index, saved_program in enumerate(saved_programs):
        if not isinstance(saved_program, dict):
            continue
        fallback = next(
            (
                item for item in default_programs
                if item.get("slug") == saved_program.get("slug")
            ),
            default_programs[index] if index < len(default_programs) else {},
        )
        program = {**fallback, **saved_program}
        saved_documentation = program.get("documentation")
        if not isinstance(saved_documentation, list) or not saved_documentation:
            saved_documentation = fallback.get("documentation", [])
        program["documentation"] = [
            {
                **(
                    fallback["documentation"][doc_index]
                    if doc_index < len(fallback.get("documentation", []))
                    else {}
                ),
                **(item if isinstance(item, dict) else {}),
            }
            for doc_index, item in enumerate(saved_documentation)
        ]
        programs.append(program)
    result["programs"] = programs or default_programs

    default_faqs = defaults.get("faqs", [])
    saved_faqs = data.get("faqs")
    if not isinstance(saved_faqs, list) or not saved_faqs:
        saved_faqs = default_faqs
    result["faqs"] = [
        {
            **(default_faqs[index] if index < len(default_faqs) else {}),
            **(item if isinstance(item, dict) else {}),
        }
        for index, item in enumerate(saved_faqs)
    ] or default_faqs
    return result


def _validate_minat_bakat_content_form(existing_data):
    values, _, errors = _validate_page_content_form(existing_data)
    data = _minat_bakat_editor_data(existing_data)
    uploads = []

    def text_value(field, label, maximum, fallback="", required=False):
        raw_value = request.form.get(field, fallback)
        value = raw_value.strip() if isinstance(raw_value, str) else str(raw_value or "").strip()
        if required and not value:
            errors.append(f"{label} wajib diisi.")
        if len(value) > maximum:
            errors.append(f"{label} maksimal {maximum} karakter.")
        return value

    def list_count(field, label, fallback, maximum):
        raw_count = request.form.get(field)
        if raw_count is None:
            errors.append(f"Data jumlah {label.lower()} tidak lengkap.")
            return fallback
        try:
            count = int(raw_count)
        except ValueError:
            errors.append(f"Jumlah {label.lower()} tidak valid.")
            return fallback
        if count < 1:
            errors.append(f"Minimal satu {label.lower()} harus tersedia.")
            return fallback
        if count > maximum:
            errors.append(f"Maksimal {maximum} {label.lower()} dapat diisi.")
            return fallback
        return count

    def image_value(field, upload_field, label, fallback, target):
        value = text_value(field, label, 500, fallback)
        upload = request.files.get(upload_field)
        has_upload = bool(upload and upload.filename)
        if has_upload:
            errors.extend(_validate_image_upload(upload, label.lower()))
            uploads.append((upload, target, "image"))
        elif not value:
            errors.append(f"{label} wajib tersedia. Masukkan URL atau unggah gambar.")
        elif not (value.startswith("/") and not value.startswith("//")):
            try:
                parsed_url = urlsplit(value)
            except ValueError:
                parsed_url = None
            if parsed_url is None or parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
                errors.append(f"{label} harus berupa path lokal atau URL http/https.")
        return value

    data["programsTitle"] = text_value(
        "programs_title", "Judul bagian kegiatan", 180,
        data.get("programsTitle", ""), required=True,
    )
    data["faqLabel"] = text_value(
        "faq_label", "Label FAQ", 100, data.get("faqLabel", ""), required=True,
    )
    data["faqTitle"] = text_value(
        "faq_title", "Judul FAQ", 180, data.get("faqTitle", ""), required=True,
    )
    data["faqDescription"] = text_value(
        "faq_description", "Deskripsi FAQ", 1000,
        data.get("faqDescription", ""), required=True,
    )

    current_programs = data["programs"]
    program_count = list_count(
        "program_count", "kegiatan", len(current_programs), 30
    )
    programs = []
    used_slugs = set()
    for program_index in range(program_count):
        fallback = (
            current_programs[program_index]
            if program_index < len(current_programs)
            else {}
        )
        prefix = f"programs[{program_index}]"
        program = {
            **fallback,
            "name": text_value(
                f"{prefix}[name]", f"Nama kegiatan {program_index + 1}", 120,
                fallback.get("name", ""), required=True,
            ),
            "slug": text_value(
                f"{prefix}[slug]", f"Slug kegiatan {program_index + 1}", 120,
                fallback.get("slug", ""), required=True,
            ),
            "category": text_value(
                f"{prefix}[category]", f"Kategori kegiatan {program_index + 1}", 100,
                fallback.get("category", ""), required=True,
            ),
            "description": text_value(
                f"{prefix}[description]", f"Deskripsi kegiatan {program_index + 1}",
                1000, fallback.get("description", ""), required=True,
            ),
            "details": text_value(
                f"{prefix}[details]", f"Detail kegiatan {program_index + 1}",
                2000, fallback.get("details", ""),
            ),
            "imageAlt": text_value(
                f"{prefix}[imageAlt]", f"Teks alternatif foto kegiatan {program_index + 1}",
                180, fallback.get("imageAlt", ""),
            ),
            "required": request.form.get(f"{prefix}[required]") == "true",
        }
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", program["slug"]):
            errors.append(
                f"Slug kegiatan {program_index + 1} hanya boleh berisi huruf kecil, angka, dan tanda hubung."
            )
        elif program["slug"] in used_slugs:
            errors.append(f"Slug kegiatan {program_index + 1} tidak boleh duplikat.")
        used_slugs.add(program["slug"])
        image_field = f"{prefix}[image]"
        upload_field = f"{prefix}[image_file]"
        program["image"] = image_value(
            image_field, upload_field, f"Foto kegiatan {program_index + 1}",
            fallback.get("image", ""), program,
        )

        current_documentation = fallback.get("documentation", [])
        documentation_count = list_count(
            f"{prefix}[documentation_count]",
            f"dokumentasi kegiatan {program_index + 1}",
            len(current_documentation) or 1,
            15,
        )
        documentation = []
        for documentation_index in range(documentation_count):
            item_fallback = (
                current_documentation[documentation_index]
                if documentation_index < len(current_documentation)
                else {}
            )
            item_prefix = f"{prefix}[documentation][{documentation_index}]"
            item = {
                **item_fallback,
                "title": text_value(
                    f"{item_prefix}[title]",
                    f"Judul dokumentasi {documentation_index + 1} kegiatan {program_index + 1}",
                    180, item_fallback.get("title", ""),
                ),
                "description": text_value(
                    f"{item_prefix}[description]",
                    f"Deskripsi dokumentasi {documentation_index + 1} kegiatan {program_index + 1}",
                    1000, item_fallback.get("description", ""),
                ),
                "alt": text_value(
                    f"{item_prefix}[alt]",
                    f"Teks alternatif dokumentasi {documentation_index + 1} kegiatan {program_index + 1}",
                    180, item_fallback.get("alt", ""),
                ),
            }
            item["image"] = image_value(
                f"{item_prefix}[image]",
                f"{item_prefix}[image_file]",
                f"Foto dokumentasi {documentation_index + 1} kegiatan {program_index + 1}",
                item_fallback.get("image", ""), item,
            )
            documentation.append(item)
        program["documentation"] = documentation
        programs.append(program)
    data["programs"] = programs

    current_faqs = data.get("faqs", [])
    faq_count = list_count("faq_count", "FAQ", len(current_faqs), 30)
    faqs = []
    for faq_index in range(faq_count):
        fallback = current_faqs[faq_index] if faq_index < len(current_faqs) else {}
        prefix = f"faqs[{faq_index}]"
        faqs.append(
            {
                "question": text_value(
                    f"{prefix}[question]", f"Pertanyaan FAQ {faq_index + 1}",
                    300, fallback.get("question", ""), required=True,
                ),
                "answer": text_value(
                    f"{prefix}[answer]", f"Jawaban FAQ {faq_index + 1}",
                    2000, fallback.get("answer", ""), required=True,
                ),
            }
        )
    data["faqs"] = faqs
    return values, data, errors, uploads


def _homepage_form_values(data, status="draft"):
    defaults = PAGE_DATA_DEFAULTS["beranda"]

    def object_value(key):
        saved = data.get(key)
        return {
            **defaults[key],
            **(saved if isinstance(saved, dict) else {}),
        }

    def object_list(key):
        saved = data.get(key)
        if not isinstance(saved, list) or not saved:
            saved = defaults[key]
        items = []
        for index, item in enumerate(saved):
            fallback = defaults[key][index] if index < len(defaults[key]) else {}
            items.append(
                {**fallback, **item} if isinstance(item, dict) else dict(fallback)
            )
        return items

    hero_slides = object_list("heroSlides")
    statistics = object_list("statistics")
    gallery = object_list("gallery")
    fallback_achievements = object_list("fallbackAchievements")
    programs = object_list("programs")
    for index, program in enumerate(programs):
        default_programs = defaults["programs"]
        fallback_visuals = (
            default_programs[index % len(default_programs)]["visuals"]
            if default_programs
            else []
        )
        visuals = program.get("visuals")
        if not isinstance(visuals, list) or not visuals:
            visuals = fallback_visuals
        program["visuals"] = [
            {
                **(fallback_visuals[visual_index] if visual_index < len(fallback_visuals) else {}),
                **(
                    visuals[visual_index]
                    if visual_index < len(visuals) and isinstance(visuals[visual_index], dict)
                    else {}
                ),
            }
            for visual_index in range(3)
        ]

    saved_values = data.get("values")
    if not isinstance(saved_values, list) or not saved_values:
        saved_values = defaults["values"]
    values = []
    for item_index, item in enumerate(saved_values):
        value = []
        for field_index in range(3):
            if isinstance(item, (list, tuple)) and len(item) > field_index:
                value.append(str(item[field_index]))
            elif item_index < len(defaults["values"]):
                value.append(defaults["values"][item_index][field_index])
            else:
                value.append("")
        values.append(value)

    default_sections = defaults["homeSections"]
    saved_sections = data.get("homeSections")
    saved_sections = saved_sections if isinstance(saved_sections, dict) else {}
    home_sections = {
        key: {
            **section_defaults,
            **(
                saved_sections.get(key)
                if isinstance(saved_sections.get(key), dict)
                else {}
            ),
        }
        for key, section_defaults in default_sections.items()
    }

    return {
        "status": status,
        "hero": object_value("hero"),
        "heroSlides": hero_slides,
        "welcome": object_value("welcome"),
        "statistics": statistics,
        "programs": programs,
        "values": values,
        "fallbackNews": object_value("fallbackNews"),
        "fallbackAchievements": fallback_achievements,
        "gallery": gallery,
        "admission": object_value("admission"),
        "contact": object_value("contact"),
        "homeSections": home_sections,
    }


def _validate_homepage_content_form(existing_data, current_status):
    data = dict(existing_data)
    errors = []
    uploads = {
        "heroSlides": {},
        "heroVideos": {},
        "welcome": None,
        "programs": {},
        "fallbackNews": None,
        "fallbackAchievements": {},
        "gallery": {},
    }
    status = request.form.get("status", "").strip()
    if status not in {"draft", "published"}:
        errors.append("Status publikasi tidak valid.")

    def text(field, label, maximum, required=True):
        value = request.form.get(field, "").strip()
        if required and not value:
            errors.append(f"{label} wajib diisi.")
        if len(value) > maximum:
            errors.append(f"{label} maksimal {maximum} karakter.")
        return value

    def repeated(fields, labels, limits, required_fields=None, minimum=1, maximum=30):
        posted = [request.form.getlist(field) for field in fields]
        required_fields = set(fields) if required_fields is None else set(required_fields)
        count = len(posted[0]) if posted else 0
        if any(len(field_values) != count for field_values in posted):
            errors.append(f"Data pada bagian {labels[0]} tidak lengkap.")
            count = min((len(field_values) for field_values in posted), default=0)
        if count < minimum:
            errors.append(f"Minimal {minimum} data wajib ada pada bagian {labels[0]}.")
        if count > maximum:
            errors.append(f"Maksimal {maximum} data dapat diisi pada bagian {labels[0]}.")
            count = maximum

        items = []
        for index in range(count):
            item = {}
            for field, label, limit, field_values in zip(fields, labels, limits, posted):
                value = field_values[index].strip()
                if field in required_fields and not value:
                    errors.append(f"{label} pada baris {index + 1} wajib diisi.")
                if len(value) > limit:
                    errors.append(f"{label} pada baris {index + 1} maksimal {limit} karakter.")
                item[field] = value
            items.append(item)
        return items

    def valid_url(value):
        if value.startswith("/") and not value.startswith("//"):
            return True
        parsed_url = urlsplit(value)
        return parsed_url.scheme in {"http", "https"} and bool(parsed_url.netloc)

    def validate_url(value, label, required=False, allow_anchor=False):
        if not value:
            if required:
                errors.append(f"{label} wajib diisi.")
            return
        if allow_anchor and value.startswith("#") and len(value) > 1:
            return
        if not valid_url(value):
            errors.append(f"{label} harus berupa path lokal atau URL http/https.")

    def image_value(value, label, upload, required):
        value = value.strip()
        if len(value) > 500:
            errors.append(f"Data {label.lower()} tidak valid.")
        elif value:
            validate_url(value, label)
        has_upload = bool(upload and upload.filename)
        if has_upload:
            errors.extend(_validate_image_upload(upload, label.lower()))
        if required and not value and not has_upload:
            errors.append(f"{label} wajib tersedia. Silakan unggah file gambar.")
        return value

    hero = {
        "title": text("hero_title", "Judul hero", 180),
        "description": text("hero_description", "Deskripsi hero", 2000),
    }
    slide_rows = repeated(
        ("hero_slide_label", "hero_slide_type", "hero_slide_image", "hero_slide_video"),
        ("Label slide hero", "Jenis slide", "Gambar slide hero", "Video slide hero"),
        (100, 10, 500, 500),
        required_fields=("hero_slide_label", "hero_slide_type"),
        maximum=12,
    )
    hero_slides = []
    for index, row in enumerate(slide_rows):
        slide_type = row["hero_slide_type"]
        if slide_type not in {"photo", "video"}:
            errors.append(f"Jenis slide hero pada baris {index + 1} tidak valid.")
        image_upload = request.files.get(f"hero_slide_file_{index}")
        image = image_value(
            row["hero_slide_image"],
            "Gambar slide hero",
            image_upload,
            slide_type == "photo",
        )
        if image_upload and image_upload.filename:
            uploads["heroSlides"][index] = image_upload
        video_upload = request.files.get(f"hero_slide_video_file_{index}")
        video = row["hero_slide_video"] if slide_type == "video" else ""
        if video_upload and video_upload.filename:
            if slide_type != "video":
                errors.append(f"Unggah video hanya dapat digunakan pada slide video (baris {index + 1}).")
            else:
                errors.extend(_validate_video_upload(video_upload, f"video slide hero {index + 1}"))
                uploads["heroVideos"][index] = video_upload
        elif slide_type == "video" and not video:
            errors.append(f"Video slide hero pada baris {index + 1} wajib diunggah.")
        if video and not (video_upload and video_upload.filename):
            validate_url(video, f"Video slide hero pada baris {index + 1}")
        hero_slides.append(
            {"type": slide_type, "label": row["hero_slide_label"], "image": image, "video": video}
        )

    welcome = {
        "title": text("welcome_title", "Judul sambutan", 180),
        "name": text("welcome_name", "Nama kepala madrasah", 180),
        "greeting": text("welcome_greeting", "Salam pembuka", 180),
        "body": text("welcome_body", "Isi sambutan", 3000),
        "closing": text("welcome_closing", "Salam penutup", 180),
    }
    welcome_upload = request.files.get("welcome_image_file")
    welcome["image"] = image_value(
        request.form.get("welcome_image", "").strip(), "Foto kepala madrasah", welcome_upload, False
    )
    if welcome_upload and welcome_upload.filename:
        uploads["welcome"] = welcome_upload

    statistic_rows = repeated(
        ("statistics_value", "statistics_label"),
        ("Nilai statistik", "Label statistik"),
        (9, 100),
        maximum=8,
    )
    statistics = []
    for index, row in enumerate(statistic_rows):
        try:
            value = int(row["statistics_value"])
            if value < 0:
                raise ValueError
        except ValueError:
            errors.append(f"Nilai statistik pada baris {index + 1} harus berupa angka nol atau lebih.")
            value = 0
        statistics.append({"value": value, "label": row["statistics_label"]})

    program_rows = repeated(
        ("program_number", "program_title", "program_description"),
        ("Nomor program", "Judul program", "Deskripsi program"),
        (10, 180, 1000),
        maximum=12,
    )
    visual_sources = request.form.getlist("program_visual_src")
    visual_alts = request.form.getlist("program_visual_alt")
    expected_visuals = len(program_rows) * 3
    if len(visual_sources) != expected_visuals or len(visual_alts) != expected_visuals:
        errors.append("Setiap program harus memiliki tiga gambar beserta teks alternatif.")
    programs = []
    for index, row in enumerate(program_rows):
        visuals = []
        for visual_index in range(3):
            field_index = index * 3 + visual_index
            source = visual_sources[field_index].strip() if field_index < len(visual_sources) else ""
            alt = visual_alts[field_index].strip() if field_index < len(visual_alts) else ""
            if not alt:
                errors.append(f"Teks alternatif gambar program {index + 1}, gambar {visual_index + 1} wajib diisi.")
            if len(alt) > 180:
                errors.append(f"Teks alternatif gambar program {index + 1}, gambar {visual_index + 1} maksimal 180 karakter.")
            upload = request.files.get(f"program_visual_file_{index}_{visual_index}")
            if len(source) > 500:
                errors.append("Data gambar program tidak valid.")
            elif source:
                validate_url(source, "Gambar program")
            if upload and upload.filename:
                errors.extend(_validate_image_upload(upload, "gambar program"))
                uploads["programs"][(index, visual_index)] = upload
            elif not source:
                errors.append(f"Gambar program {index + 1}, gambar {visual_index + 1} wajib diunggah.")
            visuals.append({"src": source, "alt": alt})
        programs.append(
            {
                "number": row["program_number"],
                "title": row["program_title"],
                "description": row["program_description"],
                "visuals": visuals,
            }
        )

    values_rows = repeated(
        ("values_number", "values_title", "values_caption"),
        ("Nomor nilai", "Judul nilai", "Keterangan nilai"),
        (10, 180, 100),
        maximum=12,
    )
    values = [
        [row["values_number"], row["values_title"], row["values_caption"]]
        for row in values_rows
    ]

    fallback_news = {
        "title": text("fallback_news_title", "Judul berita bawaan", 180),
        "summary": text("fallback_news_summary", "Ringkasan berita bawaan", 1000),
        "dateTime": text("fallback_news_date", "Tanggal berita bawaan", 10),
    }
    try:
        date.fromisoformat(fallback_news["dateTime"])
    except ValueError:
        errors.append("Tanggal berita bawaan tidak valid.")
    fallback_news_upload = request.files.get("fallback_news_image_file")
    fallback_news["image"] = image_value(
        request.form.get("fallback_news_image", "").strip(),
        "Gambar berita bawaan",
        fallback_news_upload,
        True,
    )
    if fallback_news_upload and fallback_news_upload.filename:
        uploads["fallbackNews"] = fallback_news_upload

    fallback_achievement_rows = repeated(
        (
            "fallback_achievement_category",
            "fallback_achievement_title",
            "fallback_achievement_date",
            "fallback_achievement_image",
        ),
        ("Kategori prestasi", "Judul prestasi", "Tanggal prestasi", "Gambar prestasi"),
        (100, 180, 10, 500),
        required_fields=(
            "fallback_achievement_category",
            "fallback_achievement_title",
            "fallback_achievement_date",
        ),
        maximum=12,
    )
    fallback_achievements = []
    for index, row in enumerate(fallback_achievement_rows):
        try:
            date.fromisoformat(row["fallback_achievement_date"])
        except ValueError:
            errors.append(f"Tanggal prestasi bawaan pada baris {index + 1} tidak valid.")
        upload = request.files.get(f"fallback_achievement_file_{index}")
        image = image_value(
            row["fallback_achievement_image"],
            f"Gambar prestasi bawaan pada baris {index + 1}",
            upload,
            True,
        )
        if upload and upload.filename:
            uploads["fallbackAchievements"][index] = upload
        fallback_achievements.append(
            {
                "category": row["fallback_achievement_category"],
                "title": row["fallback_achievement_title"],
                "image": image,
                "dateTime": row["fallback_achievement_date"],
            }
        )

    gallery_rows = repeated(
        ("gallery_title", "gallery_category", "gallery_image", "gallery_position"),
        ("Judul foto", "Kategori foto", "Gambar", "Posisi gambar"),
        (180, 100, 500, 20),
        required_fields=("gallery_title", "gallery_category"),
        maximum=30,
    )
    gallery_items = []
    existing_gallery = existing_data.get("gallery", [])
    existing_gallery_categories = set()
    if isinstance(existing_gallery, list):
        existing_gallery_categories = {
            item.get("category")
            for item in existing_gallery
            if isinstance(item, dict) and isinstance(item.get("category"), str)
        }
    for index, row in enumerate(gallery_rows):
        if (
            row["gallery_category"] not in HOME_GALLERY_CATEGORIES
            and row["gallery_category"] not in existing_gallery_categories
        ):
            errors.append(f"Kategori galeri pada baris {index + 1} tidak valid.")
        upload = request.files.get(f"gallery_image_file_{index}")
        image = image_value(row["gallery_image"], "Gambar galeri", upload, True)
        if upload and upload.filename:
            uploads["gallery"][index] = upload
        image_position = row["gallery_position"] or "50% 50%"
        position_match = re.fullmatch(r"(\d{1,3})%\s+(\d{1,3})%", image_position)
        if position_match is None:
            errors.append(f"Posisi gambar galeri pada baris {index + 1} tidak valid.")
            image_position = "50% 50%"
        else:
            horizontal, vertical = map(int, position_match.groups())
            if horizontal > 100 or vertical > 100:
                errors.append(
                    f"Posisi gambar galeri pada baris {index + 1} harus berada antara 0% dan 100%."
                )
                image_position = "50% 50%"
            else:
                image_position = f"{horizontal}% {vertical}%"
        gallery_items.append(
            {
                "title": row["gallery_title"],
                "category": row["gallery_category"],
                "image": image,
                "imagePosition": image_position,
            }
        )

    section_fields = {
        "programs": {
            "eyebrow": ("home_programs_eyebrow", "Label bagian program", 100),
            "title": ("home_programs_title", "Judul bagian program", 180),
        },
        "vision": {
            "eyebrow": ("home_vision_eyebrow", "Label bagian visi", 100),
            "title": ("home_vision_title", "Judul bagian visi", 180),
            "description": ("home_vision_description", "Deskripsi bagian visi", 1000),
            "visionLabel": ("home_vision_label", "Label visi", 100),
            "statement": ("home_vision_statement", "Pernyataan visi", 500),
            "missionLabel": ("home_mission_label", "Label misi", 100),
            "linkLabel": ("home_vision_link_label", "Teks tautan visi dan misi", 120),
            "linkUrl": ("home_vision_link_url", "Tautan visi dan misi", 500),
        },
        "news": {
            "eyebrow": ("home_news_eyebrow", "Label bagian berita", 100),
            "title": ("home_news_title", "Judul bagian berita", 180),
            "description": ("home_news_description", "Deskripsi bagian berita", 1000),
            "newsLabel": ("home_news_label", "Label berita", 100),
            "newsLinkLabel": ("home_news_link_label", "Teks tautan berita", 120),
            "newsLinkUrl": ("home_news_link_url", "Tautan berita", 500),
            "achievementsLabel": ("home_achievements_label", "Label prestasi", 100),
            "achievementsLinkLabel": ("home_achievements_link_label", "Teks tautan prestasi", 120),
            "achievementsLinkUrl": ("home_achievements_link_url", "Tautan prestasi", 500),
        },
        "gallery": {
            "eyebrow": ("home_gallery_eyebrow", "Label bagian galeri", 100),
            "title": ("home_gallery_title", "Judul bagian galeri", 180),
        },
        "admission": {
            "eyebrow": ("home_admission_eyebrow", "Label penerimaan siswa", 100),
        },
        "contact": {
            "eyebrow": ("home_contact_eyebrow", "Label bagian kontak", 100),
            "title": ("home_contact_title", "Judul bagian kontak", 180),
            "mapContextLabel": ("contact_map_context_label", "Label toolbar peta", 100),
            "mapTitle": ("contact_map_title", "Nama lokasi pada peta", 120),
        },
    }
    home_sections = {}
    for section, fields in section_fields.items():
        home_sections[section] = {
            key: text(field, label, maximum)
            for key, (field, label, maximum) in fields.items()
        }
    for key in ("linkUrl",):
        validate_url(home_sections["vision"][key], "Tautan visi dan misi", allow_anchor=True)
    validate_url(home_sections["news"]["newsLinkUrl"], "Tautan berita", allow_anchor=True)
    validate_url(home_sections["news"]["achievementsLinkUrl"], "Tautan prestasi", allow_anchor=True)

    admission = {
        "title": text("admission_title", "Judul penerimaan siswa", 180),
        "description": text("admission_description", "Deskripsi penerimaan siswa", 2000),
        "primaryLabel": text("admission_primary_label", "Teks tombol utama penerimaan", 100),
        "secondaryLabel": text("admission_secondary_label", "Teks tombol informasi penerimaan", 100),
        "url": text("admission_url", "Tautan penerimaan siswa", 500),
    }
    validate_url(admission["url"], "Tautan penerimaan siswa")

    contact_fields = {
        "addressLabel": ("contact_address_label", "Label alamat", 100),
        "address": ("contact_address", "Alamat madrasah", 500),
        "phoneLabel": ("contact_phone_label", "Label telepon", 100),
        "phone": ("contact_phone", "Nomor telepon", 180),
        "emailLabel": ("contact_email_label", "Label email", 100),
        "email": ("contact_email", "Alamat email", 180),
        "hoursLabel": ("contact_hours_label", "Label jam pelayanan", 100),
        "hours": ("contact_hours", "Jam pelayanan", 500),
        "mapCaption": ("contact_map_caption", "Keterangan lokasi peta", 300),
        "mapUrl": ("contact_map_url", "Alamat peta", 500),
    }
    contact = {
        key: text(field, label, maximum)
        for key, (field, label, maximum) in contact_fields.items()
    }
    validate_url(contact["mapUrl"], "Alamat peta")

    old_sections = data.get("homeSections")
    old_sections = old_sections if isinstance(old_sections, dict) else {}
    data.update(
        {
            "hero": hero,
            "heroSlides": hero_slides,
            "welcome": welcome,
            "statistics": statistics,
            "programs": programs,
            "values": values,
            "fallbackNews": fallback_news,
            "fallbackAchievements": fallback_achievements,
            "gallery": gallery_items,
            "admission": admission,
            "contact": contact,
            "homeSections": {**old_sections, **home_sections},
        }
    )
    return data, status or current_status, errors, uploads


def _history_form_values(data):
    defaults = PAGE_DATA_DEFAULTS["sejarah"]
    saved_story = data.get("story")
    story = {**defaults["story"], **(saved_story if isinstance(saved_story, dict) else {})}
    return {
        "story": story,
        "logo": story.get("logo", ""),
        "milestones": data.get("milestones")
        if isinstance(data.get("milestones"), list)
        else defaults["milestones"],
        "emblem_points": data.get("emblemPoints")
        if isinstance(data.get("emblemPoints"), list)
        else defaults["emblemPoints"],
        "leaders": data.get("leaders")
        if isinstance(data.get("leaders"), list)
        else defaults["leaders"],
    }


def _validate_history_content_form(existing_data):
    data = dict(existing_data)
    errors = []
    history_values = _history_form_values(data)
    story = dict(history_values["story"])

    text_fields = {
        "title": ("story_title", "Judul kisah", 180, True),
        "description": ("story_description", "Deskripsi kisah", 2000, True),
        "foundedLabel": ("founded_label", "Label tahun berdiri", 100, True),
        "founded": ("founded", "Tahun berdiri", 100, True),
        "tenureLabel": ("tenure_label", "Label masa pengabdian", 100, True),
        "tenure": ("tenure", "Masa pengabdian", 100, True),
        "accreditationLabel": ("accreditation_label", "Label status mutu", 100, True),
        "accreditation": ("accreditation", "Status mutu", 180, True),
        "milestonesTitle": ("history_milestones_title", "Judul linimasa", 180, True),
        "emblemTitle": ("emblem_title", "Judul bagian lambang", 180, True),
        "emblemLogoTitle": ("emblem_logo_title", "Nama lambang", 180, True),
        "leadersTitle": ("leaders_title", "Judul daftar kepala madrasah", 180, True),
    }
    for key, (field, label, max_length, required) in text_fields.items():
        value = request.form.get(field, "").strip()
        story[key] = value
        if required and not value:
            errors.append(f"{label} wajib diisi.")
        if len(value) > max_length:
            errors.append(f"{label} maksimal {max_length} karakter.")

    image_urls = {
        "logo": request.form.get("emblem_logo_url", "").strip(),
    }
    logo_file = request.files.get("emblem_logo_file")
    uploads = {"logo": None, "leaders": {}}
    if logo_file and logo_file.filename:
        errors.extend(_validate_image_upload(logo_file, "logo lambang"))
        uploads["logo"] = logo_file
    for url in image_urls.values():
        if len(url) > 500:
            errors.append("Data gambar logo tidak valid.")
        elif url:
            parsed_url = urlsplit(url)
            if not (url.startswith("/") and not url.startswith("//")) and (
                parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc
            ):
                errors.append("Gambar logo tidak valid.")
    story["logo"] = image_urls["logo"]
    data["story"] = story
    history_values["story"] = story
    history_values["logo"] = image_urls["logo"]

    repeaters = (
        (
            "milestones",
            "milestones",
            ("year", "title", "text", "noteTitle", "note"),
            ("Tahun", "Judul tonggak", "Uraian tonggak", "Judul catatan", "Isi catatan"),
            (40, 180, 2000, 180, 2000),
            True,
        ),
        (
            "emblem_points",
            "emblemPoints",
            ("icon", "title", "text"),
            ("Ikon", "Judul makna lambang", "Uraian makna lambang"),
            (30, 180, 1000),
            False,
        ),
        (
            "leaders",
            "leaders",
            ("period", "name", "image"),
            ("Periode", "Nama kepala madrasah", "Foto kepala madrasah"),
            (100, 180, 500),
            True,
        ),
    )
    for form_key, data_key, item_keys, labels, limits, required_list in repeaters:
        posted_fields = [
            request.form.getlist(f"{form_key}_{key}")
            for key in item_keys
        ]
        row_count = len(posted_fields[0])
        if any(len(field_values) != row_count for field_values in posted_fields):
            errors.append(f"Data pada bagian {form_key.replace('_', ' ')} tidak lengkap.")
            row_count = min(len(field_values) for field_values in posted_fields)
        if required_list and row_count == 0:
            errors.append(f"Minimal satu data wajib ada pada bagian {form_key.replace('_', ' ')}.")

        items = []
        for index in range(row_count):
            item = {
                key: field_values[index].strip()
                for key, field_values in zip(item_keys, posted_fields)
            }
            for key, label, max_length in zip(item_keys, labels, limits):
                value = item[key]
                optional_value = key == "icon" or (data_key == "leaders" and key == "image")
                if not optional_value and not value:
                    errors.append(f"{label} pada baris {index + 1} wajib diisi.")
                if len(value) > max_length:
                    errors.append(f"{label} pada baris {index + 1} maksimal {max_length} karakter.")
            items.append(item)

            if data_key == "leaders":
                image_url = item["image"]
                upload = request.files.get(f"leader_image_file_{index}")
                if upload and upload.filename:
                    errors.extend(_validate_image_upload(upload, "foto kepala madrasah"))
                    uploads["leaders"][index] = upload
                if len(image_url) > 500:
                    errors.append(f"Data foto kepala madrasah pada baris {index + 1} tidak valid.")
                elif image_url:
                    parsed_url = urlsplit(image_url)
                    if not (image_url.startswith("/") and not image_url.startswith("//")) and (
                        parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc
                    ):
                        errors.append(
                            f"Foto kepala madrasah pada baris {index + 1} tidak valid."
                        )

        data[data_key] = items
        history_values[form_key] = items

    return data, history_values, errors, uploads


def _validate_guru_form(current_image_url=""):
    values = {
        "name": request.form.get("name", "").strip(),
        "role": request.form.get("role", "").strip(),
        "image_url": current_image_url,
        "sort_order": request.form.get("sort_order", "").strip(),
    }
    image = request.files.get("image")
    errors = []
    if not values["name"]:
        errors.append("Nama guru wajib diisi.")
    elif len(values["name"]) > 180:
        errors.append("Nama guru maksimal 180 karakter.")
    if not values["role"]:
        errors.append("Jabatan atau mata pelajaran wajib diisi.")
    elif len(values["role"]) > 180:
        errors.append("Jabatan atau mata pelajaran maksimal 180 karakter.")
    if image and image.filename:
        errors.extend(_validate_image_upload(image, "foto"))
    elif not values.get("image_url"):
        errors.append("Pilih file foto guru untuk diunggah.")
    try:
        values["sort_order"] = int(values["sort_order"])
        if values["sort_order"] < 1:
            errors.append("Urutan tampil harus dimulai dari angka 1.")
    except (TypeError, ValueError):
        values["sort_order"] = 1
        errors.append("Urutan harus berupa angka.")
    return values, errors


def _reorder_guru_directory(db, guru_id=None, requested_order=None):
    if guru_id is None:
        rows = db.execute(
            "SELECT id FROM guru_directory ORDER BY sort_order, id"
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT id FROM guru_directory
            WHERE id != ?
            ORDER BY sort_order, id
            """,
            (guru_id,),
        ).fetchall()
    ordered_ids = [row["id"] for row in rows]
    if guru_id is not None and requested_order is not None:
        position = min(max(requested_order - 1, 0), len(ordered_ids))
        ordered_ids.insert(position, guru_id)

    for sort_order, entry_id in enumerate(ordered_ids, start=1):
        db.execute(
            "UPDATE guru_directory SET sort_order = ? WHERE id = ?",
            (sort_order, entry_id),
        )


def _reorder_tendik_directory(db, tendik_id=None, requested_order=None):
    if tendik_id is None:
        rows = db.execute(
            "SELECT id FROM tendik_directory ORDER BY sort_order, id"
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT id FROM tendik_directory
            WHERE id != ?
            ORDER BY sort_order, id
            """,
            (tendik_id,),
        ).fetchall()
    ordered_ids = [row["id"] for row in rows]
    if tendik_id is not None and requested_order is not None:
        position = min(max(requested_order - 1, 0), len(ordered_ids))
        ordered_ids.insert(position, tendik_id)

    for sort_order, entry_id in enumerate(ordered_ids, start=1):
        db.execute(
            "UPDATE tendik_directory SET sort_order = ? WHERE id = ?",
            (sort_order, entry_id),
        )


def _validate_tendik_form(current_image_url=""):
    values = {
        "name": request.form.get("name", "").strip(),
        "role": request.form.get("role", "").strip(),
        "image_url": current_image_url,
        "sort_order": request.form.get("sort_order", "").strip(),
    }
    image = request.files.get("image")
    errors = []
    for key, label, maximum in (
        ("name", "Nama tendik", 180),
        ("role", "Jabatan", 180),
    ):
        if not values[key]:
            errors.append(f"{label} wajib diisi.")
        elif len(values[key]) > maximum:
            errors.append(f"{label} maksimal {maximum} karakter.")
    if image and image.filename:
        errors.extend(_validate_image_upload(image, "foto"))
    elif not values["image_url"]:
        errors.append("Pilih foto tenaga kependidikan untuk diunggah.")
    try:
        values["sort_order"] = int(values["sort_order"])
        if values["sort_order"] < 1:
            errors.append("Urutan tampil harus dimulai dari angka 1.")
    except (TypeError, ValueError):
        values["sort_order"] = 1
        errors.append("Urutan harus berupa angka.")
    return values, errors


def _validate_image_upload(image, label="gambar"):
    filename = secure_filename(image.filename)
    extension = Path(filename).suffix.lower()
    signatures = {
        ".jpg": lambda header: header.startswith(b"\xff\xd8\xff"),
        ".jpeg": lambda header: header.startswith(b"\xff\xd8\xff"),
        ".png": lambda header: header.startswith(b"\x89PNG\r\n\x1a\n"),
        ".webp": lambda header: header.startswith(b"RIFF") and header[8:12] == b"WEBP",
    }
    signature_check = signatures.get(extension)
    errors = []
    if signature_check is None:
        errors.append("Format gambar harus JPG, PNG, atau WebP.")
    else:
        header = image.stream.read(12)
        image.stream.seek(0)
        if not signature_check(header):
            errors.append("Isi file tidak sesuai dengan format gambar yang dipilih.")
        image.stream.seek(0, 2)
        image_size = image.stream.tell()
        image.stream.seek(0)
        if image_size > 5 * 1024 * 1024:
            errors.append(f"Ukuran {label} maksimal 5 MB.")
    return errors


def _validate_video_upload(video, label="video"):
    filename = secure_filename(video.filename)
    extension = Path(filename).suffix.lower()
    errors = []
    if extension != ".mp4":
        errors.append("Format video harus MP4.")
    else:
        header = video.stream.read(12)
        video.stream.seek(0)
        if len(header) < 8 or header[4:8] != b"ftyp":
            errors.append("Isi file tidak sesuai dengan format video MP4.")
        video.stream.seek(0, 2)
        video_size = video.stream.tell()
        video.stream.seek(0)
        if video_size > 25 * 1024 * 1024:
            errors.append(f"Ukuran {label} maksimal 25 MB.")
    return errors


def _save_guru_image(image):
    filename = secure_filename(image.filename)
    extension = Path(filename).suffix.lower()
    stored_name = f"{uuid4().hex}{extension}"
    upload_folder = Path(current_app.config["GURU_UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    image.save(upload_folder / stored_name)
    return f"/static/uploads/guru/{stored_name}"


def _save_tendik_image(image):
    filename = secure_filename(image.filename)
    extension = Path(filename).suffix.lower()
    stored_name = f"{uuid4().hex}{extension}"
    upload_folder = Path(current_app.config["TENDIK_UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    image.save(upload_folder / stored_name)
    return f"/static/uploads/tendik/{stored_name}"


def _save_content_image(image):
    extension = Path(secure_filename(image.filename)).suffix.lower()
    stored_name = f"{uuid4().hex}{extension}"
    upload_folder = Path(current_app.config["CONTENT_UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    image.save(upload_folder / stored_name)
    return f"/static/uploads/content/{stored_name}"


def _save_content_video(video):
    stored_name = f"{uuid4().hex}.mp4"
    upload_folder = Path(current_app.config["CONTENT_UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)
    video.save(upload_folder / stored_name)
    return f"/static/uploads/content/{stored_name}"


def _delete_guru_image(image_url):
    prefix = "/static/uploads/guru/"
    if not image_url.startswith(prefix):
        return
    filename = image_url[len(prefix):]
    if not filename or Path(filename).name != filename:
        return
    upload_folder = Path(current_app.config["GURU_UPLOAD_FOLDER"]).resolve()
    image_path = (upload_folder / filename).resolve()
    if image_path.parent != upload_folder:
        return
    try:
        image_path.unlink(missing_ok=True)
    except OSError as error:
        current_app.logger.warning("Tidak dapat menghapus foto guru %s: %s", filename, error)


def _delete_tendik_image(image_url):
    prefix = "/static/uploads/tendik/"
    if not image_url.startswith(prefix):
        return
    filename = image_url[len(prefix):]
    if not filename or Path(filename).name != filename:
        return
    upload_folder = Path(current_app.config["TENDIK_UPLOAD_FOLDER"]).resolve()
    image_path = (upload_folder / filename).resolve()
    if image_path.parent != upload_folder:
        return
    try:
        image_path.unlink(missing_ok=True)
    except OSError as error:
        current_app.logger.warning("Tidak dapat menghapus foto tendik %s: %s", filename, error)


def _validate_navigation_order(value, errors):
    try:
        order = int(value)
    except (TypeError, ValueError):
        errors.append("Urutan harus berupa angka.")
        return 0

    if order < 0:
        errors.append("Urutan tidak boleh kurang dari 0.")
    return order


def _validate_navigation_group_form():
    values = {
        "title": request.form.get("title", "").strip(),
        "menu_key": request.form.get("menu_key", "tentang").strip(),
        "sort_order": request.form.get("sort_order", "").strip(),
    }
    errors = []
    if not values["title"]:
        errors.append("Nama kategori wajib diisi.")
    elif len(values["title"]) > 80:
        errors.append("Nama kategori maksimal 80 karakter.")

    if values["menu_key"] not in NAVIGATION_MENUS:
        errors.append("Menu utama yang dipilih tidak valid.")

    values["sort_order"] = _validate_navigation_order(values["sort_order"], errors)
    return values, errors


def _validate_navigation_item_form():
    values = {
        "group_id": request.form.get("group_id", "").strip(),
        "label": request.form.get("label", "").strip(),
        "href": request.form.get("href", "").strip(),
        "sort_order": request.form.get("sort_order", "").strip(),
    }
    errors = []

    try:
        values["group_id"] = int(values["group_id"])
    except (TypeError, ValueError):
        values["group_id"] = 0
        errors.append("Kategori wajib dipilih.")

    if not values["label"]:
        errors.append("Nama submenu wajib diisi.")
    elif len(values["label"]) > 100:
        errors.append("Nama submenu maksimal 100 karakter.")

    if not values["href"] or len(values["href"]) > 300:
        errors.append("Alamat submenu wajib diisi dan maksimal 300 karakter.")
    else:
        parsed_href = urlsplit(values["href"])
        if values["href"].startswith("/") and not values["href"].startswith("//"):
            pass
        elif parsed_href.scheme not in {"http", "https"} or not parsed_href.netloc:
            errors.append("Alamat harus berupa path lokal (diawali /) atau URL http/https.")

    values["sort_order"] = _validate_navigation_order(values["sort_order"], errors)
    return values, errors


def create_app(test_config=None):
    project_root = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        template_folder=str(project_root / "admin" / "templates"),
        static_folder=str(project_root / "admin" / "static"),
    )
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", ""),
        ADMIN_USERNAME=os.environ.get("ADMIN_USERNAME", ""),
        ADMIN_PASSWORD=os.environ.get("ADMIN_PASSWORD", ""),
        MAX_CONTENT_LENGTH=50 * 1024 * 1024,
        TEMPLATES_AUTO_RELOAD=True,
        GURU_UPLOAD_FOLDER=str(Path(app.static_folder) / "uploads" / "guru"),
        TENDIK_UPLOAD_FOLDER=str(Path(app.static_folder) / "uploads" / "tendik"),
        CONTENT_UPLOAD_FOLDER=str(Path(app.static_folder) / "uploads" / "content"),
        DATABASE=os.environ.get(
            "ADMIN_DATABASE",
            str(Path(app.instance_path) / "admin.sqlite3"),
        ),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("ADMIN_COOKIE_SECURE", "").lower() == "true",
    )
    if test_config:
        app.config.update(test_config)

    if len(app.config["SECRET_KEY"]) < 32:
        raise RuntimeError("FLASK_SECRET_KEY harus berisi minimal 32 karakter acak.")
    if not app.config["ADMIN_USERNAME"] or len(app.config["ADMIN_PASSWORD"]) < 12:
        raise RuntimeError("Atur ADMIN_USERNAME dan ADMIN_PASSWORD (minimal 12 karakter).")

    @app.teardown_appcontext
    def teardown_db(_error):
        close_db(_error)

    def csrf_token():
        token = session.get("csrf_token")
        if token is None:
            token = secrets.token_urlsafe(32)
            session["csrf_token"] = token
        return token

    app.jinja_env.globals["csrf_token"] = csrf_token

    @app.before_request
    def validate_csrf():
        if request.method != "POST":
            return None

        expected = session.get("csrf_token", "")
        supplied = request.form.get("csrf_token", "")
        if not expected or not supplied or not hmac.compare_digest(
            expected.encode("utf-8"),
            supplied.encode("utf-8"),
        ):
            abort(400, description="Token keamanan tidak valid. Muat ulang halaman dan coba lagi.")
        return None

    def login_required(view):
        @wraps(view)
        def wrapped_view(*args, **kwargs):
            if not session.get("admin_authenticated"):
                return redirect(url_for("login"))
            return view(*args, **kwargs)

        return wrapped_view

    @app.get("/")
    def index():
        return redirect(url_for("dashboard"))

    @app.get("/api/content")
    def public_content():
        content_type = request.args.get("type", "")
        if content_type not in CONTENT_TYPES:
            abort(400, description="Jenis konten tidak valid.")

        items = get_db().execute(
            """
            SELECT id, content_type, title, summary, body, achievement_level,
                   achievement_category, student_names, image_url, image_position,
                   published_at, placement
            FROM content
            WHERE content_type = ? AND status = 'published'
            ORDER BY CASE WHEN placement = 'utama' THEN 0 ELSE 1 END,
                     published_at DESC, id DESC
            """,
            (content_type,),
        ).fetchall()
        return jsonify([dict(item) for item in items])

    @app.get("/api/artikel/<int:article_id>/comments")
    def public_article_comments(article_id):
        article = get_db().execute(
            """
            SELECT id FROM content
            WHERE id = ? AND content_type = 'artikel' AND status = 'published'
            """,
            (article_id,),
        ).fetchone()
        if article is None:
            abort(404)

        comments = get_db().execute(
            """
            SELECT name, body, submitted_at
            FROM article_comments
            WHERE article_id = ? AND status = 'approved'
            ORDER BY submitted_at DESC, id DESC
            """,
            (article_id,),
        ).fetchall()
        return jsonify([dict(comment) for comment in comments])

    @app.get("/api/artikel/comments/form-token")
    def article_comment_form_token():
        return jsonify(csrfToken=csrf_token())

    @app.post("/api/artikel/comments")
    def submit_article_comment():
        article_id = request.form.get("article_id", "").strip()
        if not article_id.isdigit():
            return jsonify(message="Artikel yang dipilih tidak valid."), 400
        article = get_db().execute(
            """
            SELECT id FROM content
            WHERE id = ? AND content_type = 'artikel' AND status = 'published'
            """,
            (int(article_id),),
        ).fetchone()
        if article is None:
            abort(404)

        name = request.form.get("name", "").strip()
        body = request.form.get("body", "").strip()
        errors = {}
        if request.form.get("website", "").strip():
            errors["form"] = "Permintaan tidak valid."
        if len(name) < 2 or len(name) > 60:
            errors["name"] = "Nama harus berisi 2 sampai 60 karakter."
        if len(body) < 10 or len(body) > 1000:
            errors["body"] = "Komentar harus berisi 10 sampai 1000 karakter."
        if request.form.get("consent") != "yes":
            errors["consent"] = "Persetujuan penayangan komentar wajib diberikan."
        if errors:
            return jsonify(
                message="Periksa kembali komentar yang dikirim.",
                errors=errors,
            ), 400

        get_db().execute(
            """
            INSERT INTO article_comments (article_id, name, body)
            VALUES (?, ?, ?)
            """,
            (int(article_id), name, body),
        )
        get_db().commit()
        return jsonify(
            message="Terima kasih. Komentar Anda menunggu persetujuan admin."
        ), 201

    @app.get("/api/pages/<page_slug>")
    def public_page_content(page_slug):
        if page_slug not in PAGE_TYPES:
            abort(404)
        page = get_db().execute(
            """
            SELECT page_slug, title, badge, description, data_json
            FROM page_content
            WHERE page_slug = ? AND status = 'published'
            """,
            (page_slug,),
        ).fetchone()
        if page is None:
            abort(404)
        page_data = dict(page)
        try:
            page_data["data"] = json.loads(page_data.pop("data_json") or "{}")
        except json.JSONDecodeError:
            current_app.logger.exception("Invalid page content JSON for %s", page_slug)
            page_data["data"] = {}
        if page_slug == "direktori-tendik" and isinstance(page_data["data"], dict):
            page_data["data"].pop("people", None)
        return jsonify(page_data)

    @app.get("/api/testimoni-alumni/form-token")
    def testimonial_form_token():
        return jsonify(csrfToken=csrf_token())

    @app.post("/api/testimoni-alumni/submissions")
    def submit_alumni_testimonial():
        submission = {
            "name": request.form.get("name", "").strip(),
            "institution": request.form.get("institution", "").strip(),
            "year": request.form.get("year", "").strip(),
            "quote": request.form.get("quote", "").strip(),
        }
        errors = {}
        if request.form.get("website", "").strip():
            errors["form"] = "Permintaan tidak valid."
        if len(submission["name"]) < 2 or len(submission["name"]) > 80:
            errors["name"] = "Nama harus berisi 2 sampai 80 karakter."
        if len(submission["institution"]) < 2 or len(submission["institution"]) > 120:
            errors["institution"] = "Asal sekolah atau kampus harus berisi 2 sampai 120 karakter."
        current_year = date.today().year
        if (
            re.fullmatch(r"\d{4}", submission["year"]) is None
            or not 1900 <= int(submission["year"] or 0) <= current_year
        ):
            errors["year"] = "Tahun kelulusan harus berupa tahun yang valid."
        quote_word_count = len(submission["quote"].split())
        if (
            quote_word_count < 20
            or quote_word_count > 80
            or len(submission["quote"]) > 2000
        ):
            errors["quote"] = "Cerita harus berisi 20 sampai 80 kata dan maksimal 2000 karakter."
        if request.form.get("consent") != "yes":
            errors["consent"] = "Persetujuan publikasi wajib diberikan."

        image = request.files.get("image")
        if image and image.filename:
            image_errors = _validate_image_upload(image, "foto profil")
            if image_errors:
                errors["image"] = " ".join(image_errors)
        if errors:
            return jsonify(
                message="Periksa kembali data testimoni yang dikirim.",
                errors=errors,
            ), 400

        image_url = _save_content_image(image) if image and image.filename else ""
        db = get_db()
        db.execute(
            """
            INSERT INTO alumni_testimonial_submissions
                (name, institution, year, quote, image_url)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                submission["name"],
                submission["institution"],
                submission["year"],
                submission["quote"],
                image_url,
            ),
        )
        db.commit()
        return jsonify(
            message="Terima kasih. Testimoni Anda sudah dikirim dan menunggu persetujuan admin."
        ), 201

    @app.get("/api/staff/guru")
    def public_guru_directory():
        entries = get_db().execute(
            """
            SELECT id, name, role, image_url, sort_order
            FROM guru_directory ORDER BY sort_order, id
            """
        ).fetchall()
        return jsonify([dict(entry) for entry in entries])

    @app.get("/api/staff/tendik")
    def public_tendik_directory():
        entries = get_db().execute(
            """
            SELECT id, name, role, image_url, sort_order
            FROM tendik_directory ORDER BY sort_order, id
            """
        ).fetchall()
        return jsonify([dict(entry) for entry in entries])

    @app.get("/api/navigation")
    def public_navigation():
        db = get_db()
        groups = db.execute(
            """
            SELECT id, title, menu_key, sort_order
            FROM navigation_groups ORDER BY sort_order, id
            """
        ).fetchall()
        navigation = []
        for group in groups:
            items = db.execute(
                """
                SELECT id, label, href, sort_order
                FROM navigation_items
                WHERE group_id = ?
                ORDER BY sort_order, id
                """,
                (group["id"],),
            ).fetchall()
            navigation.append(
                {
                    "id": group["id"],
                    "title": group["title"],
                    "menu_key": group["menu_key"],
                    "sort_order": group["sort_order"],
                    "items": [dict(item) for item in items],
                }
            )
        return jsonify(navigation)

    @app.post("/admin/uploads/images")
    @login_required
    def content_image_upload():
        image = request.files.get("image")
        if image is None or not image.filename:
            return jsonify(error="Pilih gambar yang akan diunggah."), 400
        errors = _validate_image_upload(image)
        if errors:
            return jsonify(error=" ".join(errors)), 400
        return jsonify(url=_save_content_image(image))

    @app.get("/admin/navigation")
    @login_required
    def navigation_list():
        db = get_db()
        groups = db.execute(
            """
            SELECT id, title, menu_key, sort_order
            FROM navigation_groups ORDER BY sort_order, id
            """
        ).fetchall()
        navigation = []
        for group in groups:
            items = db.execute(
                """
                SELECT id, label, href, sort_order
                FROM navigation_items
                WHERE group_id = ?
                ORDER BY sort_order, id
                """,
                (group["id"],),
            ).fetchall()
            navigation.append({
                **dict(group),
                "menu_label": NAVIGATION_MENUS[group["menu_key"]],
                "submenus": items,
            })
        return render_template(
            "admin/navigation_list.html",
            content_types=CONTENT_TYPES,
            navigation_menus=NAVIGATION_MENUS,
            groups=navigation,
        )

    @app.route("/admin/navigation/groups/new", methods=["GET", "POST"])
    @login_required
    def navigation_group_new():
        db = get_db()
        values = {
            "title": "",
            "menu_key": "tentang",
            "sort_order": db.execute(
                "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM navigation_groups"
            ).fetchone()[0],
        }
        errors = []
        if request.method == "POST":
            values, errors = _validate_navigation_group_form()
            if not errors:
                db.execute(
                    """
                    INSERT INTO navigation_groups (title, menu_key, sort_order)
                    VALUES (?, ?, ?)
                    """,
                    (values["title"], values["menu_key"], values["sort_order"]),
                )
                db.commit()
                flash("Kategori navigasi berhasil ditambahkan.", "success")
                return redirect(url_for("navigation_list"))

        return render_template(
            "admin/navigation_group_form.html",
            content_types=CONTENT_TYPES,
            values=values,
            errors=errors,
            navigation_menus=NAVIGATION_MENUS,
            page_title="Tambah Kategori",
        ), (400 if errors else 200)

    @app.route("/admin/navigation/groups/<int:group_id>/edit", methods=["GET", "POST"])
    @login_required
    def navigation_group_edit(group_id):
        db = get_db()
        group = db.execute(
            "SELECT id, title, menu_key, sort_order FROM navigation_groups WHERE id = ?",
            (group_id,),
        ).fetchone()
        if group is None:
            abort(404)

        values = dict(group)
        errors = []
        if request.method == "POST":
            values, errors = _validate_navigation_group_form()
            if not errors:
                db.execute(
                    """
                    UPDATE navigation_groups
                    SET title = ?, menu_key = ?, sort_order = ?
                    WHERE id = ?
                    """,
                    (values["title"], values["menu_key"], values["sort_order"], group_id),
                )
                db.commit()
                flash("Kategori navigasi berhasil diperbarui.", "success")
                return redirect(url_for("navigation_list"))

        return render_template(
            "admin/navigation_group_form.html",
            content_types=CONTENT_TYPES,
            values=values,
            errors=errors,
            navigation_menus=NAVIGATION_MENUS,
            page_title="Edit Kategori",
        ), (400 if errors else 200)

    @app.post("/admin/navigation/groups/<int:group_id>/delete")
    @login_required
    def navigation_group_delete(group_id):
        db = get_db()
        result = db.execute("DELETE FROM navigation_groups WHERE id = ?", (group_id,))
        if result.rowcount == 0:
            abort(404)
        db.commit()
        flash("Kategori dan seluruh submenu di dalamnya berhasil dihapus.", "success")
        return redirect(url_for("navigation_list"))

    @app.route("/admin/navigation/items/new", methods=["GET", "POST"])
    @login_required
    def navigation_item_new():
        db = get_db()
        groups = db.execute(
            """
            SELECT id, title, menu_key
            FROM navigation_groups ORDER BY sort_order, id
            """
        ).fetchall()
        if not groups:
            flash("Buat kategori navigasi terlebih dahulu.", "error")
            return redirect(url_for("navigation_group_new"))

        selected_group_id = request.args.get("group_id", type=int) or groups[0]["id"]
        values = {
            "group_id": selected_group_id,
            "label": "",
            "href": "",
            "sort_order": db.execute(
                "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM navigation_items WHERE group_id = ?",
                (selected_group_id,),
            ).fetchone()[0],
        }
        errors = []
        if request.method == "POST":
            values, errors = _validate_navigation_item_form()
            if not any(group["id"] == values["group_id"] for group in groups):
                errors.append("Kategori yang dipilih tidak tersedia.")
            if not errors:
                db.execute(
                    """
                    INSERT INTO navigation_items (group_id, label, href, sort_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (values["group_id"], values["label"], values["href"], values["sort_order"]),
                )
                db.commit()
                flash("Submenu berhasil ditambahkan.", "success")
                return redirect(url_for("navigation_list"))

        return render_template(
            "admin/navigation_item_form.html",
            content_types=CONTENT_TYPES,
            groups=groups,
            navigation_menus=NAVIGATION_MENUS,
            values=values,
            errors=errors,
            page_title="Tambah Submenu",
        ), (400 if errors else 200)

    @app.route("/admin/navigation/items/<int:item_id>/edit", methods=["GET", "POST"])
    @login_required
    def navigation_item_edit(item_id):
        db = get_db()
        item = db.execute(
            "SELECT id, group_id, label, href, sort_order FROM navigation_items WHERE id = ?",
            (item_id,),
        ).fetchone()
        if item is None:
            abort(404)
        groups = db.execute(
            """
            SELECT id, title, menu_key
            FROM navigation_groups ORDER BY sort_order, id
            """
        ).fetchall()

        values = dict(item)
        errors = []
        if request.method == "POST":
            values, errors = _validate_navigation_item_form()
            if not any(group["id"] == values["group_id"] for group in groups):
                errors.append("Kategori yang dipilih tidak tersedia.")
            if not errors:
                db.execute(
                    """
                    UPDATE navigation_items
                    SET group_id = ?, label = ?, href = ?, sort_order = ?
                    WHERE id = ?
                    """,
                    (
                        values["group_id"],
                        values["label"],
                        values["href"],
                        values["sort_order"],
                        item_id,
                    ),
                )
                db.commit()
                flash("Submenu berhasil diperbarui.", "success")
                return redirect(url_for("navigation_list"))

        return render_template(
            "admin/navigation_item_form.html",
            content_types=CONTENT_TYPES,
            groups=groups,
            navigation_menus=NAVIGATION_MENUS,
            values=values,
            errors=errors,
            page_title="Edit Submenu",
        ), (400 if errors else 200)

    @app.post("/admin/navigation/items/<int:item_id>/delete")
    @login_required
    def navigation_item_delete(item_id):
        db = get_db()
        result = db.execute("DELETE FROM navigation_items WHERE id = ?", (item_id,))
        if result.rowcount == 0:
            abort(404)
        db.commit()
        flash("Submenu berhasil dihapus.", "success")
        return redirect(url_for("navigation_list"))

    @app.route("/admin/login", methods=["GET", "POST"])
    def login():
        error = None
        if request.method == "POST":
            username = request.form.get("username", "").encode("utf-8")
            password = request.form.get("password", "").encode("utf-8")
            valid_username = hmac.compare_digest(
                username,
                app.config["ADMIN_USERNAME"].encode("utf-8"),
            )
            valid_password = hmac.compare_digest(
                password,
                app.config["ADMIN_PASSWORD"].encode("utf-8"),
            )

            if valid_username and valid_password:
                session.clear()
                session["admin_authenticated"] = True
                session["csrf_token"] = secrets.token_urlsafe(32)
                return redirect(url_for("dashboard"))

            error = "Username atau password salah."

        return render_template("admin/login.html", error=error)

    @app.post("/admin/logout")
    @login_required
    def logout():
        session.clear()
        flash("Anda telah keluar dari halaman admin.", "success")
        return redirect(url_for("login"))

    @app.get("/admin")
    @login_required
    def dashboard():
        db = get_db()
        counts = {
            content_type: db.execute(
                "SELECT COUNT(*) FROM content WHERE content_type = ?",
                (content_type,),
            ).fetchone()[0]
            for content_type in CONTENT_TYPES
        }
        gallery_page = db.execute(
            "SELECT data_json FROM page_content WHERE page_slug = 'galeri'"
        ).fetchone()
        gallery_count = 0
        if gallery_page is not None:
            gallery_data = json.loads(gallery_page["data_json"] or "{}")
            gallery_items = gallery_data.get("items", [])
            if not isinstance(gallery_items, list):
                raise ValueError("Data foto galeri harus berbentuk daftar.")
            gallery_count = len(gallery_items)

        page_placeholders = ", ".join("?" for _ in PAGE_TYPES)
        page_count = db.execute(
            f"SELECT COUNT(*) FROM page_content WHERE page_slug IN ({page_placeholders})",
            tuple(PAGE_TYPES),
        ).fetchone()[0]
        dashboard_stats = [
            {
                "key": "berita",
                "label": "Berita",
                "count": counts["berita"],
                "href": url_for("content_list", content_type="berita"),
                "action": "Kelola berita",
            },
            {
                "key": "artikel",
                "label": "Artikel",
                "count": counts["artikel"],
                "href": url_for("content_list", content_type="artikel"),
                "action": "Kelola artikel",
            },
            {
                "key": "galeri",
                "label": "Foto galeri",
                "count": gallery_count,
                "href": url_for("page_content_edit", page_slug="galeri"),
                "action": "Atur halaman galeri",
            },
            {
                "key": "halaman",
                "label": "Halaman website",
                "count": page_count,
                "href": url_for("page_content_list"),
                "action": "Kelola halaman",
            },
        ]
        recent_items = db.execute(
            """
            SELECT id, content_type, title, status, published_at
            FROM content
            ORDER BY updated_at DESC, id DESC
            LIMIT 8
            """
        ).fetchall()
        return render_template(
            "admin/dashboard.html",
            counts=counts,
            content_types=CONTENT_TYPES,
            dashboard_stats=dashboard_stats,
            recent_items=recent_items,
        )

    @app.get("/admin/pages")
    @login_required
    def page_content_list():
        pages = get_db().execute(
            """
            SELECT page_slug, title, status, updated_at
            FROM page_content ORDER BY page_slug
            """
        ).fetchall()
        pages = [
            page for page in pages
            if page["page_slug"] in PAGE_TYPES and page["page_slug"] != "beranda"
        ]
        return render_template(
            "admin/page_content_list.html",
            content_types=CONTENT_TYPES,
            pages=pages,
            page_types=PAGE_TYPES,
        )

    @app.get("/admin/testimoni-alumni/submissions")
    @login_required
    def alumni_testimonial_submissions():
        submissions = get_db().execute(
            """
            SELECT id, name, institution, year, quote, image_url, submitted_at
            FROM alumni_testimonial_submissions
            WHERE status = 'pending'
            ORDER BY submitted_at, id
            """
        ).fetchall()
        return render_template(
            "admin/testimonial_submissions.html",
            submissions=submissions,
        )

    @app.post("/admin/testimoni-alumni/submissions/<int:submission_id>/approve")
    @login_required
    def alumni_testimonial_approve(submission_id):
        db = get_db()
        submission = db.execute(
            """
            SELECT id, name, institution, year, quote, image_url
            FROM alumni_testimonial_submissions
            WHERE id = ? AND status = 'pending'
            """,
            (submission_id,),
        ).fetchone()
        if submission is None:
            abort(404)

        page = db.execute(
            "SELECT data_json FROM page_content WHERE page_slug = 'testimoni-alumni'"
        ).fetchone()
        if page is None:
            abort(404)
        try:
            data = json.loads(page["data_json"] or "{}")
        except json.JSONDecodeError:
            current_app.logger.exception("Invalid alumni testimonial page data.")
            flash("Data halaman testimoni tidak dapat dibaca.", "error")
            return redirect(url_for("alumni_testimonial_submissions"))
        if not isinstance(data, dict):
            current_app.logger.error("Alumni testimonial page data is not an object.")
            flash("Data halaman testimoni tidak dapat dibaca.", "error")
            return redirect(url_for("alumni_testimonial_submissions"))
        testimonials = data.setdefault("testimonials", [])
        if not isinstance(testimonials, list):
            current_app.logger.error("Alumni testimonials data is not a list.")
            flash("Daftar testimoni pada halaman tidak valid.", "error")
            return redirect(url_for("alumni_testimonial_submissions"))

        testimonials.append({
            "name": submission["name"],
            "institution": submission["institution"],
            "year": submission["year"],
            "quote": submission["quote"],
            "image": submission["image_url"],
        })
        updated_page = db.execute(
            """
            UPDATE page_content
            SET data_json = ?, status = 'published', content_version = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE page_slug = 'testimoni-alumni'
            """,
            (json.dumps(data, ensure_ascii=False),),
        )
        updated_submission = db.execute(
            """
            UPDATE alumni_testimonial_submissions
            SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'
            """,
            (submission_id,),
        )
        if updated_page.rowcount != 1 or updated_submission.rowcount != 1:
            db.rollback()
            abort(409)
        db.commit()
        flash("Testimoni berhasil disetujui dan ditampilkan.", "success")
        return redirect(url_for("alumni_testimonial_submissions"))

    @app.post("/admin/testimoni-alumni/submissions/<int:submission_id>/reject")
    @login_required
    def alumni_testimonial_reject(submission_id):
        db = get_db()
        result = db.execute(
            """
            UPDATE alumni_testimonial_submissions
            SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'
            """,
            (submission_id,),
        )
        if result.rowcount != 1:
            db.rollback()
            abort(404)
        db.commit()
        flash("Testimoni ditolak dan tidak ditampilkan.", "success")
        return redirect(url_for("alumni_testimonial_submissions"))

    @app.get("/admin/artikel/komentar")
    @login_required
    def article_comment_submissions():
        comments = get_db().execute(
            """
            SELECT comments.id, comments.name, comments.body, comments.submitted_at,
                   articles.id AS article_id, articles.title AS article_title
            FROM article_comments AS comments
            JOIN content AS articles ON articles.id = comments.article_id
            WHERE comments.status = 'pending'
            ORDER BY comments.submitted_at, comments.id
            """
        ).fetchall()
        return render_template("admin/article_comment_submissions.html", comments=comments)

    @app.post("/admin/artikel/komentar/<int:comment_id>/approve")
    @login_required
    def article_comment_approve(comment_id):
        result = get_db().execute(
            """
            UPDATE article_comments
            SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'
            """,
            (comment_id,),
        )
        if result.rowcount == 0:
            abort(404)
        get_db().commit()
        flash("Komentar disetujui dan ditampilkan.", "success")
        return redirect(url_for("article_comment_submissions"))

    @app.post("/admin/artikel/komentar/<int:comment_id>/reject")
    @login_required
    def article_comment_reject(comment_id):
        result = get_db().execute(
            """
            UPDATE article_comments
            SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'
            """,
            (comment_id,),
        )
        if result.rowcount == 0:
            abort(404)
        get_db().commit()
        flash("Komentar ditolak dan tidak ditampilkan.", "success")
        return redirect(url_for("article_comment_submissions"))

    @app.get("/admin/drafts")
    @login_required
    def draft_list():
        db = get_db()
        drafts = []
        page_drafts = db.execute(
            """
            SELECT page_slug, title, updated_at
            FROM page_content
            WHERE status = 'draft' AND content_version > 0
            ORDER BY updated_at DESC
            """
        ).fetchall()
        for page in page_drafts:
            page_slug = page["page_slug"]
            page_label = PAGE_TYPES.get(page_slug)
            if page_label is None:
                continue
            if page_slug == "beranda":
                edit_url = url_for("home_content_edit")
            elif page_slug == "sejarah":
                edit_url = url_for("history_content_edit")
            else:
                edit_url = url_for("page_content_edit", page_slug=page_slug)
            drafts.append(
                {
                    "title": page["title"] or page_label,
                    "type_label": f"Halaman website · {page_label}",
                    "kind": "page",
                    "updated_at": page["updated_at"],
                    "edit_url": edit_url,
                    "publish_url": url_for(
                        "draft_page_publish", page_slug=page_slug
                    ),
                }
            )

        content_drafts = db.execute(
            """
            SELECT id, content_type, title, published_at, updated_at
            FROM content
            WHERE status = 'draft'
            ORDER BY updated_at DESC, id DESC
            """
        ).fetchall()
        for item in content_drafts:
            content_label = CONTENT_TYPES.get(item["content_type"])
            if content_label is None:
                continue
            drafts.append(
                {
                    "title": item["title"],
                    "type_label": content_label,
                    "kind": "content",
                    "updated_at": item["updated_at"],
                    "edit_url": url_for("content_edit", item_id=item["id"]),
                    "publish_url": url_for(
                        "draft_content_publish", item_id=item["id"]
                    ),
                    "delete_url": url_for(
                        "draft_content_delete", item_id=item["id"]
                    ),
                }
            )
        drafts.sort(
            key=lambda item: item["updated_at"] or "",
            reverse=True,
        )
        return render_template(
            "admin/draft_list.html",
            content_types=CONTENT_TYPES,
            drafts=drafts,
        )

    @app.post("/admin/drafts/pages/<page_slug>/publish")
    @login_required
    def draft_page_publish(page_slug):
        page_label = PAGE_TYPES.get(page_slug)
        if page_label is None:
            abort(404)
        db = get_db()
        result = db.execute(
            """
            UPDATE page_content
            SET status = 'published', updated_at = CURRENT_TIMESTAMP
            WHERE page_slug = ? AND status = 'draft' AND content_version > 0
            """,
            (page_slug,),
        )
        if result.rowcount != 1:
            db.rollback()
            flash(
                "Draf halaman sudah berubah atau belum pernah disimpan.",
                "error",
            )
            return redirect(url_for("draft_list"))
        db.commit()
        flash(f"Halaman {page_label} berhasil diterbitkan.", "success")
        return redirect(url_for("draft_list"))

    @app.post("/admin/drafts/content/<int:item_id>/publish")
    @login_required
    def draft_content_publish(item_id):
        db = get_db()
        item = db.execute(
            """
            SELECT content_type, title, placement
            FROM content
            WHERE id = ? AND status = 'draft'
            """,
            (item_id,),
        ).fetchone()
        if item is None:
            flash("Draf konten sudah berubah atau tidak tersedia.", "error")
            return redirect(url_for("draft_list"))

        if (
            item["content_type"] == "berita"
            and item["placement"] == "utama"
        ):
            db.execute(
                """
                UPDATE content SET placement = 'sorotan'
                WHERE content_type = 'berita' AND status = 'published'
                  AND placement = 'utama'
                """
            )
        result = db.execute(
            """
            UPDATE content
            SET status = 'published', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'draft'
            """,
            (item_id,),
        )
        if result.rowcount != 1:
            db.rollback()
            flash(
                "Draf konten berubah sebelum diterbitkan. Muat ulang daftar dan coba lagi.",
                "error",
            )
            return redirect(url_for("draft_list"))
        db.commit()
        content_label = CONTENT_TYPES.get(item["content_type"], "Konten")
        flash(f"{content_label} berhasil diterbitkan.", "success")
        return redirect(url_for("draft_list"))

    @app.post("/admin/drafts/content/<int:item_id>/delete")
    @login_required
    def draft_content_delete(item_id):
        db = get_db()
        item = db.execute(
            "SELECT content_type FROM content WHERE id = ? AND status = 'draft'",
            (item_id,),
        ).fetchone()
        if item is None:
            flash("Draf konten sudah berubah atau tidak tersedia.", "error")
            return redirect(url_for("draft_list"))

        result = db.execute(
            "DELETE FROM content WHERE id = ? AND status = 'draft'",
            (item_id,),
        )
        if result.rowcount != 1:
            db.rollback()
            flash(
                "Draf konten berubah sebelum dihapus. Muat ulang daftar dan coba lagi.",
                "error",
            )
            return redirect(url_for("draft_list"))
        db.commit()
        content_label = CONTENT_TYPES.get(item["content_type"], "Konten")
        flash(f"Draf {content_label.lower()} berhasil dihapus.", "success")
        return redirect(url_for("draft_list"))

    @app.route("/admin/pages/<page_slug>", methods=["GET", "POST"])
    @login_required
    def page_content_edit(page_slug):
        page_label = PAGE_TYPES.get(page_slug)
        if page_label is None:
            abort(404)
        if page_slug == "beranda":
            return redirect(url_for("home_content_edit"))
        db = get_db()
        page = db.execute(
            "SELECT * FROM page_content WHERE page_slug = ?", (page_slug,)
        ).fetchone()
        if page is None:
            abort(404)
        values = dict(page)
        try:
            data = json.loads(values.get("data_json") or "{}")
            if not isinstance(data, dict):
                data = {}
        except json.JSONDecodeError:
            data = {}
        errors = []
        if page_slug == "minat-dan-bakat":
            if request.method == "POST":
                values, data, errors, uploads = _validate_minat_bakat_content_form(data)
                if not errors:
                    for image_upload, item, image_key in uploads:
                        item[image_key] = _save_content_image(image_upload)
                    db.execute(
                        """
                        UPDATE page_content SET title = ?, badge = ?, description = ?,
                            data_json = ?, content_version = 1, status = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE page_slug = ?
                        """,
                        (
                            values["title"], values["badge"], values["description"],
                            json.dumps(data, ensure_ascii=False), values["status"], page_slug,
                        ),
                    )
                    db.commit()
                    flash("Konten Minat dan Bakat berhasil disimpan.", "success")
                    return redirect(
                        url_for("page_content_edit", page_slug=page_slug)
                    )
            else:
                data = _minat_bakat_editor_data(data)
            return render_template(
                "admin/minat_bakat_content_form.html",
                page_label=page_label,
                values=values,
                minat_data=data,
                errors=errors,
            ), (400 if errors else 200)

        if request.method == "POST":
            values, data, errors = _validate_page_content_form(data)
            if not errors:
                db.execute(
                    """
                    UPDATE page_content SET title = ?, badge = ?, description = ?,
                        data_json = ?, content_version = 1, status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE page_slug = ?
                    """,
                    (
                        values["title"], values["badge"], values["description"],
                        json.dumps(data, ensure_ascii=False), values["status"], page_slug,
                    ),
                )
                db.commit()
                flash(f"Konten halaman {page_label} berhasil disimpan.", "success")
                return redirect(url_for("page_content_list"))
        return render_template(
            "admin/page_content_form.html",
            content_types=CONTENT_TYPES,
            page_slug=page_slug,
            page_label=page_label,
            values=values,
            errors=errors,
        ), (400 if errors else 200)

    @app.route("/admin/pages/beranda/content", methods=["GET", "POST"])
    @login_required
    def home_content_edit():
        db = get_db()
        page = db.execute(
            "SELECT status, data_json FROM page_content WHERE page_slug = 'beranda'"
        ).fetchone()
        if page is None:
            abort(404)
        try:
            data = json.loads(page["data_json"] or "{}")
            if not isinstance(data, dict):
                data = {}
        except json.JSONDecodeError:
            current_app.logger.exception("Invalid saved homepage JSON; using default content.")
            data = {}

        status = page["status"]
        errors = []
        uploads = {
            "heroSlides": {},
            "heroVideos": {},
            "welcome": None,
            "programs": {},
            "fallbackNews": None,
            "fallbackAchievements": {},
            "gallery": {},
        }
        if request.method == "POST":
            data, status, errors, uploads = _validate_homepage_content_form(data, status)
            if not errors:
                for index, image in uploads["heroSlides"].items():
                    data["heroSlides"][index]["image"] = _save_content_image(image)
                for index, video in uploads["heroVideos"].items():
                    data["heroSlides"][index]["video"] = _save_content_video(video)
                if uploads["welcome"]:
                    data["welcome"]["image"] = _save_content_image(uploads["welcome"])
                for (program_index, visual_index), image in uploads["programs"].items():
                    data["programs"][program_index]["visuals"][visual_index]["src"] = (
                        _save_content_image(image)
                    )
                if uploads["fallbackNews"]:
                    data["fallbackNews"]["image"] = _save_content_image(
                        uploads["fallbackNews"]
                    )
                for index, image in uploads["fallbackAchievements"].items():
                    data["fallbackAchievements"][index]["image"] = _save_content_image(
                        image
                    )
                for index, image in uploads["gallery"].items():
                    data["gallery"][index]["image"] = _save_content_image(image)
                db.execute(
                    """
                    UPDATE page_content
                    SET data_json = ?, content_version = 1, status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE page_slug = 'beranda'
                    """,
                    (json.dumps(data, ensure_ascii=False), status),
                )
                db.commit()
                flash("Konten Beranda Website berhasil disimpan.", "success")
                section = request.form.get("save_section")
                section_anchors = {
                    "home-hero",
                    "home-welcome",
                    "home-statistics",
                    "home-programs",
                    "home-vision",
                    "home-news",
                    "home-gallery",
                    "home-admission",
                    "home-contact",
                    "home-publication",
                }
                return redirect(
                    url_for(
                        "home_content_edit",
                        _anchor=section if section in section_anchors else None,
                    )
                )

        return render_template(
            "admin/home_content_form.html",
            home_values=_homepage_form_values(data, status),
            errors=errors,
        ), (400 if errors else 200)

    @app.route("/admin/pages/sejarah/content", methods=["GET", "POST"])
    @login_required
    def history_content_edit():
        db = get_db()
        page = db.execute(
            "SELECT status, data_json FROM page_content WHERE page_slug = 'sejarah'"
        ).fetchone()
        if page is None:
            abort(404)
        try:
            data = json.loads(page["data_json"] or "{}")
            if not isinstance(data, dict):
                data = {}
        except json.JSONDecodeError:
            data = {}

        errors = []
        status = page["status"]
        history_values = _history_form_values(data)
        if request.method == "POST":
            data, history_values, errors, uploads = _validate_history_content_form(data)
            submitted_status = request.form.get("status", "").strip()
            if submitted_status not in {"draft", "published"}:
                errors.append("Status halaman tidak valid.")
            else:
                status = submitted_status
            if not errors:
                if uploads["logo"]:
                    data["story"]["logo"] = _save_content_image(uploads["logo"])
                for index, image in uploads["leaders"].items():
                    data["leaders"][index]["image"] = _save_content_image(image)
                db.execute(
                    """
                    UPDATE page_content
                    SET data_json = ?, content_version = 1, status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE page_slug = 'sejarah'
                    """,
                    (json.dumps(data, ensure_ascii=False), status),
                )
                db.commit()
                flash("Isi halaman Sejarah berhasil disimpan.", "success")
                section = request.form.get("save_section")
                section_anchors = {
                    "history-publication",
                    "history-intro",
                    "history-statistics",
                    "history-milestones",
                    "history-emblem",
                    "history-leaders",
                }
                return redirect(
                    url_for(
                        "history_content_edit",
                        _anchor=section if section in section_anchors else None,
                    )
                )

        return render_template(
            "admin/history_content_form.html",
            content_types=CONTENT_TYPES,
            history_values=history_values,
            errors=errors,
            status=status,
        ), (400 if errors else 200)

    @app.get("/admin/staff/guru")
    @login_required
    def guru_list():
        entries = get_db().execute(
            """
            SELECT id, name, role, image_url, sort_order
            FROM guru_directory ORDER BY sort_order, id
            """
        ).fetchall()
        return render_template(
            "admin/guru_list.html",
            content_types=CONTENT_TYPES,
            entries=entries,
        )

    @app.route("/admin/staff/guru/new", methods=["GET", "POST"])
    @login_required
    def guru_new():
        next_order = get_db().execute(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM guru_directory"
        ).fetchone()[0]
        values = {"name": "", "role": "", "image_url": "", "sort_order": next_order}
        errors = []
        if request.method == "POST":
            values, errors = _validate_guru_form()
            if not errors:
                image_url = _save_guru_image(request.files["image"])
                try:
                    db = get_db()
                    cursor = db.execute(
                        """
                        INSERT INTO guru_directory (name, role, image_url, sort_order)
                        VALUES (?, ?, ?, ?)
                        """,
                        (values["name"], values["role"], image_url, next_order),
                    )
                    _reorder_guru_directory(db, cursor.lastrowid, values["sort_order"])
                    db.commit()
                except sqlite3.Error:
                    _delete_guru_image(image_url)
                    raise
                flash("Data guru berhasil ditambahkan.", "success")
                return redirect(url_for("guru_list"))
        return render_template(
            "admin/guru_form.html",
            content_types=CONTENT_TYPES,
            page_title="Tambah Guru",
            values=values,
            errors=errors,
        ), (400 if errors else 200)

    @app.route("/admin/staff/guru/<int:guru_id>/edit", methods=["GET", "POST"])
    @login_required
    def guru_edit(guru_id):
        db = get_db()
        entry = db.execute(
            "SELECT id, name, role, image_url, sort_order FROM guru_directory WHERE id = ?",
            (guru_id,),
        ).fetchone()
        if entry is None:
            abort(404)
        values = dict(entry)
        errors = []
        if request.method == "POST":
            values, errors = _validate_guru_form(entry["image_url"])
            if not errors:
                image = request.files.get("image")
                new_image_url = _save_guru_image(image) if image and image.filename else entry["image_url"]
                try:
                    db.execute(
                        """
                        UPDATE guru_directory
                        SET name = ?, role = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                        (
                            values["name"], values["role"], new_image_url,
                            guru_id,
                        ),
                    )
                    _reorder_guru_directory(db, guru_id, values["sort_order"])
                    db.commit()
                except sqlite3.Error:
                    if new_image_url != entry["image_url"]:
                        _delete_guru_image(new_image_url)
                    raise
                if new_image_url != entry["image_url"]:
                    _delete_guru_image(entry["image_url"])
                flash("Data guru berhasil diperbarui.", "success")
                return redirect(url_for("guru_list"))
        return render_template(
            "admin/guru_form.html",
            content_types=CONTENT_TYPES,
            page_title="Edit Data Guru",
            values=values,
            errors=errors,
        ), (400 if errors else 200)

    @app.post("/admin/staff/guru/<int:guru_id>/delete")
    @login_required
    def guru_delete(guru_id):
        db = get_db()
        entry = db.execute(
            "SELECT image_url FROM guru_directory WHERE id = ?", (guru_id,)
        ).fetchone()
        if entry is None:
            abort(404)
        db.execute("DELETE FROM guru_directory WHERE id = ?", (guru_id,))
        _reorder_guru_directory(db)
        db.commit()
        _delete_guru_image(entry["image_url"])
        flash("Data guru berhasil dihapus.", "success")
        return redirect(url_for("guru_list"))

    @app.get("/admin/staff/tendik")
    @login_required
    def tendik_list():
        entries = get_db().execute(
            """
            SELECT id, name, role, image_url, sort_order
            FROM tendik_directory ORDER BY sort_order, id
            """
        ).fetchall()
        return render_template(
            "admin/tendik_list.html",
            content_types=CONTENT_TYPES,
            entries=entries,
        )

    @app.route("/admin/staff/tendik/new", methods=["GET", "POST"])
    @login_required
    def tendik_new():
        next_order = get_db().execute(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tendik_directory"
        ).fetchone()[0]
        values = {
            "name": "",
            "role": "",
            "image_url": "",
            "sort_order": next_order,
        }
        errors = []
        if request.method == "POST":
            values, errors = _validate_tendik_form()
            if not errors:
                image_url = _save_tendik_image(request.files["image"])
                db = get_db()
                try:
                    cursor = db.execute(
                        """
                        INSERT INTO tendik_directory
                            (name, role, image_url, sort_order)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            values["name"], values["role"], image_url, next_order,
                        ),
                    )
                    _reorder_tendik_directory(db, cursor.lastrowid, values["sort_order"])
                    db.commit()
                except sqlite3.Error:
                    _delete_tendik_image(image_url)
                    raise
                flash("Data tenaga kependidikan berhasil ditambahkan.", "success")
                return redirect(url_for("tendik_list"))
        return render_template(
            "admin/tendik_form.html",
            content_types=CONTENT_TYPES,
            page_title="Tambah Tenaga Kependidikan",
            values=values,
            errors=errors,
        ), (400 if errors else 200)

    @app.route("/admin/staff/tendik/<int:tendik_id>/edit", methods=["GET", "POST"])
    @login_required
    def tendik_edit(tendik_id):
        db = get_db()
        entry = db.execute(
            """
            SELECT id, name, role, image_url, sort_order
            FROM tendik_directory WHERE id = ?
            """,
            (tendik_id,),
        ).fetchone()
        if entry is None:
            abort(404)
        values = dict(entry)
        errors = []
        if request.method == "POST":
            values, errors = _validate_tendik_form(entry["image_url"])
            if not errors:
                image = request.files.get("image")
                new_image_url = (
                    _save_tendik_image(image)
                    if image and image.filename
                    else entry["image_url"]
                )
                try:
                    db.execute(
                        """
                        UPDATE tendik_directory
                        SET name = ?, role = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                        (
                            values["name"], values["role"], new_image_url, tendik_id,
                        ),
                    )
                    _reorder_tendik_directory(db, tendik_id, values["sort_order"])
                    db.commit()
                except sqlite3.Error:
                    if new_image_url != entry["image_url"]:
                        _delete_tendik_image(new_image_url)
                    raise
                if new_image_url != entry["image_url"]:
                    _delete_tendik_image(entry["image_url"])
                flash("Data tenaga kependidikan berhasil diperbarui.", "success")
                return redirect(url_for("tendik_list"))
        return render_template(
            "admin/tendik_form.html",
            content_types=CONTENT_TYPES,
            page_title="Edit Data Tenaga Kependidikan",
            values=values,
            errors=errors,
        ), (400 if errors else 200)

    @app.post("/admin/staff/tendik/<int:tendik_id>/delete")
    @login_required
    def tendik_delete(tendik_id):
        db = get_db()
        entry = db.execute(
            "SELECT image_url FROM tendik_directory WHERE id = ?",
            (tendik_id,),
        ).fetchone()
        if entry is None:
            abort(404)
        db.execute("DELETE FROM tendik_directory WHERE id = ?", (tendik_id,))
        _reorder_tendik_directory(db)
        db.commit()
        _delete_tendik_image(entry["image_url"])
        flash("Data tenaga kependidikan berhasil dihapus.", "success")
        return redirect(url_for("tendik_list"))

    @app.get("/admin/content/<content_type>")
    @login_required
    def content_list(content_type):
        label = CONTENT_TYPES.get(content_type)
        if label is None:
            abort(404)

        items = get_db().execute(
            """
            SELECT id, title, summary, published_at, status, placement
            FROM content
            WHERE content_type = ?
            ORDER BY published_at DESC, id DESC
            """,
            (content_type,),
        ).fetchall()
        return render_template(
            "admin/content_list.html",
            content_type=content_type,
            content_types=CONTENT_TYPES,
            label=label,
            items=items,
        )

    @app.route("/admin/content/<content_type>/new", methods=["GET", "POST"])
    @login_required
    def content_new(content_type):
        label = CONTENT_TYPES.get(content_type)
        if label is None:
            abort(404)

        values = {
            "title": "",
            "summary": "",
            "body": "",
            "achievement_level": "Kabupaten/Kota",
            "achievement_category": "Lainnya",
            "student_names": "",
            "image_url": "",
            "image_position": "50% 50%",
            "published_at": date.today().isoformat(),
            "status": "draft",
            "placement": "sorotan",
        }
        errors = []
        if request.method == "POST":
            values, errors = _validate_content_form(content_type)
            if not errors:
                db = get_db()
                if content_type == "berita" and values["status"] == "published" and values["placement"] == "utama":
                    db.execute(
                        """
                        UPDATE content SET placement = 'sorotan'
                        WHERE content_type = 'berita' AND status = 'published' AND placement = 'utama'
                        """
                    )
                db.execute(
                    """
                    INSERT INTO content
                        (content_type, title, summary, body, achievement_level,
                         achievement_category, student_names, image_url, image_position,
                         published_at, status, placement)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        content_type,
                        values["title"],
                        values["summary"],
                        values["body"],
                        values["achievement_level"],
                        values["achievement_category"],
                        values["student_names"],
                        values["image_url"],
                        values["image_position"],
                        values["published_at"],
                        values["status"],
                        values["placement"],
                    ),
                )
                db.commit()
                flash(f"{label} berhasil ditambahkan.", "success")
                return redirect(url_for("content_list", content_type=content_type))

        return render_template(
            "admin/content_form.html",
            content_type=content_type,
            content_types=CONTENT_TYPES,
            label=label,
            values=values,
            errors=errors,
            achievement_levels=ACHIEVEMENT_LEVELS,
            achievement_categories=ACHIEVEMENT_CATEGORIES,
            page_title=f"Tambah {label}",
        ), (400 if errors else 200)

    @app.route("/admin/content/<int:item_id>/edit", methods=["GET", "POST"])
    @login_required
    def content_edit(item_id):
        db = get_db()
        item = db.execute("SELECT * FROM content WHERE id = ?", (item_id,)).fetchone()
        if item is None:
            abort(404)

        values = dict(item)
        errors = []
        if request.method == "POST":
            values, errors = _validate_content_form(item["content_type"])
            if not errors:
                if (
                    item["content_type"] == "berita"
                    and values["status"] == "published"
                    and values["placement"] == "utama"
                ):
                    db.execute(
                        """
                        UPDATE content SET placement = 'sorotan'
                        WHERE content_type = 'berita' AND status = 'published'
                          AND placement = 'utama' AND id != ?
                        """,
                        (item_id,),
                    )
                db.execute(
                    """
                    UPDATE content
                    SET title = ?, summary = ?, body = ?, achievement_level = ?,
                        achievement_category = ?, student_names = ?, image_url = ?,
                        image_position = ?, published_at = ?, status = ?,
                        placement = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        values["title"],
                        values["summary"],
                        values["body"],
                        values["achievement_level"],
                        values["achievement_category"],
                        values["student_names"],
                        values["image_url"],
                        values["image_position"],
                        values["published_at"],
                        values["status"],
                        values["placement"],
                        item_id,
                    ),
                )
                db.commit()
                flash("Konten berhasil diperbarui.", "success")
                return redirect(url_for("content_list", content_type=item["content_type"]))

        return render_template(
            "admin/content_form.html",
            content_type=item["content_type"],
            content_types=CONTENT_TYPES,
            label=CONTENT_TYPES[item["content_type"]],
            values=values,
            errors=errors,
            achievement_levels=ACHIEVEMENT_LEVELS,
            achievement_categories=ACHIEVEMENT_CATEGORIES,
            page_title="Edit Konten",
        ), (400 if errors else 200)

    @app.post("/admin/content/<int:item_id>/delete")
    @login_required
    def content_delete(item_id):
        db = get_db()
        item = db.execute(
            "SELECT content_type FROM content WHERE id = ?",
            (item_id,),
        ).fetchone()
        if item is None:
            abort(404)

        db.execute("DELETE FROM content WHERE id = ?", (item_id,))
        db.commit()
        flash("Konten berhasil dihapus.", "success")
        return redirect(url_for("content_list", content_type=item["content_type"]))

    database_path = Path(app.config["DATABASE"])
    if str(database_path) != ":memory:":
        database_path.parent.mkdir(parents=True, exist_ok=True)

    with app.app_context():
        db = get_db()
        db.executescript(SCHEMA)
        navigation_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(navigation_groups)")
        }
        if "menu_key" not in navigation_columns:
            db.execute(
                "ALTER TABLE navigation_groups ADD COLUMN menu_key TEXT NOT NULL DEFAULT 'tentang'"
            )
        page_columns = {
            row["name"] for row in db.execute("PRAGMA table_info(page_content)")
        }
        if "data_json" not in page_columns:
            db.execute(
                "ALTER TABLE page_content ADD COLUMN data_json TEXT NOT NULL DEFAULT '{}'"
            )
        if "content_version" not in page_columns:
            db.execute(
                "ALTER TABLE page_content ADD COLUMN content_version INTEGER NOT NULL DEFAULT 0"
            )
        db.execute(
            """
            UPDATE page_content SET status = 'draft'
            WHERE body != '' AND data_json = '{}' AND content_version = 0
            """
        )
        for page_slug, page_label in PAGE_TYPES.items():
            default_title, default_badge, default_description = PAGE_DEFAULTS[page_slug]
            db.execute(
                """
                INSERT OR IGNORE INTO page_content
                    (page_slug, title, badge, description, data_json, status)
                VALUES (?, ?, ?, ?, ?, 'draft')
                """,
                (
                    page_slug, default_title or page_label, default_badge,
                    default_description,
                    json.dumps(PAGE_DATA_DEFAULTS.get(page_slug, {}), ensure_ascii=False),
                ),
            )
            db.execute(
                """
                UPDATE page_content SET title = ?, badge = ?, description = ?
                WHERE page_slug = ? AND status = 'draft' AND title = ?
                  AND badge = '' AND description = '' AND body = ''
                  AND data_json = '{}'
                """,
                (
                    default_title or page_label, default_badge, default_description,
                    page_slug, page_label,
                ),
            )
            db.execute(
                """
                UPDATE page_content SET data_json = ?
                WHERE page_slug = ? AND data_json = '{}' AND content_version = 0
                  AND content_version = 0
                """,
                (
                    json.dumps(PAGE_DATA_DEFAULTS.get(page_slug, {}), ensure_ascii=False),
                    page_slug,
                ),
            )
        history_migration = db.execute(
            "SELECT value FROM app_settings WHERE key = 'history_milestones_screenshot_v1'"
        ).fetchone()
        if history_migration is None:
            history_page = db.execute(
                "SELECT data_json FROM page_content WHERE page_slug = 'sejarah'"
            ).fetchone()
            try:
                history_data = json.loads(history_page["data_json"] or "{}")
            except json.JSONDecodeError:
                current_app.logger.exception(
                    "Invalid saved history page JSON; screenshot timeline update skipped."
                )
            else:
                if isinstance(history_data, dict):
                    history_data["milestones"] = PAGE_DATA_DEFAULTS["sejarah"]["milestones"]
                    db.execute(
                        "UPDATE page_content SET data_json = ? WHERE page_slug = 'sejarah'",
                        (json.dumps(history_data, ensure_ascii=False),),
                    )
                    db.execute(
                        """
                        INSERT INTO app_settings (key, value)
                        VALUES ('history_milestones_screenshot_v1', 'true')
                        """
                    )
                else:
                    current_app.logger.warning(
                        "Saved history page data is not an object; screenshot timeline update skipped."
                    )
        db.execute(
            "UPDATE page_content SET content_version = 1 WHERE body != '' AND content_version = 0"
        )
        columns = {row["name"] for row in db.execute("PRAGMA table_info(content)")}
        if "image_url" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN image_url TEXT NOT NULL DEFAULT ''"
            )
        if "achievement_level" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN achievement_level TEXT NOT NULL DEFAULT 'Kabupaten/Kota'"
            )
        if "achievement_category" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN achievement_category TEXT NOT NULL DEFAULT 'Lainnya'"
            )
        if "student_names" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN student_names TEXT NOT NULL DEFAULT ''"
            )
        if "image_position" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN image_position TEXT NOT NULL DEFAULT '50% 50%'"
            )
        if "placement" not in columns:
            db.execute(
                "ALTER TABLE content ADD COLUMN placement TEXT NOT NULL DEFAULT 'sorotan'"
            )
        content_table = db.execute(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'content'"
        ).fetchone()
        content_schema = (content_table["sql"] or "").lower() if content_table else ""
        if "check" in content_schema and "'artikel'" not in content_schema:
            db.execute(
                """
                CREATE TABLE content_with_articles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_type TEXT NOT NULL
                        CHECK (content_type IN ('berita', 'artikel', 'prestasi', 'pengumuman')),
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL DEFAULT '',
                    body TEXT NOT NULL,
                    achievement_level TEXT NOT NULL DEFAULT 'Kabupaten/Kota',
                    achievement_category TEXT NOT NULL DEFAULT 'Lainnya',
                    student_names TEXT NOT NULL DEFAULT '',
                    image_url TEXT NOT NULL DEFAULT '',
                    image_position TEXT NOT NULL DEFAULT '50% 50%',
                    published_at TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
                    placement TEXT NOT NULL DEFAULT 'sorotan'
                        CHECK (placement IN ('utama', 'sorotan')),
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            db.execute(
                """
                INSERT INTO content_with_articles
                    (id, content_type, title, summary, body, achievement_level,
                     achievement_category, student_names, image_url, image_position,
                     published_at, status, placement, created_at, updated_at)
                SELECT id, content_type, title, summary, body, achievement_level,
                       achievement_category, student_names, image_url, image_position,
                       published_at, status, placement, created_at, updated_at
                FROM content
                """
            )
            db.execute("DROP TABLE content")
            db.execute("ALTER TABLE content_with_articles RENAME TO content")
        db.execute(
            """
            UPDATE content SET placement = 'sorotan'
            WHERE content_type = 'berita' AND status = 'published' AND placement = 'utama'
              AND id NOT IN (
                  SELECT id FROM content
                  WHERE content_type = 'berita' AND status = 'published' AND placement = 'utama'
                  ORDER BY published_at DESC, id DESC LIMIT 1
              )
            """
        )
        db.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS one_published_featured_news
            ON content (content_type)
            WHERE content_type = 'berita' AND status = 'published' AND placement = 'utama'
            """
        )
        seeded = db.execute(
            "SELECT value FROM app_settings WHERE key = 'navigation_seeded'"
        ).fetchone()
        if seeded is None:
            has_groups = db.execute(
                "SELECT 1 FROM navigation_groups LIMIT 1"
            ).fetchone()
            if has_groups is None:
                for group_order, (menu_key, title, items) in enumerate(DEFAULT_NAVIGATION, start=1):
                    cursor = db.execute(
                        """
                        INSERT INTO navigation_groups (title, menu_key, sort_order)
                        VALUES (?, ?, ?)
                        """,
                        (title, menu_key, group_order),
                    )
                    group_id = cursor.lastrowid
                    for item_order, (label, href) in enumerate(items, start=1):
                        db.execute(
                            """
                            INSERT INTO navigation_items (group_id, label, href, sort_order)
                            VALUES (?, ?, ?, ?)
                            """,
                            (group_id, label, href, item_order),
                        )
            db.execute(
                "INSERT INTO app_settings (key, value) VALUES ('navigation_seeded', 'true')"
            )
        multi_menu_seeded = db.execute(
            "SELECT value FROM app_settings WHERE key = 'multi_menu_navigation_seeded'"
        ).fetchone()
        if multi_menu_seeded is None:
            next_order = db.execute(
                "SELECT COALESCE(MAX(sort_order), 0) FROM navigation_groups"
            ).fetchone()[0]
            for menu_key, title, items in DEFAULT_NAVIGATION:
                if menu_key == "tentang":
                    continue
                exists = db.execute(
                    """
                    SELECT 1 FROM navigation_groups
                    WHERE menu_key = ? AND title = ?
                    """,
                    (menu_key, title),
                ).fetchone()
                if exists is not None:
                    continue
                next_order += 1
                cursor = db.execute(
                    """
                    INSERT INTO navigation_groups (title, menu_key, sort_order)
                    VALUES (?, ?, ?)
                    """,
                    (title, menu_key, next_order),
                )
                for item_order, (label, href) in enumerate(items, start=1):
                    db.execute(
                        """
                        INSERT INTO navigation_items (group_id, label, href, sort_order)
                        VALUES (?, ?, ?, ?)
                        """,
                        (cursor.lastrowid, label, href, item_order),
                    )
            db.execute(
                """
                INSERT INTO app_settings (key, value)
                VALUES ('multi_menu_navigation_seeded', 'true')
                """
            )
        article_navigation_seeded = db.execute(
            "SELECT value FROM app_settings WHERE key = 'article_navigation_seeded'"
        ).fetchone()
        if article_navigation_seeded is None:
            activity_group = db.execute(
                """
                SELECT id FROM navigation_groups
                WHERE menu_key = 'kegiatan'
                ORDER BY sort_order, id
                LIMIT 1
                """
            ).fetchone()
            if activity_group:
                article_link = db.execute(
                    "SELECT 1 FROM navigation_items WHERE group_id = ? AND href = '/artikel'",
                    (activity_group["id"],),
                ).fetchone()
                if article_link is None:
                    next_item_order = db.execute(
                        """
                        SELECT COALESCE(MAX(sort_order), 0) + 1
                        FROM navigation_items WHERE group_id = ?
                        """,
                        (activity_group["id"],),
                    ).fetchone()[0]
                    db.execute(
                        """
                        INSERT INTO navigation_items (group_id, label, href, sort_order)
                        VALUES (?, 'Artikel', '/artikel', ?)
                        """,
                        (activity_group["id"], next_item_order),
                    )
            db.execute(
                "INSERT INTO app_settings (key, value) VALUES ('article_navigation_seeded', 'true')"
            )
        guru_seeded = db.execute(
            "SELECT value FROM app_settings WHERE key = 'guru_directory_seeded'"
        ).fetchone()
        if guru_seeded is None:
            for sort_order, (name, role, image_url) in enumerate(DEFAULT_GURU_ENTRIES, start=1):
                db.execute(
                    """
                    INSERT INTO guru_directory (name, role, image_url, sort_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (name, role, image_url, sort_order),
                )
            db.execute(
                "INSERT INTO app_settings (key, value) VALUES ('guru_directory_seeded', 'true')"
            )
        tendik_seeded = db.execute(
            "SELECT value FROM app_settings WHERE key = 'tendik_directory_seeded'"
        ).fetchone()
        if tendik_seeded is None:
            people = PAGE_DATA_DEFAULTS["direktori-tendik"].get("people", [])
            page = db.execute(
                "SELECT data_json FROM page_content WHERE page_slug = 'direktori-tendik'"
            ).fetchone()
            if page is not None:
                try:
                    saved_data = json.loads(page["data_json"] or "{}")
                except json.JSONDecodeError:
                    current_app.logger.exception(
                        "Invalid saved tendik page JSON; using default directory entries."
                    )
                else:
                    saved_people = saved_data.get("people") if isinstance(saved_data, dict) else None
                    if isinstance(saved_people, list):
                        people = saved_people
            for sort_order, person in enumerate(people, start=1):
                if not isinstance(person, dict) or not person.get("name") or not person.get("role"):
                    current_app.logger.warning(
                        "Skipping invalid default tendik directory entry at position %s.",
                        sort_order,
                    )
                    continue
                db.execute(
                    """
                    INSERT INTO tendik_directory
                        (name, role, image_url, sort_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        str(person["name"]),
                        str(person["role"]),
                        str(person.get("image", "")),
                        sort_order,
                    ),
                )
            db.execute(
                """
                INSERT INTO app_settings (key, value)
                VALUES ('tendik_directory_seeded', 'true')
                """
            )
        _reorder_guru_directory(db)
        _reorder_tendik_directory(db)
        db.commit()

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5001")), debug=False)

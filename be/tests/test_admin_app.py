import io
import json
import re
import sqlite3
import tempfile
import unittest
from pathlib import Path

from admin_app import PAGE_DATA_DEFAULTS, _validate_video_upload, create_app
from werkzeug.datastructures import FileStorage, MultiDict
from werkzeug.test import Client


class AdminAppTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        database_path = Path(self.temporary_directory.name) / "admin.sqlite3"
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
                "ADMIN_USERNAME": "admin",
                "ADMIN_PASSWORD": "safe-test-password-123",
                "DATABASE": str(database_path),
                "GURU_UPLOAD_FOLDER": str(Path(self.temporary_directory.name) / "uploads"),
                "TENDIK_UPLOAD_FOLDER": str(Path(self.temporary_directory.name) / "tendik-uploads"),
                "CONTENT_UPLOAD_FOLDER": str(Path(self.temporary_directory.name) / "content-uploads"),
            }
        )
        self.client = Client(self.app, self.app.response_class)

    def tearDown(self):
        self.temporary_directory.cleanup()

    @staticmethod
    def _csrf_token(response):
        match = re.search(rb'name="csrf_token" value="([^"]+)"', response.data)
        if match is None:
            raise AssertionError("CSRF token was not rendered")
        return match.group(1).decode("ascii")

    def _login(self):
        response = self.client.get("/admin/login")
        return self.client.post(
            "/admin/login",
            data={
                "csrf_token": self._csrf_token(response),
                "username": "admin",
                "password": "safe-test-password-123",
            },
            follow_redirects=True,
        )

    @staticmethod
    def _minat_bakat_form_payload(csrf_token):
        content = PAGE_DATA_DEFAULTS["minat-dan-bakat"]
        payload = {
            "csrf_token": csrf_token,
            "title": "Minat dan Bakat",
            "badge": "RUANG UNTUK BERTUMBUH",
            "description": "Kegiatan untuk mengembangkan potensi siswa.",
            "status": "published",
            "programs_title": content["programsTitle"],
            "faq_label": content["faqLabel"],
            "faq_title": content["faqTitle"],
            "faq_description": content["faqDescription"],
            "program_count": str(len(content["programs"])),
            "faq_count": str(len(content["faqs"])),
        }
        for program_index, program in enumerate(content["programs"]):
            prefix = f"programs[{program_index}]"
            for key in ("name", "slug", "category", "description", "details", "imageAlt", "image"):
                payload[f"{prefix}[{key}]"] = program.get(key, "")
            payload[f"{prefix}[required]"] = "true" if program.get("required") else "false"
            documentation = program["documentation"]
            payload[f"{prefix}[documentation_count]"] = str(len(documentation))
            for item_index, item in enumerate(documentation):
                item_prefix = f"{prefix}[documentation][{item_index}]"
                for key in ("title", "description", "alt", "image"):
                    payload[f"{item_prefix}[{key}]"] = item.get(key, "")

        for faq_index, faq in enumerate(content["faqs"]):
            prefix = f"faqs[{faq_index}]"
            payload[f"{prefix}[question]"] = faq["question"]
            payload[f"{prefix}[answer]"] = faq["answer"]
        return payload

    def test_admin_pages_require_login(self):
        response = self.client.get("/admin")
        draft_list = self.client.get("/admin/drafts")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login", response.headers["Location"])
        self.assertEqual(draft_list.status_code, 302)
        self.assertIn("/admin/login", draft_list.headers["Location"])

    def test_login_and_dashboard_hide_lettermark(self):
        login_page = self.client.get("/admin/login")
        dashboard = self._login()

        self.assertNotIn(b"brand-mark", login_page.data)
        self.assertNotIn(b"brand-mark", dashboard.data)
        self.assertNotIn(b"back-to-site", login_page.data)
        self.assertNotIn(b"<svg", login_page.data)
        self.assertNotIn(b"Admin Panel", dashboard.data)
        self.assertIn(b"Karanganyar</small>", dashboard.data)

    def test_video_upload_requires_mp4_extension_and_signature(self):
        wrong_extension = FileStorage(
            stream=io.BytesIO(b"not video"),
            filename="video.avi",
        )
        self.assertIn("Format video harus MP4.", _validate_video_upload(wrong_extension))

        invalid_mp4 = FileStorage(
            stream=io.BytesIO(b"not an mp4"),
            filename="video.mp4",
        )
        self.assertIn(
            "Isi file tidak sesuai dengan format video MP4.",
            _validate_video_upload(invalid_mp4),
        )

    def test_login_and_create_content(self):
        response = self._login()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Ringkasan", response.data)

        form_response = self.client.get("/admin/content/berita/new")
        self.assertIn(b"Atur potongan foto di website", form_response.data)
        self.assertIn(b"Posisi horizontal", form_response.data)
        self.assertIn(b"Posisi vertikal", form_response.data)
        create_response = self.client.post(
            "/admin/content/berita/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "Berita Uji",
                "summary": "Ringkasan uji",
                "body": "Isi berita uji",
                "image_url": "/static/uploads/content/berita-uji.png",
                "image_position": "30% 65%",
                "published_at": "2026-11-16",
                "status": "published",
            },
            follow_redirects=True,
        )

        self.assertEqual(create_response.status_code, 200)
        self.assertIn(b"Berita Uji", create_response.data)
        self.assertIn(b"Terbit", create_response.data)
        self.assertIn(b'class="draft-confirm-dialog"', create_response.data)
        self.assertIn(b"data-admin-confirm-delete", create_response.data)
        self.assertNotIn(b"onsubmit=\"return confirm(", create_response.data)
        public_content = self.client.get("/api/content?type=berita").json
        self.assertEqual(public_content[0]["image_url"], "/static/uploads/content/berita-uji.png")
        self.assertEqual(public_content[0]["image_position"], "30% 65%")

    def test_dashboard_statistics_use_saved_content_and_gallery_data(self):
        database = sqlite3.connect(self.app.config["DATABASE"])
        try:
            database.execute(
                """
                INSERT INTO content (content_type, title, body, published_at, status)
                VALUES ('berita', 'Berita statistik', 'Isi berita', '2026-11-16', 'published')
                """
            )
            database.execute(
                """
                INSERT INTO content (content_type, title, body, published_at, status)
                VALUES ('artikel', 'Artikel statistik', 'Isi artikel', '2026-11-17', 'draft')
                """
            )
            database.execute(
                "UPDATE page_content SET data_json = ? WHERE page_slug = 'galeri'",
                (json.dumps({"items": [{"title": "Foto 1"}, {"title": "Foto 2"}]}),),
            )
            database.commit()
        finally:
            database.close()

        dashboard = self._login()

        self.assertIn(b'data-admin-stat="berita" data-stat-count="1"', dashboard.data)
        self.assertIn(b'data-admin-stat="artikel" data-stat-count="1"', dashboard.data)
        self.assertIn(b'data-admin-stat="galeri" data-stat-count="2"', dashboard.data)
        self.assertRegex(
            dashboard.data,
            rb'data-admin-stat="halaman" data-stat-count="[1-9][0-9]*"',
        )

    def test_dashboard_hero_uses_school_photo_without_duplicate_action(self):
        dashboard = self._login()

        self.assertIn(b'class="dashboard-hero-image"', dashboard.data)
        self.assertIn(b"/static/uploads/content/hero-madrasah.jpg", dashboard.data)
        self.assertNotIn(b"dashboard-hero-action", dashboard.data)

    def test_admin_can_publish_articles_separately_from_news(self):
        self._login()
        form_response = self.client.get("/admin/content/artikel/new")
        self.assertIn(b"Atur potongan foto di website", form_response.data)
        response = self.client.post(
            "/admin/content/artikel/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "Manfaat Membaca bagi Siswa",
                "summary": "Membaca membantu memperluas wawasan dan menumbuhkan kebiasaan belajar.",
                "body": "Isi artikel tentang manfaat membaca.",
                "image_url": "/static/uploads/content/membaca.png",
                "image_position": "40% 60%",
                "published_at": "2026-11-18",
                "status": "published",
            },
        )

        self.assertEqual(response.status_code, 302)
        articles = self.client.get("/api/content?type=artikel")
        news = self.client.get("/api/content?type=berita")
        self.assertEqual(articles.status_code, 200)
        self.assertEqual(
            [item["title"] for item in articles.json],
            ["Manfaat Membaca bagi Siswa"],
        )
        self.assertEqual(articles.json[0]["image_position"], "40% 60%")
        self.assertEqual(news.json, [])

    def test_article_comments_wait_for_admin_approval(self):
        self._login()
        article_form = self.client.get("/admin/content/artikel/new")
        self.client.post(
            "/admin/content/artikel/new",
            data={
                "csrf_token": self._csrf_token(article_form),
                "title": "Artikel untuk Komentar",
                "summary": "",
                "body": "Isi artikel untuk pengujian komentar.",
                "image_url": "",
                "image_position": "50% 50%",
                "published_at": "2026-11-18",
                "status": "published",
            },
        )
        article = self.client.get("/api/content?type=artikel").json[0]
        token = self.client.get("/api/artikel/comments/form-token").json["csrfToken"]
        comment_data = {
            "csrf_token": token,
            "article_id": str(article["id"]),
            "name": "Pembaca",
            "body": "Artikel ini sangat bermanfaat bagi saya.",
        }

        rejected_submission = self.client.post(
            "/api/artikel/comments",
            data=comment_data,
        )
        self.assertEqual(rejected_submission.status_code, 400)
        self.assertIn("consent", rejected_submission.json["errors"])

        accepted_submission = self.client.post(
            "/api/artikel/comments",
            data={**comment_data, "consent": "yes"},
        )
        self.assertEqual(accepted_submission.status_code, 201)
        comments_url = f"/api/artikel/{article['id']}/comments"
        self.assertEqual(self.client.get(comments_url).json, [])
        self.assertEqual(self.client.get("/api/artikel/9999/comments").status_code, 404)

        pending_list = self.client.get("/admin/artikel/komentar")
        self.assertEqual(pending_list.status_code, 200)
        self.assertIn(b"Pembaca", pending_list.data)
        approved = self.client.post(
            "/admin/artikel/komentar/1/approve",
            data={"csrf_token": self._csrf_token(pending_list)},
        )
        self.assertEqual(approved.status_code, 302)
        published_comments = self.client.get(comments_url).json
        self.assertEqual(len(published_comments), 1)
        self.assertEqual(published_comments[0]["name"], "Pembaca")
        self.assertEqual(
            published_comments[0]["body"],
            "Artikel ini sangat bermanfaat bagi saya.",
        )
        self.assertIn("submitted_at", published_comments[0])

        rejected_comment = self.client.post(
            "/api/artikel/comments",
            data={
                **comment_data,
                "name": "Pembaca Kedua",
                "body": "Komentar ini ditolak admin.",
                "consent": "yes",
            },
        )
        self.assertEqual(rejected_comment.status_code, 201)
        pending_list = self.client.get("/admin/artikel/komentar")
        rejection = self.client.post(
            "/admin/artikel/komentar/2/reject",
            data={"csrf_token": self._csrf_token(pending_list)},
        )
        self.assertEqual(rejection.status_code, 302)
        self.assertEqual(len(self.client.get(comments_url).json), 1)

    def test_prestasi_image_position_is_saved_and_validated(self):
        self._login()
        form_response = self.client.get("/admin/content/prestasi/new")
        self.assertIn(b"Atur potongan foto di website", form_response.data)

        response = self.client.post(
            "/admin/content/prestasi/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "Juara Lomba Uji",
                "summary": "",
                "body": "Prestasi siswa",
                "achievement_level": "Provinsi",
                "achievement_category": "Olahraga",
                "student_names": "Siswa Pertama\nSiswa Kedua",
                "image_url": "/static/uploads/content/prestasi-uji.png",
                "image_position": "25% 70%",
                "published_at": "2026-11-17",
                "status": "published",
            },
        )
        self.assertEqual(response.status_code, 302)
        published = self.client.get("/api/content?type=prestasi").json
        self.assertEqual(published[0]["image_position"], "25% 70%")
        self.assertEqual(published[0]["achievement_level"], "Provinsi")
        self.assertEqual(published[0]["achievement_category"], "Olahraga")
        self.assertEqual(published[0]["student_names"], "Siswa Pertama\nSiswa Kedua")

        item_id = published[0]["id"]
        edit_form = self.client.get(f"/admin/content/{item_id}/edit")
        edit_response = self.client.post(
            f"/admin/content/{item_id}/edit",
            data={
                "csrf_token": self._csrf_token(edit_form),
                "title": "Juara Lomba Uji",
                "summary": "",
                "body": "Prestasi siswa",
                "achievement_level": "Kabupaten/Kota",
                "achievement_category": "Seni",
                "student_names": "Siswa Ketiga",
                "image_url": "/static/uploads/content/prestasi-uji.png",
                "image_position": "80% 35%",
                "published_at": "2026-11-17",
                "status": "published",
            },
        )
        self.assertEqual(edit_response.status_code, 302)
        published = self.client.get("/api/content?type=prestasi").json
        self.assertEqual(published[0]["image_position"], "80% 35%")
        self.assertEqual(published[0]["achievement_level"], "Kabupaten/Kota")
        self.assertEqual(published[0]["achievement_category"], "Seni")
        self.assertEqual(published[0]["student_names"], "Siswa Ketiga")

        invalid_response = self.client.post(
            "/admin/content/prestasi/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "Posisi Tidak Valid",
                "summary": "",
                "body": "Prestasi siswa",
                "image_url": "",
                "image_position": "url(javascript:alert(1))",
                "published_at": "2026-11-17",
                "status": "draft",
            },
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertIn(b"Posisi foto tidak valid.", invalid_response.data)

    def test_content_can_be_updated_and_deleted(self):
        self._login()
        form_response = self.client.get("/admin/content/pengumuman/new")
        self.client.post(
            "/admin/content/pengumuman/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "Pengumuman Awal",
                "summary": "",
                "body": "Isi awal",
                "published_at": "2026-11-16",
                "status": "draft",
            },
        )

        edit_response = self.client.get("/admin/content/1/edit")
        updated_response = self.client.post(
            "/admin/content/1/edit",
            data={
                "csrf_token": self._csrf_token(edit_response),
                "title": "Pengumuman Baru",
                "summary": "",
                "body": "Isi diperbarui",
                "published_at": "2026-11-17",
                "status": "published",
            },
            follow_redirects=True,
        )
        self.assertIn(b"Pengumuman Baru", updated_response.data)

        list_response = self.client.get("/admin/content/pengumuman")
        delete_response = self.client.post(
            "/admin/content/1/delete",
            data={"csrf_token": self._csrf_token(list_response)},
            follow_redirects=True,
        )
        self.assertIn(b"Belum ada pengumuman", delete_response.data)

    def test_invalid_csrf_token_is_rejected(self):
        self._login()

        response = self.client.post(
            "/admin/content/berita/new",
            data={"csrf_token": "invalid"},
        )

        self.assertEqual(response.status_code, 400)

    def test_login_rejects_missing_csrf_token(self):
        client = Client(self.app, self.app.response_class)

        response = client.post(
            "/admin/login",
            data={
                "username": "admin",
                "password": "safe-test-password-123",
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_create_rejects_missing_required_fields(self):
        self._login()
        form_response = self.client.get("/admin/content/berita/new")

        response = self.client.post(
            "/admin/content/berita/new",
            data={
                "csrf_token": self._csrf_token(form_response),
                "title": "",
                "body": "",
                "published_at": "not-a-date",
                "status": "published",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Judul wajib diisi.".encode(), response.data)

    def test_public_api_returns_only_published_content(self):
        self._login()

        for title, status in (
            ("Berita Terbit", "published"),
            ("Berita Draf", "draft"),
        ):
            form_response = self.client.get("/admin/content/berita/new")
            self.client.post(
                "/admin/content/berita/new",
                data={
                    "csrf_token": self._csrf_token(form_response),
                    "title": title,
                    "summary": f"Ringkasan {title}",
                    "body": f"Isi {title}",
                    "published_at": "2026-11-17",
                    "status": status,
                },
            )

        response = self.client.get("/api/content?type=berita")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["title"] for item in response.json],
            ["Berita Terbit"],
        )
        self.assertEqual(response.json[0]["body"], "Isi Berita Terbit")
        self.assertEqual(response.json[0]["placement"], "sorotan")

    def test_public_api_rejects_unknown_content_type(self):
        response = self.client.get("/api/content?type=lainnya")

        self.assertEqual(response.status_code, 400)

    def test_admin_can_publish_page_metadata_without_losing_page_data(self):
        self._login()
        pages = self.client.get("/admin/pages")
        self.assertEqual(pages.status_code, 200)
        self.assertEqual(pages.data.count(b"Kelola halaman"), 15)
        self.assertNotIn(b"Kelola direktori", pages.data)
        self.assertNotIn(b"Beranda /beranda", pages.data)

        form = self.client.get("/admin/pages/visi-misi")
        self.assertIn(b'<textarea id="title"', form.data)
        self.assertIn(b'name="title"', form.data)
        self.assertIn(b'name="badge"', form.data)
        self.assertIn(b'name="description"', form.data)
        self.assertNotIn(b'name="field_', form.data)
        connection = sqlite3.connect(self.app.config["DATABASE"])
        stored_data = json.loads(connection.execute(
            "SELECT data_json FROM page_content WHERE page_slug = 'visi-misi'"
        ).fetchone()[0])
        connection.close()
        response = self.client.post(
            "/admin/pages/visi-misi",
            data={
                "csrf_token": self._csrf_token(form),
                "title": "Visi dan Misi\nMadrasah",
                "badge": "PROFIL SEKOLAH",
                "description": "Arah pendidikan madrasah.",
                "status": "published",
            },
            follow_redirects=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Konten halaman Visi dan Misi berhasil disimpan.", response.data)

        page = self.client.get("/api/pages/visi-misi")
        self.assertEqual(page.status_code, 200)
        self.assertEqual(page.json["title"], "Visi dan Misi\nMadrasah")
        self.assertEqual(page.json["data"], stored_data)
        self.assertNotIn("body", page.json)

        restarted_app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "safe-test-password-123",
            "DATABASE": self.app.config["DATABASE"],
            "GURU_UPLOAD_FOLDER": self.app.config["GURU_UPLOAD_FOLDER"],
        })
        restarted_client = Client(restarted_app, restarted_app.response_class)
        restarted_page = restarted_client.get("/api/pages/visi-misi")
        self.assertEqual(restarted_page.json["data"], stored_data)

    def test_program_khusus_admin_page_publishes_to_public_api(self):
        dashboard = self._login()
        self.assertIn(b'href="/admin/pages/program-khusus"', dashboard.data)
        self.assertIn(b'aria-label="Breadcrumb"', dashboard.data)

        form = self.client.get("/admin/pages/program-khusus")
        self.assertEqual(form.status_code, 200)
        response = self.client.post(
            "/admin/pages/program-khusus",
            data={
                "csrf_token": self._csrf_token(form),
                "title": "Program Khusus MTsN 1",
                "badge": "PROGRAM UNGGULAN",
                "description": "Program yang dikelola dari panel admin.",
                "status": "published",
            },
            follow_redirects=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Konten halaman Program Khusus berhasil disimpan.", response.data)

        page = self.client.get("/api/pages/program-khusus")
        self.assertEqual(page.status_code, 200)
        self.assertEqual(page.json["title"], "Program Khusus MTsN 1")
        self.assertEqual(page.json["description"], "Program yang dikelola dari panel admin.")

    def test_minat_bakat_admin_can_edit_all_content_and_manage_lists(self):
        self._login()
        connection = sqlite3.connect(self.app.config["DATABASE"])
        connection.execute(
            "UPDATE page_content SET status = 'published' WHERE page_slug = 'minat-dan-bakat'"
        )
        connection.commit()
        connection.close()

        form = self.client.get("/admin/pages/minat-dan-bakat")
        self.assertEqual(form.status_code, 200)
        self.assertIn(b"Deskripsi FAQ", form.data)
        self.assertIn(b"Detail kegiatan", form.data)
        self.assertIn(b"Deskripsi dokumentasi", form.data)
        self.assertIn(b"Tambah kegiatan", form.data)
        self.assertIn(b"Tambah FAQ", form.data)
        payload = self._minat_bakat_form_payload(self._csrf_token(form))
        payload["title"] = "Kegiatan Siswa"
        payload["badge"] = "POTENSI DIRI"
        payload["description"] = "Ruang untuk mencoba hal baru."
        payload["programs_title"] = "Pilihan Ekstrakurikuler"
        payload["faq_label"] = "PUSAT BANTUAN"
        payload["faq_title"] = "Pertanyaan Siswa"
        payload["faq_description"] = "Informasi lengkap tentang kegiatan."
        payload["programs[0][name]"] = "OSIS Madrasah"
        payload["programs[0][description]"] = "Latihan memimpin dan bekerja sama."
        payload["programs[0][details]"] = "Rincian kegiatan OSIS yang baru."
        payload["programs[0][image_file]"] = (
            io.BytesIO(b"\x89PNG\r\n\x1a\ncard-image"),
            "osis-card.png",
        )
        payload["programs[0][documentation][0][title]"] = "Rapat kerja OSIS"
        payload["programs[0][documentation][0][description]"] = "Anggota menyusun program."
        payload["programs[0][documentation][0][image_file]"] = (
            io.BytesIO(b"\x89PNG\r\n\x1a\ndocumentation-image"),
            "osis-documentation.png",
        )

        new_program_index = int(payload["program_count"])
        new_program_prefix = f"programs[{new_program_index}]"
        payload["program_count"] = str(new_program_index + 1)
        payload[f"{new_program_prefix}[name]"] = "Klub Sains"
        payload[f"{new_program_prefix}[slug]"] = "klub-sains"
        payload[f"{new_program_prefix}[category]"] = "Akademik"
        payload[f"{new_program_prefix}[description]"] = "Eksperimen sains bersama."
        payload[f"{new_program_prefix}[details]"] = "Kegiatan praktik dan diskusi."
        payload[f"{new_program_prefix}[imageAlt]"] = "Siswa melakukan eksperimen"
        payload[f"{new_program_prefix}[required]"] = "false"
        payload[f"{new_program_prefix}[image_file]"] = (
            io.BytesIO(b"\x89PNG\r\n\x1a\nnew-program-image"),
            "klub-sains.png",
        )
        payload[f"{new_program_prefix}[documentation_count]"] = "1"
        new_documentation_prefix = f"{new_program_prefix}[documentation][0]"
        payload[f"{new_documentation_prefix}[title]"] = "Eksperimen pertama"
        payload[f"{new_documentation_prefix}[description]"] = "Menguji ide di laboratorium."
        payload[f"{new_documentation_prefix}[alt]"] = "Siswa sedang bereksperimen"
        payload[f"{new_documentation_prefix}[image_file]"] = (
            io.BytesIO(b"\x89PNG\r\n\x1a\nnew-doc-image"),
            "klub-sains-dokumentasi.png",
        )

        new_faq_index = int(payload["faq_count"])
        payload["faq_count"] = str(new_faq_index + 1)
        payload[f"faqs[{new_faq_index}][question]"] = "Bagaimana bergabung dengan Klub Sains?"
        payload[f"faqs[{new_faq_index}][answer]"] = "Hubungi pembina kegiatan untuk informasi pendaftaran."

        response = self.client.post(
            "/admin/pages/minat-dan-bakat",
            data=payload,
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 302)
        page = self.client.get("/api/pages/minat-dan-bakat")
        self.assertEqual(page.status_code, 200)
        self.assertEqual(page.json["title"], "Kegiatan Siswa")
        self.assertEqual(page.json["badge"], "POTENSI DIRI")
        self.assertEqual(page.json["description"], "Ruang untuk mencoba hal baru.")
        data = page.json["data"]
        self.assertEqual(data["programsTitle"], "Pilihan Ekstrakurikuler")
        self.assertEqual(data["programs"][0]["name"], "OSIS Madrasah")
        self.assertEqual(data["programs"][0]["details"], "Rincian kegiatan OSIS yang baru.")
        self.assertRegex(data["programs"][0]["image"], r"^/static/uploads/content/[a-f0-9]+\.png$")
        self.assertEqual(data["programs"][0]["documentation"][0]["title"], "Rapat kerja OSIS")
        self.assertRegex(
            data["programs"][0]["documentation"][0]["image"],
            r"^/static/uploads/content/[a-f0-9]+\.png$",
        )
        self.assertEqual(data["programs"][-1]["slug"], "klub-sains")
        self.assertEqual(data["programs"][-1]["documentation"][0]["title"], "Eksperimen pertama")
        self.assertEqual(data["faqTitle"], "Pertanyaan Siswa")
        self.assertEqual(data["faqs"][-1]["question"], "Bagaimana bergabung dengan Klub Sains?")
        self.assertEqual(len(data["programs"]), new_program_index + 1)
        self.assertEqual(len(data["faqs"]), new_faq_index + 1)
        for image_url in (
            data["programs"][0]["image"],
            data["programs"][0]["documentation"][0]["image"],
            data["programs"][-1]["image"],
            data["programs"][-1]["documentation"][0]["image"],
        ):
            stored_image = Path(self.app.config["CONTENT_UPLOAD_FOLDER"]) / Path(image_url).name
            self.assertTrue(stored_image.is_file())

    def test_minat_bakat_rejects_duplicate_activity_slugs(self):
        self._login()
        connection = sqlite3.connect(self.app.config["DATABASE"])
        connection.execute(
            "UPDATE page_content SET status = 'published' WHERE page_slug = 'minat-dan-bakat'"
        )
        connection.commit()
        connection.close()
        original_page = self.client.get("/api/pages/minat-dan-bakat").json
        form = self.client.get("/admin/pages/minat-dan-bakat")
        payload = self._minat_bakat_form_payload(self._csrf_token(form))
        payload["programs[1][slug]"] = payload["programs[0][slug]"]
        payload["programs[0][image_file]"] = (
            io.BytesIO(b"not an image"),
            "invalid.png",
        )

        response = self.client.post(
            "/admin/pages/minat-dan-bakat",
            data=payload,
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Slug kegiatan 2 tidak boleh duplikat.", response.data)
        self.assertIn(b"Isi file tidak sesuai dengan format gambar yang dipilih.", response.data)
        updated_page = self.client.get("/api/pages/minat-dan-bakat").json
        self.assertEqual(updated_page["data"]["programs"], original_page["data"]["programs"])
        self.assertFalse(Path(self.app.config["CONTENT_UPLOAD_FOLDER"]).exists())

    def test_minat_bakat_admin_can_remove_program_documentation_and_faq(self):
        self._login()
        connection = sqlite3.connect(self.app.config["DATABASE"])
        connection.execute(
            "UPDATE page_content SET status = 'published' WHERE page_slug = 'minat-dan-bakat'"
        )
        connection.commit()
        connection.close()
        form = self.client.get("/admin/pages/minat-dan-bakat")
        payload = self._minat_bakat_form_payload(self._csrf_token(form))
        payload["program_count"] = "6"
        payload["programs[0][documentation_count]"] = "2"
        payload["faq_count"] = "4"

        response = self.client.post("/admin/pages/minat-dan-bakat", data=payload)

        self.assertEqual(response.status_code, 302)
        data = self.client.get("/api/pages/minat-dan-bakat").json["data"]
        self.assertEqual(len(data["programs"]), 6)
        self.assertEqual(len(data["programs"][0]["documentation"]), 2)
        self.assertEqual(len(data["faqs"]), 4)

    def test_page_api_hides_drafts_and_rejects_unknown_pages(self):
        self.assertEqual(self.client.get("/api/pages/visi-misi").status_code, 404)
        self.assertEqual(self.client.get("/api/pages/not-a-page").status_code, 404)

    def test_alumni_testimonial_requires_consent_and_admin_approval(self):
        token_response = self.client.get("/api/testimoni-alumni/form-token")
        self.assertEqual(token_response.status_code, 200)
        csrf_token = token_response.json["csrfToken"]
        submission_data = {
            "csrf_token": csrf_token,
            "name": "Alumni Penguji",
            "institution": "Universitas Karanganyar",
            "year": "2020",
            "quote": (
                "Pengalaman belajar di madrasah membantu saya tumbuh dan percaya diri. "
                "Guru selalu mendukung saya mencoba hal baru, bekerja sama, dan meraih cita-cita."
            ),
        }

        rejected_submission = self.client.post(
            "/api/testimoni-alumni/submissions",
            data=submission_data,
        )
        self.assertEqual(rejected_submission.status_code, 400)
        self.assertIn("consent", rejected_submission.json["errors"])

        accepted_submission = self.client.post(
            "/api/testimoni-alumni/submissions",
            data={
                **submission_data,
                "consent": "yes",
                "image": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 20),
                    "alumni.png",
                    "image/png",
                ),
            },
        )
        self.assertEqual(accepted_submission.status_code, 201)
        self.assertEqual(self.client.get("/api/pages/testimoni-alumni").status_code, 404)
        self.assertEqual(
            self.client.get("/admin/testimoni-alumni/submissions").status_code,
            302,
        )

        self._login()
        pending_list = self.client.get("/admin/testimoni-alumni/submissions")
        self.assertEqual(pending_list.status_code, 200)
        self.assertIn(b"Alumni Penguji", pending_list.data)
        csrf_token = self._csrf_token(pending_list)
        approved = self.client.post(
            "/admin/testimoni-alumni/submissions/1/approve",
            data={"csrf_token": csrf_token},
            follow_redirects=True,
        )
        self.assertEqual(approved.status_code, 200)
        self.assertIn(b"Testimoni berhasil disetujui", approved.data)

        published_page = self.client.get("/api/pages/testimoni-alumni")
        self.assertEqual(published_page.status_code, 200)
        published_testimonial = published_page.json["data"]["testimonials"][0]
        self.assertEqual(published_testimonial["name"], "Alumni Penguji")
        self.assertEqual(published_testimonial["institution"], "Universitas Karanganyar")
        self.assertEqual(published_testimonial["year"], "2020")
        self.assertEqual(
            published_testimonial["quote"],
            (
                "Pengalaman belajar di madrasah membantu saya tumbuh dan percaya diri. "
                "Guru selalu mendukung saya mencoba hal baru, bekerja sama, dan meraih cita-cita."
            ),
        )
        self.assertTrue(published_testimonial["image"].startswith("/static/uploads/content/"))
        uploaded_image = Path(self.app.config["CONTENT_UPLOAD_FOLDER"]) / Path(
            published_testimonial["image"]
        ).name
        self.assertTrue(uploaded_image.is_file())

    def test_alumni_testimonial_enforces_twenty_to_eighty_words(self):
        token_response = self.client.get("/api/testimoni-alumni/form-token")
        submission_data = {
            "csrf_token": token_response.json["csrfToken"],
            "name": "Alumni Penguji",
            "institution": "Universitas Karanganyar",
            "year": "2020",
            "consent": "yes",
        }

        too_short = self.client.post(
            "/api/testimoni-alumni/submissions",
            data={**submission_data, "quote": "cerita " * 19},
        )
        self.assertEqual(too_short.status_code, 400)
        self.assertIn("quote", too_short.json["errors"])

        valid = self.client.post(
            "/api/testimoni-alumni/submissions",
            data={**submission_data, "quote": "cerita " * 20},
        )
        self.assertEqual(valid.status_code, 201)

        too_long = self.client.post(
            "/api/testimoni-alumni/submissions",
            data={**submission_data, "quote": "cerita " * 81},
        )
        self.assertEqual(too_long.status_code, 400)
        self.assertIn("quote", too_long.json["errors"])

    def test_saved_drafts_are_listed_and_can_be_edited_or_published(self):
        self._login()

        page_form = self.client.get("/admin/pages/visi-misi")
        page_response = self.client.post(
            "/admin/pages/visi-misi",
            data={
                "csrf_token": self._csrf_token(page_form),
                "title": "Visi Draf Tersimpan",
                "badge": "DRAF",
                "description": "Halaman yang belum diterbitkan.",
                "status": "draft",
            },
        )
        self.assertEqual(page_response.status_code, 302)

        for title, status in (
            ("Berita Utama Lama", "published"),
            ("Berita Draf Tersimpan", "draft"),
            ("Berita Draf Hapus", "draft"),
        ):
            content_form = self.client.get("/admin/content/berita/new")
            content_response = self.client.post(
                "/admin/content/berita/new",
                data={
                    "csrf_token": self._csrf_token(content_form),
                    "title": title,
                    "summary": f"Ringkasan {title}",
                    "body": f"Isi {title}",
                    "image_url": f"/static/uploads/content/{title.replace(' ', '-').lower()}.png",
                    "published_at": "2026-11-18",
                    "status": status,
                    "placement": "utama",
                },
            )
            self.assertEqual(content_response.status_code, 302)

        connection = sqlite3.connect(self.app.config["DATABASE"])
        connection.execute(
            """
            UPDATE page_content SET status = 'draft', content_version = 1
            WHERE page_slug = 'beranda'
            """
        )
        draft_id = connection.execute(
            "SELECT id FROM content WHERE title = ?",
            ("Berita Draf Tersimpan",),
        ).fetchone()[0]
        delete_id = connection.execute(
            "SELECT id FROM content WHERE title = ?",
            ("Berita Draf Hapus",),
        ).fetchone()[0]
        connection.commit()
        connection.close()

        draft_list = self.client.get("/admin/drafts")
        self.assertEqual(draft_list.status_code, 200)
        self.assertIn(b"Visi Draf Tersimpan", draft_list.data)
        self.assertIn(b"Berita Draf Tersimpan", draft_list.data)
        self.assertIn(b'href="/admin/pages/beranda/content"', draft_list.data)
        self.assertNotIn(b"Sejarah MTsN 1 Karanganyar", draft_list.data)
        self.assertIn(b'href="/admin/pages/visi-misi"', draft_list.data)
        self.assertIn(f'href="/admin/content/{draft_id}/edit"'.encode(), draft_list.data)
        self.assertIn(b'action="/admin/drafts/pages/visi-misi/publish"', draft_list.data)
        self.assertIn(
            f'action="/admin/drafts/content/{draft_id}/publish"'.encode(),
            draft_list.data,
        )
        self.assertIn(
            f'action="/admin/drafts/content/{delete_id}/delete"'.encode(),
            draft_list.data,
        )
        self.assertIn(b"<dialog", draft_list.data)
        self.assertIn(b'data-draft-confirm="publish"', draft_list.data)
        self.assertIn(b'data-draft-confirm="delete"', draft_list.data)
        self.assertIn(b">Ya</button>", draft_list.data)
        self.assertIn(b"Tidak", draft_list.data)

        csrf_token = self._csrf_token(draft_list)
        content_delete = self.client.post(
            f"/admin/drafts/content/{delete_id}/delete",
            data={"csrf_token": csrf_token},
        )
        self.assertEqual(content_delete.status_code, 302)
        updated_draft_list = self.client.get("/admin/drafts")
        self.assertNotIn(b"Berita Draf Hapus", updated_draft_list.data)

        page_publish = self.client.post(
            "/admin/drafts/pages/visi-misi/publish",
            data={"csrf_token": csrf_token},
        )
        self.assertEqual(page_publish.status_code, 302)
        self.assertEqual(self.client.get("/api/pages/visi-misi").status_code, 200)

        home_publish = self.client.post(
            "/admin/drafts/pages/beranda/publish",
            data={"csrf_token": csrf_token},
        )
        self.assertEqual(home_publish.status_code, 302)
        self.assertEqual(self.client.get("/api/pages/beranda").status_code, 200)

        content_publish = self.client.post(
            f"/admin/drafts/content/{draft_id}/publish",
            data={"csrf_token": csrf_token},
        )
        self.assertEqual(content_publish.status_code, 302)
        published_news = self.client.get("/api/content?type=berita").json
        by_title = {item["title"]: item for item in published_news}
        self.assertEqual(by_title["Berita Draf Tersimpan"]["placement"], "utama")
        self.assertEqual(by_title["Berita Utama Lama"]["placement"], "sorotan")
        self.assertIn(
            b"Belum ada draf tersimpan",
            self.client.get("/admin/drafts").data,
        )

    def test_history_timeline_is_updated_once_and_preserves_other_page_data(self):
        database_path = Path(self.app.config["DATABASE"])
        connection = sqlite3.connect(database_path)
        row = connection.execute(
            "SELECT data_json FROM page_content WHERE page_slug = 'sejarah'"
        ).fetchone()
        history_data = json.loads(row[0])
        history_data["story"]["title"] = "Judul sejarah khusus"
        history_data["milestones"] = [{"year": "legacy"}]
        connection.execute(
            """
            UPDATE page_content SET data_json = ?, status = 'published'
            WHERE page_slug = 'sejarah'
            """,
            (json.dumps(history_data, ensure_ascii=False),),
        )
        connection.execute(
            "DELETE FROM app_settings WHERE key = 'history_milestones_screenshot_v1'"
        )
        connection.commit()
        connection.close()

        updated_app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "safe-test-password-123",
            "DATABASE": str(database_path),
            "GURU_UPLOAD_FOLDER": self.app.config["GURU_UPLOAD_FOLDER"],
            "TENDIK_UPLOAD_FOLDER": self.app.config["TENDIK_UPLOAD_FOLDER"],
        })
        updated_page = Client(updated_app, updated_app.response_class).get("/api/pages/sejarah")

        self.assertEqual(updated_page.status_code, 200)
        self.assertEqual(updated_page.json["data"]["story"]["title"], "Judul sejarah khusus")
        self.assertEqual(
            [milestone["year"] for milestone in updated_page.json["data"]["milestones"]],
            ["1960", "1968", "1978", "2013", "2017", "Kini"],
        )

    def test_admin_can_manage_history_sections_and_upload_their_images(self):
        self._login()
        metadata_form = self.client.get("/admin/pages/sejarah")
        self.assertIn(b'name="title"', metadata_form.data)
        self.assertIn(b'name="badge"', metadata_form.data)
        self.assertIn(b'name="description"', metadata_form.data)
        self.assertNotIn(b'name="story_title"', metadata_form.data)
        self.assertIn(b"Kelola isi sejarah", metadata_form.data)
        self.assertIn(b'class="page-content-navigation"', metadata_form.data)
        self.assertNotIn(b"Kembali ke semua halaman", metadata_form.data)

        form = self.client.get("/admin/pages/sejarah/content")
        self.assertNotIn(b'name="title"', form.data)
        self.assertNotIn(b"Alamat gambar lambang", form.data)
        self.assertNotIn(b"Alamat foto", form.data)
        self.assertIn(b'data-history-editor', form.data)
        self.assertEqual(form.data.count(b'name="save_section"'), 6)
        self.assertEqual(form.data.count(b'<details id="history-'), 5)
        self.assertIn(b'name="status"', form.data)
        self.assertIn(b'Simpan status', form.data)
        for field in (
            b'name="story_title"',
            b'name="founded"',
            b'name="milestones_year"',
            b'name="emblem_points_title"',
            b'name="leaders_name"',
            b'data-add-history-item="milestones"',
        ):
            self.assertIn(field, form.data)
        self.assertIn(b'<textarea id="story_title"', form.data)
        self.assertNotIn(b"Alamat gambar", form.data)

        response = self.client.post(
            "/admin/pages/sejarah/content",
            data={
                "csrf_token": self._csrf_token(form),
                "save_section": "history-emblem",
                "status": "published",
                "story_title": "Jejak\nSejarah",
                "story_description": "Kisah perjalanan madrasah.",
                "founded_label": "DIDIRIKAN",
                "founded": "1960",
                "tenure_label": "MASA PENGABDIAN",
                "tenure": "66 Tahun",
                "accreditation_label": "STATUS MUTU",
                "accreditation": "Akreditasi A",
                "history_milestones_title": "Tonggak Sejarah",
                "emblem_title": "Lambang Madrasah",
                "emblem_logo_title": "Logo Resmi",
                "emblem_logo_url": "",
                "emblem_logo_file": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\nlogo image"),
                    "logo.png",
                    "image/png",
                ),
                "leaders_title": "Kepala Madrasah",
                "milestones_year": ["1960"],
                "milestones_title": ["Awal Berdirinya Madrasah"],
                "milestones_text": ["Madrasah mulai dirintis."],
                "milestones_noteTitle": ["Catatan Sejarah 1960"],
                "milestones_note": ["Pendidikan agama untuk masyarakat."],
                "emblem_points_icon": ["✦"],
                "emblem_points_title": ["Obor Abadi"],
                "emblem_points_text": ["Penerang ilmu dan karakter."],
                "leaders_period": ["1960 – 1968"],
                "leaders_name": ["Kepala Madrasah Pertama"],
                "leaders_image": [""],
                "leader_image_file_0": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\nleader image"),
                    "leader.png",
                    "image/png",
                ),
            },
        )

        self.assertEqual(response.status_code, 302, response.data.decode("utf-8"))
        self.assertTrue(response.headers["Location"].endswith("#history-emblem"))
        self.assertEqual(self.client.get("/api/pages/sejarah").status_code, 200)
        metadata_form = self.client.get("/admin/pages/sejarah")
        metadata_response = self.client.post(
            "/admin/pages/sejarah",
            data={
                "csrf_token": self._csrf_token(metadata_form),
                "title": "Sejarah MTsN 1 Karanganyar",
                "badge": "PERJALANAN MADRASAH",
                "description": "Sejarah madrasah dari masa ke masa.",
                "status": "published",
            },
        )
        self.assertEqual(metadata_response.status_code, 302)
        history = self.client.get("/api/pages/sejarah").json["data"]
        self.assertEqual(history["story"]["founded"], "1960")
        self.assertEqual(history["story"]["title"], "Jejak\nSejarah")
        self.assertEqual(history["milestones"][0]["year"], "1960")
        self.assertEqual(history["emblemPoints"][0]["title"], "Obor Abadi")
        self.assertEqual(history["leaders"][0]["name"], "Kepala Madrasah Pertama")
        for image_key, image_url in (
            ("logo", history["story"]["logo"]),
            ("leader", history["leaders"][0]["image"]),
        ):
            self.assertRegex(image_url, r"^/static/uploads/content/[a-f0-9]+\.png$")
            self.assertTrue(
                (Path(self.app.config["CONTENT_UPLOAD_FOLDER"]) / Path(image_url).name).is_file(),
                image_key,
            )

    def test_legacy_markdown_page_is_preserved_as_draft_with_seeded_fields(self):
        database_path = Path(self.app.config["DATABASE"])
        connection = sqlite3.connect(database_path)
        connection.execute(
            """
            UPDATE page_content SET body = 'Konten lama', status = 'published',
                data_json = '{}', content_version = 0
            WHERE page_slug = 'visi-misi'
            """
        )
        connection.commit()
        connection.close()

        restarted_app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "safe-test-password-123",
            "DATABASE": str(database_path),
            "GURU_UPLOAD_FOLDER": self.app.config["GURU_UPLOAD_FOLDER"],
        })
        restarted_client = Client(restarted_app, restarted_app.response_class)
        self.assertEqual(restarted_client.get("/api/pages/visi-misi").status_code, 404)

        connection = sqlite3.connect(database_path)
        page = connection.execute(
            "SELECT status, body, data_json FROM page_content WHERE page_slug = 'visi-misi'"
        ).fetchone()
        connection.close()
        self.assertEqual(page[0], "draft")
        self.assertEqual(page[1], "Konten lama")
        self.assertIn('"missions"', page[2])

    def test_page_editor_validates_metadata_without_rendering_data_fields(self):
        self._login()
        form = self.client.get("/admin/pages/visi-misi")
        self.assertNotIn(b"json-editor", form.data)
        self.assertNotIn(b'name="field_', form.data)
        response = self.client.post(
            "/admin/pages/visi-misi",
            data={
                "csrf_token": self._csrf_token(form),
                "title": "",
                "badge": "PROFIL",
                "description": "Deskripsi",
                "status": "published",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Judul wajib diisi.", response.data)

    def test_homepage_editor_saves_all_sections_and_uploaded_images(self):
        self._login()
        pages = self.client.get("/admin/pages")
        self.assertEqual(pages.data.count(b"Kelola halaman"), 15)
        self.assertNotIn(b"Beranda /beranda", pages.data)

        old_home_route = self.client.get("/admin/pages/beranda")
        self.assertEqual(old_home_route.status_code, 302)
        self.assertEqual(old_home_route.headers["Location"], "/admin/pages/beranda/content")

        form = self.client.get("/admin/pages/beranda/content")
        self.assertEqual(form.status_code, 200)
        self.assertNotIn(b"Kembali ke dashboard", form.data)
        self.assertEqual(form.data.count(b'name="save_section"'), 10)
        self.assertEqual(form.data.count(b'data-home-section'), 9)
        self.assertEqual(form.data.count(b"<details id="), 9)
        self.assertEqual(form.data.count(b'<details id="home-'), 9)
        self.assertLess(
            form.data.index(b'id="home-publication"'),
            form.data.index(b'id="home-hero"'),
        )
        self.assertIn(b'name="gallery_category" required', form.data)
        new_gallery_template = form.data.split(
            b'<template data-home-template="gallery">', 1
        )[1]
        for category in (
            "Pembelajaran",
            "Upacara &amp; Karakter",
            "Keagamaan",
            "Ekstrakurikuler",
        ):
            self.assertIn(f"<option value=\"{category}\"".encode(), new_gallery_template)
        self.assertIn(b"Pilihan: Pembelajaran", new_gallery_template)
        for field in (
            b'name="hero_title"',
            b'name="hero_slide_image"',
            b'name="welcome_name"',
            b'name="statistics_value"',
            b'name="program_title"',
            b'name="values_title"',
            b'name="fallback_news_title"',
            b'name="fallback_achievement_title"',
            b'name="gallery_image"',
            b'name="gallery_position"',
            b'data-gallery-position-x',
            b'name="admission_url"',
            b'name="contact_map_url"',
        ):
            self.assertIn(field, form.data)
        self.assertNotIn(b"Alamat gambar", form.data)
        self.assertNotIn(b"Alamat video", form.data)

        defaults = PAGE_DATA_DEFAULTS["beranda"]
        payload = MultiDict([
            ("csrf_token", self._csrf_token(form)),
            ("save_section", "home-welcome"),
            ("status", "published"),
            ("hero_title", "Beranda hasil suntingan"),
            ("hero_description", "Deskripsi hero yang dikelola admin."),
            ("welcome_title", defaults["welcome"]["title"]),
            ("welcome_name", defaults["welcome"]["name"]),
            ("welcome_image", ""),
            ("welcome_greeting", defaults["welcome"]["greeting"]),
            ("welcome_body", defaults["welcome"]["body"]),
            ("welcome_closing", defaults["welcome"]["closing"]),
            (
                "welcome_image_file",
                (io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 16), "kepala.png", "image/png"),
            ),
        ])

        def add_values(field, rows, key):
            for row in rows:
                payload.add(field, str(key(row)))

        add_values("hero_slide_label", defaults["heroSlides"], lambda row: row["label"])
        add_values("hero_slide_type", defaults["heroSlides"], lambda row: row["type"])
        add_values("hero_slide_image", defaults["heroSlides"], lambda row: row["image"])
        add_values("hero_slide_video", defaults["heroSlides"], lambda row: row.get("video", ""))
        payload.add(
            "hero_slide_file_1",
            (
                io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 16),
                "banner.png",
                "image/png",
            ),
        )
        payload.add(
            "hero_slide_video_file_0",
            (
                io.BytesIO(b"\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2"),
                "banner.mp4",
                "video/mp4",
            ),
        )
        add_values("statistics_value", defaults["statistics"], lambda row: row["value"])
        add_values("statistics_label", defaults["statistics"], lambda row: row["label"])
        add_values("program_number", defaults["programs"], lambda row: row["number"])
        add_values("program_title", defaults["programs"], lambda row: row["title"])
        add_values("program_description", defaults["programs"], lambda row: row["description"])
        for program in defaults["programs"]:
            add_values("program_visual_src", program["visuals"], lambda row: row["src"])
            add_values("program_visual_alt", program["visuals"], lambda row: row["alt"])
        for key, field in (
            ("number", "values_number"),
            ("title", "values_title"),
            ("caption", "values_caption"),
        ):
            index = {"number": 0, "title": 1, "caption": 2}[key]
            for value in defaults["values"]:
                payload.add(field, value[index])
            payload.add("fallback_news_title", defaults["fallbackNews"]["title"])
            payload.add("fallback_news_summary", defaults["fallbackNews"]["summary"])
            payload.add("fallback_news_date", defaults["fallbackNews"]["dateTime"])
            payload.add("fallback_news_image", defaults["fallbackNews"]["image"])
            for item in defaults["fallbackAchievements"]:
                payload.add("fallback_achievement_category", item["category"])
                payload.add("fallback_achievement_title", item["title"])
                payload.add("fallback_achievement_date", item["dateTime"])
                payload.add("fallback_achievement_image", item["image"])
        add_values("gallery_title", defaults["gallery"], lambda row: row["title"])
        add_values("gallery_category", defaults["gallery"], lambda row: row["category"])
        add_values("gallery_image", defaults["gallery"], lambda row: row["image"])
        for index, _item in enumerate(defaults["gallery"]):
            payload.add(
                "gallery_position",
                "23% 78%" if index == 0 else "50% 50%",
            )

        section_fields = {
            "programs": {"eyebrow": "home_programs_eyebrow", "title": "home_programs_title"},
            "vision": {
                "eyebrow": "home_vision_eyebrow",
                "title": "home_vision_title",
                "description": "home_vision_description",
                "visionLabel": "home_vision_label",
                "statement": "home_vision_statement",
                "missionLabel": "home_mission_label",
                "linkLabel": "home_vision_link_label",
                "linkUrl": "home_vision_link_url",
            },
            "news": {
                "eyebrow": "home_news_eyebrow",
                "title": "home_news_title",
                "description": "home_news_description",
                "newsLabel": "home_news_label",
                "newsLinkLabel": "home_news_link_label",
                "newsLinkUrl": "home_news_link_url",
                "achievementsLabel": "home_achievements_label",
                "achievementsLinkLabel": "home_achievements_link_label",
                "achievementsLinkUrl": "home_achievements_link_url",
            },
            "gallery": {"eyebrow": "home_gallery_eyebrow", "title": "home_gallery_title"},
            "admission": {"eyebrow": "home_admission_eyebrow"},
            "contact": {
                "eyebrow": "home_contact_eyebrow",
                "title": "home_contact_title",
                "mapContextLabel": "contact_map_context_label",
                "mapTitle": "contact_map_title",
            },
        }
        for section_name, fields in section_fields.items():
            for key, field in fields.items():
                payload.add(field, defaults["homeSections"][section_name][key])

        for key, field in (
            ("title", "admission_title"),
            ("description", "admission_description"),
            ("primaryLabel", "admission_primary_label"),
            ("secondaryLabel", "admission_secondary_label"),
            ("url", "admission_url"),
        ):
            payload.add(field, defaults["admission"][key])
        for key, field in (
            ("addressLabel", "contact_address_label"),
            ("address", "contact_address"),
            ("phoneLabel", "contact_phone_label"),
            ("phone", "contact_phone"),
            ("emailLabel", "contact_email_label"),
            ("email", "contact_email"),
            ("hoursLabel", "contact_hours_label"),
            ("hours", "contact_hours"),
            ("mapCaption", "contact_map_caption"),
            ("mapUrl", "contact_map_url"),
        ):
            payload.add(field, defaults["contact"][key])

        response = self.client.post(
            "/admin/pages/beranda/content",
            data=payload,
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 302, response.data.decode("utf-8"))
        self.assertTrue(response.headers["Location"].endswith("#home-welcome"))
        published_home = self.client.get("/api/pages/beranda")
        self.assertEqual(published_home.status_code, 200)
        self.assertEqual(
            published_home.json["data"]["hero"]["title"],
            "Beranda hasil suntingan",
        )
        self.assertEqual(
            published_home.json["data"]["gallery"][0]["imagePosition"],
            "23% 78%",
        )
        welcome_image = published_home.json["data"]["welcome"]["image"]
        self.assertTrue(welcome_image.startswith("/static/uploads/content/"))
        self.assertTrue(
            (
                Path(self.app.config["CONTENT_UPLOAD_FOLDER"])
                / Path(welcome_image).name
            ).is_file()
        )
        homepage_slides = published_home.json["data"]["heroSlides"]
        self.assertRegex(homepage_slides[0]["video"], r"^/static/uploads/content/[a-f0-9]+\.mp4$")
        self.assertTrue(
            (
                Path(self.app.config["CONTENT_UPLOAD_FOLDER"])
                / Path(homepage_slides[0]["video"]).name
            ).is_file()
        )
        self.assertRegex(homepage_slides[1]["image"], r"^/static/uploads/content/[a-f0-9]+\.png$")

    def test_homepage_editor_rejects_empty_sections(self):
        self._login()
        form = self.client.get("/admin/pages/beranda/content")
        response = self.client.post(
            "/admin/pages/beranda/content",
            data={
                "csrf_token": self._csrf_token(form),
                "status": "published",
                "hero_title": "Judul",
                "hero_description": "Deskripsi",
                "gallery_title": ["Foto uji"],
                "gallery_category": ["Kategori tidak dikenal"],
                "gallery_image": [""],
                "gallery_position": ["101% 50%"],
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            b"Minimal 1 data wajib ada pada bagian Label slide hero.",
            response.data,
        )
        self.assertIn(b"Kategori galeri pada baris 1 tidak valid.", response.data)
        self.assertIn(
            b"Posisi gambar galeri pada baris 1 harus berada antara 0% dan 100%.",
            response.data,
        )

    def test_tendik_directory_is_seeded_and_editable_in_its_own_page(self):
        entries = self.client.get("/api/staff/tendik").json
        self.assertEqual(len(entries), 30)
        self.assertEqual(entries[0]["name"], "Siti Nurhasanah, S.Pd.")

        self._login()
        list_page = self.client.get("/admin/staff/tendik")

        self.assertEqual(list_page.status_code, 200)
        self.assertIn(b"Siti Nurhasanah, S.Pd.", list_page.data)
        self.assertIn(b"Yogi Santoso, S.T.", list_page.data)
        page_form = self.client.get("/admin/pages/direktori-tendik")
        self.assertNotIn(b"name=\"field_people\"", page_form.data)
        published_page = self.client.post(
            "/admin/pages/direktori-tendik",
            data={
                "csrf_token": self._csrf_token(page_form),
                "title": "Direktori Tenaga Kependidikan",
                "badge": "TENAGA KEPENDIDIKAN",
                "description": "Layanan madrasah.",
                "status": "published",
            },
        )
        self.assertEqual(published_page.status_code, 302)
        self.assertNotIn(
            "people",
            self.client.get("/api/pages/direktori-tendik").json["data"],
        )

    def test_tendik_directory_supports_crud_photo_and_unique_order(self):
        self._login()
        form = self.client.get("/admin/staff/tendik/new")
        self.assertNotIn(b'name="nip"', form.data)
        self.assertNotIn(b'name="unit"', form.data)
        response = self.client.post(
            "/admin/staff/tendik/new",
            data={
                "csrf_token": self._csrf_token(form),
                "name": "Tendik Baru",
                "role": "Operator",
                "sort_order": "1",
                "image": (io.BytesIO(b"\x89PNG\r\n\x1a\nnew tendik"), "tendik.png", "image/png"),
            },
            follow_redirects=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Tendik Baru", response.data)

        entries = self.client.get("/api/staff/tendik").json
        self.assertEqual(entries[0]["name"], "Tendik Baru")
        admin_list = self.client.get("/admin/staff/tendik")
        self.assertNotIn(b"NIP", admin_list.data)
        self.assertNotIn(b"Unit Kerja", admin_list.data)
        self.assertIn(b"data-admin-confirm-delete", admin_list.data)
        self.assertIn(b'class="draft-confirm-dialog"', admin_list.data)
        self.assertEqual(
            [entry["sort_order"] for entry in entries],
            list(range(1, len(entries) + 1)),
        )
        entry = entries[0]
        image_path = Path(self.app.config["TENDIK_UPLOAD_FOLDER"]) / Path(entry["image_url"]).name
        self.assertTrue(image_path.is_file())

        edit_form = self.client.get(f"/admin/staff/tendik/{entry['id']}/edit")
        edit_response = self.client.post(
            f"/admin/staff/tendik/{entry['id']}/edit",
            data={
                "csrf_token": self._csrf_token(edit_form),
                "name": "Tendik Diperbarui",
                "role": "Operator Madrasah",
                "sort_order": "2",
            },
            follow_redirects=True,
        )
        self.assertEqual(edit_response.status_code, 200)
        self.assertIn(b"Tendik Diperbarui", edit_response.data)

        list_page = self.client.get("/admin/staff/tendik")
        delete_response = self.client.post(
            f"/admin/staff/tendik/{entry['id']}/delete",
            data={"csrf_token": self._csrf_token(list_page)},
            follow_redirects=True,
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(image_path.exists())
        remaining_entries = self.client.get("/api/staff/tendik").json
        self.assertNotIn("Tendik Diperbarui", [item["name"] for item in remaining_entries])
        self.assertEqual(
            [item["sort_order"] for item in remaining_entries],
            list(range(1, len(remaining_entries) + 1)),
        )

    def test_guru_directory_is_editable_and_publicly_sorted(self):
        initial = self.client.get("/api/staff/guru")
        self.assertEqual(initial.status_code, 200)
        self.assertEqual(len(initial.json), 31)
        self.assertEqual(initial.json[0]["name"], "Dr. Siti Aminah, M.Si.")

        self._login()
        edit_form = self.client.get("/admin/staff/guru/1/edit")
        edit_response = self.client.post(
            "/admin/staff/guru/1/edit",
            data={
                "csrf_token": self._csrf_token(edit_form),
                "name": "Nama Guru Diperbarui",
                "role": "Guru IPA",
                "sort_order": "2",
                "image": (io.BytesIO(b"\x89PNG\r\n\x1a\nedited"), "guru-edit.png", "image/png"),
            },
            follow_redirects=True,
        )
        self.assertEqual(edit_response.status_code, 200)
        self.assertIn(b"Data guru berhasil diperbarui.", edit_response.data)
        edited_entries = self.client.get("/api/staff/guru").json
        self.assertEqual(
            [entry["sort_order"] for entry in edited_entries],
            list(range(1, len(edited_entries) + 1)),
        )

        add_form = self.client.get("/admin/staff/guru/new")
        self.client.post(
            "/admin/staff/guru/new",
            data={
                "csrf_token": self._csrf_token(add_form),
                "name": "Guru Baru",
                "role": "Guru Bahasa",
                "sort_order": "1",
                "image": (io.BytesIO(b"\x89PNG\r\n\x1a\nnew"), "guru-baru.png", "image/png"),
            },
        )
        updated = self.client.get("/api/staff/guru")
        self.assertEqual(updated.json[0]["name"], "Guru Baru")
        self.assertEqual(
            [entry["sort_order"] for entry in updated.json],
            list(range(1, len(updated.json) + 1)),
        )

        new_entry = next(item for item in updated.json if item["name"] == "Guru Baru")
        image_path = Path(self.app.config["GURU_UPLOAD_FOLDER"]) / Path(new_entry["image_url"]).name
        self.assertTrue(image_path.is_file())
        list_page = self.client.get("/admin/staff/guru")
        self.assertIn(b"data-admin-confirm-delete", list_page.data)
        delete_response = self.client.post(
            f"/admin/staff/guru/{new_entry['id']}/delete",
            data={"csrf_token": self._csrf_token(list_page)},
            follow_redirects=True,
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(image_path.exists())
        remaining_entries = self.client.get("/api/staff/guru").json
        self.assertNotIn("Guru Baru", [item["name"] for item in remaining_entries])
        self.assertEqual(
            [entry["sort_order"] for entry in remaining_entries],
            list(range(1, len(remaining_entries) + 1)),
        )

    def test_guru_directory_rejects_invalid_image_file(self):
        self._login()
        form = self.client.get("/admin/staff/guru/new")
        response = self.client.post(
            "/admin/staff/guru/new",
            data={
                "csrf_token": self._csrf_token(form),
                "name": "Guru Uji",
                "role": "Guru Uji",
                "sort_order": "1",
                "image": (io.BytesIO(b"not an image"), "guru.png", "image/png"),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Isi file tidak sesuai dengan format gambar yang dipilih.", response.data)

    def test_admin_can_upload_content_images(self):
        self._login()
        token_page = self.client.get("/admin/pages/beranda/content")
        response = self.client.post(
            "/admin/uploads/images",
            data={
                "csrf_token": self._csrf_token(token_page),
                "image": (io.BytesIO(b"\x89PNG\r\n\x1a\nvalid image bytes"), "hero.png", "image/png"),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertRegex(response.json["url"], r"^/static/uploads/content/[a-f0-9]+\.png$")
        self.assertTrue(
            (Path(self.app.config["CONTENT_UPLOAD_FOLDER"]) / Path(response.json["url"]).name).is_file()
        )

        invalid_page = self.client.get("/admin/pages/beranda/content")
        invalid_response = self.client.post(
            "/admin/uploads/images",
            data={
                "csrf_token": self._csrf_token(invalid_page),
                "image": (io.BytesIO(b"not an image"), "hero.png", "image/png"),
            },
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertIn("Isi file tidak sesuai", invalid_response.json["error"])

    def test_public_navigation_is_seeded_in_existing_order(self):
        response = self.client.get("/api/navigation")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [group["title"] for group in response.json],
            [
                "Profil Sekolah", "Fasilitas", "Warga Sekolah", "Lainnya",
                "Unggulan", "Kegiatan Belajar", "Kegiatan Madrasah",
            ],
        )
        self.assertEqual(
            [item["label"] for item in response.json[0]["items"]],
            ["Visi dan Misi", "Sejarah", "Penghargaan Madrasah"],
        )
        lainnya = next(group for group in response.json if group["title"] == "Lainnya")
        self.assertIn(
            ("Testimoni Alumni", "/testimoni-alumni"),
            [(item["label"], item["href"]) for item in lainnya["items"]],
        )
        self.assertEqual(
            [group["menu_key"] for group in response.json],
            ["tentang"] * 4 + ["akademik"] * 2 + ["kegiatan"],
        )
        kegiatan = next(group for group in response.json if group["menu_key"] == "kegiatan")
        self.assertEqual(
            [(item["label"], item["href"]) for item in kegiatan["items"]],
            [("Berita", "/berita"), ("Artikel", "/artikel"), ("Galeri", "/galeri")],
        )
        unggulan = next(group for group in response.json if group["title"] == "Unggulan")
        self.assertEqual(
            [(item["label"], item["href"]) for item in unggulan["items"]],
            [
                ("Program Khusus", "/program-khusus"),
                ("Prestasi", "/prestasi"),
                ("Minat dan Bakat", "/minat-dan-bakat"),
            ],
        )

    def test_existing_database_migrates_navigation_and_content_images(self):
        database_path = Path(self.temporary_directory.name) / "legacy.sqlite3"
        connection = sqlite3.connect(database_path)
        connection.executescript(
            """
            CREATE TABLE navigation_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE navigation_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                label TEXT NOT NULL,
                href TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_type TEXT NOT NULL
                    CHECK (content_type IN ('berita', 'prestasi', 'pengumuman')),
                title TEXT NOT NULL,
                summary TEXT NOT NULL DEFAULT '',
                body TEXT NOT NULL,
                published_at TEXT NOT NULL,
                status TEXT NOT NULL,
                placement TEXT NOT NULL DEFAULT 'sorotan',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO content (content_type, title, body, published_at, status)
                VALUES ('berita', 'Berita Lama', 'Isi berita lama', '2026-11-17', 'published');
            INSERT INTO navigation_groups (title, sort_order) VALUES ('Profil Sekolah', 1);
            INSERT INTO navigation_items (group_id, label, href, sort_order)
                VALUES (1, 'Visi dan Misi', '/visi-misi', 1);
            INSERT INTO app_settings (key, value) VALUES ('navigation_seeded', 'true');
            """
        )
        connection.commit()
        connection.close()

        migrated_app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "safe-test-password-123",
            "DATABASE": str(database_path),
        })
        migrated_client = Client(migrated_app, migrated_app.response_class)
        navigation = migrated_client.get("/api/navigation").json
        self.assertEqual(migrated_client.get("/api/content?type=artikel").status_code, 200)
        self.assertEqual(
            [item["title"] for item in migrated_client.get("/api/content?type=berita").json],
            ["Berita Lama"],
        )
        self.assertEqual(navigation[0]["menu_key"], "tentang")
        self.assertEqual(navigation[0]["items"][0]["label"], "Visi dan Misi")
        self.assertIn(
            ("Artikel", "/artikel"),
            [
                (item["label"], item["href"])
                for group in navigation
                if group["menu_key"] == "kegiatan"
                for item in group["items"]
            ],
        )
        self.assertEqual(
            {group["menu_key"] for group in navigation},
            {"tentang", "akademik", "kegiatan"},
        )
        connection = sqlite3.connect(database_path)
        columns = {row[1] for row in connection.execute("PRAGMA table_info(content)")}
        self.assertIn("image_url", columns)
        self.assertIn("image_position", columns)
        legacy_news = connection.execute(
            "SELECT title FROM content WHERE content_type = 'berita'"
        ).fetchone()
        self.assertEqual(legacy_news[0], "Berita Lama")
        connection.execute(
            """
            INSERT INTO content (content_type, title, body, published_at, status)
            VALUES ('artikel', 'Artikel Baru', 'Isi artikel baru', '2026-11-18', 'published')
            """
        )
        connection.commit()
        connection.close()

    def test_admin_can_manage_and_order_navigation(self):
        self._login()

        group_form = self.client.get("/admin/navigation/groups/new")
        group_response = self.client.post(
            "/admin/navigation/groups/new",
            data={
                "csrf_token": self._csrf_token(group_form),
                "title": "Informasi",
                "menu_key": "akademik",
                "sort_order": "0",
            },
        )
        self.assertEqual(group_response.status_code, 302)

        navigation = self.client.get("/api/navigation").json
        self.assertEqual(navigation[0]["title"], "Informasi")
        self.assertEqual(navigation[0]["menu_key"], "akademik")
        group_id = navigation[0]["id"]

        item_form = self.client.get(f"/admin/navigation/items/new?group_id={group_id}")
        item_response = self.client.post(
            "/admin/navigation/items/new",
            data={
                "csrf_token": self._csrf_token(item_form),
                "group_id": str(group_id),
                "label": "Kabar Madrasah",
                "href": "/berita",
                "sort_order": "0",
            },
        )
        self.assertEqual(item_response.status_code, 302)

        navigation = self.client.get("/api/navigation").json
        item = navigation[0]["items"][0]
        self.assertEqual((item["label"], item["href"]), ("Kabar Madrasah", "/berita"))
        item_id = item["id"]

        second_item_form = self.client.get(f"/admin/navigation/items/new?group_id={group_id}")
        second_item_response = self.client.post(
            "/admin/navigation/items/new",
            data={
                "csrf_token": self._csrf_token(second_item_form),
                "group_id": str(group_id),
                "label": "Kontak",
                "href": "/kontak",
                "sort_order": "1",
            },
        )
        self.assertEqual(second_item_response.status_code, 302)

        edit_item_form = self.client.get(f"/admin/navigation/items/{item_id}/edit")
        edit_item_response = self.client.post(
            f"/admin/navigation/items/{item_id}/edit",
            data={
                "csrf_token": self._csrf_token(edit_item_form),
                "group_id": str(group_id),
                "label": "Berita Madrasah",
                "href": "/berita",
                "sort_order": "2",
            },
        )
        self.assertEqual(edit_item_response.status_code, 302)

        edit_group_form = self.client.get(f"/admin/navigation/groups/{group_id}/edit")
        edit_group_response = self.client.post(
            f"/admin/navigation/groups/{group_id}/edit",
            data={
                "csrf_token": self._csrf_token(edit_group_form),
                "title": "Informasi Madrasah",
                "menu_key": "kegiatan",
                "sort_order": "0",
            },
        )
        self.assertEqual(edit_group_response.status_code, 302)

        navigation = self.client.get("/api/navigation").json
        self.assertEqual(navigation[0]["title"], "Informasi Madrasah")
        self.assertEqual(navigation[0]["menu_key"], "kegiatan")
        self.assertEqual(
            [item["label"] for item in navigation[0]["items"]],
            ["Kontak", "Berita Madrasah"],
        )

        list_page = self.client.get("/admin/navigation")
        self.assertIn(b"data-admin-confirm-delete", list_page.data)
        self.assertIn(b'class="draft-confirm-dialog"', list_page.data)
        delete_item_response = self.client.post(
            f"/admin/navigation/items/{item_id}/delete",
            data={"csrf_token": self._csrf_token(list_page)},
        )
        self.assertEqual(delete_item_response.status_code, 302)

        list_page = self.client.get("/admin/navigation")
        delete_group_response = self.client.post(
            f"/admin/navigation/groups/{group_id}/delete",
            data={"csrf_token": self._csrf_token(list_page)},
        )
        self.assertEqual(delete_group_response.status_code, 302)
        self.assertNotIn(
            "Informasi Madrasah",
            [group["title"] for group in self.client.get("/api/navigation").json],
        )
        for group in self.client.get("/api/navigation").json:
            list_page = self.client.get("/admin/navigation")
            self.client.post(
                f"/admin/navigation/groups/{group['id']}/delete",
                data={"csrf_token": self._csrf_token(list_page)},
            )
        self.assertEqual(self.client.get("/api/navigation").json, [])

        restarted_app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret-key-that-is-at-least-32-chars",
                "ADMIN_USERNAME": "admin",
                "ADMIN_PASSWORD": "safe-test-password-123",
                "DATABASE": self.app.config["DATABASE"],
            }
        )
        restarted_client = Client(restarted_app, restarted_app.response_class)
        self.assertEqual(restarted_client.get("/api/navigation").json, [])

    def test_only_one_published_news_item_can_be_featured(self):
        self._login()

        def create_news(title, status):
            form_response = self.client.get("/admin/content/berita/new")
            return self.client.post(
                "/admin/content/berita/new",
                data={
                    "csrf_token": self._csrf_token(form_response),
                    "title": title,
                    "summary": "",
                    "body": f"Isi {title}",
                    "published_at": "2026-11-17",
                    "status": status,
                    "placement": "utama",
                },
            )

        create_news("Berita Utama Lama", "published")
        create_news("Berita Utama Draf", "draft")

        draft_response = self.client.get("/api/content?type=berita")
        self.assertEqual(
            [(item["title"], item["placement"]) for item in draft_response.json],
            [("Berita Utama Lama", "utama")],
        )

        create_news("Berita Utama Baru", "published")
        published_response = self.client.get("/api/content?type=berita")

        self.assertEqual(
            [(item["title"], item["placement"]) for item in published_response.json],
            [
                ("Berita Utama Baru", "utama"),
                ("Berita Utama Lama", "sorotan"),
            ],
        )

    def test_editing_news_to_featured_demotes_previous_featured(self):
        self._login()

        def create_news(title, placement):
            form_response = self.client.get("/admin/content/berita/new")
            return self.client.post(
                "/admin/content/berita/new",
                data={
                    "csrf_token": self._csrf_token(form_response),
                    "title": title,
                    "summary": "",
                    "body": f"Isi {title}",
                    "published_at": "2026-11-17",
                    "status": "published",
                    "placement": placement,
                },
            )

        create_news("Berita Utama Lama", "utama")
        create_news("Berita Sorotan Baru", "sorotan")

        edit_page = self.client.get("/admin/content/2/edit")
        updated_response = self.client.post(
            "/admin/content/2/edit",
            data={
                "csrf_token": self._csrf_token(edit_page),
                "title": "Berita Utama Baru",
                "summary": "",
                "body": "Isi Berita Utama Baru",
                "published_at": "2026-11-17",
                "status": "published",
                "placement": "utama",
            },
        )
        self.assertEqual(updated_response.status_code, 302)

        response = self.client.get("/api/content?type=berita")

        self.assertEqual(
            [(item["title"], item["placement"]) for item in response.json],
            [
                ("Berita Utama Baru", "utama"),
                ("Berita Utama Lama", "sorotan"),
            ],
        )


if __name__ == "__main__":
    unittest.main()

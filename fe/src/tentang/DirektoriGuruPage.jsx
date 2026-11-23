import { useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedGuru } from '../api/staff.js'

const guruData = [
  { name: 'Dr. Siti Aminah, M.Si.', role: 'Guru Kimia & Koordinator MIPA', nip: 'NIP. 19780820 2005012 004', subject: 'MIPA • Kimia', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Dewi Lestari, S.Pd.', role: 'Guru Bahasa Indonesia', nip: 'NIP. 19821015 201903 2 005', subject: 'Bahasa • Indonesia', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Ahmad Fajar, M.Pd.', role: 'Guru Matematika', nip: 'NIP. 19880518 202012 1 013', subject: 'MIPA • Matematika', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rina Permata, S.Pd.', role: 'Guru Fisika', nip: 'NIP. 19890725 201903 2 001', subject: 'MIPA • Fisika', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Budi Hartono, M.Pd.', role: 'Guru IPA', nip: 'NIP. 19850714 201903 1 006', subject: 'IPA • Umum', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Nadya Aulia, S.Pd.', role: 'Guru Biologi', nip: 'NIP. 19900420 202012 2 016', subject: 'MIPA • Biologi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Fadhila Rahman, S.Pd.', role: 'Guru Sejarah', nip: 'NIP. 19870209 201903 2 008', subject: 'Sosial • Sejarah', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Yusuf Hidayat, M.Pd.', role: 'Guru PAI', nip: 'NIP. 19810212 201903 1 004', subject: 'Agama • PAI', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Lina Pratiwi, S.Pd.', role: 'Guru PKn', nip: 'NIP. 19910312 202012 2 018', subject: 'Pendidikan • PKn', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { name: 'Raka Wijaya, M.Pd.', role: 'Guru Bahasa Inggris', nip: 'NIP. 19831103 201903 1 009', subject: 'Bahasa • Inggris', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Mila Sari, S.Pd.', role: 'Guru Seni Budaya', nip: 'NIP. 19900605 202012 2 021', subject: 'Seni • Budaya', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hendra Saputra, M.Pd.', role: 'Guru Olahraga', nip: 'NIP. 19881218 202012 1 012', subject: 'Olahraga', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Nia Ramadhani, S.Pd.', role: 'Guru Informatika', nip: 'NIP. 19920302 202012 2 015', subject: 'TIK • Informatika', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Teguh Prasetyo, M.Pd.', role: 'Guru Geografi', nip: 'NIP. 19840423 201903 1 007', subject: 'Sosial • Geografi', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Ayu Lestari, S.Pd.', role: 'Guru Ekonomi', nip: 'NIP. 19891016 202012 2 010', subject: 'Ekonomi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Joko Santoso, M.Pd.', role: 'Guru Bahasa Jawa', nip: 'NIP. 19820521 201903 1 014', subject: 'Bahasa • Jawa', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Sri Wulandari, S.Pd.', role: 'Guru Bahasa Arab', nip: 'NIP. 19890930 202012 2 024', subject: 'Bahasa • Arab', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Taufik Hidayat, M.Pd.', role: 'Guru Akidah Akhlak', nip: 'NIP. 19860819 201903 1 011', subject: 'Agama • Akidah', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rahmawati, S.Pd.', role: 'Guru Kesenian', nip: 'NIP. 19910808 202012 2 023', subject: 'Seni • Kesenian', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Eko Prabowo, M.Pd.', role: 'Guru IPA Terpadu', nip: 'NIP. 19870126 201903 1 018', subject: 'IPA • Terpadu', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Siska Dewi, S.Pd.', role: 'Guru IPS', nip: 'NIP. 19920211 202012 2 019', subject: 'IPS', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Agus Setiawan, M.Pd.', role: 'Guru Agama Kristen', nip: 'NIP. 19850930 201903 1 020', subject: 'Agama • Kristen', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Putri Handayani, S.Pd.', role: 'Guru Prakarya', nip: 'NIP. 19930514 202012 2 022', subject: 'Prakarya', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Wahyu Nugroho, M.Pd.', role: 'Guru IPA', nip: 'NIP. 19881212 201903 1 017', subject: 'IPA • Umum', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rizka Nuraini, S.Pd.', role: 'Guru BK', nip: 'NIP. 19911003 202012 2 020', subject: 'Bimbingan • Konseling', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Dian Permana, M.Pd.', role: 'Guru Bahasa Sunda', nip: 'NIP. 19871018 201903 1 029', subject: 'Bahasa • Sunda', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Fina Melati, S.Pd.', role: 'Guru Tata Boga', nip: 'NIP. 19940112 202012 2 027', subject: 'Prakarya • Boga', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Arif Rahman, M.Pd.', role: 'Guru Bahasa Jepang', nip: 'NIP. 19890527 202012 1 026', subject: 'Bahasa • Jepang', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Citra Maulida, S.Pd.', role: 'Guru PKN', nip: 'NIP. 19920415 202012 2 028', subject: 'Pendidikan • PKn', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hamdan Yusuf, M.Pd.', role: 'Guru Pendidikan Agama', nip: 'NIP. 19840209 201903 1 030', subject: 'Agama • Umum', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Galuh Wulandari, S.Pd.', role: 'Guru Kimia', nip: 'NIP. 19900621 202012 2 031', subject: 'MIPA • Kimia', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
]

const PAGE_SIZE = 8

function DirektoriGuruPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const publishedTeachers = usePublishedGuru()
  const teachers = publishedTeachers ?? guruData
  const totalPages = Math.max(1, Math.ceil(teachers.length / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleTeachers = teachers.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <ContentSubpage
      title={<>Direktori<br />Guru</>}
      breadcrumb="Direktori Guru"
      badge="PENDIDIK MADRASAH"
      description="Informasi pendidik MTsN 1 Karanganyar akan disajikan dalam direktori yang mudah dikenali."
    >
      <ContentSection
        title="Jajaran Pendidik"
      >
        <style>{`
          .guru-directory-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 22px;
            padding: 8px 0 6px;
          }

          .guru-profile-card {
            background: linear-gradient(180deg, #ffffff 0%, #f7f9fa 100%);
            border: 1px solid rgba(148, 164, 174, 0.28);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 24px 34px rgba(19, 32, 45, 0.12), 0 8px 18px rgba(19, 32, 45, 0.06);
            font-family: 'Segoe UI', sans-serif;
            position: relative;
            transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
            cursor: pointer;
          }

          .guru-profile-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 28px 38px rgba(19, 32, 45, 0.16), 0 12px 24px rgba(19, 32, 45, 0.1);
            border-color: rgba(21, 102, 79, 0.26);
          }

          .guru-profile-card::before {
            content: "";
            position: absolute;
            inset: 12px auto auto 12px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: rgba(41, 120, 92, 0.06);
            filter: blur(16px);
            pointer-events: none;
          }

          .guru-photo-frame {
            position: relative;
            height: 320px;
            background: linear-gradient(180deg, rgba(233, 240, 242, 0.92), rgba(173, 190, 198, 0.72));
            border-bottom: 1px solid rgba(146, 160, 171, 0.18);
          }

          .guru-photo {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: saturate(0.9) contrast(1.02);
            transition: transform 0.32s ease, filter 0.32s ease;
          }

          .guru-profile-card:hover .guru-photo {
            transform: scale(1.04);
            filter: saturate(1) contrast(1.04);
          }

          .guru-photo-badge {
            position: absolute;
            top: 12px;
            right: 16px;
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #1d2b36;
            backdrop-filter: blur(4px);
          }

          .guru-card-body {
            background: linear-gradient(180deg, #ffffff 0%, #f7f9fa 100%);
            padding: 16px 18px 18px;
            position: relative;
            z-index: 1;
          }

          .guru-name {
            margin: 0;
            font-size: 1.4rem;
            line-height: 1.2;
            letter-spacing: -0.04em;
            color: #1c2d3a;
            font-weight: 800;
          }

          .guru-role {
            margin: 6px 0 0;
            font-size: 0.9rem;
            line-height: 1.5;
            color: #4b6475;
            font-weight: 600;
          }

          .guru-nip {
            margin: 4px 0 0;
            font-size: 0.82rem;
            letter-spacing: 0.02em;
            color: #54687a;
            font-weight: 600;
          }

          .guru-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 18px;
          }

          .guru-action-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .guru-icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid rgba(111, 131, 145, 0.28);
            background: #fff;
            display: grid;
            place-items: center;
            color: #1a2d38;
            box-shadow: 0 6px 12px rgba(25, 37, 46, 0.04);
            cursor: pointer;
            transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          }

          .guru-icon-btn:hover,
          .guru-biodata-btn:hover,
          .guru-page-btn:hover {
            transform: translateY(-1px);
          }

          .guru-icon-btn svg {
            width: 18px;
            height: 18px;
            stroke: currentColor;
            fill: none;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .guru-biodata-btn {
            border: 0;
            border-radius: 12px;
            background: linear-gradient(180deg, rgba(228, 236, 240, 0.95), rgba(203, 216, 223, 0.92));
            color: #1f2b39;
            min-width: 110px;
            min-height: 42px;
            padding: 0 16px;
            font-size: 0.9rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
          }

          .guru-biodata-btn span:last-child {
            font-size: 1.2rem;
            line-height: 1;
            transform: translateY(-1px);
          }

          .guru-pagination {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
          }

          .guru-page-btn {
            min-width: 42px;
            height: 42px;
            border-radius: 10px;
            border: 1px solid rgba(111, 131, 145, 0.22);
            background: #fff;
            color: #294a5d;
            font-weight: 700;
            cursor: pointer;
          }

          .guru-page-btn.is-active {
            background: linear-gradient(180deg, #0a7d64 0%, #0d6a57 100%);
            border-color: transparent;
            color: #fff;
            box-shadow: 0 10px 18px rgba(11, 125, 100, 0.2);
          }

          .guru-page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 1200px) {
            .guru-directory-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }

          @media (max-width: 860px) {
            .guru-directory-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 640px) {
            .guru-directory-grid {
              grid-template-columns: 1fr;
            }

            .guru-photo-frame {
              height: 360px;
            }
          }
        `}</style>

        <div className="guru-directory-grid">
          {visibleTeachers.map((teacher) => (
            <article key={teacher.id ?? `${teacher.nip}-${teacher.name}`} className="guru-profile-card">
              <div className="guru-photo-frame">
                <img className="guru-photo" src={teacher.image_url ?? teacher.image} alt={teacher.name} />
              </div>

              <div className="guru-card-body">
                <h3 className="guru-name">{teacher.name}</h3>
                <p className="guru-role">{teacher.role}</p>
              </div>
            </article>
          ))}
        </div>

        {!teachers.length && <p>Data guru belum tersedia.</p>}

        {teachers.length > PAGE_SIZE && <div className="guru-pagination" aria-label="Paginasi direktori guru">
          <button
            type="button"
            className="guru-page-btn"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`guru-page-btn ${page === currentPage ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(page)}
              aria-label={`Halaman ${page}`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="guru-page-btn"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
        </div>}
      </ContentSection>
    </ContentSubpage>
  )
}

export default DirektoriGuruPage

import { useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import { usePublishedTendik } from '../api/staff.js'

const tendikData = [
  { name: 'Siti Nurhasanah, S.Pd.', role: 'Kepala TU', nip: 'NIP. 19790514 200501 2 004', unit: 'TU • Umum', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Agus Wibowo, S.E.', role: 'Kasubag Keuangan', nip: 'NIP. 19820409 201903 1 002', unit: 'TU • Keuangan', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rahayu Dwi, S.Kom.', role: 'Operator SIAKAD', nip: 'NIP. 19890818 202012 2 011', unit: 'TU • Akademik', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'M. Yusuf, A.Md.', role: 'Staff Perpustakaan', nip: 'NIP. 19831121 201903 1 006', unit: 'Perpustakaan', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Lia Septiani, A.Md.', role: 'Petugas Laboratorium', nip: 'NIP. 19920217 202012 2 014', unit: 'Lab • IPA', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Arif Setyawan, S.H.', role: 'Staff Umum', nip: 'NIP. 19850730 201903 1 009', unit: 'TU • Umum', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Novi Kartika, S.Pd.', role: 'Petugas Administrasi', nip: 'NIP. 19910425 202012 2 015', unit: 'TU • Administrasi', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Doni Saputra, A.Md.', role: 'Teknisi Komputer', nip: 'NIP. 19880612 201903 1 001', unit: 'IT • Infrastruktur', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Eva Anggraini, S.Kom.', role: 'Staff Kurikulum', nip: 'NIP. 19890901 202012 2 017', unit: 'Kurikulum', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tri Wahyudi, S.E.', role: 'Kasubag Sarana', nip: 'NIP. 19870605 201903 1 010', unit: 'Sarana • Prasarana', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Fitri Handayani, A.Md.', role: 'Petugas Kesiswaan', nip: 'NIP. 19900809 202012 2 021', unit: 'Kesiswaan', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hadi Prasetyo, S.H.', role: 'Staff Humas', nip: 'NIP. 19840218 201903 1 013', unit: 'Humas', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Indah Pratiwi, S.E.', role: 'Petugas Pembukuan', nip: 'NIP. 19910614 202012 2 018', unit: 'TU • Keuangan', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { name: 'Ali Mustofa, A.Md.', role: 'Teknisi Laboratorium', nip: 'NIP. 19891026 201903 1 016', unit: 'Lab • Komputer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rina Safitri, S.Pd.', role: 'Staff Pustaka', nip: 'NIP. 19921208 202012 2 019', unit: 'Perpustakaan', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Fajar Nugraha, S.T.', role: 'Teknisi Jaringan', nip: 'NIP. 19880412 201903 1 008', unit: 'IT • Jaringan', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Ayu Lestari, S.Sos.', role: 'Staff Bimbingan', nip: 'NIP. 19900323 202012 2 022', unit: 'BK • Administrasi', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rizky Ananda, S.Kom.', role: 'Operator Nilai', nip: 'NIP. 19870927 201903 1 014', unit: 'TU • Akademik', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Maya Rachmawati, A.Md.', role: 'Petugas Kebersihan', nip: 'NIP. 19920805 202012 2 023', unit: 'Sarana • Kebersihan', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Heru Kurniawan, S.E.', role: 'Kasubag Logistik', nip: 'NIP. 19851109 201903 1 011', unit: 'Sarana • Logistik', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Dinda Puspita, S.Pd.', role: 'Staff Tata Usaha', nip: 'NIP. 19911210 202012 2 024', unit: 'TU • Umum', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Wahyu Setiawan, A.Md.', role: 'Petugas Asset', nip: 'NIP. 19860214 201903 1 020', unit: 'Sarana • Aset', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Salsabila, S.Kom.', role: 'Staff Pelayanan', nip: 'NIP. 19930519 202012 2 026', unit: 'TU • Pelayanan', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80' },
  { name: 'Ari Wicaksono, S.T.', role: 'Teknisi Ruang Kelas', nip: 'NIP. 19880114 201903 1 027', unit: 'Sarana • Gedung', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Kiki Maulidia, A.Md.', role: 'Petugas Arsip', nip: 'NIP. 19920430 202012 2 028', unit: 'TU • Arsip', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rian Pratama, S.E.', role: 'Staff Evaluasi', nip: 'NIP. 19871223 201903 1 029', unit: 'TU • Evaluasi', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' },
  { name: 'Nadya Oktavia, S.Kom.', role: 'Koordinator IT', nip: 'NIP. 19911018 202012 2 030', unit: 'IT • Koordinasi', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bima Kusuma, A.Md.', role: 'Petugas Gudang', nip: 'NIP. 19860508 201903 1 031', unit: 'Sarana • Gudang', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Septi Rahayu, S.E.', role: 'Staff Pelaporan', nip: 'NIP. 19930921 202012 2 032', unit: 'TU • Pelaporan', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Yogi Santoso, S.T.', role: 'Teknisi CCTV', nip: 'NIP. 19850204 201903 1 033', unit: 'IT • Keamanan', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
]

const PAGE_SIZE = 8

function DirektoriTendikPage() {
  const page = usePublishedPage('direktori-tendik')
  const publishedTendik = usePublishedTendik()
  const [currentPage, setCurrentPage] = useState(1)
  const people = publishedTendik ?? tendikData
  const totalPages = Math.max(1, Math.ceil(people.length / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleTendik = people.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <ContentSubpage
      title={page?.title || <>Direktori<br />Tenaga Kependidikan</>}
      breadcrumb={page?.title || 'Direktori Tendik'}
      badge={page?.badge || 'LAYANAN MADRASAH'}
      description={page?.description || 'Kenali tenaga kependidikan yang mendukung layanan dan kegiatan di MTsN 1 Karanganyar.'}
    >
      <ContentSection
        title={page?.data?.sectionTitle || 'Jajaran Tenaga Kependidikan'}
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
          {visibleTendik.map((person) => (
            <article key={`${person.nip}-${person.name}`} className="guru-profile-card">
              <div className="guru-photo-frame">
                <img className="guru-photo" src={person.image_url || person.image} alt={person.name} />
              </div>

              <div className="guru-card-body">
                <h3 className="guru-name">{person.name}</h3>
                <p className="guru-role">{person.role}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="guru-pagination" aria-label="Paginasi direktori tendik">
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
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  sectionTitle: 'Jajaran Tenaga Kependidikan',
  people: tendikData,
}

export default DirektoriTendikPage

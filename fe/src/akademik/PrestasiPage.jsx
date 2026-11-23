import { useMemo, useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { formatContentDate, usePublishedContent } from '../api/content.js'
import './PrestasiPage.css'

const allAchievements = [
  {
    date: '16 Oktober 2026',
    dateTime: '2026-10-16',
    tag: 'Seni',
    level: 'Provinsi',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    title: 'Juara 2 Lomba Tari Tradisional Panah Mulawarman',
    description: 'Bergu 6 peserta dan menghadirkan penampilan tari tradisional dengan kreativitas dan karakter kuat.',
    student: 'Alyssa Nadira Putri Hidayat, Nafla Fakhirah, Shafa Cantika Ardilla +3 lainnya',
    mentor: 'Universitas Mulawarman',
  },
  {
    date: '19 September 2025',
    dateTime: '2025-09-19',
    tag: 'Bahasa & Retorika',
    level: 'Nasional',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    title: 'National Schools Debating Championship (NSDC) 2025',
    description: 'Tim debat MTsN 1 Karanganyar menunjukkan kemampuan berpikir kritis dan berbicara dengan strategi solid.',
    student: 'Nadira Zahra & Tim Debat',
    mentor: 'Clara Angelica, M.Hum.',
  },
  {
    date: '8 Agustus 2025',
    dateTime: '2025-08-08',
    tag: 'Olahraga',
    level: 'Provinsi',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    title: 'O2SN Renang Gaya Bebas 100m Putra Tingkat Provinsi',
    description: 'Penyelenggara Dinas Pemuda dan Olahraga Provinsi, dengan siswa menunjukkan disiplin dan stamina tinggi.',
    student: 'Rizky Ramadhan (X-3)',
    mentor: 'Coach Yayan Supriyadi',
  },
  {
    date: '14 November 2024',
    dateTime: '2024-11-14',
    tag: 'Informatika',
    level: 'Nasional',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    title: 'National Youth AI Hackathon: Solusi Pintar Pengolahan Sampah',
    description: 'Tim inovatif merancang solusi berbasis teknologi untuk permasalahan lingkungan secara nyata dan aplikatif.',
    student: 'Arya Satria & Daffa Alamsyah',
    mentor: 'Irfan Hakim, S.Kom., M.T.',
  },
  {
    date: '12 Juni 2024',
    dateTime: '2024-06-12',
    tag: 'Seni & Budaya',
    level: 'Nasional',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    title: 'Festival Seni Budaya Madrasah 2024',
    description: 'Penampilan kolaboratif yang kuat membawa semangat kearifan lokal dan kreativitas siswa ke panggung nasional.',
    student: 'Tim Seni Budaya',
    mentor: 'Dewi Lestari, M.Pd.',
  },
  {
    date: '18 Mei 2024',
    dateTime: '2024-05-18',
    tag: 'Karya Ilmiah',
    level: 'Kabupaten/Kota',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    title: 'Karya Ilmiah Remaja Madrasah 2024',
    description: 'Karya dengan pendekatan inovasi dan relevansi nyata mendapat apresiasi dari panitia dan juri.',
    student: 'Nabila Azzahra',
    mentor: 'M. Yusuf, S.Pd.',
  },
  {
    date: '4 April 2024',
    dateTime: '2024-04-04',
    tag: 'Teknologi',
    level: 'Provinsi',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    title: 'Lomba Robotik Madrasah Tingkat Provinsi',
    description: 'Tim robotika tampil responsif dan profesional menghadapi tantangan teknis dalam kompetisi provinsi.',
    student: 'Tim Robotika',
    mentor: 'Rizki Pradana, S.T.',
  },
  {
    date: '22 Maret 2024',
    dateTime: '2024-03-22',
    tag: 'Olahraga',
    level: 'Kabupaten/Kota',
    image: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=1200&q=80',
    title: 'Kejuaraan Basket Antar Madrasah Kabupaten',
    description: 'Konsistensi permainan dan kerja sama tim membawa prestasi yang membanggakan bagi madrasah.',
    student: 'Tim Basket Putra',
    mentor: 'Andi Wijaya, S.Pd.',
  },
  {
    date: '9 Februari 2024',
    dateTime: '2024-02-09',
    tag: 'Sains',
    level: 'Nasional',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    title: 'Kompetisi Sains Nasional Bidang Biologi',
    description: 'Analisis data dan observasi yang tajam menjadi kunci keberhasilan siswa dalam kompetisi sains nasional.',
    student: 'Mutiara Safira',
    mentor: 'Dian Puspita, M.Si.',
  },
  {
    date: '11 Januari 2024',
    dateTime: '2024-01-11',
    tag: 'Literasi',
    level: 'Kabupaten/Kota',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
    title: 'Lomba Esai dan Literasi Madrasah',
    description: 'Peserta menampilkan kemampuan menulis dan berpikir kritis melalui tema aktual dan inspiratif.',
    student: 'Salsabila Rania',
    mentor: 'Rina Setiani, M.Pd.',
  },
  {
    date: '6 Desember 2023',
    dateTime: '2023-12-06',
    tag: 'Kepemimpinan',
    level: 'Kabupaten/Kota',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    title: 'Pelatihan Leadership Siswa Madrasah',
    description: 'Penguatan karakter kepemimpinan menjadi bekal bagi siswa untuk berkontribusi di lingkungan sekitar.',
    student: 'Tim Organisasi Siswa',
    mentor: 'Rahmawati, S.Pd.',
  },
  {
    date: '27 November 2023',
    dateTime: '2023-11-27',
    tag: 'Kebersamaan',
    level: 'Kabupaten/Kota',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    title: 'Festival Karya Siswa dan Gotong Royong Madrasah',
    description: 'Kreativitas, semangat kolaboratif, dan kepedulian sosial menjadi ciri utama kegiatan ini.',
    student: 'Seluruh Siswa Kelas XI',
    mentor: 'Tim Guru',
  },
]

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) return [1, 2, 3, 'ellipsis', totalPages]
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}

const motivationCollageImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1482043452915-1d0b381a8c31?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
]

const fallbackMotivationImage = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'

function PrestasiPage() {
  const publishedAchievements = usePublishedContent('prestasi')
  const [currentPage, setCurrentPage] = useState(1)
  const achievements = publishedAchievements.length
    ? publishedAchievements.map((item, index) => ({
      date: formatContentDate(item.published_at),
      dateTime: item.published_at,
      tag: item.achievement_level || 'Kabupaten/Kota',
      category: item.achievement_category || 'Lainnya',
      image: item.image_url || allAchievements[index % allAchievements.length].image,
      imagePosition: item.image_position || '50% 50%',
      title: item.title,
      description: item.summary || item.body,
      student: item.student_names || 'Belum diisi',
    }))
    : allAchievements.map((achievement) => ({
      ...achievement,
      tag: achievement.level,
      category: achievement.tag,
    }))
  const prestasiPerPage = 9
  const totalPages = Math.max(1, Math.ceil(achievements.length / prestasiPerPage))
  const visibleAchievements = achievements.slice(
    (currentPage - 1) * prestasiPerPage,
    currentPage * prestasiPerPage,
  )
  const paginationItems = getPaginationItems(currentPage, totalPages)
  const motivationImages = useMemo(
    () => [...motivationCollageImages].sort(() => Math.random() - 0.5),
    [],
  )

  return (
    <ContentSubpage
      className="prestasi-page"
      title={<>Prestasi<br />Madrasah</>}
      breadcrumb="Prestasi"
      badge="APRESIASI DAN PENCAPAIAN"
      description="Merayakan usaha, semangat, dan pencapaian siswa MTsN 1 Karanganyar di bidang sains, seni, budaya, dan teknologi."
    >
      <ContentSection
        title="Galeri Prestasi"
      >
        <div className="prestasi-news-grid" aria-label="Daftar prestasi siswa">
          {visibleAchievements.map((achievement) => (
            <article className="prestasi-news-card" key={`${achievement.title}-${achievement.date}`}>
              <div className="prestasi-news-image-wrap">
                <img
                  src={achievement.image}
                  alt={achievement.title}
                  loading="lazy"
                  className="prestasi-news-image"
                  style={{ objectPosition: achievement.imagePosition || '50% 50%' }}
                />
                <span className="prestasi-image-category">{achievement.category}</span>
              </div>

              <div className="prestasi-news-content">
                <div className="prestasi-news-head">
                  <time className="prestasi-news-date" dateTime={achievement.dateTime}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M8 3v4M16 3v4M3 10h18" />
                    </svg>
                    {achievement.date}
                  </time>
                  <span className="prestasi-news-tag">{achievement.tag}</span>
                </div>

                <h3>{achievement.title}</h3>

                <p>{achievement.description}</p>

                <div className="prestasi-news-footer">
                  <div>
                    <span>Siswa</span>
                    <strong>{achievement.student}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <nav className="prestasi-pagination" aria-label="Navigasi halaman prestasi">
          <button
            type="button"
            className="prestasi-pagination-arrow"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="prestasi-pagination-pages" aria-label={`Halaman ${currentPage} dari ${totalPages}`}>
            {paginationItems.map((item, index) => {
              if (item === 'ellipsis' || item === 'ellipsis-end') {
                return <span className="prestasi-pagination-ellipsis" key={`${item}-${index}`} aria-hidden="true">…</span>
              }

              return (
                <button
                  key={item}
                  type="button"
                  className={item === currentPage ? 'is-current' : ''}
                  onClick={() => setCurrentPage(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="prestasi-pagination-arrow"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            aria-label="Halaman berikutnya"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>

        <div className="prestasi-motivasi-collage" aria-label="Motivasi prestasi">
          {motivationImages.slice(0, 32).map((image, index) => {
            const isLifted = (Math.floor(index / 8) + (index % 8)) % 2 === 0

            return (
              <div
                className={`prestasi-motivasi-tile ${isLifted ? 'prestasi-motivasi-tile--lifted' : 'prestasi-motivasi-tile--rest'}`}
                key={`${image}-${index}`}
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = fallbackMotivationImage
                    event.currentTarget.onerror = null
                  }}
                />
              </div>
            )
          })}

          <div className="prestasi-motivasi-overlay" aria-hidden="true" />
          <div className="prestasi-motivasi-copy">
            <span className="prestasi-motivasi-kicker">MOTIVASI</span>
            <div className="prestasi-motivasi-text">“Belajar tanpa henti, berani mencoba, dan terus tumbuh.”</div>
          </div>
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

export default PrestasiPage
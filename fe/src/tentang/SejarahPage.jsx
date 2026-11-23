import { useEffect, useState } from 'react'
import '../App.css'
import { SiteFooter, SiteHeader } from '../SiteChrome.jsx'
import SubpageHero from '../components/SubpageHero.jsx'
import { usePublishedPage } from '../api/pages.js'
import schoolLogo from '../assets/logo.png'
import principalPhoto from '../assets/kepala sekolah.png'
import './SejarahPage.css'

const milestones = [
  {
    year: '1960',
    title: 'Awal Berdirinya Madrasah',
    text: "MTs Al Ma'arif Gondangrejo mulai dirintis sebagai lembaga pendidikan Islam di bawah naungan Yayasan Al Ma'arif.",
    noteTitle: 'Catatan Sejarah 1960',
    note: 'Menjadi awal perjalanan madrasah dalam memberikan pendidikan agama Islam kepada masyarakat.',
  },
  {
    year: '1968',
    title: 'Tonggak Madrasah Negeri',
    text: 'Perubahan status menjadi negeri menjadi langkah penting dalam perjalanan dan perkembangan madrasah.',
    noteTitle: 'Perubahan Status Negeri 1968',
    note: 'Berdasarkan KMA Nomor 144 Tahun 1968 tanggal 12 Juli 1968, madrasah resmi berubah status menjadi MTs-Agama Islam Negeri.',
  },
  {
    year: '1978',
    title: 'Menjadi MTs Negeri Gondangrejo',
    text: 'Melalui Keputusan Menteri Agama Nomor 16 Tahun 1978 tanggal 12 Maret 1978, nama madrasah berubah menjadi MTs Negeri Gondangrejo.',
    noteTitle: 'Perkembangan Identitas 1978',
    note: 'Madrasah terus melanjutkan perannya sebagai lembaga pendidikan Islam negeri di wilayah Gondangrejo.',
  },
  {
    year: '2013',
    title: 'Identitas MTsN 1 Karanganyar',
    text: 'Madrasah dikenal dengan nama MTs Negeri 1 Karanganyar atau MADAGASKAR.',
    noteTitle: 'Perubahan Nama Madrasah',
    note: 'Penyesuaian nama menjadi MTs Negeri 1 Karanganyar memperkuat identitas madrasah sebagai lembaga pendidikan negeri di Kabupaten Karanganyar.',
  },
  {
    year: '2017',
    title: 'Pengembangan Madrasah',
    text: 'Pergantian kepemimpinan menjadi bagian dari perjalanan madrasah dalam melanjutkan pengembangan pendidikan dan peningkatan kualitas layanan.',
    noteTitle: 'Melanjutkan Perjalanan',
    note: 'Madrasah terus menjalankan pengembangan pendidikan melalui kepemimpinan dan pengelolaan yang berkelanjutan.',
  },
  {
    year: 'Kini',
    title: 'Menuju Masa Depan Gemilang',
    text: 'Melanjutkan perjalanan panjang untuk menjadi madrasah yang unggul dan berkualitas.',
    noteTitle: 'Komitmen Masa Kini',
    note: 'Terus berupaya meningkatkan kualitas pendidikan, membangun karakter peserta didik, serta mencetak generasi yang berprestasi dan berakhlak mulia.',
  },
]

const leaders = [
  ['1985 – 1995', 'Prof. Dr. Siti Wardhani, M.Ed.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80'],
  ['1995 – 2008', 'Drs. H. Bambang Sudirman, M.Pd.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80'],
  ['2008 – 2018', 'Dra. Hj. Ratna Juwita, M.M.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80'],
  ['2018 – Sekarang', 'Dr. H. Suryo Prabowo, M.Pd.', principalPhoto],
  ['1978 – 1985', 'Drs. H. Ahmad Fauzan, M.Ag.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80'],
  ['1970 – 1978', 'Dra. Hj. Nurhayati, M.Pd.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80'],
  ['1962 – 1970', 'Drs. H. Abdul Karim, M.Pd.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'],
]

const emblemPoints = [
  { icon: '♨', title: 'Obor Abadi', text: 'Penerang jalan kebenaran ilmu pengetahuan dan karakter.' },
  { icon: '▣', title: 'Buku Terbuka', text: 'Keterbukaan terhadap kemajuan ilmu, teknologi, dan literasi.' },
  { icon: '♙', title: 'Untaian Daun Zaitun', text: 'Makna kehormatan, kerja keras, dan pencapaian prestasi.' },
  { icon: '◉', title: 'Biru Samudera & Emas', text: 'Melambangkan kedalaman integritas dan kecemerlangan prestasi.' },
]

function SejarahPage() {
  const page = usePublishedPage('sejarah')
  const data = page?.data ?? {}
  const story = data.story ?? {}
  const visibleMilestones = Array.isArray(data.milestones) ? data.milestones : milestones
  const visibleEmblemPoints = Array.isArray(data.emblemPoints) ? data.emblemPoints : emblemPoints
  const visibleLeaders = Array.isArray(data.leaders) && data.leaders.length
    ? data.leaders.map(({ period, name, image }, index) => [period, name, image || leaders[index]?.[2] || ''])
    : leaders
  const [leaderIndex, setLeaderIndex] = useState(visibleLeaders.length)
  const [leaderTransitionEnabled, setLeaderTransitionEnabled] = useState(true)
  const [leaderVisibleCount, setLeaderVisibleCount] = useState(() =>
    window.innerWidth <= 640 ? 1 : window.innerWidth <= 900 ? 2 : 4,
  )
  const currentLeaderIndex = visibleLeaders.length
    ? visibleLeaders.length + (leaderIndex % visibleLeaders.length)
    : 0

  useEffect(() => {
    const updateVisibleCount = () => {
      setLeaderVisibleCount(window.innerWidth <= 640 ? 1 : window.innerWidth <= 900 ? 2 : 4)
    }

    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeaderIndex((current) => current + 1)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  const moveLeader = (direction) => {
    setLeaderTransitionEnabled(true)
    setLeaderIndex((current) => current + direction)
  }

  const handleLeaderTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (currentLeaderIndex > 0 && currentLeaderIndex < visibleLeaders.length * 2) return

    setLeaderTransitionEnabled(false)
    setLeaderIndex(visibleLeaders.length)
    window.setTimeout(() => setLeaderTransitionEnabled(true), 0)
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${page?.title || 'Sejarah Madrasah'} | MTs Negeri 1 Karanganyar`

    return () => {
      document.title = previousTitle
    }
  }, [page?.title])

  return (
    <div className="site-shell history-page">
      <SiteHeader overlay />
      <main>
        <SubpageHero
          titleId="history-page-title"
          title={page?.title || <>Sejarah MTsN 1<br />Karanganyar</>}
          breadcrumb={page?.title || 'Sejarah Madrasah'}
          badge={page?.badge || 'PERJALANAN MADRASAH'}
          description={page?.description || 'Setiap madrasah memiliki perjalanan dan kisah yang membentuknya. Halaman ini disiapkan untuk mengenalkan perjalanan MTsN 1 Karanganyar.'}
        />

        <section className="history-story" id="kisah">
          <div className="history-story-copy">
            <h2>{story.title || <>Jejak Langkah &amp; Sejarah<br />Pendirian</>}</h2>
            <p>{story.description || (
              <>
              Menelusuri perjalanan panjang MTsN 1 Karanganyar dalam mencerdaskan tunas bangsa,
              <br className="history-story-description-break" /> menanamkan integritas dan budi pekerti, serta mengukir prestasi gemilang. Bersama dedikasi para pendidik
              <br className="history-story-description-break" /> dan semangat seluruh warga madrasah, setiap langkah menjadi bagian
              <br className="history-story-description-break" /> dari ikhtiar membangun generasi yang berilmu, berkarakter, dan siap memberi manfaat bagi negeri.
              </>
            )}</p>
          </div>
          <div className="history-story-stats">
            <article className="history-story-stat">
              <svg className="history-story-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 2 2.1 6.1L20 10l-5.9 1.9L12 18l-2.1-6.1L4 10l5.9-1.9L12 2Z" />
              </svg>
              <span className="history-story-stat-label">{story.foundedLabel || 'DIDIRIKAN'}</span>
              <strong>{story.founded || '14 Mei 1985'}</strong>
            </article>
            <article className="history-story-stat">
              <svg className="history-story-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 6v6h5" />
              </svg>
              <span className="history-story-stat-label">{story.tenureLabel || 'MASA PENGABDIAN'}</span>
              <strong>{story.tenure || '38+ Tahun'}</strong>
            </article>
            <article className="history-story-stat">
              <svg className="history-story-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span className="history-story-stat-label">{story.accreditationLabel || 'STATUS MUTU'}</span>
              <strong>{story.accreditation || "Akreditasi 'A'"}</strong>
            </article>
          </div>
        </section>

        <section className="history-timeline">
          <div className="history-timeline-heading">
            <div>
              <h2>{story.milestonesTitle || 'Tonggak Sejarah Gemilang'}</h2>
            </div>
          </div>
          <div className="history-timeline-list">
            {visibleMilestones.map((milestone, index) => (
              <article className={`history-milestone ${index % 2 ? 'is-right' : 'is-left'}`} key={milestone.year}>
                <div className="history-milestone-main">
                  <span className="history-milestone-year">{milestone.year}</span>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.text}</p>
                </div>
                <div className="history-milestone-node" aria-hidden="true"><span /></div>
                <div className={`history-milestone-note ${index === visibleMilestones.length - 1 ? 'is-highlighted' : ''}`}>
                  <strong>{milestone.noteTitle}</strong>
                  <p>{milestone.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="history-emblem">
          <div className="history-section-heading">
            <h2>{story.emblemTitle || 'Anatomi Lambang & Panji Kehormatan'}</h2>
          </div>
          <div className="history-emblem-content">
            <div className="history-emblem-logo">
              <img src={story.logo || schoolLogo} alt="Lambang MTsN 1 Karanganyar" />
              <strong>{story.emblemLogoTitle || 'Insignia Kehormatan Lembaga'}</strong>
            </div>
            <div className="history-emblem-points">
              {visibleEmblemPoints.map(({ icon, title, text }) => (
                <article key={title}><span aria-hidden="true">{icon}</span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="history-leadership">
          <div className="history-section-heading history-leadership-heading">
            <div><h2>{story.leadersTitle || 'Kepala Madrasah Dari Masa ke Masa'}</h2></div>
          </div>
          <div className="history-leaders-carousel">
            <button
              className="history-leaders-arrow history-leaders-arrow-prev"
              type="button"
              aria-label="Tampilkan kepala madrasah sebelumnya"
              onClick={() => moveLeader(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div className="history-leaders-viewport">
              <div
                className="history-leaders"
                onTransitionEnd={handleLeaderTransitionEnd}
                style={{
                  '--leader-visible-count': leaderVisibleCount,
                  '--leader-offset': currentLeaderIndex,
                  '--leader-transition': leaderTransitionEnabled ? 'transform 650ms cubic-bezier(.2, .75, .2, 1)' : 'none',
                }}
              >
                {[...visibleLeaders, ...visibleLeaders, ...visibleLeaders, ...visibleLeaders, ...visibleLeaders].map(([years, name, image], index) => (
                  <article className="history-leader" key={`${name}-${index}`}>
                    <div className="history-leader-photo-frame">
                      <img className="history-leader-photo" src={image} alt={`Foto ${name}`} />
                    </div>
                    <div className="history-leader-content">
                      <h3>{name}</h3>
                      <p className="history-leader-years">{years}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <button
              className="history-leaders-arrow history-leaders-arrow-next"
              type="button"
              aria-label="Tampilkan kepala madrasah berikutnya"
              onClick={() => moveLeader(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  story: {
    title: 'Jejak Langkah & Sejarah Pendirian',
    description: 'Menelusuri perjalanan panjang MTsN 1 Karanganyar dalam mencerdaskan tunas bangsa, menanamkan integritas dan budi pekerti, serta mengukir prestasi gemilang. Bersama dedikasi para pendidik dan semangat seluruh warga madrasah, setiap langkah menjadi bagian dari ikhtiar membangun generasi yang berilmu, berkarakter, dan siap memberi manfaat bagi negeri.',
    founded: '14 Mei 1985',
    tenure: '38+ Tahun',
    accreditation: "Akreditasi 'A'",
    milestonesTitle: 'Tonggak Sejarah Gemilang',
    emblemTitle: 'Anatomi Lambang & Panji Kehormatan',
    emblemLogoTitle: 'Insignia Kehormatan Lembaga',
    leadersTitle: 'Kepala Madrasah Dari Masa ke Masa',
  },
  milestones,
  emblemPoints,
  leaders: leaders.map(([period, name, image], index) => ({
    period,
    name,
    image: index === 3 ? '' : image,
  })),
}

export default SejarahPage

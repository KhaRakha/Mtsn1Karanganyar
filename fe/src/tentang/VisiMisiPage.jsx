import { useEffect } from 'react'
import '../App.css'
import { SiteFooter, SiteHeader } from '../SiteChrome.jsx'
import SubpageHero from '../components/SubpageHero.jsx'
import { usePublishedPage } from '../api/pages.js'
import './VisiMisiPage.css'

const missions = [
  {
    number: '01',
    title: 'Akhlak dan Ketakwaan',
    category: 'Karakter',
    description: 'Membiasakan nilai keimanan, ibadah, dan perilaku terpuji dalam kehidupan madrasah.',
  },
  {
    number: '02',
    title: 'Pembelajaran Mendalam',
    category: 'Akademik',
    description: 'Menghadirkan proses belajar yang bermakna, aktif, dan mendorong pemahaman yang kuat.',
  },
  {
    number: '03',
    title: 'Keterampilan Abad Ini',
    category: 'Kompetensi',
    description: 'Mengembangkan kemampuan berpikir kritis, kreativitas, komunikasi, dan kolaborasi.',
  },
  {
    number: '04',
    title: 'Madrasah Aman dan Inklusif',
    category: 'Iklim Madrasah',
    description: 'Menumbuhkan lingkungan belajar yang aman, ramah, dan menghargai setiap warga madrasah.',
  },
  {
    number: '05',
    title: 'Gotong Royong',
    category: 'Komunitas',
    description: 'Memperkuat semangat kebersamaan melalui kerja sama siswa, guru, keluarga, dan masyarakat.',
  },
  {
    number: '06',
    title: 'Literasi Digital',
    category: 'Teknologi',
    description: 'Membekali siswa agar cakap, bijak, dan bertanggung jawab dalam memanfaatkan teknologi.',
  },
  {
    number: '07',
    title: 'Madrasah Hijau & Berkelanjutan',
    category: 'Lingkungan',
    description: 'Membangun kepedulian terhadap lingkungan melalui kebiasaan hidup bersih dan berkelanjutan.',
  },
  {
    number: '08',
    title: 'Adaptif Masa Depan',
    category: 'Inovasi',
    description: 'Menyiapkan generasi yang tangguh, terbuka pada perubahan, dan siap menghadapi tantangan.',
  },
]

function VisiMisiPage() {
  const page = usePublishedPage('visi-misi')
  const data = page?.data ?? {}
  const vision = data.vision ?? {}
  const missionHeading = data.missionHeading ?? {}
  const callout = data.callout ?? {}
  const visibleMissions = Array.isArray(data.missions) ? data.missions : missions

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${page?.title || 'Visi & Misi'} | MTs Negeri 1 Karanganyar`

    return () => {
      document.title = previousTitle
    }
  }, [page?.title])

  return (
    <div className="site-shell vision-page">
      <SiteHeader overlay />
      <main>
        <SubpageHero
          titleId="vision-page-title"
          title={page?.title || <>Visi &amp; Misi<br />MTsN 1 Karanganyar</>}
          breadcrumb={page?.title || 'Visi & Misi'}
          badge={page?.badge || 'PROFIL MADRASAH · ARAH PENDIDIKAN'}
          description={page?.description || 'Cita-cita madrasah dan ikhtiar bersama untuk membentuk generasi Qur’ani yang unggul.'}
        />

        <section className="vision-statement-section" id="visi-statement">
          <div className="vision-page-section-label"><span>01</span><span>{vision.label || 'VISI MADRASAH'}</span></div>
          <div className="vision-statement-card">
            <div className="vision-statement-symbol" aria-hidden="true">✳</div>
            <div>
              <span className="eyebrow">{vision.eyebrow || 'CITA-CITA KAMI'}</span>
              <h2>{vision.text || '“Terwujudnya Generasi Qur’ani yang Cerdas, Mandiri, Berprestasi, dan Berakhlak Karimah”'}</h2>
              <p>{vision.description || 'Menjadi generasi yang berakar pada nilai Al-Qur’an, siap belajar sepanjang hayat, dan membawa kebaikan bagi sesama.'}</p>
            </div>
            <span className="vision-statement-watermark" aria-hidden="true">VISI</span>
          </div>
        </section>

        <section className="mission-section" id="misi">
          <div className="mission-section-heading">
            <div>
              <div className="vision-page-section-label"><span>02</span><span>{missionHeading.label || 'MISI MADRASAH'}</span></div>
              <h2 style={{ whiteSpace: 'pre-line' }}>{missionHeading.title || <>Delapan langkah<br />menuju cita-cita.</>}</h2>
            </div>
            <p>{missionHeading.description || 'Nilai-nilai ini menjadi komitmen bersama dalam membangun pengalaman belajar yang utuh, bermakna, dan relevan dengan masa depan.'}</p>
          </div>
          <div className="mission-page-grid">
            {visibleMissions.map((mission) => (
              <article className="mission-page-card" key={mission.number}>
                <div className="mission-page-card-top"><span>{mission.number}</span><span aria-hidden="true">↗</span></div>
                <span className="mission-page-category">{mission.category}</span>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="vision-page-callout">
          <div><span className="eyebrow">{callout.eyebrow || 'BERSAMA MTsN 1 KARANGANYAR'}</span><h2>{callout.title || 'Mari tumbuh dan berkontribusi bersama.'}</h2></div>
          <a href={callout.link || '/#kontak'}>{callout.linkLabel || 'Hubungi madrasah'} <span aria-hidden="true">↗</span></a>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  vision: {
    label: 'VISI MADRASAH',
    eyebrow: 'CITA-CITA KAMI',
    text: '“Terwujudnya Generasi Qur’ani yang Cerdas, Mandiri, Berprestasi, dan Berakhlak Karimah”',
    description: 'Menjadi generasi yang berakar pada nilai Al-Qur’an, siap belajar sepanjang hayat, dan membawa kebaikan bagi sesama.',
  },
  missionHeading: {
    label: 'MISI MADRASAH',
    title: 'Delapan langkah\nmenuju cita-cita.',
    description: 'Nilai-nilai ini menjadi komitmen bersama dalam membangun pengalaman belajar yang utuh, bermakna, dan relevan dengan masa depan.',
  },
  missions,
  callout: {
    eyebrow: 'BERSAMA MTsN 1 KARANGANYAR',
    title: 'Mari tumbuh dan berkontribusi bersama.',
    linkLabel: 'Hubungi madrasah',
    link: '/#kontak',
  },
}

export default VisiMisiPage

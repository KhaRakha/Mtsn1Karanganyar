import { useEffect, useRef, useState } from 'react'
import principalPhoto from './assets/kepala sekolah.png'
import newsFrame from './assets/bingkai foto.png'
import { formatContentDate, usePublishedContent } from './api/content.js'
import { usePublishedPageWithStatus } from './api/pages.js'
import { SiteFooter, SiteHeader } from './SiteChrome.jsx'
import './App.css'

const photos = {
  school:
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85',
  science:
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85',
  students:
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85',
  classroom:
    'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=85',
  library:
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85',
  ceremony:
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85',
  study:
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=85',
}

const heroSlides = [
  {
    type: 'video',
    label: 'Video kegiatan pendidikan',
    image: photos.classroom,
    video:
      'https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4',
  },
  { type: 'photo', label: 'Lingkungan madrasah', image: photos.school },
  { type: 'photo', label: 'Kegiatan belajar siswa', image: photos.students },
  { type: 'photo', label: 'Praktikum sains', image: photos.science },
]

const programs = [
  {
    number: '01',
    title: 'Program Khusus (PK) Tahfidz',
    description:
      'Pembinaan hafalan Al-Qur’an yang disertai pendalaman ilmu Al-Qur’an secara terarah.',
    visuals: [
      { src: photos.ceremony, alt: 'Siswa mengikuti kegiatan upacara' },
      { src: photos.school, alt: 'Gedung dan lingkungan madrasah' },
      { src: photos.study, alt: 'Siswa belajar bersama' },
    ],
  },
  {
    number: '02',
    title: 'Program Khusus (PK) Fullday Sains',
    description:
      'Pembelajaran sehari penuh dengan pendalaman materi akademik dan sains secara intensif.',
    visuals: [
      { src: photos.classroom, alt: 'Suasana pembelajaran di kelas' },
      { src: photos.study, alt: 'Siswa berdiskusi dalam pembelajaran' },
      { src: photos.science, alt: 'Siswa melakukan praktikum sains' },
    ],
  },
  {
    number: '03',
    title: 'Bimbingan Olimpiade & Kompetisi Akademik',
    description:
      'Pembinaan intensif bagi siswa berbakat untuk meraih prestasi di ajang kompetisi sains dan olimpiade tingkat kabupaten hingga nasional.',
    visuals: [
      { src: photos.students, alt: 'Siswa beraktivitas bersama' },
      { src: photos.science, alt: 'Kegiatan praktik dan eksplorasi siswa' },
      { src: photos.ceremony, alt: 'Kegiatan siswa di lingkungan madrasah' },
    ],
  },
  {
    number: '04',
    title: 'Ekstrakurikuler & Pengembangan Karakter',
    description:
      'Wadah eksplorasi minat, bakat, dan kepemimpinan melalui kegiatan Pramuka, PMR, olahraga, hingga seni islami.',
    visuals: [
      { src: photos.study, alt: 'Siswa belajar dengan tertib' },
      { src: photos.classroom, alt: 'Kegiatan belajar di kelas' },
      { src: photos.students, alt: 'Siswa bekerja sama' },
    ],
  },
]

const values = [
  ['01', 'Akhlak dan Ketakwaan', 'Karakter'],
  ['02', 'Pembelajaran Mendalam', 'Akademik'],
  ['03', 'Keterampilan Abad Ini', 'Kompetensi'],
  ['04', 'Madrasah Aman dan Inklusif', 'Iklim Madrasah'],
  ['05', 'Gotong Royong', 'Komunitas & Sains'],
  ['06', 'Literasi Digital', 'Teknologi'],
  ['07', 'Madrasah Hijau & Berkelanjutan', 'Lingkungan'],
  ['08', 'Adaptif Masa Depan', 'Inovasi'],
]

const statistics = [
  { value: 1000, label: 'Murid Aktif' },
  { value: 88, label: 'Guru & Staff' },
  { value: 500, label: 'Prestasi' },
  { value: 15000, label: 'Alumni' },
]

const achievements = [
  ['Juara 3 Tingkat Provinsi', 'Juara 3 Pencak Silat, Kelas D Remaja', photos.ceremony],
  ['Kompetisi Sains Nasional', 'Juara 2 Lomba Tari Tradisional', photos.science],
  ['Festival Madrasah 2025', 'Juara Harapan 1 Hadrah & Rebana', photos.students],
  ['Olimpiade Robotik', 'Juara 1 Madrasah Robotic Competition', photos.classroom],
]

const fallbackFeaturedNews = {
  title: 'Siswa MTsN 1 Karanganyar Berhasil Raih Medali Emas pada Kompetisi Sains Madrasah Nasional',
  summary: 'Tim riset dan sains madrasah membuktikan dedikasi dan kerja nyata dengan menyabet medali emas bidang Fisika dalam ajang bergengsi tingkat nasional.',
  image: photos.science,
  dateTime: '2026-10-28',
}

const fallbackAchievementItems = achievements.map(([category, title, image]) => ({
  category,
  title,
  image,
  dateTime: '2026-10-24',
}))

const gallery = [
  { title: 'Kegiatan Belajar', category: 'Pembelajaran', image: photos.study },
  { title: 'Praktikum Sains', category: 'Pembelajaran', image: photos.science },
  { title: 'Upacara Bendera', category: 'Upacara & Karakter', image: photos.ceremony },
  { title: 'Kegiatan Keagamaan', category: 'Keagamaan', image: photos.students },
  { title: 'Ruang Literasi', category: 'Ekstrakurikuler', image: photos.library },
]

const galleryCategories = [
  'Pembelajaran',
  'Upacara & Karakter',
  'Keagamaan',
  'Ekstrakurikuler',
]

const homeSectionDefaults = {
  programs: {
    eyebrow: 'PILAR MUTU AKADEMIK',
    title: 'Program & Keunggulan Pendidikan',
  },
  vision: {
    eyebrow: 'VISI & MISI',
    title: 'Visi & Misi',
    description: 'Arah yang dituju MTsN 1 Karanganyar dan delapan langkah untuk mewujudkannya.',
    visionLabel: 'Visi',
    statement: '“Terwujudnya Generasi Qur’ani yang Cerdas, Mandiri, Berprestasi, dan Berakhlak Karimah”',
    missionLabel: 'Misi',
    linkLabel: 'Lihat visi & misi lengkap',
    linkUrl: '#akademik',
  },
  news: {
    eyebrow: 'KANAL INFORMASI',
    title: 'Berita & Prestasi',
    description: 'Kabar kegiatan terbaru serta torehan kebanggaan MTsN 1 Karanganyar dalam mengukir prestasi.',
    newsLabel: 'Berita',
    newsLinkLabel: 'Semua berita',
    newsLinkUrl: '/berita',
    achievementsLabel: 'Prestasi',
    achievementsLinkLabel: 'Semua prestasi',
    achievementsLinkUrl: '/prestasi',
  },
  gallery: {
    eyebrow: 'DOKUMENTASI VISUAL',
    title: 'Galeri Kegiatan Madrasah',
  },
  admission: {
    eyebrow: 'PENERIMAAN PESERTA DIDIK BARU',
  },
  contact: {
    eyebrow: 'HUBUNGI LEMBAGA',
    title: 'Kontak & Lokasi Madrasah',
    mapContextLabel: 'Beranda',
    mapTitle: 'MTsN 1 KARANGANYAR',
  },
}

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function App() {
  const { page: homepage, loading: homepageLoading } = usePublishedPageWithStatus('beranda')
  const pageData = homepage?.data ?? {}
  const activeHeroSlides = homepageLoading
    ? []
    : Array.isArray(pageData.heroSlides) && pageData.heroSlides.length
      ? pageData.heroSlides
      : heroSlides
  const hero = pageData.hero ?? {}
  const welcome = pageData.welcome ?? {}
  const activeStatistics = Array.isArray(pageData.statistics) && pageData.statistics.length ? pageData.statistics : statistics
  const activePrograms = Array.isArray(pageData.programs) && pageData.programs.length ? pageData.programs : programs
  const activeValues = Array.isArray(pageData.values) && pageData.values.length ? pageData.values : values
  const galleryItems = Array.isArray(pageData.gallery) && pageData.gallery.length ? pageData.gallery : gallery
  const admission = pageData.admission ?? {}
  const contact = pageData.contact ?? {}
  const fallbackNews = { ...fallbackFeaturedNews, ...(pageData.fallbackNews ?? {}) }
  const fallbackAchievements = Array.isArray(pageData.fallbackAchievements) && pageData.fallbackAchievements.length
    ? pageData.fallbackAchievements
    : fallbackAchievementItems
  const homeSections = Object.fromEntries(
    Object.entries(homeSectionDefaults).map(([key, defaults]) => [
      key,
      { ...defaults, ...(pageData.homeSections?.[key] ?? {}) },
    ]),
  )
  const publishedNews = usePublishedContent('berita')
  const publishedAchievements = usePublishedContent('prestasi')
  const [activeFilter, setActiveFilter] = useState('Semua Kegiatan')
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [activeProgramIndex, setActiveProgramIndex] = useState(0)
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [startedHeroVideo, setStartedHeroVideo] = useState('')
  const [heroPaused, setHeroPaused] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [statCounts, setStatCounts] = useState(() =>
    activeStatistics.map(({ value }) =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
        ? value
        : 0,
    ),
  )
  const [statsCounting, setStatsCounting] = useState(false)
  const [statsCounted, setStatsCounted] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !('IntersectionObserver' in window),
  )
  const statsRef = useRef(null)
  const featuredNews = publishedNews.find((item) => item.placement === 'utama')
  const homepageAchievements = publishedAchievements.length
    ? publishedAchievements.slice(0, 4).map((item, index) => ({
      category: 'Prestasi',
      title: item.title,
      image: item.image_url || [photos.ceremony, photos.science, photos.students, photos.classroom][index % 4],
      imagePosition: item.image_position || '50% 50%',
      dateTime: item.published_at,
      date: formatContentDate(item.published_at),
      key: `${item.id}-${index}`,
    }))
    : fallbackAchievements.map(({ category, title, image, dateTime }, index) => ({
      category,
      title,
      image,
      imagePosition: '50% 50%',
      dateTime,
      date: formatContentDate(dateTime),
      key: `${title}-${index}`,
    }))

  const filteredGallery = activeFilter === 'Semua Kegiatan'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeFilter)
  const visibleGallery = filteredGallery
  const galleryFilters = ['Semua Kegiatan', ...galleryCategories]
  const currentHeroSlide = activeHeroSlides.length
    ? activeHeroSlide % activeHeroSlides.length
    : 0
  const visibleProgramIndex = activeProgramIndex % activePrograms.length
  const gallerySlots =
    visibleGallery.length === 1 ? [2]
      : visibleGallery.length === 2 ? [1, 3]
        : visibleGallery.length === 3 ? [1, 2, 3]
          : visibleGallery.length === 4 ? [0, 1, 3, 4]
            : [0, 1, 2, 3, 4]
  const rotatingGallery = Array.from(
    { length: Math.min(visibleGallery.length, 5) },
    (_, index) => visibleGallery[(galleryIndex + index) % visibleGallery.length],
  )

  useEffect(() => {
    if (visibleGallery.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setGalleryIndex((current) => (current + 1) % visibleGallery.length)
    }, 2500)

    return () => window.clearInterval(timer)
  }, [activeFilter, visibleGallery.length])

  useEffect(() => {
    if (heroPaused || !activeHeroSlides.length) return undefined

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % activeHeroSlides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [heroPaused, activeHeroSlides.length])

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-scroll-reveal]')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    document.documentElement.classList.add('has-scroll-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )

    revealElements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('has-scroll-reveal')
    }
  }, [])

  useEffect(() => {
    const section = statsRef.current
    if (!section) return undefined

    const targets = activeStatistics.map(({ value }) => Number(value) || 0)
    setStatCounts(targets)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !('IntersectionObserver' in window)) return undefined

    let animationFrame = 0
    const duration = 2400
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        observer.disconnect()
        setStatsCounting(true)
        const startTime = performance.now()
        const animate = (now) => {
          const progress = Math.min((now - startTime) / duration, 1)
          const easedProgress = 1 - (1 - progress) ** 3
          setStatCounts(targets.map((target) => Math.round(target * easedProgress)))

          if (progress < 1) {
            animationFrame = window.requestAnimationFrame(animate)
          } else {
            setStatsCounting(false)
            setStatsCounted(true)
          }
        }

        animationFrame = window.requestAnimationFrame(animate)
      },
      { threshold: 0.35 },
    )

    observer.observe(section)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [activeStatistics])

  return (
    <div className="site-shell home-page">
      <SiteHeader isHome />

      <main>
        <section className="hero" id="beranda">
          <div className="hero-media" aria-hidden="true">
            {activeHeroSlides.map((slide, index) => {
              const isUploadedVideoPoster =
                slide.type === 'video' && slide.image?.startsWith('/static/uploads/content/')
              const showVideoPoster = isUploadedVideoPoster && startedHeroVideo !== slide.video

              return (
                <div
                  className={`hero-slide${currentHeroSlide === index ? ' is-active' : ''}`}
                  key={`${slide.label}-${index}`}
                  style={{
                    backgroundImage:
                      slide.type === 'video'
                        ? showVideoPoster
                          ? `url("${slide.image}")`
                          : 'none'
                        : `url("${slide.image}")`,
                  }}
                >
                  {slide.type === 'video' && currentHeroSlide === index && (
                    <video
                      key={slide.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={showVideoPoster ? slide.image : undefined}
                      onPlaying={() => setStartedHeroVideo(slide.video)}
                    >
                      <source src={slide.video} type="video/mp4" />
                    </video>
                  )}
                </div>
              )
            })}
          </div>
          <div className="hero-shade" />
          <div className="hero-content">
            <h1 style={{ whiteSpace: 'pre-line' }}>{hero.title || <>Membangun Generasi<br />Islami, Cerdas, dan<br />Berprestasi</>}</h1>
            <p>{hero.description || 'MTsN 1 Karanganyar hadir sebagai lembaga pendidikan Islam yang berkomitmen mencetak generasi berakhlak mulia, berilmu, dan siap menghadapi masa depan.'}</p>
          </div>
          <div className="hero-bottom">
            <div className="hero-controls" aria-label="Kontrol tampilan hero">
              <div className="hero-pagination">
                {activeHeroSlides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.label}
                    className={currentHeroSlide === index ? 'hero-dot is-active' : 'hero-dot'}
                    aria-label={`Tampilkan ${slide.label}`}
                    aria-pressed={activeHeroSlide === index}
                    onClick={() => setActiveHeroSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="welcome section-wrap" id="sambutan" data-scroll-reveal>
          <div className="principal-visual">
            <img className="principal-portrait" src={welcome.image || principalPhoto} alt={welcome.name || 'Kepala MTsN 1 Karanganyar'} />
          </div>
          <div className="welcome-copy">
            <h2>{welcome.title || <>Sambutan Kepala<br className="desktop-break" /> Madrasah</>}</h2>
            <h3>{welcome.name || 'Drs. Amirudin, M.Si.'}</h3>
            <strong className="greeting">{welcome.greeting || 'Assalamu’alaikum Warahmatullahi Wabarakatuh'}</strong>
            <p>{welcome.body || (
              <>
              Selamat datang di website resmi MTsN 1 Karanganyar. Sebagai salah
              satu madrasah unggulan, kami berkomitmen untuk menghadirkan
              ekosistem pendidikan yang memadukan kedalaman nilai-nilai
              keislaman, penguasaan sains dan teknologi, serta pembinaan akhlak
              mulia. Melalui sinergi guru berdedikasi, fasilitas modern, dan
              dukungan penuh orang tua, kami membimbing setiap santri untuk
              meraih prestasi terbaik dan siap menjawab tantangan masa depan.
              </>
            )}</p>
            <strong className="greeting closing">{welcome.closing || 'Wassalamu’alaikum Warahmatullahi Wabarakatuh'}</strong>
          </div>
        </section>

        <section
          className="stats"
          aria-label="Statistik madrasah"
          data-scroll-reveal
          data-counting={statsCounting || undefined}
          data-counted={statsCounted || undefined}
          ref={statsRef}
        >
          <div className="stats-inner">
            {activeStatistics.map(({ label }, index) => (
              <div key={label}>
                <strong>
                  <span className="stats-count">{statCounts[index]}</span>
                  <span className="stats-plus" aria-hidden="true">+</span>
                </strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="programs section-wrap" id="akademik" data-scroll-reveal>
          <div className="section-heading">
            <span className="eyebrow">{homeSections.programs.eyebrow}</span>
            <h2>{homeSections.programs.title}</h2>
          </div>
          <div className="program-layout">
            <div className="program-list">
              {activePrograms.map((program, index) => (
                <article
                  className={`program-item${activeProgramIndex === index ? ' is-active' : ''}`}
                  key={`${program.number}-${index}`}
                  onMouseEnter={() => setActiveProgramIndex(index)}
                  onFocus={() => setActiveProgramIndex(index)}
                >
                  <span className="program-number">{program.number}</span>
                  <div>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                  </div>
                  <a
                    href={
                      program.number === '01'
                        ? '/program-tahfidz'
                        : program.number === '02'
                          ? '/program-fullday-sains'
                          : program.number === '03'
                        ? '/prestasi'
                        : program.number === '04'
                          ? '/minat-dan-bakat'
                          : '#ppdb'
                    }
                    aria-label={`Pelajari ${program.title}`}
                  >
                    <Arrow />
                  </a>
                </article>
              ))}
            </div>
            <div className="program-photos" aria-label="Kegiatan siswa">
              {(activePrograms[visibleProgramIndex].visuals || []).map((visual, index) => (
                <img
                  className={`program-photo ${['photo-top', 'photo-middle', 'photo-bottom'][index]}`}
                  src={visual.src}
                  alt={visual.alt}
                  key={`${activePrograms[visibleProgramIndex].number}-${visual.alt}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="vision" id="visi" data-scroll-reveal>
          <div className="vision-inner">
            <div className="vision-top">
              <div>
                <span className="eyebrow eyebrow-yellow">{homeSections.vision.eyebrow}</span>
                <h2>{homeSections.vision.title}</h2>
                <p>{homeSections.vision.description}</p>
              </div>
              <div className="vision-statement">
                <span className="eyebrow eyebrow-yellow">{homeSections.vision.visionLabel}</span>
                <h3>{homeSections.vision.statement}</h3>
              </div>
            </div>
            <div className="mission-heading">
              <span className="eyebrow eyebrow-yellow">{homeSections.vision.missionLabel}</span>
              <a href={homeSections.vision.linkUrl}>{homeSections.vision.linkLabel} <Arrow /></a>
            </div>
            <div className="values-grid">
              {activeValues.map(([number, title, caption]) => (
                <div className="value-item" key={number}>
                  <span>{number}</span>
                  <div><strong>{title}</strong><small>{caption}</small></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="home-info-background">
        <section className="news section-wrap" id="berita" data-scroll-reveal>
          <div className="section-heading">
            <span className="eyebrow">{homeSections.news.eyebrow}</span>
            <h2>{homeSections.news.title}</h2>
            <p>{homeSections.news.description}</p>
          </div>
          <div className="news-layout">
            <article className="featured-news">
              <div className="subheading-row">
                <h3>{homeSections.news.newsLabel}</h3>
                <a href={homeSections.news.newsLinkUrl}>{homeSections.news.newsLinkLabel} <Arrow diagonal /></a>
              </div>
              <div className="featured-news-frame">
                <img
                  className="featured-news-photo"
                  src={featuredNews?.image_url || fallbackNews.image}
                  alt={featuredNews?.title || fallbackNews.title}
                  style={{ objectPosition: featuredNews?.image_position || '50% 50%' }}
                />
                <img className="featured-news-frame-art" src={newsFrame} alt="" aria-hidden="true" />
              </div>
              <time dateTime={featuredNews?.published_at ?? fallbackNews.dateTime}>
                {formatContentDate(featuredNews?.published_at ?? fallbackNews.dateTime)}
              </time>
              <h4>{featuredNews?.title ?? fallbackNews.title}</h4>
              <p>{featuredNews
                ? (featuredNews.summary || featuredNews.body)
                : fallbackNews.summary}</p>
            </article>
            <div className="achievement-list" id="prestasi">
              <div className="subheading-row">
                <h3>{homeSections.news.achievementsLabel}</h3>
                <a href={homeSections.news.achievementsLinkUrl}>{homeSections.news.achievementsLinkLabel} <Arrow diagonal /></a>
              </div>
              {homepageAchievements.map(({ category, title, image, imagePosition, dateTime, date, key }) => (
                <article className="achievement-item" key={key}>
                  <img src={image} alt="" style={{ objectPosition: imagePosition }} />
                  <div><time dateTime={dateTime}>{date}</time><h4>{title}</h4><span>{category}</span></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gallery section-wrap" id="galeri" data-scroll-reveal>
          <div className="section-heading centered">
            <span className="eyebrow">{homeSections.gallery.eyebrow}</span>
            <h2>{homeSections.gallery.title}</h2>
          </div>
          <div className="gallery-filters" role="group" aria-label="Filter galeri">
            {galleryFilters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={activeFilter === filter ? 'filter-button active' : 'filter-button'}
                onClick={() => {
                  setActiveFilter(filter)
                  setGalleryIndex(0)
                }}
                aria-pressed={activeFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="gallery-grid" role="region" aria-label="Galeri foto bergeser otomatis">
            {rotatingGallery.length
              ? rotatingGallery.map((item, index) => (
                  <figure className={`gallery-card gallery-slot-${gallerySlots[index]}`} key={`${item.title}-${index}`}>
                    <img src={item.image} alt={item.title} style={{ objectPosition: item.imagePosition || '50% 50%' }} />
                    <figcaption>{item.title}</figcaption>
                  </figure>
                ))
              : <p className="gallery-empty">Belum ada foto untuk kategori ini.</p>}
          </div>
        </section>

        <section className="admission-wrap" id="ppdb" data-scroll-reveal>
          <div className="admission-card">
            <div>
              <span className="eyebrow eyebrow-light">{homeSections.admission.eyebrow}</span>
              <h2>{admission.title || 'Siap Bergabung dengan Keluarga Besar MTsN 1 Karanganyar?'}</h2>
              <p>{admission.description || 'Informasi jalur, persyaratan, dan jadwal penerimaan murid baru tersedia melalui kantor madrasah. Silakan hubungi kami untuk mendapatkan panduan terbaru.'}</p>
            </div>
            <div className="admission-actions">
              <a className="button button-yellow" href={admission.url || 'https://pmb.mtsn1karanganyar.sch.id/'}>{admission.primaryLabel || 'Hubungi Panitia PMBM'} <Arrow /></a>
              <a className="button button-glass" href={admission.url || 'https://pmb.mtsn1karanganyar.sch.id/'}>{admission.secondaryLabel || 'Informasi & Brosur PMBM'}</a>
            </div>
          </div>
        </section>

        <section className="contact section-wrap" id="kontak" data-scroll-reveal>
          <div className="section-heading centered">
            <span className="eyebrow">{homeSections.contact.eyebrow}</span>
            <h2>{homeSections.contact.title}</h2>
          </div>
          <div className="contact-layout">
            <div className="contact-details">
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 10.2c0 5.1-8 11.3-8 11.3S4 15.3 4 10.2a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.6" />
                  </svg>
                </span>
                <div><strong>{contact.addressLabel || 'Alamat'}</strong><p>{contact.address || 'Jl. Solo - Purwodadi KM. 12, Desa Tuban, Kecamatan Gondangrejo, Kabupaten Karanganyar, Jawa Tengah 57773.'}</p></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M7.1 3.5h3l1.5 4.1-2.1 1.7a15.2 15.2 0 0 0 5.2 5.2l1.7-2.1 4.1 1.5v3a2 2 0 0 1-2.2 2A16.9 16.9 0 0 1 5.1 5.7a2 2 0 0 1 2-2.2Z" />
                  </svg>
                </span>
                <div><strong>{contact.phoneLabel || 'Telepon'}</strong><p>{contact.phone || '(0271) 495251 / (0271) 495124'}</p></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </span>
                <div><strong>{contact.emailLabel || 'Email'}</strong><p>{contact.email || 'mtsn1karanganyar@kemenag.go.id'}</p></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.3 2" />
                  </svg>
                </span>
                <div><strong>{contact.hoursLabel || 'Jam Pelayanan'}</strong><p style={{ whiteSpace: 'pre-line' }}>{contact.hours || 'Senin–Kamis: 07.00–15.30 WIB\nJumat: 07.00–14.30 WIB'}</p></div>
              </div>
            </div>
            <div className="map-panel">
              <div className="map-toolbar"><span>{homeSections.contact.mapContextLabel}</span><strong>{homeSections.contact.mapTitle}</strong><span>◉　⌕</span></div>
              <iframe
                title="Peta lokasi MTsN 1 Karanganyar"
                src={contact.mapUrl || 'https://maps.google.com/maps?q=MTs%20Negeri%201%20Karanganyar%2C%20Jl.%20Solo%20-%20Purwodadi%20KM.%2012%2C%20Desa%20Tuban%2C%20Gondangrejo%2C%20Kabupaten%20Karanganyar&t=&z=15&ie=UTF8&iwloc=&output=embed'}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="map-caption"><span>⌖</span> {contact.mapCaption || 'Jl. Solo - Purwodadi KM. 12, Desa Tuban, Gondangrejo'}</div>
            </div>
          </div>
        </section>
        </div>
      </main>

      <SiteFooter isHome />
    </div>
  )
}

// Kept alongside the page so the initial database snapshot can be regenerated from this content.
// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  heroSlides,
  hero: {
    title: 'Membangun Generasi\nIslami, Cerdas, dan\nBerprestasi',
    description: 'MTsN 1 Karanganyar hadir sebagai lembaga pendidikan Islam yang berkomitmen mencetak generasi berakhlak mulia, berilmu, dan siap menghadapi masa depan.',
  },
  welcome: {
    title: 'Sambutan Kepala Madrasah',
    name: 'Drs. Amirudin, M.Si.',
    image: '',
    greeting: 'Assalamu’alaikum Warahmatullahi Wabarakatuh',
    body: 'Selamat datang di website resmi MTsN 1 Karanganyar. Sebagai salah satu madrasah unggulan, kami berkomitmen untuk menghadirkan ekosistem pendidikan yang memadukan kedalaman nilai-nilai keislaman, penguasaan sains dan teknologi, serta pembinaan akhlak mulia. Melalui sinergi guru berdedikasi, fasilitas modern, dan dukungan penuh orang tua, kami membimbing setiap santri untuk meraih prestasi terbaik dan siap menjawab tantangan masa depan.',
    closing: 'Wassalamu’alaikum Warahmatullahi Wabarakatuh',
  },
  statistics,
  programs,
  values,
  fallbackNews: fallbackFeaturedNews,
  fallbackAchievements: fallbackAchievementItems,
  gallery,
  admission: {
    title: 'Siap Bergabung dengan Keluarga Besar MTsN 1 Karanganyar?',
    description: 'Informasi jalur, persyaratan, dan jadwal penerimaan murid baru tersedia melalui kantor madrasah. Silakan hubungi kami untuk mendapatkan panduan terbaru.',
    primaryLabel: 'Hubungi Panitia PMBM',
    secondaryLabel: 'Informasi & Brosur PMBM',
    url: 'https://pmb.mtsn1karanganyar.sch.id/',
  },
  contact: {
    addressLabel: 'Alamat',
    address: 'Jl. Solo - Purwodadi KM. 12, Desa Tuban, Kecamatan Gondangrejo, Kabupaten Karanganyar, Jawa Tengah 57773.',
    phoneLabel: 'Telepon',
    phone: '(0271) 495251 / (0271) 495124',
    emailLabel: 'Email',
    email: 'mtsn1karanganyar@kemenag.go.id',
    hoursLabel: 'Jam Pelayanan',
    hours: 'Senin–Kamis: 07.00–15.30 WIB\nJumat: 07.00–14.30 WIB',
    mapUrl: 'https://maps.google.com/maps?q=MTs%20Negeri%201%20Karanganyar%2C%20Jl.%20Solo%20-%20Purwodadi%20KM.%2012%2C%20Desa%20Tuban%2C%20Gondangrejo%2C%20Kabupaten%20Karanganyar&t=&z=15&ie=UTF8&iwloc=&output=embed',
    mapCaption: 'Jl. Solo - Purwodadi KM. 12, Desa Tuban, Gondangrejo',
  },
  homeSections: homeSectionDefaults,
}

export default App

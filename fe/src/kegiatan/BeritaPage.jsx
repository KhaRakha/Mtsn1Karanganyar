import { useEffect, useMemo, useRef, useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { formatContentDate, usePublishedContent } from '../api/content.js'
import './BeritaPage.css'

const featuredNews = {
  category: 'Sorotan Utama',
  date: '28 Oktober 2026',
  dateTime: '2026-10-28',
  title: 'Siswa MTsN 1 Karanganyar Raih Medali Emas Kompetisi Sains Madrasah Nasional',
  description:
    'Tim riset dan sains madrasah membuktikan dedikasi dan kerja nyata dengan menyabet medali emas bidang Fisika dalam ajang bergengsi tingkat nasional.',
  details: [
    'Tim riset MTsN 1 Karanganyar berhasil meraih medali emas bidang Fisika dalam Kompetisi Sains Madrasah Nasional. Capaian ini menjadi hasil dari ketekunan siswa dalam belajar dan berlatih.',
    'Madrasah mengapresiasi kerja keras siswa, guru pembimbing, dan seluruh pihak yang mendukung persiapan kompetisi.',
  ],
  image:
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=85',
  imageAlt: 'Siswa melakukan praktikum sains di laboratorium',
}

const newsItems = [
  {
    category: 'Prestasi Siswa',
    date: '14 Maret 2025',
    dateTime: '2025-03-14',
    title: 'Siswa MTsN 1 Karanganyar Raih Medali Emas Kompetisi Sains Madrasah',
    description:
      'Prestasi membanggakan kembali ditorehkan ananda Muhammad Rizky yang sukses menyabet medali emas.',
    details: [
      'Ananda Muhammad Rizky berhasil meraih medali emas dalam Kompetisi Sains Madrasah. Prestasi ini menjadi kebanggaan bagi keluarga besar MTsN 1 Karanganyar.',
      'Semoga pencapaian ini menginspirasi siswa lainnya untuk terus mengembangkan minat, kemampuan, dan semangat belajar.',
    ],
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Siswa mengikuti kegiatan dan meraih prestasi di madrasah',
  },
  {
    category: 'Kegiatan Siswa',
    date: '10 Maret 2025',
    dateTime: '2025-03-10',
    title: 'Peringatan Hari Santri dan Gelar Karya P5-PPRA Siswa Penuh Antusias',
    description:
      'Gelar karya Projek Penguatan Profil Pelajar Pancasila dan Rahmatan Lil Alamin menampilkan kreativitas siswa.',
    details: [
      'Siswa mengikuti peringatan Hari Santri sekaligus menampilkan karya dalam kegiatan P5-PPRA. Beragam karya menjadi ruang bagi siswa untuk menyampaikan ide dan kreativitas mereka.',
      'Kegiatan berlangsung dengan antusias dan mendorong siswa untuk belajar berkolaborasi serta menghargai keberagaman.',
    ],
    image:
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Siswa berkegiatan bersama dalam acara madrasah',
  },
  {
    category: 'Informasi PMBM',
    date: '05 Maret 2025',
    dateTime: '2025-03-05',
    title: 'Sosialisasi Penerimaan Murid Baru Madrasah (PMBM) Tahun 2025',
    description:
      'Panitia PMBM mengundang seluruh keluarga SD/MI se-Kabupaten Karanganyar untuk mengenal madrasah.',
    details: [
      'Sosialisasi PMBM memberikan kesempatan kepada keluarga calon peserta didik untuk mengenal MTsN 1 Karanganyar dan memperoleh informasi mengenai penerimaan murid baru.',
      'Informasi terbaru mengenai jalur dan persyaratan pendaftaran dapat dilihat melalui situs PMBM madrasah.',
    ],
    image:
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Suasana sosialisasi dan pembelajaran di dalam kelas',
  },
  {
    category: 'Pembelajaran',
    date: '27 Februari 2025',
    dateTime: '2025-02-27',
    title: 'Siswa Antusias Mengikuti Praktikum Sains di Laboratorium',
    description:
      'Kegiatan praktik membantu siswa memahami materi sains melalui pengamatan dan percobaan langsung.',
    details: [
      'Melalui praktikum di laboratorium, siswa mengamati dan mencoba langsung konsep sains yang dipelajari di kelas.',
      'Pembelajaran berbasis praktik membantu siswa membangun rasa ingin tahu dan memahami materi melalui pengalaman.',
    ],
    image:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Peralatan praktikum sains di laboratorium',
  },
  {
    category: 'Literasi Madrasah',
    date: '20 Februari 2025',
    dateTime: '2025-02-20',
    title: 'Gerakan Literasi Madrasah Ajak Siswa Gemar Membaca',
    description:
      'Siswa memanfaatkan ruang baca dan koleksi buku untuk menambah wawasan serta membangun kebiasaan membaca.',
    details: [
      'Gerakan literasi madrasah mengajak siswa menjadikan membaca sebagai bagian dari kegiatan sehari-hari.',
      'Ruang baca dan koleksi buku madrasah dimanfaatkan siswa untuk menemukan informasi serta memperluas wawasan.',
    ],
    image:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Rak buku di ruang perpustakaan',
  },
  {
    category: 'Kegiatan Madrasah',
    date: '12 Februari 2025',
    dateTime: '2025-02-12',
    title: 'Kebersamaan Siswa Warnai Kegiatan di Lingkungan Madrasah',
    description:
      'Beragam kegiatan bersama menjadi kesempatan bagi siswa untuk belajar bekerja sama dan saling mendukung.',
    details: [
      'Kegiatan bersama di lingkungan madrasah menjadi kesempatan bagi siswa untuk berinteraksi dan belajar dalam suasana yang positif.',
      'Melalui kebersamaan, siswa berlatih bekerja sama dan saling mendukung.',
    ],
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Siswa mengikuti kegiatan bersama di sekolah',
  },
  {
    category: 'Organisasi Siswa',
    date: '06 Februari 2025',
    dateTime: '2025-02-06',
    title: 'Siswa Mengikuti Pelatihan Kepemimpinan dan Kerja Sama',
    description:
      'Kegiatan organisasi melatih siswa untuk berkomunikasi, bekerja sama, dan bertanggung jawab.',
    details: [
      'Pelatihan kepemimpinan memberi kesempatan kepada siswa untuk berlatih menyampaikan gagasan dan bekerja dalam kelompok.',
      'Kegiatan ini juga menanamkan tanggung jawab dan keterampilan bekerja sama yang berguna dalam kehidupan sehari-hari.',
    ],
    image:
      'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Siswa berdiskusi dan bekerja sama dalam kegiatan kelompok',
  },
  {
    category: 'Lingkungan Madrasah',
    date: '30 Januari 2025',
    dateTime: '2025-01-30',
    title: 'Siswa dan Guru Bergotong Royong Menjaga Kebersihan Madrasah',
    description:
      'Warga madrasah bersama-sama merawat lingkungan sekolah agar tetap bersih, nyaman, dan asri.',
    details: [
      'Siswa dan guru bergotong royong membersihkan serta merawat lingkungan madrasah.',
      'Kebiasaan menjaga kebersihan bersama membantu menciptakan lingkungan belajar yang nyaman dan menumbuhkan kepedulian terhadap lingkungan.',
    ],
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Siswa bersama-sama merawat lingkungan sekolah',
  },
]

const newsPerPage = 6

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

function getArticleSlug(title) {
  return title
    .toLocaleLowerCase('id')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findArticleBySlug(slug) {
  return [featuredNews, ...newsItems].find((article) => getArticleSlug(article.title) === slug) ?? null
}

function getArticleUrl(article) {
  const articleUrl = new URL(window.location.href)
  articleUrl.searchParams.set('berita', getArticleSlug(article.title))
  return articleUrl
}

function BeritaPage() {
  const publishedContent = usePublishedContent('berita')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua kategori')
  const [sortOrder, setSortOrder] = useState('terbaru')
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedArticleOverride, setSelectedArticleOverride] = useState(() => {
    const slug = new URLSearchParams(window.location.search).get('berita')
    return slug ? findArticleBySlug(slug) : null
  })
  const closeButtonRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const managedArticles = useMemo(
    () => publishedContent.map((item) => ({
      category: item.placement === 'utama' ? 'Berita Utama' : 'Berita',
      placement: item.placement,
      date: formatContentDate(item.published_at),
      dateTime: item.published_at,
      title: item.title,
      description: item.summary || item.body,
      details: item.body.split(/\n{2,}/).filter(Boolean),
      image: item.image_url || featuredNews.image,
      imageAlt: item.title,
      imagePosition: item.image_position || '50% 50%',
    })),
    [publishedContent],
  )
  const selectedFeaturedArticle = managedArticles.find((item) => item.placement === 'utama')
  const currentFeaturedNews = selectedFeaturedArticle ?? featuredNews
  const currentNewsItems = [
    ...managedArticles.filter((item) => item !== selectedFeaturedArticle),
    ...(selectedFeaturedArticle ? [featuredNews] : []),
    ...newsItems,
  ]
  const articles = [currentFeaturedNews, ...currentNewsItems]
  const requestedArticleSlug = new URLSearchParams(window.location.search).get('berita')
  const selectedArticle = selectedArticleOverride
    ?? articles.find((item) => getArticleSlug(item.title) === requestedArticleSlug)
    ?? null
  const categories = [...new Set(articles.map((item) => item.category))]
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id')
  const matchesFeatured =
    (activeCategory === 'Semua kategori' || currentFeaturedNews.category === activeCategory) &&
    (!normalizedQuery ||
      `${currentFeaturedNews.title} ${currentFeaturedNews.description} ${currentFeaturedNews.category}`
        .toLocaleLowerCase('id')
        .includes(normalizedQuery))
  const filteredNews = currentNewsItems.filter((item) => {
    const matchesCategory = activeCategory === 'Semua kategori' || item.category === activeCategory
    const matchesQuery =
      !normalizedQuery ||
      `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase('id').includes(normalizedQuery)

    return matchesCategory && matchesQuery
  }).sort((first, second) => {
    const dateDifference = new Date(first.dateTime).getTime() - new Date(second.dateTime).getTime()
    return sortOrder === 'terbaru' ? -dateDifference : dateDifference
  })
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / newsPerPage))
  const visibleNews = filteredNews.slice((currentPage - 1) * newsPerPage, currentPage * newsPerPage)
  const resultCount = filteredNews.length + (matchesFeatured ? 1 : 0)
  const activeFiltersCount = Number(activeCategory !== 'Semua kategori') + Number(sortOrder !== 'terbaru')
  const paginationItems = getPaginationItems(currentPage, totalPages)

  const closeArticle = () => {
    const articleUrl = new URL(window.location.href)
    articleUrl.searchParams.delete('berita')
    window.history.replaceState(window.history.state, '', articleUrl)
    setSelectedArticleOverride(null)
  }

  useEffect(() => {
    if (!selectedArticle) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeArticle()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [selectedArticle])

  const openArticle = (article) => {
    previouslyFocusedRef.current = document.activeElement
    window.history.replaceState(window.history.state, '', getArticleUrl(article))
    setSelectedArticleOverride(article)
  }

  const shareUrl = selectedArticle ? getArticleUrl(selectedArticle).href : ''
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(selectedArticle?.title ?? '')
  const shareActions = selectedArticle ? [
    {
      label: 'Bagikan ke Facebook',
      className: 'news-share-facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <path d="M13.2 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.2V13h2.6v8h3.4Z" />,
    },
    {
      label: 'Bagikan ke Twitter',
      className: 'news-share-twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <path d="M22 5.9a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.7 1 4.2 4.2 0 0 0-7.2 3.8 11.9 11.9 0 0 1-8.6-4.4 4.2 4.2 0 0 0 1.3 5.6 4.1 4.1 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2.5 19a11.8 11.8 0 0 0 18.2-10 8.5 8.5 0 0 0 2-2.1Z" />,
    },
    {
      label: 'Bagikan ke WhatsApp',
      className: 'news-share-whatsapp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-5a8.2 8.2 0 1 1 16-3.3Z" /><path d="M8.2 7.7c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.5.7c-.2.2-.2.4 0 .6a8.5 8.5 0 0 0 2.1 2c.3.2.5.2.6 0l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.7-.5.5-1.2.7-1.9.5a11 11 0 0 1-4.2-2.2 10.1 10.1 0 0 1-2.8-3.5c-.6-1.2 0-2.1.4-2.5Z" /></>,
    },
    {
      label: 'Bagikan melalui email',
      className: 'news-share-email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A${encodedUrl}`,
      icon: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></>,
    },
    {
      label: 'Bagikan ke X',
      className: 'news-share-x',
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.7 5.6 22H2.4l7.3-8.4L1.9 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20Z" />,
    },
    {
      label: 'Cetak berita',
      className: 'news-share-print',
      onClick: () => window.print(),
      icon: <><path d="M6 8V3h12v5M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6zM18 11h.01" /></>,
    },
    {
      label: 'Bagikan ke Threads',
      className: 'news-share-threads',
      href: `https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`,
      icon: <text x="12" y="17" textAnchor="middle" className="news-share-threads-mark">@</text>,
    },
  ] : []

  return (
    <ContentSubpage
      title={<>Berita<br />Madrasah</>}
      breadcrumb="Berita"
      badge="KABAR DAN INFORMASI"
      description="Ikuti kabar kegiatan, pencapaian, dan informasi terbaru dari MTsN 1 Karanganyar."
    >
      <ContentSection
        title="Kilas Berita"
      >
        {matchesFeatured && (
          <article className="news-featured">
            <div className="news-featured-image">
              <img
                src={currentFeaturedNews.image}
                alt={currentFeaturedNews.imageAlt}
                style={{ objectPosition: currentFeaturedNews.imagePosition || '50% 50%' }}
              />
              <span className="news-category">{currentFeaturedNews.category}</span>
            </div>
            <div className="news-featured-content">
              <time dateTime={currentFeaturedNews.dateTime}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2.25" y="3.5" width="11.5" height="10" rx="1.5" />
                  <path d="M5 2v3M11 2v3M2.5 6.5h11" />
                </svg>
                {currentFeaturedNews.date}
              </time>
              <h3>{currentFeaturedNews.title}</h3>
              <p>{currentFeaturedNews.description}</p>
              <button className="news-read-more" type="button" onClick={() => openArticle(currentFeaturedNews)}>
                Baca Rincian <span aria-hidden="true">›</span>
              </button>
            </div>
          </article>
        )}

        <div className="news-controls">
          <div className="news-toolbar">
            <label className="news-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Cari judul, kutipan, atau kategori berita..."
                aria-label="Cari berita"
              />
            </label>
            <button
              className={`news-filter${filterOpen ? ' is-open' : ''}`}
              type="button"
              aria-expanded={filterOpen}
              aria-controls="news-filter-panel"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M7 12h10m-7 6h4" />
              </svg>
              <span>Filter</span>
              {activeFiltersCount > 0 && <span className="news-filter-count">{activeFiltersCount}</span>}
              <svg className="news-filter-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d={filterOpen ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
              </svg>
            </button>
            <span className="news-result-count" aria-live="polite">
              <strong>{resultCount}</strong> berita
            </span>
          </div>
          {filterOpen && (
            <div className="news-filter-panel" id="news-filter-panel">
              <div className="news-filter-group">
                <span className="news-filter-label">Kategori</span>
                <div className="news-filter-options" role="group" aria-label="Kategori berita">
                  <button
                    className={activeCategory === 'Semua kategori' ? 'is-selected' : ''}
                    type="button"
                    aria-pressed={activeCategory === 'Semua kategori'}
                    onClick={() => {
                      setActiveCategory('Semua kategori')
                      setCurrentPage(1)
                    }}
                  >
                    Semua
                  </button>
                  {categories.map((category) => (
                    <button
                      className={activeCategory === category ? 'is-selected' : ''}
                      type="button"
                      key={category}
                      aria-pressed={activeCategory === category}
                      onClick={() => {
                        setActiveCategory(category)
                        setCurrentPage(1)
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="news-filter-group news-sort-group">
                <span className="news-filter-label">Urutkan</span>
                <div className="news-filter-options" role="group" aria-label="Urutkan berita">
                  <button
                    className={sortOrder === 'terbaru' ? 'is-selected' : ''}
                    type="button"
                    aria-pressed={sortOrder === 'terbaru'}
                    onClick={() => {
                      setSortOrder('terbaru')
                      setCurrentPage(1)
                    }}
                  >
                    Terbaru
                  </button>
                  <button
                    className={sortOrder === 'terlama' ? 'is-selected' : ''}
                    type="button"
                    aria-pressed={sortOrder === 'terlama'}
                    onClick={() => {
                      setSortOrder('terlama')
                      setCurrentPage(1)
                    }}
                  >
                    Terlama
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="news-card-grid" aria-label="Berita lainnya">
          {visibleNews.map((item) => (
            <article className="news-card" key={item.category}>
              <div className="news-card-image">
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  loading="lazy"
                  style={{ objectPosition: item.imagePosition || '50% 50%' }}
                />
                <span className="news-category">{item.category}</span>
              </div>
              <div className="news-card-content">
                <time dateTime={item.dateTime}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="2.25" y="3.5" width="11.5" height="10" rx="1.5" />
                    <path d="M5 2v3M11 2v3M2.5 6.5h11" />
                  </svg>
                  {item.date}
                </time>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <button className="news-read-more" type="button" onClick={() => openArticle(item)}>
                  Baca Rincian <span aria-hidden="true">›</span>
                </button>
              </div>
            </article>
          ))}
          {visibleNews.length === 0 && !matchesFeatured && (
            <p className="news-empty-state" role="status">
              Berita tidak ditemukan. Coba kata kunci atau kategori lain.
            </p>
          )}
        </div>
        <nav className="news-pagination" aria-label="Navigasi halaman berita">
          <button
            className="news-pagination-arrow"
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            aria-label="Halaman berita sebelumnya"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="news-pagination-pages" aria-label={`Halaman ${currentPage} dari ${totalPages}`}>
            {paginationItems.map((item, index) => (
              typeof item === 'number' ? (
                <button
                  className={item === currentPage ? 'is-current' : ''}
                  type="button"
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  aria-label={`Halaman ${item}`}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              ) : (
                <span className="news-pagination-ellipsis" key={`${item}-${index}`} aria-hidden="true">…</span>
              )
            ))}
          </div>
          <button
            className="news-pagination-arrow"
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            aria-label="Halaman berita berikutnya"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      </ContentSection>
      {selectedArticle && (
        <div
          className="news-detail-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeArticle()
          }}
        >
          <section
            className="news-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-detail-title"
          >
            <button
              className="news-detail-close"
              type="button"
              onClick={closeArticle}
              aria-label="Tutup rincian berita"
              ref={closeButtonRef}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <img
              className="news-detail-image"
              src={selectedArticle.image}
              alt={selectedArticle.imageAlt}
              style={{ objectPosition: selectedArticle.imagePosition || '50% 50%' }}
            />
            <div className="news-detail-content">
              <span className="news-detail-category">{selectedArticle.category}</span>
              <time dateTime={selectedArticle.dateTime}>{selectedArticle.date}</time>
              <h2 id="news-detail-title">{selectedArticle.title}</h2>
              <p className="news-detail-summary">{selectedArticle.description}</p>
              {selectedArticle.details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="news-detail-share">
                <strong>Bagikan :</strong>
                <div className="news-share-actions">
                  {shareActions.map(({ label, className, href, onClick, icon }) => (
                    onClick ? (
                      <button
                        className={className}
                        type="button"
                        key={label}
                        onClick={onClick}
                        aria-label={label}
                        title={label}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                      </button>
                    ) : (
                      <a
                        className={className}
                        href={href}
                        key={label}
                        target={href.startsWith('mailto:') ? undefined : '_blank'}
                        rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                        aria-label={label}
                        title={label}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                      </a>
                    )
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </ContentSubpage>
  )
}

export default BeritaPage

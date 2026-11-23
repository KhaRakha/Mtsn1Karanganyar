import { useEffect, useState } from 'react'
import schoolLogo from './assets/logo.png'
import { usePublicNavigation } from './api/navigation.js'

const pmbmUrl = 'https://pmb.mtsn1karanganyar.sch.id/'

const navigation = [
  { label: 'Beranda', href: '/#beranda' },
  {
    label: 'Tentang',
    groups: [
      {
        title: 'Profil Sekolah',
        items: [
          ['Visi dan Misi', '/visi-misi'],
          ['Sejarah', '/sejarah'],
          ['Penghargaan Madrasah', '/penghargaan-madrasah'],
        ],
      },
      {
        title: 'Fasilitas',
        items: [
          ['Sarana dan Prasarana', '/sarana-prasarana'],
          ['Denah Sekolah', '/denah-sekolah'],
        ],
      },
      {
        title: 'Warga Sekolah',
        items: [
          ['Struktur Organisasi', '/struktur-organisasi'],
          ['Direktori Guru', '/direktori-guru'],
          ['Direktori Tendik', '/direktori-tendik'],
          ['Komite Madrasah', '/komite-madrasah'],
        ],
      },
      {
        title: 'Lainnya',
        items: [
          ['Tata Tertib', '/tata-tertib'],
          ['Kemitraan', '/kemitraan'],
          ['Testimoni Alumni', '/testimoni-alumni'],
        ],
      },
    ],
  },
  {
    label: 'Akademik',
    groups: [
      {
        title: 'Unggulan',
        items: [
          ['Program Khusus', '/program-khusus'],
          ['Prestasi', '/prestasi'],
          ['Minat dan Bakat', '/minat-dan-bakat'],
        ],
      },
      {
        title: 'Kegiatan Belajar',
        items: [
          ['Kalender Akademik', '/kalender-akademik'],
        ],
      },
    ],
  },
  {
    label: 'Kegiatan',
    items: [
      ['Berita', '/berita'],
      ['Artikel', '/artikel'],
      ['Galeri', '/galeri'],
    ],
  },
  { label: 'PMBM', href: pmbmUrl },
]

const socialLinks = [
  {
    className: 'social-instagram',
    href: 'https://www.instagram.com/mtsn_1karanganyar/',
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="17.5" cy="6.8" r="1.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    className: 'social-facebook',
    href: 'https://www.facebook.com/share/1EZz7kRMNw/',
    name: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />
      </svg>
    ),
  },
  {
    className: 'social-tiktok',
    href: 'https://www.tiktok.com/@mtsn1karanganyar?is_from_webapp=1&sender_device=pc',
    name: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 4v10.1a4.1 4.1 0 1 1-3.2-4V13a1.5 1.5 0 1 0 .8 1.3V4h2.4c.2 2 1.4 3.2 3.5 3.4v2.4A7.3 7.3 0 0 1 14 8.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    className: 'social-youtube',
    href: 'https://youtube.com/@mtsn1karanganyarchannel?si=CdXTWW9PFzEuzpsm',
    name: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 7.2a2.5 2.5 0 0 0-1.8-1.8C17.6 5 12 5 12 5s-5.6 0-7.2.4A2.5 2.5 0 0 0 3 7.2a26 26 0 0 0-.4 4.8 26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6.4 19 12 19 12 19s5.6 0 7.2-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-4.8 26 26 0 0 0-.4-4.8Z" fill="currentColor" />
        <path d="m10 15.5 5-3.5-5-3.5v7Z" fill="#FF0033" />
      </svg>
    ),
  },
]

const importantLinks = [
  ['Profil Madrasah', '/#sambutan'],
  ['Visi & Misi', '/visi-misi'],
  ['Kurikulum Akademik', '/#akademik'],
  ['Ekstrakurikuler & Prestasi', '/#galeri'],
  ['Penerimaan Peserta Didik Baru (PMBM)', pmbmUrl],
  ['Kebijakan Privasi', '/#kontak'],
]

const institutionLinks = [
  ['Kemenag RI', '/#kontak'],
  ['Ditjen Pendidikan Islam', '/#kontak'],
  ['Kemenag Kab. Karanganyar', '/#kontak'],
  ['BPS Kemenag Online', '/#kontak'],
  ['Simpatika Kemenag', '/#kontak'],
]

function localHref(href, isHome) {
  return isHome && href.startsWith('/#') ? href.slice(1) : href
}

function SiteHeader({ isHome = false, overlay = false }) {
  const publicGroups = usePublicNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState('')
  const [searchOpen, setSearchOpen] = useState(() =>
    Boolean(new URLSearchParams(window.location.search).get('q')?.trim()),
  )
  const [searchQuery, setSearchQuery] = useState(() =>
    new URLSearchParams(window.location.search).get('q') ?? '',
  )
  const [searchMessage, setSearchMessage] = useState('')
  const [headerScrolled, setHeaderScrolled] = useState(() => !(isHome || overlay) || window.scrollY > 24)

  useEffect(() => {
    if (!isHome && !overlay) return undefined

    const updateHeader = () => setHeaderScrolled(window.scrollY > 24)

    window.addEventListener('scroll', updateHeader, { passive: true })
    updateHeader()

    return () => window.removeEventListener('scroll', updateHeader)
  }, [isHome, overlay])

  useEffect(() => {
    if (!isHome) return undefined

    const query = new URLSearchParams(window.location.search).get('q')?.trim()
    if (!query) return undefined

    const normalizedQuery = query.toLocaleLowerCase('id')
    const timer = window.setTimeout(() => {
      const match = Array.from(document.querySelectorAll('main section[id]')).find((section) =>
        section.textContent.toLocaleLowerCase('id').includes(normalizedQuery),
      )

      if (match) {
        match.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        })
      } else {
        setSearchMessage('Informasi tidak ditemukan. Coba kata kunci lain.')
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isHome])

  const closeMenu = () => {
    setMenuOpen(false)
    setActiveDropdown('')
  }
  const visibleNavigation = publicGroups === null
    ? navigation
    : navigation.map((item) => {
      const menuKey = { Tentang: 'tentang', Akademik: 'akademik', Kegiatan: 'kegiatan' }[item.label]
      if (!menuKey) return item

      const groups = publicGroups
        .filter((group) => group.menu_key === menuKey)
        .map((group) => ({
          title: group.title,
          items: group.items.map(({ label, href }) => [label, href]),
        }))

      return item.label === 'Kegiatan'
        ? { ...item, items: groups.flatMap((group) => group.items) }
        : { ...item, groups }
    })

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchQuery.trim().toLocaleLowerCase('id')

    if (!query) {
      setSearchMessage('Masukkan kata kunci yang ingin dicari.')
      return
    }

    if (!isHome) {
      window.location.assign(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      return
    }

    const match = Array.from(document.querySelectorAll('main section[id]')).find((section) =>
      section.textContent.toLocaleLowerCase('id').includes(query),
    )

    if (!match) {
      setSearchMessage('Informasi tidak ditemukan. Coba kata kunci lain.')
      return
    }

    match.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    setSearchOpen(false)
    setSearchMessage('')
    setSearchQuery('')
    closeMenu()
  }

  return (
    <header className={`site-header${headerScrolled ? ' is-scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}>
      <a className="brand" href={isHome ? '#beranda' : '/#beranda'} aria-label="MTsN 1 Karanganyar, beranda">
        <img className="brand-logo" src={schoolLogo} alt="" />
        <span className="brand-copy">
          <strong>MTs Negeri 1</strong>
          <small>Karanganyar</small>
        </span>
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Navigasi utama">
        {visibleNavigation.map((item) => {
          if (item.href) {
            return (
              <a
                className={`nav-link${item.label === 'PMBM' ? ' nav-link-cta' : ''}`}
                key={item.label}
                href={localHref(item.href, isHome)}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            )
          }

          const isOpen = activeDropdown === item.label
          const links = item.items ?? item.groups.flatMap((group) => group.items)

          return (
            <div
              className={`nav-dropdown nav-dropdown-${item.label.toLocaleLowerCase('id')}${isOpen ? ' is-open' : ''}`}
              key={item.label}
              onMouseEnter={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setActiveDropdown(item.label)
                }
              }}
              onMouseLeave={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setActiveDropdown('')
                }
              }}
            >
              <button
                className="nav-trigger"
                type="button"
                aria-expanded={isOpen}
                onClick={() => setActiveDropdown(isOpen ? '' : item.label)}
              >
                {item.label}<span className="nav-chevron" aria-hidden="true" />
              </button>
              <div className="dropdown-panel">
                {item.groups ? (
                  item.groups.map((group) => (
                    <div className="dropdown-group" key={group.title}>
                      <h2>{group.title}</h2>
                      {group.items.map(([label, href]) => (
                        <a key={label} href={localHref(href, isHome)} onClick={closeMenu}>{label}</a>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-group dropdown-group-single">
                    {links.map(([label, href]) => (
                      <a key={label} href={localHref(href, isHome)} onClick={closeMenu}>{label}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div className={`header-search${searchOpen ? ' is-open' : ''}`}>
          <button
            className="header-search-toggle"
            type="button"
            aria-label={searchOpen ? 'Tutup pencarian' : 'Buka pencarian'}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen)
              setSearchMessage('')
              setActiveDropdown('')
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          {searchOpen && (
            <form className="header-search-panel" role="search" onSubmit={handleSearch}>
              <label htmlFor="site-search-input">Cari informasi sekolah</label>
              <div className="header-search-field">
                <input
                  autoFocus
                  id="site-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setSearchMessage('')
                  }}
                  placeholder="Contoh: ekstrakurikuler"
                />
                <button type="submit">Cari</button>
              </div>
              {searchMessage && <p className="header-search-message" role="status">{searchMessage}</p>}
            </form>
          )}
        </div>
      </nav>
    </header>
  )
}

function SiteFooter({ isHome = false }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about">
          <a className="footer-brand" href={isHome ? '#beranda' : '/#beranda'}>
            <img className="brand-logo" src={schoolLogo} alt="" /> MTsN 1 Karanganyar
          </a>
          <p>Madrasah Tsanawiyah Negeri 1 Karanganyar berkomitmen mewujudkan insan berakhlak mulia, berprestasi tinggi, mandiri, serta berwawasan lingkungan di bawah naungan Kementerian Agama Republik Indonesia.</p>
          <div className="footer-social">
            <span className="footer-social-label">Ikuti Media Sosial Kami</span>
            <div className="social-links" aria-label="Media sosial MTsN 1 Karanganyar">
              {socialLinks.map(({ className, href, name, icon, unavailable }) => (
                unavailable ? (
                  <span
                    className={`social-link ${className}`}
                    key={name}
                    aria-label={`${name} (tautan belum tersedia)`}
                    title={`Tautan ${name} belum tersedia`}
                  >
                    {icon}
                  </span>
                ) : (
                  <a
                    className={`social-link ${className}`}
                    href={href}
                    key={name}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${name} MTsN 1 Karanganyar`}
                    title={`${name} MTsN 1 Karanganyar`}
                  >
                    {icon}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
        <div className="footer-links">
          <h3>Tautan Penting</h3>
          {importantLinks.map(([label, href]) => (
            <a href={localHref(href, isHome)} key={label}>{label}</a>
          ))}
        </div>
        <div className="footer-links">
          <h3>Lembaga Terkait</h3>
          {institutionLinks.map(([label, href]) => (
            <a href={localHref(href, isHome)} key={label}>{label}</a>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copyright">© 2026 MTsN 1 Karanganyar <span aria-hidden="true">·</span> Seluruh Hak Cipta Dilindungi</span>
        <span className="footer-motto"><span className="footer-motto-dot" aria-hidden="true" /> Madrasah Mandiri Berprestasi <span aria-hidden="true">•</span> Menuju Madrasah Digital Maju</span>
      </div>
    </footer>
  )
}

export { SiteFooter, SiteHeader }

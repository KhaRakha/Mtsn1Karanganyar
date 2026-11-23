import { useEffect, useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import './GaleriPage.css'

const galleryItems = [
  { title: 'Upacara Bendera', category: 'Upacara & Karakter', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa mengikuti upacara bendera' },
  { title: 'Amanat Pembina Upacara', category: 'Upacara & Karakter', image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=85', alt: 'Pembina menyampaikan amanat upacara' },
  { title: 'Kegiatan Keagamaan', category: 'Keagamaan', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa mengikuti kegiatan keagamaan' },
  { title: 'Pembelajaran Taman', category: 'Ekstrakurikuler', image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa belajar di lingkungan taman' },
  { title: 'Lingkungan Hijau', category: 'Ekstrakurikuler', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=85', alt: 'Kegiatan peduli lingkungan madrasah' },
  { title: 'Gotong Royong', category: 'Upacara & Karakter', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa bekerja sama dalam kegiatan sekolah' },
  { title: 'Praktikum Sains', category: 'Pembelajaran', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa melakukan praktikum sains' },
  { title: 'Belajar di Perpustakaan', category: 'Pembelajaran', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa membaca di perpustakaan' },
  { title: 'Belajar Bersama', category: 'Pembelajaran', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1000&q=85', alt: 'Siswa belajar dan berdiskusi bersama' },
]

function GaleriPage() {
  const page = usePublishedPage('galeri')
  const data = page?.data ?? {}
  const [activeFilter, setActiveFilter] = useState('Semua Kegiatan')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const items = Array.isArray(data.items) ? data.items : galleryItems
  const categories = Array.isArray(data.categories) ? data.categories : ['Semua Kegiatan', 'Pembelajaran', 'Upacara & Karakter', 'Keagamaan', 'Ekstrakurikuler']
  const visibleItems = activeFilter === 'Semua Kegiatan'
    ? items
    : items.filter((item) => item.category === activeFilter)
  const galleryHeadline = data.galleryDescription || 'Potret Kegiatan & Kebersamaan'
  const headlineParts = galleryHeadline.endsWith('Pendirian')
    ? [galleryHeadline.slice(0, -9).trim(), 'Pendirian']
    : [galleryHeadline]

  useEffect(() => {
    if (selectedIndex === null) return undefined

    const closeOnKey = (event) => {
      if (event.key === 'Escape') setSelectedIndex(null)
      if (event.key === 'ArrowLeft') setSelectedIndex((index) => (index - 1 + visibleItems.length) % visibleItems.length)
      if (event.key === 'ArrowRight') setSelectedIndex((index) => (index + 1) % visibleItems.length)
    }

    document.addEventListener('keydown', closeOnKey)
    document.body.classList.add('galeri-modal-open')
    return () => {
      document.removeEventListener('keydown', closeOnKey)
      document.body.classList.remove('galeri-modal-open')
    }
  }, [selectedIndex, visibleItems.length])

  const selectedItem = selectedIndex === null ? null : visibleItems[selectedIndex]

  return (
    <ContentSubpage
      className="galeri-page"
      title={page?.title || <>Galeri<br />Kegiatan</>}
      breadcrumb={page?.title || 'Galeri'}
      badge={page?.badge || 'DOKUMENTASI KEGIATAN'}
      description={page?.description || 'Kumpulan momen kegiatan siswa dan madrasah.'}
    >
      <ContentSection
        title={data.galleryTitle || 'Momen Berharga MTsN 1 Karanganyar'}
      >
        <div className="galeri-moment-section">
          <p className="galeri-moment-description">
            <span>
              {headlineParts[0]}
              {headlineParts[1] && <><br /><b>{headlineParts[1]}</b></>}
            </span>
          </p>
          <div className="galeri-filter-list" role="group" aria-label="Filter kategori galeri">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeFilter === category ? 'galeri-filter active' : 'galeri-filter'}
                onClick={() => setActiveFilter(category)}
                aria-pressed={activeFilter === category}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="galeri-moment-grid">
            {visibleItems.map((item, index) => (
              <button
                type="button"
                className="galeri-moment-card"
                key={`${item.title}-${index}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Perbesar foto ${item.title || 'galeri'}`}
              >
                <img src={item.image} alt={item.alt || item.title} loading="lazy" />
                {item.title && (
                  <figcaption>
                    <span>{item.category}</span>
                    <strong>{item.title}</strong>
                  </figcaption>
                )}
              </button>
            ))}
          </div>
        </div>
      </ContentSection>

      {selectedItem && (
        <div className="galeri-lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau foto galeri" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedIndex(null)
        }}>
          <button type="button" className="galeri-lightbox-close" onClick={() => setSelectedIndex(null)} aria-label="Tutup pratinjau">×</button>
          {visibleItems.length > 1 && (
            <>
              <button type="button" className="galeri-lightbox-nav prev" onClick={() => setSelectedIndex((selectedIndex - 1 + visibleItems.length) % visibleItems.length)} aria-label="Foto sebelumnya">‹</button>
              <button type="button" className="galeri-lightbox-nav next" onClick={() => setSelectedIndex((selectedIndex + 1) % visibleItems.length)} aria-label="Foto berikutnya">›</button>
            </>
          )}
          <figure>
            <img src={selectedItem.image} alt={selectedItem.alt || selectedItem.title} />
            {(selectedItem.title || selectedItem.category) && (
              <figcaption>
                {selectedItem.category && <span>{selectedItem.category}</span>}
                {selectedItem.title && <strong>{selectedItem.title}</strong>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </ContentSubpage>
  )
}

export const pageDataDefaults = {
  galleryTitle: 'Momen Berharga MTsN 1 Karanganyar',
  galleryDescription: 'Potret Kegiatan & Kebersamaan',
  categories: ['Semua Kegiatan', 'Pembelajaran', 'Upacara & Karakter', 'Keagamaan', 'Ekstrakurikuler'],
  items: galleryItems,
}

export default GaleriPage

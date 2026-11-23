import { useEffect, useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPageWithStatus } from '../api/pages.js'
import { minatBakatPrograms, slugifyActivity } from './minatBakatData.js'
import './MinatBakatDetailPage.css'

function MinatBakatDetailPage({ activitySlug }) {
  const { page, loading } = usePublishedPageWithStatus('minat-dan-bakat')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const savedPrograms = Array.isArray(page?.data?.programs) ? page.data.programs : []
  const savedProgram = savedPrograms.find(
    (program) => (program.slug || slugifyActivity(program.name)) === activitySlug,
  )
  const defaultProgram = minatBakatPrograms.find((program) => program.slug === activitySlug)
  const program = savedProgram && defaultProgram
    ? {
      ...defaultProgram,
      ...savedProgram,
      details: savedProgram.details || defaultProgram.details,
      documentation: Array.isArray(savedProgram.documentation) && savedProgram.documentation.length
        ? savedProgram.documentation
        : defaultProgram.documentation,
    }
    : savedProgram || defaultProgram

  if (!program && loading) {
    return (
      <ContentSubpage
        className="minat-detail-page"
        title="Memuat dokumentasi"
        breadcrumb="Minat dan Bakat"
        badge="DOKUMENTASI KEGIATAN"
        description="Menyiapkan informasi kegiatan."
      >
        <ContentSection title="Memuat informasi kegiatan..." />
      </ContentSubpage>
    )
  }

  if (!program) {
    return (
      <ContentSubpage
        className="minat-detail-page"
        title="Kegiatan tidak ditemukan"
        breadcrumb="Kegiatan tidak ditemukan"
        breadcrumbParentLabel="Minat dan Bakat"
        breadcrumbParentHref="/minat-dan-bakat"
        badge="DOKUMENTASI KEGIATAN"
        description="Halaman kegiatan yang diminta tidak tersedia."
      />
    )
  }

  const documentation = Array.isArray(program.documentation) && program.documentation.length
    ? program.documentation
    : [{
      title: `Kegiatan ${program.name}`,
      description: program.description,
      image: program.image,
      alt: program.imageAlt || program.name,
    }]

  useEffect(() => {
    if (selectedIndex === null) return undefined

    const closeOnKey = (event) => {
      if (event.key === 'Escape') setSelectedIndex(null)
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((index) => (index - 1 + documentation.length) % documentation.length)
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((index) => (index + 1) % documentation.length)
      }
    }

    document.addEventListener('keydown', closeOnKey)
    document.body.classList.add('minat-detail-modal-open')
    return () => {
      document.removeEventListener('keydown', closeOnKey)
      document.body.classList.remove('minat-detail-modal-open')
    }
  }, [selectedIndex, documentation.length])

  const selectedItem = selectedIndex === null ? null : documentation[selectedIndex]

  return (
    <ContentSubpage
      className="minat-detail-page"
      title={program.name}
      breadcrumb={program.name}
      breadcrumbParentLabel="Minat dan Bakat"
      breadcrumbParentHref="/minat-dan-bakat"
      badge={program.category || 'DOKUMENTASI KEGIATAN'}
      description={program.description}
    >
      <ContentSection
        title={`Tentang ${program.name}`}
        description={program.details || program.description}
      />

      <ContentSection
        title={`Dokumentasi ${program.name}`}
      >
        <div className="minat-detail-gallery">
          {documentation.map((item, index) => (
            <button
              type="button"
              className="minat-detail-photo"
              key={`${item.image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Perbesar foto ${item.title || `Kegiatan ${program.name}`}`}
            >
              <img src={item.image} alt={item.alt || item.title || program.name} loading="lazy" />
              <span className="minat-detail-photo-caption">
                <strong>{item.title || `Kegiatan ${program.name}`}</strong>
                <span>{item.description || program.description}</span>
              </span>
            </button>
          ))}
        </div>
      </ContentSection>

      {selectedItem && (
        <div
          className="minat-detail-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau dokumentasi ${program.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null)
          }}
        >
          <button
            type="button"
            className="minat-detail-lightbox-close"
            onClick={() => setSelectedIndex(null)}
            aria-label="Tutup pratinjau"
          >
            ×
          </button>
          {documentation.length > 1 && (
            <>
              <button
                type="button"
                className="minat-detail-lightbox-nav prev"
                onClick={() => setSelectedIndex((selectedIndex - 1 + documentation.length) % documentation.length)}
                aria-label="Foto sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                className="minat-detail-lightbox-nav next"
                onClick={() => setSelectedIndex((selectedIndex + 1) % documentation.length)}
                aria-label="Foto berikutnya"
              >
                ›
              </button>
            </>
          )}
          <figure>
            <img src={selectedItem.image} alt={selectedItem.alt || selectedItem.title || program.name} />
            <figcaption>
              <strong>{selectedItem.title || `Kegiatan ${program.name}`}</strong>
              <span>{selectedItem.description || program.description}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </ContentSubpage>
  )
}

export default MinatBakatDetailPage

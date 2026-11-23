import { useEffect, useState } from 'react'
import ContentSubpage, { ContentSection, DataNotice } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import './PenghargaanMadrasahPage.css'

const FALLBACK_AWARDS = [
  {
    title: 'Penghargaan Akademik',
    image: '/demo-award-academic.svg',
    alt: 'Ilustrasi penghargaan akademik',
    description: 'Apresiasi di bidang akademik dan pengembangan prestasi siswa.',
  },
  {
    title: 'Apresiasi Madrasah',
    image: '/demo-award-madrasah.svg',
    alt: 'Ilustrasi apresiasi madrasah',
    description: 'Apresiasi atas upaya peningkatan mutu pendidikan di madrasah.',
  },
  {
    title: 'Penghargaan Lingkungan',
    image: '/demo-award-environment.svg',
    alt: 'Ilustrasi penghargaan lingkungan',
    description: 'Apresiasi di bidang kepedulian dan pengelolaan lingkungan madrasah.',
  },
]

function PenghargaanMadrasahPage() {
  const page = usePublishedPage('penghargaan-madrasah')
  const data = page?.data ?? {}
  const section = data.section ?? {}
  const [selectedIndex, setSelectedIndex] = useState(null)
  const publishedAwards = Array.isArray(data.awards)
    ? data.awards.filter(
      (item) => typeof item?.title === 'string'
        && item.title.trim()
        && typeof item?.image === 'string'
        && item.image.trim(),
    )
    : []
  const awards = publishedAwards.length ? publishedAwards : page ? [] : FALLBACK_AWARDS

  useEffect(() => {
    if (selectedIndex === null) return undefined

    const closeOnKey = (event) => {
      if (event.key === 'Escape') setSelectedIndex(null)
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((index) => (index - 1 + awards.length) % awards.length)
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((index) => (index + 1) % awards.length)
      }
    }

    document.addEventListener('keydown', closeOnKey)
    document.body.classList.add('penghargaan-modal-open')
    return () => {
      document.removeEventListener('keydown', closeOnKey)
      document.body.classList.remove('penghargaan-modal-open')
    }
  }, [selectedIndex, awards.length])

  const selectedAward = selectedIndex === null ? null : awards[selectedIndex]

  return (
    <ContentSubpage
      className="penghargaan-madrasah-page"
      title={page?.title || 'Penghargaan Madrasah'}
      breadcrumb={page?.title || 'Penghargaan Madrasah'}
      breadcrumbParentLabel="Profil Sekolah"
      breadcrumbParentHref="/#beranda"
      badge={page?.badge || 'APRESIASI DAN PENCAPAIAN'}
      description={page?.description || 'Dokumentasi apresiasi dan pencapaian MTsN 1 Karanganyar.'}
    >
      <ContentSection
        title={section.title || 'Apresiasi dan Penghargaan'}
        description={section.description}
      >
        {awards.length ? (
          <div className="penghargaan-madrasah-grid">
            {awards.map((award, index) => (
              <button
                type="button"
                className="penghargaan-madrasah-card"
                key={`${award.title}-${index}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Perbesar foto penghargaan ${award.title}`}
              >
                <img src={award.image} alt={award.alt || award.title} loading="lazy" />
                <span className="penghargaan-madrasah-card-caption">
                  <strong>{award.title}</strong>
                  {award.description && <span>{award.description}</span>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <DataNotice
            title="Data penghargaan sedang disiapkan"
            description="Belum ada dokumentasi penghargaan madrasah yang dipublikasikan."
          />
        )}
      </ContentSection>

      {selectedAward && (
        <div
          className="penghargaan-madrasah-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau penghargaan ${selectedAward.title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null)
          }}
        >
          <button
            type="button"
            className="penghargaan-madrasah-lightbox-close"
            onClick={() => setSelectedIndex(null)}
            aria-label="Tutup pratinjau"
          >
            ×
          </button>
          {awards.length > 1 && (
            <>
              <button
                type="button"
                className="penghargaan-madrasah-lightbox-nav prev"
                onClick={() => setSelectedIndex((selectedIndex - 1 + awards.length) % awards.length)}
                aria-label="Foto sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                className="penghargaan-madrasah-lightbox-nav next"
                onClick={() => setSelectedIndex((selectedIndex + 1) % awards.length)}
                aria-label="Foto berikutnya"
              >
                ›
              </button>
            </>
          )}
          <figure>
            <img src={selectedAward.image} alt={selectedAward.alt || selectedAward.title} />
            <figcaption>
              <strong>{selectedAward.title}</strong>
              {selectedAward.description && <p>{selectedAward.description}</p>}
            </figcaption>
          </figure>
        </div>
      )}
    </ContentSubpage>
  )
}

export default PenghargaanMadrasahPage

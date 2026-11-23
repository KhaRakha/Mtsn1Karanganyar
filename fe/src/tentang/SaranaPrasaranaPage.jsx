import { useEffect, useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import classroomPhoto from '../assets/facilities/facility-classroom.jpg'
import labPhoto from '../assets/facilities/facility-lab.jpg'
import libraryPhoto from '../assets/facilities/facility-library.jpg'
import uksPhoto from '../assets/facilities/facility-uks.jpg'
import fieldPhoto from '../assets/facilities/facility-field.jpg'
import hallPhoto from '../assets/facilities/facility-hall.jpg'

const facilities = [
  ['Laboratorium', 'Laboratorium IPA', 'Ruang praktik untuk kegiatan pengamatan, eksperimen, dan pembelajaran sains.', labPhoto, 'Mendukung praktikum IPA dengan ruang yang aman, tertata, dan mendukung pembelajaran berbasis eksperimen.'],
  ['Laboratorium', 'Laboratorium Komputer', 'Mendukung pembelajaran digital, teknologi informasi, dan asesmen berbasis komputer.', labPhoto, 'Digunakan untuk pembelajaran informatika, latihan keterampilan digital, dan kegiatan asesmen berbasis komputer.'],
  ['Sumber belajar', 'Perpustakaan', 'Ruang literasi dengan koleksi bacaan dan referensi untuk menunjang pembelajaran.', libraryPhoto, 'Menjadi ruang membaca, mencari referensi, dan mengembangkan budaya literasi siswa.'],
  ['Penunjang', 'Ruang UKS', 'Ruang layanan kesehatan dan pertolongan pertama bagi warga madrasah.', uksPhoto, 'Mendukung layanan kesehatan dasar, pertolongan pertama, dan pemantauan kesehatan siswa di lingkungan madrasah.'],
  ['Penunjang', 'Lapangan Kegiatan', 'Area terbuka untuk olahraga, upacara, dan kegiatan pengembangan diri siswa.', fieldPhoto, 'Dimanfaatkan untuk olahraga, upacara, kegiatan ekstrakurikuler, dan aktivitas bersama warga madrasah.'],
  ['Penunjang', 'Ruang Serbaguna', 'Ruang fleksibel untuk pertemuan, kegiatan siswa, dan acara madrasah.', hallPhoto, 'Ruang multifungsi untuk rapat, kegiatan organisasi siswa, pelatihan, dan agenda madrasah.'],
  ['Penunjang', 'Kelas Digital', 'Ruang belajar yang mendukung penggunaan media dan teknologi digital.', classroomPhoto, 'Mendukung pembelajaran interaktif melalui perangkat digital dan media pembelajaran multimedia.'],
]

const facilitySummary = [
  ['✦', '7', 'Total fasilitas', 'Fasilitas utama madrasah'],
  ['▣', '2', 'Laboratorium', 'Ruang praktik terpadu'],
  ['◌', '1', 'Sumber belajar', 'Perpustakaan madrasah'],
  ['▥', '4', 'Penunjang', 'Ruang dan area kegiatan'],
]

function SaranaPrasaranaPage() {
  const page = usePublishedPage('sarana-prasarana')
  const data = page?.data ?? {}
  const feature = data.feature ?? {}
  const highlights = Array.isArray(data.highlights) ? data.highlights : [
    'Lingkungan Nyaman & Asri',
    'Pembelajaran Modern Digital',
    'Standar Mutu & Proteksi',
  ]
  const facilityItems = Array.isArray(data.facilities)
    ? data.facilities.map((facility, index) => ({
      ...facility,
      image: facility.image || facilities[index]?.[3],
    }))
    : facilities.map(([category, title, description, image, detail]) => ({ category, title, description, image, detail }))
  const summaryItems = Array.isArray(data.summary) ? data.summary : facilitySummary.map(([icon, value, label, description]) => ({ icon, value, label, description }))
  const [selectedFacility, setSelectedFacility] = useState(null)

  useEffect(() => {
    if (!selectedFacility) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedFacility(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedFacility])

  return (
    <ContentSubpage
      title={page?.title || <>Sarana dan<br />Prasarana</>}
      breadcrumb={page?.title || 'Sarana dan Prasarana'}
      badge={page?.badge || 'FASILITAS MADRASAH'}
      description={page?.description || 'Kenali fasilitas dan lingkungan pendukung kegiatan belajar di MTsN 1 Karanganyar.'}
    >
      <ContentSection>
        <div className="facility-hero">
          <div className="facility-hero-main">
            <div className="facility-hero-copy">
              <div className="facility-hero-meta">
              </div>
              <h2>{feature.title || <>{feature.titlePrefix || 'Sarana & Prasarana Unggulan untuk'} <em>{feature.titleEmphasis || 'Masa Depan Gemilang'}</em></>}</h2>
              <p>{feature.description || 'MTsN 1 Karanganyar menyediakan ruang belajar terpadu, laboratorium modern, dan fasilitas ramah anak untuk mendukung optimalisasi prestasi akademik, eksplorasi riset, serta karakter generasi islami berkualitas.'}</p>
            </div>
          </div>
          <div className="facility-hero-highlights">
            <div className="facility-highlight-track">
              {[false, true].map((isDuplicate) => (
                <div className="facility-highlight-group" aria-hidden={isDuplicate || undefined} key={String(isDuplicate)}>
                  {highlights.map((item) => <div key={item}><strong>{item}</strong></div>)}
                </div>
              ))}
            </div>
          </div>
          <div className="facility-summary" aria-label="Ringkasan fasilitas madrasah">
            {summaryItems.map(({ icon, value, label }) => (
              <div className="facility-summary-item" key={label}>
                <span className="facility-summary-icon" aria-hidden="true">{icon}</span>
                <strong>{value}</strong>
                <span className="facility-summary-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </ContentSection>
      <ContentSection
        title="Jelajahi Fasilitas"
      >
        <div className="facility-list">
          {facilityItems.map(({ category, title, description, image, detail, photo }) => (
            <article className="facility-card" key={title}>
              <div className="facility-card-image">
                <img src={image || photo} alt={`Foto ${title}`} />
                <span>{category}</span>
              </div>
              <div className="facility-card-body">
                <h3>{title}</h3>
                <p>{description}</p>
                <button type="button" onClick={() => setSelectedFacility({ category, title, description, detail, photo: image || photo, building: facilityItems.find((item) => item.title === title)?.building, floor: facilityItems.find((item) => item.title === title)?.floor, area: facilityItems.find((item) => item.title === title)?.area, equipment: facilityItems.find((item) => item.title === title)?.equipment })}>
                  Lihat detail <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </ContentSection>
      {selectedFacility && (
        <div className="facility-modal-backdrop" role="presentation" onClick={() => setSelectedFacility(null)}>
          <section
            className="facility-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="facility-modal-close"
              type="button"
              aria-label="Tutup detail fasilitas"
              onClick={() => setSelectedFacility(null)}
            >
              ×
            </button>
            <div className="facility-modal-image">
              <img src={selectedFacility.photo} alt={`Foto ${selectedFacility.title}`} />
            </div>
            <div className="facility-modal-content">
              <h2 id="facility-modal-title">{selectedFacility.title}</h2>
              <div className="facility-modal-divider" />
              <div className="facility-detail-grid">
                <div><small>KODE</small><strong>FAS-0{facilities.findIndex((item) => item[1] === selectedFacility.title) + 1}</strong></div>
                <div><small>GEDUNG</small><strong>{selectedFacility.building || 'Gedung Madrasah'}</strong></div>
                <div><small>LANTAI</small><strong>{selectedFacility.floor || '1'}</strong></div>
                <div><small>AREA</small><strong>{selectedFacility.area || 'Ruang fasilitas'}</strong></div>
              </div>
              <h3>TENTANG FASILITAS</h3>
              <p>{selectedFacility.detail}</p>
              <h3>PERALATAN &amp; SARANA</h3>
              <p className="facility-modal-muted">{selectedFacility.equipment || 'Data peralatan dapat diperbarui sesuai inventaris resmi madrasah.'}</p>
            </div>
          </section>
        </div>
      )}
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  feature: {
    titlePrefix: 'Sarana & Prasarana Unggulan untuk',
    titleEmphasis: 'Masa Depan Gemilang',
    description: 'MTsN 1 Karanganyar menyediakan ruang belajar terpadu, laboratorium modern, dan fasilitas ramah anak untuk mendukung optimalisasi prestasi akademik, eksplorasi riset, serta karakter generasi islami berkualitas.',
  },
  highlights: ['Lingkungan Nyaman & Asri', 'Pembelajaran Modern Digital', 'Standar Mutu & Proteksi'],
  summary: facilitySummary.map(([icon, value, label, description]) => ({ icon, value, label, description })),
  facilities: facilities.map(([category, title, description, _image, detail]) => ({
    category,
    title,
    description,
    image: '',
    detail,
    building: 'Gedung Madrasah',
    floor: '1',
    area: 'Ruang fasilitas',
    equipment: 'Data peralatan dapat diperbarui sesuai inventaris resmi madrasah.',
  })),
}

export default SaranaPrasaranaPage

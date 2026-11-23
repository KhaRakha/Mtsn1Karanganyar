import ContentSubpage, { ContentSection, DataNotice, InfoCard } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'

const collaborationAreas = [
  ['01', 'Pembelajaran', 'Kolaborasi yang mendukung pengalaman belajar dan pengembangan kompetensi siswa.'],
  ['02', 'Pengembangan siswa', 'Kegiatan yang membuka ruang bagi minat, bakat, dan karakter peserta didik.'],
  ['03', 'Lingkungan dan masyarakat', 'Inisiatif bersama yang memberi manfaat bagi lingkungan madrasah dan masyarakat.'],
]

function KemitraanPage() {
  const page = usePublishedPage('kemitraan')
  const data = page?.data ?? {}
  const section = data.section ?? {}
  const areas = Array.isArray(data.areas) ? data.areas : collaborationAreas.map(([number, title, description]) => ({ number, title, description }))
  const notice = data.notice ?? {}

  return (
    <ContentSubpage
      title={page?.title || <>Kemitraan<br />Madrasah</>}
      breadcrumb={page?.title || 'Kemitraan'}
      badge={page?.badge || 'KOLABORASI PENDIDIKAN'}
      description={page?.description || 'Ruang kolaborasi untuk mendukung pendidikan dan memberi manfaat bagi warga madrasah.'}
    >
      <ContentSection
        number="01"
        label="RUANG KOLABORASI"
        title={section.title || 'Bertumbuh melalui kerja sama.'}
        description={section.description || 'Kemitraan dapat mendukung kegiatan pendidikan melalui kolaborasi yang selaras dengan tujuan dan kebutuhan madrasah.'}
      >
        <div className="content-info-grid">
          {areas.map(({ number, title, description }) => (
            <InfoCard key={number} number={number} title={title} description={description} />
          ))}
        </div>
      </ContentSection>
      <ContentSection number="02" label="MITRA MADRASAH" title={notice.title || 'Informasi mitra terverifikasi.'}>
        <DataNotice
          title={notice.noticeTitle || 'Daftar kemitraan akan diperbarui'}
          description={notice.description || 'Nama lembaga dan bentuk kerja sama hanya akan dicantumkan setelah dikonfirmasi oleh madrasah.'}
        />
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  section: {
    title: 'Bertumbuh melalui kerja sama.',
    description: 'Kemitraan dapat mendukung kegiatan pendidikan melalui kolaborasi yang selaras dengan tujuan dan kebutuhan madrasah.',
  },
  areas: collaborationAreas.map(([number, title, description]) => ({ number, title, description })),
  notice: {
    sectionTitle: 'Informasi mitra terverifikasi.',
    noticeTitle: 'Daftar kemitraan akan diperbarui',
    description: 'Nama lembaga dan bentuk kerja sama hanya akan dicantumkan setelah dikonfirmasi oleh madrasah.',
  },
}

export default KemitraanPage

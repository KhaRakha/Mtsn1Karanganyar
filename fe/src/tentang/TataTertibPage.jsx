import ContentSubpage, { ContentSection, DataNotice, InfoCard } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'

const principles = [
  ['01', 'Sikap saling menghormati', 'Menjaga tutur kata dan menghargai sesama warga madrasah dalam kegiatan sehari-hari.'],
  ['02', 'Tanggung jawab belajar', 'Mengikuti kegiatan pembelajaran dengan tertib dan menjalankan tanggung jawab sebagai pelajar.'],
  ['03', 'Kepedulian lingkungan', 'Ikut menjaga kebersihan, ketertiban, dan fasilitas yang digunakan bersama.'],
]

function TataTertibPage() {
  const page = usePublishedPage('tata-tertib')
  const data = page?.data ?? {}
  const section = data.section ?? {}
  const principlesList = Array.isArray(data.principles) ? data.principles : principles.map(([number, title, description]) => ({ number, title, description }))
  const notice = data.notice ?? {}

  return (
    <ContentSubpage
      title={page?.title || <>Tata Tertib<br />Madrasah</>}
      breadcrumb={page?.title || 'Tata Tertib'}
      badge={page?.badge || 'BUDAYA DAN KEDISIPLINAN'}
      description={page?.description || 'Panduan untuk membangun lingkungan belajar yang tertib, aman, dan saling menghargai.'}
    >
      <ContentSection
        number="01"
        label="BUDAYA MADRASAH"
        title={section.title || 'Tumbuh dalam sikap yang baik.'}
        description={section.description || 'Kebiasaan positif membantu seluruh warga madrasah belajar dan beraktivitas dengan nyaman.'}
      >
        <div className="content-info-grid">
          {principlesList.map(({ number, title, description }) => (
            <InfoCard key={number} number={number} title={title} description={description} />
          ))}
        </div>
      </ContentSection>
      <ContentSection number="02" label="PANDUAN RESMI" title={notice.sectionTitle || 'Rujuk ketentuan madrasah.'}>
        <DataNotice
          title={notice.title || 'Dokumen tata tertib resmi'}
          description={notice.description || 'Ringkasan di atas merupakan prinsip umum. Ketentuan lengkap, jadwal, dan konsekuensi tetap mengikuti dokumen tata tertib resmi yang berlaku di madrasah.'}
        />
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  section: {
    title: 'Tumbuh dalam sikap yang baik.',
    description: 'Kebiasaan positif membantu seluruh warga madrasah belajar dan beraktivitas dengan nyaman.',
  },
  principles: principles.map(([number, title, description]) => ({ number, title, description })),
  notice: {
    sectionTitle: 'Rujuk ketentuan madrasah.',
    title: 'Dokumen tata tertib resmi',
    description: 'Ringkasan di atas merupakan prinsip umum. Ketentuan lengkap, jadwal, dan konsekuensi tetap mengikuti dokumen tata tertib resmi yang berlaku di madrasah.',
  },
}

export default TataTertibPage

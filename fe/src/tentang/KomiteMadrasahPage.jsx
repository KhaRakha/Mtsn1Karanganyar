import ContentSubpage, { ContentSection, InfoCard } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import './KomiteMadrasahPage.css'

const committeeMembers = [
  ['01', 'Ketua Komite', 'Menguatkan kemitraan antara madrasah, keluarga, dan masyarakat.', '✦'],
  ['02', 'Wakil Ketua', 'Mendukung koordinasi program dan aspirasi orang tua peserta didik.', '◈'],
  ['03', 'Sekretaris', 'Mengelola administrasi, dokumentasi, dan komunikasi komite.', '▤'],
  ['04', 'Bendahara', 'Menjaga pengelolaan dukungan masyarakat secara tertib dan transparan.', '◉'],
]

const committeeRoles = [
  { number: '01', title: 'Memberi pertimbangan', description: 'Memberikan masukan terhadap kebijakan dan program pengembangan madrasah.' },
  { number: '02', title: 'Mendukung partisipasi', description: 'Mengajak orang tua dan masyarakat berkontribusi sesuai kemampuan dan kebutuhan.' },
  { number: '03', title: 'Menjaga transparansi', description: 'Mendorong pengelolaan dukungan pendidikan yang terbuka, bertanggung jawab, dan akuntabel.' },
]

function KomiteMadrasahPage() {
  const page = usePublishedPage('komite-madrasah')
  const data = page?.data ?? {}
  const sections = data.sections ?? {}
  const members = Array.isArray(data.members) ? data.members : committeeMembers.map(([number, title, description, icon]) => ({ number, title, description, icon }))
  const roles = Array.isArray(data.roles) ? data.roles : committeeRoles

  return (
    <ContentSubpage
      title={page?.title || <>Komite<br />Madrasah</>}
      breadcrumb={page?.title || 'Komite Madrasah'}
      badge={page?.badge || 'WARGA SEKOLAH'}
      description={page?.description || 'Komite Madrasah menjadi mitra strategis dalam mendukung peningkatan mutu layanan pendidikan dan membangun kolaborasi bersama seluruh warga madrasah.'}
    >
      <ContentSection
        number="01"
        label="MITRA MADRASAH"
        title={sections.introTitle || 'Bersama Membangun Madrasah'}
        description={sections.introDescription || 'Komite Madrasah hadir sebagai ruang kolaborasi antara orang tua, masyarakat, dan madrasah untuk mendukung pendidikan yang bermutu, terbuka, dan berkelanjutan.'}
      >
        <div className="komite-card-grid">
          {members.map(({ number, title, description, icon }) => (
            <InfoCard key={title} number={number} title={title} description={description} icon={icon} />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        number="02"
        label="PERAN UTAMA"
        title={sections.rolesTitle || 'Kolaborasi untuk Pendidikan'}
        description={sections.rolesDescription || 'Komite mendukung madrasah melalui partisipasi, pertimbangan, pengawasan, dan tindak lanjut aspirasi warga sekolah.'}
      >
        <div className="komite-role-list">
          {roles.map(({ number, title, description }) => (
            <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>
          ))}
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  sections: {
    introTitle: 'Bersama Membangun Madrasah',
    introDescription: 'Komite Madrasah hadir sebagai ruang kolaborasi antara orang tua, masyarakat, dan madrasah untuk mendukung pendidikan yang bermutu, terbuka, dan berkelanjutan.',
    rolesTitle: 'Kolaborasi untuk Pendidikan',
    rolesDescription: 'Komite mendukung madrasah melalui partisipasi, pertimbangan, pengawasan, dan tindak lanjut aspirasi warga sekolah.',
  },
  members: committeeMembers.map(([number, title, description, icon]) => ({ number, title, description, icon })),
  roles: committeeRoles,
}

export default KomiteMadrasahPage

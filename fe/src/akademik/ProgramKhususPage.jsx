import ContentSubpage, { ContentSection, InfoCard } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import './ProgramKhususPage.css'

const programPages = {
  tahfidz: {
    title: 'Program Khusus (PK) Tahfidz',
    description: 'Program yang berfokus pada hafalan dan pendalaman ilmu Al-Qur’an.',
    sectionTitle: 'Kegiatan dan Pembinaan Tahfidz',
    sectionDescription: 'Pembinaan dirancang untuk menemani siswa berinteraksi dengan Al-Qur’an secara terarah dan bertahap.',
    cards: [
      {
        title: 'Kegiatan Harian',
        description: 'Rutinitas belajar mencakup hafalan, pengulangan (murajaah), dan pendampingan dalam membaca Al-Qur’an.',
        icon: '◷',
      },
      {
        title: 'Target Hafalan',
        description: 'Capaian hafalan disusun bertahap dan disesuaikan dengan kemampuan siswa, dengan penguatan melalui murajaah.',
        icon: '⌁',
      },
      {
        title: 'Pembinaan Al-Qur’an',
        description: 'Siswa didampingi untuk memperbaiki bacaan dan memperdalam pemahaman terhadap Al-Qur’an.',
        icon: '✳',
      },
    ],
  },
  'fullday-sains': {
    title: 'Program Khusus (PK) Fullday Sains',
    description: 'Program sehari penuh dengan fokus pada pendalaman akademik dan sains secara intensif.',
    sectionTitle: 'Kegiatan Program Fullday Sains',
    sectionDescription: 'Kegiatan belajar memberi ruang untuk memahami materi akademik dan mengeksplorasi sains lebih mendalam.',
    cards: [
      {
        title: 'Kegiatan Belajar',
        description: 'Pembelajaran sehari penuh dengan waktu untuk mendalami materi akademik dan sains secara terarah.',
        icon: '◷',
      },
      {
        title: 'Penguatan Akademik',
        description: 'Latihan dan diskusi membantu siswa menguatkan pemahaman terhadap materi yang dipelajari.',
        icon: '⌁',
      },
      {
        title: 'Eksplorasi Sains',
        description: 'Pengamatan, percobaan, dan pemecahan masalah dapat menumbuhkan rasa ingin tahu serta cara berpikir ilmiah.',
        icon: '✳',
      },
    ],
  },
}

const programChoices = [
  {
    href: '/program-tahfidz',
    title: 'PK Tahfidz',
    description: 'Program yang berfokus pada hafalan dan pendalaman ilmu Al-Qur’an.',
  },
  {
    href: '/program-fullday-sains',
    title: 'PK Fullday Sains',
    description: 'Pembelajaran sehari penuh dengan fokus pada pendalaman akademik dan sains.',
  },
]

function ProgramKhususOverviewPage() {
  const page = usePublishedPage('program-khusus')

  return (
    <ContentSubpage
      className="program-khusus-page program-khusus-overview"
      title={page?.title ?? 'Program Khusus'}
      breadcrumb={page?.title ?? 'Program Khusus'}
      breadcrumbParentLabel="Program & Keunggulan"
      breadcrumbParentHref="/#akademik"
      badge={page?.badge || 'PROGRAM UNGGULAN'}
      description={page?.description || 'Kenali pilihan program khusus yang mendukung pengembangan kemampuan dan potensi siswa.'}
    >
      <ContentSection
        title="Pilih Program Khusus"
      >
        <div className="content-info-grid">
          {programChoices.map((program, index) => (
            <a
              className="program-khusus-choice"
              href={program.href}
              key={program.href}
              aria-label={`Lihat detail ${program.title}`}
            >
              <InfoCard
                number={String(index + 1).padStart(2, '0')}
                title={program.title}
                description={program.description}
                icon="↗"
              />
            </a>
          ))}
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

function ProgramKhususPage({ programSlug }) {
  const program = programPages[programSlug]

  if (!program) return null

  return (
    <ContentSubpage
      className="program-khusus-page"
      title={program.title}
      breadcrumb={program.title}
      breadcrumbParentLabel="Program Khusus"
      breadcrumbParentHref="/program-khusus"
      badge="PROGRAM AKADEMIK"
      description={program.description}
    >
      <ContentSection
        title={program.sectionTitle}
        description={program.sectionDescription}
      >
        <div className="content-info-grid">
          {program.cards.map((card, index) => (
            <InfoCard
              key={card.title}
              number={String(index + 1).padStart(2, '0')}
              title={card.title}
              description={card.description}
              icon={card.icon}
            />
          ))}
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

export { ProgramKhususOverviewPage }
export default ProgramKhususPage

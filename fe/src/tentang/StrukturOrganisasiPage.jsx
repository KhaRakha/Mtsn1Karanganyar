import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'

function StrukturOrganisasiPage() {
  const page = usePublishedPage('struktur-organisasi')
  const chart = page?.data?.chart ?? {}
  const contact = page?.data?.contact ?? {}
  const vicePrincipals = Array.isArray(chart.vicePrincipals) ? chart.vicePrincipals : [
    { name: 'Nama Wakamad', role: 'Kurikulum' },
    { name: 'Nama Wakamad', role: 'Kesiswaan' },
    { name: 'Nama Wakamad', role: 'Sarana Prasarana' },
    { name: 'Nama Wakamad', role: 'Humas' },
  ]

  return (
    <ContentSubpage
      title={page?.title || <>Struktur<br />Organisasi</>}
      breadcrumb={page?.title || 'Struktur Organisasi'}
      badge={page?.badge || 'TATA KELOLA MADRASAH'}
      description={page?.description || 'Kenali susunan peran dan tanggung jawab dalam mendukung penyelenggaraan pendidikan.'}
    >
      <ContentSection
        title={chart.sectionTitle || 'Pilar Kepengurusan'}
      >
        <div className="org-chart-board">
          <svg
            className="org-chart"
            viewBox="0 0 1365 750"
            role="img"
            aria-labelledby="org-chart-title org-chart-description"
          >
            <title id="org-chart-title">Struktur organisasi sekolah</title>
            <desc id="org-chart-description">
              Bagan struktur organisasi madrasah dari kepala madrasah hingga siswa.
            </desc>
            <defs>
              <linearGradient id="org-card-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.72" stopColor="#eff9e9" />
                <stop offset="1" stopColor="#d7efcc" />
              </linearGradient>
            </defs>
            <g className="org-chart-lines" fill="none">
              <path d="M522 46V132M112 354V448M451 354V448M796 354V448M1136 354V448" />
              <path d="M683 148V173M297 173H1067M297 173V198M1067 173V198" />
              <path d="M683 173V307M164 307H1200M164 307V334M511 307V334M854 307V334M1200 307V334" />
              <path d="M683 307V506M346 506H1015M346 506V537M1015 506V537M683 506V655" />
            </g>
            <g className="org-chart-boxes">
              <rect x="393" y="26" width="579" height="122" rx="22" />
              <rect x="105" y="198" width="428" height="79" rx="19" />
              <rect x="832" y="198" width="428" height="79" rx="19" />
              <rect x="7" y="334" width="305" height="134" rx="20" />
              <rect x="346" y="334" width="305" height="134" rx="20" />
              <rect x="714" y="334" width="305" height="134" rx="20" />
              <rect x="1054" y="334" width="305" height="134" rx="20" />
              <rect x="157" y="537" width="391" height="76" rx="20" />
              <rect x="805" y="537" width="405" height="76" rx="20" />
              <rect x="367" y="655" width="632" height="80" rx="20" />
            </g>
            <g className="org-chart-profiles">
              <circle cx="458" cy="87" r="44" />
              <circle cx="59" cy="401" r="37" />
              <circle cx="398" cy="401" r="37" />
              <circle cx="766" cy="401" r="37" />
              <circle cx="1106" cy="401" r="37" />
            </g>
            <g className="org-chart-labels">
              <text x="542" y="79">{chart.headmaster || 'Nama Kepala Madrasah'}</text>
              <text className="org-chart-pill-text" x="735" y="117" textAnchor="middle">{chart.headmasterRole || 'Kepala Madrasah'}</text>
              <text x="319" y="247" textAnchor="middle">{chart.committee || 'Komite Madrasah'}</text>
              <text x="1046" y="247" textAnchor="middle">{chart.administration || 'Kepala Urusan Tata Usaha'}</text>
              {vicePrincipals.slice(0, 4).map((person, index) => {
                const coordinates = [[120, 378], [459, 378], [827, 378], [1167, 378]][index]
                return <g key={`${person.name}-${person.role}`}><text className="org-chart-wakamad-title" x={coordinates[0]} y={coordinates[1]}>{person.name}</text><text className="org-chart-wakamad-title" x={coordinates[0]} y={coordinates[1] + 26}>{person.role}</text></g>
              })}
              {vicePrincipals.slice(0, 4).map((person, index) => {
                const coordinates = [[200, 448], [539, 448], [907, 448], [1225, 448]][index]
                return <text key={`${person.role}-role`} className={`org-chart-pill-text${index === 2 ? ' org-chart-pill-text-long' : ''}`} x={coordinates[0]} y={coordinates[1]} textAnchor="middle">Wakamad {person.role}</text>
              })}
              <text x="352" y="584" textAnchor="middle">{chart.teachers || 'Guru'}</text>
              <text x="1008" y="584" textAnchor="middle">{chart.staff || 'Tenaga Kependidikan (Tendik)'}</text>
              <text x="683" y="706" textAnchor="middle">{chart.students || 'Siswa'}</text>
            </g>
          </svg>
        </div>
      </ContentSection>
      <section className="org-contact-banner" aria-labelledby="org-contact-title">
        <div className="org-contact-copy">
          <span className="org-contact-eyebrow">{contact.eyebrow || 'LAYANAN INFORMASI MADRASAH'}</span>
          <h2 id="org-contact-title">{contact.title || 'Butuh informasi lebih lanjut?'}</h2>
          <p>
            {contact.description || 'Hubungi tim tata usaha untuk mendapatkan informasi resmi mengenai layanan, program, dan kegiatan madrasah.'}
          </p>
        </div>
        <div className="org-contact-actions">
          <a className="org-contact-primary" href={contact.primaryLink || '#kontak'}>{contact.primaryLabel || 'Hubungi Tata Usaha'} <span aria-hidden="true">→</span></a>
          <a className="org-contact-secondary" href={contact.secondaryLink || '#informasi'}>{contact.secondaryLabel || 'Lihat Informasi Madrasah'}</a>
        </div>
      </section>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  chart: {
    sectionTitle: 'Pilar Kepengurusan',
    headmaster: 'Nama Kepala Madrasah',
    headmasterRole: 'Kepala Madrasah',
    committee: 'Komite Madrasah',
    administration: 'Kepala Urusan Tata Usaha',
    vicePrincipals: [
      { name: 'Nama Wakamad', role: 'Kurikulum' },
      { name: 'Nama Wakamad', role: 'Kesiswaan' },
      { name: 'Nama Wakamad', role: 'Sarana Prasarana' },
      { name: 'Nama Wakamad', role: 'Humas' },
    ],
    teachers: 'Guru',
    staff: 'Tenaga Kependidikan (Tendik)',
    students: 'Siswa',
  },
  contact: {
    eyebrow: 'LAYANAN INFORMASI MADRASAH',
    title: 'Butuh informasi lebih lanjut?',
    description: 'Hubungi tim tata usaha untuk mendapatkan informasi resmi mengenai layanan, program, dan kegiatan madrasah.',
    primaryLabel: 'Hubungi Tata Usaha',
    primaryLink: '#kontak',
    secondaryLabel: 'Lihat Informasi Madrasah',
    secondaryLink: '#informasi',
  },
}

export default StrukturOrganisasiPage

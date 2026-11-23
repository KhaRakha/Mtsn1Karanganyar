import { useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import { minatBakatPrograms, slugifyActivity } from './minatBakatData.js'
import './MinatBakatPage.css'

const faqItems = [
  {
    question: 'Bagaimana cara memilih kegiatan yang sesuai minat dan bakat?',
    answer: 'Mulailah dari kegiatan yang paling kamu sukai. Pelajari setiap program, lalu diskusikan pilihanmu dengan pembina atau wali kelas agar sesuai dengan minat, kemampuan, dan jadwalmu.',
  },
  {
    question: 'Bagaimana cara mengetahui jadwal kegiatan?',
    answer: 'Jadwal dan lokasi kegiatan dapat berubah. Tanyakan langsung kepada pembina kegiatan atau pantau pengumuman resmi madrasah.',
  },
  {
    question: 'Bolehkah mengikuti lebih dari satu kegiatan?',
    answer: 'Ketentuannya bergantung pada jadwal dan aturan tiap program. Pastikan kegiatan yang dipilih tidak berbenturan, lalu konfirmasikan kepada pembina.',
  },
  {
    question: 'Apa manfaat mengikuti kegiatan minat dan bakat?',
    answer: 'Kegiatan memberi kesempatan untuk berlatih, bekerja sama, membangun disiplin, dan mengembangkan potensi di luar pembelajaran kelas.',
  },
  {
    question: 'Apa yang perlu dipersiapkan sebelum ikut kegiatan?',
    answer: 'Cari tahu perlengkapan, persyaratan, jadwal, dan cara bergabung langsung dari pembina kegiatan yang kamu pilih.',
  },
]

function MinatBakatPage() {
  const page = usePublishedPage('minat-dan-bakat')
  const data = page?.data ?? {}
  const programItems = Array.isArray(data.programs) && data.programs.length
    ? data.programs
    : minatBakatPrograms
  const faqs = Array.isArray(data.faqs) ? data.faqs : faqItems
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  return (
    <ContentSubpage
      className="ekstrakurikuler-page"
      title={page?.title || <>Minat dan<br />Bakat</>}
      breadcrumb={page?.title || 'Minat dan Bakat'}
      badge={page?.badge || 'RUANG UNTUK BERTUMBUH'}
      description={page?.description || 'Pilih kegiatan yang kamu sukai, kembangkan kemampuan, dan raih pengalaman baru bersama teman-teman di madrasah.'}
    >
      <ContentSection
        title={data.programsTitle || 'Beragam Kegiatan'}
      >
        <div className="ekskul-program-grid">
        {programItems.map((program, index) => (
            <a
              className="ekskul-program-card"
              href={`/minat-dan-bakat/${program.slug || slugifyActivity(program.name)}`}
              aria-label={`Lihat dokumentasi kegiatan ${program.name}`}
              key={program.name}
            >
              <div className="ekskul-program-image">
                <img src={program.image} alt={program.imageAlt} loading="lazy" />
                <span className="ekskul-program-category">{program.category}</span>
                {program.required && <span className="ekskul-required-badge">Wajib</span>}
              </div>
              <div className="ekskul-program-content">
                <span className="ekskul-program-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{program.name}</h3>
                <p>{program.description}</p>
                <span className="ekskul-program-open">
                  <span>Kenali lebih dekat</span>
                  <span className="ekskul-program-open-icon" aria-hidden="true">↗</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </ContentSection>

      <ContentSection>
        <div className="ekskul-faq-layout">
          <div className="ekskul-faq-intro">
            <span className="ekskul-faq-label">{data.faqLabel || 'INFORMASI MINAT DAN BAKAT'}</span>
            <h2>{data.faqTitle || 'FAQ & Panduan Minat dan Bakat'}</h2>
            <p>{data.faqDescription || 'Temukan jawaban seputar pilihan kegiatan, jadwal, dan cara mengembangkan potensi bersama teman-teman di madrasah.'}</p>
          </div>
          <div className="ekskul-faq-list">
            {faqs.map((faq, index) => (
              <article className={`ekskul-faq-item${openFaqIndex === index ? ' is-open' : ''}`} key={faq.question}>
                <button
                  type="button"
                  className="ekskul-faq-question"
                  aria-expanded={openFaqIndex === index}
                  aria-controls={`minat-faq-panel-${index}`}
                  onClick={() => setOpenFaqIndex((currentIndex) => currentIndex === index ? null : index)}
                >
                  {faq.question}
                  <span className="ekskul-faq-icon" aria-hidden="true">{openFaqIndex === index ? '−' : '+'}</span>
                </button>
                <div
                  className="ekskul-faq-answer"
                  id={`minat-faq-panel-${index}`}
                  hidden={openFaqIndex !== index}
                >
                  <p>{faq.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  programsTitle: 'Beragam Kegiatan',
  programs: minatBakatPrograms,
  faqLabel: 'INFORMASI MINAT DAN BAKAT',
  faqTitle: 'FAQ & Panduan Minat dan Bakat',
  faqDescription: 'Temukan jawaban seputar pilihan kegiatan, jadwal, dan cara mengembangkan potensi bersama teman-teman di madrasah.',
  faqs: faqItems,
}

export default MinatBakatPage

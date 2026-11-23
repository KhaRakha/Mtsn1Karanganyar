import { useEffect, useState } from 'react'
import ContentSubpage, { DataNotice } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'
import './TestimoniAlumniPage.css'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_QUOTE_WORDS = 20
const MAX_QUOTE_WORDS = 80

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

async function readFormResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Server tidak dapat memproses formulir (${response.status}).`)
  }
  return response.json()
}

function TestimoniAlumniPage() {
  const page = usePublishedPage('testimoni-alumni')
  const data = page?.data ?? {}
  const [formOpen, setFormOpen] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [quoteText, setQuoteText] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const testimonials = Array.isArray(data.testimonials)
    ? data.testimonials.filter(
      (item) => typeof item?.name === 'string'
        && item.name.trim()
        && typeof item?.quote === 'string'
        && item.quote.trim(),
    )
    : []
  const quoteWordCount = quoteText.trim() ? quoteText.trim().split(/\s+/).length : 0

  useEffect(() => {
    if (!formOpen) return undefined

    document.body.classList.add('testimoni-form-open')
    return () => document.body.classList.remove('testimoni-form-open')
  }, [formOpen])

  async function openSubmissionForm() {
    setFormOpen(true)
    setCsrfToken('')
    setConsentGiven(false)
    setQuoteText('')
    setFormError('')
    setFormSuccess('')
    setTokenLoading(true)
    try {
      const response = await fetch('/api/testimoni-alumni/form-token')
      const result = await readFormResponse(response)
      if (!response.ok || !result.csrfToken) {
        throw new Error(result.message || 'Form belum dapat dibuka. Silakan coba lagi.')
      }
      setCsrfToken(result.csrfToken)
    } catch (error) {
      console.error(error)
      setFormError(error.message || 'Form belum dapat dibuka. Silakan coba lagi.')
    } finally {
      setTokenLoading(false)
    }
  }

  async function submitTestimonial(event) {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitting(true)
    setFormError('')
    setFormSuccess('')
    try {
      const response = await fetch('/api/testimoni-alumni/submissions', {
        method: 'POST',
        body: new FormData(form),
      })
      const result = await readFormResponse(response)
      if (!response.ok) {
        const detail = result.errors ? Object.values(result.errors).join(' ') : ''
        throw new Error(detail || result.message || 'Testimoni gagal dikirim. Silakan coba lagi.')
      }
      setFormSuccess(result.message)
      form.reset()
      setConsentGiven(false)
      setQuoteText('')
    } catch (error) {
      console.error(error)
      setFormError(error.message || 'Testimoni gagal dikirim. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ContentSubpage
      className="testimoni-alumni-page"
      title={page?.title || 'Testimoni Alumni'}
      breadcrumb={page?.title || 'Testimoni Alumni'}
      badge={page?.badge || 'CERITA DARI ALUMNI'}
      description={page?.description || 'Kumpulan pengalaman dan kesan yang dibagikan alumni dengan persetujuan untuk dipublikasikan.'}
    >
      <section className="testimoni-alumni-content" aria-label="Testimoni alumni">
        <div className="testimoni-alumni-actions">
          <button type="button" className="testimoni-alumni-share" onClick={openSubmissionForm}>
            <span aria-hidden="true">＋</span> Bagikan Pengalaman Anda
          </button>
        </div>

        {testimonials.length ? (
          <div className="testimoni-alumni-grid">
            {testimonials.map((item, index) => {
              const institution = item.institution || item.university || item.school
              const image = item.image || item.image_url
              return (
                <article className="testimoni-alumni-card" key={`${item.name}-${index}`}>
                  <header className="testimoni-alumni-identity">
                    {image ? (
                      <img src={image} alt="" className="testimoni-alumni-avatar" loading="lazy" />
                    ) : (
                      <span className="testimoni-alumni-avatar testimoni-alumni-initials" aria-hidden="true">
                        {getInitials(item.name)}
                      </span>
                    )}
                    <div className="testimoni-alumni-person">
                      <strong>{item.name}</strong>
                      {institution && <span>{institution}</span>}
                    </div>
                    {item.year && <span className="testimoni-alumni-year">{item.year}</span>}
                  </header>
                  <blockquote>{item.quote}</blockquote>
                </article>
              )
            })}
          </div>
        ) : (
          <DataNotice
            title="Testimoni sedang disiapkan"
            description="Belum ada testimoni alumni yang dipublikasikan."
          />
        )}
      </section>

      {formOpen && (
        <div
          className="testimoni-alumni-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setFormOpen(false)
          }}
        >
          <section
            className="testimoni-alumni-form-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="testimoni-form-title"
          >
            <button
              type="button"
              className="testimoni-alumni-form-close"
              onClick={() => setFormOpen(false)}
              aria-label="Tutup formulir"
              disabled={submitting}
            >
              ×
            </button>
            <span className="testimoni-alumni-form-kicker">CERITA ALUMNI</span>
            <h2 id="testimoni-form-title">Bagikan Pengalaman Anda</h2>
            <p className="testimoni-alumni-form-intro">
              Semua kolom bertanda * wajib diisi agar tidak ada informasi yang terlewat. Foto profil opsional; cerita akan ditinjau admin sebelum ditampilkan.
            </p>

            {formError && <p className="testimoni-alumni-form-message error" role="alert">{formError}</p>}
            {formSuccess && <p className="testimoni-alumni-form-message success" role="status">{formSuccess}</p>}

            {!formSuccess && (
              <form className="testimoni-alumni-form" onSubmit={submitTestimonial}>
                <input type="hidden" name="csrf_token" value={csrfToken} />
                <label className="testimoni-alumni-honeypot" aria-hidden="true">
                  Website
                  <input name="website" tabIndex="-1" autoComplete="off" />
                </label>
                <div className="testimoni-alumni-form-row">
                  <label>
                    Nama lengkap *
                    <input name="name" type="text" maxLength="80" autoComplete="name" required />
                  </label>
                  <label>
                    Asal sekolah atau kampus *
                    <input name="institution" type="text" maxLength="120" required />
                  </label>
                </div>
                <div className="testimoni-alumni-form-row">
                  <label>
                    Tahun kelulusan *
                    <input name="year" type="number" min="1900" max={CURRENT_YEAR} required />
                  </label>
                  <label>
                    Foto profil (opsional)
                    <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" />
                  </label>
                </div>
                <label>
                  Cerita dan pengalaman *
                  <textarea
                    name="quote"
                    maxLength="2000"
                    rows="5"
                    value={quoteText}
                    onChange={(event) => setQuoteText(event.target.value)}
                    aria-describedby="testimoni-quote-guidance"
                    required
                  />
                  <span id="testimoni-quote-guidance" className="testimoni-alumni-quote-guidance" aria-live="polite">
                    Tulis {MIN_QUOTE_WORDS}–{MAX_QUOTE_WORDS} kata ({quoteWordCount}/{MAX_QUOTE_WORDS} kata).
                  </span>
                </label>
                <label className="testimoni-alumni-consent">
                  <input
                    name="consent"
                    type="checkbox"
                    value="yes"
                    checked={consentGiven}
                    onChange={(event) => setConsentGiven(event.target.checked)}
                    required
                  />
                  <span>* Saya menyetujui nama, informasi alumni, cerita, dan foto (jika ada) ditampilkan setelah disetujui admin.</span>
                </label>
                <button
                  type="submit"
                  className="testimoni-alumni-submit"
                  disabled={
                    tokenLoading
                    || submitting
                    || !csrfToken
                    || !consentGiven
                    || quoteWordCount < MIN_QUOTE_WORDS
                    || quoteWordCount > MAX_QUOTE_WORDS
                  }
                >
                  {tokenLoading ? 'Menyiapkan formulir…' : submitting ? 'Mengirim…' : 'Kirim untuk ditinjau'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </ContentSubpage>
  )
}

export default TestimoniAlumniPage

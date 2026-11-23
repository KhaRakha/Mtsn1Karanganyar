import { useEffect, useState } from 'react'
import ContentSubpage, { DataNotice } from '../components/ContentSubpage.jsx'
import { formatContentDate } from '../api/content.js'
import './ArtikelDetailPage.css'

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Server tidak dapat memproses permintaan (${response.status}).`)
  }
  return response.json()
}

function ArtikelDetailPage({ articleId }) {
  const [articles, setArticles] = useState([])
  const [articleLoading, setArticleLoading] = useState(true)
  const [articleError, setArticleError] = useState('')
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState('')
  const [commentToken, setCommentToken] = useState('')
  const [commentTokenLoading, setCommentTokenLoading] = useState(true)
  const [commentConsent, setCommentConsent] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const article = articles.find((item) => String(item.id) === String(articleId))
  const relatedArticles = articles.filter((item) => String(item.id) !== String(articleId))

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/content?type=artikel', { signal: controller.signal })
      .then(async (response) => {
        const result = await readApiResponse(response)
        if (!response.ok) {
          throw new Error(result.message || 'Artikel tidak dapat dimuat.')
        }
        if (!Array.isArray(result)) {
          throw new Error('Format daftar artikel tidak valid.')
        }
        setArticles(result)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
          setArticleError(error.message || 'Artikel tidak dapat dimuat.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setArticleLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!article) return undefined

    const controller = new AbortController()
    fetch(`/api/artikel/${article.id}/comments`, { signal: controller.signal })
      .then(async (response) => {
        const result = await readApiResponse(response)
        if (!response.ok) {
          throw new Error(result.message || 'Komentar tidak dapat dimuat.')
        }
        if (!Array.isArray(result)) {
          throw new Error('Format komentar tidak valid.')
        }
        setComments(result)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
          setCommentsError(error.message || 'Komentar tidak dapat dimuat.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCommentsLoading(false)
      })

    fetch('/api/artikel/comments/form-token', { signal: controller.signal })
      .then(async (response) => {
        const result = await readApiResponse(response)
        if (!response.ok || !result.csrfToken) {
          throw new Error(result.message || 'Form komentar belum dapat dibuka.')
        }
        setCommentToken(result.csrfToken)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
          setCommentError(error.message || 'Form komentar belum dapat dibuka.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCommentTokenLoading(false)
      })

    return () => controller.abort()
  }, [article])

  async function submitComment(event) {
    event.preventDefault()
    const form = event.currentTarget
    setCommentSubmitting(true)
    setCommentError('')
    setCommentMessage('')
    try {
      const response = await fetch('/api/artikel/comments', {
        method: 'POST',
        body: new FormData(form),
      })
      const result = await readApiResponse(response)
      if (!response.ok) {
        const details = result.errors ? Object.values(result.errors).join(' ') : ''
        throw new Error(details || result.message || 'Komentar gagal dikirim.')
      }
      setCommentMessage(result.message)
      form.reset()
      setCommentConsent(false)
    } catch (error) {
      console.error(error)
      setCommentError(error.message || 'Komentar gagal dikirim.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const pageTitle = article ? article.title : 'Artikel Madrasah'
  const articleUrl = article ? window.location.href : ''
  const encodedUrl = encodeURIComponent(articleUrl)
  const encodedTitle = encodeURIComponent(article ? article.title : '')
  const emailBody = encodeURIComponent(article ? `${article.title}\n${articleUrl}` : '')

  if (articleLoading) {
    return (
      <ContentSubpage
        title={<>Artikel<br />Madrasah</>}
        breadcrumb="Artikel"
        badge="LITERASI DAN WAWASAN"
        description="Memuat artikel…"
      >
        <p className="artikel-detail-status" role="status">Memuat artikel…</p>
      </ContentSubpage>
    )
  }

  if (articleError || !article) {
    return (
      <ContentSubpage
        title={<>Artikel<br />Madrasah</>}
        breadcrumb="Artikel"
        badge="LITERASI DAN WAWASAN"
        description="Bacaan dan gagasan pilihan dari MTsN 1 Karanganyar."
      >
        <div className="artikel-detail-not-found">
          <DataNotice
            title={articleError ? 'Artikel belum dapat dimuat' : 'Artikel tidak ditemukan'}
            description={articleError || 'Artikel ini mungkin sudah tidak tersedia.'}
          />
          <a href="/artikel">Kembali ke daftar artikel</a>
        </div>
      </ContentSubpage>
    )
  }

  return (
    <ContentSubpage
      title={<>Artikel<br />Madrasah</>}
      breadcrumb={pageTitle}
      breadcrumbParentLabel="Semua Artikel"
      breadcrumbParentHref="/artikel"
      badge="LITERASI DAN WAWASAN"
      description="Bacaan dan gagasan pilihan dari MTsN 1 Karanganyar."
    >
      <div className="artikel-detail-layout">
        <article className="artikel-detail-main">
          <h2 className="artikel-detail-title">{article.title}</h2>
          {article.image_url && (
            <img
              className="artikel-detail-image"
              src={article.image_url}
              alt={article.title}
              style={{ objectPosition: article.image_position || '50% 50%' }}
            />
          )}
          <div className="artikel-detail-meta">
            <time dateTime={article.published_at}>{formatContentDate(article.published_at)}</time>
            <span>Oleh <strong>Redaksi MTsN 1 Karanganyar</strong></span>
          </div>
          <div className="artikel-detail-body">
            {article.body.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
          </div>

          <section className="artikel-share" aria-labelledby="artikel-share-title">
            <h3 id="artikel-share-title">Bagikan :</h3>
            <div className="artikel-share-actions">
              <a
                className="artikel-share-button artikel-share-facebook"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bagikan artikel ke Facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.2 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.2V13h2.6v8h3.4Z" />
                </svg>
              </a>
              <a
                className="artikel-share-button artikel-share-twitter"
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bagikan artikel ke Twitter"
                title="Twitter"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 5.9a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.7 1 4.2 4.2 0 0 0-7.2 3.8 11.9 11.9 0 0 1-8.6-4.4 4.2 4.2 0 0 0 1.3 5.6 4.1 4.1 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2.5 19a11.8 11.8 0 0 0 18.2-10 8.5 8.5 0 0 0 2-2.1Z" />
                </svg>
              </a>
              <a
                className="artikel-share-button artikel-share-whatsapp"
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bagikan artikel ke WhatsApp"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-5a8.2 8.2 0 1 1 16-3.3Z" />
                  <path d="M8.2 7.7c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.5.7c-.2.2-.2.4 0 .6a8.5 8.5 0 0 0 2.1 2c.3.2.5.2.6 0l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.7-.5.5-1.2.7-1.9.5a11 11 0 0 1-4.2-2.2 10.1 10.1 0 0 1-2.8-3.5c-.6-1.2 0-2.1.4-2.5Z" />
                </svg>
              </a>
              <a
                className="artikel-share-button artikel-share-email"
                href={`mailto:?subject=${encodedTitle}&body=${emailBody}`}
                aria-label="Kirim artikel melalui email"
                title="Email"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="1.5" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </a>
              <a
                className="artikel-share-button artikel-share-x"
                href={`https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bagikan artikel ke X"
                title="X"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.7 5.6 22H2.4l7.3-8.4L1.9 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20Z" />
                </svg>
              </a>
              <button
                className="artikel-share-button artikel-share-print"
                type="button"
                onClick={() => window.print()}
                aria-label="Cetak artikel"
                title="Cetak"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 8V3h12v5M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
                  <path d="M6 14h12v7H6zM18 11h.01" />
                </svg>
              </button>
              <a
                className="artikel-share-button artikel-share-threads"
                href={`https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bagikan artikel ke Threads"
                title="Threads"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <text x="12" y="17" textAnchor="middle" className="artikel-share-threads-mark">@</text>
                </svg>
              </a>
            </div>
          </section>

          <div className="artikel-detail-tags">
            <strong>Tags</strong>
            <span>Literasi dan Wawasan</span>
          </div>

          <section className="artikel-author" aria-labelledby="artikel-author-title">
            <div className="artikel-author-avatar" aria-hidden="true">MT</div>
            <div>
              <span>Tentang Penulis</span>
              <h3 id="artikel-author-title">Redaksi MTsN 1 Karanganyar</h3>
              <p>Tim redaksi website MTsN 1 Karanganyar.</p>
            </div>
          </section>

          <section className="artikel-comments" aria-labelledby="artikel-comments-title">
            <div className="artikel-comments-heading">
              <h3 id="artikel-comments-title">Komentar</h3>
              <span>{comments.length}</span>
            </div>
            {commentsLoading && <p role="status">Memuat komentar…</p>}
            {commentsError && <p className="artikel-comment-message error" role="alert">{commentsError}</p>}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <p className="artikel-comments-empty">Belum ada komentar yang disetujui.</p>
            )}
            {comments.length > 0 && (
              <ul className="artikel-comment-list">
                {comments.map((comment, index) => (
                  <li key={`${comment.submitted_at}-${index}`}>
                    <strong>{comment.name}</strong>
                    <time dateTime={comment.submitted_at.replace(' ', 'T')}>
                      {formatContentDate(comment.submitted_at.slice(0, 10))}
                    </time>
                    <p>{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <h4>Tambah Komentar</h4>
            <p className="artikel-comment-guidance">
              Komentar akan ditampilkan setelah ditinjau admin.
            </p>
            {commentError && <p className="artikel-comment-message error" role="alert">{commentError}</p>}
            {commentMessage && <p className="artikel-comment-message success" role="status">{commentMessage}</p>}
            <form className="artikel-comment-form" onSubmit={submitComment}>
              <input type="hidden" name="csrf_token" value={commentToken} />
              <input type="hidden" name="article_id" value={article.id} />
              <label className="artikel-comment-honeypot" aria-hidden="true">
                Website
                <input name="website" tabIndex="-1" autoComplete="off" />
              </label>
              <label>
                Nama *
                <input name="name" type="text" maxLength="60" required />
              </label>
              <label>
                Komentar *
                <textarea name="body" minLength="10" maxLength="1000" rows="4" required />
              </label>
              <label className="artikel-comment-consent">
                <input
                  name="consent"
                  type="checkbox"
                  value="yes"
                  checked={commentConsent}
                  onChange={(event) => setCommentConsent(event.target.checked)}
                  required
                />
                <span>Saya setuju nama dan komentar ditampilkan jika disetujui admin.</span>
              </label>
              <button
                type="submit"
                disabled={!commentToken || !commentConsent || commentSubmitting}
              >
                {commentTokenLoading
                  ? 'Menyiapkan formulir…'
                  : commentSubmitting
                    ? 'Mengirim…'
                    : 'Kirim komentar'}
              </button>
            </form>
          </section>
        </article>

        <aside className="artikel-related" aria-labelledby="artikel-related-title">
          <h2 id="artikel-related-title">Artikel Lainnya</h2>
          {relatedArticles.length ? (
            <ul>
              {relatedArticles.map((related) => (
                <li key={related.id}>
                  <a href={`/artikel/${related.id}`}>
                    <span className="artikel-related-label">ARTIKEL</span>
                    <strong>{related.title}</strong>
                    <time dateTime={related.published_at}>
                      {formatContentDate(related.published_at)}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="artikel-related-empty">Belum ada artikel lainnya.</p>
          )}
        </aside>
      </div>
    </ContentSubpage>
  )
}

export default ArtikelDetailPage

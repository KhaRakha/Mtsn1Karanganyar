import ContentSubpage, { ContentSection, DataNotice } from '../components/ContentSubpage.jsx'
import { formatContentDate, usePublishedContent } from '../api/content.js'
import './ArtikelPage.css'

function getArticleSummary(article) {
  const summary = (article.summary || article.body).replace(/\s+/g, ' ').trim()
  return summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}…` : summary
}

function ArtikelPage() {
  const articles = usePublishedContent('artikel')

  return (
    <ContentSubpage
      title={<>Artikel<br />Madrasah</>}
      breadcrumb="Artikel"
      badge="LITERASI DAN WAWASAN"
      description="Bacaan dan gagasan pilihan dari MTsN 1 Karanganyar."
    >
      <ContentSection
        label="BACAAN PILIHAN"
        number="01"
        title="Artikel Terbaru"
        description="Temukan informasi, wawasan, dan cerita seputar kehidupan madrasah."
      >
        {articles.length ? (
          <div className="artikel-grid" aria-label="Daftar artikel">
            {articles.map((article) => (
              <article className="artikel-card" key={article.id}>
                <div className="artikel-card-image">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      loading="lazy"
                      style={{ objectPosition: article.image_position || '50% 50%' }}
                    />
                  ) : (
                    <span className="artikel-card-placeholder" aria-hidden="true">✦</span>
                  )}
                  <span className="artikel-card-label">ARTIKEL</span>
                </div>
                <div className="artikel-card-content">
                  <time dateTime={article.published_at}>
                    {formatContentDate(article.published_at)}
                  </time>
                  <h3>{article.title}</h3>
                  <p>{getArticleSummary(article)}</p>
                  <a className="artikel-card-read-more" href={`/artikel/${article.id}`}>
                    Baca selengkapnya <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <DataNotice
            title="Belum ada artikel"
            description="Artikel yang telah diterbitkan oleh madrasah akan ditampilkan di sini."
          />
        )}
      </ContentSection>
    </ContentSubpage>
  )
}

export default ArtikelPage

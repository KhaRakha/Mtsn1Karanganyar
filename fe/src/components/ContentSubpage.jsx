import { useEffect } from 'react'
import '../App.css'
import { SiteFooter, SiteHeader } from '../SiteChrome.jsx'
import SubpageHero from './SubpageHero.jsx'
import './ContentSubpage.css'

function ContentSubpage({
  title,
  breadcrumb,
  breadcrumbParentLabel,
  breadcrumbParentHref,
  badge,
  description,
  className = '',
  children,
}) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${breadcrumb} | MTs Negeri 1 Karanganyar`

    return () => {
      document.title = previousTitle
    }
  }, [breadcrumb])

  return (
    <div className={`site-shell content-subpage ${className}`.trim()}>
      <SiteHeader overlay />
      <main>
        <SubpageHero
          titleId="content-subpage-title"
          title={title}
          breadcrumb={breadcrumb}
          breadcrumbParentLabel={breadcrumbParentLabel}
          breadcrumbParentHref={breadcrumbParentHref}
          badge={badge}
          description={description}
        />
        <div className="content-subpage-body">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

function ContentSection({ number, label, title, description, children }) {
  return (
    <section className="content-section">
      <div className="content-section-heading">
        <div className="content-section-label">
          <span>{number}</span><span>{label}</span>
        </div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  )
}

function InfoCard({ number, title, description, icon = '✳' }) {
  return (
    <article className="content-info-card">
      <div className="content-info-card-top">
        <span>{number}</span><span aria-hidden="true">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

function DataNotice({ title, description }) {
  return (
    <div className="content-data-notice" role="note">
      <span className="content-data-notice-icon" aria-hidden="true">i</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export { ContentSection, DataNotice, InfoCard }
export default ContentSubpage

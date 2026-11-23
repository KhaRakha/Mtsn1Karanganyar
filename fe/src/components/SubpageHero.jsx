import subpageBackground from '../assets/bg-sub-menu.jpeg'
import './SubpageHero.css'

function SubpageHero({
  title,
  badge,
  description,
  breadcrumb,
  breadcrumbParentLabel,
  breadcrumbParentHref,
  titleId,
}) {
  return (
    <section className="subpage-hero" aria-labelledby={titleId}>
      <div className="subpage-hero-photo" aria-hidden="true">
        <img src={subpageBackground} alt="" />
      </div>
      <div className="subpage-hero-card">
        <div className="subpage-hero-content">
          <div className="subpage-hero-breadcrumb">
            <a href="/#beranda">Beranda</a><span aria-hidden="true">›</span>
            {breadcrumbParentLabel && breadcrumbParentHref ? (
              <>
                <a href={breadcrumbParentHref}>{breadcrumbParentLabel}</a>
                <span aria-hidden="true">›</span>
              </>
            ) : null}
            <span aria-current="page">{breadcrumb}</span>
          </div>
          <span className="subpage-hero-badge">{badge}</span>
          <h1 id={titleId}>{title}</h1>
          <p className="subpage-hero-description">{description}</p>
          <span className="subpage-title-divider" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default SubpageHero

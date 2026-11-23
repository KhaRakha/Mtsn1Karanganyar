import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'

function DenahSekolahPage() {
  const page = usePublishedPage('denah-sekolah')
  const map = page?.data?.map ?? {}
  const legend = Array.isArray(page?.data?.legend) ? page.data.legend : [
    { label: 'Gerbang utama', type: 'orange' },
    { label: 'Ruang kelas dan kantor', type: 'building' },
    { label: 'Fasilitas pendukung', type: 'yellow' },
    { label: 'Lapangan dan area hijau', type: 'green' },
    { label: 'Akses jalan', type: 'path' },
  ]
  const classes = Array.isArray(map.classes) ? map.classes : ['KELAS\n7A', 'KELAS\n7B', 'KELAS\n8A', 'KELAS\n8B']

  return (
    <ContentSubpage
      title={page?.title || <>Denah<br />Sekolah</>}
      breadcrumb={page?.title || 'Denah Sekolah'}
      badge={page?.badge || 'PETA LINGKUNGAN MADRASAH'}
      description={page?.description || 'Panduan visual untuk mengenali tata letak area dan fasilitas MTsN 1 Karanganyar.'}
    >
      <ContentSection
        title="Kenali Lingkungan"
      >
        <div className="school-map">
          <div className="school-map-heading">
            <div>
              <span>{map.eyebrow || 'DENAH LINGKUNGAN'}</span>
              <strong>{map.title || 'Area MTsN 1 Karanganyar'}</strong>
            </div>
            <small>{map.subtitle || 'Ilustrasi tata letak fasilitas madrasah'}</small>
          </div>
          <div className="school-map-canvas" aria-label="Ilustrasi denah lingkungan madrasah">
            <div className="school-map-road school-map-road-top">{map.road || 'JALAN UTAMA'}</div>
            <div className="school-map-block school-map-gate">{(map.gate || 'GERBANG\nUTAMA').split('\n').map((line) => <span key={line}>{line}</span>)}</div>
            <div className="school-map-block school-map-office">{(map.office || 'KANTOR\n& TU').split('\n').map((line) => <span key={line}>{line}</span>)}</div>
            {classes.map((label, index) => <div key={index} className={`school-map-block school-map-class class-${String.fromCharCode(97 + index)}`}>{label.split('\n').map((line) => <span key={line}>{line}</span>)}</div>)}
            <div className="school-map-block school-map-lab">{(map.laboratory || 'LABORATORIUM\nIPA & KOMPUTER').split('\n').map((line) => <span key={line}>{line}</span>)}</div>
            <div className="school-map-block school-map-library">{map.library || 'PERPUSTAKAAN'}</div>
            <div className="school-map-block school-map-uks">{map.uks || 'RUANG UKS'}</div>
            <div className="school-map-field">{map.field || 'LAPANGAN KEGIATAN'}</div>
            <div className="school-map-block school-map-hall">{(map.hall || 'RUANG\nSERBAGUNA').split('\n').map((line) => <span key={line}>{line}</span>)}</div>
            <div className="school-map-tree tree-a">✦</div>
            <div className="school-map-tree tree-b">✦</div>
            <div className="school-map-tree tree-c">✦</div>
          </div>
          <div className="school-map-legend" aria-label="Legenda denah">
            <strong>{map.legendTitle || 'Keterangan:'}</strong>
            <div className="school-map-legend-items">
              {legend.map((item) => <span key={item.label}><i className={`legend-${item.type}`} /> {item.label}</span>)}
            </div>
          </div>
        </div>
      </ContentSection>
    </ContentSubpage>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  map: {
    eyebrow: 'DENAH LINGKUNGAN',
    title: 'Area MTsN 1 Karanganyar',
    subtitle: 'Ilustrasi tata letak fasilitas madrasah',
    road: 'JALAN UTAMA',
    gate: 'GERBANG\nUTAMA',
    office: 'KANTOR\n& TU',
    classes: ['KELAS\n7A', 'KELAS\n7B', 'KELAS\n8A', 'KELAS\n8B'],
    laboratory: 'LABORATORIUM\nIPA & KOMPUTER',
    library: 'PERPUSTAKAAN',
    uks: 'RUANG UKS',
    field: 'LAPANGAN KEGIATAN',
    hall: 'RUANG\nSERBAGUNA',
    legendTitle: 'Keterangan:',
  },
  legend: [
    { label: 'Gerbang utama', type: 'orange' },
    { label: 'Ruang kelas dan kantor', type: 'building' },
    { label: 'Fasilitas pendukung', type: 'yellow' },
    { label: 'Lapangan dan area hijau', type: 'green' },
    { label: 'Akses jalan', type: 'path' },
  ],
}

export default DenahSekolahPage

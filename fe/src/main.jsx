import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  DenahSekolahPage,
  DirektoriGuruPage,
  DirektoriTendikPage,
  KomiteMadrasahPage,
  KemitraanPage,
  PenghargaanMadrasahPage,
  SaranaPrasaranaPage,
  SejarahPage,
  StrukturOrganisasiPage,
  TataTertibPage,
  VisiMisiPage,
} from './tentang/index.js'
import {
  KalenderAkademikPage,
  MinatBakatDetailPage,
  MinatBakatPage,
  ProgramKhususOverviewPage,
  ProgramKhususPage,
  PrestasiPage,
  TestimoniAlumniPage,
} from './akademik/index.js'
import {
  ArtikelDetailPage,
  ArtikelPage,
  BeritaPage,
  GaleriPage,
} from './kegiatan/index.js'

const currentPath = window.location.pathname.replace(/\/+$/, '')
const artikelDetailMatch = currentPath.match(/^\/artikel\/(\d+)$/)
const pages = {
  '': <App />,
  '/visi-misi': <VisiMisiPage />,
  '/sejarah': <SejarahPage />,
  '/penghargaan-madrasah': <PenghargaanMadrasahPage />,
  '/sarana-prasarana': <SaranaPrasaranaPage />,
  '/denah-sekolah': <DenahSekolahPage />,
  '/struktur-organisasi': <StrukturOrganisasiPage />,
  '/direktori-guru': <DirektoriGuruPage />,
  '/direktori-tendik': <DirektoriTendikPage />,
  '/komite-madrasah': <KomiteMadrasahPage />,
  '/tata-tertib': <TataTertibPage />,
  '/kemitraan': <KemitraanPage />,
  '/prestasi': <PrestasiPage />,
  '/minat-dan-bakat': <MinatBakatPage />,
  '/kalender-akademik': <KalenderAkademikPage />,
  '/program-khusus': <ProgramKhususOverviewPage />,
  '/program-tahfidz': <ProgramKhususPage programSlug="tahfidz" />,
  '/program-fullday-sains': <ProgramKhususPage programSlug="fullday-sains" />,
  '/testimoni-alumni': <TestimoniAlumniPage />,
  '/berita': <BeritaPage />,
  '/artikel': <ArtikelPage />,
  '/galeri': <GaleriPage />,
}
const minatBakatDetailPrefix = '/minat-dan-bakat/'
const currentPage = currentPath.startsWith(minatBakatDetailPrefix)
  ? <MinatBakatDetailPage activitySlug={currentPath.slice(minatBakatDetailPrefix.length)} />
  : artikelDetailMatch
    ? <ArtikelDetailPage articleId={artikelDetailMatch[1]} />
  : pages[currentPath] ?? <App />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {currentPage}
  </StrictMode>,
)

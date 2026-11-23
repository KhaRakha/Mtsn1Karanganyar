import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(scriptDirectory, '../fe')
const outputFile = path.resolve(scriptDirectory, '../be/page_defaults.json')
const pageFiles = [
  'App.jsx',
  'tentang/VisiMisiPage.jsx',
  'tentang/SejarahPage.jsx',
  'tentang/SaranaPrasaranaPage.jsx',
  'tentang/DenahSekolahPage.jsx',
  'tentang/StrukturOrganisasiPage.jsx',
  'tentang/DirektoriTendikPage.jsx',
  'tentang/KomiteMadrasahPage.jsx',
  'tentang/TataTertibPage.jsx',
  'tentang/KemitraanPage.jsx',
  'akademik/MinatBakatPage.jsx',
  'akademik/KalenderAkademikPage.jsx',
  'akademik/AlumniPage.jsx',
  'kegiatan/GaleriPage.jsx',
]
const pageSlugs = [
  'beranda',
  'visi-misi',
  'sejarah',
  'sarana-prasarana',
  'denah-sekolah',
  'struktur-organisasi',
  'direktori-tendik',
  'komite-madrasah',
  'tata-tertib',
  'kemitraan',
  'minat-dan-bakat',
  'kalender-akademik',
  'alumni',
  'galeri',
]

const server = await createServer({
  root: frontendRoot,
  configFile: path.join(frontendRoot, 'vite.config.js'),
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const modules = await Promise.all(
    pageFiles.map((file) => server.ssrLoadModule(`/src/${file}`)),
  )
  const defaults = Object.fromEntries(
    pageSlugs.map((slug, index) => [slug, modules[index].pageDataDefaults]),
  )
  await writeFile(outputFile, `${JSON.stringify(defaults, null, 2)}\n`, 'utf8')
  console.log(`Exported default content for ${pageSlugs.length} pages to ${outputFile}`)
} finally {
  await server.close()
}

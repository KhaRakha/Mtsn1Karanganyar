import { useState } from 'react'
import ContentSubpage, { ContentSection } from '../components/ContentSubpage.jsx'
import { usePublishedPage } from '../api/pages.js'

const calendarDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const eventsByMonth = {
  0: { 5: { label: 'Upacara Pancasila', type: 'mint' }, 8: { label: 'PTS Ganjil H-1', type: 'orange' }, 9: { label: 'PTS Ganjil H-2', type: 'orange' }, 10: { label: 'PTS Ganjil H-3', type: 'orange' }, 11: { label: 'PTS Ganjil H-4', type: 'orange' }, 12: { label: 'PTS Ganjil H-5', type: 'orange' } },
  1: { 12: { label: 'Hari Kartini', type: 'beige' }, 20: { label: 'Rapat Komite', type: 'blue' } },
  2: { 3: { label: 'Monitoring Kelas', type: 'mint' }, 21: { label: 'Ujian Praktik', type: 'orange' } },
  3: { 1: { label: 'Awal Bulan', type: 'navy' }, 15: { label: 'Pekan Kreativitas', type: 'rose' } },
  4: { 2: { label: 'Kegiatan Keagamaan', type: 'mint' }, 16: { label: 'Lomba Sains', type: 'orange' } },
  5: { 5: { label: 'Study Tour', type: 'blue' }, 17: { label: 'Ujian Sekolah', type: 'orange' } },
  6: { 1: { label: 'Awal Semester', type: 'mint' }, 24: { label: 'Wisuda Kelas XII', type: 'navy' } },
  7: { 8: { label: 'Pekan Literasi', type: 'beige' }, 19: { label: 'Try Out', type: 'orange' } },
  8: { 3: { label: 'Seminar', type: 'blue' }, 18: { label: 'Kenaikan Kelas', type: 'mint' } },
  9: { 5: { label: 'Pawai Sekolah', type: 'mint' }, 20: { label: 'Rapor Siswa', type: 'blue' }, 28: { label: 'Upacara Bendera', type: 'navy' } },
  10: { 10: { label: 'Hari Guru', type: 'beige' }, 27: { label: 'Sumpah Pemuda', type: 'navy' } },
  11: { 12: { label: 'Penilaian Akhir', type: 'orange' }, 25: { label: 'Libur Akhir Tahun', type: 'mint' } },
}

const agendaByMonth = {
  0: [
    { date: '05 Januari 2026', title: 'Upacara Pancasila', tone: 'mint' },
    { date: '08 - 12 Januari 2026', title: 'Pelaksanaan PTS Ganjil', tone: 'orange' },
  ],
  1: [
    { date: '12 Februari 2026', title: 'Hari Kartini', tone: 'beige' },
    { date: '20 Februari 2026', title: 'Rapat Komite', tone: 'blue' },
  ],
  2: [
    { date: '03 Maret 2026', title: 'Monitoring Kelas', tone: 'mint' },
    { date: '21 Maret 2026', title: 'Ujian Praktik', tone: 'orange' },
  ],
  3: [
    { date: '15 April 2026', title: 'Pekan Kreativitas', tone: 'rose' },
  ],
  4: [
    { date: '02 Mei 2026', title: 'Kegiatan Keagamaan', tone: 'mint' },
    { date: '16 Mei 2026', title: 'Lomba Sains', tone: 'orange' },
  ],
  5: [
    { date: '05 Juni 2026', title: 'Study Tour', tone: 'blue' },
    { date: '17 Juni 2026', title: 'Ujian Sekolah', tone: 'orange' },
  ],
  6: [
    { date: '01 Juli 2026', title: 'Awal Semester Baru', tone: 'mint' },
    { date: '24 Juli 2026', title: 'Wisuda Kelas XII', tone: 'navy' },
  ],
  7: [
    { date: '08 Agustus 2026', title: 'Pekan Literasi', tone: 'beige' },
    { date: '19 Agustus 2026', title: 'Try Out', tone: 'orange' },
  ],
  8: [
    { date: '03 September 2026', title: 'Seminar', tone: 'blue' },
    { date: '18 September 2026', title: 'Kenaikan Kelas', tone: 'mint' },
  ],
  9: [
    { date: '05 Oktober 2026', title: 'Pawai Sekolah', tone: 'mint' },
    { date: '20 Oktober 2026', title: 'Rapor Siswa', tone: 'blue' },
  ],
  10: [
    { date: '10 November 2026', title: 'Hari Guru', tone: 'beige' },
    { date: '27 November 2026', title: 'Sumpah Pemuda', tone: 'navy' },
  ],
  11: [
    { date: '12 Desember 2026', title: 'Penilaian Akhir', tone: 'orange' },
    { date: '25 Desember 2026', title: 'Libur Akhir Tahun', tone: 'mint' },
  ],
}

const getCalendarCells = (monthIndex, year) => {
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const cells = []

  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()

  for (let i = 0; i < startOffset; i += 1) {
    const date = prevMonthLastDay - startOffset + i + 1
    cells.push({ date, muted: true })
  }

  for (let date = 1; date <= totalDays; date += 1) {
    cells.push({ date, muted: false })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: cells.length - totalDays - startOffset + 1, muted: true })
  }

  return cells
}

function KalenderAkademikPage() {
  const page = usePublishedPage('kalender-akademik')
  const data = page?.data ?? {}
  const calendar = data.calendar ?? {}
  const download = data.download ?? {}
  const calendarYear = Number(calendar.year) || 2026
  const customEvents = Array.isArray(calendar.events) ? calendar.events : null
  const [selectedMonth, setSelectedMonth] = useState(0)
  const calendarCells = getCalendarCells(selectedMonth, calendarYear)
  const customMonthEvents = customEvents?.filter((item) => Number(item.month) === selectedMonth) ?? []
  const activeMonthEvents = customEvents
    ? Object.fromEntries(customMonthEvents.map((item) => [Number(item.day), { label: item.title, type: item.tone }]))
    : eventsByMonth[selectedMonth] || {}
  const activeAgenda = customEvents
    ? (Array.isArray(calendar.agenda)
      ? calendar.agenda.filter((item) => Number(item.month) === selectedMonth)
      : customMonthEvents).map((item) => ({
      date: item.date || `${String(item.day).padStart(2, '0')} ${monthNames[selectedMonth]} ${calendarYear}`,
      title: item.title,
      tone: item.tone,
      }))
    : agendaByMonth[selectedMonth] || []

  const goToMonth = (offset) => {
    setSelectedMonth((currentMonth) => {
      const nextMonth = (currentMonth + offset + monthNames.length) % monthNames.length
      return nextMonth
    })
  }

  const selectedMonthLabel = `${monthNames[selectedMonth]} ${calendarYear}`
  return (
    <>
      <style>{`
        .kalender-akademik-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.9fr) minmax(300px, 0.95fr);
          gap: 26px;
          align-items: start;
        }

        .kalender-main-card {
          background: linear-gradient(180deg, rgba(232, 245, 236, 0.88) 0%, rgba(246, 250, 247, 0.92) 100%);
          color: #234b35;
          border: 1px solid #dfe7ee;
          border-radius: 18px;
          padding: 16px 16px 10px;
          box-shadow: 0 18px 34px rgba(34, 49, 64, 0.06);
        }

        .kalender-topbar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 2px 2px 0;
        }

        .kalender-topbar nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .kalender-arrow {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(15, 155, 109, 0.08);
          border: 1px solid rgba(15, 155, 109, 0.18);
          color: #0a7d64;
          display: grid;
          place-items: center;
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }

        .kalender-title {
          flex: 0 0 auto;
          min-width: 180px;
          text-align: center;
          color: #1f2c39;
          font-size: clamp(1.1rem, 1.7vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .kalender-toggle-group {
          display: none;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border: 1px solid #dfe7ee;
          border-radius: 14px;
          overflow: hidden;
          background: #edf2f6;
        }

        .calendar-weekday {
          min-height: 38px;
          display: grid;
          place-items: center;
          background: #f8fafb;
          border-right: 1px solid #edf2f6;
          border-bottom: 1px solid #edf2f6;
          color: #687687;
          font-size: 12px;
          font-weight: 700;
        }

        .calendar-cell {
          position: relative;
          min-height: 86px;
          padding: 8px 6px 6px;
          background: #f3f6f8;
          border-right: 1px solid #edf2f6;
          border-bottom: 1px solid #edf2f6;
          color: #1d2a38;
        }

        .calendar-cell:nth-child(7n) {
          border-right: 0;
        }

        .calendar-cell.is-muted {
          background: #f0f3f6;
          color: #9aa7b1;
        }

        .calendar-date {
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .calendar-pill {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: #fff;
          font-size: 8.5px;
          font-weight: 700;
          line-height: 1.2;
          padding: 4px 5px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calendar-pill.mint { background: #0d8a75; }
        .calendar-pill.beige { background: #dca955; }
        .calendar-pill.orange { background: #ec9e2d; }
        .calendar-pill.blue { background: #4a72d2; }
        .calendar-pill.navy { background: #1f3f69; }
        .calendar-pill.rose { background: #d66979; }

        .calendar-side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .agenda-panel {
          border: 1px solid rgba(75, 123, 94, 0.16);
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f4f9f5 100%);
          box-shadow: 0 10px 24px rgba(45, 60, 76, 0.04);
          overflow: hidden;
        }

        .agenda-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 16px 18px 14px;
          border-bottom: 1px solid rgba(116, 168, 132, 0.18);
          background: linear-gradient(180deg, rgba(232, 245, 236, 0.88) 0%, rgba(246, 250, 247, 0.92) 100%);
          color: #234b35;
          font-size: 13px;
          font-weight: 800;
        }

        .agenda-header .left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .agenda-header .icon {
          width: 32px;
          height: 32px;
          display: inline-grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(15, 155, 109, 0.08);
          border: 1px solid rgba(15, 155, 109, 0.18);
          color: #0a7d64;
        }

        .agenda-header .icon svg {
          width: 18px;
          height: 18px;
          display: block;
        }

        .agenda-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: rgba(245,247,249,0.4);
        }

        .agenda-item {
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr);
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(219, 226, 233, 0.9);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
        }

        .agenda-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          background: #0a7d64;
          box-shadow: 0 0 0 4px rgba(10, 125, 100, 0.12);
        }

        .agenda-item.orange .agenda-dot {
          background: #e59b2b;
          box-shadow: 0 0 0 4px rgba(229,155,43,0.15);
        }

        .agenda-item.blue .agenda-dot {
          background: #3566e7;
          box-shadow: 0 0 0 4px rgba(53,102,231,0.12);
        }

        .agenda-item.green .agenda-dot {
          background: #0a7d64;
          box-shadow: 0 0 0 4px rgba(10,125,100,0.12);
        }

        .agenda-meta {
          margin-bottom: 4px;
          color: #54657a;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .agenda-title {
          color: #1d2a38;
          font-size: 12px;
          line-height: 1.55;
          font-weight: 700;
        }

        .download-card {
          background: linear-gradient(180deg, #112949 0%, #0d2140 100%);
          border-radius: 18px;
          padding: 16px 16px 14px;
          color: #edf4ff;
          box-shadow: 0 18px 30px rgba(11, 22, 42, 0.18);
        }

        .download-badge-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .download-badge {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          font-size: 16px;
        }

        .download-card-label {
          color: rgba(223,233,255,0.82);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .download-card h3 {
          margin: 6px 0 0;
          font-size: 15px;
          line-height: 1.3;
          letter-spacing: -0.03em;
          font-weight: 800;
        }

        .download-meta-block {
          margin: 10px 0 16px;
          display: grid;
          gap: 6px;
          color: rgba(227,236,250,0.86);
          font-size: 11px;
          line-height: 1.6;
        }

        .download-button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(180deg, #f7cf46 0%, #efb62d 100%);
          color: #182d46;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 10px 18px rgba(239,182,45,0.18);
          cursor: pointer;
        }

        @media (max-width: 1100px) {
          .kalender-akademik-shell {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .kalender-topbar {
            flex-wrap: wrap;
          }

          .kalender-toggle-group {
            width: 100%;
            justify-content: flex-start;
          }

          .calendar-cell {
            min-height: 62px;
          }
        }
      `}</style>

      <ContentSubpage
        title={page?.title || <>Kalender<br />Akademik</>}
        breadcrumb={page?.title || 'Kalender Akademik'}
        badge={page?.badge || 'AGENDA PENDIDIKAN'}
        description={page?.description || 'Informasi agenda akademik untuk membantu siswa dan keluarga merencanakan kegiatan belajar.'}
      >
        <ContentSection
          title={data.sectionTitle || 'Rencanakan Kegiatan'}
        >
          <div className="kalender-akademik-shell">
            <div className="kalender-main-card">
              <div className="kalender-topbar">
                <button type="button" className="kalender-arrow" aria-label="Bulan sebelumnya" onClick={() => goToMonth(-1)}>‹</button>
                <div className="kalender-title">{selectedMonthLabel}</div>
                <button type="button" className="kalender-arrow" aria-label="Bulan berikutnya" onClick={() => goToMonth(1)}>›</button>
              </div>

              <div className="calendar-grid" aria-label={`Kalender ${selectedMonthLabel}`}>
                {calendarDays.map((day) => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}

                {calendarCells.map((cell, index) => {
                  const event = activeMonthEvents[cell.date]
                  return (
                    <div
                      key={`${cell.date}-${index}`}
                      className={['calendar-cell', cell.muted ? 'is-muted' : '', event ? 'has-event' : ''].filter(Boolean).join(' ')}
                    >
                      <span className="calendar-date">{cell.date}</span>
                      {event && (
                        <span className={`calendar-pill ${event.type}`}>{event.label}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <aside className="calendar-side">
              <div className="agenda-panel">
                <div className="agenda-header">
                  <div className="left">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3.5V5M17 3.5V5M4.5 8.5h15" />
                        <rect x="4.5" y="5.5" width="15" height="14" rx="1.5" />
                        <path d="M8.2 13.2l2.1 2.1 5.2-5.8" />
                      </svg>
                    </span>
                    <span>Agenda Penting</span>
                  </div>
                  <span>{monthNames[selectedMonth].slice(0, 3)} {calendarYear}</span>
                </div>

                <div className="agenda-list">
                  {activeAgenda.length > 0 ? activeAgenda.map((item) => (
                    <div key={item.title} className={`agenda-item ${item.tone}`}>
                      <span className="agenda-dot" aria-hidden="true" />
                      <div>
                        <div className="agenda-meta">{item.date}</div>
                        <div className="agenda-title">{item.title}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="agenda-item">
                      <span className="agenda-dot" aria-hidden="true" />
                      <div>
                        <div className="agenda-meta">{monthNames[selectedMonth]} {calendarYear}</div>
                        <div className="agenda-title">Agenda belum ditentukan.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="download-card">
                <div className="download-badge-row">
                  <span className="download-badge" aria-hidden="true">📄</span>
                  <div>
                    <div className="download-card-label">{download.label || 'DOWNLOAD KALENDER'}</div>
                    <h3>{download.title || `Kalender Akademik ${calendarYear}`}</h3>
                  </div>
                </div>

                <div className="download-meta-block">
                  <div>Periode: {download.period || 'Semester Ganjil & Genap'}</div>
                  <div>{download.description || 'Untuk jadwal pembelajaran, ujian, dan kegiatan sekolah'}</div>
                </div>

                {download.url ? <a href={download.url} className="download-button" style={{ textDecoration: 'none' }} download>
                  <span aria-hidden="true">↓</span>
                  Unduh Kalender (PDF{download.fileSize ? ` + ${download.fileSize}` : ''})
                </a> : <button type="button" className="download-button">
                  <span aria-hidden="true">↓</span>
                  Unduh Kalender (PDF + 2.4 MB)
                </button>}
              </div>
            </aside>
          </div>
        </ContentSection>
      </ContentSubpage>
    </>
  )
}

// oxlint-disable-next-line react/only-export-components
export const pageDataDefaults = {
  sectionTitle: 'Rencanakan Kegiatan',
  calendar: {
    year: 2026,
    events: Object.entries(eventsByMonth).flatMap(([month, days]) =>
      Object.entries(days).map(([day, event]) => ({
        month: Number(month),
        day: Number(day),
        title: event.label,
        tone: event.type,
        date: `${String(day).padStart(2, '0')} ${monthNames[Number(month)]} 2026`,
      })),
    ),
    agenda: Object.entries(agendaByMonth).flatMap(([month, events]) =>
      events.map((event) => ({ month: Number(month), ...event })),
    ),
  },
  download: {
    label: 'DOWNLOAD KALENDER',
    title: 'Kalender Akademik 2026',
    period: 'Semester Ganjil & Genap',
    description: 'Untuk jadwal pembelajaran, ujian, dan kegiatan sekolah',
    url: '',
    fileSize: '2.4 MB',
  },
}

export default KalenderAkademikPage

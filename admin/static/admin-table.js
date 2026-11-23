(() => {
  const tables = [...document.querySelectorAll('.admin-content .table-wrap table')]

  tables.forEach((table, tableIndex) => {
    const body = table.tBodies[0]
    const rows = body ? [...body.rows] : []
    const wrapper = table.closest('.table-wrap')
    if (!body || !wrapper || rows.length === 0) return

    if (!table.id) table.id = `admin-data-table-${tableIndex + 1}`
    const pageSize = 10
    let currentPage = 1
    let query = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'admin-table-tools'

    const label = document.createElement('label')
    label.className = 'admin-table-search'
    label.htmlFor = `${table.id}-search`

    const labelText = document.createElement('span')
    labelText.textContent = 'Cari data'

    const input = document.createElement('input')
    input.id = label.htmlFor
    input.type = 'search'
    input.placeholder = 'Ketik kata kunci...'
    input.autocomplete = 'off'
    input.setAttribute('aria-controls', table.id)
    label.append(labelText, input)

    const resultCount = document.createElement('span')
    resultCount.className = 'admin-table-result-count'
    resultCount.setAttribute('role', 'status')
    resultCount.setAttribute('aria-live', 'polite')
    toolbar.append(label, resultCount)

    const noResults = document.createElement('div')
    noResults.className = 'admin-table-no-results'
    noResults.textContent = 'Tidak ada data yang cocok dengan pencarian.'
    noResults.hidden = true

    const pagination = document.createElement('div')
    pagination.className = 'admin-table-pagination'
    pagination.setAttribute('aria-label', 'Navigasi halaman tabel')

    const pageStatus = document.createElement('span')
    pageStatus.setAttribute('aria-live', 'polite')

    const previous = document.createElement('button')
    previous.type = 'button'
    previous.className = 'button-secondary'
    previous.textContent = 'Sebelumnya'

    const next = document.createElement('button')
    next.type = 'button'
    next.className = 'button-secondary'
    next.textContent = 'Berikutnya'

    pagination.append(pageStatus, previous, next)
    wrapper.parentNode.insertBefore(toolbar, wrapper)
    wrapper.after(noResults, pagination)

    function render() {
      const filteredRows = rows.filter((row) =>
        row.textContent.toLocaleLowerCase('id').includes(query)
      )
      const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
      currentPage = Math.min(currentPage, pageCount)
      const start = (currentPage - 1) * pageSize
      const end = Math.min(start + pageSize, filteredRows.length)
      const visibleRows = new Set(filteredRows.slice(start, end))

      rows.forEach((row) => {
        row.hidden = !visibleRows.has(row)
      })

      noResults.hidden = filteredRows.length !== 0
      resultCount.textContent = `Menampilkan ${filteredRows.length ? start + 1 : 0}–${end} dari ${filteredRows.length} data`
      pageStatus.textContent = `Halaman ${currentPage} dari ${pageCount}`
      previous.disabled = currentPage <= 1
      next.disabled = currentPage >= pageCount
      pagination.hidden = filteredRows.length <= pageSize
    }

    input.addEventListener('input', () => {
      query = input.value.trim().toLocaleLowerCase('id')
      currentPage = 1
      render()
    })
    previous.addEventListener('click', () => {
      currentPage -= 1
      render()
    })
    next.addEventListener('click', () => {
      currentPage += 1
      render()
    })

    render()
  })

  document.querySelectorAll('form.content-form:not([data-home-editor]):not([data-history-editor])').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (form.dataset.submitting === 'true') {
        event.preventDefault()
        return
      }

      const submitter = event.submitter || form.querySelector('button[type="submit"]')
      if (!submitter) return

      form.dataset.submitting = 'true'
      submitter.disabled = true
      submitter.setAttribute('aria-busy', 'true')
      submitter.textContent = 'Menyimpan...'
    })
  })
})()

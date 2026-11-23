const historyEditor = document.querySelector('[data-history-editor]')

if (historyEditor) {
  const sections = [...historyEditor.querySelectorAll('[data-history-section]')]
  const sectionId = historyEditor.dataset.openSection || window.location.hash.slice(1)
  const sectionToOpen = sections.find((section) => section.id === sectionId)

  sections.forEach((section) => {
    section.addEventListener('toggle', () => {
      if (section.open) {
        sections.forEach((otherSection) => {
          if (otherSection !== section) otherSection.open = false
        })
      }
    })
  })

  if (sectionToOpen) sectionToOpen.open = true
}

document.querySelectorAll('[data-history-repeater]').forEach((list) => {
  const name = list.dataset.historyRepeater
  const minimum = Number(list.dataset.minimum || 0)
  const template = document.querySelector(`[data-history-template="${name}"]`)
  const addButton = document.querySelector(`[data-add-history-item="${name}"]`)
  const label = {
    milestones: 'Tonggak',
    emblem_points: 'Makna lambang',
    leaders: 'Kepala madrasah',
  }[name]

  const refreshItems = () => {
    const items = [...list.querySelectorAll('[data-history-item]')]
    items.forEach((item, index) => {
      const heading = item.querySelector('.history-repeat-heading strong')
      if (heading) heading.textContent = `${label} ${index + 1}`
      const removeButton = item.querySelector('[data-remove-history-item]')
      if (removeButton) removeButton.disabled = items.length <= minimum
      const imageInput = item.querySelector('[data-history-image-input]')
      if (imageInput) imageInput.name = `leader_image_file_${index}`
    })
  }

  addButton?.addEventListener('click', () => {
    if (!template) return
    list.append(template.content.cloneNode(true))
    refreshItems()
  })

  list.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-history-item]')
    if (!removeButton || list.querySelectorAll('[data-history-item]').length <= minimum) return
    removeButton.closest('[data-history-item]')?.remove()
    refreshItems()
  })

  refreshItems()
})

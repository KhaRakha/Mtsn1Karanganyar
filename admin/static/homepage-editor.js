const homeEditor = document.querySelector('[data-home-editor]')

if (homeEditor) {
  const sections = [...homeEditor.querySelectorAll('[data-home-section]')]
  const sectionId = homeEditor.dataset.openSection || window.location.hash.slice(1)
  const sectionToOpen = sections.find((section) => section.id === sectionId)

  homeEditor.addEventListener('submit', () => {
    homeEditor
      .querySelectorAll('[data-home-repeater="gallery"] [data-home-item]')
      .forEach((item) => {
        const positionField = item.querySelector('[data-gallery-position]')
        const horizontal = item.querySelector('[data-gallery-position-x]')
        const vertical = item.querySelector('[data-gallery-position-y]')
        if (!positionField || !horizontal || !vertical) return

        positionField.value = `${horizontal.value}% ${vertical.value}%`
      })
  })

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

document.querySelectorAll('[data-home-repeater]').forEach((list) => {
  const name = list.dataset.homeRepeater
  const minimum = Number(list.dataset.minimum || 0)
  const template = document.querySelector(`[data-home-template="${name}"]`)
  const addButton = document.querySelector(`[data-add-home-item="${name}"]`)
  const label = {
    heroSlides: 'Slide hero',
    statistics: 'Statistik',
    programs: 'Program',
    values: 'Nilai',
    fallbackAchievements: 'Prestasi bawaan',
    gallery: 'Foto galeri',
  }[name]

  const initializeGalleryCrop = (item) => {
    const crop = item.querySelector('[data-gallery-crop]')
    if (!crop || crop.dataset.initialized) return
    crop.dataset.initialized = 'true'

    const positionField = item.querySelector('[data-gallery-position]')
    const image = item.querySelector('[data-gallery-preview]')
    const placeholder = item.querySelector('[data-gallery-placeholder]')
    const horizontal = item.querySelector('[data-gallery-position-x]')
    const vertical = item.querySelector('[data-gallery-position-y]')
    const horizontalValue = item.querySelector('[data-gallery-position-x-value]')
    const verticalValue = item.querySelector('[data-gallery-position-y-value]')
    const upload = item.querySelector('[data-home-upload="gallery"]')
    if (!positionField || !image || !horizontal || !vertical) return

    const savedPosition = positionField.value.match(/^(\d{1,3})%\s+(\d{1,3})%$/)
    if (savedPosition) {
      horizontal.value = savedPosition[1]
      vertical.value = savedPosition[2]
    }

    const updatePosition = () => {
      const position = `${horizontal.value}% ${vertical.value}%`
      positionField.value = position
      image.style.objectPosition = position
      if (horizontalValue) horizontalValue.value = `${horizontal.value}%`
      if (verticalValue) verticalValue.value = `${vertical.value}%`
    }

    horizontal.addEventListener('input', updatePosition)
    vertical.addEventListener('input', updatePosition)
    updatePosition()

    upload?.addEventListener('change', () => {
      const file = upload.files[0]
      if (!file) return

      if (image.dataset.localPreviewUrl) {
        URL.revokeObjectURL(image.dataset.localPreviewUrl)
      }
      const previewUrl = URL.createObjectURL(file)
      image.dataset.localPreviewUrl = previewUrl
      image.src = previewUrl
      image.hidden = false
      if (placeholder) placeholder.hidden = true
    })
  }

  const refreshItems = () => {
    const items = [...list.querySelectorAll('[data-home-item]')]
    items.forEach((item, index) => {
      initializeGalleryCrop(item)
      const heading = item.querySelector('.history-repeat-heading strong')
      if (heading) heading.textContent = `${label} ${index + 1}`
      const removeButton = item.querySelector('[data-remove-home-item]')
      if (removeButton) removeButton.disabled = items.length <= minimum

      item.querySelectorAll('[data-home-upload]').forEach((input) => {
        if (input.dataset.homeUpload === 'program-visual') {
          const visualIndex = [...item.querySelectorAll('[data-home-upload]')].indexOf(input)
          input.name = `program_visual_file_${index}_${visualIndex}`
        } else if (input.dataset.homeUpload === 'hero-slide') {
          input.name = `hero_slide_file_${index}`
        } else if (input.dataset.homeUpload === 'hero-video') {
          input.name = `hero_slide_video_file_${index}`
        } else if (input.dataset.homeUpload === 'gallery') {
          input.name = `gallery_image_file_${index}`
        } else if (input.dataset.homeUpload === 'fallback-achievement') {
          input.name = `fallback_achievement_file_${index}`
        }
      })
    })
  }

  addButton?.addEventListener('click', () => {
    if (!template) return
    list.append(template.content.cloneNode(true))
    refreshItems()
  })

  list.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-home-item]')
    if (!removeButton || list.querySelectorAll('[data-home-item]').length <= minimum) return
    const item = removeButton.closest('[data-home-item]')
    item?.querySelectorAll('[data-gallery-preview]').forEach((image) => {
      if (image.dataset.localPreviewUrl) URL.revokeObjectURL(image.dataset.localPreviewUrl)
    })
    item?.remove()
    refreshItems()
  })

  refreshItems()
})

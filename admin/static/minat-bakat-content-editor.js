const minatBakatEditor = document.querySelector('[data-minat-bakat-editor]')

if (minatBakatEditor) {
  const programList = minatBakatEditor.querySelector('[data-mb-program-list]')
  const faqList = minatBakatEditor.querySelector('[data-mb-faq-list]')
  const programTemplate = document.querySelector('[data-mb-program-template]')
  const documentationTemplate = document.querySelector('[data-mb-documentation-template]')
  const faqTemplate = document.querySelector('[data-mb-faq-template]')

  const refresh = () => {
    const programs = [...programList.querySelectorAll('[data-mb-program]')]
    const programCount = minatBakatEditor.querySelector('[data-mb-program-count]')
    if (programCount) programCount.value = programs.length

    programs.forEach((program, programIndex) => {
      const prefix = `programs[${programIndex}]`
      const name = program.querySelector('[data-mb-field="name"]')?.value.trim()
      const heading = program.querySelector('[data-mb-program-heading]')
      if (heading) heading.textContent = `Kegiatan ${programIndex + 1} — ${name || 'baru'}`

      program.querySelectorAll('[data-mb-field]').forEach((field) => {
        field.name = `${prefix}[${field.dataset.mbField}]`
      })

      const documentations = [...program.querySelectorAll('[data-mb-documentation]')]
      const documentationCount = program.querySelector('[data-mb-documentation-count]')
      if (documentationCount) {
        documentationCount.name = `${prefix}[documentation_count]`
        documentationCount.value = documentations.length
      }

      documentations.forEach((documentation, documentationIndex) => {
        const documentationPrefix = `${prefix}[documentation][${documentationIndex}]`
        const documentationHeading = documentation.querySelector('[data-mb-documentation-heading]')
        if (documentationHeading) documentationHeading.textContent = `Dokumentasi ${documentationIndex + 1}`

        documentation.querySelectorAll('[data-mb-documentation-field]').forEach((field) => {
          field.name = `${documentationPrefix}[${field.dataset.mbDocumentationField}]`
        })

        const upload = documentation.querySelector('[data-mb-image-upload="documentation"]')
        if (upload) upload.name = `${documentationPrefix}[image_file]`
        const removeButton = documentation.querySelector('[data-mb-remove-documentation]')
        if (removeButton) removeButton.disabled = documentations.length <= 1
      })

      const imageUpload = program.querySelector('[data-mb-image-upload="image"]')
      if (imageUpload) imageUpload.name = `${prefix}[image_file]`
      const removeProgramButton = program.querySelector('[data-mb-remove-program]')
      if (removeProgramButton) removeProgramButton.disabled = programs.length <= 1
      const addDocumentationButton = program.querySelector('[data-mb-add-documentation]')
      if (addDocumentationButton) addDocumentationButton.disabled = documentations.length >= 15
    })

    const faqs = [...faqList.querySelectorAll('[data-mb-faq]')]
    const faqCount = minatBakatEditor.querySelector('[data-mb-faq-count]')
    if (faqCount) faqCount.value = faqs.length
    faqs.forEach((faq, faqIndex) => {
      const heading = faq.querySelector('[data-mb-faq-heading]')
      if (heading) heading.textContent = `FAQ ${faqIndex + 1}`
      faq.querySelectorAll('[data-mb-faq-field]').forEach((field) => {
        field.name = `faqs[${faqIndex}][${field.dataset.mbFaqField}]`
      })
      const removeButton = faq.querySelector('[data-mb-remove-faq]')
      if (removeButton) removeButton.disabled = faqs.length <= 1
    })

    const addProgramButton = minatBakatEditor.querySelector('[data-mb-add-program]')
    if (addProgramButton) addProgramButton.disabled = programs.length >= 30
    const addFaqButton = minatBakatEditor.querySelector('[data-mb-add-faq]')
    if (addFaqButton) addFaqButton.disabled = faqs.length >= 30
  }

  const clearLocalPreview = (image) => {
    if (!image.dataset.localPreviewUrl) return
    URL.revokeObjectURL(image.dataset.localPreviewUrl)
    delete image.dataset.localPreviewUrl
  }

  const showPreview = (control, source) => {
    const image = control.querySelector('[data-mb-preview]')
    if (!image) return
    clearLocalPreview(image)
    if (source) {
      image.src = source
      image.hidden = false
      image.style.display = ''
    } else {
      image.removeAttribute('src')
      image.hidden = true
      image.style.display = 'none'
    }
  }

  minatBakatEditor.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return

    if (button.matches('[data-mb-add-program]')) {
      if (programList.querySelectorAll('[data-mb-program]').length < 30 && programTemplate) {
        programList.append(programTemplate.content.cloneNode(true))
        refresh()
      }
      return
    }

    if (button.matches('[data-mb-remove-program]')) {
      event.preventDefault()
      const programs = programList.querySelectorAll('[data-mb-program]')
      if (programs.length > 1) {
        button.closest('[data-mb-program]').querySelectorAll('[data-mb-preview]').forEach(clearLocalPreview)
        button.closest('[data-mb-program]').remove()
        refresh()
      }
      return
    }

    if (button.matches('[data-mb-add-documentation]')) {
      const program = button.closest('[data-mb-program]')
      const list = program.querySelector('[data-mb-documentation-list]')
      if (list.querySelectorAll('[data-mb-documentation]').length < 15 && documentationTemplate) {
        list.append(documentationTemplate.content.cloneNode(true))
        refresh()
      }
      return
    }

    if (button.matches('[data-mb-remove-documentation]')) {
      const list = button.closest('[data-mb-documentation-list]')
      const item = button.closest('[data-mb-documentation]')
      if (list.querySelectorAll('[data-mb-documentation]').length > 1) {
        item.querySelectorAll('[data-mb-preview]').forEach(clearLocalPreview)
        item.remove()
        refresh()
      }
      return
    }

    if (button.matches('[data-mb-add-faq]')) {
      if (faqList.querySelectorAll('[data-mb-faq]').length < 30 && faqTemplate) {
        faqList.append(faqTemplate.content.cloneNode(true))
        refresh()
      }
      return
    }

    if (button.matches('[data-mb-remove-faq]')) {
      if (faqList.querySelectorAll('[data-mb-faq]').length > 1) {
        button.closest('[data-mb-faq]').remove()
        refresh()
      }
    }
  })

  minatBakatEditor.addEventListener('change', (event) => {
    const input = event.target.closest('[data-mb-image-upload]')
    if (!input) return
    const control = input.closest('[data-mb-image-control]')
    const preview = control?.querySelector('[data-mb-preview]')
    if (!control || !preview) return
    clearLocalPreview(preview)

    const file = input.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      preview.dataset.localPreviewUrl = previewUrl
      preview.src = previewUrl
      preview.hidden = false
      preview.style.display = ''
      return
    }

    showPreview(control, control.querySelector('[data-mb-image-url]')?.value.trim())
  })

  minatBakatEditor.addEventListener('input', (event) => {
    const input = event.target.closest('[data-mb-field="name"]')
    if (!input) return
    const program = input.closest('[data-mb-program]')
    const programs = [...programList.querySelectorAll('[data-mb-program]')]
    const heading = program.querySelector('[data-mb-program-heading]')
    if (heading) {
      heading.textContent = `Kegiatan ${programs.indexOf(program) + 1} — ${input.value.trim() || 'baru'}`
    }
  })

  minatBakatEditor.addEventListener('input', (event) => {
    const input = event.target.closest('[data-mb-image-url]')
    if (!input) return
    const control = input.closest('[data-mb-image-control]')
    if (control?.querySelector('[data-mb-image-upload]')?.files?.length) return
    showPreview(control, input.value.trim())
  })

  minatBakatEditor.addEventListener('submit', refresh)
  refresh()
}

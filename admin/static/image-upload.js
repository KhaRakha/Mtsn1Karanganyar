document.querySelectorAll('[data-image-upload]').forEach((upload) => {
  const form = upload.closest('form')
  const urlInput = form.querySelector('#image_url')
  const preview = form.querySelector('[data-image-preview]')
  const status = form.querySelector('[data-image-upload-status]')
  const cropFrame = form.querySelector('[data-crop-frame]')
  const imagePosition = form.querySelector('[data-image-position]')
  const horizontalPosition = form.querySelector('[data-image-position-x]')
  const verticalPosition = form.querySelector('[data-image-position-y]')

  const updateCropPosition = () => {
    if (!imagePosition || !horizontalPosition || !verticalPosition) return

    const position = `${horizontalPosition.value}% ${verticalPosition.value}%`
    imagePosition.value = position
    preview.style.objectPosition = position
  }

  if (imagePosition && horizontalPosition && verticalPosition) {
    const [horizontal, vertical] = imagePosition.value.match(/\d+/g) || [50, 50]
    horizontalPosition.value = horizontal
    verticalPosition.value = vertical
    updateCropPosition()
    horizontalPosition.addEventListener('input', updateCropPosition)
    verticalPosition.addEventListener('input', updateCropPosition)
  }

  urlInput.addEventListener('input', () => {
    preview.src = urlInput.value
    preview.hidden = !urlInput.value
    if (cropFrame) cropFrame.hidden = !urlInput.value
  })

  upload.addEventListener('change', async () => {
    const image = upload.files[0]
    if (!image) return

    const data = new FormData()
    data.append('csrf_token', form.querySelector('[name="csrf_token"]').value)
    data.append('image', image)
    status.textContent = 'Mengunggah gambar…'
    try {
      const response = await fetch('/admin/uploads/images', { method: 'POST', body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gambar gagal diunggah.')
      urlInput.value = result.url
      urlInput.dispatchEvent(new Event('input'))
      status.textContent = 'Gambar berhasil diunggah. Simpan konten untuk menerbitkan perubahan.'
    } catch (error) {
      status.textContent = error.message
    } finally {
      upload.value = ''
    }
  })
})

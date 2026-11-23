const draftDialog = document.querySelector('[data-draft-confirm-dialog]')

if (draftDialog) {
  const dialogTitle = draftDialog.querySelector('[data-draft-confirm-title]')
  const dialogDescription = draftDialog.querySelector('[data-draft-confirm-description]')
  const dialogForm = draftDialog.querySelector('[data-draft-confirm-form]')
  const dialogCsrf = draftDialog.querySelector('[data-draft-confirm-csrf]')
  const submitButton = draftDialog.querySelector('[data-draft-confirm-submit]')
  const cancelButton = draftDialog.querySelector('[data-draft-confirm-cancel]')
  let pendingTrigger = null
  let pendingMode = null
  let confirmedRemoveButton = null

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(
      '[data-draft-confirm], [data-admin-confirm-delete], [data-remove-home-item], [data-remove-history-item]',
    )
    if (!trigger) return
    if (trigger === confirmedRemoveButton) {
      confirmedRemoveButton = null
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()

    const action = trigger.dataset.draftConfirm
    const isPublish = action === 'publish'
    const isRemove = trigger.matches('[data-remove-home-item], [data-remove-history-item]')
    const sourceForm = isRemove ? null : trigger.closest('form')
    const csrfField = sourceForm?.querySelector('[name="csrf_token"]')
    const item = trigger.closest('[data-home-item], [data-history-item]')
    const title = (
      trigger.dataset.draftTitle ||
      trigger.dataset.confirmTitle ||
      item?.querySelector('.history-repeat-heading strong')?.textContent.trim() ||
      'item ini'
    )
    const kind = trigger.dataset.confirmKind || (action ? 'draf' : 'data')

    if (!isRemove && (!sourceForm || !csrfField || !dialogForm || !dialogCsrf)) {
      console.error('Form konfirmasi hapus tidak memiliki aksi atau token CSRF.')
      return
    }

    pendingTrigger = trigger
    pendingMode = isRemove ? 'remove' : 'submit'

    if (dialogTitle) {
      dialogTitle.textContent = isPublish
        ? 'Terbitkan draf?'
        : isRemove
          ? 'Hapus dari formulir?'
          : `Hapus ${kind}?`
    }
    if (dialogDescription) {
      dialogDescription.textContent = trigger.dataset.confirmMessage || (
        isPublish
          ? `Draf "${title}" akan ditampilkan di website. Lanjutkan?`
          : isRemove
            ? `"${title}" akan dihapus dari formulir. Perubahan berlaku setelah disimpan. Lanjutkan?`
            : `${kind} "${title}" akan dihapus permanen dan tidak dapat dipulihkan. Lanjutkan?`
      )
    }
    if (submitButton) {
      submitButton.textContent = isPublish ? 'Ya, terbitkan' : 'Ya, hapus'
      submitButton.classList.toggle('is-danger', !isPublish)
    }

    if (!isRemove && sourceForm && csrfField && dialogForm && dialogCsrf) {
      dialogForm.action = sourceForm.action
      dialogCsrf.value = csrfField.value
    }
    draftDialog.showModal()
  })

  submitButton?.addEventListener('click', (event) => {
    if (pendingMode !== 'remove' || !pendingTrigger) return
    event.preventDefault()
    const button = pendingTrigger
    pendingTrigger = null
    pendingMode = null
    confirmedRemoveButton = button
    draftDialog.close()
    button.click()
  })

  cancelButton?.addEventListener('click', () => draftDialog.close())
  draftDialog.addEventListener('click', (event) => {
    if (event.target === draftDialog) draftDialog.close()
  })
  draftDialog.addEventListener('close', () => {
    pendingTrigger = null
    pendingMode = null
  })
}

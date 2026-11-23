(() => {
  const shell = document.querySelector('[data-admin-shell]')
  const sidebar = document.querySelector('[data-admin-sidebar]')
  if (!shell || !sidebar) return

  const toggles = [...sidebar.querySelectorAll('[data-sidebar-toggle]')]
  const sections = [...sidebar.querySelectorAll('[data-sidebar-section]')]
  const closeButton = sidebar.querySelector('[data-sidebar-close]')
  const mobileOpenButton = document.querySelector('[data-sidebar-mobile-open]')
  const backdrop = document.querySelector('[data-sidebar-backdrop]')
  const storageKey = 'mtn-admin-sidebar'
  let activeGroup = ''

  function saveState(isOpen, group) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ isOpen, group }))
    } catch (error) {
      console.error('Preferensi sidebar admin tidak dapat disimpan.', error)
    }
  }

  function setSidebarState(isOpen, group, persist = true) {
    activeGroup = group
    shell.classList.toggle('sidebar-expanded', isOpen)
    document.body.classList.toggle('admin-drawer-open', isOpen)
    if (mobileOpenButton) {
      mobileOpenButton.setAttribute('aria-expanded', String(isOpen))
    }
    toggles.forEach((toggle) => {
      const isActive = toggle.dataset.sidebarToggle === group
      toggle.classList.toggle('active', isActive)
      toggle.setAttribute('aria-expanded', String(isOpen && isActive))
    })
    sections.forEach((section) => {
      const isDesktop = window.matchMedia('(min-width: 681px)').matches
      const isCurrentSection = (isDesktop || isOpen) && section.dataset.sidebarSection === group
      section.hidden = isDesktop ? false : !isCurrentSection
      section.open = isCurrentSection
    })
    if (persist) saveState(isOpen, group)
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const group = toggle.dataset.sidebarToggle
      const shouldOpen = !(shell.classList.contains('sidebar-expanded') && activeGroup === group)
      setSidebarState(shouldOpen, group)
    })
  })

  closeButton?.addEventListener('click', () => {
    setSidebarState(false, activeGroup)
  })

  mobileOpenButton?.addEventListener('click', () => {
    if (shell.classList.contains('sidebar-expanded')) {
      setSidebarState(false, activeGroup)
      return
    }

    const availableGroups = toggles.map((toggle) => toggle.dataset.sidebarToggle)
    const preferredGroup = availableGroups.includes(activeGroup)
      ? activeGroup
      : availableGroups.includes(sidebar.dataset.defaultGroup)
        ? sidebar.dataset.defaultGroup
        : availableGroups[0]
    setSidebarState(true, preferredGroup)
  })

  backdrop?.addEventListener('click', () => {
    setSidebarState(false, activeGroup)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !shell.classList.contains('sidebar-expanded')) return
    const previousGroup = activeGroup
    setSidebarState(false, previousGroup)
    if (mobileOpenButton && window.matchMedia('(max-width: 680px)').matches) {
      mobileOpenButton.focus()
    } else {
      toggles.find((toggle) => toggle.dataset.sidebarToggle === previousGroup)?.focus()
    }
  })

  let savedState
  try {
    savedState = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
  } catch (error) {
    console.error('Preferensi sidebar admin tidak dapat dibaca.', error)
  }

  const defaultGroup = sidebar.dataset.defaultGroup
  const initialGroup = savedState?.group || defaultGroup
  const validGroup = toggles.some((toggle) => toggle.dataset.sidebarToggle === initialGroup)
  const isDesktop = window.matchMedia('(min-width: 681px)').matches

  if (isDesktop) {
    setSidebarState(defaultGroup !== 'dashboard' && validGroup, defaultGroup, false)
  } else if (savedState?.isOpen && validGroup) {
    setSidebarState(true, initialGroup, false)
  } else {
    setSidebarState(false, validGroup ? initialGroup : '', false)
  }
})()

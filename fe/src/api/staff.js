import { useEffect, useState } from 'react'

export function usePublishedGuru() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/staff/guru', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Gagal memuat direktori guru (${response.status}).`)
        }
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Format data direktori guru tidak valid.')
        }
        setEntries(data)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    return () => controller.abort()
  }, [])

  return entries
}

export function usePublishedTendik() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/staff/tendik', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Gagal memuat direktori tenaga kependidikan (${response.status}).`)
        }
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Format data direktori tenaga kependidikan tidak valid.')
        }
        setEntries(data)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    return () => controller.abort()
  }, [])

  return entries
}

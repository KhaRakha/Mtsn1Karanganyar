import { useEffect, useState } from 'react'

export function usePublishedContent(contentType) {
  const [items, setItems] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/content?type=${encodeURIComponent(contentType)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Permintaan konten ${contentType} gagal (${response.status}).`)
        }

        return response.json()
      })
      .then((content) => {
        if (!Array.isArray(content)) {
          throw new Error(`Format konten ${contentType} tidak valid.`)
        }

        setItems(content)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    return () => controller.abort()
  }, [contentType])

  return items
}

export function formatContentDate(value) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

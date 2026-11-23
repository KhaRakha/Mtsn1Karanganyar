import { useEffect, useState } from 'react'

export async function fetchPublishedPage(pageSlug, signal) {
  const response = await fetch(`/api/pages/${encodeURIComponent(pageSlug)}`, { signal })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Gagal memuat konten halaman (${response.status}).`)
  }
  return response.json()
}

function usePublishedPageRequest(pageSlug) {
  const [result, setResult] = useState({ page: null, loading: true })

  useEffect(() => {
    const controller = new AbortController()
    fetchPublishedPage(pageSlug, controller.signal)
      .then((page) => setResult({ page, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
          setResult({ page: null, loading: false })
        }
      })
    return () => controller.abort()
  }, [pageSlug])

  return result
}

export function usePublishedPage(pageSlug) {
  return usePublishedPageRequest(pageSlug).page
}

export function usePublishedPageWithStatus(pageSlug) {
  return usePublishedPageRequest(pageSlug)
}

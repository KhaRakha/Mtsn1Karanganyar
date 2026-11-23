import { useEffect, useState } from 'react'

export function usePublicNavigation() {
  const [groups, setGroups] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/navigation', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Permintaan navigasi gagal (${response.status}).`)
        }

        return response.json()
      })
      .then((navigation) => {
        if (!Array.isArray(navigation)) {
          throw new Error('Format navigasi website tidak valid.')
        }

        setGroups(navigation)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })

    return () => controller.abort()
  }, [])

  return groups
}

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const timeout = setTimeout(() => window.scrollTo(0, 0), 0)
    return () => clearTimeout(timeout)
  }, [pathname])

  return null
}

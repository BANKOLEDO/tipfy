import { type SVGProps } from 'react'

export default function NairaCoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="9" r="7.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 6h5M9.5 9h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 6v6M13.5 6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 19.5l2.5-3h5l2.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

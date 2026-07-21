export default function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Animated dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-accent/10"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 10) % 100}%`,
            animation: `particle-drift ${8 + (i % 5) * 3}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="particle-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="10%" y1="20%" x2="35%" y2="45%" stroke="url(#particle-line)" strokeWidth="0.5" />
        <line x1="60%" y1="15%" x2="80%" y2="50%" stroke="url(#particle-line)" strokeWidth="0.5" />
        <line x1="25%" y1="70%" x2="55%" y2="85%" stroke="url(#particle-line)" strokeWidth="0.5" />
        <line x1="70%" y1="60%" x2="90%" y2="30%" stroke="url(#particle-line)" strokeWidth="0.5" />
        <line x1="45%" y1="40%" x2="75%" y2="75%" stroke="url(#particle-line)" strokeWidth="0.5" />
      </svg>
    </div>
  )
}
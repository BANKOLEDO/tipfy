let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) {
    audioContext = new Ctor()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

export function playNotificationSound(): void {
  const ctx = getContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(volume, start + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(g)
      g.connect(gain)
      osc.start(start)
      osc.stop(start + duration + 0.05)
    }

    // Two-note ascending chime (like a bell)
    playTone(880, now, 0.35, 0.25)
    playTone(1174.66, now + 0.12, 0.4, 0.18)
  } catch {
    // Audio is best-effort; never crash over it
  }
}

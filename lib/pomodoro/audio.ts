let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext || (window as any).webkitAudioContext
      ctx = new Ctor()
    } catch {
      return null
    }
  }
  return ctx
}

// Chuông 2 nốt (A5 → E6) decay mượt, trang nhã.
export function playBell(volume = 0.6): void {
  const a = getCtx()
  if (!a) return
  if (a.state === 'suspended') a.resume().catch(() => {})
  const now = a.currentTime
  const tones = [
    { f: 880, t: 0 },
    { f: 1318.5, t: 0.18 },
  ]
  for (const { f, t } of tones) {
    const osc = a.createOscillator()
    const g = a.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    g.gain.setValueAtTime(0.0001, now + t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.35), now + t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 1.4)
    osc.connect(g)
    g.connect(a.destination)
    osc.start(now + t)
    osc.stop(now + t + 1.5)
  }
}

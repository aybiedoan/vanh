'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowLeft, X, Play, Volume2, VolumeX } from 'lucide-react'
import { MEMORIES, GREETING_LINES, getFallbackImage, type MemoryItem } from '@/data/showroom-data'

// ─── Types ────────────────────────────────────────────────────────────────────

type Star = {
  id: number
  x: number
  y: number
  baseX: number
  baseY: number
  floatOffset: number
  floatSpeed: number
}

type DecorativeStar = {
  x: number
  y: number
  size: number
  opacity: number
}

type ViewPhase = 'greeting' | 'starsky'

const HAS_SEEN_GREETING_KEY = 'showroom_has_seen_greeting'

// ─── Stable seeded random (avoids hydration mismatch) ────────────────────────

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDecorativeStars(count: number, width: number, height: number): DecorativeStar[] {
  const rand = seededRandom(42)
  return Array.from({ length: count }, () => ({
    x: rand() * width,
    y: rand() * height,
    size: 0.4 + rand() * 2.2,
    opacity: 0.2 + rand() * 0.55,
  }))
}

function generateStars(count: number, width: number, height: number): Star[] {
  const padding = 80
  const rand = seededRandom(99)
  return Array.from({ length: count }, (_, i) => {
    const x = padding + rand() * (width - padding * 2)
    const y = padding + rand() * (height - padding * 2)
    return {
      id: i,
      x,
      y,
      baseX: x,
      baseY: y,
      floatOffset: rand() * Math.PI * 2,
      floatSpeed: 0.35 + rand() * 0.45,
    }
  })
}

function getNearest(stars: Star[], idx: number, count: number): number[] {
  const star = stars[idx]
  return stars
    .map((s, i) => ({ i, d: Math.hypot(s.baseX - star.baseX, s.baseY - star.baseY) }))
    .filter((d) => d.i !== idx)
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((d) => d.i)
}

// ─── Preloaded Image ──────────────────────────────────────────────────────────

function PreloadedImage({
  src,
  alt,
  fallbackIdx,
  className,
  style,
}: {
  src: string
  alt: string
  fallbackIdx: number
  className?: string
  style?: React.CSSProperties
}) {
  const [imageSrc, setImageSrc] = useState(src)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setImageSrc(src)
  }, [src])

  return (
    <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, rgba(80,40,90,0.45) 0%, rgba(50,25,70,0.45) 100%)',
            borderRadius: 'inherit',
          }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setImageSrc(getFallbackImage(fallbackIdx))}
      />
    </div>
  )
}

// ─── Stardust Particles ───────────────────────────────────────────────────────

function ModalStardust() {
  const rand = seededRandom(77)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: rand() * 3 + 1,
            height: rand() * 3 + 1,
            background: `hsla(${300 + rand() * 60}, 60%, 75%, ${0.35 + rand() * 0.4})`,
            left: `${rand() * 100}%`,
            top: -10,
          }}
          animate={{
            y: ['0%', '110%'],
            x: [0, (rand() - 0.5) * 40],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: 4 + rand() * 3,
            repeat: Infinity,
            delay: rand() * 6,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// ─── Typewriter (modal use) ───────────────────────────────────────────────────

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const done = displayed.length >= text.length

  useEffect(() => {
    setDisplayed('')
    let idx = 0
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (idx < text.length) { setDisplayed(text.slice(0, ++idx)) }
        else clearInterval(iv)
      }, 40)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [text, delay])

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-6 ml-1 align-middle"
          style={{ background: 'hsl(320 50% 75%)' }}
        />
      )}
    </span>
  )
}

// ─── 3D Photo Carousel ────────────────────────────────────────────────────────
// Logic độc lập hoàn toàn với chữ — Tự động tính toán ảnh chính diện để mở phẳng

function PhotoCarousel3D({ activeIndex }: { activeIndex: number }) {
  const rotationRef = useRef(0)
  const [rotation, setRotation] = useState(0)
  const photos = MEMORIES
  const count = photos.length
  const angleStep = 360 / count
  const radius = typeof window !== 'undefined' ? Math.min(260, window.innerWidth * 0.32) : 260

  // 1. Tự động quay chậm liên tục
  useEffect(() => {
    let frame: number
    let lastTime = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      rotationRef.current += 0.04 * (dt / 16.67)
      setRotation(rotationRef.current)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  // 2. Tính toán xem ảnh nào đang lướt qua chính diện
  const getFrontIndex = useCallback(() => {
    let closestIdx = 0
    let smallestAngleDiff = 180

    for (let i = 0; i < count; i++) {
      const photoWorldAngle = (angleStep * i + rotation) % 360
      const normalizedAngle = (photoWorldAngle + 360) % 360
      
      let angleDiff = normalizedAngle
      if (angleDiff > 180) {
        angleDiff = 360 - angleDiff
      }
      
      if (angleDiff < smallestAngleDiff) {
        smallestAngleDiff = angleDiff
        closestIdx = i
      }
    }
    return closestIdx
  }, [rotation, count, angleStep])

  const frontIndex = getFrontIndex()

  return (
    <div
      className="relative"
      style={{
        width: '100%',
        height: '38vh',
        minHeight: 240,
        maxHeight: 380,
        perspective: 1100,
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotation}deg)`,
        }}
      >
        {photos.map((photo, idx) => {
          const angle = angleStep * idx
          const rad = (angle * Math.PI) / 180
          const x = Math.sin(rad) * radius
          const z = Math.cos(rad) * radius
          
          const isFront = idx === frontIndex

          let diff = (-rotation - (-angle)) % 360
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360

          const targetRotateY = isFront ? (-angle + diff) : -angle

          // THAY ĐỔI TẠI ĐÂY: Tăng từ 35 lên 75 để đẩy ảnh nổi bật lên hẳn phía trước,
          // tạo khoảng cách an toàn tuyệt đối, không cho ảnh bên cạnh đâm xuyên qua.
          const extraZ = isFront ? 75 : 0

          return (
            <div
              key={idx}
              className="absolute"
              style={{
                transform: `translateX(${x}px) translateZ(${z + extraZ}px) rotateY(${targetRotateY}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.4s ease-out', 
              }}
            >
              <div
                style={{
                  width: isFront ? 130 : 90,
                  height: isFront ? 170 : 118,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: isFront
                    ? '2px solid rgba(255,200,230,0.8)'
                    : '1.5px solid rgba(255,200,230,0.2)',
                  boxShadow: isFront
                    ? '0 0 32px rgba(255,160,210,0.6), 0 12px 40px rgba(0,0,0,0.5)'
                    : '0 6px 20px rgba(0,0,0,0.35)',
                  background: 'rgba(40,20,40,0.6)',
                  transition: 'width 0.4s ease, height 0.4s ease, box-shadow 0.4s ease, border 0.4s ease, filter 0.4s ease',
                  filter: isFront ? 'none' : 'brightness(0.6)',
                }}
              >
                <PreloadedImage
                  src={photo.image}
                  alt={photo.caption}
                  fallbackIdx={idx}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Greeting View ────────────────────────────────────────────────────────────

const VISIBLE_LINE_COUNT = 2
const CHAR_SPEED = 58
const LINE_PAUSE = 900

type LineEntry = {
  id: number
  lineIdx: number
  text: string
  charIdx: number
}

function GreetingView({
  onComplete,
  onBack,
  musicEnabled,
}: {
  onComplete: () => void
  onBack: () => void
  musicEnabled: boolean
}) {
  const [lineIdx, setLineIdx] = useState(0)
  const [entries, setEntries] = useState<LineEntry[]>([])
  const [done, setDone] = useState(false)
  const entryKeyRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [carouselIdx, setCarouselIdx] = useState(0)

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (lineIdx >= GREETING_LINES.length) {
      timerRef.current = setTimeout(() => {
        setDone(true)
        try { localStorage.setItem(HAS_SEEN_GREETING_KEY, 'true') } catch (_) {}
        timerRef.current = setTimeout(onComplete, 1600)
      }, 1200)
      return clear
    }

    const lineText = GREETING_LINES[lineIdx]
    const id = entryKeyRef.current++

    setEntries((prev) => {
      const next = [...prev, { id, lineIdx, text: '', charIdx: 0 }]
      return next.length > VISIBLE_LINE_COUNT ? next.slice(next.length - VISIBLE_LINE_COUNT) : next
    })

    // Ảnh xoay ngay lập tức khi dòng chữ mới vừa được khởi tạo
    setCarouselIdx(lineIdx % MEMORIES.length)

    let charIdx = 0
    intervalRef.current = setInterval(() => {
      charIdx++
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, text: lineText.slice(0, charIdx), charIdx } : e
        )
      )
      if (charIdx >= lineText.length) {
        clearInterval(intervalRef.current!)
        timerRef.current = setTimeout(() => setLineIdx((p) => p + 1), LINE_PAUSE)
      }
    }, CHAR_SPEED)

    return clear
  }, [lineIdx, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #130818 0%, #220f30 35%, #2e1240 65%, #3a1548 100%)',
      }}
    >
      <StarField count={300} seed={55} />

      <motion.button
        onClick={(e) => {
          e.preventDefault()
          onBack()
        }}
        whileHover={{ x: -3 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-6 left-6 flex items-center gap-2"
        style={{
          background: 'rgba(55,25,55,0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,175,220,0.18)',
          borderRadius: 40,
          padding: '8px 18px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'hsl(320 55% 84%)',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 50,
        }}
      >
        <ArrowLeft size={14} />
        <span>Trở về</span>
      </motion.button>

      <div className="w-full mb-10 flex-shrink-0">
        <PhotoCarousel3D activeIndex={carouselIdx} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-end px-6"
        style={{ minHeight: 130, maxWidth: 580, width: '100%' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map((entry, index) => {
            const isTyping = entry.charIdx < GREETING_LINES[entry.lineIdx]?.length
            
            // NÂNG CẤP: Xác định dòng chữ mới nhất (cuối mảng)
            const isLatest = index === entries.length - 1

            return (
              <motion.p
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
                // NÂNG CẤP: Dòng mới giữ nguyên opacity 1, dòng cũ giảm còn 0.35
                animate={{ 
                  opacity: isLatest ? 1 : 0.35, 
                  y: 0, 
                  filter: 'blur(0px)' 
                }}
                exit={{
                  opacity: 0,
                  y: -28,
                  filter: 'blur(3px)',
                  transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
                }}
                transition={{ 
                  opacity: { duration: 0.4 },
                  layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  default: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                }}
                className="text-center w-full"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.3rem, 4.5vw, 1.95rem)',
                  color: 'hsl(318 40% 88%)',
                  lineHeight: 1.5,
                  // NÂNG CẤP: Giảm textShadow đối với dòng text cũ
                  textShadow: isLatest 
                    ? '0 2px 20px rgba(200,100,160,0.35)' 
                    : '0 1px 10px rgba(200,100,160,0.15)',
                  marginBottom: '0.55rem',
                }}
              >
                {entry.text}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.42, repeat: Infinity }}
                    className="inline-block w-0.5 h-5 ml-1 align-middle"
                    style={{ background: 'hsl(320 50% 72%)' }}
                  />
                )}
              </motion.p>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 px-6 py-2.5 rounded-full"
            style={{
              background: 'rgba(60,25,60,0.55)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,175,220,0.18)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'hsl(320 50% 80%)',
              letterSpacing: '0.05em',
            }}
          >
            Đang mở bầu trời sao...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Static Star Field Component ──────────────────────────────────────────────

function StarField({ count, seed }: { count: number; seed: number }) {
  const stars = useMemo(() => {
    if (typeof window === 'undefined') return []
    const rand = seededRandom(seed)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 0.4 + rand() * 2.1,
      opacity: 0.18 + rand() * 0.52,
    }))
  }, [count, seed])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: `rgba(240, 220, 255, ${s.opacity})`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Audio Player Hook ────────────────────────────────────────────────────────

const AMBIENT_MUSIC_URL = 'https://nkfwybiufcddmxyavcba.supabase.co/storage/v1/object/sign/Aybie/music.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDE0MDQ2Yi1kOTUwLTQ1ZjMtYTRjNC1iMjY2MWMxMzVlYTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBeWJpZS9tdXNpYy5tcDMiLCJpYXQiOjE3ODAzMjgyMjIsImV4cCI6MTg3NDkzNjIyMn0.yp0oaoWXuWiuzvWv6HHKeCcTe6OU71_WkLrfG6UM18E'

function useAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)

  const start = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(AMBIENT_MUSIC_URL)
      audio.loop = true
      audio.volume = 1
      audioRef.current = audio
    }
    audioRef.current.play().catch(() => {})
    setStarted(true)
  }, [])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    const next = !muted
    audioRef.current.muted = next
    setMuted(next)
  }, [muted])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  return { start, toggleMute, muted, started }
}

// ─── Star Sky View ────────────────────────────────────────────────────────────

function StarSkyView({
  onBack,
  onReplayGreeting,
  musicEnabled,
  onToggleMute,
  musicMuted,
}: {
  onBack: () => void
  onReplayGreeting: () => void
  musicEnabled: boolean
  onToggleMute: () => void
  musicMuted: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [stars, setStars] = useState<Star[]>([])
  const [decorativeStars, setDecorativeStars] = useState<DecorativeStar[]>([])
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [selectedStar, setSelectedStar] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 160, damping: 22 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 160, damping: 22 })
  const TOTAL = MEMORIES.length
  const MAGNETIC_RADIUS = 55

  useEffect(() => {
    const load = (start: number) => {
      const end = Math.min(start + 5, MEMORIES.length)
      for (let i = start; i < end; i++) {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.src = MEMORIES[i].image
      }
    }
    load(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 5; i < MEMORIES.length; i += 5) {
      timers.push(setTimeout(() => load(i), (i / 5) * 500))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setDimensions({ width: w, height: h })
      setStars(generateStars(TOTAL, w, h))
      setDecorativeStars(generateDecorativeStars(300, w, h))
      setIsMobile(w < 768)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [TOTAL])

  useEffect(() => {
    const fn = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [mouseX, mouseY])

  const nearestCache = useMemo(() => {
    const cache: Record<number, number[]> = {}
    stars.forEach((_, i) => { cache[i] = getNearest(stars, i, 3) })
    return cache
  }, [stars])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const bg = ctx.createLinearGradient(0, 0, 0, dimensions.height)
    bg.addColorStop(0, '#0f0618')
    bg.addColorStop(0.3, '#1c0b28')
    bg.addColorStop(0.65, '#270f38')
    bg.addColorStop(1, '#311244')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    const blobs = [
      { cx: 0.18, cy: 0.28, r: 0.38, c: 'rgba(110,35,90,0.1)' },
      { cx: 0.78, cy: 0.68, r: 0.32, c: 'rgba(140,50,110,0.09)' },
      { cx: 0.5, cy: 0.15, r: 0.25, c: 'rgba(90,25,80,0.07)' },
    ]
    blobs.forEach(({ cx, cy, r, c }) => {
      const g = ctx.createRadialGradient(
        cx * dimensions.width, cy * dimensions.height, 0,
        cx * dimensions.width, cy * dimensions.height, r * dimensions.width
      )
      g.addColorStop(0, c)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    })

    decorativeStars.forEach((s) => {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(235, 215, 255, ${s.opacity})`
      ctx.fill()
    })

    if (hoveredStar !== null && stars[hoveredStar]) {
      const from = stars[hoveredStar]
      ;(nearestCache[hoveredStar] || []).forEach((ni) => {
        const to = stars[ni]
        if (!to) return
        const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
        grad.addColorStop(0, 'rgba(255,175,220,0.55)')
        grad.addColorStop(1, 'rgba(200,145,255,0.15)')
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1
        ctx.shadowColor = 'rgba(255,175,220,0.4)'
        ctx.shadowBlur = 5
        ctx.stroke()
        ctx.shadowBlur = 0
      })
    }
  }, [dimensions, decorativeStars, hoveredStar, stars, nearestCache])

  useEffect(() => { drawCanvas() }, [drawCanvas])

  useEffect(() => {
    let frame: number
    const animate = () => {
      const t = performance.now() * 0.001
      const mx = smoothMouseX.get()
      const my = smoothMouseY.get()
      setStars((prev) =>
        prev.map((star) => {
          const floatY = Math.sin(t * star.floatSpeed + star.floatOffset) * 5
          const dx = mx - star.baseX
          const dy = my - star.baseY
          const dist = Math.hypot(dx, dy)
          let mx2 = 0, my2 = 0
          if (dist < MAGNETIC_RADIUS && dist > 0) {
            const force = (1 - dist / MAGNETIC_RADIUS) * 11
            mx2 = (dx / dist) * force
            my2 = (dy / dist) * force
          }
          return { ...star, x: star.baseX + mx2, y: star.baseY + floatY + my2 }
        })
      )
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [smoothMouseX, smoothMouseY])

  useEffect(() => {
    if (isMobile) return
    const mx = smoothMouseX.get()
    const my = smoothMouseY.get()
    let closest: number | null = null
    let minDist = 32
    stars.forEach((star, i) => {
      const d = Math.hypot(star.x - mx, star.y - my)
      if (d < minDist) { minDist = d; closest = i }
    })
    setHoveredStar(closest)
  }, [stars, smoothMouseX, smoothMouseY, isMobile])

  const getMemory = (idx: number): MemoryItem =>
    MEMORIES[idx] || { image: getFallbackImage(idx), caption: '' }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {stars.map((star, idx) => {
          const isHovered = hoveredStar === idx
          const memory = getMemory(idx)
          return (
            <motion.div
              key={star.id}
              className="absolute cursor-pointer"
              style={{ left: star.x, top: star.y, transform: 'translate(-50%,-50%)' }}
              onClick={() => setSelectedStar(idx)}
            >
              <motion.div
                className="rounded-full"
                animate={{
                  scale: isHovered ? 1.7 : [1, 1.15, 0.95, 1],
                  opacity: isHovered ? 1 : [0.7, 1, 0.75, 1],
                  boxShadow: isHovered
                    ? '0 0 18px 7px rgba(255,195,230,0.9), 0 0 36px 14px rgba(255,145,200,0.45)'
                    : '0 0 10px 3px rgba(255,215,240,0.55)',
                }}
                transition={{
                  duration: isHovered ? 0.28 : 3.5,
                  repeat: isHovered ? 0 : Infinity,
                  delay: (idx * 0.15) % 2,
                  ease: 'easeInOut',
                }}
                style={{ width: 10, height: 10, background: 'white' }}
              />
              <AnimatePresence>
                {isHovered && !isMobile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ duration: 0.22 }}
                    className="absolute pointer-events-none"
                    style={{ left: 18, top: -18, zIndex: 30 }}
                  >
                    <div
                      className="overflow-hidden"
                      style={{
                        width: 120,
                        height: 150,
                        borderRadius: 10,
                        background: 'rgba(55,25,55,0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,175,220,0.3)',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                      }}
                    >
                      <PreloadedImage
                        src={memory.image}
                        alt={memory.caption}
                        fallbackIdx={idx}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        onClick={onBack}
        whileHover={{ x: -3 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 left-6 flex items-center gap-2"
        style={{
          background: 'rgba(55,25,55,0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,175,220,0.18)',
          borderRadius: 40,
          padding: '8px 18px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'hsl(320 55% 84%)',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 50,
        }}
      >
        <ArrowLeft size={14} />
        <span>Trở về</span>
      </motion.button>

      <div className="absolute top-6 right-6 flex items-center gap-2" style={{ zIndex: 50 }}>
        <motion.button
          onClick={onToggleMute}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(55,25,55,0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,175,220,0.18)',
            color: 'hsl(320 55% 84%)',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          {musicMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </motion.button>

        <motion.button
          onClick={onReplayGreeting}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-2"
          style={{
            background: 'rgba(55,25,55,0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,175,220,0.18)',
            borderRadius: 40,
            padding: '8px 18px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            color: 'hsl(320 55% 84%)',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <Play size={13} />
          <span>Xem lời chúc</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {selectedStar !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 100,
              background: 'rgba(14,6,22,0.93)',
              backdropFilter: 'blur(22px)',
            }}
            onClick={() => setSelectedStar(null)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 90,
                height: 90,
                background: 'radial-gradient(circle, rgba(255,175,220,0.4) 0%, transparent 70%)',
                left: stars[selectedStar]?.x || '50%',
                top: stars[selectedStar]?.y || '50%',
                transform: 'translate(-50%,-50%)',
              }}
            />

            <ModalStardust />

            <motion.div
              initial={{ scale: 0.72, opacity: 0, y: 36 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.82, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              className="relative max-w-xl w-full mx-4 p-6 text-center"
              style={{
                background: 'rgba(45,20,48,0.72)',
                backdropFilter: 'blur(26px)',
                border: '1px solid rgba(255,175,220,0.18)',
                borderRadius: 22,
                boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setSelectedStar(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="absolute top-4 right-4 flex items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(75,35,75,0.65)',
                  border: '1px solid rgba(255,175,220,0.2)',
                  color: 'hsl(320 55% 84%)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </motion.button>

              <PreloadedImage
                src={getMemory(selectedStar).image}
                alt={getMemory(selectedStar).caption}
                fallbackIdx={selectedStar}
                className="mx-auto overflow-hidden"
                style={{
                  width: '100%',
                  maxWidth: 380,
                  aspectRatio: '4/3',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="mt-5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  color: 'hsl(318 40% 90%)',
                  lineHeight: 1.4,
                }}
              >
                <TypewriterText text={getMemory(selectedStar).caption} delay={380} />
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Showroom({ onBack: onBackParent }: { onBack: () => void }) {
  const [phase, setPhase] = useState<ViewPhase>('greeting')
  const [hasSeenGreeting, setHasSeenGreeting] = useState(false)
  const { start, toggleMute, muted, started } = useAmbientMusic()

  // Handle back button - stop showroom music and return
  const onBack = useCallback(() => {
    // Stop the ambient music when leaving showroom
    try {
      const audio = document.querySelector('audio') as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    } catch {}
    onBackParent()
  }, [onBackParent])

  useEffect(() => {
    try {
      if (localStorage.getItem(HAS_SEEN_GREETING_KEY) === 'true') {
        setHasSeenGreeting(true)
        setPhase('starsky')
      }
    } catch (_) {}
  }, [])

  const handleStart = () => {
    if (!started) start()
  }

  const handleGreetingComplete = () => {
    setHasSeenGreeting(true)
    setPhase('starsky')
  }

  const handleReplayGreeting = () => {
    setPhase('greeting')
    if (!started) start()
  }

  // Auto-play music when entering showroom
  useEffect(() => {
    start()
  }, [])

  return (
    <div onClick={handleStart}>
      <AnimatePresence mode="wait">
        {phase === 'greeting' ? (
          <GreetingView
            key={hasSeenGreeting ? 'greeting-replay' : 'greeting-first'}
            onComplete={handleGreetingComplete}
            onBack={onBack}
            musicEnabled={started}
          />
        ) : (
          <StarSkyView
            key="starsky"
            onBack={onBack}
            onReplayGreeting={handleReplayGreeting}
            musicEnabled={started}
            onToggleMute={toggleMute}
            musicMuted={muted}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
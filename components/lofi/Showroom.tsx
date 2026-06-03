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
  baseSize: number
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
  const stars: Star[] = []
  
  // ─── CẤU HÌNH PHÂN BỔ ──────────────────────────────────────────────────────
  const minDistance = 50  // Khoảng cách tối thiểu giữa các tâm sao (tính bằng pixel)
  const maxAttempts = 100 // Số lần thử lại tối đa cho mỗi ngôi sao để tránh treo trình duyệt
  // ───────────────────────────────────────────────────────────────────────────

  for (let i = 0; i < count; i++) {
    let x = 0
    let y = 0
    let isValid = false
    let attempts = 0

    while (!isValid && attempts < maxAttempts) {
      x = padding + rand() * (width - padding * 2)
      y = padding + rand() * (height - padding * 2)
      attempts++

      // Kiểm tra khoảng cách với tất cả các ngôi sao đã được chấp thuận trước đó
      isValid = true
      for (const existingStar of stars) {
        const dist = Math.hypot(x - existingStar.baseX, y - existingStar.baseY)
        if (dist < minDistance) {
          isValid = false
          break // Bị trùng/quá gần, bẻ gãy vòng lặp để tìm tọa độ khác
        }
      }
    }

    // Sau khi tìm được vị trí hợp lệ (hoặc đã cố hết 100 lần thử), đưa vào mảng
    stars.push({
      id: i,
      x,
      y,
      baseX: x,
      baseY: y,
      floatOffset: rand() * Math.PI * 2,
      floatSpeed: 0.12 + rand() * 0.6,
      baseSize: 10 + rand() * 5,
    })
  }

  return stars
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
  objectFit = 'cover',
  imgStyle, // 1. Thêm prop này để truyền style riêng cho thẻ img
}: {
  src: string
  alt: string
  fallbackIdx: number
  className?: string
  style?: React.CSSProperties
  objectFit?: 'cover' | 'contain' | 'fill'
  imgStyle?: React.CSSProperties // Định nghĩa kiểu dữ liệu
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
        loading="eager"
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          ...imgStyle, // 2. Kế thừa style động tại đây
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
    const textLength = text.length
    let iv: ReturnType<typeof setInterval> | null = null

    const t = setTimeout(() => {
      iv = setInterval(() => {
        if (idx < textLength) {
          idx++
          setDisplayed(text.slice(0, idx))
        } else if (iv) {
          clearInterval(iv)
        }
      }, 40)
    }, delay)

    return () => {
      clearTimeout(t)
      if (iv) clearInterval(iv)
    }
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
  const [isDragging, setIsDragging] = useState(false)
  
  const dragStartXRef = useRef(0)
  const dragStartRotationRef = useRef(0)
  const velocityRef = useRef(0)
  
  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)

  const photos = MEMORIES
  const DISPLAY_COUNT = Math.min(18, photos.length)
  const angleStep = 360 / DISPLAY_COUNT
  const radius = typeof window !== 'undefined' ? Math.min(260, window.innerWidth * 0.32) : 260

  useEffect(() => {
    let frame: number
    let lastTime = performance.now()
    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      if (!isDragging) {
        rotationRef.current += (0.08 * (dt / 16.67)) + velocityRef.current
        velocityRef.current *= 0.96 
        if (Math.abs(velocityRef.current) < 0.01) velocityRef.current = 0
      }
      setRotation(rotationRef.current)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isDragging])

  const getFrontIndex = useCallback(() => {
    let closestIdx = 0
    let smallestAngleDiff = 180
    for (let i = 0; i < DISPLAY_COUNT; i++) {
      const photoWorldAngle = (angleStep * i + rotation) % 360
      const normalizedAngle = (photoWorldAngle + 360) % 360
      let angleDiff = normalizedAngle
      if (angleDiff > 180) angleDiff = 360 - angleDiff
      if (angleDiff < smallestAngleDiff) {
        smallestAngleDiff = angleDiff
        closestIdx = i
      }
    }
    return closestIdx
  }, [rotation, DISPLAY_COUNT, angleStep])

  const frontIndex = getFrontIndex()

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartRotationRef.current = rotationRef.current
    lastXRef.current = e.clientX
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    e.stopPropagation()
    const currentX = e.clientX
    const now = performance.now()
    const dt = Math.max(now - lastTimeRef.current, 1)
    const dragDist = currentX - dragStartXRef.current
    const rotationDelta = (dragDist / 220) * angleStep 
    rotationRef.current = dragStartRotationRef.current + rotationDelta
    setRotation(rotationRef.current)
    const deltaX = currentX - lastXRef.current
    const deltaRotation = (deltaX / 220) * angleStep
    velocityRef.current = (deltaRotation / dt) * 16.67
    lastXRef.current = currentX
    lastTimeRef.current = now
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const now = performance.now()
    if (now - lastTimeRef.current > 100) {
      velocityRef.current = 0
    } else {
      velocityRef.current = Math.max(-12, Math.min(12, velocityRef.current))
    }
  }

  // ─── TOUCH HANDLERS FOR MOBILE ───────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    
    const touchX = e.touches[0].clientX
    dragStartXRef.current = touchX
    dragStartRotationRef.current = rotationRef.current
    lastXRef.current = touchX
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    // Ngăn chặn trình duyệt scroll màn hình khi đang vuốt carousel
    if (e.cancelable) e.preventDefault()
    e.stopPropagation()
    
    const touchX = e.touches[0].clientX
    const now = performance.now()
    const dt = Math.max(now - lastTimeRef.current, 1)
    
    const dragDist = touchX - dragStartXRef.current
    const rotationDelta = (dragDist / 220) * angleStep 
    rotationRef.current = dragStartRotationRef.current + rotationDelta
    setRotation(rotationRef.current)
    
    const deltaX = touchX - lastXRef.current
    const deltaRotation = (deltaX / 220) * angleStep
    velocityRef.current = (deltaRotation / dt) * 16.67
    
    lastXRef.current = touchX
    lastTimeRef.current = now
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const now = performance.now()
    if (now - lastTimeRef.current > 100) {
      velocityRef.current = 0
    } else {
      velocityRef.current = Math.max(-12, Math.min(12, velocityRef.current))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isMoving = isDragging || Math.abs(velocityRef.current) > 0.05

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
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as any}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotation}deg)`,
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {Array.from({ length: DISPLAY_COUNT }).map((_, idx) => {
          const angle = angleStep * idx
          const isFront = idx === frontIndex

          let diff = (-rotation - (-angle)) % 360
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360

          const targetRotateY = isFront ? (-angle + diff) : -angle
          
          // ─── THAY ĐỔI QUAN TRỌNG ĐỂ FIX LỖI LỆCH TÂM ───────────────────────
          // Thay vì cộng extraZ vào TranslateZ, ta cộng thẳng vào bán kính (Radius) của Slot này.
          const extraRadius = isFront ? 85 : 0
          const currentRadius = radius + extraRadius
          
          const rad = (angle * Math.PI) / 180
          const x = Math.sin(rad) * currentRadius
          const z = Math.cos(rad) * currentRadius
          // ──────────────────────────────────────────────────────────────────

          let distanceFromFront = Math.abs(idx - frontIndex)
          if (distanceFromFront > DISPLAY_COUNT / 2) {
            distanceFromFront = DISPLAY_COUNT - distanceFromFront
          }
          const zIndex = DISPLAY_COUNT - distanceFromFront

          const totalShift = Math.round(-rotation / angleStep)
          const frontPhotoIdx = ((totalShift % photos.length) + photos.length) % photos.length
          
          let normAngle = (angleStep * idx + rotation) % 360
          if (normAngle > 180) normAngle -= 360
          if (normAngle < -180) normAngle += 360
          
          const stepsFromFront = Math.round(normAngle / angleStep)
          const photoIdx = ((frontPhotoIdx + stepsFromFront) % photos.length + photos.length) % photos.length
          const photo = photos[photoIdx]

          return (
            <div
              key={idx}
              className="absolute"
              style={{
                // FIX: Chỉ dùng `z` thuần túy vì extraRadius đã xử lý độ nhô 3D hoàn hảo và cân bằng
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${targetRotateY}deg)`,
                transformStyle: 'preserve-3d',
                transition: isMoving ? 'none' : 'transform 0.4s ease-out', 
                zIndex: zIndex,
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
                  fallbackIdx={photoIdx}
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
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => onComplete()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-8 py-2.5 rounded-full cursor-pointer"
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
            Vào bầu trời sao
          </motion.button>
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

const AMBIENT_MUSIC_URL = 'https://nkfwybiufcddmxyavcba.supabase.co/storage/v1/object/sign/Aybie/music-1.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDE0MDQ2Yi1kOTUwLTQ1ZjMtYTRjNC1iMjY2MWMxMzVlYTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBeWJpZS9tdXNpYy0xLm1wMyIsImlhdCI6MTc4MDM1Njg1NywiZXhwIjoxOTA2NTAwODU3fQ.PYL_Cd-4GkYHWz211krkOyx3GmPwOTeLCeTulMuu2YM'

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
  const [enableMovement, setEnableMovement] = useState(false)
  const [isClient, setIsClient] = useState(false)
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
    setIsClient(true)
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

  // ─── Vòng lặp Animation & Tính toán Hover Hợp nhất ──────────────────────────
useEffect(() => {
    if (isMobile && !enableMovement) {
      setStars((prev) => {
        if (prev.length === 0) return prev
        return prev.map(star => ({ ...star, x: star.baseX, y: star.baseY }))
      })
      return // Dừng toàn bộ effect tại đây, cứu cánh cho pin điện thoại!
    }
    let frame: number
    
    const animate = () => {
      const t = performance.now() * 0.001
      const mx = smoothMouseX.get()
      const my = smoothMouseY.get()
      
      let closestIdx: number | null = null
      let minDist = 32

      if (!isMobile) {
        // TRÊN PC: Giữ nguyên logic tính lực hút từ trường (Magnetic) + Bổ sung floatX
        setStars((prev) => {
          if (prev.length === 0) return prev
          return prev.map((star, i) => {
            // ─── THÊM FLOAT X CHO PC ───
            const floatX = enableMovement ? Math.cos(t * star.floatSpeed + star.floatOffset) * 3 : 0
            const floatY = enableMovement ? Math.sin(t * star.floatSpeed + star.floatOffset) * 5 : 0

            const dx = mx - star.baseX
            const dy = my - star.baseY
            const dist = Math.hypot(dx, dy)
            
            let mx2 = 0, my2 = 0
            if (dist < MAGNETIC_RADIUS && dist > 0) {
              const force = (1 - dist / MAGNETIC_RADIUS) * 11
              mx2 = (dx / dist) * force
              my2 = (dy / dist) * force
            }
            
            // Cộng thêm floatX vào tọa độ tiếp theo của X
            const nextX = star.baseX + floatX + mx2
            const nextY = star.baseY + floatY + my2

            const mouseDist = Math.hypot(nextX - mx, nextY - my)
            if (mouseDist < minDist) {
              minDist = mouseDist
              closestIdx = i
            }

            return { ...star, x: nextX, y: nextY }
          })
        })
        setHoveredStar((prevHovered) => (prevHovered !== closestIdx ? closestIdx : prevHovered))
      } else {
        // TRÊN MOBILE: Đóng băng tính toán chuột, bổ sung floatX đồng bộ chuyển động xoay tròn
        setStars((prev) => {
          if (prev.length === 0) return prev
          return prev.map((star) => {
            // ─── THÊM FLOAT X CHO MOBILE ───
            const floatX = Math.cos(t * star.floatSpeed + star.floatOffset) * 3
            const floatY = Math.sin(t * star.floatSpeed + star.floatOffset) * 5
            
            return { ...star, x: star.baseX + floatX, y: star.baseY + floatY }
          })
        })
      }

      frame = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frame)
  }, [isMobile, smoothMouseX, smoothMouseY])

  const getMemory = (idx: number): MemoryItem =>
    MEMORIES[idx] || { image: getFallbackImage(idx), caption: '' }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 overflow-hidden"
      onClick={() => { if (isMobile) setHoveredStar(null) }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {isClient && stars.map((star, idx) => {
          const isHovered = hoveredStar === idx
          const memory = getMemory(idx)
          return (
            <motion.div
              key={star.id}
              className="absolute cursor-pointer"
              style={{ left: star.x, top: star.y, transform: 'translate(-50%,-50%)' }}
              // NÂNG CẤP XỬ LÝ CLICK:
              onClick={(e) => {
                e.stopPropagation() // Ngăn nổi bọt lệnh click-away của container bọc ngoài
                if (isMobile) {
                  if (hoveredStar === idx) {
                    // Chạm lần 2: Mở bung Modal chi tiết
                    setSelectedStar(idx)
                  } else {
                    // Chạm lần 1: Kích hoạt hiệu ứng sáng sao, lên line Canvas và hiện ảnh preview
                    setHoveredStar(idx)
                  }
                } else {
                  setSelectedStar(idx)
                }
              }}
            >
              <motion.div
                className="relative flex items-center justify-center"
                animate={{
                  scale: isHovered ? 2.2 : [1, 1.15, 0.95, 1],
                  opacity: isHovered ? 1 : [0.65, 0.9, 0.75, 0.65],
                  rotate: isHovered ? 90 : 0, // Xoay nhẹ góc tạo hiệu ứng khúc xạ ánh sáng khi chọn
                }}
                transition={{
                  duration: isHovered ? 0.35 : 4,
                  repeat: isHovered ? 0 : Infinity,
                  delay: (idx * 0.15) % 2,
                  ease: 'easeInOut',
                }}
                style={{ width: star.baseSize, height: star.baseSize }}
              >
                {/* Lớp 1: Hào quang Aura mờ ảo phía sau giúp ngôi sao tách biệt khỏi nền trời */}
                <motion.div
                  className="absolute rounded-full pointer-events-none blur-[3px]"
                  animate={{
                    scale: isHovered ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ repeat: isHovered ? Infinity : 0, duration: 1.8 }}
                  style={{
                    inset: -(star.baseSize * 0.7),
                    background: 'radial-gradient(circle, rgba(255,205,235,0.7) 0%, rgba(255,145,200,0.15) 50%, transparent 100%)',
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,150,200,0.5))' : 'none'
                  }}
                />

                {/* Lớp 2: Ngôi sao 4 cánh nhọn chuẩn hình học sắc nét bằng SVG vẽ vector */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
                  style={{ fill: isHovered ? '#fff0f8' : '#ffffff' }}
                >
                  {/* Toạ độ vẽ chòm sao 4 góc nhọn lofi */}
                  <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2Z" />
                </svg>
                
                {/* Lớp 3: Tia chớp phụ góc 45 độ (Chỉ bừng lên lấp lánh khi ngôi sao được Hover/Focus) */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.svg
                      viewBox="0 0 24 24"
                      className="absolute w-1/2 h-1/2 fill-white/80"
                      style={{ transform: 'rotate(45deg)' }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0.6, 1.1, 0.6], opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    >
                      <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2Z" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.div>
              <AnimatePresence>
                {/* SỬA ĐIỀU KIỆN: Bỏ !isMobile để cho phép điện thoại render ảnh nhỏ xem trước */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ duration: 0.22 }}
                    className="absolute pointer-events-none"
                    // TỐI ƯU RESPONSIVE: Trên mobile, đưa ảnh căn giữa đặt thẳng đứng lên trên ngôi sao (cách 165px) để ngón tay chạm không che mất ảnh
                    style={{ 
                      left: isMobile ? '50%' : 18, 
                      top: isMobile ? -165 : -18, 
                      transform: isMobile ? 'translateX(-50%)' : 'none',
                      zIndex: 30 
                    }}
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
              // THAY ĐỔI: Sử dụng w-fit và max-w linh hoạt thay vì max-w-xl cố định
              className="relative mx-4 p-6 text-center w-fit max-w-[calc(100vw-32px)] sm:max-w-[460px]"
              style={{
                background: 'rgba(45,20,48,0.72)',
                backdropFilter: 'blur(26px)',
                border: '1px solid rgba(255,175,220,0.18)',
                borderRadius: 22,
                boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
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
                  zIndex: 10,
                }}
              >
                <X size={16} />
              </motion.button>

              <PreloadedImage
                src={getMemory(selectedStar).image}
                alt={getMemory(selectedStar).caption}
                fallbackIdx={selectedStar}
                className="mx-auto overflow-hidden flex items-center justify-center"
                objectFit="contain"
                // THAY ĐỔI: Bỏ hoàn toàn aspectRatio: '4/3'. Hãy để khung tự co giãn theo ảnh gốc
                style={{
                  maxHeight: '62vh',
                  maxWidth: '100%',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  background: 'rgba(20, 10, 25, 0.3)',
                }}
                // THAY ĐỔI: Ép thẻ img thực tế chạy theo tỉ lệ gốc (auto) và giới hạn chiều cao an toàn
                imgStyle={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '62vh',
                }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="mt-5 w-full"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.2rem, 3.8vw, 1.6rem)', // Thu nhỏ nhẹ font size để cân bằng với ảnh dọc
                  color: 'hsl(318 40% 90%)',
                  lineHeight: 1.4,
                  wordBreak: 'break-word'
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Tải toàn bộ ảnh trong MEMORIES cùng một lúc vào bộ nhớ đệm của trình duyệt
    MEMORIES.forEach((memory) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = memory.image
    })
  }, [])

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
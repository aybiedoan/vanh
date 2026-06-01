'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { MEMORIES, getFallbackImage, type MemoryItem } from '@/data/showroom-data'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateStars(count: number, width: number, height: number): Star[] {
  const padding = 80
  const stars: Star[] = []

  for (let i = 0; i < count; i++) {
    const x = padding + Math.random() * (width - padding * 2)
    const y = padding + Math.random() * (height - padding * 2)
    stars.push({
      id: i,
      x,
      y,
      baseX: x,
      baseY: y,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.4 + Math.random() * 0.4,
    })
  }

  return stars
}

function getNearest(stars: Star[], idx: number, count: number): number[] {
  const star = stars[idx]
  const distances = stars
    .map((s, i) => ({ i, d: Math.hypot(s.baseX - star.baseX, s.baseY - star.baseY) }))
    .filter((d) => d.i !== idx)
    .sort((a, b) => a.d - b.d)

  return distances.slice(0, count).map((d) => d.i)
}

// ─── Stardust Particles in Modal ──────────────────────────────────────────────

function ModalStardust() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: `hsla(${220 + Math.random() * 40}, 70%, 80%, ${0.4 + Math.random() * 0.4})`,
            left: `${Math.random() * 100}%`,
            top: -10,
          }}
          animate={{
            y: ['0%', '110%'],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// ─── Typewriter Text ──────────────────────────────────────────────────────────

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let idx = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (idx < text.length) {
          setDisplayed(text.slice(0, idx + 1))
          idx++
        } else {
          clearInterval(interval)
        }
      }, 40)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-6 ml-1 align-middle"
        style={{
          background: 'hsl(220 50% 70%)',
          display: displayed.length >= text.length ? 'none' : 'inline-block',
        }}
      />
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Showroom({ onBack }: { onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [stars, setStars] = useState<Star[]>([])
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [selectedStar, setSelectedStar] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  const TOTAL = MEMORIES.length
  const MAGNETIC_RADIUS = 60

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setDimensions({ width: w, height: h })
      setStars(generateStars(TOTAL, w, h))
      setIsMobile(w < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Nearest neighbors cache
  const nearestCache = useMemo(() => {
    const cache: Record<number, number[]> = {}
    stars.forEach((_, i) => {
      cache[i] = getNearest(stars, i, 3)
    })
    return cache
  }, [stars])

  // Canvas animation for background stars and constellation lines
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Background twinkling stars
    const bgStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      r: Math.random() * 1.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      frameRef.current++
      const t = frameRef.current * 0.015

      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Night sky gradient
      const bg = ctx.createLinearGradient(0, 0, 0, dimensions.height)
      bg.addColorStop(0, '#0a0a1a')
      bg.addColorStop(0.3, '#0d1025')
      bg.addColorStop(0.6, '#121530')
      bg.addColorStop(1, '#1a1a35')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Subtle nebula effect
      const nebulaGrad = ctx.createRadialGradient(
        dimensions.width * 0.7,
        dimensions.height * 0.3,
        0,
        dimensions.width * 0.7,
        dimensions.height * 0.3,
        dimensions.width * 0.5
      )
      nebulaGrad.addColorStop(0, 'rgba(60, 40, 100, 0.15)')
      nebulaGrad.addColorStop(0.5, 'rgba(40, 30, 80, 0.08)')
      nebulaGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = nebulaGrad
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Twinkling background stars
      bgStars.forEach((s) => {
        const alpha = 0.3 + 0.5 * Math.sin(t + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,210,255,${alpha})`
        ctx.fill()
      })

      // Constellation lines on hover
      if (hoveredStar !== null && stars[hoveredStar]) {
        const fromStar = stars[hoveredStar]
        const nearest = nearestCache[hoveredStar] || []

        nearest.forEach((ni) => {
          const toStar = stars[ni]
          if (!toStar) return

          const grad = ctx.createLinearGradient(fromStar.x, fromStar.y, toStar.x, toStar.y)
          grad.addColorStop(0, 'rgba(150,180,255,0.6)')
          grad.addColorStop(1, 'rgba(180,200,255,0.2)')

          ctx.beginPath()
          ctx.moveTo(fromStar.x, fromStar.y)
          ctx.lineTo(toStar.x, toStar.y)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1
          ctx.shadowColor = 'rgba(150,180,255,0.5)'
          ctx.shadowBlur = 6
          ctx.stroke()
          ctx.shadowBlur = 0
        })
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [dimensions, hoveredStar, nearestCache, stars])

  // Update star positions with floating + magnetic effect
  useEffect(() => {
    let animFrame: number

    const animate = () => {
      const t = performance.now() * 0.001
      const mx = smoothMouseX.get()
      const my = smoothMouseY.get()

      setStars((prev) =>
        prev.map((star) => {
          // Floating animation
          const floatY = Math.sin(t * star.floatSpeed + star.floatOffset) * 6

          // Magnetic effect
          const dx = mx - star.baseX
          const dy = my - star.baseY
          const dist = Math.hypot(dx, dy)

          let magnetX = 0
          let magnetY = 0

          if (dist < MAGNETIC_RADIUS && dist > 0) {
            const force = (1 - dist / MAGNETIC_RADIUS) * 12
            magnetX = (dx / dist) * force
            magnetY = (dy / dist) * force
          }

          return {
            ...star,
            x: star.baseX + magnetX,
            y: star.baseY + floatY + magnetY,
          }
        })
      )

      animFrame = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animFrame)
  }, [smoothMouseX, smoothMouseY])

  // Check hover state
  useEffect(() => {
    if (isMobile) return

    const mx = smoothMouseX.get()
    const my = smoothMouseY.get()

    let closest: number | null = null
    let minDist = 30 // hover threshold

    stars.forEach((star, i) => {
      const d = Math.hypot(star.x - mx, star.y - my)
      if (d < minDist) {
        minDist = d
        closest = i
      }
    })

    setHoveredStar(closest)
  }, [stars, smoothMouseX, smoothMouseY, isMobile])

  const handleStarClick = (idx: number) => {
    setSelectedStar(idx)
  }

  const closeModal = () => {
    setSelectedStar(null)
  }

  const getMemory = (idx: number): MemoryItem => {
    return MEMORIES[idx] || { image: getFallbackImage(idx), caption: '' }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: 'var(--font-body)', cursor: 'default' }}
    >
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Star Nodes */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {stars.map((star, idx) => {
          const isHovered = hoveredStar === idx
          const memory = getMemory(idx)

          return (
            <motion.div
              key={star.id}
              className="absolute cursor-pointer"
              style={{
                left: star.x,
                top: star.y,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleStarClick(idx)}
              onTap={() => handleStarClick(idx)}
            >
              {/* Star glow */}
              <motion.div
                className="rounded-full"
                animate={{
                  scale: isHovered ? 1.6 : 1,
                  boxShadow: isHovered
                    ? '0 0 20px 8px rgba(200,220,255,0.9), 0 0 40px 16px rgba(150,180,255,0.5)'
                    : '0 0 12px 4px rgba(200,220,255,0.6)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: 10,
                  height: 10,
                  background: 'white',
                }}
              />

              {/* Hover Preview (desktop only) */}
              <AnimatePresence>
                {isHovered && !isMobile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.25 }}
                    className="absolute pointer-events-none"
                    style={{
                      left: 20,
                      top: -20,
                      zIndex: 30,
                    }}
                  >
                    <div
                      className="overflow-hidden"
                      style={{
                        width: 128,
                        height: 160,
                        borderRadius: 12,
                        background: 'rgba(30,40,80,0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(150,180,255,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    >
                      <img
                        src={memory.image}
                        alt={memory.caption}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement
                          t.src = getFallbackImage(idx)
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Back Button */}
      <motion.button
        onClick={onBack}
        whileHover={{ x: -4 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 left-6 flex items-center gap-2"
        style={{
          background: 'rgba(30,40,80,0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(150,180,255,0.2)',
          borderRadius: 40,
          padding: '8px 18px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'hsl(220 70% 85%)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 50,
        }}
      >
        <ArrowLeft size={14} />
        <span>Trở về trạm tiếp sức</span>
      </motion.button>

      {/* Cinematic Postcard Modal */}
      <AnimatePresence>
        {selectedStar !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 100,
              background: 'rgba(5,10,25,0.9)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={closeModal}
          >
            {/* Ripple effect origin */}
            <motion.div
              initial={{
                scale: 0,
                opacity: 0.8,
              }}
              animate={{
                scale: 4,
                opacity: 0,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(150,180,255,0.4) 0%, transparent 70%)',
                left: stars[selectedStar]?.x || '50%',
                top: stars[selectedStar]?.y || '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Stardust particles */}
            <ModalStardust />

            {/* Postcard */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 18,
              }}
              className="relative max-w-2xl w-full mx-4 p-6 text-center"
              style={{
                background: 'rgba(20,30,60,0.7)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(150,180,255,0.2)',
                borderRadius: 24,
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                onClick={closeModal}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(50,60,100,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(150,180,255,0.2)',
                  color: 'hsl(220 60% 80%)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </motion.button>

              {/* Image */}
              <div
                className="mx-auto overflow-hidden"
                style={{
                  width: '100%',
                  maxWidth: 400,
                  aspectRatio: '4/3',
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={getMemory(selectedStar).image}
                  alt={getMemory(selectedStar).caption}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = getFallbackImage(selectedStar)
                  }}
                />
              </div>

              {/* Caption with typewriter */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 4.5vw, 2.2rem)',
                  color: 'hsl(220 50% 90%)',
                  lineHeight: 1.4,
                }}
              >
                <TypewriterText text={getMemory(selectedStar).caption} delay={400} />
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

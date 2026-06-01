'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const CAPTIONS = [
  'Ngày xửa ngày xưa khóc nhè...',
  'Bé con tập đi, vấp ngã, lại đứng dậy.',
  'Lần đầu cắp sách đến trường, mắt tròn xoe.',
  'Góc nhỏ ôn bài, ánh đèn vàng, tách trà còn ấm.',
  'Mưa tầm tã, hai đứa trú dưới mái hiên cùng cười.',
  'Bài kiểm tra đầu tiên — hồi hộp đến mất ngủ.',
  'Chiều hè oi bức, vẫn ngồi ôn bài cần mẫn.',
  'Khoảnh khắc bất chợt ngước nhìn bầu trời xanh.',
  'Chụp ảnh nhóm trước kỳ thi, ai cũng nở nụ cười.',
  'Tối khuya một mình, nhưng không bao giờ thực sự cô đơn.',
  'Những trang vở chữ nhỏ li ti, mỗi chữ là một ước mơ.',
  'Nụ cười sau khi nhận điểm tốt đầu tiên.',
  'Mùa hoa phượng nở đỏ rực, bỗng thấy thời gian qua nhanh.',
  'Đứng trước bảng thông báo, tim đập rộn ràng.',
  'Buổi học cuối cùng, ai cũng lặng im một chút.',
  'Áo dài trắng bay trong gió, đẹp đến nghẹn ngào.',
  'Đêm trước kỳ thi lớn — trời trong, lòng bình yên.',
  'Sáng sớm ra đi, theo mình là cả một trời hi vọng.',
  'Khoảnh khắc nhìn lại, nhận ra mình đã đi xa đến vậy.',
  'Giờ đã thành thiếu nữ sắp vượt vũ môn...',
]

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
  const padding = 60
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
      floatSpeed: 0.5 + Math.random() * 0.5,
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
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `hsla(${280 + Math.random() * 60}, 60%, 80%, ${0.4 + Math.random() * 0.4})`,
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
          background: 'hsl(280 50% 50%)',
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

  const TOTAL = 20
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
    const bgStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      frameRef.current++
      const t = frameRef.current * 0.015

      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, dimensions.height)
      bg.addColorStop(0, '#feeaf2')
      bg.addColorStop(0.5, '#f3e8ff')
      bg.addColorStop(1, '#e0e7ff')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Twinkling background stars
      bgStars.forEach((s) => {
        const alpha = 0.25 + 0.35 * Math.sin(t + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,140,220,${alpha})`
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
          grad.addColorStop(0, 'rgba(200,150,255,0.6)')
          grad.addColorStop(1, 'rgba(220,180,255,0.2)')

          ctx.beginPath()
          ctx.moveTo(fromStar.x, fromStar.y)
          ctx.lineTo(toStar.x, toStar.y)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1
          ctx.shadowColor = 'rgba(200,140,255,0.5)'
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
                    ? '0 0 20px 8px rgba(255,255,255,0.8), 0 0 40px 16px rgba(200,150,255,0.5)'
                    : '0 0 12px 4px rgba(255,255,255,0.5)',
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
                        background: 'rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      }}
                    >
                      <img
                        src={`/assets/img/pic${idx + 1}.jpg`}
                        alt={CAPTIONS[idx]}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement
                          t.src = `https://picsum.photos/seed/lofi${idx + 1}/256/320`
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
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(200,140,255,0.25)',
          borderRadius: 40,
          padding: '8px 18px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'hsl(270 50% 35%)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(180,120,240,0.15)',
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
              background: 'rgba(30,20,40,0.85)',
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
                background: 'radial-gradient(circle, rgba(200,150,255,0.4) 0%, transparent 70%)',
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
                background: 'rgba(255,255,255,0.3)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 24,
                boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
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
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'hsl(280 40% 40%)',
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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src={`/assets/img/pic${selectedStar + 1}.jpg`}
                  alt={CAPTIONS[selectedStar]}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = `https://picsum.photos/seed/lofi${selectedStar + 1}/800/600`
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
                  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                  color: 'hsl(280 30% 15%)',
                  lineHeight: 1.4,
                }}
              >
                <TypewriterText text={CAPTIONS[selectedStar]} delay={400} />
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

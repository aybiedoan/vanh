'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

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

const TOTAL = 20

// Pre-computed star node positions (relative, 0-1 for x, absolute px offset for y in scroll space)
// Spread diagonally across a deep vertical canvas
const NODE_POSITIONS: { x: number }[] = [
  { x: 0.3 }, { x: 0.65 }, { x: 0.2 }, { x: 0.72 }, { x: 0.45 },
  { x: 0.18 }, { x: 0.6 },  { x: 0.35 }, { x: 0.75 }, { x: 0.25 },
  { x: 0.55 }, { x: 0.15 }, { x: 0.68 }, { x: 0.38 }, { x: 0.78 },
  { x: 0.22 }, { x: 0.62 }, { x: 0.42 }, { x: 0.3 },  { x: 0.5 },
]

const SECTION_HEIGHT = 500 // px per node in the scroll canvas

// ─── Sub-components ───────────────────────────────────────────────────────────

type ConfettiPiece = {
  id: number; x: number; color: string; size: number; delay: number; duration: number
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  useEffect(() => {
    const colors = ['#ffb7c5', '#ffd6e0', '#c8b6e2', '#a8d8ea', '#ffeaa7', '#fdcb6e', '#e8b4d8']
    setPieces(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[i % colors.length],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 3,
        duration: Math.random() * 4 + 4,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1 }}
          animate={{ y: '110vh', opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'fixed',
            top: 0,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}

function StarCaption({ text, active }: { text: string; active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            color: 'hsl(280 50% 55%)',
            textShadow: '0 0 20px hsl(280 50% 60% / 0.5)',
            lineHeight: 1.3,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

// ─── Constellation Canvas ─────────────────────────────────────────────────────

function ConstellationCanvas({
  progress,
  containerHeight,
}: {
  progress: number
  containerHeight: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([])
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)

  // Absolute Y center of each node
  const nodeYs = Array.from({ length: TOTAL }, (_, i) => (i + 0.5) * SECTION_HEIGHT)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    // Scatter background stars
    starsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [containerHeight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    const totalScroll = TOTAL * SECTION_HEIGHT
    const scrollOffset = progress * (totalScroll - H)

    // How many connections are drawn (0 to TOTAL-1)
    const linesDrawn = progress * (TOTAL - 1)

    const draw = () => {
      frameRef.current++
      ctx.clearRect(0, 0, W, H)

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#feeaf2')
      bg.addColorStop(0.5, '#f3e8ff')
      bg.addColorStop(1, '#e0e7ff')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const t = frameRef.current * 0.02

      // Background twinkling stars
      starsRef.current.forEach((s) => {
        const alpha = 0.3 + 0.4 * Math.sin(t + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,140,220,${alpha})`
        ctx.fill()
      })

      // Draw constellation lines
      for (let i = 0; i < TOTAL - 1; i++) {
        const fromX = NODE_POSITIONS[i].x * W
        const fromY = nodeYs[i] - scrollOffset
        const toX = NODE_POSITIONS[i + 1].x * W
        const toY = nodeYs[i + 1] - scrollOffset

        const segProgress = Math.max(0, Math.min(1, linesDrawn - i))
        if (segProgress <= 0) break

        const curX = fromX + (toX - fromX) * segProgress
        const curY = fromY + (toY - fromY) * segProgress

        // Glowing line
        const grad = ctx.createLinearGradient(fromX, fromY, curX, curY)
        grad.addColorStop(0, 'rgba(180,120,220,0.35)')
        grad.addColorStop(1, 'rgba(220,160,255,0.75)')

        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        ctx.lineTo(curX, curY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.shadowColor = 'rgba(200,140,255,0.6)'
        ctx.shadowBlur = 8
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Draw node star points
      for (let i = 0; i < TOTAL; i++) {
        const nx = NODE_POSITIONS[i].x * W
        const ny = nodeYs[i] - scrollOffset

        // Only render if in view range
        if (ny < -60 || ny > H + 60) continue

        const nodeProgress = Math.max(0, Math.min(1, linesDrawn - i + 1))
        if (nodeProgress <= 0) continue

        const pulse = 0.7 + 0.3 * Math.sin(t * 2 + i)
        const r = 3 * nodeProgress * pulse

        // Glow
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 4)
        grd.addColorStop(0, `rgba(220,170,255,${0.7 * nodeProgress})`)
        grd.addColorStop(1, 'rgba(220,170,255,0)')
        ctx.beginPath()
        ctx.arc(nx, ny, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(nx, ny, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,240,255,${nodeProgress})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [progress, containerHeight, nodeYs])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Showroom({ onBack }: { onBack: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [containerH, setContainerH] = useState(800)

  const totalScroll = TOTAL * SECTION_HEIGHT

  // Track scroll → progress
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      const p = maxScroll > 0 ? el.scrollTop / maxScroll : 0
      setScrollProgress(p)

      // Which node is in the center 40% of viewport
      const scrollOffset = p * (totalScroll - el.clientHeight)
      const viewCenter = scrollOffset + el.clientHeight * 0.5
      const nodeYs = Array.from({ length: TOTAL }, (_, i) => (i + 0.5) * SECTION_HEIGHT)

      let closest = -1
      let minDist = el.clientHeight * 0.25
      nodeYs.forEach((ny, i) => {
        const dist = Math.abs(ny - viewCenter)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })

      setActiveIdx(closest)
      if (closest === TOTAL - 1) setShowConfetti(true)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    setContainerH(el.clientHeight)
    return () => el.removeEventListener('scroll', onScroll)
  }, [totalScroll])

  const isLast = activeIdx === TOTAL - 1

  // Node absolute positions
  const nodeYs = Array.from({ length: TOTAL }, (_, i) => (i + 0.5) * SECTION_HEIGHT)

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>
      {showConfetti && <Confetti />}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-scroll no-scrollbar"
        style={{ zIndex: 2 }}
      >
        {/* Tall scroll canvas */}
        <div className="relative" style={{ height: totalScroll }}>
          {/* Constellation background canvas — sticky */}
          <div className="sticky top-0 left-0 w-full pointer-events-none" style={{ height: '100vh', zIndex: 0 }}>
            <ConstellationCanvas progress={scrollProgress} containerHeight={containerH} />
          </div>

          {/* Memory nodes — absolutely positioned in scroll space */}
          {nodeYs.map((ny, idx) => {
            const isActive = idx === activeIdx
            const isPassed = idx < activeIdx
            const isLastItem = idx === TOTAL - 1
            const nx = NODE_POSITIONS[idx].x

            // Caption side: left if node is on right half, right if on left
            const captionSide = nx > 0.5 ? 'right' : 'left'

            return (
              <div
                key={idx}
                className="absolute w-full flex"
                style={{
                  top: ny - SECTION_HEIGHT * 0.5,
                  height: SECTION_HEIGHT,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Node container — positioned by x fraction */}
                <div
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${nx * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Caption */}
                  <div
                    className="absolute"
                    style={{
                      [captionSide === 'right' ? 'right' : 'left']: '100%',
                      [captionSide === 'right' ? 'marginRight' : 'marginLeft']: 24,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 280,
                      textAlign: captionSide === 'right' ? 'right' : 'left',
                    }}
                  >
                    {!isLastItem && <StarCaption text={CAPTIONS[idx]} active={isActive} />}
                  </div>

                  {/* Memory circle / star */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1 : isPassed ? 0.55 : 0.2,
                      opacity: isActive ? 1 : isPassed ? 0.65 : 0,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="relative overflow-hidden"
                    style={{
                      width: isLastItem ? 240 : 180,
                      height: isLastItem ? 240 : 180,
                      borderRadius: '50%',
                      boxShadow: isActive
                        ? '0 0 0 3px rgba(200,140,255,0.6), 0 0 40px rgba(200,140,255,0.35), 0 16px 60px rgba(120,60,160,0.3)'
                        : '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                  >
                    <img
                      src={`/assets/img/pic${idx + 1}.jpg`}
                      alt={CAPTIONS[idx]}
                      style={{
                        width: '110%',
                        height: '110%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: '-5%',
                        left: '-5%',
                        filter: isActive ? 'none' : 'grayscale(40%)',
                        transition: 'filter 0.5s ease',
                      }}
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.src = `https://picsum.photos/seed/lofi${idx + 1}/480/480`
                      }}
                    />
                    {/* Soft overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(240,220,255,0.3))',
                        borderRadius: '50%',
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grand Finale overlay (node 20) */}
      <AnimatePresence>
        {isLast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-16 pointer-events-none"
            style={{ zIndex: 30, height: '50vh' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              className="text-center px-8"
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                  color: 'hsl(270 60% 30%)',
                  lineHeight: 1.3,
                  textShadow: '0 2px 20px rgba(200,140,255,0.3)',
                }}
              >
                Đứa trẻ ngày nào giờ đã sẵn sàng đi chinh phục thế giới.
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="mt-4 font-semibold"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  color: 'hsl(280 40% 40%)',
                }}
              >
                Tự tin lên, anh luôn ở phía sau em! Thi tốt nhé cô bé! 👑🤍
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed UI Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
        {/* Back button */}
        <motion.button
          onClick={onBack}
          whileHover={{ x: -4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-6 left-6 flex items-center gap-2 pointer-events-auto"
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
          }}
        >
          <ArrowLeft size={14} />
          <span>Trở về</span>
        </motion.button>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-balance text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 3vw, 2.4rem)',
            color: 'hsl(290 55% 42%)',
            textShadow: '0 0 30px rgba(200,140,255,0.4)',
          }}
        >
          Hành trình 20 ngôi sao ✨
        </motion.h1>

        {/* Scroll hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollProgress > 0.02 ? 0 : 0.45 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-body)', color: 'hsl(280 40% 45%)' }}
        >
          cuộn xuống để khám phá ↓
        </motion.p>
      </div>
    </div>
  )
}

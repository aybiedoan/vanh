'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const CAPTIONS = [
  'Ngày đầu tiên bước vào trường, mắt tròn xoe nhìn tất cả.',
  'Góc nhỏ ôn bài, ánh đèn vàng, tách trà còn ấm.',
  'Mưa tầm tã, hai đứa trú dưới mái hiên cùng cười.',
  'Bài kiểm tra đầu tiên — hồi hộp đến mất ngủ.',
  'Chiều hè oi bức, nhưng vẫn ngồi ôn bài cần mẫn.',
  'Khoảnh khắc bất chợt ngước nhìn bầu trời xanh.',
  'Chụp ảnh nhóm trước kỳ thi, ai cũng nở nụ cười.',
  'Tối khuya một mình, nhưng không bao giờ thực sự cô đơn.',
  'Những trang vở chữ nhỏ li ti, mỗi chữ là một ước mơ.',
  'Nụ cười sau khi nhận điểm tốt đầu tiên.',
  'Mùa hoa phượng nở đỏ rực, bỗng thấy thời gian qua nhanh.',
  'Đứng trước bảng thông báo, tim đập rộn ràng.',
  'Buổi học cuối cùng, ai cũng lặng im một chút.',
  'Áo dài trắng bay trong gió, đẹp đến nghẹn ngào.',
  'Cùng nhau chia sẻ từng câu hỏi khó.',
  'Đêm trước kỳ thi lớn — trời trong, lòng bình yên.',
  'Sáng sớm ra đi, theo mình là cả một trời hi vọng.',
  'Từng bước chân qua cổng trường — mỗi bước đều có giá trị.',
  'Khoảnh khắc nhìn lại, bỗng nhận ra mình đã đi xa đến vậy.',
  'Hôm nay — cô bé ngày nào đã sẵn sàng chinh phục thế giới.',
]

const ITEM_WIDTH = 340
const ITEM_GAP = 40

type ConfettiPiece = {
  id: number; x: number; color: string; size: number; rotation: number; delay: number; duration: number
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  useEffect(() => {
    const colors = ['#ffb7c5','#ffd6e0','#c8b6e2','#a8d8ea','#ffeaa7','#fdcb6e']
    setPieces(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 3,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotation }}
          animate={{ y: '110vh', rotate: p.rotation + 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'fixed',
            top: 0,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}

function LetterByLetter({ text, active }: { text: string; active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center mt-3"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            color: 'hsl(320 40% 35%)',
            letterSpacing: '0.02em',
          }}
        >
          {text.split('').map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.3 }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export default function Showroom({ onBack }: { onBack: () => void }) {
  const [centerIdx, setCenterIdx] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  const totalItems = CAPTIONS.length
  const totalWidth = totalItems * (ITEM_WIDTH + ITEM_GAP)
  const viewportRef = useRef(0)

  useEffect(() => {
    viewportRef.current = window.innerWidth
  }, [])

  // Convert scroll x position to center index
  const updateCenterIdx = useCallback((xVal: number) => {
    const vw = viewportRef.current || window.innerWidth
    const offset = -xVal + vw / 2
    const idx = Math.round((offset - ITEM_WIDTH / 2) / (ITEM_WIDTH + ITEM_GAP))
    const clamped = Math.max(0, Math.min(totalItems - 1, idx))
    setCenterIdx(clamped)
    if (clamped === totalItems - 1) setShowConfetti(true)
  }, [totalItems])

  // Wheel → horizontal scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const vw = window.innerWidth
      const minX = -(totalWidth - vw) - 80
      const maxX = 80
      const current = x.get()
      const next = Math.max(minX, Math.min(maxX, current - e.deltaY * 1.2))
      animate(x, next, { type: 'spring', stiffness: 180, damping: 30 })
      updateCenterIdx(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [x, totalWidth, updateCenterIdx])

  // Touch swipe
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0

    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const vw = window.innerWidth
      const delta = startX - e.touches[0].clientX
      startX = e.touches[0].clientX
      const minX = -(totalWidth - vw) - 80
      const next = Math.max(minX, Math.min(80, x.get() - delta))
      animate(x, next, { type: 'spring', stiffness: 200, damping: 30 })
      updateCenterIdx(next)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [x, totalWidth, updateCenterIdx])

  const isLast = centerIdx === totalItems - 1

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col"
      style={{ background: '#fdf8f5', cursor: 'ew-resize' }}
    >
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="relative flex items-center justify-center pt-8 pb-4 flex-shrink-0">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -4 }}
          className="absolute left-8 flex items-center gap-1.5 opacity-50 hover:opacity-90 transition-opacity"
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'hsl(320 50% 30%)' }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </motion.button>
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-balance text-center px-20"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
            color: 'hsl(332 80% 55%)',
          }}
        >
          Hành trình trưởng thành của cô bé &quot;còn nhỏ&quot; 🤍
        </motion.h1>
      </div>

      {/* Gallery */}
      <div className="flex-1 flex items-center overflow-hidden">
        <motion.div
          className="flex items-center"
          style={{ x, gap: ITEM_GAP, paddingLeft: `calc(50vw - ${ITEM_WIDTH / 2}px)`, paddingRight: 160 }}
        >
          {CAPTIONS.map((caption, idx) => {
            const isCenter = idx === centerIdx
            const isLastItem = idx === totalItems - 1

            return (
              <div
                key={idx}
                className="flex-shrink-0 flex flex-col items-center"
                style={{ width: ITEM_WIDTH }}
              >
                {/* Image container with parallax */}
                <motion.div
                  animate={{
                    scale: isCenter ? 1 : 0.85,
                    filter: isCenter ? 'grayscale(0%) blur(0px)' : 'grayscale(70%) blur(1.5px)',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    width: ITEM_WIDTH,
                    height: isLastItem ? 420 : 340,
                    boxShadow: isCenter ? '0 16px 60px rgba(200,100,130,0.18)' : '0 6px 20px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Parallax img */}
                  <motion.img
                    src={`/assets/img/pic${idx + 1}.jpg`}
                    alt={caption}
                    style={{
                      width: '110%',
                      height: '110%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: '-5%',
                      left: '-5%',
                    }}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.src = `https://picsum.photos/seed/lofi${idx + 1}/680/680`
                    }}
                  />
                  {/* Soft overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 50%, rgba(253,248,245,0.5))',
                    }}
                  />
                  {/* Last item overlay */}
                  {isLastItem && isCenter && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="absolute bottom-0 inset-x-0 p-6 text-center"
                      style={{ background: 'linear-gradient(to top, rgba(253,248,245,0.92), transparent)' }}
                    >
                      <p
                        className="leading-snug"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                          color: 'hsl(320 60% 25%)',
                        }}
                      >
                        Đứa trẻ ngày nào giờ đã sẵn sàng đi chinh phục thế giới.
                      </p>
                      <p
                        className="mt-2 text-sm"
                        style={{ fontFamily: 'var(--font-body)', color: 'hsl(320 40% 40%)' }}
                      >
                        Tự tin lên, anh luôn ở phía sau em! Thi tốt nhé cô bé!
                      </p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Caption */}
                <div className="h-8 flex items-start">
                  <LetterByLetter text={caption} active={isCenter && !isLastItem} />
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 1 }}
        className="text-center pb-6 text-xs tracking-widest uppercase flex-shrink-0"
        style={{ fontFamily: 'var(--font-body)', color: 'hsl(320 40% 45%)' }}
      >
        cuộn chuột hoặc vuốt để khám phá →
      </motion.p>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LETTERS = [
  'Cố lên nhé, anh tin em sẽ làm được mà.',
  'Từng trang sách em học là một bước tiến đến tương lai rực rỡ.',
  'Áp lực là dấu hiệu của sự trưởng thành, em đang lớn lên đấy',
  'Hít thở sâu đi nha. Mọi thứ rồi sẽ ổn thôi, anh hứa.',
  'Em học chăm chỉ lắm rồi. Bây giờ cứ tin vào chính mình.',
  'Đừng so sánh mình với ai khác. Em có cuộc đời của riêng mình.',
  'Một ngày nào đó em sẽ nhìn lại và mỉm cười với khoảnh khắc này.',
  'Cơ thể cần nghỉ ngơi, tâm trí cần yên bình, em xứng đáng có cả hai.',
  'Khó khăn không định nghĩa em. Cách em vượt qua mới là điều quan trọng.',
  'Em mạnh mẽ hơn em nghĩ rất nhiều đó.',
  'Em không cần hoàn hảo. Em chỉ cần cố gắng hết sức là đủ.',
  'Anh luôn ở đây, dù đêm muộn hay sáng sớm, cứ nhắn anh nha.',
  "Mệt rồi thì nghỉ 5 phút uống ngụm nước đi nha!",
  "Em vốn là một sự tồn tại độc nhất và rực rỡ. Đừng nghi ngờ năng lực của bản thân, sự kiên trì của em sẽ được đền đáp xứng đáng.",
  "Hít một hơi thật sâu, em làm được mà ✨",
  "Không cần hoàn hảo ngay, chỉ cần cố gắng thay đổi từng chút thôi.",
  "Hôm nay học chậm cũng không sao, mai rùi đi tiếp.",
  "Em đã đi được xa lắm rồi, đừng quên tự thưởng nha.",
  "12 năm đi học chỉ được đánh giá qua vài giờ ngắn ngủi. Vậy nên đừng bỏ cuộc",
  "Hi vọng em mãi kiên cường, đi đến cuối đường hầm sẽ thấy ánh sáng, sống cuộc đời mà mình mong ước",
  "Vũ trụ sẽ xếp những điều tốt đẹp dành cho em.",
  "Hôm nay có thể là một ngày khó khăn nhưng nó sẽ không kéo dài mãi đâu",
  "Chỉ cần em còn bước tiếp, ngày mai nhất định sẽ tốt hơn.",
  "Đề khó cỡ nào cũng đừng nản, kiểu gì em cũng phải trải qua 100 phút mà.",
  "Cười lên đi! Em cười rất xinh đó ✨",
  "Mỗi người chúng ta đều luôn so sảnh điểm yếu của bản thân với điểm mạnh của người khác, nhưng thực tế phần lớn chúng ta đều là người bình thường",
];

type Particle = {
  id: number
  x: number
  y: number
  emoji: string
  vx: number
  vy: number
}

const EMOJIS = ['❤️', '✨', '🍬', '🔋', '🌸', '💫', '🎀']

// ─── Envelope SVG Component ───────────────────────────────────────────────────

function EnvelopeSVG({
  flapOpen,
  paperY,
  showSeal,
}: {
  flapOpen: boolean
  paperY: number
  showSeal: boolean
}) {
  const W = 320
  const H = 220
  const R = 12 // corner radius

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: 'block', filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.45))' }}
      overflow="visible"
    >
      <defs>
        {/* Body gradient */}
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(340 55% 74%)" />
          <stop offset="100%" stopColor="hsl(345 52% 67%)" />
        </linearGradient>
        {/* Bottom flap gradient (slightly darker) */}
        <linearGradient id="bottomGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(338 50% 68%)" />
          <stop offset="100%" stopColor="hsl(342 52% 62%)" />
        </linearGradient>
        {/* Paper gradient */}
        <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(46 55% 97%)" />
          <stop offset="100%" stopColor="hsl(40 48% 92%)" />
        </linearGradient>
        {/* Flap back gradient (cream) */}
        <linearGradient id="flapBackGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(42 48% 94%)" />
          <stop offset="100%" stopColor="hsl(38 44% 89%)" />
        </linearGradient>
        {/* Clip for envelope body */}
        <clipPath id="envelopeClip">
          <rect x="0" y="0" width={W} height={H} rx={R} />
        </clipPath>
        {/* Clip for paper */}
        <clipPath id="paperClip">
          <rect x="20" y={paperY} width={W - 40} height={H - 10} rx="6" />
        </clipPath>
      </defs>

      {/* ── Envelope body ── */}
      <rect x="0" y="0" width={W} height={H} rx={R} fill="url(#bodyGrad)" />

      {/* ── Left inner side triangle (cream) ── */}
      <polygon
        points={`0,${H * 0.25} ${W / 2},${H * 0.65} 0,${H}`}
        fill="hsl(44 50% 93%)"
        opacity="0.85"
      />
      {/* ── Right inner side triangle (cream) ── */}
      <polygon
        points={`${W},${H * 0.25} ${W / 2},${H * 0.65} ${W},${H}`}
        fill="hsl(44 50% 93%)"
        opacity="0.85"
      />

      {/* ── Paper inside envelope ── */}
      <g clipPath="url(#envelopeClip)">
        <rect
          x="22"
          y={paperY}
          width={W - 44}
          height={H - 8}
          rx="6"
          fill="url(#paperGrad)"
        />
        {/* Ruled lines on paper */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line
            key={i}
            x1="36"
            y1={paperY + 22 + i * 17}
            x2={W - 36}
            y2={paperY + 22 + i * 17}
            stroke="hsl(220 30% 82%)"
            strokeWidth="0.8"
            opacity="0.6"
          />
        ))}
      </g>

      {/* ── Bottom front flap (V shape) ── */}
      <polygon
        points={`0,${H * 0.35} ${W / 2},${H * 0.68} ${W},${H * 0.35} ${W},${H} 0,${H}`}
        fill="url(#bottomGrad)"
        clipPath="url(#envelopeClip)"
      />
      {/* Subtle highlight on bottom flap edge */}
      <line
        x1="0" y1={H * 0.35}
        x2={W / 2} y2={H * 0.68}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />
      <line
        x1={W / 2} y1={H * 0.68}
        x2={W} y2={H * 0.35}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* ── Wax seal ── */}
      {showSeal && (
        <g>
          <circle
            cx={W / 2}
            cy={H * 0.595}
            r="20"
            fill="hsl(0 68% 48%)"
          />
          <circle
            cx={W / 2}
            cy={H * 0.595}
            r="20"
            fill="url(#sealHighlight)"
          />
          <defs>
            <radialGradient id="sealHighlight" cx="35%" cy="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {/* Heart path */}
          <text
            x={W / 2}
            y={H * 0.595 + 8}
            textAnchor="middle"
            fontSize="18"
            style={{ userSelect: 'none' }}
          >
            ❤️
          </text>
        </g>
      )}

      {/* ── Top flap (rendered last so it overlaps paper when closed) ── */}
      {/* This element is handled by the animated div below */}
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EnergyBubble() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showEnvelope, setShowEnvelope] = useState(false)
  const [stage, setStage] = useState<'closed' | 'opening' | 'open' | 'reading'>('closed')
  const [currentLetter, setCurrentLetter] = useState(LETTERS[0])
  const [hovered, setHovered] = useState(false)
  const [typedText, setTypedText] = useState('')
  const counterRef = useRef(0)

  const flapOpen = stage === 'open' || stage === 'reading'
  const paperY = stage === 'open' || stage === 'reading' ? -80 : 28
  const showSeal = stage === 'closed' || stage === 'opening'
  const letterRevealed = stage === 'reading'

  // Typing effect
  useEffect(() => {
    if (!letterRevealed) {
      setTypedText('')
      return
    }
    let idx = 0
    setTypedText('')
    const interval = setInterval(() => {
      if (idx < currentLetter.length) {
        setTypedText(currentLetter.slice(0, idx + 1))
        idx++
      } else {
        clearInterval(interval)
      }
    }, 38)
    return () => clearInterval(interval)
  }, [letterRevealed, currentLetter])

  const triggerParticles = useCallback((clientX: number, clientY: number) => {
    const count = 12
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: counterRef.current++,
      x: clientX,
      y: clientY,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      vx: (Math.random() - 0.5) * 200,
      vy: -(Math.random() * 180 + 40),
    }))
    setParticles((p) => [...p, ...newParticles])
    setTimeout(() => {
      setParticles((p) => p.filter((pk) => !newParticles.find((n) => n.id === pk.id)))
    }, 1200)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    triggerParticles(e.clientX, e.clientY)
    const idx = Math.floor(Math.random() * LETTERS.length)
    setCurrentLetter(LETTERS[idx])
    setStage('closed')
    setTypedText('')
    setTimeout(() => setShowEnvelope(true), 200)
  }

  const handleEnvelopeClick = () => {
    if (stage === 'closed') {
      setStage('opening')
      setTimeout(() => setStage('open'), 300)
    } else if (stage === 'open') {
      setStage('reading')
    }
  }

  const closeModal = () => {
    setShowEnvelope(false)
    setStage('closed')
  }

  return (
    <>
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
              animate={{ x: p.x + p.vx, y: p.y + p.vy, opacity: 0, scale: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="fixed text-xl select-none"
              style={{ transform: 'translate(-50%,-50%)' }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Button */}
      <div className="relative flex items-center justify-end">
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute right-12 whitespace-nowrap text-xs tracking-wide pointer-events-none select-none"
              style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 80% 88%)' }}
            >
              Sạc pin nhé!
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          onClick={handleClick}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.94 }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-lg cursor-pointer select-none"
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          animate={{
            boxShadow: [
              '0 0 16px hsl(332 80% 55% / 0.15)',
              '0 0 28px hsl(332 80% 55% / 0.35)',
              '0 0 16px hsl(332 80% 55% / 0.15)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          ✨
        </motion.button>
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 10000,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(70,30,55,0.88) 0%, rgba(20,10,28,0.96) 100%)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={closeModal}
          >
            {/* Ambient floating dust */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 1 + Math.random() * 2.5,
                    height: 1 + Math.random() * 2.5,
                    background: `hsla(${330 + Math.random() * 30}, 70%, 82%, ${0.25 + Math.random() * 0.3})`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{ y: [0, -24, 0], opacity: [0.25, 0.55, 0.25] }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* ── ENVELOPE STAGE ── */}
            <AnimatePresence mode="wait">
              {!letterRevealed ? (
                <motion.div
                  key="envelope-stage"
                  initial={{ scale: 0.72, opacity: 0, y: 24 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.88, opacity: 0, y: -30, transition: { duration: 0.35, ease: 'easeIn' } }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20, mass: 0.9 }}
                  className="relative flex flex-col items-center"
                  style={{ perspective: 1000 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEnvelopeClick()
                  }}
                >
                  {/* Flap — rendered as an absolutely-positioned overlay on top of the SVG */}
                  <div className="relative cursor-pointer select-none" style={{ width: 320, height: 220 }}>
                    {/* Base envelope + paper + bottom flap */}
                    <EnvelopeSVG
                      flapOpen={flapOpen}
                      paperY={paperY}
                      showSeal={showSeal}
                    />

                    {/* Top flap — 3D flip via CSS transform */}
                    <motion.div
                      className="absolute left-0 top-0 overflow-hidden pointer-events-none"
                      style={{
                        width: 320,
                        height: 220 * 0.52,
                        transformOrigin: 'top center',
                        transformStyle: 'preserve-3d',
                        zIndex: 10,
                      }}
                      animate={{ rotateX: flapOpen ? -175 : 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 45,
                        damping: 14,
                        mass: 1.1,
                      }}
                    >
                      {/* Front face (pink) */}
                      <svg
                        viewBox="0 0 320 114"
                        width={320}
                        height={114}
                        className="absolute top-0 left-0"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <defs>
                          <linearGradient id="flapFront" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(336 54% 75%)" />
                            <stop offset="100%" stopColor="hsl(342 52% 68%)" />
                          </linearGradient>
                          <clipPath id="flapClip">
                            <rect x="0" y="0" width="320" height="114" rx="12" />
                          </clipPath>
                        </defs>
                        <polygon
                          points="0,0 320,0 160,114"
                          fill="url(#flapFront)"
                          clipPath="url(#flapClip)"
                        />
                        {/* Top corners rounded */}
                        <rect x="0" y="0" width="12" height="12" rx="12" fill="url(#flapFront)" />
                        <rect x="308" y="0" width="12" height="12" rx="12" fill="url(#flapFront)" />
                        {/* Edge highlight */}
                        <line x1="0" y1="1" x2="160" y2="114" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                        <line x1="320" y1="1" x2="160" y2="114" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                      </svg>

                      {/* Back face (cream, shown when flap is open) */}
                      <svg
                        viewBox="0 0 320 114"
                        width={320}
                        height={114}
                        className="absolute top-0 left-0"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateX(180deg)',
                        }}
                      >
                        <defs>
                          <linearGradient id="flapBack" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(42 50% 94%)" />
                            <stop offset="100%" stopColor="hsl(38 44% 89%)" />
                          </linearGradient>
                        </defs>
                        <polygon points="0,0 320,0 160,114" fill="url(#flapBack)" />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Instruction hint */}
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 0.65, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-xs tracking-widest uppercase text-center"
                    style={{ fontFamily: 'var(--font-body)', color: 'hsl(330 60% 85%)' }}
                  >
                    {flapOpen ? 'chạm lần nữa để đọc thư' : 'chạm phong thư để mở'}
                  </motion.p>
                </motion.div>
              ) : (
                /* ── LETTER CARD ── */
                <motion.div
                  key="letter-card"
                  initial={{ opacity: 0, scale: 0.75, y: 40, rotateX: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 18, mass: 0.95, delay: 0.05 }}
                  className="relative flex flex-col items-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeModal()
                  }}
                >
                  <motion.div
                    className="relative flex flex-col items-center px-10 py-11 rounded-2xl overflow-hidden cursor-pointer"
                    style={{
                      width: 'clamp(300px, 86vw, 460px)',
                      background: 'linear-gradient(170deg, hsl(46 55% 97%) 0%, hsl(40 50% 94%) 50%, hsl(38 46% 91%) 100%)',
                      boxShadow: '0 0 0 1px rgba(255,220,200,0.25), 0 28px 72px rgba(0,0,0,0.38), 0 8px 32px rgba(180,90,120,0.18)',
                    }}
                    whileHover={{ scale: 1.015 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Ruled lines background */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-full"
                          style={{
                            height: 1,
                            background: 'hsla(220, 28%, 80%, 0.38)',
                            top: 52 + i * 22,
                          }}
                        />
                      ))}
                    </div>

                    {/* Corner decorations */}
                    {[
                      'top-4 left-4 border-t border-l rounded-tl-md',
                      'top-4 right-4 border-t border-r rounded-tr-md',
                      'bottom-4 left-4 border-b border-l rounded-bl-md',
                      'bottom-4 right-4 border-b border-r rounded-br-md',
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-8 h-8 opacity-20 ${cls}`}
                        style={{ borderColor: 'hsl(340 50% 60%)' }}
                      />
                    ))}

                    {/* Heart */}
                    <motion.span
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.28, type: 'spring', stiffness: 280, damping: 14 }}
                      className="mb-5 text-3xl relative z-10"
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(200,90,120,0.32))' }}
                    >
                      💌
                    </motion.span>

                    {/* Text */}
                    <p
                      className="text-center leading-relaxed relative z-10"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.25rem, 4vw, 1.65rem)',
                        color: 'hsl(325 45% 26%)',
                        lineHeight: 1.65,
                        minHeight: '3em',
                      }}
                    >
                      {typedText}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.48, repeat: Infinity }}
                        className="inline-block w-0.5 h-5 ml-1 align-middle"
                        style={{
                          background: 'hsl(340 50% 52%)',
                          display: typedText.length >= currentLetter.length ? 'none' : 'inline-block',
                        }}
                      />
                    </p>

                    {/* Signature line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.75, ease: 'easeOut' }}
                      className="mt-6 w-16 h-px origin-center relative z-10"
                      style={{ background: 'hsl(340 38% 70% / 0.45)' }}
                    />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.58, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="mt-5 text-xs tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 84%)' }}
                  >
                    chạm để đóng
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

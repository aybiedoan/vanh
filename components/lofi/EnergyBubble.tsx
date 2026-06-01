'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LETTERS = [
  'Cô bé ơi, anh tin em sẽ làm được mà.',
  'Từng trang sách em học là một bước tiến đến tương lai rực rỡ.',
  'Áp lực là dấu hiệu của sự trưởng thành — em đang lớn lên đấy.',
  'Hít thở sâu đi nha. Mọi thứ rồi sẽ ổn thôi, anh hứa.',
  'Em học chăm chỉ lắm rồi. Bây giờ cứ tin vào chính mình.',
  'Đừng so sánh mình với ai khác. Em có hành trình của riêng mình.',
  'Một ngày nào đó em sẽ nhìn lại và mỉm cười với khoảnh khắc này.',
  'Mỗi đêm thức khuya ôn bài là một viên gạch xây nên tương lai.',
  'Anh tự hào về em mỗi ngày, dù em có biết hay không.',
  'Cơ thể cần nghỉ ngơi, tâm trí cần yên bình — em xứng đáng có cả hai.',
  'Khó khăn không định nghĩa em. Cách em vượt qua mới là điều quan trọng.',
  'Cô bé nhỏ của anh, em mạnh mẽ hơn em nghĩ rất nhiều đó.',
  'Thi xong rồi mình sẽ đi ăn kem nhé, anh đãi. Cố lên nào!',
  'Em không cần hoàn hảo. Em chỉ cần cố gắng hết sức là đủ.',
  'Anh luôn ở đây, dù đêm muộn hay sáng sớm, cứ nhắn anh nha.',
]

type Particle = {
  id: number
  x: number
  y: number
  emoji: string
  vx: number
  vy: number
}

const EMOJIS = ['❤️', '✨', '🍬', '🔋', '🌸', '💫', '🎀']

export default function EnergyBubble() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showEnvelope, setShowEnvelope] = useState(false)
  const [letterRevealed, setLetterRevealed] = useState(false)
  const [currentLetter, setCurrentLetter] = useState(LETTERS[0])
  const [hovered, setHovered] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [flapOpen, setFlapOpen] = useState(false)
  const counterRef = useRef(0)

  // Typing effect for letter
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
    }, 35)

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
    setLetterRevealed(false)
    setFlapOpen(false)
    setTimeout(() => setShowEnvelope(true), 200)
  }

  const handleEnvelopeClick = () => {
    if (!flapOpen) {
      // First click: open flap
      setFlapOpen(true)
    } else if (!letterRevealed) {
      // Second click: reveal letter
      setLetterRevealed(true)
    }
  }

  const closeModal = () => {
    setShowEnvelope(false)
    setLetterRevealed(false)
    setFlapOpen(false)
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
              animate={{
                x: p.x + p.vx,
                y: p.y + p.vy,
                opacity: 0,
                scale: 0.3,
              }}
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
              Nạp năng lượng
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
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
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

      {/* Modal */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center cursor-pointer"
            style={{
              zIndex: 10000,
              background: 'radial-gradient(ellipse at center, rgba(60,30,50,0.85) 0%, rgba(25,15,30,0.95) 100%)',
              backdropFilter: 'blur(24px)',
            }}
            onClick={closeModal}
          >
            {/* Ambient floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: Math.random() * 3 + 1,
                    height: Math.random() * 3 + 1,
                    background: `hsla(${330 + Math.random() * 30}, 70%, 80%, ${0.3 + Math.random() * 0.3})`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* 3D Perspective Container */}
            <div
              className="relative"
              style={{
                perspective: '1200px',
                perspectiveOrigin: '50% 50%',
              }}
            >
              {/* Envelope Container */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotateX: -10 }}
                animate={{
                  scale: letterRevealed ? 0.8 : 1,
                  opacity: letterRevealed ? 0 : 1,
                  rotateX: letterRevealed ? 15 : 0,
                  y: letterRevealed ? 60 : 0,
                }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 20,
                  mass: 1,
                }}
                className="relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEnvelopeClick()
                }}
                style={{
                  width: 320,
                  height: 220,
                  transformStyle: 'preserve-3d',
                  pointerEvents: letterRevealed ? 'none' : 'auto',
                }}
              >
                {/* === ENVELOPE BODY (back layer) === */}
                <div
                  className="absolute rounded-lg"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, hsl(340 45% 72%) 0%, hsl(345 50% 65%) 100%)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                    transform: 'translateZ(0px)',
                  }}
                />

                {/* === LETTER PAPER (inside envelope) === */}
                <motion.div
                  className="absolute rounded-sm overflow-hidden"
                  style={{
                    width: 280,
                    height: 180,
                    left: 20,
                    top: 20,
                    background: 'linear-gradient(180deg, hsl(48 60% 96%) 0%, hsl(42 50% 92%) 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transform: 'translateZ(2px)',
                  }}
                  animate={{
                    y: flapOpen ? -120 : 0,
                    opacity: letterRevealed ? 0 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 80,
                    damping: 18,
                    mass: 0.8,
                  }}
                >
                  {/* Ruled lines on paper */}
                  <div className="absolute inset-0">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full"
                        style={{
                          height: 1,
                          background: 'hsla(220, 30%, 80%, 0.5)',
                          top: 20 + i * 18,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* === ENVELOPE FLAP (triangular, top) === */}
                <motion.div
                  className="absolute left-0 right-0"
                  style={{
                    top: 0,
                    height: '55%',
                    transformOrigin: 'top center',
                    transformStyle: 'preserve-3d',
                    zIndex: 10,
                  }}
                  animate={{
                    rotateX: flapOpen ? 180 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 50,
                    damping: 15,
                    mass: 1.2,
                  }}
                >
                  {/* Flap front face (pink, visible when closed) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background: 'linear-gradient(180deg, hsl(342 48% 70%) 0%, hsl(345 50% 65%) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                      backfaceVisibility: 'hidden',
                    }}
                  />
                  {/* Flap back face (cream, visible when open) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background: 'linear-gradient(180deg, hsl(42 45% 92%) 0%, hsl(38 40% 88%) 100%)',
                      transform: 'rotateX(180deg)',
                      backfaceVisibility: 'hidden',
                    }}
                  />
                </motion.div>

                {/* === WAX SEAL (heart) === */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                  style={{
                    top: 85,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, hsl(0 70% 55%) 0%, hsl(355 75% 42%) 100%)',
                    boxShadow: '0 4px 12px rgba(180,50,70,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.15)',
                    zIndex: 15,
                    transform: 'translateZ(5px)',
                  }}
                  animate={{
                    scale: flapOpen ? 0 : 1,
                    opacity: flapOpen ? 0 : 1,
                    rotateZ: flapOpen ? 90 : 0,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <span style={{ fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>❤️</span>
                </motion.div>

                {/* === ENVELOPE FRONT POCKET (bottom V-shape) === */}
                <div
                  className="absolute left-0 right-0 bottom-0 rounded-b-lg"
                  style={{
                    height: '60%',
                    background: 'linear-gradient(180deg, hsl(340 48% 70%) 0%, hsl(345 50% 65%) 100%)',
                    clipPath: 'polygon(0 40%, 50% 0, 100% 40%, 100% 100%, 0 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                    zIndex: 20,
                    transform: 'translateZ(8px)',
                  }}
                />

                {/* Left inner triangle (cream) */}
                <div
                  className="absolute"
                  style={{
                    left: 0,
                    bottom: 0,
                    width: '50%',
                    height: '60%',
                    clipPath: 'polygon(0 30%, 100% 0, 0 100%)',
                    background: 'linear-gradient(135deg, hsl(45 50% 94%) 0%, hsl(40 45% 90%) 100%)',
                    zIndex: 5,
                    transform: 'translateZ(3px)',
                  }}
                />

                {/* Right inner triangle (cream) */}
                <div
                  className="absolute"
                  style={{
                    right: 0,
                    bottom: 0,
                    width: '50%',
                    height: '60%',
                    clipPath: 'polygon(100% 30%, 0 0, 100% 100%)',
                    background: 'linear-gradient(225deg, hsl(45 50% 94%) 0%, hsl(40 45% 90%) 100%)',
                    zIndex: 5,
                    transform: 'translateZ(3px)',
                  }}
                />
              </motion.div>

              {/* === LETTER CARD (zooms to center when revealed) === */}
              <AnimatePresence>
                {letterRevealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, y: 80, rotateX: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 40 }}
                    transition={{
                      type: 'spring',
                      stiffness: 90,
                      damping: 16,
                      mass: 1,
                      delay: 0.1,
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                      transform: 'translateZ(50px)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      closeModal()
                    }}
                  >
                    {/* Letter Card */}
                    <motion.div
                      className="relative flex flex-col items-center justify-center px-10 py-12 rounded-2xl overflow-hidden"
                      style={{
                        width: 'clamp(300px, 85vw, 480px)',
                        background: 'linear-gradient(175deg, hsl(45 55% 97%) 0%, hsl(40 50% 94%) 50%, hsl(38 45% 91%) 100%)',
                        boxShadow: `
                          0 0 0 1px rgba(255,220,200,0.3),
                          0 30px 80px rgba(0,0,0,0.35),
                          0 10px 40px rgba(180,100,120,0.2)
                        `,
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Paper texture */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                          opacity: 0.04,
                        }}
                      />

                      {/* Decorative corner flourishes */}
                      <div
                        className="absolute top-4 left-4 w-10 h-10 opacity-20"
                        style={{
                          borderTop: '2px solid hsl(340 50% 60%)',
                          borderLeft: '2px solid hsl(340 50% 60%)',
                          borderTopLeftRadius: 6,
                        }}
                      />
                      <div
                        className="absolute top-4 right-4 w-10 h-10 opacity-20"
                        style={{
                          borderTop: '2px solid hsl(340 50% 60%)',
                          borderRight: '2px solid hsl(340 50% 60%)',
                          borderTopRightRadius: 6,
                        }}
                      />
                      <div
                        className="absolute bottom-4 left-4 w-10 h-10 opacity-20"
                        style={{
                          borderBottom: '2px solid hsl(340 50% 60%)',
                          borderLeft: '2px solid hsl(340 50% 60%)',
                          borderBottomLeftRadius: 6,
                        }}
                      />
                      <div
                        className="absolute bottom-4 right-4 w-10 h-10 opacity-20"
                        style={{
                          borderBottom: '2px solid hsl(340 50% 60%)',
                          borderRight: '2px solid hsl(340 50% 60%)',
                          borderBottomRightRadius: 6,
                        }}
                      />

                      {/* Heart icon */}
                      <motion.span
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.3,
                          type: 'spring',
                          stiffness: 300,
                          damping: 15,
                        }}
                        className="mb-5 text-3xl"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(200,100,120,0.3))' }}
                      >
                        💌
                      </motion.span>

                      {/* Letter text with typewriter effect */}
                      <p
                        className="text-center leading-relaxed relative"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
                          color: 'hsl(325 45% 25%)',
                          lineHeight: 1.6,
                          minHeight: '3em',
                        }}
                      >
                        {typedText}
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="inline-block w-0.5 h-5 ml-1 align-middle"
                          style={{
                            background: 'hsl(340 50% 50%)',
                            display: typedText.length >= currentLetter.length ? 'none' : 'inline-block',
                          }}
                        />
                      </p>

                      {/* Signature line */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        className="mt-6 w-20 h-px origin-center"
                        style={{ background: 'hsl(340 40% 70% / 0.5)' }}
                      />
                    </motion.div>

                    {/* Close hint */}
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mt-5 text-xs tracking-widest uppercase"
                      style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 85%)' }}
                    >
                      chạm để đóng
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instruction text */}
            {!letterRevealed && (
              <motion.p
                className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs tracking-widest uppercase text-center"
                style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 85%)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.6 }}
              >
                {flapOpen ? 'chạm lần nữa để đọc thư' : 'chạm phong thư để mở'}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LETTERS = [
  'Cô bé ơi, anh tin em sẽ làm được mà. 🌸',
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
  const counterRef = useRef(0)

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
    setTimeout(() => setShowEnvelope(true), 200)
  }

  const handleEnvelopeClick = () => {
    if (!letterRevealed) {
      setLetterRevealed(true)
    } else {
      setShowEnvelope(false)
      setLetterRevealed(false)
    }
  }

  const closeModal = () => {
    setShowEnvelope(false)
    setLetterRevealed(false)
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

      {/* Modal backdrop */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center cursor-pointer"
            style={{ zIndex: 10000, background: 'rgba(40,20,30,0.75)', backdropFilter: 'blur(20px)' }}
            onClick={closeModal}
          >
            {/* Envelope — fades out when letter is revealed */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{
                scale: letterRevealed ? 0.9 : 1,
                opacity: letterRevealed ? 0 : 1,
                y: letterRevealed ? 20 : 0,
              }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={
                letterRevealed
                  ? { duration: 0.45, ease: 'easeIn' }
                  : { type: 'spring', stiffness: 180, damping: 22 }
              }
              className="relative"
              onClick={(e) => {
                e.stopPropagation()
                handleEnvelopeClick()
              }}
              style={{ pointerEvents: letterRevealed ? 'none' : 'auto' }}
            >
              {/* Envelope Container */}
              <div
                className="relative cursor-pointer"
                style={{ width: 320, height: 220 }}
              >
                {/* Envelope Back */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(145deg, hsl(332 45% 75%), hsl(332 50% 65%))',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                />

                {/* Envelope Flap (Top Triangle) */}
                <motion.div
                  className="absolute left-0 right-0 top-0 origin-top"
                  style={{
                    height: 110,
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background: 'linear-gradient(180deg, hsl(332 50% 70%), hsl(332 55% 60%))',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 3,
                  }}
                  animate={{ rotateX: letterRevealed ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                />

                {/* Heart Seal */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                  style={{
                    top: 65,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'hsl(350 70% 55%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    zIndex: 4,
                  }}
                  animate={{
                    scale: letterRevealed ? 0 : 1,
                    opacity: letterRevealed ? 0 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ fontSize: 18 }}>❤️</span>
                </motion.div>

                {/* Envelope Front */}
                <div
                  className="absolute left-0 right-0 bottom-0 rounded-b-2xl"
                  style={{
                    height: 130,
                    background: 'linear-gradient(180deg, hsl(332 48% 72%), hsl(332 52% 68%))',
                    zIndex: 5,
                    clipPath: 'polygon(0 30%, 50% 0, 100% 30%, 100% 100%, 0 100%)',
                  }}
                />
              </div>

              {/* Instruction text */}
              <motion.p
                className="text-center mt-6 text-xs tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 85%)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.5 }}
              >
                chạm để mở thư
              </motion.p>
            </motion.div>

            {/* Letter — zooms into center of screen when revealed */}
            <AnimatePresence>
              {letterRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.55, y: 60 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ duration: 0.65, ease: [0.34, 1.3, 0.64, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeModal()
                  }}
                >
                  {/* Letter Card */}
                  <motion.div
                    className="relative flex flex-col items-center justify-center px-10 py-10 rounded-3xl"
                    style={{
                      width: 'clamp(300px, 80vw, 480px)',
                      background: 'linear-gradient(180deg, hsl(40 60% 97%), hsl(35 50% 93%))',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,200,180,0.15)',
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Decorative top line */}
                    <div
                      className="absolute top-5 left-10 right-10 h-px"
                      style={{ background: 'hsl(332 40% 80% / 0.4)' }}
                    />

                    {/* Heart icon */}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
                      className="mb-5 text-3xl"
                    >
                      💌
                    </motion.span>

                    <p
                      className="text-center leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.3rem, 4vw, 1.7rem)',
                        color: 'hsl(320 40% 22%)',
                        lineHeight: 1.55,
                      }}
                    >
                      {currentLetter}
                    </p>

                    {/* Decorative bottom line */}
                    <div
                      className="absolute bottom-5 left-10 right-10 h-px"
                      style={{ background: 'hsl(332 40% 80% / 0.4)' }}
                    />
                  </motion.div>

                  {/* Close hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.7 }}
                    className="mt-5 text-xs tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 85%)' }}
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

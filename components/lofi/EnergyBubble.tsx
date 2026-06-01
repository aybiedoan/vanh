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
  const [showLetter, setShowLetter] = useState(false)
  const [currentLetter, setCurrentLetter] = useState(LETTERS[0])
  const counterRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  const triggerParticles = useCallback((clientX: number, clientY: number) => {
    const count = 18
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: counterRef.current++,
      x: clientX,
      y: clientY,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      vx: (Math.random() - 0.5) * 280,
      vy: -(Math.random() * 220 + 60),
    }))
    setParticles((p) => [...p, ...newParticles])
    setTimeout(() => {
      setParticles((p) => p.filter((pk) => !newParticles.find((n) => n.id === pk.id)))
    }, 1400)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    triggerParticles(e.clientX, e.clientY)
    const idx = Math.floor(Math.random() * LETTERS.length)
    setCurrentLetter(LETTERS[idx])
    setTimeout(() => setShowLetter(true), 300)
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
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="fixed text-xl select-none"
              style={{ transform: 'translate(-50%,-50%)' }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Button */}
      <motion.button
        ref={btnRef}
        onClick={handleClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm cursor-pointer select-none"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          color: 'hsl(332 80% 85%)',
          boxShadow: '0 0 20px hsl(332 80% 55% / 0.2)',
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
        ✨ Nạp năng lượng
      </motion.button>

      {/* Letter Modal */}
      <AnimatePresence>
        {showLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center cursor-pointer"
            style={{ zIndex: 10000, background: 'rgba(255,230,240,0.12)', backdropFilter: 'blur(24px)' }}
            onClick={() => setShowLetter(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="relative max-w-md px-10 py-12 text-center"
              style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 28, backdropFilter: 'blur(20px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                  color: 'hsl(320 60% 22%)',
                  lineHeight: 1.4,
                }}
              >
                {currentLetter}
              </p>
              <button
                className="mt-8 text-xs tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'var(--font-body)', color: 'hsl(320 50% 30%)' }}
                onClick={() => setShowLetter(false)}
              >
                chạm để đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

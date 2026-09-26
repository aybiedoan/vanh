'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart } from 'lucide-react'
import { asset } from '@/lib/asset'
import {
  LOCK_1_QUESTION, LOCK_1_ANSWER,
  LOCK_2_DURATION_MS,
  LOCK_3_QUESTION, LOCK_3_OPTIONS, LOCK_3_CORRECT_INDEX,
  LETTER_TEXT, FINAL_LINE,
} from '@/lib/birthday/constants'

// Chỉ hiển thị icon vào đúng ngày 26/09/2026 theo giờ Việt Nam (GMT+7)
function isBirthdayDay(): boolean {
  const now = new Date()
  // Shift sang giờ VN rồi đọc bằng getUTC* để tránh lệ thuộc timezone máy
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return (
    vn.getUTCFullYear() === 2026 &&
    vn.getUTCMonth() === 8 && // tháng 9 (0-indexed)
    vn.getUTCDate() === 26
  )
}

type BirthdayState =
  | 'IDLE' | 'PASSWORD' | 'INTRO_VIDEO'
  | 'LOCK_1' | 'LOCK_2' | 'LOCK_3'
  | 'CELEBRATION'
  | 'CANDLE_VIDEO' | 'HPBD_VIDEO'
  | 'STAR_SKY'
  | 'LETTER_SEAL' | 'LETTER_READING' | 'OUTRO'

const BGM_URL = asset('/assets/birthday/romantic-bgm.mp3')
const VIDEO_URL = asset('/assets/birthday/intro-bunny.mp4')
const CANDLE_VIDEO_URL = asset('/assets/birthday/candle.mp4')
const HPBD_VIDEO_URL = asset('/assets/birthday/hpbd.mp4')
const BD_BGM_URL = asset('/assets/birthday/bd-bgm.mp3')

// ─── Thanh tiến trình 1/3, 2/3, 3/3 ─────────────────────────────────────────
function LockProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
            style={{
              background: n <= current ? 'hsl(332 80% 70% / 0.35)' : 'rgba(255,255,255,0.05)',
              border: n <= current ? '1px solid hsl(332 80% 70%)' : '1px solid rgba(255,255,255,0.15)',
              color: n <= current ? '#fff' : 'rgba(255,220,235,0.5)',
            }}
          >
            {n}
          </div>
          {n < 3 && <div className="w-6 h-px" style={{ background: 'rgba(255,175,220,0.2)' }} />}
        </div>
      ))}
    </div>
  )
}

// ─── PasswordGate: nhập mật khẩu mở quà ─────────────────────────────────────
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value === '2609') {
      navigator.vibrate?.(100)
      onSuccess()
    } else {
      setError(true)
      navigator.vibrate?.(200)
      setValue('')
      setTimeout(() => setError(false), 600)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex items-center justify-center p-4"
    >
      <motion.div
        animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm p-6 rounded-2xl text-center"
        style={{
          background: 'rgba(45,20,48,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,175,220,0.22)',
        }}
      >
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'rgba(255,182,193,0.08)',
            border: '1px solid rgba(255,182,193,0.25)',
            color: '#ffb6c1',
          }}
        >
          <Heart size={18} />
        </div>
        <h3 className="mb-1" style={{ fontFamily: 'var(--font-display)', color: 'hsl(320 50% 92%)', fontSize: '1.2rem' }}>
          Mã khóa bí mật
        </h3>
        <p className="text-xs mb-5" style={{ color: 'rgba(255,220,235,0.6)' }}>
          Nhập mật khẩu để mở món quà nhé...
        </p>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="••••"
            className="w-full text-center py-2.5 px-4 rounded-xl text-white text-xl tracking-widest outline-none mb-4"
            style={{
              background: 'rgba(30,12,22,0.55)',
              border: '1px solid rgba(255,182,193,0.22)',
              fontFamily: 'var(--font-display)',
            }}
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(255,182,193,0.6) 0%, rgba(219,112,147,0.6) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontFamily: 'var(--font-body)',
            }}
          >
            Mở quà
          </button>
        </form>
        {error && (
          <p className="text-xs mt-3" style={{ color: 'rgba(255,120,120,0.9)' }}>
            Hình như chưa đúng rồi... 🤫
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Video toàn màn hình (tái sử dụng cho intro / candle / hpbd) ────────────
function FullscreenVideo({ src, onEnd }: { src: string; onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    // iOS Safari: set attribute webkit-playsinline qua ref
    v.setAttribute('webkit-playsinline', 'true')
    v.play().catch(() => {})
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        onEnded={onEnd}
        className="w-full h-full object-contain"
      />
    </motion.div>
  )
}

// ─── Khóa 1: nhập số ────────────────────────────────────────────────────────
function Lock1({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    if (parseInt(value, 10) === LOCK_1_ANSWER) {
      navigator.vibrate?.(100)
      onSuccess()
    } else {
      setError(true)
      navigator.vibrate?.(200)
      setTimeout(() => setError(false), 600)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex items-center justify-center p-4"
    >
      <motion.div
        animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm p-6 rounded-2xl"
        style={{
          background: 'rgba(45,20,48,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,175,220,0.22)',
        }}
      >
        <LockProgress current={1} />
        <h3 className="text-center mb-2" style={{ fontFamily: 'var(--font-display)', color: 'hsl(320 50% 92%)', fontSize: '1.2rem' }}>
          Khóa 01: Khảo sát thực địa
        </h3>
        <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,220,235,0.7)' }}>
          {LOCK_1_QUESTION}
        </p>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full text-center py-3 rounded-xl text-2xl mb-4 outline-none"
          style={{
            background: 'rgba(30,12,22,0.55)',
            border: '1px solid rgba(255,182,193,0.22)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
          }}
        />
        <button
          onClick={submit}
          className="w-full py-2.5 rounded-xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(255,182,193,0.6) 0%, rgba(219,112,147,0.6) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
          }}
        >
          Xác nhận
        </button>
        {error && (
          <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,120,120,0.9)' }}>
            Nhìn kỹ lại quanh bàn xem nào!
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Khóa 2: chạm giữ 3 giây với radial progress ────────────────────────────
function Lock2({ onSuccess }: { onSuccess: () => void }) {
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    setProgress(0)
  }, [])

  const start = useCallback(() => {
    startRef.current = performance.now()
    const tick = () => {
      if (startRef.current === null) return
      const elapsed = performance.now() - startRef.current
      const p = Math.min(1, elapsed / LOCK_2_DURATION_MS)
      setProgress(p)
      if (p >= 1) {
        navigator.vibrate?.([100, 50, 100])
        onSuccess()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onSuccess])

  const handleRelease = useCallback(() => {
    if (startRef.current !== null && progress < 1) {
      setError(true)
      navigator.vibrate?.(200)
      setTimeout(() => setError(false), 600)
    }
    stop()
  }, [progress, stop])

  useEffect(() => () => stop(), [stop])

  const R = 70
  const C = 2 * Math.PI * R

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex items-center justify-center p-4"
    >
      <motion.div
        animate={error ? { x: [-6, 6, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm p-6 rounded-2xl text-center"
        style={{
          background: 'rgba(45,20,48,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,175,220,0.22)',
        }}
      >
        <LockProgress current={2} />
        <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)', color: 'hsl(320 50% 92%)', fontSize: '1.2rem' }}>
          Khóa 02: Đồng bộ tần số
        </h3>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,220,235,0.7)' }}>
          Chạm và nắm tay người đối diện, đồng thời giữ ngón tay vào vòng tròn bên dưới trong 3 giây.
        </p>
        <div
          className="relative mx-auto mb-4 select-none"
          style={{ width: 160, height: 160, touchAction: 'none' }}
          onMouseDown={start}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onTouchStart={(e) => { e.preventDefault(); start() }}
          onTouchEnd={(e) => { e.preventDefault(); handleRelease() }}
          onTouchCancel={handleRelease}
        >
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,175,220,0.15)" strokeWidth="6" />
            <circle
              cx="80" cy="80" r={R}
              fill="none"
              stroke="hsl(332 80% 70%)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ filter: 'drop-shadow(0 0 8px hsl(332 80% 70% / 0.6))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={36} style={{ color: 'hsl(332 80% 80%)' }} fill="currentColor" />
          </div>
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'rgba(255,120,120,0.9)' }}>
            Chưa đủ 3 giây, đừng buông tay sớm thế!
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Khóa 3: trắc nghiệm ────────────────────────────────────────────────────
function Lock3({ onSuccess }: { onSuccess: () => void }) {
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)

  const choose = (idx: number) => {
    if (correctIdx !== null) return
    if (idx === LOCK_3_CORRECT_INDEX) {
      setCorrectIdx(idx)
      navigator.vibrate?.([100, 50, 150])
      setTimeout(onSuccess, 500)
    } else {
      setWrongIdx(idx)
      navigator.vibrate?.(200)
      setTimeout(() => setWrongIdx(null), 600)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex items-center justify-center p-4"
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl"
        style={{
          background: 'rgba(45,20,48,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,175,220,0.22)',
        }}
      >
        <LockProgress current={3} />
        <h3 className="text-center mb-2" style={{ fontFamily: 'var(--font-display)', color: 'hsl(320 50% 92%)', fontSize: '1.2rem' }}>
          Khóa 03: Mảnh ghép còn thiếu
        </h3>
        <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,220,235,0.7)' }}>
          {LOCK_3_QUESTION}
        </p>
        <div className="flex flex-col gap-2">
          {LOCK_3_OPTIONS.map((opt, idx) => {
            const isWrong = wrongIdx === idx
            const isCorrect = correctIdx === idx
            return (
              <motion.button
                key={idx}
                onClick={() => choose(idx)}
                animate={isWrong ? { x: [-6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full py-3 px-4 rounded-xl text-left cursor-pointer transition-colors"
                style={{
                  background: isCorrect
                    ? 'rgba(255,215,0,0.18)'
                    : isWrong
                      ? 'rgba(255,80,80,0.2)'
                      : 'rgba(255,255,255,0.04)',
                  border: isCorrect
                    ? '1px solid rgba(255,215,0,0.85)'
                    : isWrong
                      ? '1px solid rgba(255,80,80,0.5)'
                      : '1px solid rgba(255,175,220,0.15)',
                  boxShadow: isCorrect ? '0 0 22px rgba(255,215,0,0.55)' : 'none',
                  color: '#ffe3f1',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              >
                {opt}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Balloons: bóng bay trôi lên bằng framer-motion + CSS border-radius ─────
function Balloons() {
  const balloons = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 1.5,
        duration: 6 + Math.random() * 4,
        size: 40 + Math.random() * 30,
        hue: [340, 320, 280, 200, 45][i % 5],
        sway: (Math.random() - 0.5) * 60,
      })),
    []
  )

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 5 }}
    >
      {balloons.map((b) => (
        <motion.div
          key={b.id}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{
            y: '-120vh',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 0.5,
            opacity: {
              duration: b.duration,
              delay: b.delay,
              times: [0, 0.08, 0.85, 1],
              repeat: Infinity,
              repeatDelay: 0.5,
            },
          }}
          className="absolute"
          style={{ left: `${b.left}%`, bottom: 0 }}
        >
          <motion.div
            animate={{ x: [0, b.sway, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: b.size,
              height: b.size * 1.2,
              borderRadius: '50% 50% 50% 50% / 55% 55% 45% 45%',
              background: `radial-gradient(circle at 35% 30%, hsl(${b.hue} 90% 85%), hsl(${b.hue} 75% 65%))`,
              boxShadow: `0 0 20px hsl(${b.hue} 80% 70% / 0.5)`,
              position: 'relative',
            }}
          >
            {/* Dây bóng */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                width: 1,
                height: 40,
                background: 'rgba(255,220,235,0.4)',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Celebration: timeline 4 giây (burst → reveal → ready) ──────────────────
function Celebration({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<'burst' | 'reveal' | 'ready'>('burst')
  const fireworkTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default
        // Giây 0–1: burst mạnh giữa màn hình (khoảnh khắc chạm)
        confetti({
          particleCount: 140,
          spread: 100,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.55 },
          colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700', '#fff2b0'],
        })
        // Giây 1–3: 2 luồng cannon từ góc dưới chụm vào giữa
        const end = Date.now() + 2000
        const frame = () => {
          if (cancelled) return
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 60,
            startVelocity: 55,
            origin: { x: 0, y: 0.9 },
            colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700'],
          })
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 60,
            startVelocity: 55,
            origin: { x: 1, y: 0.9 },
            colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700'],
          })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()

        // 5 đợt pháo hoa rải rác trên bầu trời (giây 2 → 6)
        for (let i = 0; i < 5; i++) {
          const t = setTimeout(() => {
            if (cancelled) return
            confetti({
              particleCount: 80,
              spread: 360,
              startVelocity: 30,
              ticks: 90,
              gravity: 0.9,
              origin: {
                x: 0.15 + Math.random() * 0.7,
                y: 0.15 + Math.random() * 0.35,
              },
              colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700', '#fff2b0', '#c084fc'],
            })
          }, 2000 + i * 800)
          fireworkTimeouts.current.push(t)
        }
      } catch (e) {
        console.warn('Confetti failed:', e)
      }
    }
    run()

    // Timeline
    const t1 = setTimeout(() => setPhase('reveal'), 2000) // giây 2 → bắt đầu fade chữ + vignette
    const t2 = setTimeout(() => setPhase('ready'), 4000)  // giây 4 → hiện nút
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
      fireworkTimeouts.current.forEach(clearTimeout)
      fireworkTimeouts.current = []
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {/* Vignette tối dần (giây 2 → 4) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'burst' ? 0 : 0.75 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* Bóng bay trôi lên khi nút Happy Birthday xuất hiện */}
      {phase === 'ready' && <Balloons />}

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Chữ chúc mừng — hiện giây 1, mờ đi giây 2+ */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{
            scale: phase === 'burst' ? 1 : 0.94,
            opacity: phase === 'burst' ? 1 : 0,
          }}
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 14 },
            opacity: { duration: phase === 'burst' ? 0.5 : 1.4, ease: 'easeInOut' },
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'hsl(320 50% 94%)',
              fontSize: 'clamp(1.15rem, 4.5vw, 1.6rem)',
              lineHeight: 1.4,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            TẤT CẢ CÁC KHÓA ĐÃ ĐƯỢC GIẢI MÃ! ✨
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'rgba(255,220,235,0.75)',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
            }}
          >
            (3/3 Hoàn thành)
          </p>
        </motion.div>

        {/* Nút Happy Birthday — spotlight (giây 4+) */}
        {phase === 'ready' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onClick={onNext}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="relative mt-10 px-8 py-3 rounded-full cursor-pointer select-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,182,193,0.85) 0%, rgba(219,112,147,0.85) 100%)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              letterSpacing: '0.04em',
              touchAction: 'manipulation',
              // Spotlight: hào quang tỏa ra quanh nút
              boxShadow:
                '0 0 40px 8px rgba(255,182,193,0.55), 0 0 90px 24px rgba(255,160,200,0.28)',
            }}
          >
            Happy Birthday 🎂
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ─── StarSkyScene: bầu trời sao lặp + bong bóng + pháo hoa + nút mở thư ─────
function StarSkyScene({ onOpenLetter }: { onOpenLetter: () => void }) {
  // Sinh sao 1 lần, giữ nguyên qua re-render
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.6 + Math.random() * 2.2,
        opacity: 0.25 + Math.random() * 0.55,
        twinkleDelay: Math.random() * 3,
        twinkleDur: 2 + Math.random() * 2.5,
      })),
    []
  )

  // Bong bóng nhỏ trôi lên
  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 22,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 5,
        hue: [330, 300, 200, 45][i % 4],
      })),
    []
  )

  // Pháo hoa định kỳ
  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default
        const burst = () => {
          if (cancelled) return
          confetti({
            particleCount: 60,
            spread: 360,
            startVelocity: 28,
            ticks: 100,
            gravity: 0.85,
            origin: {
              x: 0.15 + Math.random() * 0.7,
              y: 0.15 + Math.random() * 0.35,
            },
            colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700', '#c084fc', '#a6e3a1'],
          })
        }
        burst()
        intervalId = setInterval(burst, 2200)
      } catch (e) {
        console.warn('StarSky confetti failed:', e)
      }
    }
    run()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #2a0f3a 0%, #150720 55%, #08030d 100%)',
      }}
    >
      {/* Sao lấp lánh */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: 'rgba(240, 220, 255, 0.95)',
              boxShadow: '0 0 4px rgba(255, 200, 240, 0.6)',
            }}
            animate={{ opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
            transition={{
              duration: s.twinkleDur,
              delay: s.twinkleDelay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Bong bóng trôi lên */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              left: `${b.left}%`,
              bottom: -40,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 35% 30%, hsla(${b.hue}, 90%, 88%, 0.55), hsla(${b.hue}, 80%, 70%, 0.15))`,
              border: `1px solid hsla(${b.hue}, 90%, 85%, 0.35)`,
              boxShadow: `0 0 12px hsla(${b.hue}, 80%, 75%, 0.35)`,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: '-115vh',
              x: [0, (Math.random() - 0.5) * 40, 0],
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 0.4,
              opacity: {
                duration: b.duration,
                delay: b.delay,
                times: [0, 0.1, 0.85, 1],
                repeat: Infinity,
                repeatDelay: 0.4,
              },
            }}
          />
        ))}
      </div>

      {/* Nút mở thư */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          onClick={onOpenLetter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative px-8 py-3 rounded-full cursor-pointer select-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,182,193,0.85) 0%, rgba(219,112,147,0.85) 100%)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            letterSpacing: '0.04em',
            touchAction: 'manipulation',
            boxShadow:
              '0 0 40px 8px rgba(255,182,193,0.5), 0 0 90px 24px rgba(255,160,200,0.25)',
          }}
        >
          Có một lá thư ở sau đó 💌
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── LetterSeal: phong bì + con dấu sáp ─────────────────────────────────────
function LetterSeal({ onOpen }: { onOpen: () => void }) {
  const [opening, setOpening] = useState(false)
  const handleClick = () => {
    if (opening) return
    setOpening(true)
    navigator.vibrate?.(100)
    setTimeout(onOpen, 700)
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-4"
    >
      <motion.div
        onClick={handleClick}
        className="relative cursor-pointer select-none"
        style={{ width: 280, height: 200, touchAction: 'manipulation' }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(170deg, hsl(46 55% 97%) 0%, hsl(40 50% 94%) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        />
        <motion.div
          animate={opening ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{
            width: 60, height: 60,
            background: 'radial-gradient(circle at 35% 30%, hsl(0 70% 55%), hsl(0 68% 42%))',
            boxShadow: '0 4px 16px rgba(180,30,30,0.5)',
          }}
        >
          <Heart size={24} fill="#fff" style={{ color: '#fff' }} />
        </motion.div>
      </motion.div>
      <p className="mt-8 text-sm" style={{ color: 'rgba(255,220,235,0.7)', fontFamily: 'var(--font-body)' }}>
        Chạm vào con dấu sáp để mở thư
      </p>
    </motion.div>
  )
}

// ─── LetterReading: typewriter + auto-scroll ────────────────────────────────
function LetterReading({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [showFinal, setShowFinal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let idx = 0
    const iv = setInterval(() => {
      if (idx < LETTER_TEXT.length) {
        idx++
        setText(LETTER_TEXT.slice(0, idx))
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      } else {
        clearInterval(iv)
        setTimeout(() => setShowFinal(true), 800)
        setTimeout(onDone, 4000)
      }
    }, 45)
    return () => clearInterval(iv)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center p-4"
    >
      <div
        ref={containerRef}
        className="w-full max-w-md p-6 rounded-2xl overflow-y-auto no-scrollbar"
        style={{
          maxHeight: '70vh',
          background: 'linear-gradient(170deg, hsl(46 55% 97%) 0%, hsl(40 50% 94%) 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            color: 'hsl(325 45% 26%)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
          }}
        >
          {text}
          {!showFinal && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-5 ml-1 align-middle"
              style={{ background: 'hsl(340 50% 52%)' }}
            />
          )}
        </p>
        {showFinal && (
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mt-6 text-center italic"
            style={{ fontFamily: 'var(--font-display)', color: 'hsl(340 50% 40%)', fontSize: '1rem' }}
          >
            {FINAL_LINE}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main component: FSM + audio + cleanup ──────────────────────────────────
function BirthdayOverlayInner() {
  const [state, setState] = useState<BirthdayState>('IDLE')
  const [isOpen, setIsOpen] = useState(false)
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const bgmStartedRef = useRef(false) // guard: BGM chỉ fade-in 1 lần / session

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setState('PASSWORD')
  }, [])

  const handlePasswordSuccess = useCallback(() => {
    // 1. Tắt nhạc PlaylistWidget (event đã có sẵn trong PlaylistWidget)
    try { window.dispatchEvent(new Event('confession:play')) } catch {}
    // 2. Preload BGM trong user gesture → unlock autoplay iOS
    if (!bgmRef.current) {
      const a = new Audio(BGM_URL)
      a.loop = true
      a.volume = 0
      // ── iOS unlock: gọi play() rồi pause() ngay trong user gesture ──
      a.play()
        .then(() => { try { a.pause(); a.currentTime = 0 } catch {} })
        .catch(() => {})
      bgmRef.current = a
    }
    setState('INTRO_VIDEO')
  }, [])

  const handleClose = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
      bgmRef.current.muted = false // ← reset để lần sau BGM phát lại được
    }
    bgmStartedRef.current = false // ← reset guard để lần mở sau BGM phát lại từ đầu
    try { window.dispatchEvent(new Event('confession:stop')) } catch {}
    setIsOpen(false)
    setState('IDLE')
  }, [])

  // Bắt đầu phát BGM ngay khi intro kết thúc (state chuyển sang LOCK_1)
  useEffect(() => {
    if (state !== 'LOCK_1' || !bgmRef.current || bgmStartedRef.current) return
    bgmStartedRef.current = true

    const a = bgmRef.current
    try { a.currentTime = 0 } catch {}
    a.volume = 0
    a.play().catch(() => {})

    const start = performance.now()
    const fade = () => {
      const t = Math.min(1, (performance.now() - start) / 2000)
      a.volume = 0.7 * t
      if (t < 1) requestAnimationFrame(fade)
    }
    fade()
  }, [state])

  // Kết thúc BGM khi user nhấn "Happy Birthday" (chuyển sang CANDLE_VIDEO):
  // fade-out âm lượng về 0 rồi pause hẳn
  useEffect(() => {
    if (state !== 'CANDLE_VIDEO' || !bgmRef.current) return
    const a = bgmRef.current
    const startVol = a.volume
    const start = performance.now()
    const fade = () => {
      const t = Math.min(1, (performance.now() - start) / 800)
      a.volume = startVol * (1 - t)
      if (t < 1) {
        requestAnimationFrame(fade)
      } else {
        try { a.pause() } catch {}
      }
    }
    fade()
  }, [state])

  // Phát bd-bgm.mp3 khi vào STAR_SKY (sau khi 2 video kết thúc)
  useEffect(() => {
    if (state !== 'STAR_SKY') return
    const a = new Audio(BD_BGM_URL)
    a.loop = true
    a.volume = 0
    a.play().catch(() => {})
    const start = performance.now()
    const fade = () => {
      const t = Math.min(1, (performance.now() - start) / 2000)
      a.volume = 0.7 * t
      if (t < 1) requestAnimationFrame(fade)
    }
    fade()
    return () => {
      try { a.pause() } catch {}
    }
  }, [state])

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current = null
      }
    }
  }, [])

  return (
    <>
      {/* Trigger button */}
      <div className="relative flex items-center justify-end">
        <motion.button
          onClick={handleOpen}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer select-none text-lg"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            touchAction: 'manipulation',
          }}
          animate={{
            boxShadow: [
              '0 0 10px hsl(340 80% 60% / 0.15)',
              '0 0 24px hsl(340 80% 60% / 0.4)',
              '0 0 10px hsl(340 80% 60% / 0.15)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          title="Bí mật sinh nhật"
        >
          🎂
        </motion.button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0"
            style={{
              zIndex: 99999,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(70,30,55,0.95) 0%, rgba(15,8,20,0.98) 100%)',
              backdropFilter: 'blur(20px)',
              touchAction: 'manipulation',
              userSelect: 'none',
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center cursor-pointer"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(75,35,75,0.65)',
                border: '1px solid rgba(255,175,220,0.2)',
                color: 'hsl(320 55% 84%)',
              }}
            >
              <X size={16} />
            </button>

            <AnimatePresence mode="wait">
              {state === 'PASSWORD' && <PasswordGate key="pwd" onSuccess={handlePasswordSuccess} />}
              {state === 'INTRO_VIDEO' && (
                <FullscreenVideo key="intro" src={VIDEO_URL} onEnd={() => setState('LOCK_1')} />
              )}
              {state === 'LOCK_1' && <Lock1 key="l1" onSuccess={() => setState('LOCK_2')} />}
              {state === 'LOCK_2' && <Lock2 key="l2" onSuccess={() => setState('LOCK_3')} />}
              {state === 'LOCK_3' && <Lock3 key="l3" onSuccess={() => setState('CELEBRATION')} />}
              {state === 'CELEBRATION' && <Celebration key="cel" onNext={() => setState('CANDLE_VIDEO')} />}
              {state === 'CANDLE_VIDEO' && (
                <FullscreenVideo key="candle" src={CANDLE_VIDEO_URL} onEnd={() => setState('HPBD_VIDEO')} />
              )}
              {state === 'HPBD_VIDEO' && (
                <FullscreenVideo key="hpbd" src={HPBD_VIDEO_URL} onEnd={() => setState('STAR_SKY')} />
              )}
              {state === 'STAR_SKY' && (
                <StarSkyScene key="starsky" onOpenLetter={() => setState('LETTER_SEAL')} />
              )}
              {state === 'LETTER_SEAL' && <LetterSeal key="seal" onOpen={() => setState('LETTER_READING')} />}
              {state === 'LETTER_READING' && <LetterReading key="read" onDone={() => setState('OUTRO')} />}
              {state === 'OUTRO' && (
                <motion.div
                  key="outro"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 3 }}
                  className="absolute inset-0 flex items-center justify-center bg-black"
                >
                  <p
                    className="text-center px-6"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'hsl(320 50% 88%)',
                      fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                      lineHeight: 1.6,
                    }}
                  >
                    {FINAL_LINE}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function BirthdayOverlay() {
  if (!isBirthdayDay()) return null
  return <BirthdayOverlayInner />
}

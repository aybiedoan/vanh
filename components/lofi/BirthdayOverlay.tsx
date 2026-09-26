'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  | 'CELEBRATION' | 'LETTER_SEAL' | 'LETTER_READING' | 'OUTRO'

const BGM_URL = asset('/assets/birthday/romantic-bgm.mp3')
const VIDEO_URL = asset('/assets/birthday/intro-bunny.mp4')

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

// ─── Video thỏ toàn màn hình ────────────────────────────────────────────────
function IntroVideo({ onEnd }: { onEnd: () => void }) {
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
        src={VIDEO_URL}
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
      navigator.vibrate?.(100)
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
                  background: isCorrect ? 'rgba(80,200,120,0.25)' : isWrong ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.04)',
                  border: isCorrect ? '1px solid rgba(80,200,120,0.6)' : isWrong ? '1px solid rgba(255,80,80,0.5)' : '1px solid rgba(255,175,220,0.15)',
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

// ─── Celebration: confetti + auto chuyển sau 3.5s ───────────────────────────
function Celebration({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default
        const end = Date.now() + 3000
        const frame = () => {
          if (cancelled) return
          confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.9 }, colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700'] })
          confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.9 }, colors: ['#ffb6c1', '#ff69b4', '#ffe3f1', '#ffd700'] })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
      } catch (e) {
        console.warn('Confetti failed:', e)
      }
    }
    run()
    const t = setTimeout(onDone, 3500)
    return () => { cancelled = true; clearTimeout(t) }
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="text-7xl mb-4"
        >
          🎉
        </motion.div>
        <p style={{ fontFamily: 'var(--font-display)', color: 'hsl(320 50% 92%)', fontSize: '1.5rem' }}>
          Chúc mừng sinh nhật!
        </p>
      </motion.div>
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
              {state === 'INTRO_VIDEO' && <IntroVideo key="intro" onEnd={() => setState('LOCK_1')} />}
              {state === 'LOCK_1' && <Lock1 key="l1" onSuccess={() => setState('LOCK_2')} />}
              {state === 'LOCK_2' && <Lock2 key="l2" onSuccess={() => setState('LOCK_3')} />}
              {state === 'LOCK_3' && <Lock3 key="l3" onSuccess={() => setState('CELEBRATION')} />}
              {state === 'CELEBRATION' && <Celebration key="cel" onDone={() => setState('LETTER_SEAL')} />}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Trạm tiếp sức mùa thi: June 11, 2026 07:30 (Vietnam time GMT+7)
const EXAM_DATE = new Date('2026-06-11T07:30:00+07:00')

type TimeUnit = { value: number; label: string }

function getCountdown() {
  const now = new Date()
  const diff = EXAM_DATE.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

function OdometerDigit({ value }: { value: string }) {
  const prev = useRef(value)
  const changed = prev.current !== value

  useEffect(() => {
    prev.current = value
  })

  return (
    <span className="odometer-clip" style={{ width: '0.62em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={changed ? { y: '-100%', opacity: 0 } : false}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ display: 'inline-block' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function OdometerNumber({ value, pad = 2 }: { value: number; pad?: number }) {
  const str = String(value).padStart(pad, '0')
  return (
    <span style={{ display: 'inline-flex' }}>
      {str.split('').map((ch, i) => (
        <OdometerDigit key={i} value={ch} />
      ))}
    </span>
  )
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getCountdown())

  useEffect(() => {
    const id = setInterval(() => setTime(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  const units: TimeUnit[] = [
    { value: time.days, label: 'ngày' },
    { value: time.hours, label: 'giờ' },
    { value: time.minutes, label: 'phút' },
    { value: time.seconds, label: 'giây' },
  ]

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Sub label */}
      <p
        className="tracking-widest uppercase mb-8"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.85rem, 1.6vw, 1.1rem)',
          letterSpacing: '0.22em',
          color: 'hsl(332 90% 88%)',
          textShadow: '0 0 24px hsl(332 80% 70% / 0.7)',
        }}
      >
        Trạm tiếp sức mùa thi
      </p>

      {/* Numbers */}
      <div className="flex items-end gap-2 md:gap-4">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-end gap-2 md:gap-4">
            <div className="flex flex-col items-center">
              <span
                className="leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(4rem, 9vw, 7rem)',
                  color: 'hsl(332 80% 88%)',
                  textShadow: '0 0 40px hsl(332 80% 60% / 0.6)',
                  lineHeight: 1,
                }}
              >
                <OdometerNumber value={u.value} pad={u.label === 'ngày' ? 1 : 2} />
              </span>
              <span
                className="mt-2 tracking-widest uppercase"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.65rem, 1.1vw, 0.8rem)',
                  letterSpacing: '0.18em',
                  color: 'hsl(332 70% 88%)',
                  opacity: 0.9,
                }}
              >
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span
                className="mb-6 opacity-40 text-4xl leading-none"
                style={{ color: 'hsl(332 80% 80%)', fontFamily: 'var(--font-display)' }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="mt-6 text-sm italic text-center"
        style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 78%)', maxWidth: 380 }}
      >
        Cứ bình tĩnh ôn luyện, phía trước chắc chắn sẽ rực rỡ.
      </motion.p>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MODE_META } from '@/lib/pomodoro/constants'
import type { PomodoroMode } from '@/lib/pomodoro/types'

function OdometerDigit({ value }: { value: string }) {
  const prev = useRef(value)
  const changed = prev.current !== value
  useEffect(() => { prev.current = value })
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
      {str.split('').map((ch, i) => <OdometerDigit key={i} value={ch} />)}
    </span>
  )
}

export default function TimerDisplay({
  mode,
  secondsLeft,
  pomodoroCount,
  longBreakInterval,
}: {
  mode: PomodoroMode
  secondsLeft: number
  pomodoroCount: number
  longBreakInterval: number
}) {
  const meta = MODE_META[mode]
  const hue = `hsl(${meta.hue} ${meta.sat}% ${meta.light}%)`

  const cycleNow =
    pomodoroCount > 0 && pomodoroCount % longBreakInterval === 0
      ? longBreakInterval
      : pomodoroCount % longBreakInterval

  const units = [
    { value: Math.floor(secondsLeft / 60), label: 'phút' },
    { value: secondsLeft % 60, label: 'giây' },
  ]

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Sub-label = tên chế độ */}
      <p
        className="tracking-widest uppercase mb-4"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.85rem, 1.6vw, 1.1rem)',
          letterSpacing: '0.22em',
          color: hue,
          textShadow: `0 0 24px hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.7)`,
        }}
      >
        {meta.label}
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
                  fontSize: 'clamp(3.5rem, 4.2vw, 3.75rem)',
                  color: hue,
                  textShadow: `0 0 40px hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.6)`,
                  lineHeight: 1,
                }}
              >
                <OdometerNumber value={u.value} pad={2} />
              </span>
              <span
                className="mt-2 tracking-widest uppercase"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.65rem, 1.1vw, 0.8rem)',
                  letterSpacing: '0.18em',
                  color: hue,
                  opacity: 0.9,
                }}
              >
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span
                className="mb-4 opacity-40 text-2xl leading-none"
                style={{ color: hue, fontFamily: 'var(--font-display)' }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chu kỳ (vị trí tagline) */}
      <p
        className="mt-6 text-sm italic text-center"
        style={{ fontFamily: 'var(--font-body)', color: hue, opacity: 0.8 }}
      >
        Chu kỳ {cycleNow}/{longBreakInterval}
      </p>
    </div>
  )
}

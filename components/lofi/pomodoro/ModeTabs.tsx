'use client'

import { motion } from 'framer-motion'
import { MODE_META, MODE_ORDER } from '@/lib/pomodoro/constants'
import type { PomodoroMode } from '@/lib/pomodoro/types'

export default function ModeTabs({
  mode,
  onSelect,
}: {
  mode: PomodoroMode
  onSelect: (m: PomodoroMode) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {MODE_ORDER.map((m) => {
        const meta = MODE_META[m]
        const active = m === mode
        return (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className="relative px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              color: active
                ? `hsl(${meta.hue} ${meta.sat}% ${meta.light}%)`
                : 'rgba(255,220,235,0.55)',
              border: '1px solid transparent',
              background: 'transparent',
            }}
          >
            {active && (
              <motion.span
                layoutId="pomodoro-tab-pill"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.18)`,
                  border: `1px solid hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.45)`,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

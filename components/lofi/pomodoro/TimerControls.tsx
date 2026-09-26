'use client'

import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { MODE_META } from '@/lib/pomodoro/constants'
import type { PomodoroMode, TimerStatus } from '@/lib/pomodoro/types'

export default function TimerControls({
  mode,
  status,
  onStartPause,
  onReset,
  onSkip,
}: {
  mode: PomodoroMode
  status: TimerStatus
  onStartPause: () => void
  onReset: () => void
  onSkip: () => void
}) {
  const meta = MODE_META[mode]
  const isRunning = status === 'running'
  const hue = `hsl(${meta.hue} ${meta.sat}% ${meta.light}%)`

  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <button
        onClick={onReset}
        title="Đặt lại"
        className="flex items-center justify-center cursor-pointer transition-colors"
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 200, 220, 0.06)',
          color: '#ffe3f1',
        }}
      >
        <RotateCcw size={15} />
      </button>

      <motion.button
        onClick={onStartPause}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 cursor-pointer"
        style={{
          padding: '10px 28px',
          borderRadius: 40,
          justifyContent: 'center',
          minWidth: 150,
          flexShrink: 0,
          background: `hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.22)`,
          border: `1px solid hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.5)`,
          color: hue,
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          letterSpacing: '0.08em',
          boxShadow: `0 0 18px hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.22)`,
        }}
      >
        {isRunning ? <Pause size={15} /> : <Play size={15} />}
        <span className="whitespace-nowrap">{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
      </motion.button>

      <button
        onClick={onSkip}
        title="Bỏ qua"
        className="flex items-center justify-center cursor-pointer transition-colors"
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 200, 220, 0.06)',
          color: '#ffe3f1',
        }}
      >
        <SkipForward size={15} />
      </button>
    </div>
  )
}

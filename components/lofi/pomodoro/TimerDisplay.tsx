'use client'

import { MODE_META } from '@/lib/pomodoro/constants'
import type { PomodoroMode } from '@/lib/pomodoro/types'

const SIZE = 210
const RADIUS = 96
const CIRC = 2 * Math.PI * RADIUS

export default function TimerDisplay({
  mode,
  secondsLeft,
  totalSec,
  pomodoroCount,
  longBreakInterval,
}: {
  mode: PomodoroMode
  secondsLeft: number
  totalSec: number
  pomodoroCount: number
  longBreakInterval: number
}) {
  const meta = MODE_META[mode]
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = totalSec > 0 ? 1 - secondsLeft / totalSec : 0
  const offset = CIRC * (1 - progress)

  const cycleNow =
    pomodoroCount > 0 && pomodoroCount % longBreakInterval === 0
      ? longBreakInterval
      : pomodoroCount % longBreakInterval

  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,175,220,0.10)"
          strokeWidth={3}
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`hsl(${meta.hue} ${meta.sat}% ${meta.light}%)`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.3s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.6))`,
          }}
        />
      </svg>

      <div className="relative flex flex-col items-center justify-center z-10">
        <span
          className="leading-none tabular-nums"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.6rem, 8vw, 3.6rem)',
            color: `hsl(${meta.hue} ${meta.sat}% ${meta.light}%)`,
            textShadow: `0 0 28px hsl(${meta.hue} ${meta.sat}% ${meta.light}% / 0.55)`,
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {mm}:{ss}
        </span>
        <span
          className="mt-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            color: 'rgba(255,220,235,0.5)',
          }}
        >
          Chu kỳ {cycleNow}/{longBreakInterval}
        </span>
      </div>
    </div>
  )
}

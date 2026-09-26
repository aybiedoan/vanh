import type { PomodoroMode, PomodoroSettings } from './types'

export const STORAGE_KEY = 'lofi-pomodoro-v1'

export const DEFAULT_SETTINGS: PomodoroSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  volume: 0.6,
}

// Cả 3 mode dùng chung một hệ màu mint pastel — lấy đúng tông của "Nghỉ ngắn".
export const MODE_META: Record<
  PomodoroMode,
  { label: string; hue: number; sat: number; light: number }
> = {
  pomodoro:    { label: 'Tập trung', hue: 168, sat: 55, light: 68 },
  short_break: { label: 'Nghỉ ngắn', hue: 168, sat: 55, light: 68 },
  long_break:  { label: 'Nghỉ dài',  hue: 168, sat: 55, light: 68 },
}

export function modeDurationSec(mode: PomodoroMode, s: PomodoroSettings): number {
  const m =
    mode === 'pomodoro' ? s.pomodoro : mode === 'short_break' ? s.shortBreak : s.longBreak
  return Math.max(1, m) * 60
}

export const MODE_ORDER: PomodoroMode[] = ['pomodoro', 'short_break', 'long_break']

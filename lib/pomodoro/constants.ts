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

// Hue riêng cho 3 mode nhưng giữ tông pastel — KHÔNG dùng đỏ/xanh ngọc Pomofocus.
export const MODE_META: Record<
  PomodoroMode,
  { label: string; hue: number; sat: number; light: number }
> = {
  pomodoro:    { label: 'Tập trung', hue: 332, sat: 80, light: 70 }, // hồng chủ đạo
  short_break: { label: 'Nghỉ ngắn', hue: 168, sat: 55, light: 68 }, // mint pastel
  long_break:  { label: 'Nghỉ dài',  hue: 268, sat: 55, light: 74 }, // lavender pastel
}

export function modeDurationSec(mode: PomodoroMode, s: PomodoroSettings): number {
  const m =
    mode === 'pomodoro' ? s.pomodoro : mode === 'short_break' ? s.shortBreak : s.longBreak
  return Math.max(1, m) * 60
}

export const MODE_ORDER: PomodoroMode[] = ['pomodoro', 'short_break', 'long_break']

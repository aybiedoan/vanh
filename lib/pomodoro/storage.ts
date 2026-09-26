import { STORAGE_KEY, DEFAULT_SETTINGS } from './constants'
import type { PersistedState } from './types'

export function loadState(): PersistedState {
  const fallback: PersistedState = {
    settings: DEFAULT_SETTINGS,
    tasks: [],
    activeTaskId: null,
    pomodoroCount: 0,
    mode: 'pomodoro',
  }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      activeTaskId: parsed.activeTaskId ?? null,
      pomodoroCount: parsed.pomodoroCount ?? 0,
      mode: parsed.mode ?? 'pomodoro',
    }
  } catch {
    return fallback
  }
}

export function saveState(s: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {}
}

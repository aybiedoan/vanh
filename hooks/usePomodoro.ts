'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  PomodoroMode,
  PomodoroSettings,
  Task,
  TimerStatus,
} from '@/lib/pomodoro/types'
import {
  DEFAULT_SETTINGS,
  MODE_META,
  modeDurationSec,
} from '@/lib/pomodoro/constants'
import { loadState, saveState } from '@/lib/pomodoro/storage'
import { playBell } from '@/lib/pomodoro/audio'

export type PomodoroStats = {
  totalRemaining: number
  finishAt: Date | null
}

export function usePomodoro() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [mode, setModeState] = useState<PomodoroMode>('pomodoro')
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [secondsLeft, setSecondsLeft] = useState(
    modeDurationSec('pomodoro', DEFAULT_SETTINGS)
  )
  const [totalSec, setTotalSec] = useState(
    modeDurationSec('pomodoro', DEFAULT_SETTINGS)
  )
  const [hydrated, setHydrated] = useState(false)

  // ─── Refs (chống throttle + tránh stale closure) ──────────────────────────
  const endTimestampRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number | null>(null)

  const statusRef = useRef(status)
  statusRef.current = status
  const modeRef = useRef(mode)
  modeRef.current = mode
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const pomodoroCountRef = useRef(pomodoroCount)
  pomodoroCountRef.current = pomodoroCount
  const activeTaskIdRef = useRef(activeTaskId)
  activeTaskIdRef.current = activeTaskId

  // ─── Hydrate từ localStorage (1 lần) ──────────────────────────────────────
  useEffect(() => {
    const s = loadState()
    const dur = modeDurationSec(s.mode, s.settings)
    setSettings(s.settings)
    setTasks(s.tasks)
    setActiveTaskId(s.activeTaskId)
    setPomodoroCount(s.pomodoroCount)
    setModeState(s.mode)
    setSecondsLeft(dur)
    setTotalSec(dur)
    setHydrated(true)
  }, [])

  // ─── Persist mỗi khi dữ liệu ổn định thay đổi ─────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    saveState({ settings, tasks, activeTaskId, pomodoroCount, mode })
  }, [hydrated, settings, tasks, activeTaskId, pomodoroCount, mode])

  // ─── advanceMode: chuyển mode + auto-start ────────────────────────────────
  const advanceMode = useCallback((manualSkip: boolean) => {
    const m = modeRef.current
    const s = settingsRef.current
    const count = pomodoroCountRef.current
    const nextCount = m === 'pomodoro' && !manualSkip ? count + 1 : count

    let next: PomodoroMode
    if (m === 'pomodoro') {
      next =
        nextCount > 0 && nextCount % s.longBreakInterval === 0
          ? 'long_break'
          : 'short_break'
    } else {
      next = 'pomodoro'
    }

    setModeState(next)
    endTimestampRef.current = null
    pausedRemainingRef.current = null
    const dur = modeDurationSec(next, s)
    setTotalSec(dur)
    setSecondsLeft(dur)

    const auto = next === 'pomodoro' ? s.autoStartPomodoros : s.autoStartBreaks
    if (auto && !manualSkip) {
      endTimestampRef.current = Date.now() + dur * 1000
      setStatus('running')
    } else {
      setStatus('idle')
    }
  }, [])

  // ─── handleComplete: tăng counter + chuông + notification ─────────────────
  const handleComplete = useCallback(() => {
    const m = modeRef.current
    const s = settingsRef.current
    const activeId = activeTaskIdRef.current

    if (m === 'pomodoro') {
      // cập nhật ref ngay để advanceMode() nhìn thấy count mới
      pomodoroCountRef.current = pomodoroCountRef.current + 1
      setPomodoroCount(pomodoroCountRef.current)

      if (activeId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId
              ? { ...t, actPomodoros: t.actPomodoros + 1 }
              : t
          )
        )
      }
    }

    if (s.soundEnabled) playBell(s.volume)

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      typeof document !== 'undefined' &&
      document.visibilityState !== 'visible'
    ) {
      const nextLabel =
        m === 'pomodoro'
          ? 'Tới giờ nghỉ rồi đó!'
          : 'Sẵn sàng tập trung lại nha!'
      try {
        new Notification('Hết giờ!', { body: nextLabel, icon: '/favicon.ico' })
      } catch {}
    }

    advanceMode(false)
  }, [advanceMode])

  const handleCompleteRef = useRef(handleComplete)
  handleCompleteRef.current = handleComplete

  // ─── tick: 250ms re-render, KHÔNG trừ dồn ─────────────────────────────────
  const tick = useCallback(() => {
    if (statusRef.current !== 'running' || endTimestampRef.current == null) return
    const remaining = Math.max(
      0,
      Math.ceil((endTimestampRef.current - Date.now()) / 1000)
    )
    setSecondsLeft(remaining)
    if (remaining <= 0) handleCompleteRef.current()
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(tick, 250)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [status, tick])

  // ─── Actions ──────────────────────────────────────────────────────────────
  const startOrPause = useCallback(() => {
    if (statusRef.current === 'running') {
      const remaining = Math.max(
        0,
        Math.ceil(((endTimestampRef.current ?? 0) - Date.now()) / 1000)
      )
      pausedRemainingRef.current = remaining
      endTimestampRef.current = null
      setSecondsLeft(remaining)
      setStatus('paused')
      return
    }

    // Bắt đầu (fresh hoặc resume)
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {})
    }

    const s = settingsRef.current
    const m = modeRef.current
    const resume = statusRef.current === 'paused' && pausedRemainingRef.current != null
    const secs = resume ? (pausedRemainingRef.current as number) : modeDurationSec(m, s)
    if (!resume) setTotalSec(modeDurationSec(m, s))

    endTimestampRef.current = Date.now() + secs * 1000
    pausedRemainingRef.current = null
    setSecondsLeft(secs)
    setStatus('running')
  }, [])

  const reset = useCallback(() => {
    endTimestampRef.current = null
    pausedRemainingRef.current = null
    const dur = modeDurationSec(modeRef.current, settingsRef.current)
    setStatus('idle')
    setTotalSec(dur)
    setSecondsLeft(dur)
  }, [])

  const skip = useCallback(() => {
    advanceMode(true)
  }, [advanceMode])

  const setMode = useCallback((m: PomodoroMode) => {
    endTimestampRef.current = null
    pausedRemainingRef.current = null
    setModeState(m)
    setStatus('idle')
    const dur = modeDurationSec(m, settingsRef.current)
    setTotalSec(dur)
    setSecondsLeft(dur)
  }, [])

  const updateSettings = useCallback((patch: Partial<PomodoroSettings>) => {
    const next: PomodoroSettings = { ...settingsRef.current, ...patch }
    settingsRef.current = next
    setSettings(next)
    if (statusRef.current === 'idle') {
      const dur = modeDurationSec(modeRef.current, next)
      setTotalSec(dur)
      setSecondsLeft(dur)
    }
  }, [])

  // ─── Task CRUD ────────────────────────────────────────────────────────────
  const addTask = useCallback((title: string, estPomodoros: number) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setTasks((prev) => [
      ...prev,
      {
        id,
        title: trimmed,
        estPomodoros: Math.max(1, Math.min(99, Math.round(estPomodoros) || 1)),
        actPomodoros: 0,
        isCompleted: false,
      },
    ])
  }, [])

  const toggleTaskDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    )
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setActiveTaskId((cur) => (cur === id ? null : cur))
  }, [])

  const setActiveTask = useCallback((id: string | null) => {
    setActiveTaskId((cur) => (cur === id ? null : id))
  }, [])

  const updateTaskEstimate = useCallback((id: string, delta: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, estPomodoros: Math.max(1, Math.min(99, t.estPomodoros + delta)) }
          : t
      )
    )
  }, [])

  // ─── Stats dự kiến ────────────────────────────────────────────────────────
  const stats = useMemo<PomodoroStats>(() => {
    const totalRemaining = tasks.reduce(
      (sum, t) => (t.isCompleted ? sum : sum + Math.max(0, t.estPomodoros - t.actPomodoros)),
      0
    )
    if (totalRemaining <= 0) return { totalRemaining: 0, finishAt: null }

    const { pomodoro, shortBreak, longBreak, longBreakInterval } = settings
    let minutes = 0
    for (let i = 0; i < totalRemaining; i++) {
      minutes += pomodoro
      if (i < totalRemaining - 1) {
        const afterThis = pomodoroCount + i + 1
        minutes += afterThis % longBreakInterval === 0 ? longBreak : shortBreak
      }
    }
    return {
      totalRemaining,
      finishAt: new Date(Date.now() + minutes * 60 * 1000),
    }
  }, [tasks, settings, pomodoroCount])

  // ─── Document title ───────────────────────────────────────────────────────
  useEffect(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
    const ss = String(secondsLeft % 60).padStart(2, '0')
    const label = MODE_META[mode].label
    document.title = `[${mm}:${ss}] ${label} · Vanh thi tốt nhaaa!`
  }, [secondsLeft, mode])

  // ─── Favicon động theo mode ───────────────────────────────────────────────
  useEffect(() => {
    const { hue, sat, light } = MODE_META[mode]
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="hsl(${hue} ${sat}% ${light}%)"/></svg>`
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
  }, [mode])

  return {
    // state
    mode,
    status,
    secondsLeft,
    totalSec,
    pomodoroCount,
    settings,
    tasks,
    activeTaskId,
    stats,
    // actions
    startOrPause,
    reset,
    skip,
    setMode,
    updateSettings,
    addTask,
    toggleTaskDone,
    removeTask,
    setActiveTask,
    updateTaskEstimate,
  }
}

export default usePomodoro

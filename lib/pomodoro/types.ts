export type PomodoroMode = 'pomodoro' | 'short_break' | 'long_break'
export type TimerStatus = 'idle' | 'running' | 'paused'

export type PomodoroSettings = {
  pomodoro: number          // phút
  shortBreak: number
  longBreak: number
  longBreakInterval: number // mặc định 4
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
  volume: number            // 0..1
}

export type Task = {
  id: string
  title: string
  estPomodoros: number
  actPomodoros: number
  isCompleted: boolean
}

export type PersistedState = {
  settings: PomodoroSettings
  tasks: Task[]
  activeTaskId: string | null
  pomodoroCount: number
  mode: PomodoroMode
}

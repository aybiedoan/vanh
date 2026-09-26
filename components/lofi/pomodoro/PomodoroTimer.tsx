'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { usePomodoro } from '@/hooks/usePomodoro'
import ModeTabs from './ModeTabs'
import TimerDisplay from './TimerDisplay'
import TimerControls from './TimerControls'
import TaskList from './TaskList'
import SettingsDialog from './SettingsDialog'

export default function PomodoroTimer() {
  const p = usePomodoro()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div
      className="relative select-none w-[min(92vw,420px)] xl:w-[min(48vw,860px)] rounded-2xl"
      style={{
        background: 'rgba(255, 220, 235, 0.02)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 200, 220, 0.06)',
        padding: '22px 26px',
      }}
    >
      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute flex items-center justify-center cursor-pointer transition-colors"
        style={{
          top: 14,
          right: 14,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 200, 220, 0.06)',
          color: '#ffe3f1',
        }}
        title="Cài đặt"
      >
        <Settings size={14} />
      </button>

      <ModeTabs mode={p.mode} onSelect={p.setMode} />

      <div className="flex flex-col xl:flex-row">
        {/* Cột trái: đồng hồ + điều khiển */}
        <div className="flex flex-col items-center justify-center min-w-0 xl:flex-none xl:w-[270px]">
          <TimerDisplay
            mode={p.mode}
            secondsLeft={p.secondsLeft}
            pomodoroCount={p.pomodoroCount}
            longBreakInterval={p.settings.longBreakInterval}
          />
          <TimerControls
            mode={p.mode}
            status={p.status}
            onStartPause={p.startOrPause}
            onReset={p.reset}
            onSkip={p.skip}
          />
        </div>

        {/* Cột phải: Tasks */}
        <div
          className="min-w-0 xl:flex-1 xl:border-l xl:pl-6"
          style={{ borderColor: 'rgba(255,175,220,0.12)' }}
        >
          <TaskList
            tasks={p.tasks}
            activeTaskId={p.activeTaskId}
            onAdd={p.addTask}
            onToggle={p.toggleTaskDone}
            onRemove={p.removeTask}
            onActivate={p.setActiveTask}
            onUpdateEstimate={p.updateTaskEstimate}
            stats={p.stats}
          />
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={p.settings}
        onSave={p.updateSettings}
      />
    </div>
  )
}

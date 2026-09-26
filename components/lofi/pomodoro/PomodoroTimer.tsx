'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ChevronDown, ChevronUp, Play, Pause, Timer } from 'lucide-react'
import { usePomodoro } from '@/hooks/usePomodoro'
import { MODE_META } from '@/lib/pomodoro/constants'
import ModeTabs from './ModeTabs'
import TimerDisplay from './TimerDisplay'
import TimerControls from './TimerControls'
import TaskList from './TaskList'
import SettingsDialog from './SettingsDialog'

export default function PomodoroTimer() {
  const p = usePomodoro()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const meta = MODE_META[p.mode]
  const mm = Math.floor(p.secondsLeft / 60)
  const ss = p.secondsLeft % 60
  const timeLabel = `${mm}:${String(ss).padStart(2, '0')}`
  const isRunning = p.status === 'running'

  return (
    <div
      className={`relative select-none rounded-2xl transition-all duration-300 ease-out ${
        isCollapsed
          ? 'w-[min(92vw,320px)]'
          : 'w-[min(92vw,420px)] xl:w-[min(48vw,860px)]'
      }`}
      style={{
        background: 'rgba(255, 220, 235, 0.02)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 200, 220, 0.06)',
        padding: isCollapsed ? '10px 16px' : '22px 26px',
      }}
    >
      {/* Header bar — luôn hiển thị */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <Timer size={14} style={{ color: 'hsl(330 100% 92%)', flexShrink: 0 }} />
          <span
            className="text-xs font-semibold tracking-widest uppercase truncate"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(330 100% 92%)' }}
          >
            {isCollapsed ? `${meta.label} · ${timeLabel}` : 'Pomodoro'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCollapsed && (
            <button
              onClick={p.startOrPause}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-[#ffe3f1] transition-colors"
              title={isRunning ? 'Tạm dừng' : 'Bắt đầu'}
            >
              {isRunning ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: '#ffe3f1' }}
            title="Cài đặt"
          >
            <Settings size={12} />
          </button>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'hsl(330 100% 92%)' }}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Nội dung có thể mở rộng */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={p.settings}
        onSave={p.updateSettings}
      />
    </div>
  )
}

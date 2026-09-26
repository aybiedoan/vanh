'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import type { Task } from '@/lib/pomodoro/types'
import type { PomodoroStats } from '@/hooks/usePomodoro'
import TaskItem from './TaskItem'

function formatHHMM(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function TaskList({
  tasks,
  activeTaskId,
  onAdd,
  onToggle,
  onRemove,
  onActivate,
  onUpdateEstimate,
  stats,
}: {
  tasks: Task[]
  activeTaskId: string | null
  onAdd: (title: string, est: number) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onActivate: (id: string) => void
  onUpdateEstimate: (id: string, delta: number) => void
  stats: PomodoroStats
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [est, setEst] = useState('1')

  const submit = () => {
    const n = parseInt(est, 10)
    onAdd(title, isNaN(n) ? 1 : n)
    setTitle('')
    setEst('1')
    setOpen(false)
  }

  return (
    <div
      className="mt-5 pt-4 border-t xl:mt-0 xl:pt-0 xl:border-t-0"
      style={{ borderColor: 'rgba(255,175,220,0.12)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="uppercase"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: 'rgba(255,220,235,0.6)',
          }}
        >
          Công việc
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(255,175,220,0.10)',
            border: '1px solid rgba(255,175,220,0.2)',
            color: 'hsl(320 55% 84%)',
          }}
          title="Thêm công việc"
        >
          {open ? <X size={13} /> : <Plus size={13} />}
        </motion.button>
      </div>

      {/* Inline add form */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                  if (e.key === 'Escape') setOpen(false)
                }}
                placeholder="Tên công việc..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#ffe3f1]/40"
                style={{ fontFamily: 'var(--font-body)', color: '#ffe3f1' }}
              />
              <input
                type="number"
                min={1}
                max={99}
                value={est}
                onChange={(e) => setEst(e.target.value)}
                className="bg-transparent text-xs outline-none text-center"
                style={{
                  fontFamily: 'var(--font-body)',
                  width: 34,
                  color: '#ffe3f1',
                  border: '1px solid rgba(255,175,220,0.18)',
                  borderRadius: 8,
                  padding: '2px 4px',
                }}
                title="Số pomodoro dự kiến"
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={submit}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'hsl(332 80% 70% / 0.22)',
                  border: '1px solid hsl(332 80% 70% / 0.45)',
                  color: 'hsl(332 90% 88%)',
                }}
              >
                <Plus size={13} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex flex-col gap-1 no-scrollbar" style={{ maxHeight: 180, overflowY: 'auto' }}>
        {tasks.length === 0 && (
          <p
            className="text-center py-3"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'rgba(255,220,235,0.35)',
            }}
          >
            Chưa có công việc nào...
          </p>
        )}
        {tasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            active={t.id === activeTaskId}
            onToggle={onToggle}
            onRemove={onRemove}
            onActivate={onActivate}
            onUpdateEstimate={onUpdateEstimate}
          />
        ))}
      </div>

      {/* Stats */}
      {stats.totalRemaining > 0 && stats.finishAt && (
        <p
          className="mt-3 text-center"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            color: 'rgba(255,220,235,0.55)',
          }}
        >
          Còn lại: {stats.totalRemaining} pomo · Xong lúc: {formatHHMM(stats.finishAt)}
        </p>
      )}
    </div>
  )
}

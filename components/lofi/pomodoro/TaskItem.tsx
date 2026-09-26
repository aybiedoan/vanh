'use client'

import { Check, Trash2, Minus, Plus } from 'lucide-react'
import type { Task } from '@/lib/pomodoro/types'

export default function TaskItem({
  task,
  active,
  onToggle,
  onRemove,
  onActivate,
  onUpdateEstimate,
}: {
  task: Task
  active: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onActivate: (id: string) => void
  onUpdateEstimate: (id: string, delta: number) => void
}) {
  return (
    <div
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
      style={{
        background: active ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        borderLeft: active
          ? '2px solid hsl(332 80% 70%)'
          : '2px solid transparent',
      }}
    >
      {/* Check */}
      <button
        onClick={() => onToggle(task.id)}
        className="flex items-center justify-center cursor-pointer flex-shrink-0"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: task.isCompleted
            ? 'hsl(332 80% 70% / 0.35)'
            : 'transparent',
          border: task.isCompleted
            ? '1px solid hsl(332 80% 70%)'
            : '1px solid rgba(255, 255, 255, 0.22)',
          color: 'hsl(332 90% 92%)',
        }}
        title={task.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
      >
        {task.isCompleted && <Check size={11} />}
      </button>

      {/* Title (clickable to activate) + estimate stepper */}
      <button
        onClick={() => onActivate(task.id)}
        className="flex-1 flex flex-col items-start min-w-0 cursor-pointer text-left"
      >
        <span
          className="truncate w-full"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            color: task.isCompleted
              ? 'rgba(255,220,235,0.4)'
              : '#ffe3f1',
            textDecoration: task.isCompleted ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
      </button>

      {/* Est stepper (+/-) */}
      <div
        className="flex items-center gap-0.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onUpdateEstimate(task.id, -1)}
          className="hidden sm:flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: 18, height: 18, color: 'rgba(255,220,235,0.55)' }}
          title="Giảm dự kiến"
        >
          <Minus size={11} />
        </button>
        <span
          className="px-2 py-0.5 rounded-full tabular-nums flex-shrink-0"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            background: 'rgba(255,175,220,0.10)',
            border: '1px solid rgba(255,175,220,0.18)',
            color: '#ffe3f1',
          }}
        >
          {task.actPomodoros}/{task.estPomodoros}
        </span>
        <button
          onClick={() => onUpdateEstimate(task.id, 1)}
          className="hidden sm:flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: 18, height: 18, color: 'rgba(255,220,235,0.55)' }}
          title="Tăng dự kiến"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onRemove(task.id)}
        className="flex items-center justify-center flex-shrink-0 cursor-pointer transition-all
          opacity-0 group-hover:opacity-100
          hover:scale-110 active:scale-95
          text-[#ffe3f1]/70 hover:text-white"
        style={{ width: 22, height: 22 }}
        title="Xoá task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

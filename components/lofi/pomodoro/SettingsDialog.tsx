'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { PomodoroSettings } from '@/lib/pomodoro/types'

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(45,20,48,0.92)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,175,220,0.22)',
  color: 'hsl(320 50% 88%)',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.78rem',
  color: 'rgba(255,220,235,0.8)',
  letterSpacing: '0.04em',
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={LABEL_STYLE}>{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (isNaN(n)) return
          onChange(Math.min(max, Math.max(min, n)))
        }}
        style={{
          background: 'rgba(30,12,22,0.55)',
          borderColor: 'rgba(255,182,193,0.22)',
          color: '#fff',
        }}
      />
    </label>
  )
}

export default function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settings: PomodoroSettings
  onSave: (patch: Partial<PomodoroSettings>) => void
}) {
  const [draft, setDraft] = useState<PomodoroSettings>(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  const patch = (p: Partial<PomodoroSettings>) => setDraft((d) => ({ ...d, ...p }))

  const handleSave = () => {
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" style={PANEL_STYLE}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-display)',
              color: 'hsl(320 50% 92%)',
              fontSize: '1.15rem',
            }}
          >
            Cài đặt Pomodoro
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label="Tập trung"
              value={draft.pomodoro}
              min={1}
              max={120}
              onChange={(v) => patch({ pomodoro: v })}
            />
            <NumberField
              label="Nghỉ ngắn"
              value={draft.shortBreak}
              min={1}
              max={60}
              onChange={(v) => patch({ shortBreak: v })}
            />
            <NumberField
              label="Nghỉ dài"
              value={draft.longBreak}
              min={1}
              max={60}
              onChange={(v) => patch({ longBreak: v })}
            />
          </div>

          <NumberField
            label="Số phiên trước nghỉ dài"
            value={draft.longBreakInterval}
            min={2}
            max={8}
            onChange={(v) => patch({ longBreakInterval: v })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={draft.autoStartBreaks}
              onCheckedChange={(v) => patch({ autoStartBreaks: !!v })}
            />
            <span style={LABEL_STYLE}>Tự bắt đầu giờ nghỉ</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={draft.autoStartPomodoros}
              onCheckedChange={(v) => patch({ autoStartPomodoros: !!v })}
            />
            <span style={LABEL_STYLE}>Tự bắt đầu phiên tập trung</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={draft.soundEnabled}
              onCheckedChange={(v) => patch({ soundEnabled: !!v })}
            />
            <span style={LABEL_STYLE}>Bật chuông báo hết giờ</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span style={LABEL_STYLE}>Âm lượng chuông: {Math.round(draft.volume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(draft.volume * 100)}
              onChange={(e) => patch({ volume: Number(e.target.value) / 100 })}
              className="w-full h-1 rounded-full cursor-pointer"
              style={{
                appearance: 'none',
                background: 'rgba(255, 227, 241, 0.15)',
                outline: 'none',
              }}
            />
          </label>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              color: 'rgba(255,220,235,0.45)',
              marginTop: 2,
            }}
          >
            Thay đổi thời lượng áp dụng cho phiên tiếp theo.
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 182, 193, 0.6) 0%, rgba(219, 112, 147, 0.6) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
            }}
          >
            Lưu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

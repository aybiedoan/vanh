'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PomodoroTimer from './pomodoro/PomodoroTimer'
import PlaylistWidget from './PlaylistWidget'
import EnergyBubble from './EnergyBubble'
import ConfessionLetterModal from './ConfessionLetter'
import BirthdayOverlay from './BirthdayOverlay'
import { asset } from '@/lib/asset'

const VIDEO_SRC = asset('/assets/bg/home.mp4')

export default function Dashboard({ onOpenShowroom }: { onOpenShowroom: () => void }) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={constraintsRef} className="fixed inset-0 overflow-hidden">
      {/* Video Background */}
      <video
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />
      {/* Soft overlay to boost contrast */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(60,10,30,0.18) 0%, rgba(60,10,30,0.08) 100%)' }}
      />

      {/* ── CENTERPIECE: Countdown ── */}
      <div
        className="absolute inset-x-0 top-0 flex justify-center z-10 pointer-events-none"
        style={{ paddingTop: '4vh' }}
      >
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <PomodoroTimer containerRef={constraintsRef} />
        </motion.div>
      </div>

      {/* ── BOTTOM-CENTER (Mobile) / BOTTOM-LEFT (Desktop): Playlist ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
        /**
         * - Mặc định (Mobile): Cách đáy 6 (bottom-6), kéo từ left-0 sang right-0 kết hợp mx-auto để CĂN GIỮA.
         * - Trên Desktop (sm): Trả về vị trí cũ góc trái (sm:bottom-8 sm:left-8), hủy thuộc tính right và mx cũ (sm:right-auto sm:mx-0).
         */
        className="absolute bottom-6 left-0 right-0 mx-auto sm:bottom-8 sm:left-8 sm:right-auto sm:mx-0 z-20 w-full max-w-[288px] sm:max-w-none"
      >
        <PlaylistWidget containerRef={constraintsRef} />
      </motion.div>

      {/* ── MIDDLE-RIGHT (Mobile) / BOTTOM-RIGHT (Desktop): Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
        // Trên mobile: Đẩy lên cách đáy 270px để nằm gọn gàng ngay phía trên Playlist Widget mà không bị đè.
        className="absolute bottom-[270px] right-4 sm:bottom-8 sm:right-8 z-20 flex flex-col items-end gap-3"
      >
        {/* Confession Letter (stacked with other action icons) */}
        <ConfessionLetterModal />

        {/* Energy Bubble */}
        <EnergyBubble />

        {/* Birthday Easter Egg */}
        <BirthdayOverlay />

        {/* Gift Box Portal */}
        <GiftPortalButton onOpen={onOpenShowroom} />
      </motion.div>

      {/* Top-right soft label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute top-7 right-8 z-20 text-right pointer-events-none"
      />
      
    </div>
  )
}

function GiftPortalButton({ onOpen }: { onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="relative flex items-center justify-end">
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-12 whitespace-nowrap text-xs tracking-wide pointer-events-none select-none"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 80% 88%)' }}
          >
            Quà 1/6 nè, mở ra xem đi
          </motion.span>
        )}
      </AnimatePresence>
      <motion.button
        onClick={onOpen}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.93 }}
        className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer select-none text-lg"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        animate={{
          boxShadow: [
            '0 0 10px hsl(280 60% 60% / 0.1)',
            '0 0 22px hsl(280 60% 60% / 0.3)',
            '0 0 10px hsl(280 60% 60% / 0.1)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
      >
        <motion.span
          animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ display: 'inline-block' }}
        >
          🎁
        </motion.span>
      </motion.button>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import CountdownTimer from './CountdownTimer'
import PlaylistWidget from './PlaylistWidget'
import EnergyBubble from './EnergyBubble'

const VIDEO_SRC =
  'https://flow-content.google/video/203cbc75-b0e7-46a4-81ad-3b67b565d634?Expires=1780332386&KeyName=labs-flow-prod-cdn-key&Signature=l0JW3cxVeckgA6WzYKAXupQy84U'

export default function Dashboard({ onOpenShowroom }: { onOpenShowroom: () => void }) {
  return (
    <div className="fixed inset-0 overflow-hidden">
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
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ paddingBottom: '6vh' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <CountdownTimer />
        </motion.div>
      </div>

      {/* ── BOTTOM-LEFT: Playlist ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
        className="absolute bottom-8 left-8 z-20"
      >
        <PlaylistWidget />
      </motion.div>

      {/* ── BOTTOM-RIGHT: Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
        className="absolute bottom-8 right-8 z-20 flex flex-col items-end gap-3"
      >
        {/* Energy Bubble */}
        <EnergyBubble />

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
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm cursor-pointer select-none"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        color: 'hsl(332 80% 85%)',
      }}
      animate={{
        boxShadow: [
          '0 0 12px hsl(280 60% 60% / 0.1)',
          '0 0 24px hsl(280 60% 60% / 0.3)',
          '0 0 12px hsl(280 60% 60% / 0.1)',
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
      <span>Quà 1/6 của bé con...</span>
    </motion.button>
  )
}

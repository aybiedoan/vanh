'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('@/components/lofi/Dashboard'), { ssr: false })
const Showroom = dynamic(() => import('@/components/lofi/Showroom'), { ssr: false })

type View = 'dashboard' | 'showroom'

export default function LofiExamCanvas() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Dashboard onOpenShowroom={() => setView('showroom')} />
          </motion.div>
        ) : (
          <motion.div
            key="showroom"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Showroom onBack={() => setView('dashboard')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

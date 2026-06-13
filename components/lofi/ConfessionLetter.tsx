'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Heart, X } from 'lucide-react'

function ConfessionLetterButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.93 }}
      className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer select-none text-lg"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
      animate={{
        y: [0, -6, 0],
        scale: [1, 1.03, 1],
        boxShadow: [
          '0 0 10px hsl(280 60% 60% / 0.1)',
          '0 0 22px hsl(280 60% 60% / 0.3)',
          '0 0 10px hsl(280 60% 60% / 0.1)',
        ],
      }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      💌
    </motion.button>
  )
}

export function ConfessionLetterModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'password' | 'letter'>('password')
  const [password, setPassword] = useState('')
  const [isError, setIsError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('https://nkfwybiufcddmxyavcba.supabase.co/storage/v1/object/sign/Aybie/totinh.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDE0MDQ2Yi1kOTUwLTQ1ZjMtYTRjNC1iMjY2MWMxMzVlYTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBeWJpZS90b3RpbmgubXAzIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTM4NjU3MiwiZXhwIjoxNzgxOTkxMzcyfQ.nXs-lzGPUDAFWE_DkDCS2Px33YcucIUQI2A25QfLMFU')
    if (audioRef.current) {
      audioRef.current.loop = false
      audioRef.current.volume = 0.9
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '1404') {
      setIsError(false)
      setStep('letter')
      // play background music when unlocked (only if supported)
      try {
        const a = audioRef.current
        if (a && typeof a.canPlayType === 'function' && a.canPlayType('audio/mpeg')) {
          try {
            a.currentTime = 0
          } catch (_) {
            /* ignore currentTime set errors */
          }
          a.play().catch((playErr) => {
            console.warn('Confession audio failed to play:', playErr)
          })
        } else if (a) {
          console.warn('Confession audio: browser reports canPlayType false for audio/mpeg')
        }
      } catch (err) {
        console.warn('Confession audio error:', err)
      }
    } else {
      setIsError(true)
      setPassword('')
      setTimeout(() => setIsError(false), 500)
    }
  }

  const resetModal = () => {
    setIsOpen(false)
    setStep('password')
    setPassword('')
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (e) {
        /* ignore */
      }
    }
  }

  return (
    <>
      <ConfessionLetterButton onClick={() => setIsOpen(true)} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
            onClick={resetModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm p-8 text-center rounded-2xl border flex flex-col items-center justify-center"
              style={{
                // Hộp thoại tone hồng kem mờ ảo hòa quyện vào không gian đêm
                background: 'rgba(48, 25, 40, 0.82)',
                borderColor: 'rgba(255, 182, 193, 0.35)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 182, 193, 0.05)',
              }}
            >
              <button 
                onClick={resetModal} 
                className="absolute top-4 right-4 text-pink-300/50 hover:text-pink-200 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>

              {/* BƯỚC 1: NHẬP MẬT KHẨU */}
              {step === 'password' && (
                <motion.div key="pwd-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                  <div 
                    className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 border"
                    style={{
                      background: 'rgba(255, 182, 193, 0.08)',
                      borderColor: 'rgba(255, 182, 193, 0.25)',
                      color: '#ffb6c1'
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <h3 className="font-semibold text-lg text-pink-100 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Mã khóa bí mật
                  </h3>
                  <p className="text-xs text-pink-200/60 mb-5">Nhập mật khẩu để mở thư nhé...</p>

                  <form onSubmit={handlePasswordSubmit}>
                    <motion.input
                      type="password"
                      maxLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center py-2.5 px-4 rounded-xl text-white text-xl tracking-widest focus:outline-none transition-all style-input"
                      style={{
                        background: 'rgba(30, 12, 22, 0.4)',
                        border: '1px solid rgba(255, 182, 193, 0.2)',
                        color: '#fff',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(255, 182, 193, 0.6)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 182, 193, 0.2)'}
                      animate={isError ? { x: [-8, 8, -8, 8, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    />
                    {isError && <p className="text-xs text-red-400/90 mt-2">Hình như chưa đúng rồi... 🤫</p>}
                    
                    <button 
                      type="submit" 
                      className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium shadow-md cursor-pointer transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.6) 0%, rgba(219, 112, 147, 0.6) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        textShadow: '0 1px 4px rgba(0,0,0,0.15)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 182, 193, 0.75) 0%, rgba(219, 112, 147, 0.75) 100%)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 182, 193, 0.6) 0%, rgba(219, 112, 147, 0.6) 100%)'
                      }}
                    >
                      Mở Thư
                    </button>
                  </form>
                </motion.div>
              )}

              {/* BƯỚC 2: BÀY TỎ LỜI YÊU THƯƠNG */}
              {step === 'letter' && (
                <motion.div
                  key="letter-step"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                  className="flex flex-col items-center w-full"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.12, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} 
                    className="mb-5"
                    style={{ color: '#ffb6c1' }}
                  >
                    <Heart size={44} fill="currentColor" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 182, 193, 0.6))' }} />
                  </motion.div>

                  <h2 
                    className="text-xl md:text-2xl text-pink-100 font-bold mb-8 leading-relaxed" 
                    style={{ 
                      fontFamily: 'var(--font-display)', 
                      textShadow: '0 2px 20px rgba(255, 182, 193, 0.4)', 
                      letterSpacing: '0.01em' 
                    }}
                  >
                    "Anh thích em, <br /> làm bạn gái anh nha!"
                  </h2>

                  <motion.p 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 1.5, duration: 0.8 }} 
                    className="text-xs md:text-sm text-pink-200/70 italic font-medium max-w-[240px] leading-relaxed"
                  >
                    Khoan hãy cho anh câu trả lời nhé ☺️
                  </motion.p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ConfessionLetterModal
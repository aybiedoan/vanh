'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Heart, X } from 'lucide-react'

// ─── COMPONENT HIỆU ỨNG TYPING KÈM ÂM THANH CHUẨN XÁC ─────────────────
function TypingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('')
  const onCompleteRef = useRef(onComplete)

  // Cập nhật reference mới nhất của onComplete để tránh stale closure
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let index = 0
    let isCancelled = false
    setDisplayedText('') 

    // Khởi tạo đối tượng âm thanh gõ phím mẫu
    const typeSound = new Audio('https://nkfwybiufcddmxyavcba.supabase.co/storage/v1/object/sign/Aybie/typing.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDE0MDQ2Yi1kOTUwLTQ1ZjMtYTRjNC1iMjY2MWMxMzVlYTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBeWJpZS90eXBpbmcubXAzIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MSM5MTE1MiwiZXhwIjoxNzgxOTk1OTUyfQ.ocPDuQ5hrz9jd-FQOpeyo0g-atIJ11YD009Mjak_yO4')
    typeSound.volume = 0.35
    typeSound.preload = 'auto'

    let timeoutId: ReturnType<typeof setTimeout>

    const type = () => {
      if (isCancelled) return

      if (index < text.length) {
        const nextChar = text.charAt(index)
        
        // FIX: Sử dụng phương thức cắt chuỗi tuyệt đối để không bao giờ bị lặp chữ
        setDisplayedText(text.slice(0, index + 1))

        // FIX SOUND: Clone node giúp âm thanh gõ phím chồng lên nhau mượt mà, không bị nghẹt tiếng
        if (nextChar !== ' ' && nextChar !== '\n') {
          const soundClone = typeSound.cloneNode() as HTMLAudioElement
          soundClone.volume = 0.25
          soundClone.play().catch(() => {})
        }

        index++
        timeoutId = setTimeout(type, 100) // Tốc độ gõ chữ 100ms
      } else {
        // Hoàn thành gõ chữ an toàn
        if (onCompleteRef.current) {
          onCompleteRef.current()
        }
      }
    }

    // Kích hoạt chuỗi gõ chữ sau 200ms khi giao diện ổn định
    timeoutId = setTimeout(type, 200)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [text])

  return (
    <h2 
      className="text-xl md:text-2xl text-pink-100 font-bold mb-8 leading-relaxed min-h-[64px]" 
      style={{ 
        fontFamily: 'var(--font-display)', 
        textShadow: '0 2px 20px rgba(255, 182, 193, 0.4)', 
        letterSpacing: '0.02em',
        whiteSpace: 'pre-line'
      }}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-[3px] h-[22px] bg-pink-300 ml-1 translate-y-0.5"
      />
    </h2>
  )
}

// ─── NÚT BẤM PHONG THƯ HỒNG PASTEL ────────────────────────────────────
function ConfessionLetterButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ 
        scale: 1.12,
        background: 'rgba(255, 200, 220, 0.25)', // Hồng pastel sáng hơn khi đưa chuột vào
        borderColor: 'rgba(255, 180, 210, 0.6)',
      }}
      whileTap={{ scale: 0.93 }}
      className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer select-none text-lg"
      style={{
        // Thiết kế kính mờ tone Hồng Pastel nhẹ nhàng hòa hợp với không gian đêm
        background: 'rgba(255, 192, 203, 0.15)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 182, 193, 0.35)',
      }}
      animate={{
        y: [0, -6, 0],
        scale: [1, 1.03, 1],
        // Vòng hào quang phát sáng mờ hồng pastel nhịp nhàng bao quanh nút
        boxShadow: [
          '0 0 10px 1px rgba(255, 182, 193, 0.2), 0 4px 12px rgba(0,0,0,0.15)',
          '0 0 22px 4px rgba(255, 182, 193, 0.45), 0 4px 12px rgba(0,0,0,0.15)',
          '0 0 10px 1px rgba(255, 182, 193, 0.2), 0 4px 12px rgba(0,0,0,0.15)',
        ],
      }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      💌
    </motion.button>
  )
}

// ─── MODAL ĐIỀU HƯỚNG CHÍNH ───────────────────────────────────────────
export function ConfessionLetterModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'password' | 'letter'>('password')
  const [password, setPassword] = useState('')
  const [isError, setIsError] = useState(false)
  const [showSubText, setShowSubText] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasPlayedAudio = useRef(false) // CHỐNG LẶP NHẠC: Khóa bảo vệ phát nhạc đúng 1 lần

  const playConfessionAudio = () => {
    // Nếu đã phát rồi thì chặn đứng không cho gọi trùng lệnh phát nhạc nữa
    if (hasPlayedAudio.current) return
    hasPlayedAudio.current = true

    try {
      const a = audioRef.current
      if (a && typeof a.canPlayType === 'function' && a.canPlayType('audio/mpeg')) {
        try { a.currentTime = 0 } catch (_) {}
        a.play().catch((playErr) => {
          console.warn('Confession audio failed to play:', playErr)
        })
      }
    } catch (err) {
      console.warn('Confession audio error:', err)
    }
  }

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
    if (password === '1406') {
      setIsError(false)
      setStep('letter')
      
      // Gửi tín hiệu báo cho sảnh biết để pause nhạc nền sảnh
      try { window.dispatchEvent(new Event('confession:play')) } catch {}
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
    setShowSubText(false)
    hasPlayedAudio.current = false // Reset khóa bảo vệ để có thể mở lại lần sau
    
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (e) {}
    }
    // Gửi tín hiệu mở lại nhạc nền sảnh
    try { window.dispatchEvent(new Event('confession:stop')) } catch {}
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

              {/* BƯỚC 1: XÁC THỰC MẬT KHẨU */}
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
                      className="w-full text-center py-2.5 px-4 rounded-xl text-white text-xl tracking-widest focus:outline-none transition-all"
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

              {/* BƯỚC 2: HIỂN THỊ LỜI BÀY TỎ LÃNG MẠN */}
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

                  <TypingText 
                    text={`"Anh thích em, \n làm bạn gái anh nha!"`} 
                    onComplete={() => {
                      setShowSubText(true)
                      playConfessionAudio() // Nhạc phát chuẩn xác duy nhất 1 lần khi kết thúc gõ chữ
                    }} 
                  />

                  <AnimatePresence>
                    {showSubText && (
                      <motion.p 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 1 }} 
                        className="text-xs md:text-sm text-pink-200/70 italic font-medium max-w-[240px] leading-relaxed mt-2"
                      >
                        Khoan hãy cho anh câu trả lời nhé ☺️
                      </motion.p>
                    )}
                  </AnimatePresence>
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
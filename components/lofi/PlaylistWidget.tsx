'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Plus, Trash2, Music2, Play, Pause, SkipForward, SkipBack, Repeat, Repeat1, Shuffle, Volume2, Volume1, VolumeX, ChevronDown, ChevronUp } from 'lucide-react'

// Add styles for range input
const styleSheet = `
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffe3f1;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  }
  
  input[type='range']::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffe3f1;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styleSheet
  document.head.appendChild(style)
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string
          width?: string | number
          height?: string | number
          playerVars: Record<string, number | string>
          events: {
            onReady?: () => void
            onStateChange?: (e: { data: number }) => void
          }
        }
      ) => {
        loadVideoById: (id: string) => void
        playVideo: () => void
        pauseVideo: () => void
        destroy: () => void
        getCurrentTime: () => number
        getDuration: () => number
        seekTo: (seconds: number, allowSeekAhead: boolean) => void
        getPlayerState: () => number
        setVolume: (volume: number) => void
      }
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

type Track = { id: string; title: string; url: string }
type LoopMode = 'all' | 'one' | 'shuffle'

// Default playlist for first-time users
const DEFAULT_TRACKS = [
  {
    id: '6L7AB6w2dgI',
    url: 'https://www.youtube.com/watch?v=6L7AB6w2dgI',
    title: 'Loading...',
  },
]

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const nameEQ = name + '='
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }
  } catch (e) {
    console.warn('Failed to read cookie:', e)
  }
  return null
}

function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return
  try {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = `expires=${date.toUTCString()}`
    const cookieValue = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`
    document.cookie = cookieValue
  } catch (e) {
    console.warn('Failed to set cookie:', e)
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

async function fetchTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    )
    const data = await res.json()
    return data.title || videoId
  } catch {
    return videoId
  }
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Beat animation bars (4 bars, staggered)
function BeatBars() {
  const heights = [0.6, 1, 0.75, 0.9]
  const delays = [0, 0.15, 0.08, 0.22]
  return (
    <span className="flex items-end gap-[2px]" style={{ height: 12 }}>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="block rounded-full"
          style={{
            width: 2,
            background: 'hsl(330 100% 85%)',
            originY: 1,
          }}
          animate={{
            scaleY: [h * 0.4, h, h * 0.55, h * 0.85, h * 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            delay: delays[i],
            ease: 'easeInOut',
          }}
          initial={{ scaleY: h * 0.4, height: 12 }}
        />
      ))}
    </span>
  )
}

export default function PlaylistWidget() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [inputVal, setInputVal] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loopMode, setLoopMode] = useState<LoopMode>('all')
  const [volume, setVolume] = useState(70)
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const dragControls = useDragControls()
  const playerRef = useRef<ReturnType<typeof window.YT.Player> | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const ytApiLoaded = useRef(false)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  // Always-current ref for handleTrackEnd to avoid stale closure inside YT callback
  const handleTrackEndRef = useRef<() => void>(() => {})

  // Sync play state & time via polling
  const startProgressPoll = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (!playerRef.current) return
      try {
        const ct = playerRef.current.getCurrentTime()
        const dur = playerRef.current.getDuration()
        setCurrentTime(ct)
        setDuration(dur)
      } catch {}
    }, 500)
  }, [])

  const stopProgressPoll = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [])

  useEffect(() => () => stopProgressPoll(), [stopProgressPoll])

  // Load from cookies on mount, or initialize with default playlist
  useEffect(() => {
    try {
      const saved = getCookie('lofi-playlist')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTracks(parsed)
          // Auto-play first track
          setTimeout(() => setCurrentIdx(0), 100)
          return
        }
      }
      // First time: initialize with default playlist
      const initDefault = async () => {
        const defaultTracks: Track[] = []
        for (const track of DEFAULT_TRACKS) {
          const title = await fetchTitle(track.id)
          defaultTracks.push({ ...track, title })
        }
        setTracks(defaultTracks)
        setCookie('lofi-playlist', JSON.stringify(defaultTracks))
        // Auto-play first track
        setTimeout(() => setCurrentIdx(0), 100)
      }
      initDefault()
    } catch (e) {
      console.warn('Failed to load playlist from cookie:', e)
    }
  }, [])

  // Save to cookies whenever tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      setCookie('lofi-playlist', JSON.stringify(tracks))
    }
  }, [tracks])

  // Load YouTube API
  // Thay thế đoạn useEffect Load YouTube API cũ trong PlaylistWidget bằng đoạn này:
useEffect(() => {
  // Hàm khởi tạo Player tách riêng để tái sử dụng
  const initYTPlayer = () => {
    if (!playerContainerRef.current || playerRef.current) return

    try {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        width: '1',
        height: '1',
        videoId: '',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true)
            try {
              const saved = getCookie('lofi-playlist')
              if (saved) {
                const savedTracks = JSON.parse(saved) as Track[]
                if (savedTracks.length > 0) {
                  playerRef.current?.loadVideoById(savedTracks[0].id)
                  setTimeout(() => playerRef.current?.playVideo(), 200)
                }
              }
            } catch {}
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgressPoll()
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              stopProgressPoll()
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              stopProgressPoll()
              handleTrackEndRef.current()
            }
          },
        },
      })
    } catch (e) {
      console.warn('Failed to initialize YT Player:', e)
    }
  }

  // BƯỚC QUAN TRỌNG: Nếu global object YT đã sẵn sàng (ở các lần remount sau)
  if (window.YT && window.YT.Player) {
    initYTPlayer()
  } else {
    // Nếu là lần đầu tiên load trang, gán vào callback chờ script gọi
    const existingCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback()
      initYTPlayer()
    }

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script')
      tag.id = 'yt-api-script'
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.head.appendChild(tag)
    }
  }

  // Cleanup function: Hủy player khi user bấm vào showroom để giải phóng DOM
  return () => {
    stopProgressPoll()
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try {
        playerRef.current.destroy()
        playerRef.current = null
      } catch (e) {
        console.warn('Failed to destroy YT player instance:', e)
      }
    }
  }
}, [startProgressPoll, stopProgressPoll])

  // Load & play track when idx changes
  useEffect(() => {
    if (!playerRef.current || !playerReady || tracks.length === 0) return
    const trackId = tracks[currentIdx % tracks.length].id
    try {
      playerRef.current.loadVideoById(trackId)
      // Wait a bit longer for video to load before playing
      const timer = setTimeout(() => {
        try {
          if (playerRef.current) {
            playerRef.current.playVideo()
          }
        } catch (e) {
          console.warn('Failed to play video:', e)
        }
      }, 200)
      setCurrentTime(0)
      setDuration(0)
      return () => clearTimeout(timer)
    } catch (e) {
      console.warn('Failed to load video:', e)
    }
  }, [currentIdx, playerReady])

  // Handle track end based on loop mode
  const handleTrackEnd = useCallback(() => {
    if (tracks.length === 0) return
    if (loopMode === 'one') {
      // Replay current track
      try {
        playerRef.current?.seekTo(0, true)
        playerRef.current?.playVideo()
      } catch {}
    } else if (loopMode === 'shuffle') {
      // Random track (excluding current if possible)
      if (tracks.length === 1) {
        playerRef.current?.seekTo(0, true)
        playerRef.current?.playVideo()
      } else {
        let nextIdx = Math.floor(Math.random() * tracks.length)
        while (nextIdx === currentIdx) {
          nextIdx = Math.floor(Math.random() * tracks.length)
        }
        setCurrentIdx(nextIdx)
      }
    } else {
      // Loop all (default)
      setCurrentIdx((prev) => (prev + 1) % Math.max(tracks.length, 1))
    }
  }, [loopMode, tracks.length, currentIdx])

  // Keep ref always pointing at the latest version so the stale YT closure always calls the right logic
  handleTrackEndRef.current = handleTrackEnd

  const cycleLoopMode = () => {
    setLoopMode((prev) => {
      if (prev === 'all') return 'one'
      if (prev === 'one') return 'shuffle'
      return 'all'
    })
  }

  const togglePlay = () => {
    if (!playerRef.current || tracks.length === 0) return
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    } catch {}
  }

  const skipNext = () => {
    if (tracks.length === 0) return
    if (loopMode === 'shuffle') {
      if (tracks.length === 1) {
        playerRef.current?.seekTo(0, true)
        playerRef.current?.playVideo()
      } else {
        let nextIdx = Math.floor(Math.random() * tracks.length)
        while (nextIdx === currentIdx) {
          nextIdx = Math.floor(Math.random() * tracks.length)
        }
        setCurrentIdx(nextIdx)
      }
    } else {
      setCurrentIdx((prev) => (prev + 1) % tracks.length)
    }
  }

  const skipPrev = () => {
    if (tracks.length === 0) return
    if (loopMode === 'shuffle') {
      if (tracks.length === 1) {
        playerRef.current?.seekTo(0, true)
        playerRef.current?.playVideo()
      } else {
        let nextIdx = Math.floor(Math.random() * tracks.length)
        while (nextIdx === currentIdx) {
          nextIdx = Math.floor(Math.random() * tracks.length)
        }
        setCurrentIdx(nextIdx)
      }
    } else {
      setCurrentIdx((prev) => (prev - 1 + tracks.length) % tracks.length)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const seekTo = ratio * duration
    try {
      playerRef.current.seekTo(seekTo, true)
      setCurrentTime(seekTo)
    } catch {}
  }

  const addTrack = async () => {
    const id = extractVideoId(inputVal.trim())
    if (!id) return
    setIsLoading(true)
    const title = await fetchTitle(id)
    const newTrack: Track = { id, title, url: inputVal.trim() }
    const wasEmpty = tracks.length === 0
    setTracks((prev) => {
      const next = [...prev, newTrack]
      // If playlist was empty, auto-play will be triggered by useEffect on currentIdx change
      if (wasEmpty) {
        // Trigger load by setting currentIdx to 0
        setTimeout(() => {
          setCurrentIdx(0)
        }, 100)
      }
      return next
    })
    setInputVal('')
    setIsLoading(false)
  }

  const removeTrack = (idx: number) => {
    setTracks((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (currentIdx >= next.length && next.length > 0) setCurrentIdx(next.length - 1)
      return next
    })
  }

  const playTrack = (idx: number) => {
    if (idx === currentIdx) {
      togglePlay()
    } else {
      setCurrentIdx(idx)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(newVolume)
      } catch {}
    }
  }

  // Close volume control on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowVolumeControl(false)
    }
    if (showVolumeControl) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showVolumeControl])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const currentTrack = tracks[currentIdx % Math.max(tracks.length, 1)]

  return (
    <motion.div
      layout
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="w-full max-w-[288px] sm:w-72 rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
      style={{ 
        background: 'rgba(255, 220, 235, 0.02)', // Pha tí ánh hồng vào kính ngầm
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 200, 220, 0.06)', // Viền hồng siêu mảnh
        touchAction: 'none'
      }}
    >
      {/* Hidden YT player */}
      <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={playerContainerRef} />
      </div>

      {/* Header Bar */}
      <div 
        onPointerDown={(e) => dragControls.start(e)} 
        className="flex items-center justify-between w-full cursor-move select-none"
      >
        <div className="flex items-center gap-2 truncate flex-1 mr-2">
          {isPlaying ? <BeatBars /> : <Music2 size={14} style={{ color: 'hsl(330 100% 92%)' }} />}
          <span
            className="text-xs font-semibold tracking-widest uppercase truncate"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(330 100% 92%)' }}
          >
            {isCollapsed && tracks.length > 0 ? (currentTrack?.title ?? 'Đang phát...') : 'Playlist học bài'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {isCollapsed && tracks.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-[#ffe3f1] transition-colors"
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5"
            style={{ color: 'hsl(330 100% 92%)' }}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            {/* Now playing + controls */}
            {tracks.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-sm truncate text-center font-semibold text-[#ffe3f1]" style={{ fontFamily: 'var(--font-body)' }}>
                  {currentTrack?.title ?? ''}
                </p>

                {/* Progress bar */}
                <div className="relative h-1 rounded-full cursor-pointer overflow-hidden bg-white/5" onClick={handleSeek}>
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      background: 'hsl(330 100% 90%)', // Thanh chạy hồng phấn phát sáng mờ
                      boxShadow: '0 0 6px rgba(255, 180, 210, 0.5)',
                    }}
                    transition={{ ease: 'linear', duration: 0.5 }}
                  />
                </div>

                {/* Time */}
                <div className="flex justify-between text-[10px] -mt-1 font-medium text-[#ffe3f1]/70" style={{ fontFamily: 'var(--font-body)' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Playback controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={cycleLoopMode}
                    className="transition-all hover:scale-110"
                    style={{ color: loopMode === 'all' ? 'rgba(255,225,235,0.3)' : 'hsl(330 100% 92%)' }}
                  >
                    {loopMode === 'one' ? <Repeat1 size={14} /> : loopMode === 'shuffle' ? <Shuffle size={14} /> : <Repeat size={14} />}
                  </button>

                  <button onClick={skipPrev} className="hover:scale-110 transition-all text-[#ffe3f1]/90 hover:text-white">
                    <SkipBack size={14} />
                  </button>
                  
                  <motion.button
                    onClick={togglePlay}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-[#ffe3f1] hover:bg-white/15"
                    style={{ border: '1px solid rgba(255, 200, 220, 0.1)' }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </motion.button>

                  <button onClick={skipNext} className="hover:scale-110 transition-all text-[#ffe3f1]/90 hover:text-white">
                    <SkipForward size={14} />
                  </button>
                  
                  {/* Volume control */}
                  <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowVolumeControl(!showVolumeControl)} className="hover:scale-110 transition-all text-[#ffe3f1]/90 hover:text-white">
                      {volume === 0 ? <VolumeX size={14} /> : volume < 50 ? <Volume1 size={14} /> : <Volume2 size={14} />}
                    </button>
                    
                    {showVolumeControl && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 flex flex-col items-center gap-2 p-2 rounded-lg bg-purple-950/40 backdrop-blur-md border border-white/5">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-24 h-1 rounded-full cursor-pointer"
                          style={{ appearance: 'none', background: 'rgba(255,255,255,0.15)', outline: 'none' }}
                        />
                        <span className="text-xs text-[#ffe3f1]">{volume}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 border-b pb-2 bg-white/0" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
              <input
                className="flex-1 bg-transparent text-xs outline-none text-[#ffe3f1] placeholder:text-[#ffe3f1]/40"
                style={{ fontFamily: 'var(--font-body)' }}
                placeholder="Dán link YouTube vào đây..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTrack()}
              />
              <motion.button
                onClick={addTrack}
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-[#ffe3f1] hover:bg-white/15"
              >
                <Plus size={14} />
              </motion.button>
            </div>

            {/* Track List */}
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
              {tracks.length === 0 && (
                <p className="text-xs text-center py-3 text-[#ffe3f1]/40">Chưa có bài nào...</p>
              )}
              {tracks.map((track, idx) => (
                <div
                  key={track.id + idx}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ background: idx === currentIdx ? 'rgba(255, 255, 255, 0.04)' : 'transparent' }}
                  onClick={() => playTrack(idx)}
                >
                  <span style={{ width: 10, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {idx === currentIdx && isPlaying ? (
                      <BeatBars />
                    ) : idx === currentIdx ? (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'hsl(330, 100%, 85%)', boxShadow: '0 0 4px hsl(330, 100%, 85%)' }} />
                    ) : null}
                  </span>
                  <span className="flex-1 text-xs truncate text-[#ffe3f1]/80 group-hover:text-white">{track.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTrack(idx); }}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                      /* TRÊN MOBILE: Nền đỏ rực, icon trắng tinh, có shadow phát sáng đỏ cực mạnh để không thể bị chìm */
                      bg-transparent text-white shadow-[0_0_10px_rgba(239,68,68,0.45)]
                      /* ── CHẠM TRÊN MOBILE: Đổi sang nền đỏ kính mờ 20% khi ngón tay nhấn giữ ── */
                      active:bg-red-500/20
                      /* TRÊN DESKTOP (sm): Trở lại trạng thái tinh tế - ẩn đi, chỉ hiện icon trắng mờ khi hover vào dòng bài hát */
                      sm:bg-transparent sm:text-white/60 sm:opacity-0 sm:group-hover:opacity-100 sm:shadow-none
                      /* KHI DI CHUỘT TRỰC TIẾP VÀO NÚT (Desktop): Bật nền đỏ rực, chữ trắng, phóng to nhẹ */
                      hover:sm:bg-red-500/20 hover:sm:text-white hover:sm:shadow-[0_0_10px_rgba(239,68,68,0.45)]
                      hover:scale-110 active:scale-95"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

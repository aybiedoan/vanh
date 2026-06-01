'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Music2, Play, Pause, SkipForward, SkipBack, Repeat, Repeat1, Shuffle } from 'lucide-react'

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
      }
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

type Track = { id: string; title: string; url: string }
type LoopMode = 'all' | 'one' | 'shuffle'

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
            background: 'hsl(332 80% 72%)',
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
  const playerRef = useRef<ReturnType<typeof window.YT.Player> | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const ytApiLoaded = useRef(false)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lofi-playlist')
      if (saved) setTracks(JSON.parse(saved))
    } catch {}
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('lofi-playlist', JSON.stringify(tracks))
  }, [tracks])

  // Load YouTube API
  useEffect(() => {
    if (ytApiLoaded.current) return
    ytApiLoaded.current = true

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script')
      tag.id = 'yt-api-script'
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.head.appendChild(tag)
    }

    window.onYouTubeIframeAPIReady = () => {
      if (!playerContainerRef.current) return
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        width: '1',
        height: '1',
        videoId: '',
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
            // Player ready
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
              // Handle loop modes in a separate effect
              handleTrackEnd()
            }
          },
        },
      })
    }
  }, [])

  // Load & play track when idx changes
  useEffect(() => {
    if (!playerRef.current || tracks.length === 0) return
    const trackId = tracks[currentIdx % tracks.length].id
    try {
      playerRef.current.loadVideoById(trackId)
      setTimeout(() => {
        try {
          playerRef.current?.playVideo()
        } catch {}
      }, 100)
      setCurrentTime(0)
      setDuration(0)
    } catch {}
  }, [currentIdx])

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

  const skipNext = () => setCurrentIdx((prev) => (prev + 1) % Math.max(tracks.length, 1))
  const skipPrev = () => setCurrentIdx((prev) => (prev - 1 + tracks.length) % Math.max(tracks.length, 1))

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
    setTracks((prev) => {
      const next = [...prev, newTrack]
      // Auto-play first added track
      if (prev.length === 0) {
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.loadVideoById(id)
            playerRef.current.playVideo()
          }
        }, 300)
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const currentTrack = tracks[currentIdx % Math.max(tracks.length, 1)]

  return (
    <div
      className="w-72 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
    >
      {/* Hidden YT player — 1x1 pixel off-screen */}
      <div
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      >
        <div ref={playerContainerRef} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2">
        {isPlaying ? <BeatBars /> : <Music2 size={14} style={{ color: 'hsl(332 90% 80%)' }} />}
        <span
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 80% 88%)', opacity: 0.9 }}
        >
          Playlist học bài
        </span>
      </div>

      {/* Now playing + controls */}
      {tracks.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Track name */}
          <p
            className="text-sm truncate text-center font-medium"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 30% 95%)' }}
          >
            {currentTrack?.title ?? ''}
          </p>

          {/* Progress bar */}
          <div
            className="relative h-1 rounded-full cursor-pointer overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            onClick={handleSeek}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                background: 'hsl(332 80% 70%)',
                boxShadow: '0 0 6px hsl(332 80% 70% / 0.6)',
              }}
              transition={{ ease: 'linear', duration: 0.5 }}
            />
          </div>

          {/* Time */}
          <div
            className="flex justify-between text-[10px] -mt-1"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 40% 85%)', opacity: 0.75 }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Loop mode button */}
            <button
              onClick={cycleLoopMode}
              className="transition-all hover:scale-110"
              style={{ 
                color: loopMode === 'all' ? 'hsl(332 60% 70%)' : 'hsl(332 90% 80%)',
                opacity: loopMode === 'all' ? 0.6 : 1,
              }}
              title={loopMode === 'all' ? 'Loop playlist' : loopMode === 'one' ? 'Loop 1 song' : 'Shuffle'}
            >
              {loopMode === 'one' ? (
                <Repeat1 size={14} />
              ) : loopMode === 'shuffle' ? (
                <Shuffle size={14} />
              ) : (
                <Repeat size={14} />
              )}
            </button>
            <button
              onClick={skipPrev}
              className="hover:scale-110 transition-all"
              style={{ color: 'hsl(332 80% 85%)', opacity: 0.7 }}
            >
              <SkipBack size={14} />
            </button>
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(332 70% 55% / 0.35)', color: 'hsl(332 90% 92%)' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </motion.button>
            <button
              onClick={skipNext}
              className="hover:scale-110 transition-all"
              style={{ color: 'hsl(332 80% 85%)', opacity: 0.7 }}
            >
              <SkipForward size={14} />
            </button>
            {/* Spacer for symmetry */}
            <div style={{ width: 14 }} />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
        <input
          className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-50"
          style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 50% 95%)' }}
          placeholder="Dán link YouTube vào đây..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTrack()}
        />
        <motion.button
          onClick={addTrack}
          disabled={isLoading}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ 
            background: 'hsl(332 70% 55% / 0.3)',
            color: 'hsl(332 90% 90%)',
          }}
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <Plus size={14} />
            </motion.div>
          ) : (
            <Plus size={14} />
          )}
        </motion.button>
      </div>

      {/* Track List */}
      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto no-scrollbar">
        {tracks.length === 0 && (
          <p
            className="text-xs text-center py-3"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 50% 80%)', opacity: 0.6 }}
          >
            Chưa có bài nào...
          </p>
        )}
        <AnimatePresence initial={false}>
          {tracks.map((track, idx) => (
            <motion.div
              key={track.id + idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors"
                style={{
                  background: idx === currentIdx ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onClick={() => playTrack(idx)}
              >
                <span style={{ width: 10, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {idx === currentIdx && isPlaying ? (
                    <BeatBars />
                  ) : idx === currentIdx ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'hsl(332 80% 70%)',
                        }}
                      />
                    </motion.div>
                  ) : null}
                </span>
                <span
                  className="flex-1 text-xs truncate"
                  style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 30% 92%)' }}
                >
                  {track.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTrack(idx)
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-100 hover:!bg-red-500/20 transition-all"
                  style={{ color: 'hsl(0 70% 70%)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Music2, ChevronRight } from 'lucide-react'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string
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
      }
      PlayerState: { ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

type Track = { id: string; title: string; url: string }

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
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
    const data = await res.json()
    return data.title || videoId
  } catch {
    return videoId
  }
}

export default function PlaylistWidget() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [inputVal, setInputVal] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const playerRef = useRef<ReturnType<typeof window.YT.Player> | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const ytApiLoaded = useRef(false)

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
        width: '100%',
        height: '0',
        videoId: tracks.length > 0 ? tracks[0].id : '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          fs: 0,
        },
        events: {
          onReady: () => {
            if (tracks.length > 0) {
              playerRef.current?.playVideo()
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              setCurrentIdx((prev) => (prev + 1) % Math.max(tracks.length, 1))
            }
          },
        },
      })
    }
  }, [tracks.length])

  // Play current track
  useEffect(() => {
    if (!playerRef.current || tracks.length === 0) return
    const trackId = tracks[currentIdx % tracks.length].id
    playerRef.current.loadVideoById(trackId)
    try {
      playerRef.current.playVideo()
    } catch {}
  }, [currentIdx, tracks.length, tracks])

  const addTrack = async () => {
    const id = extractVideoId(inputVal.trim())
    if (!id) return
    setIsLoading(true)
    const title = await fetchTitle(id)
    const newTrack: Track = { id, title, url: inputVal.trim() }
    setTracks((prev) => [...prev, newTrack])
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
    if (idx === currentIdx) return
    setCurrentIdx(idx)
  }

  return (
    <div
      className="w-72 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
    >
      {/* Hidden YT player */}
      <div ref={playerContainerRef} className="hidden absolute" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Music2 size={14} style={{ color: 'hsl(332 80% 72%)' }} />
        <span
          className="text-xs tracking-widest uppercase opacity-70"
          style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 60% 80%)' }}
        >
          Playlist học bài
        </span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <input
          className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-30"
          style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 40% 90%)' }}
          placeholder="Dán link YouTube vào đây..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTrack()}
        />
        <button
          onClick={addTrack}
          disabled={isLoading}
          className="opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'hsl(332 80% 72%)' }}
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <Plus size={14} />
            </motion.div>
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>

      {/* Track List */}
      <div className="flex flex-col gap-1 max-h-44 overflow-y-auto no-scrollbar">
        {tracks.length === 0 && (
          <p className="text-xs opacity-30 text-center py-3" style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 40% 80%)' }}>
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
                {idx === currentIdx ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    <ChevronRight size={10} style={{ color: 'hsl(332 80% 70%)' }} />
                  </motion.div>
                ) : (
                  <div style={{ width: 10 }} />
                )}
                <span
                  className="flex-1 text-xs truncate opacity-80"
                  style={{ fontFamily: 'var(--font-body)', color: 'hsl(332 20% 88%)' }}
                >
                  {track.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeTrack(idx) }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  style={{ color: 'hsl(332 80% 70%)' }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

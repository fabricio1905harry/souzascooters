import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getPhotoUrl } from '../../lib/supabase'
import type { MotoFoto } from '../../types'

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MS = 300

interface Props {
  fotos: MotoFoto[]
  initialIndex: number
  alt: string
  onClose: () => void
}

function distance(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}

export default function ImageZoomModal({ fotos, initialIndex, alt, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [interacting, setInteracting] = useState(false)

  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const lastTap = useRef(0)

  function resetZoom() {
    setScale(1)
    setPos({ x: 0, y: 0 })
  }

  function goTo(newIndex: number) {
    setIndex(newIndex)
    resetZoom()
  }

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && fotos.length > 1) {
        goTo((index - 1 + fotos.length) % fotos.length)
      } else if (e.key === 'ArrowRight' && fotos.length > 1) {
        goTo((index + 1) % fotos.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, fotos.length, onClose])

  function toggleZoomAt(clientX: number, clientY: number, target: HTMLElement) {
    if (scale > 1) {
      resetZoom()
      return
    }
    const rect = target.getBoundingClientRect()
    const offsetX = (clientX - rect.left - rect.width / 2) * -1 * (DOUBLE_TAP_SCALE - 1)
    const offsetY = (clientY - rect.top - rect.height / 2) * -1 * (DOUBLE_TAP_SCALE - 1)
    setScale(DOUBLE_TAP_SCALE)
    setPos({ x: offsetX, y: offsetY })
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale - e.deltaY * 0.01))
    setScale(next)
    if (next === 1) setPos({ x: 0, y: 0 })
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (scale <= 1) return
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y }
    setInteracting(true)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragStart.current) return
    setPos({
      x: dragStart.current.posX + (e.clientX - dragStart.current.x),
      y: dragStart.current.posY + (e.clientY - dragStart.current.y),
    })
  }

  function handleMouseUp() {
    dragStart.current = null
    setInteracting(false)
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    toggleZoomAt(e.clientX, e.clientY, e.currentTarget)
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: distance(e.touches[0], e.touches[1]), scale }
      setInteracting(true)
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          posX: pos.x,
          posY: pos.y,
        }
        setInteracting(true)
      }
      const now = Date.now()
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        toggleZoomAt(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault()
      const newDist = distance(e.touches[0], e.touches[1])
      const ratio = newDist / pinchStart.current.dist
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current.scale * ratio)))
    } else if (e.touches.length === 1 && dragStart.current) {
      e.preventDefault()
      setPos({
        x: dragStart.current.posX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.posY + (e.touches[0].clientY - dragStart.current.y),
      })
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length < 2) pinchStart.current = null
    if (e.touches.length === 0) {
      dragStart.current = null
      setInteracting(false)
      if (scale < MIN_SCALE) resetZoom()
    }
  }

  const foto = fotos[index]
  if (!foto) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
      >
        <X className="h-6 w-6" />
      </button>

      {fotos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goTo((index - 1 + fotos.length) % fotos.length)
            }}
            aria-label="Foto anterior"
            className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goTo((index + 1) % fotos.length)
            }}
            aria-label="Próxima foto"
            className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="flex h-full w-full items-center justify-center overflow-hidden touch-none select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={getPhotoUrl(foto.storage_path)}
          alt={`${alt} — foto ${index + 1}`}
          draggable={false}
          className="max-h-full max-w-full object-contain"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: interacting ? 'none' : 'transform 0.15s ease-out',
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
        />
      </div>

      {fotos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          {index + 1} / {fotos.length}
        </div>
      )}
    </div>
  )
}

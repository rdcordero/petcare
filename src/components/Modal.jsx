import { useEffect, useRef, useCallback } from 'react'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  animation: 'fadeIn .2s ease'
}

const sheet = {
  background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 430,
  maxHeight: '85vh', overflow: 'auto', padding: '20px 18px 28px',
  animation: 'slideUp .25s ease', transition: 'transform .15s ease',
  willChange: 'transform'
}

const handleArea = {
  padding: '8px 0 6px', cursor: 'grab', touchAction: 'none'
}

const bar = {
  width: 40, height: 4, borderRadius: 2, background: '#ccc',
  margin: '0 auto'
}

const titleStyle = {
  fontSize: 18, fontWeight: 700, margin: '14px 0 16px', color: '#1e1e2f'
}

export default function Modal({ open, onClose, title, children }) {
  const sheetRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const onStart = useCallback((clientY) => {
    dragging.current = true
    startY.current = clientY
    currentY.current = 0
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }, [])

  const onMove = useCallback((clientY) => {
    if (!dragging.current) return
    const diff = clientY - startY.current
    currentY.current = Math.max(0, diff)
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${currentY.current}px)`
  }, [])

  const onEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (sheetRef.current) sheetRef.current.style.transition = 'transform .2s ease'
    if (currentY.current > 100) {
      if (sheetRef.current) sheetRef.current.style.transform = 'translateY(100%)'
      setTimeout(onClose, 200)
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = 'translateY(0)'
    }
  }, [onClose])

  const handleTouchStart = useCallback((e) => onStart(e.touches[0].clientY), [onStart])
  const handleTouchMove = useCallback((e) => onMove(e.touches[0].clientY), [onMove])
  const handleMouseDown = useCallback((e) => onStart(e.clientY), [onStart])
  const handleMouseMove = useCallback((e) => onMove(e.clientY), [onMove])

  useEffect(() => {
    const mouseUp = () => onEnd()
    const mouseMove = (e) => handleMouseMove(e)
    if (open) {
      window.addEventListener('mouseup', mouseUp)
      window.addEventListener('mousemove', mouseMove)
    }
    return () => {
      window.removeEventListener('mouseup', mouseUp)
      window.removeEventListener('mousemove', mouseMove)
    }
  }, [open, onEnd, handleMouseMove])

  if (!open) return null

  return (
    <div style={overlay} onClick={onClose}>
      <div ref={sheetRef} style={sheet} onClick={e => e.stopPropagation()}>
        <div
          style={handleArea}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={onEnd}
          onMouseDown={handleMouseDown}
        >
          <div style={bar} />
        </div>
        {title && <h3 style={titleStyle}>{title}</h3>}
        {children}
      </div>
    </div>
  )
}

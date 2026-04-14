import { useEffect } from 'react'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  animation: 'fadeIn .2s ease'
}

const sheet = {
  background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 430,
  maxHeight: '85vh', overflow: 'auto', padding: '20px 18px 28px',
  animation: 'slideUp .25s ease'
}

const bar = {
  width: 40, height: 4, borderRadius: 2, background: '#ccc',
  margin: '0 auto 14px'
}

const titleStyle = {
  fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#1e1e2f'
}

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={bar} />
        {title && <h3 style={titleStyle}>{title}</h3>}
        {children}
      </div>
    </div>
  )
}

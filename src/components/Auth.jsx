import { useState } from 'react'
import { supabase } from '../supabase'

const wrap = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)', padding: 16
}

const card = {
  background: '#fff', borderRadius: 18, padding: '32px 24px', width: '100%',
  maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.12)'
}

const logo = { textAlign: 'center', fontSize: 40, marginBottom: 4 }
const h1 = { textAlign: 'center', fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#1e1e2f' }
const sub = { textAlign: 'center', fontSize: 13, color: '#888', margin: '0 0 20px' }

const tabs = {
  display: 'flex', borderRadius: 10, overflow: 'hidden',
  border: '1px solid #e5e5e5', marginBottom: 20
}

const tabBtn = (active) => ({
  flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  background: active ? '#7C3AED' : '#fff', color: active ? '#fff' : '#555',
  transition: 'all .2s'
})

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd',
  fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none'
}

const btnStyle = {
  width: '100%', padding: '13px 0', border: 'none', borderRadius: 12, cursor: 'pointer',
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', color: '#fff',
  fontWeight: 700, fontSize: 16
}

const errStyle = {
  color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 10
}

const errorMessages = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'Debes confirmar tu correo electrónico',
  'User already registered': 'Este correo ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'El formato del correo no es válido',
  'Signup requires a valid password': 'Debes ingresar una contraseña válida'
}

function translateError(msg) {
  if (!msg) return ''
  for (const [en, es] of Object.entries(errorMessages)) {
    if (msg.includes(en)) return es
  }
  return msg
}

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (tab === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(translateError(err.message))
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(translateError(err.message))
      else setSuccess('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.')
    }
    setLoading(false)
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={logo}>🐾</div>
        <h1 style={h1}>PetCare</h1>
        <p style={sub}>Seguimiento del cuidado de tus perritos</p>

        <div style={tabs}>
          <button style={tabBtn(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
            Iniciar sesión
          </button>
          <button style={tabBtn(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p style={errStyle}>{error}</p>}
          {success && <p style={{ ...errStyle, color: '#22c55e' }}>{success}</p>}
          <button style={btnStyle} disabled={loading} type="submit">
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

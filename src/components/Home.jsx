import { useState, useEffect } from 'react'
import { useDogs } from '../hooks/useDogs'
import { supabase } from '../supabase'
import Modal from './Modal'

/* ---------- helpers ---------- */
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function calcAge(birthdate) {
  if (!birthdate) return null
  const diff = Date.now() - new Date(birthdate + 'T00:00:00').getTime()
  const years = Math.floor(diff / 31557600000)
  const months = Math.floor((diff % 31557600000) / 2629800000)
  if (years > 0) return `${years} año${years > 1 ? 's' : ''}${months ? `, ${months} mes${months > 1 ? 'es' : ''}` : ''}`
  return `${months} mes${months > 1 ? 'es' : ''}`
}

/* ---------- styles ---------- */
const header = {
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', padding: '22px 18px 18px',
  color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
}

const grid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 14, padding: 16
}

const dogCard = {
  background: '#fff', borderRadius: 16, padding: 18, textAlign: 'center',
  boxShadow: '0 2px 12px rgba(0,0,0,.06)', cursor: 'pointer', transition: 'transform .15s'
}

const emoji = { fontSize: 42, marginBottom: 6 }
const nameStyle = { fontWeight: 700, fontSize: 16, color: '#1e1e2f', margin: '0 0 2px' }
const breed = { fontSize: 12, color: '#888', margin: 0 }

const addBtn = {
  width: 48, height: 48, borderRadius: '50%', border: 'none', background: '#fff',
  color: '#7C3AED', fontSize: 28, cursor: 'pointer', fontWeight: 700,
  boxShadow: '0 2px 10px rgba(0,0,0,.1)'
}

const alertBox = {
  background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12,
  padding: '12px 16px', margin: '0 16px 12px', fontSize: 13, color: '#92400E'
}

const summaryWrap = {
  display: 'flex', gap: 8, padding: '0 16px 10px'
}

const summaryCard = (bg) => ({
  flex: 1, background: bg, borderRadius: 12, padding: '10px 8px',
  textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 600
})

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #ddd',
  fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none'
}

const btnPrimary = {
  width: '100%', padding: '13px 0', border: 'none', borderRadius: 12, cursor: 'pointer',
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', color: '#fff',
  fontWeight: 700, fontSize: 15
}

const emptyState = {
  textAlign: 'center', padding: '48px 24px', color: '#aaa'
}

const EMOJIS = ['🐶', '🐕', '🦮', '🐩', '🐕‍🦺', '🐾', '🐺', '🌭']

/* ---------- component ---------- */
const photoThumb = {
  width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
  marginBottom: 6, border: '2px solid #EDE9FE'
}

export default function Home({ onSelect }) {
  const { dogs, loading, addDog } = useDogs()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', breed: '', birthdate: '', emoji: '🐶', height: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [reminders, setReminders] = useState([])
  const [summary, setSummary] = useState({ vacuna: 0, desparasitante: 0, baño: 0, veterinario: 0 })

  /* fetch reminders & summary */
  useEffect(() => {
    if (!dogs.length) return
    const ids = dogs.map(d => d.id)
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 86400000)

    supabase
      .from('care_records')
      .select('*')
      .in('dog_id', ids)
      .not('next_date', 'is', null)
      .lte('next_date', in30.toISOString().slice(0, 10))
      .order('next_date')
      .then(({ data }) => {
        if (data) setReminders(data)
      })

    /* summary counts */
    supabase
      .from('care_records')
      .select('type')
      .in('dog_id', ids)
      .then(({ data }) => {
        if (!data) return
        const s = { vacuna: 0, desparasitante: 0, baño: 0, otro: 0 }
        data.forEach(r => { s[r.type] = (s[r.type] || 0) + 1 })
        supabase
          .from('vet_visits')
          .select('id')
          .in('dog_id', ids)
          .then(({ data: vd }) => {
            setSummary({ ...s, veterinario: vd ? vd.length : 0 })
          })
      })
  }, [dogs])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await addDog({
      name: form.name, breed: form.breed || null,
      birthdate: form.birthdate || null, emoji: form.emoji,
      height: form.height ? parseFloat(form.height) : null
    }, photoFile)
    setForm({ name: '', breed: '', birthdate: '', emoji: '🐶', height: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setModal(false)
  }

  const getDogName = (dogId) => dogs.find(d => d.id === dogId)?.name || ''

  return (
    <div>
      {/* Header */}
      <div style={header}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🐾 PetCare</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Cuidado de tus perritos</div>
        </div>
        <button style={addBtn} onClick={() => setModal(true)} title="Agregar perro">+</button>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div style={alertBox}>
          ⚠️ <strong>Recordatorios próximos:</strong>
          {reminders.slice(0, 5).map(r => (
            <div key={r.id} style={{ marginTop: 4 }}>
              • {r.name} ({r.type}) — <strong>{getDogName(r.dog_id)}</strong> — {fmtDate(r.next_date)}
              {new Date(r.next_date + 'T00:00:00') < new Date() ? ' 🔴 Vencido' : ' 🟡 Pronto'}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {dogs.length > 0 && (
        <div style={summaryWrap}>
          <div style={summaryCard('#7C3AED')}>💉 Vacunas<br />{summary.vacuna}</div>
          <div style={summaryCard('#F472B6')}>💊 Despara.<br />{summary.desparasitante}</div>
          <div style={summaryCard('#60A5FA')}>🛁 Baños<br />{summary.baño}</div>
          <div style={summaryCard('#34D399')}>🏥 Vet<br />{summary.veterinario}</div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={emptyState}>Cargando...</div>
      ) : dogs.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐶</div>
          <p style={{ fontWeight: 600, color: '#666' }}>Aún no tienes perros registrados</p>
          <p>Toca el botón <strong>+</strong> para agregar tu primer perrito</p>
        </div>
      ) : (
        <div style={grid}>
          {dogs.map(d => (
            <div key={d.id} style={dogCard} onClick={() => onSelect(d)}>
              {d.photo_url
                ? <img src={d.photo_url} alt={d.name} style={photoThumb} />
                : <div style={emoji}>{d.emoji || '🐶'}</div>
              }
              <p style={nameStyle}>{d.name}</p>
              <p style={breed}>{d.breed || 'Sin raza'}</p>
              {d.birthdate && <p style={{ ...breed, marginTop: 2 }}>{calcAge(d.birthdate)}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar perro */}
      <Modal open={modal} onClose={() => setModal(false)} title="Agregar perro">
        <form onSubmit={handleAdd}>
          <input style={inputStyle} placeholder="Nombre *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} placeholder="Raza" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Fecha de nacimiento</label>
          <input style={inputStyle} type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} />
          <input style={inputStyle} type="number" step="0.01" placeholder="Altura (cm)" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Foto de tu perro</label>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            {photoPreview && <img src={photoPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid #EDE9FE' }} />}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {EMOJIS.map(em => (
              <button
                type="button" key={em}
                style={{
                  fontSize: 28, background: form.emoji === em ? '#EDE9FE' : 'transparent',
                  border: form.emoji === em ? '2px solid #7C3AED' : '2px solid transparent',
                  borderRadius: 10, padding: '4px 8px', cursor: 'pointer'
                }}
                onClick={() => setForm({ ...form, emoji: em })}
              >{em}</button>
            ))}
          </div>
          <button style={btnPrimary} type="submit">Guardar</button>
        </form>
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useCare } from '../hooks/useCare'
import { useVet } from '../hooks/useVet'
import { useWeight } from '../hooks/useWeight'
import { useDogs } from '../hooks/useDogs'
import { useVetClinics } from '../hooks/useVetClinics'
import Modal from './Modal'

/* ---------- helpers ---------- */
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function calcAge(birthdate) {
  if (!birthdate) return ''
  const diff = Date.now() - new Date(birthdate + 'T00:00:00').getTime()
  const y = Math.floor(diff / 31557600000)
  const m = Math.floor((diff % 31557600000) / 2629800000)
  if (y > 0) return `${y} año${y > 1 ? 's' : ''}${m ? `, ${m} mes${m > 1 ? 'es' : ''}` : ''}`
  return `${m} mes${m > 1 ? 'es' : ''}`
}

function careStatus(nextDate) {
  if (!nextDate) return { label: 'Sin fecha', color: '#888', bg: '#f5f5f5' }
  const diff = (new Date(nextDate + 'T00:00:00') - new Date()) / 86400000
  if (diff < 0) return { label: 'Vencido', color: '#DC2626', bg: '#FEE2E2' }
  if (diff <= 30) return { label: 'Pronto', color: '#D97706', bg: '#FEF3C7' }
  return { label: 'Al día', color: '#16A34A', bg: '#DCFCE7' }
}

/* ---------- styles ---------- */
const headerStyle = {
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', padding: '18px 16px 20px',
  color: '#fff', position: 'relative'
}
const backBtn = {
  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
  padding: '6px 14px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14
}
const profileRow = { display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }
const emojiLg = { fontSize: 52 }
const profilePhoto = {
  width: 60, height: 60, borderRadius: '50%', objectFit: 'cover',
  border: '3px solid rgba(255,255,255,0.5)'
}
const nameStyle = { fontSize: 22, fontWeight: 800, margin: 0 }
const metaStyle = { fontSize: 13, opacity: 0.9, margin: '2px 0 0' }

const actionsRow = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 16px'
}
const actionBtn = (bg) => ({
  padding: '12px 0', borderRadius: 12, border: 'none',
  background: bg, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  textAlign: 'center'
})

const tabsRow = {
  display: 'flex', borderBottom: '2px solid #eee', margin: '0 16px', gap: 0
}
const tabStyle = (active) => ({
  flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
  fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer',
  borderBottom: active ? '2px solid #7C3AED' : '2px solid transparent',
  color: active ? '#7C3AED' : '#888'
})

const listWrap = { padding: '12px 16px' }
const cardStyle = {
  background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
  boxShadow: '0 1px 6px rgba(0,0,0,.05)', position: 'relative'
}
const badge = (s) => ({
  display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 10px',
  borderRadius: 20, background: s.bg, color: s.color
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
const deleteBtn = {
  position: 'absolute', top: 10, right: 12, background: 'none', border: 'none',
  color: '#ccc', cursor: 'pointer', fontSize: 16
}

const emptyState = { textAlign: 'center', padding: '32px 16px', color: '#aaa', fontSize: 14 }

const CARE_TYPES = [
  { value: 'vacuna', label: '💉 Vacuna' },
  { value: 'desparasitante', label: '💊 Desparasitante' },
  { value: 'antipulgas', label: '🐛 Antipulgas' },
  { value: 'baño', label: '🛁 Baño' },
  { value: 'otro', label: '📝 Otro' }
]

/* ---------- component ---------- */
const EMOJIS = ['🐶', '🐕', '🦮', '🐩', '🐕‍🦺', '🐾', '🐺', '🌭']

export default function DogDetail({ dog, onBack, onDogUpdated }) {
  const { records, fetchRecords, addRecord, deleteRecord } = useCare(dog.id)
  const { visits, fetchVisits, addVisit, deleteVisit } = useVet(dog.id)
  const { weights, fetchWeights, addWeight, deleteWeight } = useWeight(dog.id)
  const { deleteDog, updateDog } = useDogs()
  const { clinics } = useVetClinics()

  const [tab, setTab] = useState('care')
  const [modal, setModal] = useState(null) // 'care' | 'vet' | 'weight' | 'delete' | 'edit'

  const [careForm, setCareForm] = useState({ type: 'vacuna', name: '', date: '', next_date: '', notes: '' })
  const [vetForm, setVetForm] = useState({ date: '', vet: '', reason: '', notes: '', clinic_id: '' })

  // Default clinic for vet visit modal
  const defaultClinicId = dog.clinic_id || (clinics.length === 1 ? clinics[0].id : '')
  const [weightForm, setWeightForm] = useState({ date: '', lb: '' })
  const [editForm, setEditForm] = useState({ name: '', breed: '', birthdate: '', emoji: '🐶', height: '', clinic_id: '' })
  const [editPhoto, setEditPhoto] = useState(null)
  const [editPreview, setEditPreview] = useState(null)

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { fetchVisits() }, [fetchVisits])
  useEffect(() => { fetchWeights() }, [fetchWeights])

  const lastWeight = weights.length > 0 ? weights[0] : null

  /* --- actions --- */
  const handleAddCare = async (e) => {
    e.preventDefault()
    await addRecord({
      type: careForm.type, name: careForm.name, date: careForm.date,
      next_date: careForm.next_date || null, notes: careForm.notes || null
    })
    setCareForm({ type: 'vacuna', name: '', date: '', next_date: '', notes: '' })
    setModal(null)
  }

  const handleAddVet = async (e) => {
    e.preventDefault()
    await addVisit({
      date: vetForm.date, vet: vetForm.vet || null,
      reason: vetForm.reason, notes: vetForm.notes || null,
      clinic_id: vetForm.clinic_id || null
    })
    setVetForm({ date: '', vet: '', reason: '', notes: '', clinic_id: '' })
    setModal(null)
  }

  const handleAddWeight = async (e) => {
    e.preventDefault()
    await addWeight({ date: weightForm.date, lb: parseFloat(weightForm.lb) })
    setWeightForm({ date: '', lb: '' })
    setModal(null)
  }

  const openEdit = () => {
    setEditForm({
      name: dog.name || '',
      breed: dog.breed || '',
      birthdate: dog.birthdate || '',
      emoji: dog.emoji || '🐶',
      height: dog.height || '',
      clinic_id: dog.clinic_id || ''
    })
    setEditPhoto(null)
    setEditPreview(dog.photo_url || null)
    setModal('edit')
  }

  const handleEditPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setEditPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setEditPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const updates = {
      name: editForm.name,
      breed: editForm.breed || null,
      birthdate: editForm.birthdate || null,
      emoji: editForm.emoji,
      height: editForm.height ? parseFloat(editForm.height) : null,
      clinic_id: editForm.clinic_id || null
    }
    const updated = await updateDog(dog.id, updates, editPhoto)
    if (updated && onDogUpdated) onDogUpdated(updated)
    setModal(null)
  }

  const handleDelete = async () => {
    await deleteDog(dog.id)
    onBack()
  }

  /* --- export PDF --- */
  const exportPDF = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>PetCare - ${dog.name}</title>
<style>body{font-family:system-ui;max-width:700px;margin:auto;padding:24px}
h1{color:#7C3AED}h2{color:#F472B6;border-bottom:2px solid #F472B6;padding-bottom:4px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #eee}
th{background:#F5F3FF;font-size:13px}</style></head><body>
<h1>${dog.emoji || '🐶'} ${dog.name}</h1>
<p><strong>Raza:</strong> ${dog.breed || 'N/A'} | <strong>Edad:</strong> ${calcAge(dog.birthdate) || 'N/A'}${lastWeight ? ` | <strong>Peso:</strong> ${lastWeight.lb} lb` : ''}</p>
<h2>💉 Cuidados</h2>
${records.length ? `<table><tr><th>Tipo</th><th>Nombre</th><th>Fecha</th><th>Próxima</th><th>Notas</th></tr>
${records.map(r => `<tr><td>${r.type}</td><td>${r.name}</td><td>${fmtDate(r.date)}</td><td>${fmtDate(r.next_date)}</td><td>${r.notes || ''}</td></tr>`).join('')}</table>` : '<p>Sin registros</p>'}
<h2>🏥 Veterinario</h2>
${visits.length ? `<table><tr><th>Fecha</th><th>Vet</th><th>Motivo</th><th>Notas</th></tr>
${visits.map(v => `<tr><td>${fmtDate(v.date)}</td><td>${v.vet || ''}</td><td>${v.reason}</td><td>${v.notes || ''}</td></tr>`).join('')}</table>` : '<p>Sin visitas</p>'}
<h2>⚖️ Peso</h2>
${weights.length ? `<table><tr><th>Fecha</th><th>Peso (lb)</th></tr>
${weights.map(w => `<tr><td>${fmtDate(w.date)}</td><td>${w.lb}</td></tr>`).join('')}</table>` : '<p>Sin registros</p>'}
<p style="color:#aaa;font-size:12px;margin-top:32px">Generado por PetCare — ${new Date().toLocaleDateString('es-SV')}</p>
</body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={backBtn} onClick={onBack}>← Volver</button>
          <button style={{ ...backBtn, fontSize: 16 }} onClick={openEdit}>✏️</button>
        </div>
        <div style={profileRow}>
          {dog.photo_url
            ? <img src={dog.photo_url} alt={dog.name} style={profilePhoto} />
            : <div style={emojiLg}>{dog.emoji || '🐶'}</div>
          }
          <div>
            <h2 style={nameStyle}>{dog.name}</h2>
            <p style={metaStyle}>{dog.breed || 'Sin raza'}{dog.birthdate ? ` · ${calcAge(dog.birthdate)}` : ''}</p>
            {lastWeight && <p style={metaStyle}>⚖️ {lastWeight.lb} lb</p>}
            {dog.clinic_id && (() => { const c = clinics.find(cl => cl.id === dog.clinic_id); return c ? <p style={metaStyle}>🏥 {c.name}</p> : null })()}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={actionsRow}>
        <button style={actionBtn('#7C3AED')} onClick={() => setModal('care')}>💉 Cuidado</button>
        <button style={actionBtn('#F472B6')} onClick={() => { setVetForm(f => ({ ...f, clinic_id: f.clinic_id || defaultClinicId })); setModal('vet') }}>🏥 Veterinario</button>
        <button style={actionBtn('#60A5FA')} onClick={() => setModal('weight')}>⚖️ Peso</button>
        <button style={actionBtn('#34D399')} onClick={exportPDF}>📄 PDF</button>
      </div>

      {/* Tabs */}
      <div style={tabsRow}>
        <button style={tabStyle(tab === 'care')} onClick={() => setTab('care')}>Cuidados</button>
        <button style={tabStyle(tab === 'vet')} onClick={() => setTab('vet')}>Veterinario</button>
        <button style={tabStyle(tab === 'weight')} onClick={() => setTab('weight')}>Peso</button>
      </div>

      {/* Tab content */}
      <div style={listWrap}>
        {/* CARE TAB */}
        {tab === 'care' && (
          records.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 36 }}>💉</div>
              <p>No hay registros de cuidado aún</p>
            </div>
          ) : records.map(r => {
            const s = careStatus(r.next_date)
            return (
              <div key={r.id} style={cardStyle}>
                <button style={deleteBtn} onClick={() => deleteRecord(r.id)} title="Eliminar">✕</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong style={{ fontSize: 15, color: '#1e1e2f' }}>{r.name}</strong>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.type} · {fmtDate(r.date)}</div>
                    {r.next_date && <div style={{ fontSize: 12, color: '#888' }}>Próxima: {fmtDate(r.next_date)}</div>}
                    {r.notes && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{r.notes}</div>}
                  </div>
                  <span style={badge(s)}>{s.label}</span>
                </div>
              </div>
            )
          })
        )}

        {/* VET TAB */}
        {tab === 'vet' && (
          visits.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 36 }}>🏥</div>
              <p>No hay visitas al veterinario aún</p>
            </div>
          ) : visits.map(v => {
            const clinic = v.clinic_id ? clinics.find(c => c.id === v.clinic_id) : null
            return (
            <div key={v.id} style={cardStyle}>
              <button style={deleteBtn} onClick={() => deleteVisit(v.id)} title="Eliminar">✕</button>
              <strong style={{ fontSize: 15, color: '#1e1e2f' }}>{v.reason}</strong>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {fmtDate(v.date)}{v.vet ? ` · Dr. ${v.vet}` : ''}
              </div>
              {clinic && <div style={{ fontSize: 12, color: '#7C3AED', marginTop: 2 }}>🏥 {clinic.name}</div>}
              {v.notes && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>📝 {v.notes}</div>}
            </div>
            )
          })
        )}

        {/* WEIGHT TAB */}
        {tab === 'weight' && (
          weights.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 36 }}>⚖️</div>
              <p>No hay registros de peso aún</p>
            </div>
          ) : weights.map((w, i) => {
            const prev = weights[i + 1]
            let indicator = ''
            if (prev) {
              const diff = w.lb - prev.lb
              if (diff > 0) indicator = `⬆️ +${diff.toFixed(2)} lb`
              else if (diff < 0) indicator = `⬇️ ${diff.toFixed(2)} lb`
              else indicator = '➡️ Sin cambio'
            }
            return (
              <div key={w.id} style={cardStyle}>
                <button style={deleteBtn} onClick={() => deleteWeight(w.id)} title="Eliminar">✕</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 18, color: '#1e1e2f' }}>{w.lb} lb</strong>
                    <div style={{ fontSize: 12, color: '#888' }}>{fmtDate(w.date)}</div>
                  </div>
                  {indicator && <span style={{ fontSize: 13, color: '#666' }}>{indicator}</span>}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete dog button */}
      <div style={{ padding: '8px 16px 24px', textAlign: 'center' }}>
        <button
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onClick={() => setModal('delete')}
        >
          🗑️ Eliminar perro
        </button>
      </div>

      {/* Modal: Care */}
      <Modal open={modal === 'care'} onClose={() => setModal(null)} title="Registrar cuidado">
        <form onSubmit={handleAddCare}>
          <select
            style={inputStyle}
            value={careForm.type}
            onChange={e => setCareForm({ ...careForm, type: e.target.value })}
          >
            {CARE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input style={inputStyle} placeholder="Nombre *" required value={careForm.name} onChange={e => setCareForm({ ...careForm, name: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Fecha *</label>
          <input style={inputStyle} type="date" required value={careForm.date} onChange={e => setCareForm({ ...careForm, date: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Próxima fecha</label>
          <input style={inputStyle} type="date" value={careForm.next_date} onChange={e => setCareForm({ ...careForm, next_date: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Notas" value={careForm.notes} onChange={e => setCareForm({ ...careForm, notes: e.target.value })} />
          <button style={btnPrimary} type="submit">Guardar</button>
        </form>
      </Modal>

      {/* Modal: Vet */}
      <Modal open={modal === 'vet'} onClose={() => setModal(null)} title="Registrar visita veterinaria">
        <form onSubmit={handleAddVet}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Clínica veterinaria</label>
          <select
            style={inputStyle}
            value={vetForm.clinic_id}
            onChange={e => setVetForm({ ...vetForm, clinic_id: e.target.value })}
          >
            <option value="">— Sin clínica —</option>
            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Fecha *</label>
          <input style={inputStyle} type="date" required value={vetForm.date} onChange={e => setVetForm({ ...vetForm, date: e.target.value })} />
          <input style={inputStyle} placeholder="Nombre del veterinario" value={vetForm.vet} onChange={e => setVetForm({ ...vetForm, vet: e.target.value })} />
          <input style={inputStyle} placeholder="Motivo de la visita *" required value={vetForm.reason} onChange={e => setVetForm({ ...vetForm, reason: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Notas" value={vetForm.notes} onChange={e => setVetForm({ ...vetForm, notes: e.target.value })} />
          <button style={btnPrimary} type="submit">Guardar</button>
        </form>
      </Modal>

      {/* Modal: Weight */}
      <Modal open={modal === 'weight'} onClose={() => setModal(null)} title="Registrar peso">
        <form onSubmit={handleAddWeight}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Fecha *</label>
          <input style={inputStyle} type="date" required value={weightForm.date} onChange={e => setWeightForm({ ...weightForm, date: e.target.value })} />
          <input style={inputStyle} type="number" step="0.01" placeholder="Peso en libras *" required value={weightForm.lb} onChange={e => setWeightForm({ ...weightForm, lb: e.target.value })} />
          <button style={btnPrimary} type="submit">Guardar</button>
        </form>
      </Modal>

      {/* Modal: Edit dog */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Editar perro">
        <form onSubmit={handleEdit}>
          <input style={inputStyle} placeholder="Nombre *" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <input style={inputStyle} placeholder="Raza" value={editForm.breed} onChange={e => setEditForm({ ...editForm, breed: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Fecha de nacimiento</label>
          <input style={inputStyle} type="date" value={editForm.birthdate} onChange={e => setEditForm({ ...editForm, birthdate: e.target.value })} />
          <input style={inputStyle} type="number" step="0.01" placeholder="Altura (cm)" value={editForm.height} onChange={e => setEditForm({ ...editForm, height: e.target.value })} />
          <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Veterinaria asignada</label>
          <select
            style={inputStyle}
            value={editForm.clinic_id}
            onChange={e => setEditForm({ ...editForm, clinic_id: e.target.value })}
          >
            <option value="">— Sin veterinaria —</option>
            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Foto</label>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            {editPreview && <img src={editPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid #EDE9FE' }} />}
            <input type="file" accept="image/*" onChange={handleEditPhoto} style={{ fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {EMOJIS.map(em => (
              <button
                type="button" key={em}
                style={{
                  fontSize: 28, background: editForm.emoji === em ? '#EDE9FE' : 'transparent',
                  border: editForm.emoji === em ? '2px solid #7C3AED' : '2px solid transparent',
                  borderRadius: 10, padding: '4px 8px', cursor: 'pointer'
                }}
                onClick={() => setEditForm({ ...editForm, emoji: em })}
              >{em}</button>
            ))}
          </div>
          <button style={btnPrimary} type="submit">Guardar cambios</button>
        </form>
      </Modal>

      {/* Modal: Delete confirmation */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="¿Eliminar perro?">
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Se eliminarán todos los datos de <strong>{dog.name}</strong> (cuidados, visitas y pesos). Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...btnPrimary, background: '#ef4444', flex: 1 }}
            onClick={handleDelete}
          >Sí, eliminar</button>
          <button
            style={{ ...btnPrimary, background: '#e5e7eb', color: '#333', flex: 1 }}
            onClick={() => setModal(null)}
          >Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}

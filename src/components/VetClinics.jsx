import { useState } from 'react'
import { useVetClinics } from '../hooks/useVetClinics'
import Modal from './Modal'

/* ---------- styles ---------- */
const header = {
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', padding: '22px 18px 18px',
  color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
}
const addBtn = {
  width: 48, height: 48, borderRadius: '50%', border: 'none', background: '#fff',
  color: '#7C3AED', fontSize: 28, cursor: 'pointer', fontWeight: 700,
  boxShadow: '0 2px 10px rgba(0,0,0,.1)'
}
const cardStyle = {
  background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,.06)', position: 'relative'
}
const clinicName = { fontSize: 17, fontWeight: 700, color: '#1e1e2f', margin: '0 0 6px' }
const infoRow = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', marginBottom: 4 }
const actionsBar = {
  display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'
}
const actionBtn = (bg) => ({
  display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10,
  border: 'none', background: bg, color: '#fff', fontWeight: 600, fontSize: 12,
  cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap'
})
const deleteBtn = {
  position: 'absolute', top: 12, right: 14, background: 'none', border: 'none',
  color: '#ccc', cursor: 'pointer', fontSize: 16
}
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #ddd',
  fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none'
}
const btnPrimary = {
  width: '100%', padding: '13px 0', border: 'none', borderRadius: 12, cursor: 'pointer',
  background: 'linear-gradient(135deg, #A78BFA, #F472B6)', color: '#fff',
  fontWeight: 700, fontSize: 15
}
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#aaa' }
const mapFrame = {
  width: '100%', height: 200, border: 'none', borderRadius: 12, marginTop: 10
}

function formatPhone(phone) {
  if (!phone) return null
  return phone.replace(/[^\d+]/g, '')
}

export default function VetClinics() {
  const { clinics, loading, addClinic, updateClinic, deleteClinic } = useVetClinics()
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'map'
  const [form, setForm] = useState({ name: '', address: '', phone: '', whatsapp: '', lat: '', lng: '', notes: '' })
  const [editId, setEditId] = useState(null)
  const [mapClinic, setMapClinic] = useState(null)

  const resetForm = () => setForm({ name: '', address: '', phone: '', whatsapp: '', lat: '', lng: '', notes: '' })

  const handleAdd = async (e) => {
    e.preventDefault()
    await addClinic({
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      notes: form.notes || null
    })
    resetForm()
    setModal(null)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    await updateClinic(editId, {
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      notes: form.notes || null
    })
    resetForm()
    setEditId(null)
    setModal(null)
  }

  const openEdit = (c) => {
    setForm({
      name: c.name || '', address: c.address || '', phone: c.phone || '',
      whatsapp: c.whatsapp || '', lat: c.lat || '', lng: c.lng || '', notes: c.notes || ''
    })
    setEditId(c.id)
    setModal('edit')
  }

  const openMap = (c) => {
    setMapClinic(c)
    setModal('map')
  }

  const getMapUrl = (c) => {
    if (c.lat && c.lng) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${c.lng - 0.005},${c.lat - 0.003},${c.lng + 0.005},${c.lat + 0.003}&layer=mapnik&marker=${c.lat},${c.lng}`
    }
    if (c.address) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=-90.0,13.0,-89.0,14.0&layer=mapnik`
    }
    return null
  }

  const getGoogleMapsLink = (c) => {
    if (c.lat && c.lng) return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
    if (c.address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`
    return null
  }

  const getUseLocationBtn = () => {
    if (!navigator.geolocation) return null
    return (
      <button
        type="button"
        style={{ ...btnPrimary, background: '#60A5FA', marginBottom: 10, fontSize: 13, padding: '10px 0' }}
        onClick={() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => setForm({ ...form, lat: pos.coords.latitude.toFixed(7), lng: pos.coords.longitude.toFixed(7) }),
            () => alert('No se pudo obtener tu ubicación')
          )
        }}
      >
        📍 Usar mi ubicación actual
      </button>
    )
  }

  const formFields = (
    <>
      <input style={inputStyle} placeholder="Nombre de la veterinaria *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input style={inputStyle} placeholder="Dirección" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
      <input style={inputStyle} type="tel" placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input style={inputStyle} type="tel" placeholder="WhatsApp (con código país, ej: +503...)" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inputStyle, flex: 1 }} type="number" step="any" placeholder="Latitud" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
        <input style={{ ...inputStyle, flex: 1 }} type="number" step="any" placeholder="Longitud" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
      </div>
      {getUseLocationBtn()}
      <textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} placeholder="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
    </>
  )

  return (
    <div>
      {/* Header */}
      <div style={header}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🏥 Mis Veterinarias</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Directorio de clínicas</div>
        </div>
        <button style={addBtn} onClick={() => { resetForm(); setModal('add') }} title="Agregar veterinaria">+</button>
      </div>

      {/* List */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={emptyState}>Cargando...</div>
        ) : clinics.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
            <p style={{ fontWeight: 600, color: '#666' }}>No tienes veterinarias guardadas</p>
            <p>Toca <strong>+</strong> para agregar tu primera veterinaria</p>
          </div>
        ) : (
          clinics.map(c => (
            <div key={c.id} style={cardStyle}>
              <button style={deleteBtn} onClick={() => deleteClinic(c.id)} title="Eliminar">✕</button>
              <p style={clinicName}>{c.name}</p>
              {c.address && <div style={infoRow}>📍 {c.address}</div>}
              {c.phone && <div style={infoRow}>📞 {c.phone}</div>}
              {c.whatsapp && <div style={infoRow}>💬 {c.whatsapp}</div>}
              {c.notes && <div style={{ ...infoRow, color: '#aaa' }}>📝 {c.notes}</div>}

              <div style={actionsBar}>
                {c.phone && (
                  <a href={`tel:${formatPhone(c.phone)}`} style={actionBtn('#7C3AED')}>
                    📞 Llamar
                  </a>
                )}
                {c.whatsapp && (
                  <a
                    href={`https://wa.me/${formatPhone(c.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={actionBtn('#25D366')}
                  >
                    💬 WhatsApp
                  </a>
                )}
                {(c.lat || c.address) && (
                  <button style={actionBtn('#60A5FA')} onClick={() => openMap(c)}>
                    🗺️ Mapa
                  </button>
                )}
                {getGoogleMapsLink(c) && (
                  <a
                    href={getGoogleMapsLink(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={actionBtn('#EA4335')}
                  >
                    🧭 Cómo llegar
                  </a>
                )}
                <button
                  style={actionBtn('#F59E0B')}
                  onClick={() => openEdit(c)}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Agregar veterinaria">
        <form onSubmit={handleAdd}>
          {formFields}
          <button style={btnPrimary} type="submit">Guardar</button>
        </form>
      </Modal>

      {/* Modal: Edit */}
      <Modal open={modal === 'edit'} onClose={() => { setModal(null); setEditId(null) }} title="Editar veterinaria">
        <form onSubmit={handleEdit}>
          {formFields}
          <button style={btnPrimary} type="submit">Guardar cambios</button>
        </form>
      </Modal>

      {/* Modal: Map */}
      <Modal open={modal === 'map'} onClose={() => { setModal(null); setMapClinic(null) }} title={mapClinic?.name || 'Ubicación'}>
        {mapClinic && (
          <div>
            {mapClinic.address && <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>📍 {mapClinic.address}</p>}
            {(mapClinic.lat && mapClinic.lng) ? (
              <iframe
                title="Mapa"
                src={getMapUrl(mapClinic)}
                style={mapFrame}
              />
            ) : (
              <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 20 }}>
                No hay coordenadas guardadas. Agrega latitud y longitud para ver el mapa.
              </p>
            )}
            {getGoogleMapsLink(mapClinic) && (
              <a
                href={getGoogleMapsLink(mapClinic)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 12, background: '#EA4335' }}
              >
                🧭 Cómo llegar (Google Maps)
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Home from './components/Home'
import DogDetail from './components/DogDetail'
import VetClinics from './components/VetClinics'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDog, setSelectedDog] = useState(null)
  const [view, setView] = useState('home') // 'home' | 'detail' | 'clinics'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSelectDog = (dog) => {
    setSelectedDog(dog)
    setView('detail')
  }

  const handleBack = () => {
    setSelectedDog(null)
    setView('home')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSelectedDog(null)
    setView('home')
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: '#aaa' }}>
          Cargando...
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-shell">
      {view === 'detail' && selectedDog ? (
        <DogDetail dog={selectedDog} onBack={handleBack} onDogUpdated={setSelectedDog} />
      ) : view === 'clinics' ? (
        <VetClinics />
      ) : (
        <Home onSelect={handleSelectDog} />
      )}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={handleBack}>
          <span>🏠</span>
          <span>Inicio</span>
        </button>
        <button className={`nav-btn ${view === 'clinics' ? 'active' : ''}`} onClick={() => setView('clinics')}>
          <span>🏥</span>
          <span>Veterinarias</span>
        </button>
        <button className="nav-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </div>
  )
}

export default App

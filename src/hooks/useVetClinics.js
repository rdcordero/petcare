import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVetClinics() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClinics = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error: err } = await supabase
      .from('vet_clinics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setClinics(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClinics() }, [fetchClinics])

  const addClinic = async (clinic) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: err } = await supabase
      .from('vet_clinics')
      .insert({ ...clinic, user_id: user.id })
    if (err) { setError(err.message); return }
    await fetchClinics()
  }

  const updateClinic = async (id, updates) => {
    const { error: err } = await supabase
      .from('vet_clinics')
      .update(updates)
      .eq('id', id)
    if (err) { setError(err.message); return }
    await fetchClinics()
  }

  const deleteClinic = async (id) => {
    const { error: err } = await supabase.from('vet_clinics').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await fetchClinics()
  }

  return { clinics, loading, error, fetchClinics, addClinic, updateClinic, deleteClinic }
}

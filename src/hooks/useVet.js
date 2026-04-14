import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVet(dogId) {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVisits = useCallback(async () => {
    if (!dogId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('vet_visits')
      .select('*')
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
    if (err) setError(err.message)
    else setVisits(data || [])
    setLoading(false)
  }, [dogId])

  const addVisit = async (visit) => {
    const { error: err } = await supabase
      .from('vet_visits')
      .insert({ ...visit, dog_id: dogId })
    if (err) { setError(err.message); return }
    await fetchVisits()
  }

  const deleteVisit = async (id) => {
    const { error: err } = await supabase.from('vet_visits').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await fetchVisits()
  }

  return { visits, loading, error, fetchVisits, addVisit, deleteVisit }
}

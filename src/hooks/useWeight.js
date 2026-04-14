import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useWeight(dogId) {
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWeights = useCallback(async () => {
    if (!dogId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('weight_records')
      .select('*')
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
    if (err) setError(err.message)
    else setWeights(data || [])
    setLoading(false)
  }, [dogId])

  const addWeight = async (record) => {
    const { error: err } = await supabase
      .from('weight_records')
      .insert({ ...record, dog_id: dogId })
    if (err) { setError(err.message); return }
    await fetchWeights()
  }

  const deleteWeight = async (id) => {
    const { error: err } = await supabase.from('weight_records').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await fetchWeights()
  }

  return { weights, loading, error, fetchWeights, addWeight, deleteWeight }
}

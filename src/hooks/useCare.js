import { useState, useCallback } from 'react'
import { supabase } from '../supabase'

export function useCare(dogId) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecords = useCallback(async () => {
    if (!dogId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('care_records')
      .select('*')
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
    if (err) setError(err.message)
    else setRecords(data || [])
    setLoading(false)
  }, [dogId])

  const addRecord = async (record) => {
    const { error: err } = await supabase
      .from('care_records')
      .insert({ ...record, dog_id: dogId })
    if (err) { setError(err.message); return }
    await fetchRecords()
  }

  const deleteRecord = async (id) => {
    const { error: err } = await supabase.from('care_records').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await fetchRecords()
  }

  return { records, loading, error, fetchRecords, addRecord, deleteRecord }
}

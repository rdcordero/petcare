import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useDogs() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error: err } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setDogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDogs() }, [fetchDogs])

  const addDog = async (dog, photoFile) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let photo_url = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('dog-photos')
        .upload(path, photoFile)
      if (upErr) { setError(upErr.message); return }
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path)
      photo_url = urlData.publicUrl
    }
    const { error: err } = await supabase
      .from('dogs')
      .insert({ ...dog, user_id: user.id, photo_url })
    if (err) { setError(err.message); return }
    await fetchDogs()
  }

  const updateDog = async (id, updates, photoFile) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('dog-photos')
        .upload(path, photoFile)
      if (upErr) { setError(upErr.message); return null }
      const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path)
      updates.photo_url = urlData.publicUrl
    }
    const { data, error: err } = await supabase
      .from('dogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (err) { setError(err.message); return null }
    await fetchDogs()
    return data
  }

  const deleteDog = async (id) => {
    const { error: err } = await supabase.from('dogs').delete().eq('id', id)
    if (err) { setError(err.message); return }
    await fetchDogs()
  }

  return { dogs, loading, error, fetchDogs, addDog, updateDog, deleteDog }
}

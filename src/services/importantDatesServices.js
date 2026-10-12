
import { supabase } from '../lib/supabase'

// Get important dates for the active semester
export async function getImportantDates(semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('important_dates')
    .select(`
      id,
      semester_id,
      title,
      category,
      event_date,
      event_time,
      amount,
      location,
      notes,
      is_completed,
      completed_at
    `)
    .eq('semester_id', semesterId)
    .order('event_date', { ascending: true })

  if (error) throw error
  return data || []
}

// Create a new important date
export async function createImportantDate(semesterId, event) {
  const { data, error } = await supabase
    .from('important_dates')
    .insert({
      semester_id: semesterId,
      title: event.title.trim(),
      category: event.category || 'other',
      event_date: event.event_date,
      event_time: event.event_time || null,
      amount: event.amount === '' || event.amount == null
        ? null
        : Number(event.amount),
      location: event.location?.trim() || null,
      notes: event.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update an existing important date
export async function updateImportantDate(eventId, event) {
  const { data, error } = await supabase
    .from('important_dates')
    .update({
      title: event.title.trim(),
      category: event.category || 'other',
      event_date: event.event_date,
      event_time: event.event_time || null,
      amount: event.amount === '' || event.amount == null
        ? null
        : Number(event.amount),
      location: event.location?.trim() || null,
      notes: event.notes?.trim() || null,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Mark event as completed or pending
export async function setImportantDateCompleted(eventId, completed) {
  const { data, error } = await supabase
    .from('important_dates')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete an important date
export async function deleteImportantDate(eventId) {
  const { error } = await supabase
    .from('important_dates')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

import { supabase } from '../lib/supabase'

export async function getTimetableEntries(courseId) {
  const { data, error } = await supabase
    .from('timetable_entries')
    .select('*')
    .eq('course_id', courseId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error

  return data
}

export async function createTimetableEntry(
  courseId,
  dayOfWeek,
  startTime,
  endTime,
  location
) {
  const { data, error } = await supabase
    .from('timetable_entries')
    .insert({
      course_id: courseId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: location || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}


/* ==========================================
   PART-TIME SUBJECT SCHEDULE
========================================== */

// Get fixed class times for active semester
export async function getSemesterClassTimes(semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('semester_class_times')
    .select(`
      id,
      course_id,
      start_time,
      end_time,
      location,
      courses!inner (
        id,
        code,
        name,
        semester_id
      )
    `)
    .eq('courses.semester_id', semesterId)
    .order('start_time', { ascending: true })

  if (error) throw error

  return data || []
}

// Create a fixed class time for a subject
export async function createSemesterClassTime(
  courseId,
  startTime,
  endTime,
  location
) {
  const { data, error } = await supabase
    .from('semester_class_times')
    .insert({
      course_id: courseId,
      start_time: startTime,
      end_time: endTime,
      location: location?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

// Update a subject's fixed class time
export async function updateSemesterClassTime(
  classTimeId,
  startTime,
  endTime,
  location
) {
  const { data, error } = await supabase
    .from('semester_class_times')
    .update({
      start_time: startTime,
      end_time: endTime,
      location: location?.trim() || null,
    })
    .eq('id', classTimeId)
    .select()
    .single()

  if (error) throw error

  return data
}

// Delete a subject's fixed class time
export async function deleteSemesterClassTime(classTimeId) {
  const { error } = await supabase
    .from('semester_class_times')
    .delete()
    .eq('id', classTimeId)

  if (error) throw error
}

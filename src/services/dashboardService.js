import { supabase } from '../lib/supabase'

export async function getDashboardCourses(userId, semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      code,
      name,
      semester_id,
      semesters!inner (
        id,
        name,
        academic_years!inner (
          id,
          name,
          user_id
        )
      )
    `)
    .eq('semester_id', semesterId)
    .eq('semesters.academic_years.user_id', userId)

  if (error) throw error

  return data || []
}


export async function getDashboardAssignments(userId, semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      due_date,
      priority,
      status,
      progress,
      courses!inner (
        id,
        code,
        name,
        semester_id,
        semesters!inner (
          academic_years!inner (
            user_id
          )
        )
      )
    `)
    .eq('courses.semester_id', semesterId)
    .eq('courses.semesters.academic_years.user_id', userId)
    .order('due_date', { ascending: true })

  if (error) throw error

  return data || []
}

export async function getDashboardTasks(userId, semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      due_date,
      priority,
      status,
      courses!inner (
        id,
        code,
        name,
        semester_id,
        semesters!inner (
          academic_years!inner (
            user_id
          )
        )
      )
    `)
    .eq('courses.semester_id', semesterId)
    .eq('courses.semesters.academic_years.user_id', userId)
    .order('due_date', { ascending: true })

  if (error) throw error

  return data || []
}

export async function getTodayTimetable(userId, dayOfWeek, semesterId) {
  if (semesterId == null) return []

  const { data, error } = await supabase
    .from('timetable_entries')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      location,
      courses!inner (
        id,
        code,
        name,
        semester_id,
        semesters!inner (
          academic_years!inner (
            user_id
          )
        )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('courses.semester_id', semesterId)
    .eq('courses.semesters.academic_years.user_id', userId)
    .order('start_time', { ascending: true })

  if (error) throw error

  return data || []
}
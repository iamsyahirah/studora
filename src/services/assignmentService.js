import { supabase } from '../lib/supabase'

export async function getAssignments(courseId) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true })

  if (error) throw error

  return data
}

export async function getUserAssignments(userId) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      courses!inner (
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
      )
    `)
    .eq('courses.semesters.academic_years.user_id', userId)
    .order('due_date', { ascending: true })

  if (error) throw error

  return data || []
}

export async function createAssignment(
  courseId,
  title,
  description,
  dueDate,
  priority,
  groupId = null
) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      due_date: dueDate || null,
      priority: priority || 'medium',
      group_id: groupId || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateAssignment(assignmentId, updates) {
  const { data, error } = await supabase
    .from('assignments')
    .update({
      course_id: updates.courseId,
      title: updates.title,
      description: updates.description || null,
      due_date: updates.dueDate || null,
      priority: updates.priority || 'medium',
    })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAssignment(assignmentId) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw error
}

export async function updateAssignmentStatus(assignmentId, status) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) throw error

  return data
}

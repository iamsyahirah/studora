import { supabase } from '../lib/supabase'

export async function getTasks(courseId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('course_id', courseId)
    .is('assignment_id', null)
    .order('due_date', { ascending: true })

  if (error) throw error

  return data
}

export async function getAssignmentTasks(assignmentId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data
}

export async function getUserTasks(userId) {
  const [courseResult, assignmentResult] = await Promise.all([
    supabase
      .from('tasks')
      .select(`
        *,
        courses!inner (
          id, code, name, semester_id,
          semesters!inner (id, name, academic_years!inner(user_id))
        )
      `)
      .is('assignment_id', null)
      .eq('courses.semesters.academic_years.user_id', userId)
      .order('due_date', { ascending: true }),
    supabase
      .from('tasks')
      .select(`
        *,
        assignments!inner (
          title,
          courses!inner (
            id, code, name, semester_id,
            semesters!inner (id, name, academic_years!inner(user_id))
          )
        )
      `)
      .eq('assignments.courses.semesters.academic_years.user_id', userId)
      .order('due_date', { ascending: true }),
  ])

  if (courseResult.error) throw courseResult.error
  if (assignmentResult.error) throw assignmentResult.error

  const standaloneTasks = (courseResult.data || []).map((task) => ({
    ...task,
    assignment_title: null,
  }))
  const assignmentTasks = (assignmentResult.data || []).map((task) => ({
    ...task,
    courses: task.assignments?.courses,
    assignment_title: task.assignments?.title || null,
  }))

  return [...standaloneTasks, ...assignmentTasks].sort((a, b) => {
    if (!a.due_date) return b.due_date ? 1 : 0
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })
}

export async function createCourseTask(
  courseId,
  title,
  description,
  dueDate,
  priority
) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      due_date: dueDate || null,
      priority: priority || 'medium',
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function createAssignmentTask(
  assignmentId,
  title,
  description,
  dueDate,
  priority,
  assignedTo = null
) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      assignment_id: assignmentId,
      title,
      description: description || null,
      due_date: dueDate || null,
      priority: priority || 'medium',
      assigned_to: assignedTo || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: updates.title,
      description: updates.description || null,
      due_date: updates.dueDate || null,
      priority: updates.priority || 'medium',
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

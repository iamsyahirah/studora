import { supabase } from '../lib/supabase'

export async function getAcademicYears(userId) {
    const { data, error } = await supabase
        .from('academic_years')
        .select(`
            id,
            name,
            created_at,
            semesters (
                id,
                name,
                start_date,
                end_date,
                created_at
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function createAcademicYear(userId, name) {
    const { data, error } = await supabase
        .from('academic_years')
        .insert({
            user_id: userId,
            name,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateAcademicYear(id, name) {
    const { data, error } = await supabase
        .from('academic_years')
        .update({
            name,
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteAcademicYear(id) {
    const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id)

    if (error) {
        throw error
    }
}

export async function createSemester(
    academicYearId,
    name,
    startDate,
    endDate
) {
    const { data, error } = await supabase
        .from('semesters')
        .insert({
            academic_year_id: academicYearId,
            name,
            start_date: startDate,
            end_date: endDate,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateSemester(
    id,
    name,
    startDate,
    endDate
) {
    const { data, error } = await supabase
        .from('semesters')
        .update({
            name,
            start_date: startDate,
            end_date: endDate,
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteSemester(id) {
    const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id)

    if (error) {
        throw error
    }
}


export async function getActiveSemester(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('active_semester_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  return data?.active_semester_id ?? null
}

export async function setActiveSemester(userId, semesterId) {
  // Verify that the semester belongs to the signed-in user.
  const { data: semester, error: semesterError } = await supabase
    .from('semesters')
    .select('id, academic_years!inner(user_id)')
    .eq('id', semesterId)
    .eq('academic_years.user_id', userId)
    .single()

  if (semesterError) throw semesterError
  if (!semester) throw new Error('Semester not found.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ active_semester_id: semesterId })
    .eq('id', userId)
    .select('active_semester_id')
    .single()

  if (error) throw error

  return data.active_semester_id
}

export async function deactivateSemester(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ active_semester_id: null })
    .eq('id', userId)
    .select('active_semester_id')
    .single()

  if (error) throw error

  return data.active_semester_id
}

import { useEffect, useState } from 'react'
import { BookOpen, Check, Circle, ClipboardList, Clock3, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
    createAssignment,
    deleteAssignment,
    getUserAssignments,
    updateAssignment,
    updateAssignmentStatus,
} from '../../services/assignmentService'

const filters = [
    { value: 'all', label: 'All assignments' },
    { value: 'pending', label: 'To do' },
    { value: 'completed', label: 'Completed' },
]

const priorityStyles = {
    high: 'bg-[#FFE9EE] text-[#CC4F70]',
    medium: 'bg-[#FFF3DD] text-[#A87925]',
    low: 'bg-[#E3F6EC] text-[#36896A]',
}

function formatDueDate(value) {
    if (!value) return 'No due date'

    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: value.length === 10 ? undefined : 'short',
    })
}

function Assignments() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState([])
    const [courses, setCourses] = useState([])
    const [filter, setFilter] = useState('all')
    const [form, setForm] = useState({
        courseId: '',
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user?.id) return

        let active = true
        async function loadData() {
            try {
                const [assignmentData, courseResult] = await Promise.all([
                    getUserAssignments(user.id),
                    supabase
                        .from('courses')
                        .select(`
                            id, code, name, semester_id,
                            semesters!inner (
                                name,
                                academic_years!inner (name, user_id)
                            )
                        `)
                        .eq('semesters.academic_years.user_id', user.id)
                        .order('code', { ascending: true }),
                ])

                if (courseResult.error) throw courseResult.error
                if (!active) return
                setAssignments(assignmentData)
                setCourses(courseResult.data || [])
                setForm((current) => ({
                    ...current,
                    courseId: current.courseId || String(courseResult.data?.[0]?.id || ''),
                }))
            } catch (loadError) {
                if (active) setError(loadError.message || 'Unable to load assignments.')
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()
        return () => { active = false }
    }, [user?.id])

    const visibleAssignments = assignments.filter((assignment) => {
        const completed = assignment.status === 'completed' || assignment.status === 'submitted'
        if (filter === 'completed') return completed
        if (filter === 'pending') return !completed
        return true
    })

    const completedCount = assignments.filter(
        (assignment) => assignment.status === 'completed' || assignment.status === 'submitted'
    ).length

    async function handleSubmit(event) {
        event.preventDefault()
        if (!form.courseId || !form.title.trim()) return

        try {
            setSaving(true)
            setError('')
            const course = courses.find((item) => String(item.id) === form.courseId)
            if (editingId) {
                const updated = await updateAssignment(editingId, {
                    ...form,
                    courseId: Number(form.courseId),
                    title: form.title.trim(),
                    description: form.description.trim(),
                })
                setAssignments((current) => current.map((item) => item.id === editingId
                    ? { ...item, ...updated, courses: course }
                    : item
                ).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')))
                setEditingId(null)
            } else {
                const created = await createAssignment(
                    Number(form.courseId),
                    form.title.trim(),
                    form.description.trim(),
                    form.dueDate,
                    form.priority
                )
                setAssignments((current) => [...current, { ...created, courses: course }]
                    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')))
            }
            setForm((current) => ({ ...current, title: '', description: '', dueDate: '' }))
        } catch (submitError) {
            setError(submitError.message || 'Unable to create assignment.')
        } finally {
            setSaving(false)
        }
    }

    function startEditing(assignment) {
        const localDueDate = assignment.due_date ? new Date(assignment.due_date) : null
        if (localDueDate) localDueDate.setMinutes(localDueDate.getMinutes() - localDueDate.getTimezoneOffset())
        setEditingId(assignment.id)
        setForm({
            courseId: String(assignment.course_id),
            title: assignment.title || '',
            description: assignment.description || '',
            dueDate: localDueDate ? localDueDate.toISOString().slice(0, 16) : '',
            priority: assignment.priority || 'medium',
        })
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelEditing() {
        setEditingId(null)
        setForm((current) => ({ ...current, title: '', description: '', dueDate: '' }))
    }

    async function handleDelete(assignment) {
        const confirmed = window.confirm(`Delete “${assignment.title}”? This cannot be undone.`)
        if (!confirmed) return

        try {
            setUpdatingId(assignment.id)
            setError('')
            await deleteAssignment(assignment.id)
            setAssignments((current) => current.filter((item) => item.id !== assignment.id))
            if (editingId === assignment.id) cancelEditing()
        } catch (deleteError) {
            setError(deleteError.message || 'Unable to delete assignment.')
        } finally {
            setUpdatingId(null)
        }
    }

    async function toggleCompleted(assignment) {
        const completed = assignment.status === 'completed' || assignment.status === 'submitted'
        const nextStatus = completed ? 'pending' : 'completed'

        try {
            setUpdatingId(assignment.id)
            setError('')
            const updated = await updateAssignmentStatus(assignment.id, nextStatus)
            setAssignments((current) => current.map((item) =>
                item.id === assignment.id ? { ...item, ...updated, courses: item.courses } : item
            ))
        } catch (updateError) {
            setError(updateError.message || 'Unable to update assignment status.')
        } finally {
            setUpdatingId(null)
        }
    }

    if (loading) {
        return <div className="p-6 text-sm text-[#858B99]">Loading assignments...</div>
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-[-0.04em] text-[#202027]">
                        Assignments
                    </h1>
                    <p className="mt-1 text-sm text-[#858B99]">
                        Keep track of deadlines and celebrate the work you finish.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[#E9EBF0] bg-white px-4 py-3">
                    <Check size={17} className="text-[#36896A]" />
                    <span className="text-sm font-semibold text-[#343846]">
                        {completedCount} of {assignments.length} completed
                    </span>
                </div>
            </header>

            {error && (
                <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </p>
            )}

            <section className="rounded-[22px] border border-[#E9EBF0] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9EEFF] text-[#617BD7]">
                        <Plus size={19} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#202027]">{editingId ? 'Edit assignment' : 'Add an assignment'}</h2>
                        <p className="mt-0.5 text-xs text-[#969BA8]">{editingId ? 'Update the assignment details below.' : 'Add a course and due date to start tracking it.'}</p>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="rounded-xl bg-[#F7F8FB] px-4 py-5 text-sm text-[#777E8D]">
                        Add a course in Courses before creating an assignment.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-[#454A58]">
                            Course
                            <select required value={form.courseId} onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}
                                className="mt-2 w-full rounded-xl border border-[#E3E7EF] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]">
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.code} · {course.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm font-medium text-[#454A58]">
                            Title
                            <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder="e.g. Research report" className="mt-2 w-full rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <label className="text-sm font-medium text-[#454A58]">
                            Due date
                            <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                                className="mt-2 w-full rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <label className="text-sm font-medium text-[#454A58]">
                            Priority
                            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                                className="mt-2 w-full rounded-xl border border-[#E3E7EF] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]">
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                        </label>
                        <label className="text-sm font-medium text-[#454A58] md:col-span-2">
                            Description <span className="font-normal text-[#969BA8]">(optional)</span>
                            <textarea rows="2" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                placeholder="Add a few details" className="mt-2 w-full resize-y rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#202027] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#383844] disabled:opacity-60">
                                {editingId ? <Check size={16} /> : <Plus size={16} />}{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add assignment'}
                            </button>
                            {editingId && <button type="button" onClick={cancelEditing} className="ml-2 inline-flex items-center gap-2 rounded-xl border border-[#E3E7EF] px-4 py-3 text-sm font-semibold text-[#666B78] hover:bg-[#F7F8FB]"><X size={16} />Cancel</button>}
                        </div>
                    </form>
                )}
            </section>

            <section className="overflow-hidden rounded-[22px] border border-[#E9EBF0] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF0F4] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <ClipboardList size={19} className="text-[#617BD7]" />
                        <h2 className="font-semibold text-[#202027]">Your assignments</h2>
                        <span className="rounded-full bg-[#F1F3FA] px-2.5 py-1 text-xs font-semibold text-[#6975CE]">{visibleAssignments.length}</span>
                    </div>
                    <div className="flex rounded-full bg-[#F3F4F7] p-1" aria-label="Filter assignments">
                        {filters.map((item) => (
                            <button key={item.value} type="button" onClick={() => setFilter(item.value)}
                                aria-pressed={filter === item.value}
                                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${filter === item.value ? 'bg-white text-[#202027] shadow-sm' : 'text-[#858B99] hover:text-[#454A58]'}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {visibleAssignments.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3FA] text-[#6975CE]">
                            {filter === 'completed' ? <Check size={22} /> : <BookOpen size={22} />}
                        </div>
                        <p className="text-sm font-semibold text-[#202027]">
                            {filter === 'completed' ? 'No completed assignments yet' : filter === 'pending' ? 'You’re all caught up' : 'No assignments yet'}
                        </p>
                        <p className="mt-1 text-xs text-[#9194A0]">
                            {filter === 'completed' ? 'Mark an assignment complete when you finish it.' : 'Create an assignment above to keep your deadlines in one place.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#F0F1F5]">
                        {visibleAssignments.map((assignment) => {
                            const isCompleted = assignment.status === 'completed' || assignment.status === 'submitted'
                            return (
                                <article key={assignment.id} className="flex items-start gap-4 px-5 py-5 sm:px-6">
                                    <button type="button" onClick={() => toggleCompleted(assignment)} disabled={updatingId === assignment.id}
                                        aria-label={isCompleted ? `Mark ${assignment.title} as to do` : `Mark ${assignment.title} as completed`}
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50 ${isCompleted ? 'border-[#78B99B] bg-[#E3F6EC] text-[#36896A]' : 'border-[#D7DBE5] text-transparent hover:border-[#688DE8] hover:text-[#688DE8]'}`}>
                                        {isCompleted ? <Check size={15} /> : <Circle size={17} />}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className={`text-sm font-semibold ${isCompleted ? 'text-[#858B99] line-through' : 'text-[#202027]'}`}>{assignment.title}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${priorityStyles[assignment.priority] || priorityStyles.medium}`}>{assignment.priority || 'medium'}</span>
                                        </div>
                                        <p className="mt-1.5 text-xs text-[#858B99]">
                                            {assignment.courses?.code} · {assignment.courses?.name}
                                            {assignment.courses?.semesters?.name ? ` · ${assignment.courses.semesters.name}` : ''}
                                        </p>
                                        {assignment.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#666B78]">{assignment.description}</p>}
                                        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#858B99]">
                                            <Clock3 size={13} />{formatDueDate(assignment.due_date)}
                                        </p>
                                    </div>
                                    {isCompleted && <span className="hidden items-center gap-1 rounded-full bg-[#EDF8F2] px-2.5 py-1 text-[10px] font-semibold text-[#36896A] sm:inline-flex"><Check size={12} />Completed</span>}
                                    {isCompleted && <button type="button" onClick={() => toggleCompleted(assignment)} disabled={updatingId === assignment.id} title="Reopen assignment" className="rounded-lg p-2 text-[#969BA8] hover:bg-[#F3F4F7] hover:text-[#454A58] sm:hidden"><RotateCcw size={15} /></button>}
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button type="button" onClick={() => startEditing(assignment)} aria-label={`Edit ${assignment.title}`} className="rounded-lg p-2 text-[#969BA8] transition hover:bg-[#F1F3FA] hover:text-[#526BC6]"><Pencil size={15} /></button>
                                        <button type="button" onClick={() => handleDelete(assignment)} disabled={updatingId === assignment.id} aria-label={`Delete ${assignment.title}`} className="rounded-lg p-2 text-[#969BA8] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={15} /></button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

export default Assignments

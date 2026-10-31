import { useEffect, useState } from 'react'
import { BookOpen, Check, CheckCircle2, Clock3, ListTodo, Pencil, Plus, Trash2, X } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
    createCourseTask,
    deleteTask,
    getUserTasks,
    updateTask,
    updateTaskStatus,
} from '../../services/taskService'

const statusFilters = [
    { value: 'all', label: 'All tasks' },
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
]

const statusNames = { todo: 'To do', in_progress: 'In progress', completed: 'Completed' }
const priorityColors = {
    high: 'bg-[#FFE9EE] text-[#CC4F70]',
    medium: 'bg-[#FFF3DD] text-[#A87925]',
    low: 'bg-[#E3F6EC] text-[#36896A]',
}

function dueDateValue(date) {
    if (!date) return ''
    const localDate = new Date(date)
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset())
    return localDate.toISOString().slice(0, 16)
}

function Tasks() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [courses, setCourses] = useState([])
    const [filter, setFilter] = useState('all')
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ courseId: '', title: '', description: '', dueDate: '', priority: 'medium' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user?.id) return
        let active = true

        async function loadData() {
            try {
                const [taskData, courseResult] = await Promise.all([
                    getUserTasks(user.id),
                    supabase
                        .from('courses')
                        .select(`id, code, name, semesters!inner(name, academic_years!inner(user_id))`)
                        .eq('semesters.academic_years.user_id', user.id)
                        .order('code', { ascending: true }),
                ])
                if (courseResult.error) throw courseResult.error
                if (!active) return
                setTasks(taskData)
                setCourses(courseResult.data || [])
                setForm((current) => ({ ...current, courseId: current.courseId || String(courseResult.data?.[0]?.id || '') }))
            } catch (loadError) {
                if (active) setError(loadError.message || 'Unable to load tasks.')
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()
        return () => { active = false }
    }, [user?.id])

    const visibleTasks = tasks.filter((task) => filter === 'all' || task.status === filter)
    const completedCount = tasks.filter((task) => task.status === 'completed').length

    async function handleSubmit(event) {
        event.preventDefault()
        if (!form.title.trim() || (!editingId && !form.courseId)) return

        try {
            setSaving(true)
            setError('')
            if (editingId) {
                const updated = await updateTask(editingId, { ...form, title: form.title.trim(), description: form.description.trim() })
                setTasks((current) => current.map((task) => task.id === editingId ? { ...task, ...updated } : task))
            } else {
                const created = await createCourseTask(Number(form.courseId), form.title.trim(), form.description.trim(), form.dueDate, form.priority)
                const course = courses.find((item) => String(item.id) === form.courseId)
                setTasks((current) => [...current, { ...created, courses: course }].sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')))
            }
            resetForm()
        } catch (saveError) {
            setError(saveError.message || 'Unable to save task.')
        } finally {
            setSaving(false)
        }
    }

    function resetForm() {
        setEditingId(null)
        setForm((current) => ({ ...current, title: '', description: '', dueDate: '', priority: 'medium' }))
    }

    function startEditing(task) {
        setEditingId(task.id)
        setForm({
            courseId: task.courses?.id ? String(task.courses.id) : '',
            title: task.title || '',
            description: task.description || '',
            dueDate: dueDateValue(task.due_date),
            priority: task.priority || 'medium',
        })
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function changeStatus(task, status) {
        try {
            setBusyId(task.id)
            setError('')
            const updated = await updateTaskStatus(task.id, status)
            setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updated } : item))
        } catch (statusError) {
            setError(statusError.message || 'Unable to update task status.')
        } finally {
            setBusyId(null)
        }
    }

    async function handleDelete(task) {
        if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
        try {
            setBusyId(task.id)
            setError('')
            await deleteTask(task.id)
            setTasks((current) => current.filter((item) => item.id !== task.id))
            if (editingId === task.id) resetForm()
        } catch (deleteError) {
            setError(deleteError.message || 'Unable to delete task.')
        } finally {
            setBusyId(null)
        }
    }

    if (loading) return <div className="p-6 text-sm text-[#858B99]">Loading tasks...</div>

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-[-0.04em] text-[#202027]">Tasks</h1>
                    <p className="mt-1 text-sm text-[#858B99]">Break coursework into manageable steps and track your progress.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[#E9EBF0] bg-white px-4 py-3">
                    <CheckCircle2 size={17} className="text-[#36896A]" />
                    <span className="text-sm font-semibold text-[#343846]">{completedCount} of {tasks.length} completed</span>
                </div>
            </header>

            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <section className="rounded-[22px] border border-[#E9EBF0] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9EEFF] text-[#617BD7]">{editingId ? <Pencil size={18} /> : <Plus size={19} />}</div>
                    <div>
                        <h2 className="text-base font-bold text-[#202027]">{editingId ? 'Edit task' : 'Add a task'}</h2>
                        <p className="mt-0.5 text-xs text-[#969BA8]">{editingId ? 'Update the task details.' : 'Create a task for one of your courses.'}</p>
                    </div>
                </div>
                {courses.length === 0 && !editingId ? (
                    <div className="rounded-xl bg-[#F7F8FB] px-4 py-5 text-sm text-[#777E8D]">Add a course in Courses before creating tasks.</div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                        {!editingId && <label className="text-sm font-medium text-[#454A58]">Course
                            <select required value={form.courseId} onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#E3E7EF] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]">
                                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
                            </select>
                        </label>}
                        <label className="text-sm font-medium text-[#454A58]">Task title
                            <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Review lecture notes" className="mt-2 w-full rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <label className="text-sm font-medium text-[#454A58]">Due date
                            <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <label className="text-sm font-medium text-[#454A58]">Priority
                            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#E3E7EF] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]">
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                        </label>
                        <label className="text-sm font-medium text-[#454A58] md:col-span-2">Description <span className="font-normal text-[#969BA8]">(optional)</span>
                            <textarea rows="2" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add a few details" className="mt-2 w-full resize-y rounded-xl border border-[#E3E7EF] px-3.5 py-3 text-sm outline-none focus:border-[#688DE8]" />
                        </label>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#202027] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#383844] disabled:opacity-60">{editingId ? <Check size={16} /> : <Plus size={16} />}{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add task'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="ml-2 inline-flex items-center gap-2 rounded-xl border border-[#E3E7EF] px-4 py-3 text-sm font-semibold text-[#666B78] hover:bg-[#F7F8FB]"><X size={16} />Cancel</button>}
                        </div>
                    </form>
                )}
            </section>

            <section className="overflow-hidden rounded-[22px] border border-[#E9EBF0] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF0F4] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3"><ListTodo size={19} className="text-[#617BD7]" /><h2 className="font-semibold text-[#202027]">Your tasks</h2><span className="rounded-full bg-[#F1F3FA] px-2.5 py-1 text-xs font-semibold text-[#6975CE]">{visibleTasks.length}</span></div>
                    <div className="flex flex-wrap rounded-full bg-[#F3F4F7] p-1" aria-label="Filter tasks">
                        {statusFilters.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${filter === item.value ? 'bg-white text-[#202027] shadow-sm' : 'text-[#858B99] hover:text-[#454A58]'}`}>{item.label}</button>)}
                    </div>
                </div>
                {visibleTasks.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3FA] text-[#6975CE]">{filter === 'completed' ? <Check size={22} /> : <BookOpen size={22} />}</div><p className="text-sm font-semibold text-[#202027]">{filter === 'completed' ? 'No completed tasks yet' : filter === 'all' ? 'No tasks yet' : `No ${statusNames[filter].toLowerCase()} tasks`}</p><p className="mt-1 text-xs text-[#9194A0]">Create a task above or change the selected filter.</p></div>
                ) : (
                    <div className="divide-y divide-[#F0F1F5]">
                        {visibleTasks.map((task) => (
                            <article key={task.id} className="flex items-start gap-4 px-5 py-5 sm:px-6">
                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${task.status === 'completed' ? 'bg-[#E3F6EC] text-[#36896A]' : task.status === 'in_progress' ? 'bg-[#FFF3DD] text-[#A87925]' : 'bg-[#F1F3FA] text-[#6975CE]'}`}>
                                    {task.status === 'completed' ? <Check size={16} /> : <ListTodo size={16} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'text-[#858B99] line-through' : 'text-[#202027]'}`}>{task.title}</h3>
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${priorityColors[task.priority] || priorityColors.medium}`}>{task.priority || 'medium'}</span>
                                    </div>
                                    <p className="mt-1.5 text-xs text-[#858B99]">{task.courses?.code} · {task.courses?.name}{task.assignment_title ? ` · ${task.assignment_title}` : ''}</p>
                                    {task.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#666B78]">{task.description}</p>}
                                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[#858B99]"><Clock3 size={13} />{task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date'}</p>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                                    <select aria-label={`Status for ${task.title}`} value={task.status || 'todo'} disabled={busyId === task.id} onChange={(event) => changeStatus(task, event.target.value)} className="max-w-32 rounded-lg border border-[#E3E7EF] bg-white px-2 py-2 text-xs font-medium text-[#454A58] outline-none focus:border-[#688DE8]">
                                        <option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
                                    </select>
                                    <button type="button" onClick={() => startEditing(task)} aria-label={`Edit ${task.title}`} className="rounded-lg p-2 text-[#969BA8] transition hover:bg-[#F1F3FA] hover:text-[#526BC6]"><Pencil size={15} /></button>
                                    <button type="button" onClick={() => handleDelete(task)} disabled={busyId === task.id} aria-label={`Delete ${task.title}`} className="rounded-lg p-2 text-[#969BA8] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={15} /></button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default Tasks


import { useEffect, useState } from 'react'
import {
    Plus,
    Clock3,
    MapPin,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    X,
    Pencil,
    Trash2,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import PartTimeSchedule from '../../components/TimetableList/PartTimeSchedule'
import SaturdaySessions from '../../components/TimetableList/SaturdaySessions'
import { getActiveSemester } from '../../services/academicYearService'

const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
]

const emptyForm = {
    course_id: '',
    day_of_week: 1,
    start_time: '',
    end_time: '',
    location: '',
}

function Timetable() {
    const { user } = useAuth()
    const [activeSemesterId, setActiveSemesterId] = useState(null)
    const [semesterLoading, setSemesterLoading] = useState(true)
    const [courses, setCourses] = useState([])
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [showWeekly, setShowWeekly] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ ...emptyForm })

    useEffect(() => {
        let active = true

        async function loadSemester() {
            if (!user?.id) {
                setActiveSemesterId(null)
                setSemesterLoading(false)
                return
            }

            try {
                setSemesterLoading(true)
                setError('')
                const result = await getActiveSemester(user.id)
                const semesterId =
                    result && typeof result === 'object'
                        ? result.id ?? result.active_semester_id ?? null
                        : result ?? null

                if (active) setActiveSemesterId(semesterId)
            } catch (err) {
                if (active) {
                    setActiveSemesterId(null)
                    setError(err.message || 'Unable to load active semester.')
                }
            } finally {
                if (active) setSemesterLoading(false)
            }
        }

        loadSemester()
        return () => { active = false }
    }, [user?.id])

    useEffect(() => {
        let active = true

        async function loadWeeklyData() {
            if (!user?.id || activeSemesterId == null) {
                setCourses([])
                setEntries([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select('id, code, name')
                    .eq('semester_id', activeSemesterId)
                    .order('code', { ascending: true })

                if (courseError) throw courseError
                const semesterCourses = courseData || []
                if (!active) return
                setCourses(semesterCourses)

                if (!semesterCourses.length) {
                    setEntries([])
                    return
                }

                const { data, error: timetableError } = await supabase
                    .from('timetable_entries')
                    .select('id, day_of_week, start_time, end_time, location, course_id, courses(id, code, name)')
                    .in('course_id', semesterCourses.map((course) => course.id))
                    .order('day_of_week', { ascending: true })
                    .order('start_time', { ascending: true })

                if (timetableError) throw timetableError
                if (active) setEntries(data || [])
            } catch (err) {
                if (active) setError(err.message)
            } finally {
                if (active) setLoading(false)
            }
        }

        setEditingId(null)
        setShowForm(false)
        setForm({ ...emptyForm })
        loadWeeklyData()
        return () => { active = false }
    }, [user?.id, activeSemesterId])

    function resetForm() {
        setForm({ ...emptyForm })
        setEditingId(null)
        setShowForm(false)
    }

    function startAdding() {
        setError('')
        setEditingId(null)
        setForm({ ...emptyForm })
        setShowForm(true)
    }

    function handleEdit(entry) {
        setEditingId(entry.id)
        setForm({
            course_id: String(entry.course_id),
            day_of_week: Number(entry.day_of_week),
            start_time: entry.start_time.slice(0, 5),
            end_time: entry.end_time.slice(0, 5),
            location: entry.location || '',
        })
        setError('')
        setShowForm(true)
        setShowWeekly(true)
    }

    async function loadTimetable() {
        if (activeSemesterId == null || !courses.length) {
            setEntries([])
            return
        }

        const { data, error: fetchError } = await supabase
            .from('timetable_entries')
            .select('id, day_of_week, start_time, end_time, location, course_id, courses(id, code, name)')
            .in('course_id', courses.map((course) => course.id))
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true })

        if (fetchError) throw fetchError
        setEntries(data || [])
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!form.course_id || !form.start_time || !form.end_time) {
            setError('Please complete all required fields.')
            return
        }
        if (form.end_time <= form.start_time) {
            setError('End time must be later than start time.')
            return
        }

        const courseId = Number(form.course_id)
        if (!courses.some((course) => course.id === courseId)) {
            setError('Please select a subject from your active semester.')
            return
        }

        try {
            setSaving(true)
            const payload = {
                course_id: courseId,
                day_of_week: Number(form.day_of_week),
                start_time: form.start_time,
                end_time: form.end_time,
                location: form.location.trim() || null,
            }

            if (editingId !== null) {
                const { data, error: updateError } = await supabase
                    .from('timetable_entries')
                    .update(payload)
                    .eq('id', editingId)
                    .in('course_id', courses.map((course) => course.id))
                    .select('id')

                if (updateError) throw updateError
                if (!data?.length) {
                    throw new Error('Unable to update this class. Check your Supabase RLS policies.')
                }
            } else {
                const { error: insertError } = await supabase
                    .from('timetable_entries')
                    .insert(payload)
                if (insertError) throw insertError
            }

            await loadTimetable()
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(entry) {
        const confirmed = window.confirm(
            `Delete weekly schedule for ${entry.courses?.name || 'this class'}?`
        )
        if (!confirmed) return

        try {
            setSaving(true)
            setError('')
            const { data, error: deleteError } = await supabase
                .from('timetable_entries')
                .delete()
                .eq('id', entry.id)
                .in('course_id', courses.map((course) => course.id))
                .select('id')

            if (deleteError) throw deleteError
            if (!data?.length) {
                throw new Error('Unable to delete this class. Check your Supabase RLS policies.')
            }
            if (editingId === entry.id) resetForm()
            await loadTimetable()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const inputClass = 'w-full rounded-xl border border-[#E2E6EF] bg-white px-3 py-3 text-sm outline-none focus:border-[#698AFF]'

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
                <p className="mt-1 text-sm text-slate-500">Manage your class schedule for the active semester.</p>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {semesterLoading ? (
                <div className="rounded-[24px] border border-[#E9EBF0] bg-white p-6 text-sm text-slate-500">
                    Loading active semester...
                </div>
            ) : activeSemesterId == null ? (
                <div className="flex items-center gap-3 rounded-[24px] border border-[#E9EBF0] bg-white p-6">
                    <CalendarDays size={22} className="text-[#526BC6]" />
                    <div>
                        <h2 className="font-semibold text-slate-900">No Active Semester</h2>
                        <p className="mt-1 text-sm text-slate-500">Please activate a semester in Academic Years first.</p>
                    </div>
                </div>
            ) : (
                <>
                    <PartTimeSchedule key={`part-time-${activeSemesterId}`} semesterId={activeSemesterId} />
                    <SaturdaySessions key={`sessions-${activeSemesterId}`} semesterId={activeSemesterId} />

                    <section className="overflow-hidden rounded-[24px] border border-[#E9EBF0] bg-white">
                        <button
                            type="button"
                            aria-expanded={showWeekly}
                            onClick={() => { setShowWeekly((current) => !current); resetForm() }}
                            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#7863C6]">
                                    <CalendarDays size={21} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#202027]">Weekly Schedule</h2>
                                    <p className="mt-1 text-xs text-[#929AAC]">Recurring weekly classes for Full-Time study</p>
                                </div>
                            </div>
                            {showWeekly ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>

                        {showWeekly && (
                            <div className="border-t border-[#EDF0F4] px-5 py-5 sm:px-6">
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Weekly Classes</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {entries.length} scheduled {entries.length === 1 ? 'class' : 'classes'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={loading || saving || !courses.length}
                                        onClick={showForm ? resetForm : startAdding}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#202027] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#383842] disabled:opacity-50"
                                    >
                                        {showForm ? <X size={16} /> : <Plus size={16} />}
                                        {showForm ? 'Cancel' : 'Add Weekly Class'}
                                    </button>
                                </div>

                                {showForm && (
                                    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E2E6EF] bg-[#F8F9FC] p-4 sm:p-5">
                                        <h3 className="mb-5 font-semibold text-[#202027]">
                                            {editingId !== null ? 'Edit Weekly Class' : 'Add Weekly Class'}
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label htmlFor="weekly-course" className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                                                <select id="weekly-course" value={form.course_id} required onChange={(e) => setForm((current) => ({ ...current, course_id: e.target.value }))} className={inputClass}>
                                                    <option value="">Select subject</option>
                                                    {courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="weekly-day" className="mb-2 block text-sm font-medium text-slate-700">Day</label>
                                                <select id="weekly-day" value={form.day_of_week} onChange={(e) => setForm((current) => ({ ...current, day_of_week: Number(e.target.value) }))} className={inputClass}>
                                                    {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="weekly-start" className="mb-2 block text-sm font-medium text-slate-700">Start Time</label>
                                                <input id="weekly-start" type="time" required value={form.start_time} onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))} className={inputClass} />
                                            </div>
                                            <div>
                                                <label htmlFor="weekly-end" className="mb-2 block text-sm font-medium text-slate-700">End Time</label>
                                                <input id="weekly-end" type="time" required value={form.end_time} onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))} className={inputClass} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label htmlFor="weekly-location" className="mb-2 block text-sm font-medium text-slate-700">Location (Optional)</label>
                                                <input id="weekly-location" type="text" value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="e.g. Room A / Online" className={inputClass} />
                                            </div>
                                        </div>
                                        <div className="mt-5 flex justify-end gap-3">
                                            <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-[#E2E6EF] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                                            <button type="submit" disabled={saving} className="rounded-xl bg-[#202027] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#383842] disabled:opacity-50">
                                                {saving ? 'Saving...' : editingId !== null ? 'Update Class' : 'Save Class'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {loading ? (
                                    <div className="py-10 text-center text-sm text-slate-500">Loading weekly timetable...</div>
                                ) : entries.length === 0 ? (
                                    <div className="rounded-xl bg-[#F7F8FB] px-6 py-10 text-center">
                                        <Clock3 size={30} className="mx-auto text-slate-300" />
                                        <p className="mt-3 text-sm font-medium text-slate-700">No weekly classes yet</p>
                                        <p className="mt-1 text-xs text-slate-500">Add recurring weekly classes when needed.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {entries.map((entry) => {
                                            const day = days.find((item) => item.value === Number(entry.day_of_week))
                                            return (
                                                <div key={entry.id} className="flex flex-col gap-3 rounded-xl border border-[#EDF0F4] p-4 lg:flex-row lg:items-center">
                                                    <div className="w-full shrink-0 text-sm font-medium text-slate-700 lg:w-24">{day?.label || 'Unknown Day'}</div>
                                                    <div className="flex w-full shrink-0 items-center gap-2 text-sm text-slate-500 lg:w-36">
                                                        <Clock3 size={15} />
                                                        {entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-slate-900">{entry.courses?.code}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{entry.courses?.name}</p>
                                                    </div>
                                                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 lg:w-36">
                                                        {entry.location && <><MapPin size={15} className="shrink-0" /><span className="break-words">{entry.location}</span></>}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button type="button" onClick={() => handleEdit(entry)} disabled={saving} aria-label={`Edit ${entry.courses?.name || 'class'}`} title="Edit class" className="rounded-lg p-2 text-[#526BC6] hover:bg-[#E8EDFF] disabled:opacity-50">
                                                            <Pencil size={17} />
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(entry)} disabled={saving} aria-label={`Delete ${entry.courses?.name || 'class'}`} title="Delete class" className="rounded-lg p-2 text-[#CC638B] hover:bg-[#FFF0F3] disabled:opacity-50">
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}

export default Timetable

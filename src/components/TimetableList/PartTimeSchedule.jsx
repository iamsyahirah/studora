
import { useEffect, useState } from 'react'
import {
    BookOpen,
    Clock3,
    MapPin,
    Pencil,
    Trash2,
    Plus,
    X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'
import {
    getSemesterClassTimes,
    createSemesterClassTime,
    updateSemesterClassTime,
    deleteSemesterClassTime,
} from '../../services/timetableService'

const emptyForm = {
    course_id: '',
    start_time: '',
    end_time: '',
    location: '',
}

export default function PartTimeSchedule({ semesterId }) {
    const [courses, setCourses] = useState([])
    const [entries, setEntries] = useState([])
    const [form, setForm] = useState({ ...emptyForm })
    const [editingId, setEditingId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        async function loadData() {
            if (semesterId == null) {
                setCourses([])
                setEntries([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const [courseResult, scheduleData] = await Promise.all([
                    supabase
                        .from('courses')
                        .select('id, code, name')
                        .eq('semester_id', semesterId)
                        .order('code'),
                    getSemesterClassTimes(semesterId),
                ])

                if (courseResult.error) throw courseResult.error

                if (active) {
                    setCourses(courseResult.data || [])
                    setEntries(scheduleData || [])
                }
            } catch (err) {
                if (active) setError(err.message)
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()

        return () => {
            active = false
        }
    }, [semesterId])

    function resetForm() {
        setForm({ ...emptyForm })
        setEditingId(null)
        setShowForm(false)
    }

    function startEditing(entry) {
        setEditingId(entry.id)
        setForm({
            course_id: String(entry.course_id),
            start_time: entry.start_time.slice(0, 5),
            end_time: entry.end_time.slice(0, 5),
            location: entry.location || '',
        })
        setError('')
        setShowForm(true)
    }

    async function refreshSchedule() {
        const data = await getSemesterClassTimes(semesterId)
        setEntries(data)
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

        const alreadyScheduled = entries.some(
            (entry) =>
                entry.course_id === Number(form.course_id) &&
                entry.id !== editingId
        )

        if (alreadyScheduled) {
            setError('This subject already has a class schedule.')
            return
        }

        try {
            setSaving(true)

            if (editingId !== null) {
                await updateSemesterClassTime(
                    editingId,
                    form.start_time,
                    form.end_time,
                    form.location
                )
            } else {
                await createSemesterClassTime(
                    Number(form.course_id),
                    form.start_time,
                    form.end_time,
                    form.location
                )
            }

            await refreshSchedule()
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(entry) {
        if (!window.confirm(`Delete schedule for ${entry.courses?.name}?`)) {
            return
        }

        try {
            setSaving(true)
            setError('')

            await deleteSemesterClassTime(entry.id)
            await refreshSchedule()

            if (editingId === entry.id) resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const availableCourses = courses.filter(
        (course) =>
            !entries.some((entry) => entry.course_id === course.id)
    )

    if (semesterId == null) {
        return (
            <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-6">
                <h2 className="text-lg font-semibold">Saturday Subject Schedule</h2>
                <p className="mt-3 text-sm text-slate-500">
                    Select an active semester in Academic Years first.
                </p>
            </section>
        )
    }

    return (
        <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[#202027]">
                        Saturday Subject Schedule
                    </h2>
                    <p className="mt-1 text-xs text-[#929AAC]">
                        Fixed class times for your semester sessions
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        resetForm()
                        setError('')
                        setShowForm(true)
                    }}
                    disabled={loading || saving || availableCourses.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#202027] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                    <Plus size={16} />
                    Add Class Time
                </button>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-4 rounded-xl border border-[#E2E6EF] bg-[#F8F9FC] p-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#202027]">
                            {editingId !== null ? 'Edit Class Time' : 'Add Class Time'}
                        </h3>
                        <button type="button" onClick={resetForm} disabled={saving}>
                            <X size={18} />
                        </button>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Subject
                        </label>
                        <select
                            value={form.course_id}
                            onChange={(e) =>
                                setForm({ ...form, course_id: e.target.value })
                            }
                            disabled={editingId !== null}
                            required
                            className="w-full rounded-xl border border-[#E2E6EF] bg-white p-3 text-sm"
                        >
                            <option value="">Select subject</option>
                            {(editingId !== null ? courses : availableCourses).map(
                                (course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.code} — {course.name}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Start Time
                            </label>
                            <input
                                type="time"
                                required
                                value={form.start_time}
                                onChange={(e) =>
                                    setForm({ ...form, start_time: e.target.value })
                                }
                                className="w-full rounded-xl border border-[#E2E6EF] bg-white p-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                End Time
                            </label>
                            <input
                                type="time"
                                required
                                value={form.end_time}
                                onChange={(e) =>
                                    setForm({ ...form, end_time: e.target.value })
                                }
                                className="w-full rounded-xl border border-[#E2E6EF] bg-white p-3 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Location (Optional)
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                            }
                            placeholder="e.g. Room A / Online"
                            className="w-full rounded-xl border border-[#E2E6EF] bg-white p-3 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#202027] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Class Time'}
                    </button>
                </form>
            )}

            <div className="mt-6 space-y-3">
                {loading ? (
                    <p className="text-sm text-slate-500">Loading schedule...</p>
                ) : entries.length === 0 ? (
                    <p className="rounded-xl bg-[#F5F7FB] p-4 text-sm text-slate-500">
                        No subject schedule yet. Add a class time to get started.
                    </p>
                ) : (
                    entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EDF0F4] p-4"
                        >
                            <div className="rounded-xl bg-[#E8EDFF] p-3 text-[#526BC6]">
                                <BookOpen size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#202027]">
                                    {entry.courses?.code} — {entry.courses?.name}
                                </p>

                                <p className="mt-2 flex items-center gap-2 text-xs text-[#929AAC]">
                                    <Clock3 size={14} />
                                    {entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}
                                </p>

                                {entry.location && (
                                    <p className="mt-1 flex items-center gap-2 text-xs text-[#929AAC]">
                                        <MapPin size={14} />
                                        {entry.location}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => startEditing(entry)}
                                    disabled={saving}
                                    aria-label="Edit class time"
                                    className="rounded-lg p-2 text-[#526BC6] hover:bg-[#E8EDFF]"
                                >
                                    <Pencil size={17} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(entry)}
                                    disabled={saving}
                                    aria-label="Delete class time"
                                    className="rounded-lg p-2 text-[#CC638B] hover:bg-[#FFF0F3]"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}

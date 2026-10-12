
import { useEffect, useState } from 'react'
import {
    CalendarDays,
    CalendarPlus,
    Check,
    Pencil,
    Trash2,
    X,
} from 'lucide-react'

import {
    getSemesterSessions,
    createSemesterSession,
    updateSemesterSession,
    deleteSemesterSession,
} from '../../services/academicYearService'

export default function SemesterSessions({ semesterId, semesterName }) {
    const [sessions, setSessions] = useState([])
    const [sessionDate, setSessionDate] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (semesterId == null) {
            setSessions([])
            setLoading(false)
            return
        }

        let active = true

        async function loadSessions() {
            try {
                setLoading(true)
                setError('')

                const data = await getSemesterSessions(semesterId)

                if (active) setSessions(data)
            } catch (err) {
                if (active) setError(err.message)
            } finally {
                if (active) setLoading(false)
            }
        }

        loadSessions()

        return () => {
            active = false
        }
    }, [semesterId])

    const sortedSessions = [...sessions].sort(
        (a, b) => a.session_number - b.session_number
    )

    function formatDate(dateString) {
        return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-MY', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    function isSaturday(dateString) {
        return new Date(`${dateString}T00:00:00`).getDay() === 6
    }

    function resetForm() {
        setSessionDate('')
        setEditingId(null)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!sessionDate) {
            setError('Please select a date.')
            return
        }

        if (!isSaturday(sessionDate)) {
            setError('Please select a Saturday.')
            return
        }

        try {
            setSaving(true)

            if (editingId !== null) {
                await updateSemesterSession(editingId, sessionDate)
            } else {
                const nextNumber =
                    Math.max(0, ...sessions.map((s) => s.session_number)) + 1

                await createSemesterSession(
                    semesterId,
                    nextNumber,
                    sessionDate
                )
            }

            const updated = await getSemesterSessions(semesterId)
            setSessions(updated)
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    function startEditing(session) {
        setEditingId(session.id)
        setSessionDate(session.session_date)
        setError('')
    }

    async function handleDelete(session) {
        const confirmed = window.confirm(
            `Delete Session ${session.session_number}?`
        )

        if (!confirmed) return

        try {
            setSaving(true)
            setError('')

            await deleteSemesterSession(session.id)

            const updated = await getSemesterSessions(semesterId)
            setSessions(updated)

            if (editingId === session.id) resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (semesterId == null) return null

    return (
        <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#526BC6]">
                    <CalendarDays size={22} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-[#202027]">
                        Manage Sessions
                    </h2>
                    <p className="text-xs text-[#929AAC]">
                        {semesterName} · Saturday classes
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label htmlFor="session-date" className="mb-2 block text-xs font-semibold text-[#515969]">
                        {editingId !== null ? 'Edit Session Date' : 'New Session Date'}
                    </label>

                    <input
                        id="session-date"
                        type="date"
                        value={sessionDate}
                        onChange={(event) => setSessionDate(event.target.value)}
                        disabled={saving}
                        required
                        className="w-full rounded-xl border border-[#E2E6EF] bg-white px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#202027] px-5 py-3 text-sm font-semibold text-white hover:bg-[#444450] disabled:opacity-50"
                >
                    {editingId !== null ? <Check size={16} /> : <CalendarPlus size={16} />}
                    {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Add Session'}
                </button>

                {editingId !== null && (
                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E6EF] px-4 py-3 text-sm text-[#515969]"
                    >
                        <X size={16} />
                        Cancel
                    </button>
                )}
            </form>

            <div className="mt-6 space-y-2">
                {loading ? (
                    <p className="py-4 text-sm text-[#929AAC]">Loading sessions...</p>
                ) : sortedSessions.length === 0 ? (
                    <p className="rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                        No sessions scheduled. Add your first Saturday date.
                    </p>
                ) : (
                    sortedSessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center gap-3 rounded-xl border border-[#EDF0F4] px-4 py-3"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EEFF] text-sm font-semibold text-[#526BC6]">
                                {session.session_number}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#202027]">
                                    Session {session.session_number}
                                </p>
                                <p className="mt-1 text-xs text-[#929AAC]">
                                    {formatDate(session.session_date)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => startEditing(session)}
                                disabled={saving}
                                aria-label={`Edit Session ${session.session_number}`}
                                className="rounded-lg p-2 text-[#526BC6] hover:bg-[#E8EEFF]"
                            >
                                <Pencil size={17} />
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDelete(session)}
                                disabled={saving}
                                aria-label={`Delete Session ${session.session_number}`}
                                className="rounded-lg p-2 text-[#CC638B] hover:bg-[#FFF0F3]"
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}

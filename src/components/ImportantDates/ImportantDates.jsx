
import { useEffect, useState } from 'react'
import {
    CalendarClock,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    RotateCcw,
    Wallet,
    GraduationCap,
    CalendarCheck,
    BookOpen,
    Bell,
} from 'lucide-react'

import ImportantDateForm from './ImportantDateForm'
import {
    getImportantDates,
    deleteImportantDate,
    setImportantDateCompleted,
} from '../../services/importantDatesServices'

const categoryStyles = {
    payment: {
        icon: Wallet,
        bg: 'bg-[#FFF0DE]',
        color: 'text-[#A87925]',
    },
    exam: {
        icon: GraduationCap,
        bg: 'bg-[#E8EDFF]',
        color: 'text-[#526BC6]',
    },
    registration: {
        icon: CalendarCheck,
        bg: 'bg-[#E4F6F5]',
        color: 'text-[#278B8B]',
    },
    academic: {
        icon: BookOpen,
        bg: 'bg-[#F2E6FC]',
        color: 'text-[#8763B3]',
    },
    other: {
        icon: Bell,
        bg: 'bg-[#F0F1F4]',
        color: 'text-[#858D9F]',
    },
}

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getDeadlineLabel(event) {
    if (event.is_completed) {
        return event.category === 'payment' ? 'Paid' : 'Completed'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(`${event.event_date}T00:00:00`)
    const days = Math.round((due - today) / 86400000)

    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
}

export default function ImportantDates({ semesterId }) {
    const [events, setEvents] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function loadEvents() {
        if (semesterId == null) {
            setEvents([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError('')
            const data = await getImportantDates(semesterId)
            setEvents(data)
        } catch (err) {
            setError(err.message || 'Unable to load important dates.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEvents()
    }, [semesterId])

    function handleEdit(event) {
        setEditingEvent(event)
        setShowForm(true)
    }

    async function handleDelete(event) {
        if (!window.confirm(`Delete "${event.title}"?`)) return

        try {
            setSaving(true)
            setError('')
            await deleteImportantDate(event.id)
            await loadEvents()
        } catch (err) {
            setError(err.message || 'Unable to delete event.')
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleCompleted(event) {
        try {
            setSaving(true)
            setError('')
            await setImportantDateCompleted(
                event.id,
                !event.is_completed
            )
            await loadEvents()
        } catch (err) {
            setError(err.message || 'Unable to update status.')
        } finally {
            setSaving(false)
        }
    }

    if (semesterId == null) {
        return (
            <section className="rounded-[22px] border border-[#E9EBF0] bg-white p-5">
                <h2 className="text-lg font-semibold text-[#202027]">
                    Important Dates
                </h2>
                <p className="mt-3 text-sm text-[#929AAC]">
                    Select an active semester to manage important dates.
                </p>
            </section>
        )
    }

    return (
        <section className="rounded-[22px] border border-[#E9EBF0] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0DE] text-[#A87925]">
                        <CalendarClock size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#202027]">
                            Important Dates
                        </h2>
                        <p className="text-xs text-[#929AAC]">
                            Deadlines & semester reminders
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingEvent(null)
                        setShowForm(true)
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#202027] text-white hover:bg-[#444450]"
                    aria-label="Add important date"
                >
                    <Plus size={18} />
                </button>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {showForm && (
                <div className="mt-5">
                    <ImportantDateForm
                        semesterId={semesterId}
                        editingEvent={editingEvent}
                        onSaved={async () => {
                            setShowForm(false)
                            setEditingEvent(null)
                            await loadEvents()
                        }}
                        onCancel={() => {
                            setShowForm(false)
                            setEditingEvent(null)
                        }}
                    />
                </div>
            )}

            {loading ? (
                <p className="mt-6 text-sm text-[#929AAC]">
                    Loading important dates...
                </p>
            ) : events.length === 0 ? (
                <p className="mt-6 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    No important dates yet. Add your first deadline.
                </p>
            ) : (
                <div className="mt-5 divide-y divide-[#EDF0F4]">
                    {events.map((event) => {
                        const style =
                            categoryStyles[event.category] || categoryStyles.other
                        const Icon = style.icon

                        return (
                            <div
                                key={event.id}
                                className="flex items-start gap-3 py-4"
                            >
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.color}`}>
                                    <Icon size={20} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#202027]">
                                        {event.title}
                                    </p>
                                    <p className="mt-1 text-xs text-[#929AAC]">
                                        {formatDate(event.event_date)} · {getDeadlineLabel(event)}
                                    </p>
                                    {event.amount != null && (
                                        <p className="mt-1 text-xs text-[#515969]">
                                            RM {Number(event.amount).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleCompleted(event)}
                                        disabled={saving}
                                        title={event.is_completed ? 'Mark as pending' : 'Mark as completed'}
                                        className="rounded-lg p-2 text-[#278567] hover:bg-[#E7F5F2] disabled:opacity-50"
                                    >
                                        {event.is_completed ? <RotateCcw size={17} /> : <CheckCircle2 size={17} />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleEdit(event)}
                                        disabled={saving}
                                        title="Edit"
                                        aria-label={`Edit ${event.title}`}
                                        className="rounded-lg p-2 text-[#526BC6] hover:bg-[#E8EEFF] disabled:opacity-50"
                                    >
                                        <Pencil size={17} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(event)}
                                        disabled={saving}
                                        title="Delete"
                                        className="rounded-lg p-2 text-[#CC638B] hover:bg-[#FFF0F3] disabled:opacity-50"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

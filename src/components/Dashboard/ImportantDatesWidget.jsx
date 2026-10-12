
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
    CalendarClock,
    ArrowUpRight,
    Wallet,
    GraduationCap,
    CalendarCheck,
    BookOpen,
    Bell,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react'

import { getImportantDates } from '../../services/importantDatesServices'

// ------------------------------------
// Category Styles
// ------------------------------------

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

// ------------------------------------
// Date Helpers
// ------------------------------------

function getDayDifference(dateString) {
    const today = new Date()
    const due = new Date(`${dateString}T00:00:00`)

    const todayUTC = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    )

    const dueUTC = Date.UTC(
        due.getFullYear(),
        due.getMonth(),
        due.getDate()
    )

    return Math.round((dueUTC - todayUTC) / 86400000)
}

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
        'en-MY',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )
}

function getEventStatus(event) {
    if (event.is_completed) {
        return {
            label: event.category === 'payment' ? 'Paid' : 'Completed',
            bg: 'bg-[#E7F5F2]',
            color: 'text-[#278567]',
        }
    }

    const days = getDayDifference(event.event_date)

    if (days < 0) {
        return {
            label: 'Overdue',
            bg: 'bg-[#FFF0F3]',
            color: 'text-[#C44F65]',
        }
    }

    if (days === 0) {
        return {
            label: 'Due today',
            bg: 'bg-[#FFF0F3]',
            color: 'text-[#C44F65]',
        }
    }

    if (days === 1) {
        return {
            label: 'Tomorrow',
            bg: 'bg-[#FFF0DE]',
            color: 'text-[#A87925]',
        }
    }

    if (days <= 7) {
        return {
            label: `In ${days} days`,
            bg: 'bg-[#FFF0DE]',
            color: 'text-[#A87925]',
        }
    }

    return {
        label: `In ${days} days`,
        bg: 'bg-[#E8EDFF]',
        color: 'text-[#526BC6]',
    }
}

// ------------------------------------
// Main Widget
// ------------------------------------

export default function ImportantDatesWidget({ semesterId }) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        async function loadEvents() {
            if (semesterId == null) {
                setEvents([])
                setError('')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const data = await getImportantDates(semesterId)

                if (active) {
                    setEvents(data)
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.message || 'Unable to load important dates.'
                    )
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadEvents()

        return () => {
            active = false
        }
    }, [semesterId])

    // ------------------------------------
    // Smart Sorting
    // ------------------------------------

    const sortedEvents = [...events].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1
        }

        return a.event_date.localeCompare(b.event_date)
    })

    // Nearest future or current deadline.
    // Completed and overdue events are not selected.
    const nextDeadline = sortedEvents.find(
        (event) => !event.is_completed
    )

    const isOverdueHighlight =
        nextDeadline &&
        getDayDifference(nextDeadline.event_date) < 0

    // Remaining events, without repeating the highlighted one.
    const remainingEvents = sortedEvents
        .filter((event) => event.id !== nextDeadline?.id)
        .slice(0, nextDeadline ? 3 : 4)

    const visibleCount =
        (nextDeadline ? 1 : 0) + remainingEvents.length

    // ------------------------------------
    // Render
    // ------------------------------------

    return (
        <section className="rounded-3xl border border-[#E9EBF0] bg-white p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0DE] text-[#A87925]">
                        <CalendarClock size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-[#202027]">
                            Important Dates
                        </h2>
                        <p className="mt-1 text-xs text-[#929AAC]">
                            Stay ahead of your deadlines
                        </p>
                    </div>
                </div>

                <NavLink
                    to="/academic-years"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#6267B8] hover:text-[#353A89]"
                >
                    Manage
                    <ArrowUpRight size={14} />
                </NavLink>
            </div>

            {/* Loading */}
            {loading ? (
                <p className="mt-6 text-sm text-[#929AAC]">
                    Loading important dates...
                </p>
            ) : error ? (
                <div
                    role="alert"
                    className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                    <AlertCircle size={17} className="shrink-0" />
                    <span>{error}</span>
                </div>
            ) : semesterId == null ? (
                <p className="mt-6 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    Select an active semester to view important dates.
                </p>
            ) : events.length === 0 ? (
                <p className="mt-6 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    No important dates yet. Manage your deadlines in
                    Academic Years.
                </p>
            ) : (
                <div className="mt-5">
                    {/* Next Deadline Highlight */}
                    {nextDeadline && (
                        <div
                            className={`mb-4 rounded-[18px] border p-4 ${isOverdueHighlight
                                ? 'border-[#F2C9D1] bg-[#FFF0F3]'
                                : 'border-[#F4DFC0] bg-[#FFF5E9]'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A672B]">
                                    {isOverdueHighlight ? 'Overdue Deadline' : 'Next Deadline'}
                                </p>

                                <span className="rounded-full bg-[#FFE5C4] px-2.5 py-1 text-[10px] font-semibold text-[#98601E]">
                                    {getEventStatus(nextDeadline).label}
                                </span>
                            </div>

                            <h3 className="mt-3 text-lg font-bold text-[#202027]">
                                {nextDeadline.title}
                            </h3>

                            <p className="mt-1 text-xs text-[#8D714D]">
                                {formatDate(nextDeadline.event_date)}
                            </p>

                            {nextDeadline.amount != null && (
                                <p className="mt-2 text-sm font-semibold text-[#8D714D]">
                                    RM {Number(nextDeadline.amount).toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Other Important Dates */}
                    <div className="divide-y divide-[#EDF0F4]">
                        {remainingEvents.map((event) => {
                            const style =
                                categoryStyles[event.category] ||
                                categoryStyles.other

                            const Icon = style.icon
                            const status = getEventStatus(event)

                            return (
                                <div
                                    key={event.id}
                                    className="flex items-start gap-3 py-4"
                                >
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.color}`}
                                    >
                                        <Icon size={20} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-[#202027]">
                                            {event.title}
                                        </p>

                                        <p className="mt-1 text-xs text-[#929AAC]">
                                            {formatDate(event.event_date)}
                                        </p>

                                        {event.amount != null && (
                                            <p className="mt-1 text-xs text-[#515969]">
                                                RM {Number(event.amount).toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.bg} ${status.color}`}
                                    >
                                        {event.is_completed && (
                                            <CheckCircle2
                                                size={11}
                                                className="mr-1 inline"
                                            />
                                        )}

                                        {status.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            {!loading && !error && events.length > visibleCount && (
                <p className="mt-3 text-center text-xs text-[#929AAC]">
                    Showing {visibleCount} of {events.length} important dates
                </p>
            )}
        </section>
    )
}

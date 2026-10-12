
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

function getEventStatus(event) {
    if (event.is_completed) {
        return {
            label: event.category === 'payment' ? 'Paid' : 'Completed',
            color: 'text-[#278567]',
            bg: 'bg-[#E7F5F2]',
        }
    }

    const days = getDayDifference(event.event_date)

    if (days < 0) {
        return {
            label: 'Overdue',
            color: 'text-[#C44F65]',
            bg: 'bg-[#FFF0F3]',
        }
    }

    if (days === 0) {
        return {
            label: 'Due today',
            color: 'text-[#C44F65]',
            bg: 'bg-[#FFF0F3]',
        }
    }

    if (days === 1) {
        return {
            label: 'Tomorrow',
            color: 'text-[#A87925]',
            bg: 'bg-[#FFF0DE]',
        }
    }

    if (days <= 7) {
        return {
            label: `In ${days} days`,
            color: 'text-[#A87925]',
            bg: 'bg-[#FFF0DE]',
        }
    }

    return {
        label: `In ${days} days`,
        color: 'text-[#526BC6]',
        bg: 'bg-[#E8EDFF]',
    }
}

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`)
        .toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
}

export default function ImportantDatesWidget({ semesterId }) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

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

                if (active) setEvents(data)
            } catch (err) {
                if (active) {
                    setError(err.message || 'Unable to load important dates.')
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        loadEvents()

        return () => {
            active = false
        }
    }, [semesterId])

    // Pending deadlines first, then completed events.
    const sortedEvents = [...events].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1
        }

        return a.event_date.localeCompare(b.event_date)
    })

    const visibleEvents = sortedEvents.slice(0, 4)

    return (
        <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-5 sm:p-6">
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
                            Deadlines & semester reminders
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

            {/* Content */}
            {loading ? (
                <p className="mt-6 text-sm text-[#929AAC]">
                    Loading important dates...
                </p>
            ) : error ? (
                <div role="alert" className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={17} className="shrink-0" />
                    <span>{error}</span>
                </div>
            ) : semesterId == null ? (
                <p className="mt-6 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    Select an active semester to view important dates.
                </p>
            ) : visibleEvents.length === 0 ? (
                <p className="mt-6 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    No important dates yet. Manage your deadlines in Academic Years.
                </p>
            ) : (
                <div className="mt-5 divide-y divide-[#EDF0F4]">
                    {visibleEvents.map((event) => {
                        const style =
                            categoryStyles[event.category] || categoryStyles.other

                        const Icon = style.icon
                        const status = getEventStatus(event)

                        return (
                            <div key={event.id} className="flex items-start gap-3 py-4">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.color}`}>
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

                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.bg} ${status.color}`}>
                                    {event.is_completed && (
                                        <CheckCircle2 size={11} className="mr-1 inline" />
                                    )}
                                    {status.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {events.length > 4 && !loading && (
                <p className="mt-3 text-center text-xs text-[#929AAC]">
                    Showing 4 of {events.length} important dates
                </p>
            )}
        </section>
    )
}

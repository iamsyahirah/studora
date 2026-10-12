
import { NavLink } from 'react-router-dom'
import {
    CalendarDays,
    ArrowUpRight,
    Check,
    CircleCheck,
    CircleDot,
    Circle,
} from 'lucide-react'

// ------------------------------------
// Date Helpers
// ------------------------------------

function parseLocalDate(dateString) {
    if (!dateString) return null

    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function getDayDifference(dateString) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = parseLocalDate(dateString)

    if (!target) return 0

    // Compare calendar days without daylight-saving errors.
    const todayUTC = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    )

    const targetUTC = Date.UTC(
        target.getFullYear(),
        target.getMonth(),
        target.getDate()
    )

    return Math.round((targetUTC - todayUTC) / 86400000)
}

function formatDate(dateString) {
    const date = parseLocalDate(dateString)

    if (!date) return 'Date to be set'

    return date.toLocaleDateString('en-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getCountdownLabel(days) {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days > 1) return `In ${days} days`
    return 'Completed'
}

// ------------------------------------
// Main Component
// ------------------------------------

export default function AcademicTracker({
    semesterName = 'No active semester',
    studyMode = 'Part-Time',
    sessions = [],
}) {
    // Sort sessions chronologically.
    const sortedSessions = [...sessions].sort(
        (a, b) => a.session_date.localeCompare(b.session_date)
    )

    // Only sessions before today are completed.
    const completedSessions = sortedSessions.filter(
        (session) => getDayDifference(session.session_date) < 0
    )

    // Today or future session.
    const nextSession = sortedSessions.find(
        (session) => getDayDifference(session.session_date) >= 0
    )

    const totalSessions = sortedSessions.length
    const completedCount = completedSessions.length

    const progressPercentage =
        totalSessions > 0
            ? Math.round((completedCount / totalSessions) * 100)
            : 0

    return (
        <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-5 sm:p-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#526BC6]">
                        <CalendarDays size={22} />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[#202027]">
                            Academic Tracker
                        </h2>

                        <p className="mt-1 text-xs text-[#929AAC]">
                            {semesterName} · {studyMode}
                        </p>
                    </div>
                </div>

                <NavLink
                    to="/academic-years"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#6267B8] transition hover:text-[#353A89]"
                >
                    Manage
                    <ArrowUpRight size={14} />
                </NavLink>
            </div>

            {/* Next Session */}
            {nextSession ? (
                <div className="mt-6 rounded-[18px] border border-[#DCE5FF] bg-[#EFF3FF] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#526BC6]">
                            Next Session
                        </p>

                        <span className="rounded-full bg-[#DAE5FF] px-2.5 py-1 text-[10px] font-semibold text-[#526BC6]">
                            {getCountdownLabel(
                                getDayDifference(nextSession.session_date)
                            )}
                        </span>
                    </div>

                    <h3 className="mt-3 text-xl font-bold text-[#202027]">
                        Session {nextSession.session_number}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-[#526BC6]">
                        {formatDate(nextSession.session_date)}
                    </p>
                </div>
            ) : (
                <div className="mt-6 rounded-[18px] border border-[#E5E9F1] bg-[#F7F8FB] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#858D9F]">
                        Next Session
                    </p>

                    <h3 className="mt-3 text-lg font-semibold text-[#202027]">
                        {totalSessions > 0
                            ? 'All sessions completed'
                            : 'No sessions scheduled'}
                    </h3>

                    <p className="mt-1 text-xs text-[#858D9F]">
                        {totalSessions > 0
                            ? 'Your scheduled class dates have passed.'
                            : 'Add your class dates in Academic Years.'}
                    </p>
                </div>
            )}

            {/* Session Progress */}
            <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#515969]">
                    Session Progress
                </p>

                <p className="text-xs font-medium text-[#858D9F]">
                    {completedCount} of {totalSessions} completed
                </p>
            </div>

            <div
                role="progressbar"
                aria-label="Session progress"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EDF0F5]"
            >
                <div
                    className="h-full rounded-full bg-[#75D4CF] transition-[width] duration-500"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Session Timeline */}
            {totalSessions > 0 ? (
                <>
                    <div
                        className="mt-5 grid gap-2"
                        style={{
                            gridTemplateColumns: `repeat(${totalSessions}, minmax(0, 1fr))`,
                        }}
                    >
                        {sortedSessions.map((session) => {
                            const days = getDayDifference(session.session_date)

                            const isCompleted = days < 0
                            const isNext = nextSession?.id === session.id

                            let boxStyle =
                                'border-[#E4E8F0] bg-[#F0F2F6] text-[#929AAC]'

                            if (isCompleted) {
                                boxStyle =
                                    'border-[#BDE8DC] bg-[#E5F7F0] text-[#278567]'
                            } else if (isNext) {
                                boxStyle =
                                    'border-[#698AFF] bg-[#E8EEFF] text-[#526BC6]'
                            }

                            return (
                                <div
                                    key={session.id}
                                    title={formatDate(session.session_date)}
                                    className={`flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg border text-sm font-semibold ${boxStyle}`}
                                >
                                    {isCompleted && <Check size={13} />}
                                    <span>{session.session_number}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#929AAC]">
                        <span className="inline-flex items-center gap-1">
                            <CircleCheck size={13} className="text-[#278567]" />
                            Completed
                        </span>

                        <span className="inline-flex items-center gap-1">
                            <CircleDot size={13} className="text-[#526BC6]" />
                            Next
                        </span>

                        <span className="inline-flex items-center gap-1">
                            <Circle size={13} />
                            Upcoming
                        </span>
                    </div>
                </>
            ) : (
                <p className="mt-4 text-xs text-[#929AAC]">
                    No session progress available yet.
                </p>
            )}
        </section>
    )
}

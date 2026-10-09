
import { CalendarDays } from 'lucide-react'

function AcademicTracker({
    semesterName = 'No active semester',
    studyMode = 'Part-Time',
    sessions = [],
}) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sortedSessions = [...sessions].sort(
        (a, b) => a.session_date.localeCompare(b.session_date)
    )

    const completed = sortedSessions.filter((session) => {
        const date = new Date(`${session.session_date}T00:00:00`)
        return date < today
    })

    const nextSession = sortedSessions.find((session) => {
        const date = new Date(`${session.session_date}T00:00:00`)
        return date >= today
    })

    function formatDate(dateString) {
        if (!dateString) return 'Date to be set'

        return new Date(`${dateString}T00:00:00`)
            .toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })
    }

    return (
        <section className="rounded-[22px] border border-[#E3E8F1] bg-white p-5 sm:p-6">

            <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#416FE5]">
                    <CalendarDays size={25} />
                </div>

                <div>
                    <h2 className="font-['Space_Grotesk',sans-serif] text-[22px] font-bold text-[#202027]">
                        Academic Tracker
                    </h2>

                    <p className="mt-1 text-sm text-[#929AAC]">
                        {semesterName} · {studyMode}
                    </p>
                </div>
            </div>

            <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#858D9F]">
                    Next Session
                </p>

                <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-[29px] font-bold text-[#202027]">
                    {nextSession
                        ? `Session ${nextSession.session_number}`
                        : sortedSessions.length > 0
                            ? 'All sessions completed'
                            : 'No sessions scheduled'}
                </h3>

                <p className="mt-2 text-lg font-medium text-[#5276DA]">
                    {nextSession
                        ? formatDate(nextSession.session_date)
                        : '—'}
                </p>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#515969]">
                    Progress
                </span>

                <span className="text-sm text-[#858D9F]">
                    {completed.length} of {sortedSessions.length} completed
                </span>
            </div>

            {sortedSessions.length > 0 ? (
                <div className="mt-5 grid gap-2" style={{
                    gridTemplateColumns: `repeat(${sortedSessions.length}, minmax(0, 1fr))`,
                }}>
                    {sortedSessions.map((session) => {
                        const date = new Date(`${session.session_date}T00:00:00`)

                        const isCompleted = date < today
                        const isNext = nextSession?.id === session.id

                        return (
                            <div
                                key={session.id}
                                title={formatDate(session.session_date)}
                                className={`flex h-12 items-center justify-center rounded-lg border text-sm font-semibold ${isCompleted
                                    ? 'border-[#BDE8DC] bg-[#E5F7F0] text-[#328D72]'
                                    : isNext
                                        ? 'border-[#698AFF] bg-[#E8EEFF] text-[#416FE5]'
                                        : 'border-[#E4E8F0] bg-[#F0F2F6] text-[#929AAC]'
                                    }`}
                            >
                                {session.session_number}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="mt-5 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    Add your semester class dates to track progress.
                </p>
            )}
        </section>
    )
}

export default AcademicTracker


import { useEffect, useState } from 'react'
import {
    CalendarDays,
    BookOpen,
    Clock3,
    MapPin,
} from 'lucide-react'

import { getSemesterSessions } from '../../services/academicYearService'
import { getSemesterClassTimes } from '../../services/timetableService'

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
        'en-MY',
        {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )
}

export default function SaturdaySessions({ semesterId }) {
    const [sessions, setSessions] = useState([])
    const [classes, setClasses] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        async function loadData() {
            if (semesterId == null) {
                setSessions([])
                setClasses([])
                setSelectedId(null)
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const [sessionData, classData] = await Promise.all([
                    getSemesterSessions(semesterId),
                    getSemesterClassTimes(semesterId),
                ])

                if (!active) return

                const ordered = [...sessionData].sort(
                    (a, b) => a.session_date.localeCompare(b.session_date)
                )

                setSessions(ordered)
                setClasses(classData)
                setSelectedId(ordered[0]?.id ?? null)
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

    const selectedSession = sessions.find(
        (session) => session.id === selectedId
    )

    const sortedClasses = [...classes].sort(
        (a, b) => a.start_time.localeCompare(b.start_time)
    )

    if (semesterId == null) return null

    return (
        <section className="rounded-[24px] border border-[#E9EBF0] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#526BC6]">
                    <CalendarDays size={22} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-[#202027]">
                        Saturday Sessions
                    </h2>
                    <p className="mt-1 text-xs text-[#929AAC]">
                        Your scheduled part-time class dates
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="mt-5 text-sm text-[#929AAC]">
                    Loading sessions...
                </p>
            ) : sessions.length === 0 ? (
                <p className="mt-5 rounded-xl bg-[#F5F7FB] p-4 text-sm text-[#929AAC]">
                    No Saturday sessions scheduled yet.
                    Add session dates in Academic Years.
                </p>
            ) : (
                <>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() => setSelectedId(session.id)}
                                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${selectedId === session.id
                                    ? 'border-[#698AFF] bg-[#E8EEFF] text-[#526BC6]'
                                    : 'border-[#E4E8F0] bg-[#F7F8FB] text-[#858D9F]'
                                    }`}
                            >
                                Session {session.session_number}
                            </button>
                        ))}
                    </div>

                    {selectedSession && (
                        <>
                            <div className="mt-4 rounded-xl bg-[#F7F8FB] p-4">
                                <h3 className="text-sm font-semibold text-[#202027]">
                                    Session {selectedSession.session_number}
                                </h3>
                                <p className="mt-1 text-xs text-[#929AAC]">
                                    {formatDate(selectedSession.session_date)}
                                </p>
                            </div>

                            {sortedClasses.length === 0 ? (
                                <p className="mt-4 text-sm text-[#929AAC]">
                                    No subject times yet. Add them in Saturday Subject Schedule.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {sortedClasses.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-start gap-3 rounded-xl border border-[#EDF0F4] p-4"
                                        >
                                            <div className="rounded-lg bg-[#E8EDFF] p-3 text-[#526BC6]">
                                                <BookOpen size={19} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#202027]">
                                                    {entry.courses?.code} — {entry.courses?.name}
                                                </p>

                                                <p className="mt-2 flex items-center gap-2 text-xs text-[#929AAC]">
                                                    <Clock3 size={14} />
                                                    {entry.start_time.slice(0, 5)}
                                                    {' – '}
                                                    {entry.end_time.slice(0, 5)}
                                                </p>

                                                {entry.location && (
                                                    <p className="mt-1 flex items-center gap-2 text-xs text-[#929AAC]">
                                                        <MapPin size={14} />
                                                        {entry.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </section>
    )
}

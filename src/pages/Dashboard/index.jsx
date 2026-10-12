
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
    BookOpen,
    CalendarDays,
    ClipboardList,
    CheckSquare,
    Clock3,
    ArrowUpRight,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    MapPin,
    CircleCheck,
    Circle,
    Timer,
    GraduationCap,
    AlertCircle,
    Layers3,
    CalendarClock,
    Sparkles,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
    getDashboardCourses,
    getDashboardAssignments,
    getDashboardTasks,
    getTodayTimetable,
} from '../../services/dashboardService'

import { getActiveSemester, getAcademicYears, getSemesterSessions, } from '../../services/academicYearService'
import AcademicTracker from '../../components/Dashboard/AcademicTracker'
import ImportantDates from '../../components/ImportantDates/ImportantDates'

// ------------------------------------
// Shared UI
// ------------------------------------

const panel =
    'overflow-hidden rounded-[24px] border border-[#E9EBF0] bg-white'

const heading =
    "font-['Space_Grotesk',sans-serif] font-semibold tracking-[-0.035em] text-[#202027]"

function SectionHeader({ icon: Icon, title, count, to }) {
    return (
        <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F6F9] text-[#202027]">
                    <Icon size={19} strokeWidth={1.9} />
                </div>

                <h2 className={`${heading} text-[17px] sm:text-[19px]`}>
                    {title}
                </h2>

                {count !== undefined && (
                    <span className="rounded-full bg-[#202027] px-2.5 py-1 text-[10px] font-semibold text-white">
                        {count}
                    </span>
                )}
            </div>

            {to && (
                <NavLink
                    to={to}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#6267B8] transition hover:text-[#353A89]"
                >
                    See all
                    <ArrowUpRight size={14} />
                </NavLink>
            )}
        </div>
    )
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex min-h-43.75 flex-col items-center justify-center px-5 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3FA] text-[#6975CE]">
                <Icon size={22} />
            </div>

            <p className="text-sm font-semibold text-[#202027]">
                {title}
            </p>

            <p className="mt-1 max-w-60 text-xs leading-5 text-[#9194A0]">
                {description}
            </p>
        </div>
    )
}

function PriorityBadge({ priority }) {
    const value = priority?.toLowerCase() || 'low'

    const colors = {
        high: 'bg-[#FFE9EE] text-[#CC4F70]',
        medium: 'bg-[#FFF3DD] text-[#A87925]',
        low: 'bg-[#E3F6EC] text-[#36896A]',
    }

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${colors[value] || colors.low
                }`}
        >
            {priority || 'Low'}
        </span>
    )
}

// ------------------------------------
// Course cards
// ------------------------------------

const courseThemes = [
    {
        bg: 'bg-[#A5E7E5]',
        icon: 'bg-white/85 text-[#278B8B]',
        label: 'text-[#276B70]',
        decoration: 'bg-white/15',
    },
    {
        bg: 'bg-[#BACCFB]',
        icon: 'bg-white/85 text-[#526CC1]',
        label: 'text-[#53689D]',
        decoration: 'bg-white/15',
    },
    {
        bg: 'bg-[#E5CEF7]',
        icon: 'bg-white/85 text-[#8763B3]',
        label: 'text-[#79599F]',
        decoration: 'bg-white/15',
    },
    {
        bg: 'bg-[#F6DDC3]',
        icon: 'bg-white/85 text-[#B6804E]',
        label: 'text-[#94704C]',
        decoration: 'bg-white/15',
    },
]

function CourseCard({ course, index }) {
    const theme = courseThemes[index % courseThemes.length]

    return (
        <NavLink
            to="/courses"
            className={`
        group relative flex min-h-55 flex-col
        overflow-hidden rounded-[22px] p-5
        transition-transform duration-200
        hover:-translate-y-1
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-[#5668D8]
        ${theme.bg}
      `}
        >
            {/* Decorative shapes */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full ${theme.decoration}`}
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full border-25 border-white/10"
            />

            <div className="relative z-10 flex items-start justify-between">
                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-[0_5px_16px_rgba(40,40,65,0.06)] ${theme.icon}`}
                >
                    <BookOpen size={25} strokeWidth={1.8} />
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-[#202027] transition group-hover:bg-white/50">
                    <ArrowUpRight size={17} />
                </span>
            </div>

            <div className="relative z-10 mt-7">
                <p className={`text-[11px] font-semibold tracking-wide ${theme.label}`}>
                    {course.code || 'COURSE'}
                </p>

                <h3 className={`${heading} mt-2 line-clamp-2 text-[20px] leading-snug`}>
                    {course.name || 'Untitled course'}
                </h3>
            </div>

            <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/35 pt-4">
                <span className="text-xs font-medium text-[#343846]/75">
                    Course workspace
                </span>

                <span className="flex items-center gap-1 text-xs font-semibold text-[#202027]">
                    Explore
                    <ArrowRight size={14} />
                </span>
            </div>
        </NavLink>
    )
}


// ------------------------------------
// Dashboard
// ------------------------------------

function Dashboard() {
    const { user } = useAuth()

    const displayName =
        user?.user_metadata?.display_name ||
        user?.email?.split('@')[0] ||
        'Student'

    const [courses, setCourses] = useState([])
    const [assignments, setAssignments] = useState([])
    const [tasks, setTasks] = useState([])
    const [todayTimetable, setTodayTimetable] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [coursePage, setCoursePage] = useState(0)

    const [activeSemesterId, setActiveSemesterId] = useState(null)
    const [activeSemesterName, setActiveSemesterName] = useState('')
    const [semesterSessions, setSemesterSessions] = useState([])

    // Existing Supabase calls
    useEffect(() => {
        if (!user?.id) return

        let active = true

        async function loadDashboard() {
            try {
                setLoading(true)
                setError('')


                const dayOfWeek = new Date().getDay()

                // Get the active semester selected by the user.
                const semesterId = await getActiveSemester(user.id)

                const [yearsData, sessionsData] = await Promise.all([
                    getAcademicYears(user.id),
                    getSemesterSessions(semesterId),
                ])

                if (!active) return

                const currentSemester = (yearsData || [])
                    .flatMap((year) => year.semesters || [])
                    .find((semester) => semester.id === semesterId)

                setActiveSemesterId(semesterId)
                setActiveSemesterName(currentSemester?.name || '')
                setSemesterSessions(sessionsData)

                // Fetch dashboard data.
                // Only courses are filtered by active semester at this step.
                const [
                    courseData,
                    assignmentData,
                    taskData,
                    timetableData,
                ] = await Promise.all([
                    getDashboardCourses(user.id, semesterId),
                    getDashboardAssignments(user.id, semesterId),
                    getDashboardTasks(user.id, semesterId),
                    getTodayTimetable(user.id, dayOfWeek, semesterId),
                ])

                if (!active) return

                setCourses(courseData)
                setAssignments(assignmentData)
                setTasks(taskData)
                setTodayTimetable(timetableData)
            } catch (err) {
                if (active) setError(err.message)
            } finally {
                if (active) setLoading(false)
            }
        }

        loadDashboard()

        return () => {
            active = false
        }
    }, [user?.id])

    // Existing assignment logic
    const upcomingAssignments = assignments
        .filter((assignment) => {
            if (!assignment.due_date) return false

            const dueDate = new Date(assignment.due_date)
            const now = new Date()

            const isCompleted =
                assignment.status === 'completed' ||
                assignment.status === 'submitted'

            return dueDate >= now && !isCompleted
        })
        .sort(
            (a, b) =>
                new Date(a.due_date) - new Date(b.due_date)
        )

    // Existing task logic
    const upcomingTasks = tasks
        .filter((task) => {
            if (!task.due_date) return false

            return (
                new Date(task.due_date) >= new Date() &&
                task.status !== 'completed'
            )
        })
        .sort(
            (a, b) =>
                new Date(a.due_date) - new Date(b.due_date)
        )

    const todoCount = tasks.filter(
        (task) => task.status === 'todo'
    ).length

    const inProgressCount = tasks.filter(
        (task) => task.status === 'in_progress'
    ).length

    const completedCount = tasks.filter(
        (task) => task.status === 'completed'
    ).length

    const totalTasks =
        todoCount + inProgressCount + completedCount

    const completionPercentage =
        totalTasks > 0
            ? Math.round((completedCount / totalTasks) * 100)
            : 0

    const today = new Date()

    const dateLabel = today.toLocaleDateString('en-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const greeting =
        today.getHours() < 12
            ? 'Good morning'
            : today.getHours() < 18
                ? 'Good afternoon'
                : 'Good evening'

    function getClassStatus(startTime, endTime) {
        const now = new Date()

        const [startHour, startMinute] = startTime
            .slice(0, 5)
            .split(':')
            .map(Number)

        const [endHour, endMinute] = endTime
            .slice(0, 5)
            .split(':')
            .map(Number)

        const start = new Date()
        start.setHours(startHour, startMinute, 0, 0)

        const end = new Date()
        end.setHours(endHour, endMinute, 0, 0)

        if (now >= end) return 'completed'
        if (now >= start && now < end) return 'now'
        return 'upcoming'
    }

    function getDueLabel(date) {
        const current = new Date()
        const due = new Date(date)

        current.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)

        const days = Math.round(
            (due - current) / 86400000
        )

        if (days === 0) return 'Due today'
        if (days === 1) return 'Tomorrow'
        if (days > 1 && days <= 7) return `In ${days} days`

        return due.toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'short',
        })
    }

    const statusConfig = {
        now: {
            label: 'Now',
            className: 'bg-[#DDF6EB] text-[#288767]',
            dot: 'bg-[#60C9B5]',
        },
        upcoming: {
            label: 'Upcoming',
            className: 'bg-[#E5EAFF] text-[#526BC6]',
            dot: 'bg-[#809AF4]',
        },
        completed: {
            label: 'Completed',
            className: 'bg-[#F0F1F4] text-[#898D99]',
            dot: 'bg-[#BEC1CB]',
        },
    }

    const coursePageCount = Math.ceil(courses.length / 2)

    const visibleCourses = courses.slice(
        coursePage * 2,
        coursePage * 2 + 2
    )

    if (loading) {
        return (
            <div
                role="status"
                className="flex min-h-[65vh] flex-col items-center justify-center"
            >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E7ECF7] border-t-[#678DF3]" />

                <p className="mt-4 text-sm text-[#8E929F]">
                    Loading your study workspace...
                </p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-375 space-y-4 pb-5">

            {/* ====================================
          Greeting
      ==================================== */}

            <section className="flex flex-wrap items-center justify-between gap-4 px-1 py-2">
                <div>
                    <p className="mb-1 text-[13px] text-[#858895]">
                        Welcome back to StudORA!
                    </p>

                    <h1
                        className="
              font-['Space_Grotesk',sans-serif]
              text-[28px] font-semibold
              leading-tight tracking-tighter
              text-[#202027]
              sm:text-[35px]
            "
                    >
                        {greeting}, {displayName}.
                    </h1>

                    <p className="mt-2 flex items-center gap-2 text-[12px] text-[#898C99]">
                        <CalendarDays size={14} />
                        {dateLabel}
                    </p>
                </div>

                <NavLink
                    to="/tasks"
                    className="
            inline-flex items-center gap-2
            rounded-full bg-[#202027]
            px-4 py-2.5 text-xs
            font-semibold text-white
            transition hover:bg-[#444450]
          "
                >
                    <CheckSquare size={15} />
                    View my tasks
                    <ArrowUpRight size={14} />
                </NavLink>
            </section>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}


            {!activeSemesterId && (
                <div className="rounded-2xl border border-[#DCE3F5] bg-[#F1F4FF] px-5 py-4">
                    <p className="text-sm font-semibold text-[#354B92]">
                        No active semester selected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#6577AD]">
                        Select your active semester in Academic Years
                        to see courses for your current semester.
                    </p>

                    <NavLink
                        to="/academic-years"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#526BC6] hover:underline"
                    >
                        Go to Academic Years
                        <ArrowRight size={14} />
                    </NavLink>
                </div>
            )}


            {/* Academic Tracker + Important Dates */}
            <div className="grid items-start gap-4 xl:grid-cols-2">
                <AcademicTracker
                    semesterName={activeSemesterName || 'No active semester'}
                    studyMode="Part-Time"
                    sessions={semesterSessions}
                />

                <ImportantDates semesterId={activeSemesterId} />
            </div>



            {/* ====================================
          Overview Statistics
      ==================================== */}

            <section className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        label: 'My Courses',
                        value: courses.length,
                        description: 'Active courses',
                        icon: BookOpen,
                        bg: 'bg-[#E4F6F5]',
                        color: 'text-[#218D8B]',
                        path: '/courses',
                    },
                    {
                        label: 'Assignments',
                        value: upcomingAssignments.length,
                        description: 'Upcoming deadlines',
                        icon: ClipboardList,
                        bg: 'bg-[#E8EDFF]',
                        color: 'text-[#566EC9]',
                        path: '/assignments',
                    },
                    {
                        label: 'Open Tasks',
                        value: todoCount + inProgressCount,
                        description: 'Tasks remaining',
                        icon: CheckSquare,
                        bg: 'bg-[#FBE8F0]',
                        color: 'text-[#CC638B]',
                        path: '/tasks',
                    },
                ].map((stat) => {
                    const Icon = stat.icon

                    return (
                        <NavLink
                            key={stat.label}
                            to={stat.path}
                            className="
                group flex items-center gap-4
                rounded-[20px] border border-[#E9EBF0]
                bg-white p-4
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_8px_24px_rgba(35,35,70,0.05)]
              "
                        >
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}
                            >
                                <Icon size={23} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#9396A2]">
                                    {stat.label}
                                </p>

                                <p className="font-['Space_Grotesk',sans-serif] text-[26px] font-bold leading-tight text-[#202027]">
                                    {stat.value}
                                </p>

                                <p className="text-[11px] text-[#A0A3AD]">
                                    {stat.description}
                                </p>
                            </div>

                            <ArrowUpRight
                                size={16}
                                className="self-start text-[#B3B5C0] transition group-hover:text-[#526BC6]"
                            />
                        </NavLink>
                    )
                })}
            </section>

            {/* ====================================
          Main Grid
      ==================================== */}

            <div className="grid items-start gap-4 xl:grid-cols-2">

                {/* Ongoing Courses */}
                <section className={panel}>
                    <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F9]">
                                <GraduationCap size={20} />
                            </div>

                            <h2 className={`${heading} text-[18px]`}>
                                Ongoing Courses
                            </h2>

                            <span className="rounded-full bg-[#202027] px-2.5 py-1 text-[10px] font-semibold text-white">
                                {courses.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Previous courses"
                                disabled={coursePage === 0}
                                onClick={() =>
                                    setCoursePage((page) => Math.max(0, page - 1))
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F7F9] disabled:opacity-30"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <button
                                type="button"
                                aria-label="Next courses"
                                disabled={coursePage >= coursePageCount - 1}
                                onClick={() =>
                                    setCoursePage((page) =>
                                        Math.min(coursePageCount - 1, page + 1)
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F7F9] disabled:opacity-30"
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>

                    {courses.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="No active courses"
                            description="Your courses will appear here once added."
                        />
                    ) : (
                        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                            {visibleCourses.map((course, index) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    index={coursePage * 2 + index}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Task Progress */}
                <section className={panel}>
                    <SectionHeader
                        icon={Timer}
                        title="Learning Progress"
                        to="/tasks"
                    />

                    <div className="px-5 pb-5">
                        <div className="flex flex-col items-center gap-5 rounded-[18px] bg-[#F8F9FC] p-5 sm:flex-row">
                            {/* Circle */}
                            <div
                                role="progressbar"
                                aria-label="Task completion"
                                aria-valuenow={completionPercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="relative flex h-36.25 w-36.25 shrink-0 items-center justify-center rounded-full"
                                style={{
                                    background: `conic-gradient(
                    #75D4CF 0% ${completionPercentage}%,
                    #E8EBF3 ${completionPercentage}% 100%
                  )`,
                                }}
                            >
                                <div className="flex h-29 w-29 flex-col items-center justify-center rounded-full bg-white">
                                    <p className="font-['Space_Grotesk',sans-serif] text-[32px] font-bold tracking-tight">
                                        {completionPercentage}%
                                    </p>

                                    <p className="text-[10px] text-[#989BA6]">
                                        Task completion
                                    </p>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="w-full flex-1 space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-[#202027]">
                                        Your productivity
                                    </p>
                                    <p className="mt-1 text-xs text-[#9699A5]">
                                        {completedCount} of {totalTasks} tasks completed
                                    </p>
                                </div>

                                {[
                                    {
                                        label: 'To Do',
                                        value: todoCount,
                                        color: 'bg-[#95A9ED]',
                                    },
                                    {
                                        label: 'In Progress',
                                        value: inProgressCount,
                                        color: 'bg-[#EFC98A]',
                                    },
                                    {
                                        label: 'Completed',
                                        value: completedCount,
                                        color: 'bg-[#75D4CF]',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                                        />

                                        <span className="flex-1 text-xs text-[#777B88]">
                                            {item.label}
                                        </span>

                                        <span className="text-xs font-bold text-[#202027]">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EFF1F6]">
                            <div
                                className="h-full rounded-full bg-[#75D4CF] transition-[width] duration-500 motion-reduce:transition-none"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>

                        <p className="mt-3 text-center text-[11px] text-[#989BA6]">
                            Keep making progress, one task at a time.
                        </p>
                    </div>
                </section>

                {/* Today's Classes */}
                <section className={panel}>
                    <SectionHeader
                        icon={CalendarClock}
                        title="Today's Classes"
                        count={todayTimetable.length}
                        to="/timetable"
                    />

                    {todayTimetable.length === 0 ? (
                        <EmptyState
                            icon={CalendarDays}
                            title="No classes today"
                            description="Your timetable is clear for today."
                        />
                    ) : (
                        <div className="px-5 pb-5">
                            <div className="space-y-3">
                                {todayTimetable.map((entry) => {
                                    const status = getClassStatus(
                                        entry.start_time,
                                        entry.end_time
                                    )

                                    const config = statusConfig[status]

                                    return (
                                        <div
                                            key={entry.id}
                                            className="flex items-start gap-4 rounded-[17px] border border-[#EDF0F4] bg-[#FCFCFE] p-4"
                                        >
                                            <div className="shrink-0">
                                                <p className="text-xs font-bold text-[#252735]">
                                                    {entry.start_time.slice(0, 5)}
                                                </p>

                                                <p className="mt-1 text-[11px] text-[#9A9DA8]">
                                                    {entry.end_time.slice(0, 5)}
                                                </p>
                                            </div>

                                            <div className="relative min-w-0 flex-1 border-l-2 border-[#DCE6FA] pl-4">
                                                <span
                                                    className={`absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full ${config.dot}`}
                                                />

                                                <p className="text-[10px] font-semibold tracking-wide text-[#6B81CA]">
                                                    {entry.courses?.code}
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-[#202027]">
                                                    {entry.courses?.name}
                                                </p>

                                                {entry.location && (
                                                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[#9699A5]">
                                                        <MapPin size={12} />
                                                        {entry.location}
                                                    </p>
                                                )}
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${config.className}`}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* Assignments */}
                <section className={panel}>
                    <SectionHeader
                        icon={ClipboardList}
                        title="Upcoming Assignments"
                        count={upcomingAssignments.length}
                        to="/assignments"
                    />

                    {upcomingAssignments.length === 0 ? (
                        <EmptyState
                            icon={CircleCheck}
                            title="All caught up"
                            description="No upcoming assignments."
                        />
                    ) : (
                        <div className="divide-y divide-[#F0F1F5] px-5 pb-3">
                            {upcomingAssignments.slice(0, 5).map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex items-start justify-between gap-3 py-4"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9EEFF] text-[#617BD7]">
                                            <ClipboardList size={17} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[#202027]">
                                                {assignment.title}
                                            </p>

                                            {assignment.courses && (
                                                <p className="mt-1 truncate text-[11px] text-[#999CA7]">
                                                    {assignment.courses.code}
                                                    {' · '}
                                                    {assignment.courses.name}
                                                </p>
                                            )}

                                            <p className="mt-2 flex items-center gap-1 text-[11px] text-[#818593]">
                                                <Clock3 size={12} />
                                                {getDueLabel(assignment.due_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <PriorityBadge priority={assignment.priority} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Upcoming Tasks */}
                <section className={panel}>
                    <SectionHeader
                        icon={CheckSquare}
                        title="Upcoming Tasks"
                        count={upcomingTasks.length}
                        to="/tasks"
                    />

                    {upcomingTasks.length === 0 ? (
                        <EmptyState
                            icon={CircleCheck}
                            title="Nothing waiting"
                            description="No upcoming tasks at the moment."
                        />
                    ) : (
                        <div className="divide-y divide-[#F0F1F5] px-5 pb-3">
                            {upcomingTasks.slice(0, 5).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-3 py-4"
                                >
                                    <div className="mt-0.5 shrink-0 text-[#7297D9]">
                                        {task.status === 'in_progress' ? (
                                            <Timer size={20} />
                                        ) : (
                                            <Circle size={20} />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[13px] font-semibold text-[#202027]">
                                                {task.title}
                                            </p>

                                            <PriorityBadge priority={task.priority} />
                                        </div>

                                        {task.courses && (
                                            <p className="mt-1 truncate text-[11px] text-[#999CA7]">
                                                {task.courses.code}
                                                {' · '}
                                                {task.courses.name}
                                            </p>
                                        )}

                                        <p className="mt-2 flex items-center gap-1 text-[11px] text-[#818593]">
                                            <Clock3 size={12} />
                                            {getDueLabel(task.due_date)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>

            {/* Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 text-[11px] text-[#9B9EAA]">
                <span>StudORA — Your learning workspace</span>

                <span className="flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Keep learning, keep growing.
                </span>
            </footer>
        </div>
    )
}

export default Dashboard

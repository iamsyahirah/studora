import { useEffect, useState } from 'react'
import {
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    CalendarDays,
    CheckCircle2,
    Circle,
    GraduationCap,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

import {
    getAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    createSemester,
    updateSemester,
    deleteSemester,
    getActiveSemester,
    setActiveSemester,
    deactivateSemester,
} from '../../services/academicYearService'

import SemesterSessions from '../../components/Academic/SemesterSessions'

function AcademicYears() {
    const { user } = useAuth()

    const [academicYears, setAcademicYears] = useState([])

    const [yearName, setYearName] = useState('')

    const [editingYearId, setEditingYearId] = useState(null)
    const [editingYearName, setEditingYearName] = useState('')

    const [expandedYearId, setExpandedYearId] = useState(null)

    const [semesterForm, setSemesterForm] = useState({
        academicYearId: '',
        name: '',
        startDate: '',
        endDate: '',
    })

    const [editingSemesterId, setEditingSemesterId] = useState(null)

    const [activeSemesterId, setActiveSemesterId] = useState(null)
    const [activatingSemesterId, setActivatingSemesterId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadAcademicYears() {
            try {
                setError('')

                const [yearsData, activeId] = await Promise.all([
                    getAcademicYears(user.id),
                    getActiveSemester(user.id),
                ])

                setAcademicYears(yearsData || [])
                setActiveSemesterId(activeId)

            } catch (error) {
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        if (user?.id) {
            loadAcademicYears()
        }
    }, [user?.id])

    const activeSemesterInfo = academicYears
        .flatMap((year) =>
            (year.semesters || []).map((semester) => ({
                ...semester,
                academicYearName: year.name,
            }))
        )
        .find((semester) => semester.id === activeSemesterId)

    // =========================
    // Academic Year
    // =========================

    async function handleAddYear(event) {
        event.preventDefault()

        if (!yearName.trim()) {
            setError('Please enter an academic year.')
            return
        }

        try {
            setSaving(true)
            setError('')

            const newYear = await createAcademicYear(
                user.id,
                yearName.trim()
            )

            setAcademicYears((current) => [
                {
                    ...newYear,
                    semesters: [],
                },
                ...current,
            ])

            setYearName('')
        } catch (error) {
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    function startEditYear(year) {
        setEditingYearId(year.id)
        setEditingYearName(year.name)
    }

    function cancelEditYear() {
        setEditingYearId(null)
        setEditingYearName('')
    }

    async function handleUpdateYear(yearId) {
        if (!editingYearName.trim()) {
            setError('Academic year name cannot be empty.')
            return
        }

        try {
            setSaving(true)
            setError('')

            const updatedYear = await updateAcademicYear(
                yearId,
                editingYearName.trim()
            )

            setAcademicYears((current) =>
                current.map((year) =>
                    year.id === yearId
                        ? {
                            ...year,
                            name: updatedYear.name,
                        }
                        : year
                )
            )

            cancelEditYear()
        } catch (error) {
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteYear(yearId) {
        const confirmed = window.confirm(
            'Delete this academic year? Its semesters and courses may also be affected.'
        )

        if (!confirmed) return

        try {
            setError('')

            await deleteAcademicYear(yearId)

            setAcademicYears((current) =>
                current.filter((year) => year.id !== yearId)
            )

            if (expandedYearId === yearId) {
                setExpandedYearId(null)
            }
        } catch (error) {
            setError(error.message)
        }
    }

    // =========================
    // Semester
    // =========================

    function openSemesterForm(yearId) {
        setEditingSemesterId(null)

        setSemesterForm({
            academicYearId: yearId,
            name: '',
            startDate: '',
            endDate: '',
        })
    }

    function startEditSemester(yearId, semester) {
        setEditingSemesterId(semester.id)

        setSemesterForm({
            academicYearId: yearId,
            name: semester.name,
            startDate: semester.start_date || '',
            endDate: semester.end_date || '',
        })
    }

    function cancelSemesterForm() {
        setEditingSemesterId(null)

        setSemesterForm({
            academicYearId: '',
            name: '',
            startDate: '',
            endDate: '',
        })
    }

    async function handleSemesterSubmit(event) {
        event.preventDefault()

        const {
            academicYearId,
            name,
            startDate,
            endDate,
        } = semesterForm

        if (!name.trim()) {
            setError('Please enter a semester name.')
            return
        }

        if (!startDate || !endDate) {
            setError('Please select semester start and end dates.')
            return
        }

        if (startDate > endDate) {
            setError('Start date cannot be after end date.')
            return
        }

        try {
            setSaving(true)
            setError('')

            if (editingSemesterId) {
                const updatedSemester = await updateSemester(
                    editingSemesterId,
                    name.trim(),
                    startDate,
                    endDate
                )

                setAcademicYears((current) =>
                    current.map((year) => {
                        if (year.id !== academicYearId) {
                            return year
                        }

                        return {
                            ...year,
                            semesters: (year.semesters || []).map(
                                (semester) =>
                                    semester.id === editingSemesterId
                                        ? updatedSemester
                                        : semester
                            ),
                        }
                    })
                )
            } else {
                const newSemester = await createSemester(
                    academicYearId,
                    name.trim(),
                    startDate,
                    endDate
                )

                setAcademicYears((current) =>
                    current.map((year) =>
                        year.id === academicYearId
                            ? {
                                ...year,
                                semesters: [
                                    ...(year.semesters || []),
                                    newSemester,
                                ],
                            }
                            : year
                    )
                )
            }

            cancelSemesterForm()
        } catch (error) {
            setError(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteSemester(
        academicYearId,
        semesterId
    ) {
        const confirmed = window.confirm(
            'Delete this semester?'
        )

        if (!confirmed) return

        try {
            setError('')

            await deleteSemester(semesterId)

            setAcademicYears((current) =>
                current.map((year) =>
                    year.id === academicYearId
                        ? {
                            ...year,
                            semesters: (year.semesters || []).filter(
                                (semester) =>
                                    semester.id !== semesterId
                            ),
                        }
                        : year
                )
            )
        } catch (error) {
            setError(error.message)
        }
    }


    async function handleSetActiveSemester(semesterId) {
        if (!user?.id || activatingSemesterId !== null) return

        try {
            setError('')
            setActivatingSemesterId(semesterId)

            const savedId = await setActiveSemester(
                user.id,
                semesterId
            )

            setActiveSemesterId(savedId)
        } catch (err) {
            setError(err.message || 'Unable to activate semester.')
        } finally {
            setActivatingSemesterId(null)
        }
    }

    async function handleDeactivateSemester() {
        if (!user?.id || activatingSemesterId !== null) return

        try {
            setError('')
            setActivatingSemesterId(activeSemesterId)

            await deactivateSemester(user.id)

            setActiveSemesterId(null)
        } catch (err) {
            setError(err.message || 'Unable to deactivate semester.')
        } finally {
            setActivatingSemesterId(null)
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-slate-500">
                    Loading...
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Academic Years
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Manage your academic years and semesters.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}


            {/* Current Active Semester */}
            <section className="rounded-[22px] border border-[#CDEBE3] bg-[#E7F5F2] p-5 sm:p-6">

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#278567]">
                        <GraduationCap size={20} />
                        <span className="text-xs font-bold tracking-[0.08em]">
                            CURRENT SEMESTER
                        </span>
                    </div>

                    {activeSemesterInfo && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#278567]">
                            <CheckCircle2 size={15} />
                            Active
                        </span>
                    )}
                </div>

                {activeSemesterInfo ? (
                    <>
                        <h2 className="font-['Space_Grotesk',sans-serif] text-[30px] font-bold tracking-tight text-[#202027]">
                            {activeSemesterInfo.name}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-[#526C71]">
                            Academic Year {activeSemesterInfo.academicYearName}
                        </p>

                        <div className="mt-5 border-t border-[#C5E6DC] pt-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#526C71]">
                                <CalendarDays size={16} />
                                <span>
                                    {activeSemesterInfo.start_date || 'Start date not set'}
                                    {' → '}
                                    {activeSemesterInfo.end_date || 'End date not set'}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <h2 className="text-xl font-bold text-[#202027]">
                            No active semester
                        </h2>

                        <p className="mt-2 text-sm text-[#526C71]">
                            Select a semester below and click Set as Active.
                        </p>
                    </div>
                )}
            </section>

            {activeSemesterInfo && (
                <SemesterSessions
                    semesterId={activeSemesterId}
                    semesterName={activeSemesterInfo.name}
                />
            )}


            {/* Add Academic Year */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarDays
                        size={18}
                        className="text-slate-600"
                    />

                    <h2 className="font-semibold text-slate-900">
                        Add Academic Year
                    </h2>
                </div>

                <form
                    onSubmit={handleAddYear}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <input
                        type="text"
                        placeholder="e.g. 2026/2027"
                        value={yearName}
                        onChange={(event) =>
                            setYearName(event.target.value)
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    />

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Plus size={16} />

                        {saving ? 'Adding...' : 'Add Academic Year'}
                    </button>
                </form>
            </div>

            {/* Academic Year List */}
            <div className="space-y-4">
                {academicYears.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                        <CalendarDays
                            size={32}
                            className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="text-sm text-slate-500">
                            No academic years yet.
                        </p>
                    </div>
                ) : (
                    academicYears.map((year) => {
                        const isExpanded =
                            expandedYearId === year.id

                        return (
                            <div
                                key={year.id}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                            >
                                {/* Academic Year Header */}
                                <div className="flex items-center justify-between gap-4 px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedYearId(
                                                isExpanded
                                                    ? null
                                                    : year.id
                                            )
                                        }
                                        className="flex min-w-0 items-center gap-3 text-left"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown
                                                size={18}
                                                className="shrink-0 text-slate-400"
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={18}
                                                className="shrink-0 text-slate-400"
                                            />
                                        )}

                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {year.name}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {year.semesters?.length || 0}{' '}
                                                semester
                                                {year.semesters?.length === 1 ? '' : 's'} registered
                                            </p>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                startEditYear(year)
                                            }
                                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                            title="Edit academic year"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteYear(
                                                    year.id
                                                )
                                            }
                                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                            title="Delete academic year"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Edit Academic Year */}
                                {editingYearId === year.id && (
                                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <input
                                                type="text"
                                                value={
                                                    editingYearName
                                                }
                                                onChange={(event) =>
                                                    setEditingYearName(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateYear(
                                                        year.id
                                                    )
                                                }
                                                disabled={saving}
                                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                            >
                                                Save
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    cancelEditYear
                                                }
                                                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Semester Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-slate-900">
                                                    Semesters
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Manage semesters for{' '}
                                                    {year.name}.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openSemesterForm(
                                                        year.id
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                            >
                                                <Plus size={15} />
                                                Add Semester
                                            </button>
                                        </div>

                                        {/* Semester Form */}
                                        {semesterForm.academicYearId ===
                                            year.id && (
                                                <form
                                                    onSubmit={
                                                        handleSemesterSubmit
                                                    }
                                                    className="mb-5 rounded-lg border border-slate-200 bg-white p-4"
                                                >
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                                Semester Name
                                                            </label>

                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Semester 1"
                                                                value={
                                                                    semesterForm.name
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setSemesterForm(
                                                                        (
                                                                            current
                                                                        ) => ({
                                                                            ...current,
                                                                            name: event
                                                                                .target
                                                                                .value,
                                                                        })
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                                Start Date
                                                            </label>

                                                            <input
                                                                type="date"
                                                                value={
                                                                    semesterForm.startDate
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setSemesterForm(
                                                                        (
                                                                            current
                                                                        ) => ({
                                                                            ...current,
                                                                            startDate:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        })
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                                End Date
                                                            </label>

                                                            <input
                                                                type="date"
                                                                value={
                                                                    semesterForm.endDate
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setSemesterForm(
                                                                        (
                                                                            current
                                                                        ) => ({
                                                                            ...current,
                                                                            endDate:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        })
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex gap-2">
                                                        <button
                                                            type="submit"
                                                            disabled={saving}
                                                            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                                        >
                                                            {saving
                                                                ? 'Saving...'
                                                                : editingSemesterId
                                                                    ? 'Save Changes'
                                                                    : 'Add Semester'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                cancelSemesterForm
                                                            }
                                                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            )}

                                        {/* Semester List */}
                                        {year.semesters?.length ===
                                            0 ? (
                                            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                                                <p className="text-sm text-slate-500">
                                                    No semesters yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {year.semesters.map(
                                                    (semester) => (
                                                        <div
                                                            key={
                                                                semester.id
                                                            }
                                                            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4"
                                                        >
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="font-medium text-slate-900">
                                                                        {semester.name}
                                                                    </p>

                                                                    {activeSemesterId === semester.id && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#DFF5EB] px-2.5 py-1 text-[10px] font-semibold text-[#278567]">
                                                                            <CheckCircle2 size={12} />
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {semester.start_date ||
                                                                        '—'}{' '}
                                                                    →{' '}
                                                                    {semester.end_date ||
                                                                        '—'}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-1">


                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (activeSemesterId === semester.id) {
                                                                            handleDeactivateSemester()
                                                                        } else {
                                                                            handleSetActiveSemester(semester.id)
                                                                        }
                                                                    }}
                                                                    disabled={activatingSemesterId !== null}
                                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${activeSemesterId === semester.id
                                                                        ? 'border-[#F2D8DC] bg-[#FFF1F2] text-[#B44C62] hover:bg-[#FFE4E8]'
                                                                        : 'border-[#DCE3F5] bg-[#F1F4FF] text-[#526BC6] hover:bg-[#E5EBFF]'
                                                                        }`}
                                                                >
                                                                    {activatingSemesterId === semester.id
                                                                        ? 'Updating...'
                                                                        : activeSemesterId === semester.id
                                                                            ? 'Deactivate'
                                                                            : 'Set as Active'}
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        startEditSemester(
                                                                            year.id,
                                                                            semester
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                                    title="Edit semester"
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteSemester(
                                                                            year.id,
                                                                            semester.id
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                                    title="Delete semester"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default AcademicYears
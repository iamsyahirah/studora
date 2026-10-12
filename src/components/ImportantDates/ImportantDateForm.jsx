import { useEffect, useState } from 'react'
import { CalendarPlus, X } from 'lucide-react'

import {
    createImportantDate,
    updateImportantDate,
} from '../../services/importantDatesServices'

const initialForm = {
    title: '',
    category: 'payment',
    event_date: '',
    event_time: '',
    amount: '',
    location: '',
    notes: '',
}

export default function ImportantDateForm({
    semesterId,
    onSaved,
    editingEvent = null,
    onCancel,
}) {
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (editingEvent) {
            setForm({
                title: editingEvent.title || '',
                category: editingEvent.category || 'other',
                event_date: editingEvent.event_date || '',
                event_time: editingEvent.event_time?.slice(0, 5) || '',
                amount: editingEvent.amount ?? '',
                location: editingEvent.location || '',
                notes: editingEvent.notes || '',
            })
        } else {
            setForm({ ...initialForm })
        }
    }, [editingEvent])

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!semesterId) {
            setError('Please select an active semester.')
            return
        }

        if (!form.title.trim() || !form.event_date) {
            setError('Event title and date are required.')
            return
        }

        if (
            form.amount !== '' &&
            (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0)
        ) {
            setError('Please enter a valid amount.')
            return
        }

        try {
            setSaving(true)

            if (editingEvent) {
                await updateImportantDate(editingEvent.id, form)
            } else {
                await createImportantDate(semesterId, form)
            }

            setForm({ ...initialForm })
            onSaved?.()
        } catch (err) {
            setError(err.message || 'Unable to save important date.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[22px] border border-[#E9EBF0] bg-white p-5 sm:p-6"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#526BC6]">
                        <CalendarPlus size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-[#202027]">
                            {editingEvent ? 'Edit Important Date' : 'Add Important Date'}
                        </h2>
                        <p className="text-xs text-[#929AAC]">
                            Save an academic deadline or reminder.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close form"
                    className="rounded-lg p-2 text-[#929AAC] hover:bg-[#F5F7FB]"
                >
                    <X size={18} />
                </button>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label
                        htmlFor="important-title"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Event Title *
                    </label>
                    <input
                        id="important-title"
                        type="text"
                        value={form.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        maxLength={150}
                        required
                        placeholder="e.g. Tuition Fee Payment"
                        className="w-full rounded-xl border border-[#E2E6EF] px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <div>
                    <label
                        htmlFor="important-category"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Category
                    </label>
                    <select
                        id="important-category"
                        value={form.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6EF] bg-white px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    >
                        <option value="payment">Payment</option>
                        <option value="exam">Exam</option>
                        <option value="registration">Registration</option>
                        <option value="academic">Academic</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="important-date"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Event Date *
                    </label>
                    <input
                        id="important-date"
                        type="date"
                        value={form.event_date}
                        onChange={(e) => updateField('event_date', e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#E2E6EF] bg-white px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <div>
                    <label
                        htmlFor="important-time"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Time (Optional)
                    </label>
                    <input
                        id="important-time"
                        type="time"
                        value={form.event_time}
                        onChange={(e) => updateField('event_time', e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6EF] bg-white px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <div>
                    <label
                        htmlFor="important-amount"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Amount (RM, Optional)
                    </label>
                    <input
                        id="important-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => updateField('amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-[#E2E6EF] px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label
                        htmlFor="important-location"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Location (Optional)
                    </label>
                    <input
                        id="important-location"
                        type="text"
                        value={form.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="e.g. Examination Hall"
                        className="w-full rounded-xl border border-[#E2E6EF] px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label
                        htmlFor="important-notes"
                        className="mb-2 block text-sm font-medium text-[#515969]"
                    >
                        Notes (Optional)
                    </label>
                    <textarea
                        id="important-notes"
                        rows={3}
                        value={form.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Additional details..."
                        className="w-full resize-y rounded-xl border border-[#E2E6EF] px-4 py-3 text-sm outline-none focus:border-[#698AFF]"
                    />
                </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-xl border border-[#E2E6EF] px-5 py-3 text-sm font-medium text-[#515969]"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#202027] px-5 py-3 text-sm font-semibold text-white hover:bg-[#444450] disabled:opacity-50"
                >
                    {saving
                        ? 'Saving...'
                        : editingEvent
                            ? 'Save Changes'
                            : 'Save Important Date'}
                </button>
            </div>
        </form>
    )
}

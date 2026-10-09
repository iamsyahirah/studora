
import { useEffect, useState } from 'react'
import {
    UserRound,
    Mail,
    Save,
    CheckCircle2,
    LockKeyhole,
    Eye,
    EyeOff,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function Settings() {
    const { user } = useAuth()

    const [displayName, setDisplayName] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')

    useEffect(() => {
        setDisplayName(user?.user_metadata?.display_name || '')
    }, [user])

    async function handleSaveProfile(event) {
        event.preventDefault()

        setError('')
        setSuccess('')

        const name = displayName.trim()

        if (!name) {
            setError('Please enter your display name.')
            return
        }

        setSaving(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    display_name: name,
                },
            })

            if (updateError) throw updateError

            setSuccess('Profile updated successfully.')
        } catch (err) {
            setError(err.message || 'Unable to update profile.')
        } finally {
            setSaving(false)
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault()

        setPasswordError('')
        setPasswordSuccess('')

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters.')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.')
            return
        }

        setPasswordSaving(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) throw updateError

            setPasswordSuccess('Your password has been updated successfully.')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setPasswordError(err.message || 'Unable to update password.')
        } finally {
            setPasswordSaving(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-7 pb-10">

            {/* Header */}
            <div>
                <h1 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-[#202027]">
                    Settings
                </h1>
                <p className="mt-2 text-sm text-[#858B99]">
                    Manage your StudORA account and preferences.
                </p>
            </div>

            {/* Profile Card */}
            <section className="overflow-hidden rounded-[22px] border border-[#E8EBF1] bg-white">

                <div className="flex items-center gap-3 border-b border-[#EEF0F4] px-6 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDFF] text-[#526BC6]">
                        <UserRound size={21} />
                    </div>

                    <div>
                        <h2 className="text-base font-bold text-[#202027]">
                            My Profile
                        </h2>
                        <p className="mt-1 text-xs text-[#969BA8]">
                            Update your personal information
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSaveProfile}
                    className="space-y-6 p-6"
                >
                    {/* Display Name */}
                    <div>
                        <label
                            htmlFor="displayName"
                            className="mb-2 block text-sm font-semibold text-[#343846]"
                        >
                            Display name
                        </label>

                        <div className="relative">
                            <UserRound
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A8B5]"
                            />

                            <input
                                id="displayName"
                                type="text"
                                maxLength={60}
                                required
                                value={displayName}
                                onChange={(event) =>
                                    setDisplayName(event.target.value)
                                }
                                placeholder="Enter your name"
                                className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] py-3 pl-11 pr-4 text-sm text-[#202027] outline-none transition focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                            />
                        </div>

                        <p className="mt-2 text-xs text-[#9DA2AF]">
                            This name can be displayed on your dashboard.
                        </p>
                    </div>

                    {/* Email - Read Only */}
                    <div>
                        <label
                            htmlFor="profileEmail"
                            className="mb-2 block text-sm font-semibold text-[#343846]"
                        >
                            Email address
                        </label>

                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A8B5]"
                            />

                            <input
                                id="profileEmail"
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full cursor-not-allowed rounded-xl border border-[#E3E7EF] bg-[#F3F5F9] py-3 pl-11 pr-4 text-sm text-[#777E8D] outline-none"
                            />
                        </div>

                        <p className="mt-2 text-xs text-[#9DA2AF]">
                            Email changes are not available in this version.
                        </p>
                    </div>

                    {/* Feedback */}
                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                            {error}
                        </p>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="flex items-center gap-2 rounded-xl bg-[#EDF8F2] px-4 py-3 text-sm text-[#287B5A]"
                        >
                            <CheckCircle2 size={18} />
                            {success}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-[#EEF0F4] pt-5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-[#202027] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#383844] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={17} />
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </section>


            {/* Account Security */}
            <section className="overflow-hidden rounded-[22px] border border-[#E8EBF1] bg-white">

                <div className="flex items-center gap-3 border-b border-[#EEF0F4] px-6 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDFF] text-[#526BC6]">
                        <LockKeyhole size={21} />
                    </div>

                    <div>
                        <h2 className="text-base font-bold text-[#202027]">
                            Account Security
                        </h2>
                        <p className="mt-1 text-xs text-[#969BA8]">
                            Update your account password
                        </p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 p-6">

                    {/* New password */}
                    <div>
                        <label
                            htmlFor="newPassword"
                            className="mb-2 block text-sm font-semibold text-[#343846]"
                        >
                            New password
                        </label>

                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] px-4 py-3 pr-12 text-sm outline-none focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969BA8]"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-2 block text-sm font-semibold text-[#343846]"
                        >
                            Confirm new password
                        </label>

                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your new password"
                            className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] px-4 py-3 text-sm outline-none focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                        />
                    </div>

                    {passwordError && (
                        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {passwordError}
                        </p>
                    )}

                    {passwordSuccess && (
                        <div role="status" className="flex items-center gap-2 rounded-xl bg-[#EDF8F2] px-4 py-3 text-sm text-[#287B5A]">
                            <CheckCircle2 size={18} />
                            {passwordSuccess}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-[#EEF0F4] pt-5">
                        <button
                            type="submit"
                            disabled={passwordSaving}
                            className="rounded-xl bg-[#202027] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#383844] disabled:opacity-60"
                        >
                            {passwordSaving ? 'Updating...' : 'Update password'}
                        </button>
                    </div>
                </form>
            </section>

        </div>
    )
}

export default Settings

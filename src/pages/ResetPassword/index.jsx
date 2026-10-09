
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    GraduationCap,
    LockKeyhole,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [recoveryReady, setRecoveryReady] = useState(false)
    const [checking, setChecking] = useState(true)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        // A recovery session must be established by Supabase.
        // An ordinary signed-in session is not sufficient.

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setRecoveryReady(true)
                setError('')
            }
        })

        // Allow Supabase to process the recovery redirect.
        const checkRecovery = async () => {
            const { error: sessionError } =
                await supabase.auth.initialize()

            if (sessionError) {
                setError('Recovery link is invalid or expired.')
            }

            setChecking(false)
        }

        checkRecovery()

        return () => subscription.unsubscribe()
    }, [])

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!recoveryReady) {
            setError('Please open a valid password recovery link.')
            return
        }

        if (password.length < 8) {
            setError('Password must contain at least 8 characters.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)

        try {
            const { error: updateError } =
                await supabase.auth.updateUser({
                    password,
                })

            if (updateError) throw updateError

            setSuccess(true)
            setRecoveryReady(false)
            setPassword('')
            setConfirmPassword('')

            // End the recovery session after changing password.
            await supabase.auth.signOut()
        } catch (err) {
            setError(err.message || 'Unable to update password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-[#EFF2F8] px-4 py-10">
            <div className="w-full max-w-110">

                {/* Brand */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202027] text-white">
                        <GraduationCap size={24} />
                    </div>

                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#202027]">
                        Study<span className="text-[#688DE8]">OS</span>
                    </h1>
                </div>

                <div className="rounded-3xl border border-[#E8EBF1] bg-white p-7 shadow-[0_15px_45px_rgba(40,55,90,0.05)] sm:p-9">

                    {success ? (
                        <div className="text-center">
                            <CheckCircle2
                                size={48}
                                className="mx-auto text-[#43A782]"
                            />

                            <h2 className="mt-5 text-2xl font-bold text-[#202027]">
                                Password updated!
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-[#858B99]">
                                Your password has been updated successfully.
                                You can now sign in with your new password.
                            </p>

                            <Link
                                to="/login"
                                className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#202027] px-4 py-3 text-sm font-semibold text-white hover:bg-[#383844]"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EDFF] text-[#526BC6]">
                                <LockKeyhole size={24} />
                            </div>

                            <h2 className="font-['Space_Grotesk',sans-serif] text-[27px] font-bold tracking-tight text-[#202027]">
                                Create new password
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#858B99]">
                                Choose a strong password for your StudyOS account.
                            </p>

                            {checking ? (
                                <p role="status" className="mt-6 text-sm text-[#858B99]">
                                    Checking recovery link...
                                </p>
                            ) : !recoveryReady ? (
                                <div role="alert" className="mt-6 rounded-xl border border-[#F0D5D9] bg-[#FFF1F2] p-4">
                                    <div className="flex items-start gap-2 text-sm text-[#B44C62]">
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span>
                                            {error || 'Recovery link is missing, invalid or expired. Request a new link to continue.'}
                                        </span>
                                    </div>

                                    <Link
                                        to="/forgot-password"
                                        className="mt-4 inline-block text-sm font-semibold text-[#526BC6] hover:underline"
                                    >
                                        Request another link
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="mt-7 space-y-5">

                                    <div>
                                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#343846]">
                                            New password
                                        </label>

                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="At least 8 characters"
                                                className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] px-4 py-3 pr-12 text-sm outline-none focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969BA8]"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[#343846]">
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
                                            placeholder="Repeat your password"
                                            className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] px-4 py-3 text-sm outline-none focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                                        />
                                    </div>

                                    {error && (
                                        <p role="alert" className="text-sm text-red-600">
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex w-full items-center justify-center rounded-xl bg-[#202027] px-4 py-3 text-sm font-semibold text-white hover:bg-[#383844] disabled:opacity-60"
                                    >
                                        {loading ? 'Updating...' : 'Update password'}
                                    </button>
                                </form>
                            )}

                            <Link
                                to="/login"
                                className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#526BC6] hover:underline"
                            >
                                <ArrowLeft size={16} />
                                Back to login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResetPassword

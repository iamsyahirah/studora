
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft,
    Mail,
    LockKeyhole,
    Send,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function ForgotPassword() {
    const { resetPassword } = useAuth()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            await resetPassword(email.trim())
            setSuccess(true)
        } catch (err) {
            setError(err.message || 'Unable to send reset email.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-4 py-10">
            <div className="w-full max-w-107.5">

                {/* Logo */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202027] text-white">
                        <LockKeyhole size={23} />
                    </div>

                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#202027]">
                        Stud<span className="text-[#688DE8]">ora</span>
                    </h1>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-[#E8EBF1] bg-white p-7 shadow-[0_15px_45px_rgba(40,55,90,0.05)] sm:p-9">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EDFF] text-[#526BC6]">
                        <Mail size={23} />
                    </div>

                    <h2 className="font-['Space_Grotesk',sans-serif] text-[26px] font-bold tracking-tight text-[#202027]">
                        Forgot password?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#858B99]">
                        Enter your registered email address and we'll
                        send you a link to reset your password.
                    </p>

                    {success ? (
                        <div
                            role="status"
                            className="mt-6 rounded-xl border border-[#CFE9DE] bg-[#EDF8F2] p-4 text-sm leading-6 text-[#287B5A]"
                        >
                            If an account exists for this email, you'll
                            receive a password reset link shortly.
                            Please check your inbox and spam folder.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
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
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-[#E3E7EF] bg-[#FBFCFE] py-3 pl-11 pr-4 text-sm text-[#202027] outline-none transition focus:border-[#688DE8] focus:ring-2 focus:ring-[#688DE8]/15"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#202027] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#343440] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Send size={17} />
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    )}

                    <Link
                        to="/login"
                        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#526BC6] hover:text-[#35499F]"
                    >
                        <ArrowLeft size={17} />
                        Back to login
                    </Link>
                </div>

                <p className="mt-6 text-center text-xs text-[#9DA2AF]">
                    Studora — Your student workspace
                </p>
            </div>
        </div>
    )
}

export default ForgotPassword

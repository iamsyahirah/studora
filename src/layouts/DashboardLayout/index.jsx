import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    ClipboardList,
    CheckSquare,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    Menu,
    X,
    GraduationCap,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Academic Years', path: '/academic-years', icon: CalendarDays },
    { label: 'Courses', path: '/courses', icon: BookOpen },
    { label: 'Timetable', path: '/timetable', icon: CalendarDays },
    { label: 'Assignments', path: '/assignments', icon: ClipboardList },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
]

function DashboardLayout() {
    const { user, signOut } = useAuth()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    const displayName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Student'

    const initial = displayName.charAt(0).toUpperCase()

    async function handleLogout() {
        await signOut()
    }

    function closeMobileSidebar() {
        setMobileOpen(false)
    }

    const navClass = (isActive) => `
    group flex min-h-[40px] items-center gap-3
    rounded-full px-3.5 py-2
    text-[13px] font-medium
    transition-colors duration-200
    ${!sidebarOpen ? 'md:justify-center md:px-2' : ''}
    ${isActive
            ? 'bg-[#202027] text-white'
            : 'text-[#666B78] hover:bg-[#E9EDF5] hover:text-[#202027]'
        }
  `

    return (
        <div className="min-h-dvh bg-[#E9EDF5] text-[#202027] md:h-dvh md:overflow-hidden md:p-4">

            {/* Mobile backdrop */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={closeMobileSidebar}
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                />
            )}

            {/* Application shell */}
            <div
                className="
          mx-auto flex min-h-dvh w-full max-w-[1800px]
          bg-white
          md:h-full md:min-h-0
          md:overflow-hidden md:rounded-[26px]
          md:shadow-[0_15px_50px_rgba(40,55,90,0.06)]
        "
            >

                {/* Sidebar */}
                <aside
                    className={`
            fixed inset-y-0 left-0 z-50
            flex flex-col
            border-r border-[#E9EDF3]
            bg-[#FAFBFD]
            transition-[width,transform] duration-300
            w-62.5
            md:relative md:inset-auto md:z-20
            md:h-full md:shrink-0
            ${sidebarOpen ? 'md:w-60' : 'md:w-18'}
            ${mobileOpen
                            ? 'translate-x-0'
                            : '-translate-x-full md:translate-x-0'
                        }
          `}
                >
                    {/* Logo */}
                    <div className="flex h-18 shrink-0 items-center justify-between px-4">
                        <NavLink
                            to="/dashboard"
                            onClick={closeMobileSidebar}
                            className="flex min-w-0 items-center gap-3"
                        >
                            <div
                                className="
                  flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-[13px] bg-[#202027] text-white
                "
                            >
                                <GraduationCap size={22} strokeWidth={2.2} />
                            </div>

                            <div className={!sidebarOpen ? 'md:hidden' : ''}>
                                <h1 className="font-['Space_Grotesk',sans-serif] text-[21px] font-bold tracking-[-0.06em]">
                                    Stud<span className="text-[#688DE8]">ORA</span>
                                </h1>
                                <p className="text-[10px] text-[#9DA2AF]">
                                    Student workspace
                                </p>
                            </div>
                        </NavLink>

                        <button
                            type="button"
                            onClick={closeMobileSidebar}
                            aria-label="Close sidebar"
                            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[#E9EDF5] md:hidden"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    {/* Navigation - no scroll container */}
                    <nav
                        aria-label="Main navigation"
                        className="min-h-0 flex-1 overflow-hidden px-3 pt-4"
                    >
                        <p
                            className={`
                mb-3 px-3 text-[10px] font-bold
                uppercase tracking-[0.16em] text-[#A3A7B2]
                ${!sidebarOpen ? 'md:text-center md:px-0' : ''}
              `}
                        >
                            <span className={!sidebarOpen ? 'md:hidden' : ''}>
                                Menu
                            </span>
                            <span className={sidebarOpen ? 'hidden' : 'hidden md:inline'}>
                                ···
                            </span>
                        </p>

                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/dashboard'}
                                        onClick={closeMobileSidebar}
                                        title={!sidebarOpen ? item.label : undefined}
                                        className={({ isActive }) => navClass(isActive)}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Icon
                                                    size={18}
                                                    strokeWidth={isActive ? 2.3 : 1.9}
                                                    className="shrink-0"
                                                />

                                                <span className={!sidebarOpen ? 'md:hidden' : ''}>
                                                    {item.label}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                )
                            })}
                        </div>
                    </nav>

                    {/* Footer - anchored at bottom */}
                    <div className="mt-auto shrink-0 border-t border-[#E9EDF3] px-3 pb-4 pt-3">

                        <NavLink
                            to="/settings"
                            onClick={closeMobileSidebar}
                            title={!sidebarOpen ? 'Settings' : undefined}
                            className={({ isActive }) => navClass(isActive)}
                        >
                            <Settings size={18} />

                            <span className={!sidebarOpen ? 'md:hidden' : ''}>
                                Settings
                            </span>
                        </NavLink>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title={!sidebarOpen ? 'Logout' : undefined}
                            className={`
                mt-1 flex min-h-10 w-full items-center gap-3
                rounded-full px-3.5 py-2
                text-left text-[13px] font-medium text-[#757A87]
                transition-colors hover:bg-[#FBE9ED]
                hover:text-[#C45471]
                ${!sidebarOpen ? 'md:justify-center md:px-2' : ''}
              `}
                        >
                            <LogOut size={18} />

                            <span className={!sidebarOpen ? 'md:hidden' : ''}>
                                Logout
                            </span>
                        </button>

                        {/* User profile */}
                        <div
                            className={`
                mt-3 flex items-center gap-3
                rounded-[14px] border border-[#E8EBF1]
                bg-white p-2
                ${!sidebarOpen ? 'md:justify-center' : ''}
              `}
                        >
                            <div
                                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-full bg-[#A5E7E5]
                  font-['Space_Grotesk',sans-serif]
                  text-sm font-bold text-[#206E70]
                "
                            >
                                {initial}
                            </div>

                            <div className={`min-w-0 flex-1 ${!sidebarOpen ? 'md:hidden' : ''}`}>
                                <p className="truncate text-xs font-semibold">
                                    {displayName}
                                </p>
                                <p className="truncate text-[10px] text-[#9DA2AF]">
                                    {user?.email || 'Student'}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main workspace */}
                <div className="flex min-w-0 flex-1 flex-col bg-[#FCFCFE] md:h-full md:overflow-hidden">

                    {/* Header */}
                    <header
                        className="
              sticky top-0 z-30 flex h-18 shrink-0
              items-center justify-between gap-3
              border-b border-[#EFF1F5]
              bg-white/95 px-4 backdrop-blur-xl
              sm:px-6 lg:px-7
            "
                    >
                        <div className="flex min-w-0 items-center gap-3">

                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open navigation"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F4F8] md:hidden"
                            >
                                <Menu size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setSidebarOpen((prev) => !prev)}
                                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                                aria-expanded={sidebarOpen}
                                className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#F2F4F8] text-[#676D7D] hover:bg-[#E7EDFC] md:flex"
                            >
                                {sidebarOpen ? (
                                    <PanelLeftClose size={19} />
                                ) : (
                                    <PanelLeft size={19} />
                                )}
                            </button>

                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-[#A4A7B2]">
                                    StudORA
                                </p>

                                <h2 className="truncate font-['Space_Grotesk',sans-serif] text-[15px] font-semibold">
                                    My Learning Dashboard
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A5E7E5] text-xs font-bold text-[#206E70]">
                                {initial}
                            </div>

                            <span className="hidden max-w-32 truncate text-xs font-semibold xl:block">
                                {displayName}
                            </span>
                        </div>
                    </header>

                    {/* Only main content scrolls on desktop */}
                    <main
                        id="main-content"
                        className="
              min-w-0 flex-1 bg-[#FCFCFE]
              px-4 py-5 sm:px-6 lg:px-7
              md:min-h-0 md:overflow-y-auto
            "
                    >
                        <div className="mx-auto w-full max-w-375">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default DashboardLayout

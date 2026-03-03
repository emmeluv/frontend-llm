import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    label: 'Chat',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    to: '/ingest',
    label: 'Ingest',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-9l-3 3h2v4h2v-4h2l-3-3z" />
      </svg>
    ),
  },
]

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#212121] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="flex flex-col w-16 bg-[#171717] border-r border-white/10 shrink-0 py-4 items-center gap-2">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z" />
          </svg>
        </div>

        {/* Nav items */}
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
              }`
            }
          >
            {icon}
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 text-xs bg-[#2f2f2f] text-gray-200 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-white/10">
              {label}
            </span>
          </NavLink>
        ))}
      </aside>

      {/* Page content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

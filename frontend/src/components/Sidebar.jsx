import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  Bell,
  BriefcaseBusiness,
  ShieldCheck,
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { label: 'Leave Management', path: '/leaves', icon: CalendarDays },
  { label: 'Leave Approvals', path: '/leave-approvals', icon: ClipboardCheck },
  { label: 'Payroll', path: '/payroll', icon: Wallet },
  { label: 'Payroll Management', path: '/payroll-management', icon: Wallet },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'User Management', path: '/users', icon: ShieldCheck },
]

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-6">
        <div className="rounded-xl bg-blue-600 p-2">
          <BriefcaseBusiness size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">WorkSphere</h1>
          <p className="text-xs text-slate-400">HR Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4 text-xs text-slate-400">
        WorkSphere HRMS · v1.0
      </div>
    </aside>
  )
}

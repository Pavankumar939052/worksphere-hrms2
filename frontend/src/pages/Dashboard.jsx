import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const stats = [
  { key: 'total_employees', label: 'Total Employees', color: 'bg-blue-500' },
  { key: 'active_employees', label: 'Active Employees', color: 'bg-emerald-500' },
  { key: 'present_today', label: 'Present Today', color: 'bg-violet-500' },
  { key: 'pending_leaves', label: 'Pending Leaves', color: 'bg-amber-500' },
  { key: 'total_payroll_records', label: 'Payroll Records', color: 'bg-pink-500' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((response) => setSummary(response.data))
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          navigate('/login')
        } else if (error.response?.status === 403) {
          toast.error('Dashboard statistics require an HR or Admin account.')
        } else {
          toast.error('Unable to load dashboard. Check that the backend is running.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function signOut() {
    localStorage.removeItem('access_token')
    navigate('/login')
    toast.success('Signed out successfully')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back to WorkSphere HRMS
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">
          <h3 className="text-xl font-semibold text-slate-900">Overview</h3>
          <p className="mt-2 text-slate-600">
            Monitor your organization's HR activity at a glance.
          </p>

          {loading ? (
            <p className="mt-8 text-slate-600">Loading dashboard...</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((item) => (
                <section
                  key={item.key}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className={`mb-5 h-1.5 w-14 rounded-full ${item.color}`} />
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {summary ? (summary[item.key] ?? 0) : '—'}
                  </p>
                </section>
              ))}
            </div>
          )}

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Welcome to WorkSphere
            </h3>
            <p className="mt-2 text-slate-600">
              Manage employee records, attendance, leave requests, payroll, and
              notifications from one HR management platform.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

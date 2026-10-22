import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Clock, LogIn, LogOut, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isManager = role === 'ADMIN' || role === 'HR'

  const loadAttendance = useCallback(async () => {
    setLoading(true)

    try {
      const userResponse = await api.get('/users/me')
      const currentRole = userResponse.data.role
      setRole(currentRole)

      const endpoint =
        currentRole === 'ADMIN' || currentRole === 'HR'
          ? '/attendance/'
          : '/attendance/my-history'

      const response = await api.get(endpoint)
      const data = response.data

      setRecords(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.records)
              ? data.records
              : []
      )
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please sign in again.')
      } else {
        toast.error(
          error.response?.data?.detail || 'Unable to load attendance records.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  async function recordAttendance(action) {
    setSaving(true)

    try {
      await api.post(`/attendance/${action}`)
      toast.success(
        action === 'check-in'
          ? 'Checked in successfully!'
          : 'Checked out successfully!'
      )
      await loadAttendance()
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Unable to record attendance.'
      )
    } finally {
      setSaving(false)
    }
  }

  function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Attendance Management
            </h1>
            <p className="mt-2 text-slate-600">
              {isManager
                ? 'Review attendance records across your organization.'
                : 'Record your working hours and review your attendance history.'}
            </p>
          </div>

          <button
            onClick={loadAttendance}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {!isManager && role === 'EMPLOYEE' && (
          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                  <LogIn size={23} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Check In</h2>
                  <p className="text-sm text-slate-500">Start your workday</p>
                </div>
              </div>
              <button
                onClick={() => recordAttendance('check-in')}
                disabled={saving}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Please wait...' : 'Check In'}
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
                  <LogOut size={23} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Check Out</h2>
                  <p className="text-sm text-slate-500">Finish your workday</p>
                </div>
              </div>
              <button
                onClick={() => recordAttendance('check-out')}
                disabled={saving}
                className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {saving ? 'Please wait...' : 'Check Out'}
              </button>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center gap-2">
            <Clock size={21} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {isManager ? 'All Attendance Records' : 'My Attendance History'}
            </h2>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading attendance...
            </p>
          ) : records.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              No attendance records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {isManager && (
                      <th className="px-4 py-3">Employee ID</th>
                    )}
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      {isManager && (
                        <td className="px-4 py-3">
                          {record.employee_id ?? '—'}
                        </td>
                      )}
                      <td className="px-4 py-3">{record.date || '—'}</td>
                      <td className="px-4 py-3">
                        {formatDate(record.check_in)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(record.check_out)}
                      </td>
                      <td className="px-4 py-3">
                        {record.working_hours ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {record.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.is_late ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3">
                        {record.overtime_hours ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

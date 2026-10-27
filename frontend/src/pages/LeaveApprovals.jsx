import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { CheckCircle, XCircle, RefreshCw, ClipboardCheck } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [calendarStart, setCalendarStart] = useState('')
  const [calendarEnd, setCalendarEnd] = useState('')
  const [department, setDepartment] = useState('')
  const [availability, setAvailability] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(false)

  async function loadLeaves() {
    setLoading(true)
    try {
      const response = await api.get('/leaves/')
      setLeaves(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load leave requests.')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailability() {
    if (!calendarStart || !calendarEnd) {
      toast.error('Please select both calendar dates.')
      return
    }

    if (calendarEnd < calendarStart) {
      toast.error('End date cannot be earlier than start date.')
      return
    }

    setCalendarLoading(true)
    try {
      const response = await api.get('/leaves/team-availability', {
        params: {
          start_date: calendarStart,
          end_date: calendarEnd,
          ...(department.trim() ? { department: department.trim() } : {}),
        },
      })
      setAvailability(Array.isArray(response.data) ? response.data : [])
      toast.success('Team availability loaded.')
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Unable to load team availability.',
      )
    } finally {
      setCalendarLoading(false)
    }
  }
  useEffect(() => {
    loadLeaves()
  }, [])

  async function reviewLeave(leaveId, status) {
    setReviewingId(leaveId)
    try {
      await api.patch(`/leaves/${leaveId}/review`, { status })
      toast.success(`Leave request ${status.toLowerCase()} successfully.`)
      await loadLeaves()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to review leave request.')
    } finally {
      setReviewingId(null)
    }
  }

  const filteredLeaves = filter === 'ALL'
    ? leaves
    : leaves.filter((leave) => leave.status === filter)

  const pendingCount = leaves.filter((leave) => leave.status === 'PENDING').length

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Leave Approvals</h1>
            <p className="mt-2 text-slate-600">Review employee leave requests as HR or Admin.</p>
          </div>
          <button
            onClick={loadLeaves}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Team Leave Calendar
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            View approved leaves by date range and optionally filter by department.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Start date</label>
              <input
                type="date"
                value={calendarStart}
                onChange={(event) => setCalendarStart(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">End date</label>
              <input
                type="date"
                min={calendarStart || undefined}
                value={calendarEnd}
                onChange={(event) => setCalendarEnd(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Department (optional)</label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Engineering"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadAvailability}
                disabled={calendarLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {calendarLoading ? 'Loading...' : 'View Availability'}
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            {availability.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                Select a date range and view availability to see approved team leaves.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Leave Type</th>
                    <th className="px-4 py-3 font-medium">Start Date</th>
                    <th className="px-4 py-3 font-medium">End Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availability.map((item) => (
                    <tr key={item.leave_id}>
                      <td className="px-4 py-3">{item.employee_name}</td>
                      <td className="px-4 py-3">{item.department}</td>
                      <td className="px-4 py-3">{item.leave_type}</td>
                      <td className="px-4 py-3">{item.start_date}</td>
                      <td className="px-4 py-3">{item.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Employee Requests</h2>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">All requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading leave requests...</p>
          ) : filteredLeaves.length === 0 ? (
            <p className="p-6 text-slate-500">No leave requests found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-medium">Employee ID</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Start Date</th>
                    <th className="px-5 py-3 font-medium">End Date</th>
                    <th className="px-5 py-3 font-medium">Reason</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-5 py-4">{leave.employee_id}</td>
                      <td className="px-5 py-4">{leave.leave_type}</td>
                      <td className="px-5 py-4">{leave.start_date}</td>
                      <td className="px-5 py-4">{leave.end_date}</td>
                      <td className="max-w-xs px-5 py-4">{leave.reason}</td>
                      <td className="px-5 py-4">
                        <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (
                          leave.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : leave.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        )}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {leave.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => reviewLeave(leave.id, 'APPROVED')}
                              disabled={reviewingId === leave.id}
                              title="Approve request"
                              className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle size={17} />
                            </button>
                            <button
                              onClick={() => reviewLeave(leave.id, 'REJECTED')}
                              disabled={reviewingId === leave.id}
                              title="Reject request"
                              className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle size={17} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Reviewed</span>
                        )}
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

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { CalendarDays, RefreshCw, Send } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const leaveTypes = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'PAID', label: 'Paid Leave' },
]

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export default function Leaves() {
  const [leaves, setLeaves] = useState([])
  const [balances, setBalances] = useState([])
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    leave_type: 'CASUAL',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        api.get('/leaves/my-requests'),
        api.get('/leave-policies/balances/me'),
        api.get('/leave-policies/'),
      ])

      setLeaves(Array.isArray(results[0].data) ? results[0].data : [])
      setBalances(Array.isArray(results[1].data) ? results[1].data : [])
      setPolicies(Array.isArray(results[2].data) ? results[2].data : [])
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Unable to load leave information.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function submitLeave(event) {
    event.preventDefault()

    if (!form.start_date || !form.end_date) {
      toast.error('Please select both leave dates.')
      return
    }

    if (form.end_date < form.start_date) {
      toast.error('End date cannot be before start date.')
      return
    }

    if (form.reason.trim().length < 5) {
      toast.error('Reason must contain at least 5 characters.')
      return
    }

    setSaving(true)
    try {
      await api.post('/leaves/', {
        ...form,
        reason: form.reason.trim(),
      })
      toast.success('Leave request submitted successfully!')
      setForm({
        leave_type: 'CASUAL',
        start_date: '',
        end_date: '',
        reason: '',
      })
      await loadData()
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Unable to submit leave request.',
      )
    } finally {
      setSaving(false)
    }
  }

  function statusClass(status) {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Leave Management
            </h1>
            <p className="mt-2 text-slate-600">
              Check your leave balances, apply for leave, and track requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            My Leave Balances
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {leaveTypes.map((type) => {
              const balance = balances.find(
                (item) => item.leave_type === type.value,
              )
              const policy = policies.find(
                (item) => item.leave_type === type.value,
              )
              const remaining = balance?.remaining_days ?? null
              const allowed = policy?.total_days_allowed ?? null

              return (
                <article
                  key={type.value}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-500">
                    {type.label}
                  </p>

                  {loading ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Loading balance...
                    </p>
                  ) : remaining === null ? (
                    <p className="mt-3 text-sm text-amber-700">
                      Balance not initialized
                    </p>
                  ) : (
                    <>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">
                          {remaining}
                        </span>
                        <span className="text-sm text-slate-500">
                          days remaining
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Annual allowance: {allowed ?? '—'} days
                      </p>
                      {allowed !== null && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                100,
                                allowed > 0 ? (remaining / allowed) * 100 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <CalendarDays size={21} />
            Apply for Leave
          </h2>

          <form
            onSubmit={submitLeave}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-medium text-slate-700">
                Leave Type
              </label>
              <select
                className={inputClass}
                value={form.leave_type}
                onChange={(e) =>
                  setForm({ ...form, leave_type: e.target.value })
                }
              >
                {leaveTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {balances.find((b) => b.leave_type === form.leave_type)
                  ?.remaining_days ?? '—'}{' '}
                days currently available
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                className={inputClass}
                type="date"
                required
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                className={inputClass}
                type="date"
                required
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Reason
              </label>
              <textarea
                className={inputClass}
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="Enter the reason for your leave"
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={17} />
                {saving ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              My Leave Requests
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading leave requests...</p>
          ) : leaves.length === 0 ? (
            <p className="p-6 text-slate-500">No leave requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Start Date</th>
                    <th className="px-6 py-3 font-medium">End Date</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4">{leave.leave_type}</td>
                      <td className="px-6 py-4">{leave.start_date}</td>
                      <td className="px-6 py-4">{leave.end_date}</td>
                      <td className="px-6 py-4">{leave.reason}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
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

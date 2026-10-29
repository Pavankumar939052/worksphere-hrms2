import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Send,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

function getRole() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return ''
    return JSON.parse(atob(token.split('.')[1])).role || ''
  } catch {
    return ''
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

export default function Resignations() {
  const role = getRole()
  const isManager = role === 'ADMIN' || role === 'HR'

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')
  const [noticePeriod, setNoticePeriod] = useState('30')
  const [statusFilter, setStatusFilter] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      if (isManager) {
        const params = { skip: 0, limit: 100 }
        if (statusFilter) params.status = statusFilter
        const response = await api.get('/resignations/', { params })
        setRequests(response.data)
      } else {
        const response = await api.get('/resignations/my-requests')
        setRequests(response.data)
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not load resignation requests.')
    } finally {
      setLoading(false)
    }
  }, [isManager, statusFilter])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function submitResignation(event) {
    event.preventDefault()
    if (reason.trim().length < 5) {
      toast.error('Please enter a reason with at least 5 non-space characters.')
      return
    }

    setSaving(true)
    try {
      await api.post('/resignations/', {
        reason: reason.trim(),
        notice_period: Number(noticePeriod),
      })
      toast.success('Resignation request submitted.')
      setReason('')
      setNoticePeriod('30')
      await loadRequests()
    } catch (error) {
      const detail = error.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Could not submit the resignation request.')
    } finally {
      setSaving(false)
    }
  }

  async function reviewRequest(requestId, status) {
    const action = status === 'APPROVED' ? 'approve' : 'reject'
    if (!window.confirm(`Are you sure you want to ${action} resignation request #${requestId}?`)) return

    try {
      await api.patch(`/resignations/${requestId}/review`, { status })
      toast.success(`Resignation request ${action}d.`)
      await loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not review the resignation request.')
    }
  }

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length
  const rejectedCount = requests.filter((request) => request.status === 'REJECTED').length

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-600">
                Employee Experience
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Resignation &amp; Exit Management</h1>
              <p className="mt-2 text-slate-500">
                {isManager
                  ? 'Review resignation requests and record decisions.'
                  : 'Submit a resignation request and track its review status.'}
              </p>
            </div>
            <button
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Clock className="text-amber-600" size={22} />
                <span className="text-sm font-medium text-slate-500">Pending</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={22} />
                <span className="text-sm font-medium text-slate-500">Approved</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{approvedCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={22} />
                <span className="text-sm font-medium text-slate-500">Rejected</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{rejectedCount}</p>
            </div>
          </div>

          {!isManager && (
            <form onSubmit={submitResignation} className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">Submit a Resignation Request</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your request will remain pending until HR or Admin reviews it.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Reason for resignation *
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    minLength={5}
                    maxLength={5000}
                    rows={4}
                    required
                    placeholder="Please provide your reason..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="noticePeriod" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notice period (days) *
                  </label>
                  <input
                    id="noticePeriod"
                    type="number"
                    min="0"
                    max="365"
                    value={noticePeriod}
                    onChange={(event) => setNoticePeriod(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">Enter a value between 0 and 365 days.</p>
                </div>
                <div className="flex justify-end md:col-span-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {saving ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {isManager && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <label htmlFor="statusFilter" className="text-sm font-semibold text-slate-700">
                Filter by status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <span className="text-xs text-slate-500">{requests.length} request(s)</span>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading resignation requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <LogOut size={26} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">No resignation requests found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isManager
                  ? 'Employee requests will appear here when submitted.'
                  : 'Your submitted resignation requests will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {requests.map((request) => (
                <article key={request.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Request #{request.id}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {isManager ? `Employee #${request.employee_id}` : 'Your Resignation Request'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(request.created_at)}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="space-y-4 px-6 py-5">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.reason}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Notice period</p>
                      <p className="text-sm font-semibold text-slate-700">{request.notice_period} days</p>
                    </div>
                  </div>
                  {isManager && request.status === 'PENDING' && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                      <button
                        onClick={() => reviewRequest(request.id, 'REJECTED')}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <XCircle size={15} />
                        Reject
                      </button>
                      <button
                        onClick={() => reviewRequest(request.id, 'APPROVED')}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={15} />
                        Approve
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

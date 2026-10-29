import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { MessageSquare, Send, RefreshCw, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

function getUserRole() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role || ''
  } catch {
    return ''
  }
}

export default function Feedback() {
  const role = getUserRole()
  const canReview = ['HR', 'ADMIN'].includes(role)

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  async function loadFeedback() {
    setLoading(true)
    try {
      const response = await api.get(canReview ? '/feedback/' : '/feedback/my')
      setFeedback(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load feedback.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedback()
  }, [])

  async function submitFeedback(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/feedback/', { subject: subject.trim(), message: message.trim() })
      toast.success('Feedback submitted successfully.')
      setSubject('')
      setMessage('')
      await loadFeedback()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(item) {
    const nextStatus = item.status === 'REVIEWED' ? 'SUBMITTED' : 'REVIEWED'
    setUpdatingId(item.id)
    try {
      const response = await api.patch(`/feedback/${item.id}/status`, { status: nextStatus })
      setFeedback((current) =>
        current.map((entry) => entry.id === item.id ? response.data : entry)
      )
      toast.success(`Feedback marked ${nextStatus.toLowerCase()}.`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to update feedback status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Feedback</h1>
            <p className="mt-2 text-slate-600">
              {canReview ? 'Review and manage employee feedback.' : 'Share suggestions and view your submitted feedback.'}
            </p>
          </div>
          <button
            onClick={loadFeedback}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {!canReview && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Submit Feedback</h2>
                <p className="text-sm text-slate-500">Your feedback will be sent to the HR team.</p>
              </div>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label htmlFor="feedback-subject" className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                <input
                  id="feedback-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  minLength={2}
                  maxLength={200}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter a feedback subject"
                />
              </div>
              <div>
                <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  minLength={5}
                  maxLength={5000}
                  required
                  rows={5}
                  className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Write your feedback or suggestion..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              {canReview ? 'All Employee Feedback' : 'Your Submissions'}
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading feedback...</p>
          ) : feedback.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquare size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No feedback found</p>
              <p className="mt-1 text-sm text-slate-500">Submitted feedback will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <article key={item.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{item.subject}</h3>
                    {canReview && (
                      <p className="mt-1 text-xs text-slate-500">Employee ID: {item.employee_id}</p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Date unavailable'}
                    </p>
                    <span className={'mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ' + (item.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                      {item.status === 'REVIEWED' ? 'Reviewed' : 'Submitted'}
                    </span>
                  </div>
                  {canReview && (
                    <button
                      onClick={() => updateStatus(item)}
                      disabled={updatingId === item.id}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      {updatingId === item.id ? 'Updating...' : item.status === 'REVIEWED' ? 'Mark submitted' : 'Mark reviewed'}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import {
  Star,
  Plus,
  RefreshCw,
  Send,
  Pencil,
  X,
  CalendarDays,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const emptyForm = {
  employee_id: '',
  review_period_start: '',
  review_period_end: '',
  rating: '3',
  strengths: '',
  areas_for_improvement: '',
  comments: '',
}

function getRole() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || ''
  } catch {
    return ''
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString()
}

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={17}
          className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-700">{value}/5</span>
    </div>
  )
}

export default function PerformanceReviews() {
  const role = getRole()
  const isManager = role === 'ADMIN' || role === 'HR'

  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filterEmployee, setFilterEmployee] = useState('')

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = { skip: 0, limit: 100 }
      if (isManager && filterEmployee) params.employee_id = Number(filterEmployee)
      const response = await api.get('/performance-reviews/', { params })
      setReviews(response.data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not load performance reviews.')
    } finally {
      setLoading(false)
    }
  }, [isManager, filterEmployee])

  const loadEmployees = useCallback(async () => {
    if (!isManager) return
    try {
      const response = await api.get('/employees/', { params: { skip: 0, limit: 100 } })
      setEmployees(Array.isArray(response.data) ? response.data : response.data?.items || [])
    } catch {
      setEmployees([])
      toast.error('Could not load employees. You can still refresh reviews.')
    }
  }, [isManager])

  useEffect(() => {
    loadReviews()
    loadEmployees()
  }, [loadReviews, loadEmployees])

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(review) {
    setEditingId(review.id)
    setForm({
      employee_id: String(review.employee_id),
      review_period_start: review.review_period_start,
      review_period_end: review.review_period_end,
      rating: String(review.rating),
      strengths: review.strengths,
      areas_for_improvement: review.areas_for_improvement,
      comments: review.comments || '',
    })
    setShowForm(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function submitReview(event) {
    event.preventDefault()
    if (form.review_period_end < form.review_period_start) {
      toast.error('The review end date must be on or after the start date.')
      return
    }

    setSaving(true)
    const payload = {
      review_period_start: form.review_period_start,
      review_period_end: form.review_period_end,
      rating: Number(form.rating),
      strengths: form.strengths.trim(),
      areas_for_improvement: form.areas_for_improvement.trim(),
      comments: form.comments.trim(),
    }

    try {
      if (editingId) {
        await api.put(`/performance-reviews/${editingId}`, payload)
        toast.success('Draft review updated.')
      } else {
        await api.post('/performance-reviews/', {
          ...payload,
          employee_id: Number(form.employee_id),
        })
        toast.success('Performance review created as a draft.')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadReviews()
    } catch (error) {
      const detail = error.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Could not save the review.')
    } finally {
      setSaving(false)
    }
  }

  async function publishReview(reviewId) {
    if (!window.confirm('Publish this review so the employee can view it?')) return
    try {
      await api.patch(`/performance-reviews/${reviewId}/publish`)
      toast.success('Review published.')
      await loadReviews()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not publish the review.')
    }
  }

  async function deleteDraft(reviewId) {
    if (!window.confirm('Delete this draft review permanently?')) return
    try {
      await api.delete(`/performance-reviews/${reviewId}`)
      toast.success('Draft deleted.')
      await loadReviews()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete the draft.')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-blue-600">
                People & Development
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Performance Reviews</h1>
              <p className="mt-2 text-slate-500">
                {isManager
                  ? 'Create, review, and publish employee performance assessments.'
                  : 'View your published performance feedback and review history.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadReviews}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              {isManager && (
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  New Review
                </button>
              )}
            </div>
          </div>

          {isManager && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <label htmlFor="employeeFilter" className="text-sm font-medium text-slate-700">
                Filter by employee
              </label>
              <select
                id="employeeFilter"
                value={filterEmployee}
                onChange={(event) => setFilterEmployee(event.target.value)}
                className="min-w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name || employee.name || `Employee #${employee.id}`} (ID {employee.id})
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">{reviews.length} review(s)</span>
            </div>
          )}

          {showForm && isManager && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? `Edit Draft #${editingId}` : 'Create Performance Review'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Reviews are saved as drafts until you publish them.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitReview} className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                {!editingId && (
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="employee_id">
                      Employee *
                    </label>
                    <select
                      id="employee_id"
                      name="employee_id"
                      value={form.employee_id}
                      onChange={updateField}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                    >
                      <option value="">Select an employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name || employee.name || `Employee #${employee.id}`} (ID {employee.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="review_period_start">
                    Review period start *
                  </label>
                  <input
                    id="review_period_start"
                    name="review_period_start"
                    type="date"
                    value={form.review_period_start}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="review_period_end">
                    Review period end *
                  </label>
                  <input
                    id="review_period_end"
                    name="review_period_end"
                    type="date"
                    value={form.review_period_end}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="rating">
                    Performance rating *
                  </label>
                  <select
                    id="rating"
                    name="rating"
                    value={form.rating}
                    onChange={updateField}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="1">1 — Needs significant improvement</option>
                    <option value="2">2 — Developing</option>
                    <option value="3">3 — Meets expectations</option>
                    <option value="4">4 — Exceeds expectations</option>
                    <option value="5">5 — Outstanding</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="strengths">
                    Strengths *
                  </label>
                  <textarea
                    id="strengths"
                    name="strengths"
                    value={form.strengths}
                    onChange={updateField}
                    minLength={2}
                    maxLength={5000}
                    required
                    rows={3}
                    placeholder="Describe achievements, strengths, and positive contributions..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="areas_for_improvement">
                    Areas for improvement *
                  </label>
                  <textarea
                    id="areas_for_improvement"
                    name="areas_for_improvement"
                    value={form.areas_for_improvement}
                    onChange={updateField}
                    minLength={2}
                    maxLength={5000}
                    required
                    rows={3}
                    placeholder="Describe skills or areas to develop..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="comments">
                    Additional comments
                  </label>
                  <textarea
                    id="comments"
                    name="comments"
                    value={form.comments}
                    onChange={updateField}
                    maxLength={5000}
                    rows={2}
                    placeholder="Optional comments or follow-up actions..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Draft'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading performance reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Star size={26} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">No performance reviews found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isManager
                  ? 'Create a review to get started.'
                  : 'Published reviews will appear here when they are available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {reviews.map((review) => (
                <article key={review.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Review #{review.id}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {isManager
                          ? employees.find((employee) => employee.id === review.employee_id)?.full_name ||
                            employees.find((employee) => employee.id === review.employee_id)?.name ||
                            `Employee #${review.employee_id}`
                          : 'Your Performance Review'}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={15} />
                        {formatDate(review.review_period_start)} – {formatDate(review.review_period_end)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        review.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Performance rating
                      </p>
                      <Rating value={review.rating} />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-slate-800">Strengths</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.strengths}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-slate-800">Areas for improvement</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.areas_for_improvement}</p>
                    </div>
                    {review.comments && (
                      <div>
                        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <MessageSquare size={15} />
                          Additional comments
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.comments}</p>
                      </div>
                    )}
                  </div>

                  {isManager && review.status === 'DRAFT' && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                      <button
                        onClick={() => openEditForm(review)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDraft(review.id)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => publishReview(review.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <Send size={15} />
                        Publish
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

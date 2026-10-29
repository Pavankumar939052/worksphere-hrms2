import { useCallback, useEffect, useState } from 'react'
import {
  BellRing,
  Plus,
  RefreshCw,
  Pencil,
  Archive,
  X,
  CalendarClock,
  Megaphone,
} from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

function getUserRole() {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1]))
    return String(payload.role || '').toUpperCase()
  } catch {
    return ''
  }
}

function formatDate(value) {
  if (!value) return 'No expiration date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString()
}

const emptyForm = { title: '', message: '', expires_at: '' }

export default function Announcements() {
  const role = getUserRole()
  const isManager = role === 'HR' || role === 'ADMIN'

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showInactive, setShowInactive] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/announcements/', {
        params: isManager && showInactive ? { include_inactive: true } : {},
      })
      setAnnouncements(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load announcements')
    } finally {
      setLoading(false)
    }
  }, [isManager, showInactive])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      message: item.message,
      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '',
    })
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Enter both a title and a message')
      return
    }

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    }

    setSaving(true)
    try {
      if (editingId !== null) {
        await api.patch(`/announcements/${editingId}`, payload)
        toast.success('Announcement updated successfully')
      } else {
        await api.post('/announcements/', payload)
        toast.success('Announcement published successfully')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadAnnouncements()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to save announcement')
    } finally {
      setSaving(false)
    }
  }

  async function deactivateAnnouncement(item) {
    const confirmed = window.confirm(
      `Deactivate "${item.title}"? Employees will no longer see it.`
    )
    if (!confirmed) return

    try {
      await api.delete(`/announcements/${item.id}`)
      toast.success('Announcement deactivated')
      await loadAnnouncements()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to deactivate announcement')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <BellRing size={22} />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Employee Experience
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Internal Announcements
              </h1>
              <p className="mt-2 text-slate-600">
                Company updates, important notices, and team communications.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadAnnouncements}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {isManager && (
                <button
                  onClick={startCreate}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  New Announcement
                </button>
              )}
            </div>
          </header>

          {isManager && (
            <label className="mb-5 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="h-4 w-4 rounded"
              />
              Include inactive announcements
            </label>
          )}

          {showForm && isManager && (
            <section className="mb-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingId !== null ? 'Edit Announcement' : 'Publish Announcement'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close announcement form"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="announcement-title" className="mb-1 block text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    id="announcement-title"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    maxLength={200}
                    required
                    placeholder="Enter announcement title"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="announcement-message" className="mb-1 block text-sm font-medium text-slate-700">
                    Message
                  </label>
                  <textarea
                    id="announcement-message"
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    maxLength={10000}
                    required
                    rows={5}
                    placeholder="Write the announcement details..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="announcement-expiry" className="mb-1 block text-sm font-medium text-slate-700">
                    Expiration date (optional)
                  </label>
                  <input
                    id="announcement-expiry"
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(event) => setForm({ ...form, expires_at: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Publish Announcement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {isManager && showInactive ? 'All Announcements' : 'Latest Announcements'}
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
            </span>
          </section>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Megaphone size={42} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800">No announcements yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                {isManager
                  ? 'Publish an announcement to share an update with employees.'
                  : 'Company announcements will appear here when they are published.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
                    item.is_active ? 'border-slate-200' : 'border-amber-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Announcement
                        </span>
                        {!item.is_active && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="break-words text-xl font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-700">
                        {item.message}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock size={15} />
                          Published: {formatDate(item.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock size={15} />
                          Expires: {formatDate(item.expires_at)}
                        </span>
                      </div>
                    </div>

                    {isManager && (
                      <div className="flex shrink-0 gap-2 sm:flex-col">
                        <button
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        {item.is_active && (
                          <button
                            onClick={() => deactivateAnnouncement(item)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
                          >
                            <Archive size={15} />
                            Deactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

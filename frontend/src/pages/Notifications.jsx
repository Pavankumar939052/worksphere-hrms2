import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  async function loadNotifications() {
    try {
      const response = await api.get('/notifications/my')
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function markAsRead(notification) {
    if (notification.is_read) return

    setUpdatingId(notification.id)
    try {
      await api.patch(`/notifications/${notification.id}/read`)
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )
      toast.success('Notification marked as read.')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to update notification.')
    } finally {
      setUpdatingId(null)
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-slate-600">Stay updated with messages from your HR team.</p>
          </div>
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <Bell size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unread Notifications</p>
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Your Messages</h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">You're all caught up!</p>
              <p className="mt-1 text-sm text-slate-500">You don't have any notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={'flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between ' + (!notification.is_read ? 'bg-indigo-50/50' : '')}
                >
                  <div className="flex gap-3">
                    <div className={'mt-1 rounded-full p-2 ' + (!notification.is_read ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500')}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Date unavailable'}
                      </p>
                      <span className={'mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ' + (notification.is_read ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700')}>
                        {notification.is_read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification)}
                      disabled={updatingId === notification.id}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <CheckCheck size={16} />
                      {updatingId === notification.id ? 'Updating...' : 'Mark as read'}
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

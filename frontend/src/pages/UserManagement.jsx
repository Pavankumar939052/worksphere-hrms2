import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { UserPlus, RefreshCw, ShieldCheck, Pencil, Trash2, X, Save } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const emptyForm = {
  username: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  is_active: true,
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/users/')
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      const status = error.response?.status
      toast.error(
        status === 403
          ? 'Administrator permission is required to manage users.'
          : error.response?.data?.detail || 'Unable to load users.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function startEdit(user) {
    setEditingId(user.id)
    setForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'EMPLOYEE',
      is_active: Boolean(user.is_active),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)

    try {
      if (editingId !== null) {
        const payload = {
          username: form.username,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
        }
        await api.patch(`/users/${editingId}`, payload)
        toast.success('User updated successfully.')
      } else {
        if (form.password.length < 8) {
          toast.error('Password must contain at least 8 characters.')
          setSaving(false)
          return
        }
        await api.post('/users/', {
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        })
        toast.success('User created successfully.')
      }

      resetForm()
      await loadUsers()
    } catch (error) {
      const status = error.response?.status
      toast.error(
        status === 403
          ? 'You do not have permission to perform this action.'
          : error.response?.data?.detail || 'Unable to save user.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user) {
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return

    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active })
      toast.success(`User ${action}d successfully.`)
      await loadUsers()
    } catch (error) {
      toast.error(
        error.response?.data?.detail || `Unable to ${action} user.`
      )
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Permanently delete ${user.username}? This action cannot be undone.`)) return

    try {
      await api.delete(`/users/${user.id}`)
      toast.success('User deleted successfully.')
      await loadUsers()
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          'Unable to delete user. Deactivation may be safer if records are linked.'
      )
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="mt-2 text-slate-600">
              Create accounts, assign roles, and manage account access.
            </p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              {editingId !== null ? <Pencil size={20} /> : <UserPlus size={20} />}
              {editingId !== null ? 'Edit User' : 'Create User'}
            </h2>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                <X size={16} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={submitForm} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input
                className={inputClass}
                required
                minLength={3}
                maxLength={50}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                className={inputClass}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            {editingId === null && (
              <div>
                <label className="text-sm font-medium text-slate-700">Temporary password</label>
                <input
                  className={inputClass}
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {editingId !== null && (
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Account active
              </label>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">All Users</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {users.length} accounts
            </span>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-slate-500">
              No users found, or the API did not return any users. Check that you are signed in as an administrator.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={17} className="text-slate-400" />
                          {user.username}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">ID: {user.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                          >
                            <span className="inline-flex items-center gap-1"><Pencil size={13} /> Edit</span>
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium ${user.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            <span className="inline-flex items-center gap-1"><Trash2 size={13} /> Delete</span>
                          </button>
                        </div>
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

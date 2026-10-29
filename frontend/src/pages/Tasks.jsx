import { useEffect, useState } from 'react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'
import { toast } from 'react-toastify'
import { ClipboardList, Plus, RefreshCw } from 'lucide-react'

const emptyForm = {
  title: '',
  description: '',
  employee_id: '',
  due_date: '',
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isManager, setIsManager] = useState(false)

  const getRole = () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return ''
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return payload.role || ''
    } catch {
      return ''
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const manager = ['HR', 'ADMIN'].includes(getRole())
      setIsManager(manager)

      if (manager) {
        const [taskResponse, employeeResponse] = await Promise.all([
          api.get('/tasks/'),
          api.get('/employees/'),
        ])
        setTasks(Array.isArray(taskResponse.data) ? taskResponse.data : [])
        setEmployees(Array.isArray(employeeResponse.data) ? employeeResponse.data : employeeResponse.data?.items || [])
      } else {
        const response = await api.get('/tasks/my-tasks')
        setTasks(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const assignTask = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.employee_id) {
      toast.error('Enter a task title and select an employee.')
      return
    }

    setSaving(true)
    try {
      await api.post('/tasks/', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        employee_id: Number(form.employee_id),
        due_date: form.due_date || null,
      })
      toast.success('Task assigned successfully.')
      setForm(emptyForm)
      await loadTasks()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not assign task.')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus })
      toast.success('Task status updated.')
      await loadTasks()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update task status.')
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      toast.success('Task deleted.')
      await loadTasks()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete task.')
    }
  }

  const statusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800'
    if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800'
    return 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <ClipboardList className="text-blue-600" />
              Task Assignment & Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Assign work, monitor progress, and keep track of due dates.
            </p>
          </div>
          <button
            type="button"
            onClick={loadTasks}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {isManager && (
          <form onSubmit={assignTask} className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Plus size={20} /> Assign a New Task
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Task title *
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  placeholder="e.g. Complete onboarding documents"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Assign to employee *
                <select
                  required
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name} (ID: {employee.id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Due date
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Description
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  placeholder="Task instructions or additional details"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving || employees.length === 0}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Assigning...' : 'Assign Task'}
            </button>
            {employees.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">
                No employees are available. Add an employee record before assigning tasks.
              </p>
            )}
          </form>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {isManager ? 'All Assigned Tasks' : 'My Tasks'}
          </h2>

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No tasks found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-semibold">Task</th>
                    {isManager && <th className="px-3 py-3 font-semibold">Employee ID</th>}
                    <th className="px-3 py-3 font-semibold">Due date</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-800">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 max-w-md whitespace-pre-wrap text-slate-500">
                            {task.description}
                          </p>
                        )}
                      </td>
                      {isManager && <td className="px-3 py-4">{task.employee_id}</td>}
                      <td className="px-3 py-4">{task.due_date || '—'}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <select
                            aria-label={`Status for ${task.title}`}
                            value={task.status}
                            onChange={(e) => updateStatus(task.id, e.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Delete task
                            </button>
                          )}
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

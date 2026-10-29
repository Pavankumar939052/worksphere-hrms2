import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { ClipboardList, Plus, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function Onboarding() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [isManager, setIsManager] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_id: '',
    task_name: '',
    due_date: '',
  })

  async function loadTasks() {
    setLoading(true)

    try {
      const response = await api.get('/onboarding/')
      setTasks(response.data)
      setIsManager(true)
    } catch (managerError) {
      try {
        const response = await api.get('/onboarding/my-tasks')
        setTasks(response.data)
        setIsManager(false)
      } catch (employeeError) {
        toast.error(
          employeeError.response?.data?.detail ||
          managerError.response?.data?.detail ||
          'Unable to load onboarding tasks.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadEmployees() {
    try {
      const response = await api.get('/employees/')
      setEmployees(response.data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load employees.')
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    if (isManager) loadEmployees()
  }, [isManager])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleCreate(event) {
    event.preventDefault()

    if (!form.employee_id || !form.task_name.trim() || !form.due_date) {
      toast.error('Please complete all task fields.')
      return
    }

    setSaving(true)

    try {
      await api.post('/onboarding/', {
        employee_id: Number(form.employee_id),
        task_name: form.task_name.trim(),
        due_date: form.due_date,
      })

      toast.success('Onboarding task assigned successfully.')
      setForm({ employee_id: '', task_name: '', due_date: '' })
      await loadTasks()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to assign task.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'

    try {
      const response = await api.patch(`/onboarding/${task.id}/status`, {
        status: nextStatus,
      })

      setTasks((current) =>
        current.map((item) => item.id === task.id ? response.data : item)
      )
      toast.success(
        nextStatus === 'COMPLETED' ? 'Task marked completed.' : 'Task reopened.'
      )
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to update task status.')
    }
  }

  const completedCount = tasks.filter((task) => task.status === 'COMPLETED').length
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <ClipboardList size={26} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Employee Onboarding
                </h1>
              </div>
              <p className="text-slate-600">
                Manage onboarding tasks and track completion progress.
              </p>
            </div>

            <button
              type="button"
              onClick={loadTasks}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Tasks</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{completedCount}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Overall Progress</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{progress}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {isManager && (
            <form
              onSubmit={handleCreate}
              className="mb-8 rounded-xl bg-white p-6 shadow-sm"
            >
              <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Plus size={21} />
                Assign Onboarding Task
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="employee_id" className="mb-2 block text-sm font-medium text-slate-700">
                    Employee
                  </label>
                  <select
                    id="employee_id"
                    name="employee_id"
                    required
                    value={form.employee_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name} (ID: {employee.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task_name" className="mb-2 block text-sm font-medium text-slate-700">
                    Task Name
                  </label>
                  <input
                    id="task_name"
                    name="task_name"
                    required
                    minLength={2}
                    maxLength={200}
                    value={form.task_name}
                    onChange={handleChange}
                    placeholder="e.g. Submit identity documents"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label htmlFor="due_date" className="mb-2 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>
                  <input
                    id="due_date"
                    name="due_date"
                    type="date"
                    required
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                <Plus size={18} />
                {saving ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>
          )}

          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">
                {isManager ? 'All Onboarding Tasks' : 'My Onboarding Checklist'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Mark tasks complete as you finish each onboarding activity.
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">Loading onboarding tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList className="mx-auto mb-3 text-slate-400" size={40} />
                <p className="font-medium text-slate-700">No onboarding tasks yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  {isManager
                    ? 'Assign a task using the form above.'
                    : 'Your onboarding checklist has not been assigned yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {isManager && <th className="px-6 py-4 font-semibold">Employee ID</th>}
                      <th className="px-6 py-4 font-semibold">Task</th>
                      <th className="px-6 py-4 font-semibold">Due Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50">
                        {isManager && (
                          <td className="px-6 py-4 text-slate-600">{task.employee_id}</td>
                        )}
                        <td className="px-6 py-4 font-medium text-slate-900">{task.task_name}</td>
                        <td className="px-6 py-4 text-slate-600">{task.due_date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {task.status === 'COMPLETED'
                              ? <CheckCircle2 size={14} />
                              : <Clock3 size={14} />}
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => toggleStatus(task)}
                            className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {task.status === 'COMPLETED' ? 'Reopen' : 'Mark Complete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

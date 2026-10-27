import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Plus, Search, Users, X, RotateCcw } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const initialForm = {
  user_id: '',
  full_name: '',
  designation: '',
  department: '',
  joining_date: '',
  salary: '',
  status: 'ACTIVE',
}

const initialFilters = {
  name: '',
  department: '',
  role: '',
  status: '',
  attendance_status: '',
  performance_rating: '',
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initialFilters)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  async function loadEmployees(activeFilters = initialFilters) {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== '')
      )
      const response = await api.get('/employees/search', { params })
      setEmployees(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load employees.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function updateFilter(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value })
  }

  async function createEmployee(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        user_id: Number(form.user_id),
        salary: Number(form.salary),
      }

      await api.post('/employees/', payload)
      toast.success('Employee created successfully.')
      setForm(initialForm)
      setShowForm(false)
      await loadEmployees(filters)
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Unable to create employee. Check the linked user ID.'
      )
    } finally {
      setSaving(false)
    }
  }

  function clearFilters() {
    setFilters(initialFilters)
    loadEmployees(initialFilters)
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
            <p className="mt-2 text-slate-600">
              Search and filter employee records by name, department, role, attendance, and performance.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>

        {showForm && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">New Employee</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter an existing user ID to link their login account to this employee profile.
            </p>

            <form onSubmit={createEmployee} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Linked User ID
                <input name="user_id" type="number" min="1" required value={form.user_id}
                  onChange={updateField} className={`${inputClass} mt-1`} placeholder="For example, 3" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Full Name
                <input name="full_name" required minLength="2" maxLength="100" value={form.full_name}
                  onChange={updateField} className={`${inputClass} mt-1`} placeholder="Employee full name" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Designation
                <input name="designation" required minLength="2" maxLength="100" value={form.designation}
                  onChange={updateField} className={`${inputClass} mt-1`} placeholder="Software Developer" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Department
                <input name="department" required minLength="2" maxLength="100" value={form.department}
                  onChange={updateField} className={`${inputClass} mt-1`} placeholder="Engineering" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Joining Date
                <input name="joining_date" type="date" required value={form.joining_date}
                  onChange={updateField} className={`${inputClass} mt-1`} />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Monthly Salary (₹)
                <input name="salary" type="number" min="0" step="0.01" required value={form.salary}
                  onChange={updateField} className={`${inputClass} mt-1`} placeholder="35000" />
              </label>

              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Status
                <select name="status" value={form.status} onChange={updateField}
                  className={`${inputClass} mt-1`}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Employee'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm(initialForm) }}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Advanced Search & Filters</h2>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); loadEmployees(filters) }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Search by name
              <input name="name" value={filters.name} onChange={updateFilter}
                placeholder="Enter employee name" className={`${inputClass} mt-1`} />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Department
              <input name="department" value={filters.department} onChange={updateFilter}
                placeholder="e.g. Engineering" className={`${inputClass} mt-1`} />
            </label>

            <label className="text-sm font-medium text-slate-700">
              User role
              <select name="role" value={filters.role} onChange={updateFilter} className={`${inputClass} mt-1`}>
                <option value="">All roles</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Employee status
              <select name="status" value={filters.status} onChange={updateFilter} className={`${inputClass} mt-1`}>
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Latest attendance
              <select name="attendance_status" value={filters.attendance_status}
                onChange={updateFilter} className={`${inputClass} mt-1`}>
                <option value="">All attendance</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half day</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Latest published performance rating
              <select name="performance_rating" value={filters.performance_rating}
                onChange={updateFilter} className={`${inputClass} mt-1`}>
                <option value="">All ratings</option>
                <option value="1">1 - Needs improvement</option>
                <option value="2">2 - Below expectations</option>
                <option value="3">3 - Meets expectations</option>
                <option value="4">4 - Exceeds expectations</option>
                <option value="5">5 - Outstanding</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-3">
              <button type="submit" disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {loading ? 'Searching...' : 'Apply Filters'}
              </button>
              <button type="button" onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
                <RotateCcw size={16} /> Clear Filters
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-900">Employee Results</h3>
            <span className="text-sm text-slate-500">{employees.length} result(s)</span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">Loading employees...</p>
          ) : employees.length === 0 ? (
            <div className="py-14 text-center">
              <Users size={36} className="mx-auto text-slate-400" />
              <p className="mt-3 font-medium text-slate-700">No matching employees found.</p>
              <p className="mt-1 text-sm text-slate-500">Try changing your search or clearing filters.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Designation</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Joining Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{employee.full_name}</td>
                      <td className="px-4 py-4 text-slate-600">{employee.designation}</td>
                      <td className="px-4 py-4 text-slate-600">{employee.department}</td>
                      <td className="px-4 py-4 text-slate-600">{employee.joining_date}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {employee.status}
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

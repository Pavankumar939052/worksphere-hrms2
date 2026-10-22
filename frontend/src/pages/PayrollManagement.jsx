import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Wallet, RefreshCw, PlusCircle } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const initialForm = {
  employee_id: '',
  month: '',
  basic_salary: '',
  bonus: '0',
  deductions: '0',
}

export default function PayrollManagement() {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  async function loadData() {
    setLoading(true)
    try {
      const [payrollResponse, employeeResponse] = await Promise.all([
        api.get('/payroll/'),
        api.get('/employees/'),
      ])
      setRecords(Array.isArray(payrollResponse.data) ? payrollResponse.data : [])
      setEmployees(Array.isArray(employeeResponse.data) ? employeeResponse.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load payroll or employee records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const basic = Number(form.basic_salary || 0)
  const bonus = Number(form.bonus || 0)
  const deductions = Number(form.deductions || 0)
  const netSalary = basic + bonus - deductions

  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0))

  async function createPayroll(event) {
    event.preventDefault()

    if (!form.employee_id || !form.month || form.basic_salary === '') {
      toast.error('Please complete all required fields.')
      return
    }

    if (netSalary < 0) {
      toast.error('Deductions cannot exceed basic salary plus bonus.')
      return
    }

    setSaving(true)
    try {
      await api.post('/payroll/', {
        employee_id: Number(form.employee_id),
        month: form.month,
        basic_salary: basic,
        bonus,
        deductions,
      })
      toast.success('Payroll record created successfully.')
      setForm(initialForm)
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to create payroll record.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll Management</h1>
            <p className="mt-2 text-slate-600">Create and review employee payroll records.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <PlusCircle size={21} /> Create Payroll Record
          </h2>
          <form onSubmit={createPayroll} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Employee</label>
              <select required className={inputClass} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} (ID: {employee.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Payroll Month</label>
              <input required type="month" className={inputClass} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Basic Salary (₹)</label>
              <input required min="0" step="0.01" type="number" className={inputClass} value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Bonus (₹)</label>
              <input min="0" step="0.01" type="number" className={inputClass} value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Deductions (₹)</label>
              <input min="0" step="0.01" type="number" className={inputClass} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </div>
            <div className="flex flex-col justify-end">
              <p className="mb-3 text-sm text-slate-500">Calculated net salary</p>
              <p className={'text-2xl font-bold ' + (netSalary < 0 ? 'text-red-600' : 'text-emerald-700')}>{money(netSalary)}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <button type="submit" disabled={saving || employees.length === 0} className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Payroll'}
              </button>
              {employees.length === 0 && <p className="mt-2 text-sm text-amber-700">No employee records found. Add an employee first.</p>}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900"><Wallet size={21} /> All Payroll Records</h2>
          </div>
          {loading ? (
            <p className="p-6 text-slate-500">Loading payroll records...</p>
          ) : records.length === 0 ? (
            <p className="p-6 text-slate-500">No payroll records created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-medium">Employee ID</th>
                    <th className="px-5 py-3 font-medium">Month</th>
                    <th className="px-5 py-3 font-medium">Basic Salary</th>
                    <th className="px-5 py-3 font-medium">Bonus</th>
                    <th className="px-5 py-3 font-medium">Deductions</th>
                    <th className="px-5 py-3 font-medium">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4">{record.employee_id}</td>
                      <td className="px-5 py-4">{record.month}</td>
                      <td className="px-5 py-4">{money(record.basic_salary)}</td>
                      <td className="px-5 py-4">{money(record.bonus)}</td>
                      <td className="px-5 py-4">{money(record.deductions)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">{money(record.net_salary)}</td>
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

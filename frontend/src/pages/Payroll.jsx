import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Wallet, RefreshCw, IndianRupee } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function Payroll() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadPayroll() {
    try {
      const response = await api.get('/payroll/my-history')
      setRecords(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load payroll history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [])

  const totalNetPay = records.reduce(
    (total, record) => total + Number(record.net_salary || 0),
    0
  )

  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0))

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll Management</h1>
            <p className="mt-2 text-slate-600">Review your salary and payroll history.</p>
          </div>
          <button
            onClick={loadPayroll}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payroll Records</p>
                <p className="text-2xl font-bold text-slate-900">{records.length}</p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <IndianRupee size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Net Pay (listed records)</p>
                <p className="text-2xl font-bold text-slate-900">{money(totalNetPay)}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">My Salary History</h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading payroll records...</p>
          ) : records.length === 0 ? (
            <p className="p-6 text-slate-500">No payroll records available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Month</th>
                    <th className="px-6 py-3 font-medium">Basic Salary</th>
                    <th className="px-6 py-3 font-medium">Bonus</th>
                    <th className="px-6 py-3 font-medium">Deductions</th>
                    <th className="px-6 py-3 font-medium">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 font-medium text-slate-900">{record.month}</td>
                      <td className="px-6 py-4">{money(record.basic_salary)}</td>
                      <td className="px-6 py-4">{money(record.bonus)}</td>
                      <td className="px-6 py-4">{money(record.deductions)}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{money(record.net_salary)}</td>
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

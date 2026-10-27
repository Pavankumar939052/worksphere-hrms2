import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

function StatCard({ label, value, detail }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 h-1.5 w-14 rounded-full bg-blue-500" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
      {detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}
    </section>
  )
}

function ReportSection({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-5 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

function ValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value ?? 0}</span>
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [payroll, setPayroll] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [leaves, setLeaves] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + '01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/performance'),
      api.get('/analytics/payroll'),
      api.get('/analytics/leaves'),
    ])
      .then(([overviewResponse, performanceResponse, payrollResponse, leavesResponse]) => {
        if (!active) return
        setOverview(overviewResponse.data)
        setPerformance(performanceResponse.data)
        setPayroll(payrollResponse.data)
        setLeaves(leavesResponse.data)
      })
      .catch((error) => {
        if (!active) return
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          navigate('/login')
        } else if (error.response?.status === 403) {
          toast.error('Analytics reports require an HR or Admin account.')
        } else {
          toast.error('Unable to load analytics. Check that the backend is running.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [navigate])

  async function downloadCsv(reportType) {
    try {
      const response = await api.get(`/analytics/export/${reportType}`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `worksphere_${reportType}_report.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`${reportType} CSV downloaded successfully.`)
    } catch (error) {
      toast.error(
        error.response?.status === 403
          ? 'CSV exports require an HR or Admin account.'
          : 'Unable to download CSV report.'
      )
    }
  }
  async function loadPayrollReport(event) {
    event.preventDefault()
    setReportLoading(true)
    try {
      const response = await api.get('/analytics/payroll', { params: { month } })
      setPayroll(response.data)
      toast.success('Payroll report loaded.')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load payroll report.')
    } finally {
      setReportLoading(false)
    }
  }

  async function loadAttendanceReport(event) {
    event.preventDefault()
    if (!startDate || !endDate || startDate > endDate) {
      toast.error('Choose a valid date range.')
      return
    }
    setReportLoading(true)
    try {
      const response = await api.get('/analytics/attendance', {
        params: { start_date: startDate, end_date: endDate },
      })
      setAttendance(response.data)
      toast.success('Attendance report loaded.')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load attendance report.')
    } finally {
      setReportLoading(false)
    }
  }

  function signOut() {
    localStorage.removeItem('access_token')
    navigate('/login')
    toast.success('Signed out successfully')
  }

  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0))

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
            <p className="mt-1 text-sm text-slate-500">
              HR insights, attendance, leave, payroll, and performance
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
          {loading ? (
            <p className="text-slate-600">Loading analytics reports...</p>
          ) : !overview ? (
            <ReportSection title="Analytics unavailable">
              <p className="text-slate-600">
                The reports could not be loaded. Check your HR/Admin permissions and try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </ReportSection>
          ) : (
            <>
              <div>
                <h3 className="mb-4 text-xl font-semibold text-slate-900">Workforce overview</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total Employees" value={overview.employees?.total} />
                  <StatCard label="Active Employees" value={overview.employees?.active} />
                  <StatCard label="Inactive Employees" value={overview.employees?.inactive} />
                  <StatCard label="Published Reviews" value={performance?.published_reviews} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ReportSection title="Today's attendance">
                  {Object.entries(overview.attendance_today || {}).map(([status, count]) => (
                    <ValueRow key={status} label={status.replaceAll('_', ' ')} value={count} />
                  ))}
                  <p className="mt-3 text-xs text-slate-500">As of {overview.as_of_date}</p>
                </ReportSection>

                <ReportSection title="Leave statistics">
                  {Object.entries(overview.leaves || {}).map(([status, count]) => (
                    <ValueRow key={status} label={status} value={count} />
                  ))}
                </ReportSection>

                <ReportSection title="Payroll summary">
                  <ValueRow label="Payroll records" value={payroll?.record_count} />
                  <ValueRow label="Basic salary total" value={money(payroll?.total_basic_salary)} />
                  <ValueRow label="Deductions" value={money(payroll?.total_deductions)} />
                  <ValueRow label="Bonus total" value={money(payroll?.total_bonus)} />
                  <ValueRow label="Net salary total" value={money(payroll?.total_net_salary)} />
                  <form onSubmit={loadPayrollReport} className="mt-5 flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Report month
                      <input
                        type="month"
                        value={month}
                        onChange={(event) => setMonth(event.target.value)}
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <button
                      disabled={reportLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {reportLoading ? 'Loading...' : 'Load payroll'}
                    </button>
                  </form>
                </ReportSection>

                <ReportSection title="Performance reviews">
                  <ValueRow label="Published reviews" value={performance?.published_reviews} />
                  <ValueRow label="Average rating" value={performance?.average_rating ?? 'N/A'} />
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Rating distribution</p>
                    {Object.entries(performance?.rating_distribution || {}).map(([rating, count]) => (
                      <ValueRow key={rating} label={`${rating} star${rating === '1' ? '' : 's'}`} value={count} />
                    ))}
                  </div>
                </ReportSection>
              </div>

              <ReportSection title="Downloadable CSV reports">
                <p className="mb-4 text-sm text-slate-600">
                  Download HR data as CSV files for use in Excel or other spreadsheet applications.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    ['employees', 'Employees'],
                    ['attendance', 'Attendance'],
                    ['leaves', 'Leave records'],
                    ['payroll', 'Payroll'],
                    ['performance', 'Performance reviews'],
                  ].map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => downloadCsv(type)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                    >
                      Download {label} CSV
                    </button>
                  ))}
                </div>
              </ReportSection>
              <ReportSection title="Attendance report">
                <form onSubmit={loadAttendanceReport} className="flex flex-wrap items-end gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Start date
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      required
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    End date
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <button
                    disabled={reportLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {reportLoading ? 'Loading...' : 'Load attendance'}
                  </button>
                </form>

                {attendance && (
                  <div className="mt-6">
                    <p className="mb-3 text-sm text-slate-500">
                      {attendance.start_date} to {attendance.end_date} · {attendance.total_records} records
                    </p>
                    {Object.entries(attendance.by_status || {}).map(([status, details]) => (
                      <ValueRow
                        key={status}
                        label={status}
                        value={`${details.count} records · ${details.overtime_hours} overtime hours`}
                      />
                    ))}
                  </div>
                )}
              </ReportSection>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

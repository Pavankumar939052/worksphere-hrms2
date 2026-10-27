import { useEffect, useState } from 'react'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-toastify'

const API_URL = 'http://127.0.0.1:8000'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [documentType, setDocumentType] = useState('ID Proof')
  const [expiryDate, setExpiryDate] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const token = localStorage.getItem('access_token')

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `Request failed (${response.status})`)
    }

    return response
  }

  async function loadDocuments() {
    setLoading(true)
    try {
      const response = await apiRequest('/documents/')
      setDocuments(await response.json())
    } catch (error) {
      toast.error(error.message || 'Could not load documents')
    } finally {
      setLoading(false)
    }
  }

  async function loadEmployees() {
    try {
      const response = await apiRequest('/employees/')
      const data = await response.json()
      setEmployees(Array.isArray(data) ? data : data.items || [])
    } catch {
      // Employees are only needed for HR/Admin upload controls.
    }
  }

  useEffect(() => {
    loadDocuments()
    loadEmployees()
  }, [])

  async function handleUpload(event) {
    event.preventDefault()

    if (!employeeId || !documentType.trim() || !file) {
      toast.error('Select an employee, enter a document type, and choose a file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('The maximum file size is 5 MB.')
      return
    }

    const formData = new FormData()
    formData.append('document_type', documentType.trim())
    if (expiryDate) formData.append('expiry_date', expiryDate)
    formData.append('file', file)

    setUploading(true)
    try {
      await apiRequest(`/documents/upload/${employeeId}`, {
        method: 'POST',
        body: formData,
      })
      toast.success('Document uploaded successfully.')
      setFile(null)
      setExpiryDate('')
      event.target.reset()
      await loadDocuments()
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(document) {
    try {
      const response = await apiRequest(`/documents/${document.id}/download`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.original_filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message || 'Download failed')
    }
  }

  async function handleDelete(document) {
    if (!window.confirm(`Delete "${document.original_filename}"?`)) return

    try {
      await apiRequest(`/documents/${document.id}`, { method: 'DELETE' })
      toast.success('Document deleted.')
      await loadDocuments()
    } catch (error) {
      toast.error(error.message || 'Delete failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Documents</h1>
            <p className="mt-1 text-slate-500">
              Securely manage employee files and expiry dates.
            </p>
          </div>
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Upload size={20} />
            Upload a document
          </h2>
          <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Employee
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name || employee.name || `Employee #${employee.id}`}
                    {' '}— #{employee.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Document type
              <input
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                maxLength={100}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
                placeholder="e.g. ID Proof, Contract"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Expiry date (optional)
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 p-3"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              File (PDF, PNG, JPG, DOC, DOCX; max 5 MB)
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload document'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <FileText size={20} />
              Stored documents ({documents.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="p-6 text-slate-500">No documents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-semibold">File</th>
                    <th className="px-6 py-3 font-semibold">Employee ID</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Uploaded</th>
                    <th className="px-6 py-3 font-semibold">Expiry</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {document.original_filename}
                      </td>
                      <td className="px-6 py-4">{document.employee_id}</td>
                      <td className="px-6 py-4">{document.document_type}</td>
                      <td className="px-6 py-4">
                        {document.uploaded_at
                          ? new Date(document.uploaded_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {document.expiry_date || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(document)}
                            title="Download"
                            aria-label={`Download ${document.original_filename}`}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(document)}
                            title="Delete"
                            aria-label={`Delete ${document.original_filename}`}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={18} />
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
      </div>
    </div>
  )
}

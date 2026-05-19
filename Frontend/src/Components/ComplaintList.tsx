import { useEffect, useState } from 'react'

type Complaint = {
  _id: string
  name: string
  email: string
  title: string
  description: string
  category: string
  location: string
  status: string
  createdAt?: string
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'pending')     return 'badge-pending'
  if (s === 'in progress') return 'badge-progress'
  if (s === 'resolved')    return 'badge-resolved'
  if (s === 'rejected')    return 'badge-rejected'
  return 'badge-pending'
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)   return 'Just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  return Math.floor(diff / 86400) + 'd ago'
}

export default function ComplaintList({ onEdit }: { onEdit?: (id: string) => void }) {
  const [items, setItems] = useState<Complaint[]>([])
  const [filter, setFilter] = useState('')
  const [loc, setLoc] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = 'Bearer ' + token
      const res = await fetch(API_BASE + '/api/complaints', { headers })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function deleteComplaint(id: string) {
    setDeletingId(id)
    try {
      const token = localStorage.getItem('token')
      await fetch(API_BASE + '/api/complaints/' + id, {
        method: 'DELETE',
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      })
      setItems(prev => prev.filter(i => i._id !== id))
    } finally { setDeletingId(null) }
  }

  const shown = items.filter(i =>
    (!filter || i.category?.toLowerCase().includes(filter.toLowerCase())) &&
    (!loc || i.location?.toLowerCase().includes(loc.toLowerCase())) &&
    (!statusFilter || i.status?.toLowerCase() === statusFilter.toLowerCase())
  )

  // Stats
  const total     = items.length
  const pending   = items.filter(i => i.status?.toLowerCase() === 'pending').length
  const progress  = items.filter(i => i.status?.toLowerCase() === 'in progress').length
  const resolved  = items.filter(i => i.status?.toLowerCase() === 'resolved').length

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 Complaint Dashboard</h1>
        <p className="page-subtitle">View, search, and manage all registered complaints.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '📊', label: 'Total',       value: total,    color: 'var(--accent-2)' },
          { icon: '⏳', label: 'Pending',     value: pending,  color: 'var(--amber)' },
          { icon: '🔄', label: 'In Progress', value: progress, color: 'var(--teal)' },
          { icon: '✅', label: 'Resolved',    value: resolved, color: 'var(--emerald)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Filter by category..."
            value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="search-input-wrap">
          <span className="search-icon">📍</span>
          <input className="form-input" placeholder="Search by location..."
            value={loc} onChange={e => setLoc(e.target.value)} />
        </div>
        <select className="form-select" style={{ minWidth: 140 }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? <span className="spinner" /> : '↻'} Refresh
        </button>
      </div>

      {/* Complaint list */}
      {loading ? (
        <div className="empty-state">
          <div style={{ fontSize: 36, marginBottom: 12 }}><span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>
          <p>Loading complaints...</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>{items.length === 0 ? 'No complaints registered yet.' : 'Try adjusting your filters.'}</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {shown.map((c, idx) => (
            <div key={c._id} className="complaint-card" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div className="complaint-card-header">
                <div>
                  <div className="complaint-title">{c.title}</div>
                  <div className="complaint-meta">
                    <span>👤 {c.name}</span>
                    <span>✉️ {c.email}</span>
                    {c.location && <span>📍 {c.location}</span>}
                    {c.createdAt && <span>🕐 {timeAgo(c.createdAt)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                  {c.category && <span className="chip">{c.category}</span>}
                </div>
              </div>

              <p className="complaint-desc">{c.description}</p>

              <div className="complaint-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => onEdit && onEdit(c._id)}>
                  ✏️ Update Status
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={deletingId === c._id}
                  onClick={() => deleteComplaint(c._id)}
                >
                  {deletingId === c._id ? <span className="spinner" /> : '🗑️'} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

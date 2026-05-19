import React, { useEffect, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected']

const STATUS_META: Record<string, { icon: string; desc: string; cls: string }> = {
  Pending:     { icon: '⏳', desc: 'Complaint received, awaiting review.', cls: 'badge-pending' },
  'In Progress': { icon: '🔄', desc: 'Complaint is being actively worked on.', cls: 'badge-progress' },
  Resolved:    { icon: '✅', desc: 'Issue has been fully resolved.', cls: 'badge-resolved' },
  Rejected:    { icon: '❌', desc: 'Complaint was rejected or is invalid.', cls: 'badge-rejected' },
}

export default function StatusUpdate({ id, onDone }: { id: string; onDone?: () => void }) {
  const [status, setStatus]   = useState('Pending')
  const [complaint, setComplaint] = useState<any | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('token')
        if (token) headers['Authorization'] = 'Bearer ' + token
        const res = await fetch(API_BASE + '/api/complaints/' + id, { headers })
        if (res.ok) {
          const data = await res.json()
          setComplaint(data)
          setStatus(data.status ?? 'Pending')
        }
      } catch {}
    })()
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitStatus('loading')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = 'Bearer ' + token
      const res = await fetch(API_BASE + '/api/complaints/' + id, {
        method: 'PUT', headers, body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error(await res.text())
      setSubmitStatus('success')
      setMessage('Status updated successfully!')
      setTimeout(() => onDone && onDone(), 1200)
    } catch (err: any) {
      setSubmitStatus('error')
      setMessage('Error: ' + (err.message || String(err)))
    }
  }

  const meta = STATUS_META[status] || STATUS_META['Pending']

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">✏️ Update Complaint Status</h1>
        <p className="page-subtitle">Change the resolution status for this complaint.</p>
      </div>

      {/* Complaint preview */}
      {complaint && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{complaint.title}</h3>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {complaint.name} · {complaint.email}
                {complaint.location ? ` · 📍 ${complaint.location}` : ''}
              </div>
            </div>
            <span className={`badge badge-${(complaint.status || 'pending').toLowerCase().replace(' ', '-').replace('in-progress', 'progress')}`}>
              {complaint.status}
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65 }}>{complaint.description}</p>
        </div>
      )}

      {/* Status form */}
      <div className="card">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>Select New Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {STATUSES.map(s => {
                const m = STATUS_META[s]
                const isActive = status === s
                return (
                  <button
                    key={s} type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '14px 16px', borderRadius: 10,
                      border: `1px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                      background: isActive ? 'var(--accent-bg)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? 'var(--accent-2)' : 'var(--text-h)' }}>{s}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{m.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>New status will be:</span>
            <span className={`badge ${meta.cls}`}>{status}</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={submitStatus === 'loading'}>
              {submitStatus === 'loading' ? <><span className="spinner" /> Saving...</> : '💾 Save Status'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
          </div>
        </form>

        {submitStatus !== 'idle' && (
          <div className={`alert ${submitStatus === 'success' ? 'alert-success' : submitStatus === 'error' ? 'alert-error' : 'alert-loading'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

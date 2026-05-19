import React, { useState } from 'react'

type FormState = {
  name: string
  email: string
  title: string
  description: string
  category: string
  location: string
}

const CATEGORIES = [
  'Water Supply', 'Electricity', 'Sanitation', 'Roads & Infrastructure',
  'Public Safety', 'Noise Complaint', 'Garbage Collection', 'Other'
]

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', title: '', description: '', category: '', location: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [aiResult, setAiResult] = useState<any | null>(null)

  const handle = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading'); setAiResult(null)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = 'Bearer ' + token

      const res = await fetch(API_BASE + '/api/complaints', {
        method: 'POST', headers, body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(await res.text())

      setStatus('success')
      setMessage('✅ Complaint submitted successfully!')

      // Auto-analyze with AI
      try {
        const aiRes = await fetch(API_BASE + '/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `${form.title}. ${form.description}. Category: ${form.category}. Location: ${form.location}.` })
        })
        const aiData = await aiRes.json()
        const result = aiData.result || aiData.fallback
        if (result) setAiResult(result)
      } catch { /* AI analysis optional */ }

      setForm({ name:'', email:'', title:'', description:'', category:'', location:'' })
    } catch (err: any) {
      setStatus('error')
      setMessage('Error: ' + (err.message ?? String(err)))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📝 Register a Complaint</h1>
        <p className="page-subtitle">Fill in the details below. Your complaint will be automatically analyzed by AI.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: aiResult ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name *</label>
                <input id="reg-name" className="form-input" placeholder="e.g. Rahul Kumar"
                  value={form.name} onChange={handle('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address *</label>
                <input id="reg-email" className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handle('email')} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-title">Complaint Title *</label>
              <input id="reg-title" className="form-input" placeholder="Brief summary of the issue"
                value={form.title} onChange={handle('title')} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-desc">Description *</label>
              <textarea id="reg-desc" className="form-textarea"
                placeholder="Describe the issue in detail — the more detail, the better the AI analysis..."
                value={form.description} onChange={handle('description')} rows={5} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-category">Category</label>
                <select id="reg-category" className="form-select" value={form.category} onChange={handle('category')}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-location">Location</label>
                <input id="reg-location" className="form-input" placeholder="e.g. Ghaziabad, Sector 5"
                  value={form.location} onChange={handle('location')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? <><span className="spinner" /> Submitting...</> : '🚀 Submit Complaint'}
              </button>
              <button type="button" className="btn btn-ghost"
                onClick={() => { setForm({ name:'',email:'',title:'',description:'',category:'',location:'' }); setStatus('idle'); setAiResult(null) }}>
                Reset
              </button>
            </div>
          </form>

          {status !== 'idle' && (
            <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-error' : 'alert-loading'}`}>
              {message}
            </div>
          )}
        </div>

        {/* AI Result panel (shown after submission) */}
        {aiResult && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 18, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🤖 AI Analysis Result
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>⚡ Priority</span>
                  <span className={`badge badge-${(aiResult.priority || 'low').toLowerCase()}`}>
                    {aiResult.priority || 'Low'}
                  </span>
                </div>

                {/* Department */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>🏢 Department</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>{aiResult.department || '—'}</span>
                </div>

                {/* Summary */}
                {aiResult.summary && (
                  <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, marginBottom: 6 }}>📄 Summary</div>
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{aiResult.summary}</p>
                  </div>
                )}

                {/* Auto-response */}
                {aiResult.autoResponse && (
                  <div className="ai-auto-response">
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, opacity: 0.8 }}>
                      💬 Auto-Response to User
                    </div>
                    <p style={{ lineHeight: 1.65, margin: 0 }}>{aiResult.autoResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
